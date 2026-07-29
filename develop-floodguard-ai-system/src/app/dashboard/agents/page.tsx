'use client';

import { Cpu, Activity, Database, Navigation, MessageSquare, AlertCircle, PlayCircle, StopCircle, RefreshCw, BarChart3, FileText, CheckCircle2, Loader2, Zap } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useSimulation } from '@/components/dashboard/SimulationProvider';

interface AgentState {
  id: string;
  name: string;
  status: 'RUNNING' | 'IDLE' | 'ERROR' | 'STOPPED' | 'COMPLETED' | 'FAILED';
  lastRun: string;
  executionTime: number;
  progress: number;
  confidence: number;
  currentTask: string;
  error?: string;
  output?: any;
  icon: any;
  desc: string;
}

const defaultAgents: AgentState[] = [
  { id: 'hydrological', name: 'Hydrological Analysis', status: 'IDLE', progress: 0, executionTime: 0, confidence: 0, currentTask: 'Waiting', lastRun: '', icon: Activity, desc: 'Ingests and processes real-time sensor data.' },
  { id: 'mapping', name: 'Geospatial Mapping', status: 'IDLE', progress: 0, executionTime: 0, confidence: 0, currentTask: 'Waiting', lastRun: '', icon: Database, desc: 'Generates flood inundation polygons and zones.' },
  { id: 'prediction', name: 'Flood Prediction', status: 'IDLE', progress: 0, executionTime: 0, confidence: 0, currentTask: 'Waiting', lastRun: '', icon: BarChart3, desc: 'Calculates probability and severity using ML models.' },
  { id: 'routing', name: 'Evacuation Routing', status: 'IDLE', progress: 0, executionTime: 0, confidence: 0, currentTask: 'Waiting', lastRun: '', icon: Navigation, desc: 'Calculates dynamic A* safe routes avoiding hazard areas.' },
  { id: 'alert', name: 'Emergency Alerts', status: 'IDLE', progress: 0, executionTime: 0, confidence: 0, currentTask: 'Waiting', lastRun: '', icon: AlertCircle, desc: 'Drafts and broadcasts multilingual SMS/Email warnings.' },
  { id: 'summary', name: 'AI Summary', status: 'IDLE', progress: 0, executionTime: 0, confidence: 0, currentTask: 'Waiting', lastRun: '', icon: FileText, desc: 'Generates executive summary of the entire response.' },
];

