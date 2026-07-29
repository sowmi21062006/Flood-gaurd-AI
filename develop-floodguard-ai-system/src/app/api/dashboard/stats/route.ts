import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    // Get latest prediction
    const predictionSnapshot = await adminDb.collection('flood_predictions')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    const latestPrediction = predictionSnapshot.empty ? null : predictionSnapshot.docs[0].data();

    // Get latest sensor readings
    const getLatestSensor = async (type: string) => {
      const snap = await adminDb.collection('sensor_data')
        .where('sensorType', '==', type)
        .get();
      if (snap.empty) return null;
      const sorted = snap.docs
        .map((d: any) => d.data())
        .sort((a: any, b: any) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      return sorted[0];
    };

    const latestRiverLevel = await getLatestSensor('river_level');
    const latestHumidity = await getLatestSensor('humidity');
    const latestTemp = await getLatestSensor('temperature');

    // For rainfall sum in the last hour, we fetch the docs
    const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
    const rainfallSnapshot = await adminDb.collection('sensor_data')
      .where('sensorType', '==', 'rainfall')
      .get();
    
    let rainfallSumTotal = 0;
    rainfallSnapshot.forEach((doc: any) => {
      const data = doc.data();
      if (data.timestamp > oneHourAgo) {
        rainfallSumTotal += data.value || 0;
      }
    });

    // Get alert statistics
    const pendingAlertsSnap = await adminDb.collection('alerts')
      .where('status', '==', 'pending')
      .count()
      .get();
    
    const sentAlertsSnap = await adminDb.collection('alerts')
      .where('status', '==', 'sent')
      .count()
      .get();

    // Get shelter statistics
    const sheltersSnap = await adminDb.collection('shelters').get();
    let shelterStats = { total: 0, available: 0, totalCapacity: 0, currentOccupancy: 0 };
    sheltersSnap.forEach((doc: any) => {
      const data = doc.data();
      shelterStats.total += 1;
      shelterStats.available += data.available ? 1 : 0;
      shelterStats.totalCapacity += data.capacity || 0;
      shelterStats.currentOccupancy += data.currentOccupancy || 0;
    });

    // Get route statistics (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const routeCountSnap = await adminDb.collection('routes')
      .where('createdAt', '>', twentyFourHoursAgo)
      .count()
      .get();

    // Get agent health
    const recentLogsSnap = await adminDb.collection('agent_logs')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();
    
    const recentLogs = recentLogsSnap.docs.map((doc: any) => doc.data());

    const agentHealth = {
      hydrological: recentLogs.some((log: any) => log.agent === 'hydrological_radar' && log.status === 'completed'),
      mapping: recentLogs.some((log: any) => log.agent === 'flood_mapping' && log.status === 'completed'),
      routing: recentLogs.some((log: any) => log.agent === 'evacuation_routing' && log.status === 'completed'),
      alert: recentLogs.some((log: any) => log.agent === 'multilingual_alert' && log.status === 'completed'),
      coordinator: recentLogs.some((log: any) => log.agent === 'emergency_coordinator' && log.status === 'completed'),
    };

    return NextResponse.json({
      success: true,
      data: {
        prediction: latestPrediction,
        sensors: {
          riverLevel: latestRiverLevel?.value || 0,
          rainfall: rainfallSumTotal || 0,
          humidity: latestHumidity?.value || 0,
          temperature: latestTemp?.value || 0,
        },
        alerts: {
          pending: pendingAlertsSnap.data().count || 0,
          sent: sentAlertsSnap.data().count || 0,
        },
        shelters: {
          total: shelterStats.total,
          available: shelterStats.available,
          capacity: shelterStats.totalCapacity,
          occupancy: shelterStats.currentOccupancy,
        },
        routes: {
          generatedToday: routeCountSnap.data().count || 0,
        },
        agentHealth,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
