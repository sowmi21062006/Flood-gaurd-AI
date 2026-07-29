import { adminDb } from '@/lib/firebase/admin';

/**
 * Twilio Mock Service
 * Simulates sending SMS and making Voice calls via Twilio API
 */
export async function sendTwilioSMS(to: string, body: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (accountSid && authToken && accountSid !== 'demo') {
    // Production Twilio SDK implementation
    // const client = require('twilio')(accountSid, authToken);
    // await client.messages.create({ body, from: '+1234567890', to });
  }

  // Simulation Mode
  console.log(`[TWILIO SIMULATION] SMS to ${to}: ${body}`);
  
  await adminDb.collection('notification_logs').add({
    type: 'sms',
    to,
    body,
    status: 'sent',
    timestamp: new Date().toISOString(),
  });

  return { success: true, messageId: `SM${Date.now()}` };
}

export async function makeTwilioVoiceCall(to: string, message: string) {
  console.log(`[TWILIO SIMULATION] Voice Call to ${to}: ${message}`);
  
  await adminDb.collection('notification_logs').add({
    type: 'voice',
    to,
    body: message,
    status: 'completed',
    timestamp: new Date().toISOString(),
  });

  return { success: true, callId: `CA${Date.now()}` };
}
