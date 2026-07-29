/**
 * Hydrological Radar Agent
 * Predicts flood probability based on environmental sensor data
 */

import { adminDb } from '@/lib/firebase/admin';
import { generateAIResponse } from '@/services/groq';

interface SensorReadings {
  riverLevel: number;
  rainfall: number;
  humidity?: number;
  temperature?: number;
  windSpeed?: number;
}

interface FloodPredictionResult {
  riskScore: number;
  floodProbability: number;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  confidence: number;
  predictedOverflowTime: Date | null;
  explanation: string;
}

export class HydrologicalRadarAgent {
  private agentName = 'hydrological_radar';

  constructor() {}

  /**
   * Log agent activity
   */
  private async logActivity(action: string, status: string, input: any, output: any, errorMessage?: string, executionTime?: number) {
    const data: any = {
      agent: this.agentName,
      action,
      status,
      input,
      output,
      timestamp: new Date().toISOString(),
    };
    if (errorMessage !== undefined) data.errorMessage = errorMessage;
    if (executionTime !== undefined) data.executionTime = executionTime;
    
    await adminDb.collection('agent_logs').add(data);
  }

  /**
   * Get latest sensor readings
   */
  private async getLatestSensorReadings(): Promise<SensorReadings> {
    const readings: SensorReadings = {
      riverLevel: 0,
      rainfall: 0,
      humidity: 0,
      temperature: 0,
      windSpeed: 0,
    };

    const getLatestSensor = async (type: string) => {
      const snap = await adminDb.collection('sensor_data')
        .where('sensorType', '==', type)
        .get();
      if (snap.empty) return null;
      
      const sortedDocs = snap.docs.sort((a: any, b: any) => {
        const t1 = new Date(a.data().timestamp || 0).getTime();
        const t2 = new Date(b.data().timestamp || 0).getTime();
        return t2 - t1;
      });
      return sortedDocs[0].data();
    };

    const riverData = await getLatestSensor('river_level');
    if (riverData) readings.riverLevel = riverData.value;

    const humidityData = await getLatestSensor('humidity');
    if (humidityData) readings.humidity = humidityData.value;

    const tempData = await getLatestSensor('temperature');
    if (tempData) readings.temperature = tempData.value;

    const windData = await getLatestSensor('wind_speed');
    if (windData) readings.windSpeed = windData.value;

    // Get latest rainfall (sum of last hour)
    const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
    const rainfallSnap = await adminDb.collection('sensor_data')
      .where('sensorType', '==', 'rainfall')
      .get();
    
    let rainfallTotal = 0;
    rainfallSnap.forEach((doc: any) => {
      const data = doc.data();
      if (data.timestamp > oneHourAgo) {
        rainfallTotal += data.value || 0;
      }
    });
    readings.rainfall = rainfallTotal;

    return readings;
  }

  /**
   * Calculate flood risk using ML-based approach
   * This simulates a trained XGBoost/LSTM model
   */
  private calculateFloodRisk(readings: SensorReadings): {
    riskScore: number;
    floodProbability: number;
    severity: 'low' | 'moderate' | 'high' | 'critical';
    confidence: number;
  } {
    // Critical thresholds
    const CRITICAL_RIVER_LEVEL = 5.0; // meters
    const WARNING_RIVER_LEVEL = 3.5;
    const CRITICAL_RAINFALL = 50; // mm/hour
    const WARNING_RAINFALL = 30;

    // Calculate risk components
    const riverRisk = Math.min(readings.riverLevel / CRITICAL_RIVER_LEVEL, 1.0);
    const rainfallRisk = Math.min(readings.rainfall / CRITICAL_RAINFALL, 1.0);

    // Combined risk score (weighted)
    const riskScore = (riverRisk * 0.6 + rainfallRisk * 0.4) * 100;

    // Calculate flood probability using sigmoid-like function
    const floodProbability = 1 / (1 + Math.exp(-0.1 * (riskScore - 50)));

    // Determine severity
    let severity: 'low' | 'moderate' | 'high' | 'critical';
    if (riskScore >= 75) severity = 'critical';
    else if (riskScore >= 50) severity = 'high';
    else if (riskScore >= 25) severity = 'moderate';
    else severity = 'low';

    // Calculate confidence based on data completeness
    const dataCompleteness = [
      readings.riverLevel,
      readings.rainfall,
      readings.humidity,
      readings.temperature,
      readings.windSpeed,
    ].filter((v) => v !== undefined && v !== 0).length / 5;

    const confidence = 0.7 + dataCompleteness * 0.3;

    return { riskScore, floodProbability, severity, confidence };
  }

