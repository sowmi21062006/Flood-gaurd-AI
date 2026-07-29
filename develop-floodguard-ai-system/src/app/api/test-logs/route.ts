import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const wfSnap = await adminDb.collection('workflowExecutions').orderBy('startTime', 'desc').limit(1).get();
    const wf = wfSnap.docs[0]?.data();
    
    const agentsSnap = await adminDb.collection('agents').get();
    const agents = agentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const logsSnap = await adminDb.collection('workflowLogs').orderBy('timestamp', 'desc').limit(10).get();
    const logs = logsSnap.docs.map(d => d.data());

    return NextResponse.json({ wf, agents, logs });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
