import { adminDb, adminAuth } from '@/lib/firebase/admin';

/**
 * FCM Mock Service
 * Simulates sending Push Notifications to mobile/web clients via Firebase Cloud Messaging
 */
export async function sendPushNotification(title: string, body: string, topic?: string, targetUserId?: string) {
  // Production behavior:
  // await admin.messaging().send({ topic, notification: { title, body } });

  console.log(`[FCM SIMULATION] Push to ${topic || targetUserId}: ${title} - ${body}`);
  
  await adminDb.collection('notification_logs').add({
    type: 'push',
    title,
    body,
    topic: topic || null,
    targetUserId: targetUserId || null,
    status: 'sent',
    timestamp: new Date().toISOString(),
  });

  return { success: true, messageId: `FCM${Date.now()}` };
}
