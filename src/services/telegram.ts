/**
 * Telegram Notification Service
 * Sends personal safety alerts to individual users via Bot API.
 * Gracefully handles missing TELEGRAM_BOT_TOKEN.
 */

export interface TelegramResult {
  attempted: boolean;
  sent: boolean;
  status: string;
}

export async function sendTelegramMessage(
  chatId: string,
  message: string
): Promise<TelegramResult> {
  if (!chatId || chatId.trim() === '') {
    return {
      attempted: false,
      sent: false,
      status: 'No Telegram Chat ID provided by user',
    };
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.log('[telegram] Bot token not configured - demo mode');
    return {
      attempted: true,
      sent: false,
      status: 'Telegram bot token missing - alert queued for demo',
    };
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();

    if (result.ok) {
      return {
        attempted: true,
        sent: true,
        status: 'Alert sent successfully via Telegram',
      };
    } else {
      console.warn('[telegram] Send failed:', result.description);
      return {
        attempted: true,
        sent: false,
        status: `Telegram error: ${result.description || 'Unknown error'}`,
      };
    }
  } catch (error: any) {
    console.error('[telegram] Send error:', error);
    return {
      attempted: true,
      sent: false,
      status: `Network error: ${error.message || 'Failed to reach Telegram'}`,
    };
  }
}

export function formatSafetyAlert(
  riskLevel: string,
  riskScore: number,
  lat: number,
  lng: number,
  shelterName: string,
  explanation: string
): string {
  return `🚨 <b>FloodRakshak AI Safety Alert</b>

<b>Risk:</b> ${riskLevel}
<b>Score:</b> ${riskScore}/100
<b>Location:</b> Near your current GPS location

<b>Action:</b>
Move towards <b>${shelterName}</b>.

<b>Reason:</b>
${explanation}

<b>Map:</b>
https://www.google.com/maps?q=${lat},${lng}

Stay calm. Follow official instructions.`;
}
