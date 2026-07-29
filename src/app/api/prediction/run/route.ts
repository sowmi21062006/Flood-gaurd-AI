import { NextRequest, NextResponse } from 'next/server';
import { SystemCoordinatorAgent } from '@/lib/agents/coordinator-agent';
import { verifyAuth } from '@/lib/auth';

/**
 * Trigger emergency workflow (Legacy endpoint support)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuth(request);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'admin' && session.role !== 'emergency_officer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const coordinator = new SystemCoordinatorAgent();
    // Run asynchronously
    coordinator.startWorkflow(`wf_${Date.now()}`).catch(console.error);

    return NextResponse.json({
      success: true,
      message: 'Workflow started'
    });
  } catch (error) {
    console.error('Emergency workflow error:', error);
    return NextResponse.json(
      { error: 'Failed to execute emergency workflow' },
      { status: 500 }
    );
  }
}

/**
 * Get flood status
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    status: 'Deprecated in favor of real-time Firestore listeners'
  });
}
