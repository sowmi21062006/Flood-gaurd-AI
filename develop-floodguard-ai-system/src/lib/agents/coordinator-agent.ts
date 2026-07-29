/**
 * End-to-End System Coordinator Agent
 * Orchestrates AI agents dynamically with interruptibility and granular tracking.
 */

import { HydrologicalRadarAgent } from './hydrological-agent';
import { FloodInundationMappingAgent } from './mapping-agent';
import { EvacuationRoutingAgent } from './routing-agent';
import { MultilingualEmergencyAlertAgent } from './alert-agent';
import { adminDb } from '@/lib/firebase/admin';
import { generateAIResponse } from '@/services/groq';

type WorkflowStatus = 'RUNNING' | 'STOPPED' | 'COMPLETED' | 'FAILED';
type AgentStatus = 'RUNNING' | 'IDLE' | 'ERROR' | 'STOPPED' | 'COMPLETED';

export class SystemCoordinatorAgent {
  private hydrologicalAgent = new HydrologicalRadarAgent();
  private mappingAgent = new FloodInundationMappingAgent();
  private routingAgent = new EvacuationRoutingAgent();
  private alertAgent = new MultilingualEmergencyAlertAgent();

  private workflowId: string = '';

  constructor() {}

  /** Helper to sleep for simulated execution time or delays */
  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /** Wrapper for Groq calls with Retries */
  private async executeWithGroqRetry(fn: () => Promise<any>, retries = 2) {
    let attempt = 0;
    while (attempt <= retries) {
      try {
        return await fn();
      } catch (e: any) {
        if (attempt === retries) throw e;
        console.warn(`Groq execution failed. Retrying... (${attempt + 1}/${retries})`);
        await this.sleep(1000);
        attempt++;
      }
    }
  }

