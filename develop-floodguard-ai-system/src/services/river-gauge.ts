import { adminDb } from '@/lib/firebase/admin';

export interface RiverGaugeData {
  sensorId: string;
  location: string;
  waterLevel: number; // meters
  dischargeRate: number; // m3/s
  status: 'normal' | 'warning' | 'danger';
  timestamp: string;
}

/**
 * River Gauge Mock Service
 * In production, this integrates with local government hydrology APIs
 */
export async function fetchRiverGaugeData(sensorId: string = 'sensor-001', location: string = 'Sector 4 River Basin'): Promise<RiverGaugeData> {
  let lastWaterLevel = 1.5;
  let lastDischarge = 450;

  try {
    const recentSensor = await adminDb.collection('sensor_data')
      .where('sensorId', '==', sensorId)
      .where('sensorType', '==', 'river_level')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();
      
    if (!recentSensor.empty) {
      const data = recentSensor.docs[0].data();
      lastWaterLevel = data.value;
      lastDischarge = data.dischargeRate || 450;
    }
  } catch (e) {
    console.warn("River simulation: Could not fetch previous data", e);
  }

  // Check recent rainfall to influence river level
  let recentRain = 0;
  try {
    const recentWeather = await adminDb.collection('weather_logs')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();
    if (!recentWeather.empty) {
      recentRain = recentWeather.docs[0].data().rainfall;
    }
  } catch (e) {}

  // Heavy rain exponentially increases river level
  let levelDelta = recentRain > 10 ? (recentRain / 50) + (Math.random() * 0.2) : (Math.random() * 0.1 - 0.05);
  
  let newWaterLevel = Math.max(0.5, lastWaterLevel + levelDelta);
  
  // Calculate status
  let status: 'normal' | 'warning' | 'danger' = 'normal';
  if (newWaterLevel > 5.0) status = 'danger';
  else if (newWaterLevel > 3.0) status = 'warning';

  const currentData: RiverGaugeData = {
    sensorId,
    location,
    waterLevel: Number(newWaterLevel.toFixed(2)),
    dischargeRate: Number((lastDischarge + (levelDelta * 100)).toFixed(0)),
    status,
    timestamp: new Date().toISOString(),
  };

  // Log as standard sensor data
  await adminDb.collection('sensor_data').add({
    sensorId,
    sensorType: 'river_level',
    location,
    value: currentData.waterLevel,
    unit: 'm',
    dischargeRate: currentData.dischargeRate,
    status,
    timestamp: currentData.timestamp,
  });

  return currentData;
}
