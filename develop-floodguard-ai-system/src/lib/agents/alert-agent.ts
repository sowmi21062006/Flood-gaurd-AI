/**
 * Multilingual Emergency Alert Agent
 * Generates emergency alerts in multiple languages
 */

import { adminDb } from '@/lib/firebase/admin';
import { generateAIResponse } from '@/services/groq';
import { sendTwilioSMS, makeTwilioVoiceCall } from '@/services/twilio';
import { sendPushNotification } from '@/services/fcm';

interface AlertContent {
  title: string;
  message: string;
  language: string;
}

interface EmergencyAlert {
  alertId: string;
  alerts: AlertContent[];
  severity: 'info' | 'warning' | 'critical';
  targetDistricts: string[];
}

export class MultilingualEmergencyAlertAgent {
  private agentName = 'multilingual_alert';

  // Supported languages
  private languages = ['english', 'tamil', 'hindi', 'kannada', 'telugu', 'malayalam'];

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
   * Generate alert message using Groq AI
   */
  private async generateAlertMessage(
    severity: 'info' | 'warning' | 'critical',
    floodData: {
      riskScore: number;
      predictedTime?: Date | null;
      affectedAreas: string[];
    },
    language: string
  ): Promise<AlertContent> {
    try {
      const languageNames: { [key: string]: string } = {
        english: 'English',
        tamil: 'Tamil',
        hindi: 'Hindi',
        kannada: 'Kannada',
        telugu: 'Telugu',
        malayalam: 'Malayalam',
      };

      const systemPrompt = `You are an emergency alert system generating ${languageNames[language]} flood warnings. Generate clear, urgent, and actionable emergency messages.`;

      const userPrompt = `Generate a ${severity.toUpperCase()} flood alert in ${languageNames[language]}.

Flood Details:
- Risk Score: ${floodData.riskScore.toFixed(1)}/100
${floodData.predictedTime ? `- Expected Overflow: ${floodData.predictedTime.toLocaleString()}` : ''}
- Affected Areas: ${floodData.affectedAreas.join(', ')}

Generate:
1. A brief title (max 10 words)
2. An urgent message (max 100 words) with clear instructions:
   - What is happening
   - Who is affected
   - What to do immediately
   - Where to evacuate if needed

Format as JSON:
{
  "title": "...",
  "message": "..."
}

Use native ${languageNames[language]} script and language.`;

      const response = await generateAIResponse({
        systemPrompt,
        userPrompt,
        jsonMode: true,
        maxTokens: 500,
        useCache: true, // We can safely cache identical alerts
      });

      const parsed = JSON.parse(response);
      return {
        title: parsed.title || `${severity.toUpperCase()} FLOOD ALERT`,
        message: parsed.message || 'Flood warning issued. Please evacuate to higher ground.',
        language,
      };
    } catch (error) {
      console.error(`Error generating ${language} alert:`, error);
      
      // Fallback messages
      const fallbacks: { [key: string]: AlertContent } = {
        english: {
          title: `${severity.toUpperCase()} FLOOD ALERT`,
          message: `Severe flood warning! Risk score: ${floodData.riskScore.toFixed(0)}%. Evacuate immediately to nearest shelter. Follow official instructions. Stay safe.`,
          language: 'english',
        },
        tamil: {
          title: 'வெள்ள அபாய எச்சரிக்கை',
          message: `கடுமையான வெள்ள எச்சரிக்கை! ஆபத்து மதிப்பீடு: ${floodData.riskScore.toFixed(0)}%. உடனடியாக அருகிலுள்ள தங்குமிடத்திற்கு செல்லவும். அதிகாரப்பூர்வ வழிமுறைகளைப் பின்பற்றவும். பாதுகாப்பாக இருங்கள்.`,
          language: 'tamil',
        },
        hindi: {
          title: 'बाढ़ चेतावनी',
          message: `गंभीर बाढ़ की चेतावनी! जोखिम स्कोर: ${floodData.riskScore.toFixed(0)}%। तुरंत निकटतम आश्रय स्थल पर जाएं। आधिकारिक निर्देशों का पालन करें। सुरक्षित रहें।`,
          language: 'hindi',
        },
        kannada: {
          title: 'ಪ್ರವಾಹ ಎಚ್ಚರಿಕೆ',
          message: `ತೀವ್ರ ಪ್ರವಾಹ ಎಚ್ಚರಿಕೆ! ಅಪಾಯ ಅಂಕ: ${floodData.riskScore.toFixed(0)}%. ತಕ್ಷಣ ಹತ್ತಿರದ ಆಶ್ರಯಕ್ಕೆ ಹೋಗಿ. ಅಧಿಕೃತ ಸೂಚನೆಗಳನ್ನು ಅನುಸರಿಸಿ. ಸುರಕ್ಷಿತವಾಗಿರಿ.`,
          language: 'kannada',
        },
        telugu: {
          title: 'వరద హెచ్చరిక',
          message: `తీవ్ర వరద హెచ్చరిక! ప్రమాద స్కోరు: ${floodData.riskScore.toFixed(0)}%. వెంటనే సమీప ఆశ్రయానికి వెళ్లండి. అధికారిక సూచనలను అనుసరించండి. సురక్షితంగా ఉండండి.`,
          language: 'telugu',
        },
        malayalam: {
          title: 'വെള്ളപ്പൊക്ക മുന്നറിയിപ്പ്',
          message: `കടുത്ത വെള്ളപ്പൊക്ക മുന്നറിയിപ്പ്! അപകട സ്കോർ: ${floodData.riskScore.toFixed(0)}%. ഉടൻ അടുത്തുള്ള അഭയകേന്ദ്രത്തിലേക്ക് പോകുക. ഔദ്യോഗിക നിർദ്ദേശങ്ങൾ പാലിക്കുക. സുരക്ഷിതരായിരിക്കുക.`,
          language: 'malayalam',
        },
      };

      return fallbacks[language] || fallbacks['english'];
    }
  }

