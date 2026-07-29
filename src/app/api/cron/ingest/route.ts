import { NextResponse } from 'next/server';
import { fetchLiveWeather } from '@/services/weather';
import { fetchRiverGaugeData } from '@/services/river-gauge';
import { HydrologicalRadarAgent } from '@/lib/agents/hydrological-agent';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    console.log('[CRON] Starting real-time data ingestion cycle...');
    const startTime = Date.now();

    // 1. Fetch Real-time data (Mocked)
    // We simulate fetching for multiple regions/sensors.
    const weather = await fetchLiveWeather(12.9716, 77.5946);
    const river1 = await fetchRiverGaugeData('sensor-001', 'North Basin');
    const river2 = await fetchRiverGaugeData('sensor-002', 'South Basin');

    // 2. Trigger Hydrological ML Prediction
    const hydroAgent = new HydrologicalRadarAgent();
    // Simulate reading the latest data from DB (which the agent does internally)
    // But since the agent reads the most recent we just let it run
    const predictionData = await hydroAgent.predict();

    // 3. Update active flood zones if prediction is critical
    if (predictionData && predictionData.riskScore > 60) {
      // Simulate road blockages 
      const roads = ['Main Highway', 'Downtown Underpass', 'River Road'];
      const blockedRoad = roads[Math.floor(Math.random() * roads.length)];
      
      const floodedRoadRef = adminDb.collection('flooded_roads').doc(blockedRoad.replace(/\s+/g, '').toLowerCase());
      await floodedRoadRef.set({
        roadName: blockedRoad,
        status: predictionData.riskScore > 80 ? 'blocked' : 'warning',
        severity: predictionData.severity,
        coordinates: [
          [12.96 + (Math.random() * 0.02 - 0.01), 77.59 + (Math.random() * 0.02 - 0.01)],
          [12.97 + (Math.random() * 0.02 - 0.01), 77.58 + (Math.random() * 0.02 - 0.01)],
        ],
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    // Return the summary
    return NextResponse.json({
      success: true,
      message: 'Ingestion and prediction cycle completed successfully',
      data: {
        weather,
        sensors: [river1, river2],
        prediction: predictionData ? {
          riskScore: predictionData.riskScore,
          severity: predictionData.severity,
          probability: predictionData.floodProbability
        } : null
      },
      executionTimeMs: Date.now() - startTime
    });
  } catch (error: any) {
    console.error('[CRON] Error during ingestion cycle:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
