import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAuth } from '@/lib/auth';
import { MultilingualEmergencyAlertAgent } from '@/lib/agents/alert-agent';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const language = searchParams.get('language');

    let alertsRef: any = adminDb.collection('alerts');

    if (status) {
      alertsRef = alertsRef.where('status', '==', status);
    } else if (language) {
      alertsRef = alertsRef.where('language', '==', language);
    }

    // Limit to 100 to get a good dataset without overloading, then sort in-memory to prevent composite index requirement
    const snapshot = await alertsRef.limit(100).get();
    
    let allAlerts = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    allAlerts.sort((a: any, b: any) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    const resultAlerts = allAlerts.slice(0, 50);

    return NextResponse.json({ success: true, data: resultAlerts });
  } catch (error) {
    console.error('Failed to fetch alerts', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuth(request);

    if (!session || (session.role !== 'admin' && session.role !== 'emergency_officer')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, alertId } = body;

    if (action === 'approve') {
      const alertAgent = new MultilingualEmergencyAlertAgent();
      const result = await alertAgent.approveAndBroadcast(alertId, session.uid);
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Failed to process alert', error);
    return NextResponse.json({ error: 'Failed to process alert' }, { status: 500 });
  }
}
