import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Telegram webhook payloads contain a 'message' property
    if (!body.message) {
      return NextResponse.json({ ok: true });
    }

    const { chat, text } = body.message;
    const chatId = chat.id;

    if (!text) {
      return NextResponse.json({ ok: true });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token || token === "demo") {
      return NextResponse.json({ ok: true, info: "Demo webhook skip" });
    }

    const sendTelegramMessage = async (msg: string) => {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: msg })
      });
    };

    if (text.startsWith('/start')) {
      await sendTelegramMessage(
        `🌊 Welcome to FloodGuard AI Notification Bot!\n\n` +
        `This bot dispatches real-time street-level flood hazard advisories.\n\n` +
        `Commands:\n` +
        `👉 /status - Get current flood risk scores\n` +
        `👉 /register - Bind your account using Chat ID: \`${chatId}\``
      );
    } else if (text.startsWith('/status')) {
      let riskScore = 15;
      let severity = 'NORMAL';
      let temp = 27.5;
      let rain = 4.2;

      try {
        const zoneDoc = await adminDb.collection('disaster_zones').doc('latest').get();
        if (zoneDoc.exists) {
          const data = zoneDoc.data();
          riskScore = data.riskScore;
          severity = data.severity;
          if (data.weather) {
            temp = data.weather.temperature;
            rain = data.weather.rain || data.weather.precipitation;
          }
        }
      } catch (e) {
        console.warn("Could not query disaster zones in webhook, using fallbacks:", e);
      }

      await sendTelegramMessage(
        `🚨 FloodGuard System Status:\n\n` +
        `• Risk Level: ${severity.toUpperCase()}\n` +
        `• Risk Score: ${riskScore.toFixed(1)}/100\n` +
        `• Temperature: ${temp.toFixed(1)}°C\n` +
        `• Rainfall: ${rain.toFixed(1)}mm\n\n` +
        `Stay safe!`
      );
    } else if (text.startsWith('/register')) {
      await sendTelegramMessage(
        `Your Telegram Chat ID is: \`${chatId}\`\n\n` +
        `Please copy this ID and paste it in the "Telegram Chat ID" field of your FloodGuard AI account registration form.`
      );
    } else {
      await sendTelegramMessage(
        `I do not recognize that command. Type /status to fetch the latest flood risk data or /register to find your Chat ID.`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Telegram webhook error:", error);
    // Always return 200 OK to Telegram bot server to prevent retry loops
    return NextResponse.json({ ok: true, error: error.message });
  }
}