export default function AgentsPage() {
  const { simulationState, startSimulation, pauseSimulation, resetSimulation } = useSimulation();
  const [logs, setLogs] = useState<any[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Derive agent states dynamically from the global simulation tick
  const agents: AgentState[] = [
    { 
      id: 'hydrological', name: 'Hydrological Analysis', 
      status: simulationState.tick > 2 ? 'COMPLETED' : simulationState.tick > 0 ? 'RUNNING' : 'IDLE', 
      progress: simulationState.tick > 2 ? 100 : simulationState.tick > 0 ? 50 : 0, 
      executionTime: 120, confidence: 95, currentTask: simulationState.tick > 2 ? 'Analysis complete' : 'Ingesting sensor data...', lastRun: new Date().toISOString(), icon: Activity, desc: 'Ingests and processes real-time sensor data.' 
    },
    { 
      id: 'prediction', name: 'Flood Prediction', 
      status: simulationState.tick > 6 ? 'COMPLETED' : simulationState.tick > 2 ? 'RUNNING' : 'IDLE', 
      progress: simulationState.tick > 6 ? 100 : simulationState.tick > 2 ? (simulationState.tick - 2) * 25 : 0, 
      executionTime: 450, confidence: 92, currentTask: simulationState.tick > 6 ? 'Risk calculated' : simulationState.tick > 2 ? 'Running ML models...' : 'Waiting for hydrology', lastRun: new Date().toISOString(), icon: BarChart3, desc: 'Calculates probability and severity using ML models.' 
    },
    { 
      id: 'mapping', name: 'Geospatial Mapping', 
      status: simulationState.tick > 10 ? 'COMPLETED' : simulationState.tick > 6 ? 'RUNNING' : 'IDLE', 
      progress: simulationState.tick > 10 ? 100 : simulationState.tick > 6 ? (simulationState.tick - 6) * 25 : 0, 
      executionTime: 850, confidence: 88, currentTask: simulationState.tick > 10 ? 'Maps generated' : simulationState.tick > 6 ? 'Generating polygons...' : 'Waiting for prediction', lastRun: new Date().toISOString(), icon: Database, desc: 'Generates flood inundation polygons and zones.' 
    },
    { 
      id: 'routing', name: 'Evacuation Routing', 
      status: simulationState.tick > 15 ? 'COMPLETED' : simulationState.tick > 10 ? 'RUNNING' : 'IDLE', 
      progress: simulationState.tick > 15 ? 100 : simulationState.tick > 10 ? (simulationState.tick - 10) * 20 : 0, 
      executionTime: 320, confidence: 94, currentTask: simulationState.tick > 15 ? 'Routes optimized' : simulationState.tick > 10 ? 'Calculating safe routes...' : 'Waiting for maps', lastRun: new Date().toISOString(), icon: Navigation, desc: 'Calculates dynamic A* safe routes avoiding hazard areas.' 
    },
    { 
      id: 'alert', name: 'Emergency Alerts', 
      status: simulationState.tick > 18 ? 'COMPLETED' : simulationState.tick > 15 ? 'RUNNING' : 'IDLE', 
      progress: simulationState.tick > 18 ? 100 : simulationState.tick > 15 ? (simulationState.tick - 15) * 33 : 0, 
      executionTime: 150, confidence: 99, currentTask: simulationState.tick > 18 ? 'Alerts broadcasted' : simulationState.tick > 15 ? 'Drafting alerts...' : 'Waiting for routes', lastRun: new Date().toISOString(), icon: AlertCircle, desc: 'Drafts and broadcasts multilingual SMS/Email warnings.' 
    },
    { 
      id: 'summary', name: 'AI Summary', 
      status: simulationState.tick > 20 ? 'COMPLETED' : simulationState.tick > 18 ? 'RUNNING' : 'IDLE', 
      progress: simulationState.tick > 20 ? 100 : simulationState.tick > 18 ? (simulationState.tick - 18) * 50 : 0, 
      executionTime: 650, confidence: 85, currentTask: simulationState.tick > 20 ? 'Summary ready' : simulationState.tick > 18 ? 'Compiling report...' : 'Waiting for alerts', lastRun: new Date().toISOString(), icon: FileText, desc: 'Generates executive summary of the entire response.' 
    },
  ];

  useEffect(() => {
    // Generate synthetic logs based on tick
    if (simulationState.tick > 0) {
      const activeAgent = agents.find(a => a.status === 'RUNNING') || agents[agents.length - 1];
      const newLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        agent: activeAgent.name,
        message: `${activeAgent.currentTask} [Tick: ${simulationState.tick}]`,
        status: 'success'
      };
      setLogs(prev => [newLog, ...prev].slice(0, 50));
    } else {
      setLogs([]);
    }
  }, [simulationState.tick]);

  // Metrics calculation
  const totalRunning = agents.filter(a => a.status === 'RUNNING').length;
  const totalFailed = agents.filter(a => a.status === 'FAILED' || a.status === 'ERROR').length;
  const totalCompleted = agents.filter(a => a.status === 'COMPLETED').length;
  const totalIdle = agents.filter(a => a.status === 'IDLE' || a.status === 'STOPPED').length;
  const avgResponseTime = agents.reduce((acc, curr) => acc + (curr.executionTime || 0), 0) / agents.length;

  return (
    <div className="space-y-6 transition-colors pb-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">AI Agent Orchestration</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Real-time control center for the end-to-end response pipeline.</p>
        </div>
        <div className="flex space-x-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-800 text-sm font-medium text-blue-700 dark:text-blue-300">
          <Zap size={18} className="mr-2" /> Global Simulation Controlled
        </div>
      </div>

      {/* Metrics Header */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-center">
          <div className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-1">Current Workflow</div>
          <div className={`text-sm font-bold truncate ${simulationState.status === 'RUNNING' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
            {simulationState.status}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="text-xs text-gray-500 dark:text-gray-400">Current Tick</div>
          <div className="text-2xl font-bold">{simulationState.tick}</div>
        </div>
        <div className="bg-white dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="text-xs text-gray-500 dark:text-gray-400">Running</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalRunning}</div>
        </div>
        <div className="bg-white dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalCompleted}</div>
        </div>
        <div className="bg-white dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="text-xs text-gray-500 dark:text-gray-400">Failed / Stopped</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{totalFailed + agents.filter(a => a.status === 'STOPPED').length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="text-xs text-gray-500 dark:text-gray-400">Avg Agent Exec Time</div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{avgResponseTime.toFixed(0)}ms</div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 gap-3 relative">
        {/* Connection Line behind agents */}
        <div className="hidden sm:block absolute left-9 top-10 bottom-10 w-0.5 bg-gray-200 dark:bg-gray-800 z-0"></div>

        {agents.map((agent, index) => {
          const Icon = agent.icon;
          const isRunning = agent.status === 'RUNNING';
          const isError = agent.status === 'FAILED' || agent.status === 'ERROR';
          const isCompleted = agent.status === 'COMPLETED';
          const isStopped = agent.status === 'STOPPED';
          
          return (
            <div key={agent.id} className="relative z-10 bg-white dark:bg-gray-800/80 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors hover:border-gray-300 dark:hover:border-gray-600">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* Agent Identity */}
                <div className="flex items-start sm:items-center space-x-4 w-full sm:w-[35%]">
                  <div className={`p-2.5 rounded-xl border shadow-sm ${
                    isRunning ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-500/20 dark:border-blue-500/30 dark:text-blue-400' : 
                    isCompleted ? 'bg-green-50 border-green-200 text-green-600 dark:bg-green-500/20 dark:border-green-500/30 dark:text-green-400' :
                    isError ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-500/20 dark:border-red-500/30 dark:text-red-400' : 
                    isStopped ? 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-500/20 dark:border-orange-500/30 dark:text-orange-400' :
                    'bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-800/80 dark:border-gray-700 dark:text-gray-500'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">{index + 1}. {agent.name}</h3>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-blue-500 animate-pulse' : isCompleted ? 'bg-green-500' : isError ? 'bg-red-500' : isStopped ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
                      <span className={`text-[11px] font-bold tracking-wider uppercase ${isRunning ? 'text-blue-600 dark:text-blue-400' : isCompleted ? 'text-green-600 dark:text-green-400' : isError ? 'text-red-600 dark:text-red-400' : isStopped ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>
                        {agent.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Tracking */}
                <div className="w-full sm:w-[40%] px-2">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    <span className="font-medium truncate max-w-[80%]">{agent.currentTask}</span>
                    <span className="font-bold">{agent.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-900 rounded-full h-2.5 mb-1 shadow-inner overflow-hidden border border-gray-200 dark:border-gray-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ease-out ${isError ? 'bg-red-500' : isCompleted ? 'bg-green-500' : isStopped ? 'bg-orange-500' : 'bg-blue-500'}`} 
                      style={{ width: `${agent.progress || 0}%` }}
                    >
                      {isRunning && <div className="w-full h-full bg-white/20 animate-pulse"></div>}
                    </div>
                  </div>
                </div>
                
                {/* Stats & Actions */}
                <div className="flex items-center justify-between sm:justify-end space-x-4 w-full sm:w-[25%]">
                  <div className="text-right hidden md:block">
                    <div className="text-[10px] uppercase font-bold text-gray-400">Duration</div>
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{agent.executionTime ? `${agent.executionTime}ms` : '-'}</div>
                  </div>
                  <div className="text-right hidden lg:block">
                    <div className="text-[10px] uppercase font-bold text-gray-400">Last Run</div>
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{agent.lastRun ? new Date(agent.lastRun).toLocaleTimeString() : '-'}</div>
                  </div>

                </div>
              </div>

              {/* Error Message */}
              {isError && agent.error && (
                <div className="mt-3 p-2.5 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg text-xs text-red-600 dark:text-red-400 flex items-start">
                  <AlertCircle size={14} className="mr-2 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">{agent.error}</span>
                </div>
              )}

              {/* Output Preview (Optional, if they have output stored) */}
              {isCompleted && agent.output && (
                <div className="mt-3 p-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-400 flex items-start">
                  <CheckCircle2 size={14} className="mr-2 flex-shrink-0 mt-0.5 text-green-500" />
                  <span className="truncate max-w-full">
                    {typeof agent.output === 'string' ? agent.output : 'Data processed and saved to database successfully.'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Execution Logs Terminal */}
      <div className="bg-[#0d1117] rounded-xl border border-gray-800 shadow-2xl overflow-hidden mt-8">
        <div className="bg-[#161b22] px-4 py-2 border-b border-gray-800 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <MessageSquare size={14} className="text-gray-400" />
            <span className="text-xs font-mono text-gray-300">workflow_execution.log</span>
          </div>
          <div className="flex space-x-1.5 items-center">
            <span className="text-[10px] text-gray-500 font-mono mr-2">LIVE STREAM</span>
            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
          </div>
        </div>
        
        <div className="p-4 font-mono text-xs space-y-2 h-72 overflow-y-auto custom-scrollbar">
          {logs.length === 0 ? (
            <div className="text-gray-600 italic">Awaiting workflow execution initialization...</div>
          ) : (
            logs.map((log) => {
              let colorClass = 'text-gray-300';
              if (log.status === 'error') colorClass = 'text-red-400 font-semibold';
              if (log.status === 'success') colorClass = 'text-green-400';
              if (log.status === 'warning') colorClass = 'text-yellow-400';

              // Map agents to specific colors for readability
              let agentColor = 'text-gray-500';
              switch(log.agent) {
                case 'Hydrological Analysis': agentColor = 'text-blue-400'; break;
                case 'Geospatial Mapping': agentColor = 'text-cyan-400'; break;
                case 'Flood Prediction': agentColor = 'text-purple-400'; break;
                case 'Evacuation Routing': agentColor = 'text-orange-400'; break;
                case 'Emergency Alerts': agentColor = 'text-yellow-400'; break;
                case 'AI Summary': agentColor = 'text-emerald-400'; break;
              }

              return (
                <div key={log.id} className={`${colorClass} flex hover:bg-white/5 px-1 py-0.5 rounded transition-colors`}>
                  <span className="text-gray-600 shrink-0 mr-3 w-16">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                  </span>
                  <span className={`${agentColor} shrink-0 w-44 font-semibold truncate mr-2`}>
                    [{log.agent}]
                  </span>
                  <span className="break-words">
                    {log.message}
                  </span>
                </div>
              );
            })
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
