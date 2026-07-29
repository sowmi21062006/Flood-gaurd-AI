/**
 * OpenRouter AI Prediction Service
 * Enhances risk assessment using AI when OPENROUTER_API_KEY is available.
 * Falls back to null (caller uses rule-based scoring).
 */

import { WeatherData } from './open-meteo';

export interface AIRiskPrediction {
  riskScore: number;
  riskLevel: 'SAFE' | 'WATCH' | 'HIGH' | 'CRITICAL';
  isInDangerZone: boolean;
  explanation: string;
  recommendedAction: string;
}

export async function predictWithAI(
  weather: WeatherData,
  fallbackScore: number,
  lat: number,
  lng: number
): Promise<AIRiskPrediction | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.log('[openrouter] No API key set - skipping AI prediction');
    return null;
  }

  try {
    const prompt = `You are a flood risk assessment AI. Based on the following real-time weather data and location, analyze the flood risk.

Weather Data:
- Temperature: ${weather.temperature}°C
- Humidity: ${weather.humidity}%
- Current Precipitation: ${weather.precipitation}mm
- Current Rain: ${weather.rain}mm
- Wind Speed: ${weather.windSpeed}km/h
- Forecast Rain Next 6 Hours: ${weather.forecastRainNext6Hours}mm

Location: Latitude ${lat}, Longitude ${lng}
Rule-based fallback score: ${fallbackScore}/100

Return ONLY valid JSON (no markdown, no explanation outside JSON):
{
  "riskScore": <number 0-100>,
  "riskLevel": "<SAFE|WATCH|HIGH|CRITICAL>",
  "isInDangerZone": <boolean>,
  "explanation": "<2-3 sentence explanation>",
  "recommendedAction": "<1-2 sentence action recommendation>"
}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://floodrakshak.ai',
        'X-Title': 'FloodRakshak AI',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.warn('[openrouter] API returned status', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[openrouter] Could not parse JSON from response');
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]) as AIRiskPrediction;

    // Validate required fields
    if (
      typeof parsed.riskScore !== 'number' ||
      !['SAFE', 'WATCH', 'HIGH', 'CRITICAL'].includes(parsed.riskLevel)
    ) {
      console.warn('[openrouter] Invalid response structure');
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('[openrouter] AI prediction failed:', error);
    return null;
  }
}
