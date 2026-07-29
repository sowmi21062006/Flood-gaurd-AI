import { NextRequest, NextResponse } from 'next/server';
import { fetchCurrentWeather } from '@/services/open-meteo';
import { calculateFallbackRisk } from '@/services/risk-engine';
import { predictWithAI } from '@/services/openrouter';
import { sendTelegramMessage, formatSafetyAlert } from '@/services/telegram';

// Demo shelters used when Firestore is unavailable
const DEMO_SHELTERS = [
  { name: 'Government Higher Secondary School - Shelter', lat: 13.0900, lng: 80.2750, capacity: 500 },
  { name: 'Corporation Community Hall', lat: 13.0750, lng: 80.2600, capacity: 300 },
  { name: 'District Emergency Relief Center', lat: 13.0950, lng: 80.2850, capacity: 800 },
  { name: 'Public Library Emergency Shelter', lat: 12.9800, lng: 77.6000, capacity: 250 },
  { name: 'Sports Stadium Relief Camp', lat: 12.9650, lng: 77.5800, capacity: 1000 },
];

function findNearestShelter(lat: number, lng: number) {
  let nearest = DEMO_SHELTERS[0];
  let minDist = Infinity;

  for (const shelter of DEMO_SHELTERS) {
    const dist = Math.sqrt(Math.pow(lat - shelter.lat, 2) + Math.pow(lng - shelter.lng, 2));
    if (dist < minDist) {
      minDist = dist;
      nearest = shelter;
    }
  }

  return nearest;
}

function generateDangerZone(lat: number, lng: number, riskLevel: string) {
  const isHighRisk = riskLevel === 'HIGH' || riskLevel === 'CRITICAL';
  const radiusMeters = isHighRisk ? 2000 : 500;
  const offset = isHighRisk ? 0.015 : 0.004;

  const polygon: [number, number][] = [
    [lat + offset, lng - offset],
    [lat + offset, lng + offset],
    [lat - offset, lng + offset],
    [lat - offset, lng - offset],
    [lat + offset, lng - offset], // close polygon
  ];

  return {
    center: { lat, lng },
    radiusMeters,
    polygon,
  };
}

function generateSafeRoute(
  userLat: number, userLng: number,
  shelterLat: number, shelterLng: number
): [number, number][] {
  // Demo route with intermediate waypoints
  const midLat = (userLat + shelterLat) / 2;
  const midLng = (userLng + shelterLng) / 2;

  return [
    [userLat, userLng],
    [userLat + (midLat - userLat) * 0.3, userLng + (midLng - userLng) * 0.2],
    [midLat, midLng + 0.002],
    [shelterLat - (shelterLat - midLat) * 0.3, shelterLng - (shelterLng - midLng) * 0.2],
    [shelterLat, shelterLng],
  ];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lng, userId, phoneNumber, telegramChatId, district, language } = body;

    if (lat === undefined || lng === undefined) {
      return NextResponse.json({ success: false, error: 'lat and lng are required' }, { status: 400 });
    }

    // Step 1: Fetch weather
    const weather = await fetchCurrentWeather(lat, lng);

    // Step 2: Calculate fallback risk
    const fallbackRisk = calculateFallbackRisk(weather, lat, lng);

    // Step 3: Try AI enhancement (optional)
    let riskScore = fallbackRisk.riskScore;
    let riskLevel = fallbackRisk.riskLevel;
    let isInDangerZone = fallbackRisk.isInDangerZone;
    let explanation = fallbackRisk.explanation;
    let recommendedAction = fallbackRisk.recommendedAction;
    let aiUsed = false;

    const aiResult = await predictWithAI(weather, fallbackRisk.riskScore, lat, lng);
    if (aiResult) {
      riskScore = aiResult.riskScore;
      riskLevel = aiResult.riskLevel;
      isInDangerZone = aiResult.isInDangerZone;
      explanation = aiResult.explanation;
      recommendedAction = aiResult.recommendedAction;
      aiUsed = true;
    }

    // Step 4: Find nearest shelter
    const nearestShelter = findNearestShelter(lat, lng);

    // Step 5: Generate danger zone and safe route
    const dangerZone = generateDangerZone(lat, lng, riskLevel);
    const safeRoute = generateSafeRoute(lat, lng, nearestShelter.lat, nearestShelter.lng);

    // Step 6: Send Telegram alert if HIGH or CRITICAL
    let telegramResult = { attempted: false, sent: false, status: 'Risk level is safe - no alert needed' };

    if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
      const alertMessage = formatSafetyAlert(
        riskLevel, riskScore, lat, lng, nearestShelter.name, explanation
      );
      telegramResult = await sendTelegramMessage(telegramChatId || '', alertMessage);
    }

    // Step 7: Store in Firestore (best-effort, don't crash if fails)
    try {
      const { adminDb } = await import('@/lib/firebase/admin');

      // Store safety check
      await adminDb.collection('safety_checks').add({
        userId: userId || 'demo-user',
        lat, lng,
        district: district || 'Unknown',
        language: language || 'english',
        weather,
        riskScore,
        riskLevel,
        isInDangerZone,
        explanation,
        recommendedAction,
        nearestShelter: nearestShelter.name,
        aiUsed,
        createdAt: new Date().toISOString(),
      });

      // Store notification log
      if (telegramResult.attempted) {
        await adminDb.collection('notification_logs').add({
          userId: userId || 'demo-user',
          channel: 'telegram',
          chatId: telegramChatId || '',
          sent: telegramResult.sent,
          status: telegramResult.status,
          riskLevel,
          riskScore,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (dbError) {
      console.warn('[safety/check] Firestore write failed (demo mode OK):', dbError);
    }

    // Step 8: Build response
    const safetyMessage = riskLevel === 'SAFE'
      ? '✅ You are currently safe. No flood threat detected in your area.'
      : riskLevel === 'WATCH'
        ? '⚠️ Monitor conditions. Some flood indicators are elevated.'
        : riskLevel === 'HIGH'
          ? '🟠 High flood risk! Prepare to evacuate to the nearest shelter.'
          : '🔴 CRITICAL danger! Evacuate immediately to the nearest safe shelter.';

    return NextResponse.json({
      success: true,
      riskScore,
      riskLevel,
      isInDangerZone,
      explanation,
      recommendedAction,
      userLocation: { lat, lng },
      dangerZone,
      nearestShelter,
      safeRoute,
      telegram: telegramResult,
      message: safetyMessage,
      weather,
      aiUsed,
    });
  } catch (error: any) {
    console.error('[safety/check] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Safety check failed' },
      { status: 500 }
    );
  }
}
