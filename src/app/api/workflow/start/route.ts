import { NextRequest, NextResponse } from 'next/server';
import { SystemCoordinatorAgent } from '@/lib/agents/coordinator-agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, agentId, workflowId } = body;

    const coordinator = new SystemCoordinatorAgent();

    // Default action to start_workflow if not provided, just in case
    const effectiveAction = action || 'start_workflow';

    if (effectiveAction === 'start_workflow' || effectiveAction === 'restart_workflow') {
      coordinator.startWorkflow(workflowId).catch(console.error);
      return NextResponse.json({ success: true, message: 'Workflow initiated' });
    }

    if (effectiveAction === 'halt_all') {
      if (workflowId) {
        await coordinator.stopWorkflow(workflowId);
      } else {
        await coordinator.stopWorkflow('active_workflow');
      }
      return NextResponse.json({ success: true, message: 'All agents stopped' });
    }

    if (effectiveAction === 'start_agent' && agentId) {
      coordinator.startAgent(agentId).catch(console.error);
      return NextResponse.json({ success: true, message: `Agent ${agentId} started` });
    }

    if (effectiveAction === 'stop_agent' && agentId) {
      await coordinator.stopAgent(agentId);
      return NextResponse.json({ success: true, message: `Agent ${agentId} stopped` });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[API /workflow/start] 500 Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
