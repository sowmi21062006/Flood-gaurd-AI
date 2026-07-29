import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { INITIAL_SIMULATION_STATE, GlobalSimulationState } from '@/lib/simulation-state';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action;
    
    if (!['start', 'pause', 'reset'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const simRef = adminDb.collection('global_simulation').doc('master');
    const docSnap = await simRef.get();
    let state: GlobalSimulationState;
    if (docSnap.exists) {
      state = docSnap.data() as GlobalSimulationState;
    } else {
      state = { ...INITIAL_SIMULATION_STATE };
    }

    if (action === 'start') {
      state.status = 'RUNNING';
      state.updatedAt = new Date().toISOString();
      await simRef.set(state);
    } else if (action === 'pause') {
      state.status = 'PAUSED';
      state.updatedAt = new Date().toISOString();
      await simRef.set(state);
    } else if (action === 'reset') {
      state = { ...INITIAL_SIMULATION_STATE };
      state.updatedAt = new Date().toISOString();
      await simRef.set(state);

      const batch = adminDb.batch();
      let batchCount = 0;

      // Delete existing alerts (limit to 100 for safety to keep within batch limits)
      const alertsSnap = await adminDb.collection('alerts').limit(100).get();
      for (const doc of alertsSnap.docs) {
        if (batchCount >= 490) break;
        batch.delete(doc.ref);
        batchCount++;
      }

      // Reset shelters to 0 occupancy
      const sheltersSnap = await adminDb.collection('shelters').get();
      for (const doc of sheltersSnap.docs) {
        if (batchCount >= 490) break;
        batch.update(doc.ref, { currentOccupancy: 0 });
        batchCount++;
      }

      // Note: Leaving sensor_data intact or we'd exceed batch limits easily over time.

      if (batchCount > 0) {
        await batch.commit();
      }
    }

    return NextResponse.json({ success: true, state });
  } catch (error) {
    console.error('Error in simulation control:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
