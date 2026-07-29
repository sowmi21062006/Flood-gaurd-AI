import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { INITIAL_SIMULATION_STATE, GlobalSimulationState, RiskLevel } from '@/lib/simulation-state';

export async function POST() {
  try {
    const simRef = adminDb.collection('global_simulation').doc('master');
    const docSnap = await simRef.get();
    
    let state: GlobalSimulationState;
    if (docSnap.exists) {
      state = docSnap.data() as GlobalSimulationState;
    } else {
      state = { ...INITIAL_SIMULATION_STATE };
    }

    if (state.status !== 'RUNNING') {
      return NextResponse.json({ message: 'Simulation is not running', state });
    }

    const newTick = state.tick + 1;
    // Cap progress at 1 so it peaks at tick 20
    const progress = Math.min(newTick / 20, 1);

    const newRainfall = 10 + progress * (185 - 10);
    const newRiverLevel = 2.1 + progress * (8.2 - 2.1);
    const newHumidity = 60 + progress * (94 - 60);
    const newFloodProbability = 5 + progress * (91 - 5);
    const newRiskScore = 10 + progress * (90 - 10);

    let newRiskLevel: RiskLevel = 'NORMAL';
    if (newRiskScore >= 90) newRiskLevel = 'CRITICAL';
    else if (newRiskScore >= 70) newRiskLevel = 'SEVERE';
    else if (newRiskScore >= 30) newRiskLevel = 'WARNING';

    const newState: GlobalSimulationState = {
      ...state,
      tick: newTick,
      rainfall: parseFloat(newRainfall.toFixed(2)),
      riverLevel: parseFloat(newRiverLevel.toFixed(2)),
      humidity: parseFloat(newHumidity.toFixed(2)),
      floodProbability: parseFloat(newFloodProbability.toFixed(2)),
      riskScore: parseFloat(newRiskScore.toFixed(2)),
      riskLevel: newRiskLevel,
      updatedAt: new Date().toISOString(),
    };

    // Save updated state
    await simRef.set(newState);

    const batch = adminDb.batch();
    const timestamp = new Date().toISOString();

    // Push updated sensor data points
    const sensors = [
      { type: 'river_level', value: newState.riverLevel, unit: 'm' },
      { type: 'rainfall', value: newState.rainfall, unit: 'mm' },
      { type: 'humidity', value: newState.humidity, unit: '%' }
    ];

    for (const sensor of sensors) {
      const ref = adminDb.collection('sensor_data').doc();
      batch.set(ref, {
        ...sensor,
        timestamp
      });
    }

    // Update shelters occupancy
    const sheltersSnap = await adminDb.collection('shelters').get();
    let batchCount = sensors.length;
    
    for (const doc of sheltersSnap.docs) {
      if (batchCount >= 490) break; // stay within Firestore batch limits
      
      const data = doc.data();
      const capacity = data.capacity || 100;
      const currentOccupancy = data.currentOccupancy || 0;
      
      // increase occupancy slightly each tick
      const added = Math.floor(Math.random() * 5) + 1;
      const updatedOccupancy = Math.min(capacity, currentOccupancy + added);
      
      batch.update(doc.ref, { currentOccupancy: updatedOccupancy });
      batchCount++;
    }

    // Push new alert if risk transitions to WARNING or SEVERE
    const oldRiskLevel = state.riskLevel;
    if (newRiskLevel !== oldRiskLevel && (newRiskLevel === 'WARNING' || newRiskLevel === 'SEVERE' || newRiskLevel === 'CRITICAL')) {
      const alertRef = adminDb.collection('alerts').doc();
      batch.set(alertRef, {
        title: `Risk Level increased to ${newRiskLevel}`,
        message: `Simulation reached ${newRiskLevel} at tick ${newTick}. River level is ${newState.riverLevel}m and rainfall is ${newState.rainfall}mm.`,
        severity: newRiskLevel,
        status: 'active',
        createdAt: timestamp
      });
    }

    await batch.commit();

    return NextResponse.json({ success: true, state: newState });
  } catch (error) {
    console.error('Error in tick simulation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