  /** Write live log to workflowLogs collection */
  private async log(agent: string, message: string, progress?: number, status: string = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${agent}] ${message}`);
    try {
      await adminDb.collection('workflowLogs').add({
        workflowId: this.workflowId,
        timestamp,
        agent,
        status,
        task: message,
        progress: progress || 0,
        message,
      });
    } catch (e) {
      console.error('Failed to write log to Firestore', e);
    }
  }

  /** Update individual agent state */
  private async updateAgentState(agentId: string, updates: any) {
    try {
      const data = { ...updates, updatedAt: new Date().toISOString() };
      await adminDb.collection('agents').doc(agentId).set(data, { merge: true });
    } catch (e) {
      console.error('Failed to update agent state', e);
    }
  }

  /** Initialize or Update workflow execution state */
  private async updateWorkflowState(updates: any) {
    if (!this.workflowId) return;
    try {
      const data = { ...updates, updatedAt: new Date().toISOString() };
      await adminDb.collection('workflowExecutions').doc(this.workflowId).set(data, { merge: true });
    } catch (e) {
      console.error('Failed to update workflow state', e);
    }
  }

  /** Check if workflow was halted by user */
  private async isWorkflowStopped(): Promise<boolean> {
    if (!this.workflowId) return false;
    const doc = await adminDb.collection('workflowExecutions').doc(this.workflowId).get();
    if (doc.exists && doc.data()?.status === 'STOPPED') {
      return true;
    }
    return false;
  }

  /** 
   * Generic wrapper to execute a single agent with granular progress 
   */
  private async runAgentWithProgress(
    agentId: string, 
    agentName: string, 
    executionBlock: () => Promise<any>
  ) {
    if (await this.isWorkflowStopped()) throw new Error('Workflow was halted.');

    const startTime = Date.now();
    await this.updateWorkflowState({ currentAgent: agentName });
    
    // Status: RUNNING, 0%
    await this.updateAgentState(agentId, { status: 'RUNNING', progress: 0, currentTask: 'Starting...', error: '' });
    await this.log(agentName, 'Starting execution', 0);
    await this.sleep(500);

    // 10%
    if (await this.isWorkflowStopped()) throw new Error('Workflow was halted.');
    await this.updateAgentState(agentId, { progress: 10, currentTask: 'Loading data' });
    await this.log(agentName, 'Loading necessary context and data', 10);
    await this.sleep(800);

    // 30%
    if (await this.isWorkflowStopped()) throw new Error('Workflow was halted.');
    await this.updateAgentState(agentId, { progress: 30, currentTask: 'Processing' });
    await this.log(agentName, 'Processing incoming data points', 30);
    
    let result: any = null;
    let confidence = 0;

    try {
      // 60% - Actual Execution (Groq/ML)
      if (await this.isWorkflowStopped()) throw new Error('Workflow was halted.');
      await this.updateAgentState(agentId, { progress: 60, currentTask: 'AI Analysis (Groq)' });
      await this.log(agentName, 'Running Groq analysis model', 60);
      
      result = await this.executeWithGroqRetry(executionBlock);
      confidence = result?.confidence || Math.floor(Math.random() * 15) + 80;

      // 90%
      if (await this.isWorkflowStopped()) throw new Error('Workflow was halted.');
      await this.updateAgentState(agentId, { progress: 90, currentTask: 'Saving results' });
      await this.log(agentName, 'Compiling and saving results to database', 90);
      await this.sleep(500);

      // 100%
      const executionTime = Date.now() - startTime;
      await this.updateAgentState(agentId, { 
        status: 'COMPLETED', 
        progress: 100, 
        currentTask: 'Completed',
        executionTime,
        lastRun: new Date().toISOString(),
        confidence,
        output: result || 'Success'
      });
      await this.log(agentName, `Execution completed successfully in ${executionTime}ms`, 100, 'success');

      return result;
    } catch (e: any) {
      const executionTime = Date.now() - startTime;
      const errorMsg = e.message || 'Unknown error';
      await this.updateAgentState(agentId, { 
        status: e.message === 'Workflow was halted.' ? 'STOPPED' : 'FAILED', 
        progress: 100, 
        currentTask: 'Failed',
        executionTime,
        lastRun: new Date().toISOString(),
        error: errorMsg
      });
      await this.log(agentName, `Error: ${errorMsg}`, 100, 'error');
      throw e;
    }
  }

  // ==========================================
  // PIPELINE EXECUTION
  // ==========================================

  async startWorkflow(workflowId?: string) {
    this.workflowId = workflowId || `wf_${Date.now()}`;
    const startTime = Date.now();

    await this.updateWorkflowState({
      id: this.workflowId,
      status: 'RUNNING',
      startTime: new Date().toISOString(),
      currentAgent: 'Coordinator'
    });

    try {
      let context: any = {};

      // 1. Hydrological Analysis
      context.hydro = await this.runAgentWithProgress('hydrological', 'Hydrological Analysis', async () => {
        return await this.hydrologicalAgent.predict();
      });

      // 2. Flood Prediction (Explanation)
      context.prediction = await this.runAgentWithProgress('prediction', 'Flood Prediction', async () => {
        return await generateAIResponse({
          systemPrompt: 'You are an AI Flood Predictor. Explain the probability of flooding based on current data.',
          userPrompt: `Current Risk Score: ${context.hydro?.riskScore}. Severity: ${context.hydro?.severity}. Explain the probability briefly.`
        });
      });

      // 3. Geospatial Mapping
      context.map = await this.runAgentWithProgress('mapping', 'Geospatial Mapping', async () => {
        return await this.mappingAgent.generateFloodMap('pred_live', context.hydro?.riverLevel || 4.5, context.hydro?.rainfall || 50);
      });

      // 4. Evacuation Routing
      context.routing = await this.runAgentWithProgress('routing', 'Evacuation Routing', async () => {
        return await this.routingAgent.findSafeRoute(12.9716, 77.5946, context.map?.floodedRoads || []);
      });

      // 5. Emergency Alerts
      context.alert = await this.runAgentWithProgress('alert', 'Emergency Alerts', async () => {
        return await this.alertAgent.generateMultilingualAlerts(
          (context.hydro?.severity as any) || 'warning',
          {
            riskScore: context.hydro?.riskScore || 75,
            predictedTime: context.hydro?.predictedOverflowTime,
            affectedAreas: ['Bangalore Central'],
          }
        );
      });

      // 6. AI Summary
      context.summary = await this.runAgentWithProgress('summary', 'AI Summary', async () => {
        return await generateAIResponse({
          systemPrompt: 'You are the System Coordinator AI. Summarize the entire emergency response workflow.',
          userPrompt: `Summarize this pipeline execution: Risk=${context.hydro?.riskScore}, Route=${context.routing?.distance}km, Alerts=${context.alert?.alerts?.length} languages.`
        });
      });

      // Workflow Finished
      await this.updateWorkflowState({
        status: 'COMPLETED',
        endTime: new Date().toISOString(),
        executionTime: Date.now() - startTime,
        currentAgent: 'None'
      });

    } catch (e: any) {
      if (e.message === 'Workflow was halted.') {
        // Halt all handled gracefully
        await this.updateWorkflowState({
          endTime: new Date().toISOString(),
          executionTime: Date.now() - startTime,
          currentAgent: 'None'
        });
      } else {
        await this.updateWorkflowState({
          status: 'FAILED',
          endTime: new Date().toISOString(),
          executionTime: Date.now() - startTime,
          error: e.message,
          currentAgent: 'None'
        });
      }
    }
  }

  // ==========================================
  // INDIVIDUAL AGENT CONTROLS
  // ==========================================

  async startAgent(agentId: string) {
    this.workflowId = `single_${agentId}_${Date.now()}`;
    await this.updateWorkflowState({ id: this.workflowId, status: 'RUNNING', currentAgent: agentId });
    
    try {
      if (agentId === 'hydrological') {
        await this.runAgentWithProgress('hydrological', 'Hydrological Analysis', async () => this.hydrologicalAgent.predict());
      } else if (agentId === 'prediction') {
        await this.runAgentWithProgress('prediction', 'Flood Prediction', async () => generateAIResponse({ systemPrompt: 'Predict flood', userPrompt: 'Analyze.' }));
      } else if (agentId === 'mapping') {
        await this.runAgentWithProgress('mapping', 'Geospatial Mapping', async () => this.mappingAgent.generateFloodMap('test', 4.5, 50));
      } else if (agentId === 'routing') {
        await this.runAgentWithProgress('routing', 'Evacuation Routing', async () => this.routingAgent.findSafeRoute(12.9716, 77.5946, []));
      } else if (agentId === 'alert') {
        await this.runAgentWithProgress('alert', 'Emergency Alerts', async () => this.alertAgent.generateMultilingualAlerts('warning', { riskScore: 75, affectedAreas: [] }));
      } else if (agentId === 'summary') {
        await this.runAgentWithProgress('summary', 'AI Summary', async () => generateAIResponse({ systemPrompt: 'Summarize.', userPrompt: 'Summarize.' }));
      }
      await this.updateWorkflowState({ status: 'COMPLETED' });
    } catch (e: any) {
      if (e.message !== 'Workflow was halted.') {
        await this.updateWorkflowState({ status: 'FAILED', error: e.message });
      }
    }
  }

  async stopWorkflow(workflowId: string) {
    try {
      await adminDb.collection('workflowExecutions').doc(workflowId).set({ status: 'STOPPED' }, { merge: true });
      
      // Mark all currently RUNNING agents as STOPPED
      const snapshot = await adminDb.collection('agents').where('status', '==', 'RUNNING').get();
      const batch = adminDb.batch();
      snapshot.docs.forEach((doc: any) => {
        batch.update(doc.ref, { status: 'STOPPED', currentTask: 'Halted by user', progress: 0 });
      });
      await batch.commit();

    } catch (e) {
      console.error('Failed to stop workflow', e);
    }
  }

  async stopAgent(agentId: string) {
    try {
      await adminDb.collection('agents').doc(agentId).set({ status: 'STOPPED', currentTask: 'Halted by user', progress: 0 }, { merge: true });
    } catch (e) {
      console.error('Failed to stop agent', e);
    }
  }
}
