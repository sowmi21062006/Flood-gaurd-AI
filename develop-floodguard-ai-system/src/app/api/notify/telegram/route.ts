import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, chatIds } = body;
    
    if (!message) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token || token === "demo") {
      console.warn("TELEGRAM_BOT_TOKEN is not configured or in demo mode. Simulating notifications.");
      
      // Attempt logging to firestore if available
      try {
        await adminDb.collection('notification_logs').add({
          message,
          channel: 'telegram',
          targets: chatIds || ['demo_chat_id'],
          successCount: chatIds ? chatIds.length : 1,
          simulated: true,
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        console.warn("Firestore notification logging bypassed", e);
      }

      return NextResponse.json({
        success: true,
        simulated: true,
        sentCount: chatIds ? chatIds.length : 1,
        message: "Telegram Bot Token is missing, simulated broadcast."
      });
    }

    // Determine target chat IDs
    let targets: string[] = [];
    if (chatIds && Array.isArray(chatIds) && chatIds.length > 0) {
      targets = chatIds;
    } else {
      // Query users from Firestore (gracefully handle Firestore failures)
      try {
        const usersSnap = await adminDb.collection('users').get();
        usersSnap.forEach((doc: any) => {
          const u = doc.data();
          if (u.telegramChatId) {
            targets.push(u.telegramChatId);
          }
        });
      } catch (firebaseError) {
        console.warn("Firebase users query failed. Using default targets.", firebaseError);
        // Fallback demo targets
        targets = ['demo_officer_chat_1', 'demo_volunteer_chat_2'];
      }
    }

    if (targets.length === 0) {
      return NextResponse.json({ success: true, sentCount: 0, info: "No Telegram Chat IDs registered." });
    }

    const results = [];
    let successCount = 0;

    for (const chatId of targets) {
      try {
        const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
        const res = await fetch(telegramUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: message })
        });
        
        const resData = await res.json();
        if (res.ok && resData.ok) {
          successCount++;
          results.push({ chatId, status: 'success' });
        } else {
          results.push({ chatId, status: 'failed', error: resData.description });
        }
      } catch (err: any) {
        results.push({ chatId, status: 'error', error: err.message });
      }
    }

    // Write to audit log in Firestore (gracefully handle failures)
    try {
      await adminDb.collection('notification_logs').add({
        message,
        channel: 'telegram',
        targets,
        results,
        successCount,
        timestamp: new Date().toISOString()
      });
    } catch (dbError) {
      console.warn("Could not write notification audit log to Firestore:", dbError);
    }

    return NextResponse.json({ success: true, sentCount: successCount, results });
  } catch (error: any) {
    console.error("Telegram notification handler error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