  /**
   * Generate alerts in all supported languages
   */
  async generateMultilingualAlerts(
    severity: 'info' | 'warning' | 'critical',
    floodData: {
      riskScore: number;
      predictedTime?: Date | null;
      affectedAreas: string[];
    },
    predictionId?: string
  ): Promise<EmergencyAlert> {
    const startTime = Date.now();

    try {
      await this.logActivity('generate_alerts', 'running', { severity, floodData }, {});

      const alertPromises = this.languages.map((lang) =>
        this.generateAlertMessage(severity, floodData, lang)
      );

      const generatedAlerts = await Promise.all(alertPromises);

      const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Save alerts to database (one per language)
      for (const alert of generatedAlerts) {
        await adminDb.collection('alerts').add({
          alertId: `${alertId}_${alert.language}`,
          title: alert.title,
          message: alert.message,
          severity,
          language: alert.language,
          status: 'pending',
          targetDistricts: floodData.affectedAreas,
          predictionId: predictionId || null,
          createdAt: new Date().toISOString(),
        });
      }

      const result: EmergencyAlert = {
        alertId,
        alerts: generatedAlerts,
        severity,
        targetDistricts: floodData.affectedAreas,
      };

      const executionTime = Date.now() - startTime;
      await this.logActivity('generate_alerts', 'completed', { severity, floodData }, result, undefined, executionTime);

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logActivity('generate_alerts', 'failed', { severity, floodData }, {}, errorMessage, executionTime);
      throw error;
    }
  }

  /**
   * Approve and broadcast alert
   */
  async approveAndBroadcast(alertId: string, approvedBy: string): Promise<{
    success: boolean;
    deliveryStats: {
      sms: number;
      push: number;
      voice: number;
    };
  }> {
    const startTime = Date.now();

    try {
      const snapshot = await adminDb.collection('alerts')
        .where('alertId', '>=', alertId)
        .where('alertId', '<=', alertId + '\uf8ff')
        .get();
        
      const batch = adminDb.batch();
      snapshot.docs.forEach((doc: any) => {
        batch.update(doc.ref, {
          status: 'approved',
          approvedBy,
          approvedAt: new Date().toISOString(),
        });
      });
      await batch.commit();

      // Trigger multi-channel broadcast (Twilio & FCM)
      const alertData = snapshot.docs[0].data();
      const deliveryStats = await this.simulateBroadcast(alertId, alertData);

      const batch2 = adminDb.batch();
      snapshot.docs.forEach((doc: any) => {
        batch2.update(doc.ref, {
          status: 'sent',
          deliveryStats,
        });
      });
      await batch2.commit();

      const executionTime = Date.now() - startTime;
      await this.logActivity('approve_broadcast', 'completed', { alertId, approvedBy }, { deliveryStats }, undefined, executionTime);

      return {
        success: true,
        deliveryStats,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logActivity('approve_broadcast', 'failed', { alertId, approvedBy }, {}, errorMessage, executionTime);
      throw error;
    }
  }

  /**
   * Broadcast alert via Twilio and FCM Simulation
   */
  private async simulateBroadcast(alertId: string, alertDoc: any): Promise<{
    sms: number;
    push: number;
    voice: number;
  }> {
    const usersSnap = await adminDb.collection('users').get();
    let smsCount = 0;
    let pushCount = 0;
    let voiceCount = 0;

    const title = alertDoc.title || 'EMERGENCY FLOOD ALERT';
    const body = alertDoc.message || 'Severe flood risk detected.';

    for (const doc of usersSnap.docs) {
      const user = doc.data();
      const phone = user.phone || '+1234567890';
      const uid = doc.id;

      // Simulate sending SMS via Twilio
      await sendTwilioSMS(phone, body);
      smsCount++;

      // Simulate sending Push via FCM
      await sendPushNotification(title, body, undefined, uid);
      pushCount++;

      // Send voice to vulnerable users (e.g., elderly flag if exists)
      if (user.vulnerable || Math.random() > 0.8) {
        await makeTwilioVoiceCall(phone, body);
        voiceCount++;
      }
    }

    return {
      sms: smsCount,
      push: pushCount,
      voice: voiceCount,
    };
  }

  /**
   * Generate evacuation advice
   */
  async generateEvacuationAdvice(
    userLocation: { lat: number; lon: number },
    nearestShelter: { name: string; distance: number },
    language: string = 'english'
  ): Promise<string> {
    try {
      const response = await generateAIResponse({
        systemPrompt: `You are an emergency response AI providing evacuation guidance in ${language}.`,
        userPrompt: `Generate brief evacuation instructions in ${language}:
- Nearest shelter: ${nearestShelter.name}
- Distance: ${nearestShelter.distance.toFixed(2)} km
- Current location: ${userLocation.lat.toFixed(4)}, ${userLocation.lon.toFixed(4)}

Provide 3-4 sentences with clear, actionable steps.`,
        maxTokens: 200,
        useCache: true,
      });

      return response;
    } catch (error) {
      console.error('Error generating evacuation advice:', error);
      return 'Evacuate to nearest shelter immediately. Follow official instructions.';
    }
  }
}