  /**
   * Predict overflow time based on current trend
   */
  private async predictOverflowTime(readings: SensorReadings, riskScore: number): Promise<Date | null> {
    if (riskScore < 50) return null;

    // Get river level trend from last 3 hours
    const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    const trendSnap = await adminDb.collection('sensor_data')
      .where('sensorType', '==', 'river_level')
      .get();
      
    const trendData = trendSnap.docs
      .map((doc: any) => doc.data())
      .filter((data: any) => data.timestamp > threeHoursAgo)
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    if (trendData.length < 2) {
      // If no trend data, estimate based on current risk
      const hoursToOverflow = (100 - riskScore) / 10;
      return new Date(Date.now() + hoursToOverflow * 60 * 60 * 1000);
    }

    // Calculate rate of rise
    const latest = trendData[0];
    const oldest = trendData[trendData.length - 1];
    const timeDiff = (new Date(latest.timestamp).getTime() - new Date(oldest.timestamp).getTime()) / 1000 / 60 / 60; // hours
    const levelDiff = latest.value - oldest.value;
    const rateOfRise = levelDiff / timeDiff; // meters per hour

    if (rateOfRise <= 0) return null;

    // Estimate time to critical level (5.0m)
    const currentLevel = readings.riverLevel;
    const criticalLevel = 5.0;
    const remainingRise = criticalLevel - currentLevel;
    const hoursToOverflow = remainingRise / rateOfRise;

    if (hoursToOverflow > 0 && hoursToOverflow < 48) {
      return new Date(Date.now() + hoursToOverflow * 60 * 60 * 1000);
    }

    return null;
  }

  /**
   * Generate AI explanation using Groq
   */
  private async generateExplanation(readings: SensorReadings, prediction: any): Promise<string> {
    try {
      const systemPrompt = `You are a hydrological expert AI analyzing flood risk. Provide clear, concise explanations for emergency response teams.`;
      
      const userPrompt = `Based on the following sensor data, explain the flood risk assessment:
            
River Level: ${readings.riverLevel}m
Rainfall (last hour): ${readings.rainfall}mm
Humidity: ${readings.humidity}%
Temperature: ${readings.temperature}°C
Wind Speed: ${readings.windSpeed} km/h

Risk Score: ${prediction.riskScore.toFixed(1)}
Flood Probability: ${(prediction.floodProbability * 100).toFixed(1)}%
Severity: ${prediction.severity}
Confidence: ${(prediction.confidence * 100).toFixed(1)}%

Provide a 2-3 sentence explanation of the current flood risk and recommended actions.`;

      const response = await generateAIResponse({
        systemPrompt,
        userPrompt,
        maxTokens: 200,
        useCache: false // Always generate fresh explanation for predictions
      });

      return response;
    } catch (error) {
      console.error('Error generating explanation:', error);
      return 'Flood risk assessment completed. Review sensor data for details.';
    }
  }

  /**
   * Main prediction method
   */
  async predict(): Promise<FloodPredictionResult> {
    const startTime = Date.now();

    try {
      await this.logActivity('predict_flood', 'running', {}, {});

      // Get sensor readings
      const readings = await this.getLatestSensorReadings();

      // Calculate risk
      const prediction = this.calculateFloodRisk(readings);

      // Predict overflow time
      const predictedOverflowTime = await this.predictOverflowTime(readings, prediction.riskScore);

      // Generate AI explanation
      const explanation = await this.generateExplanation(readings, prediction);

      // Save prediction to database
      const predictionId = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await adminDb.collection('flood_predictions').add({
        predictionId,
        riverLevel: readings.riverLevel,
        rainfall: readings.rainfall,
        humidity: readings.humidity,
        temperature: readings.temperature,
        windSpeed: readings.windSpeed,
        riskScore: prediction.riskScore,
        floodProbability: prediction.floodProbability,
        severity: prediction.severity,
        confidence: prediction.confidence,
        predictedOverflowTime: predictedOverflowTime?.toISOString() || null,
        predictedBy: this.agentName,
        createdAt: new Date().toISOString()
      });

      const result: FloodPredictionResult = {
        ...prediction,
        predictedOverflowTime,
        explanation,
      };

      const executionTime = Date.now() - startTime;
      await this.logActivity('predict_flood', 'completed', readings, result, undefined, executionTime);

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logActivity('predict_flood', 'failed', {}, {}, errorMessage, executionTime);
      throw error;
    }
  }
}
