'use client';

import { useEffect, useState } from 'react';
import { 
  Droplets, CloudRain, Thermometer, Wind, Activity, 
  AlertTriangle, CheckCircle, ShieldAlert, Cpu, Sparkles
} from 'lucide-react';
import { useGroq } from '@/hooks/useGroq';
import { useSimulation } from '@/components/dashboard/SimulationProvider';

export default function DashboardPage() {
  const [insight, setInsight] = useState<string | null>(null);
  const { generateOneOff } = useGroq({ context: 'dashboard' });

  const { simulationState } = useSimulation();

  useEffect(() => {
    const fetchInsight = async () => {
      // Only generate insight if risk is high to save tokens, or initially
      if (!insight || simulationState.tick % 10 === 0) {
        try {
          const prompt = `Current status:
Risk: ${simulationState.riskScore}/100, Severity: ${simulationState.riskLevel}
Sensors: River ${simulationState.riverLevel}m, Rain ${simulationState.rainfall}mm
Flood Probability: ${simulationState.floodProbability}%`;
          const aiInsight = await generateOneOff(prompt);
          setInsight(aiInsight);
        } catch (error) {
          console.error(error);
        }
      }
    };
    if (simulationState.tick > 0) fetchInsight();
  }, [simulationState.tick]);

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 75) return 'text-red-600 dark:text-red-500';
    if (riskScore >= 50) return 'text-orange-600 dark:text-orange-500';
    if (riskScore >= 25) return 'text-yellow-600 dark:text-yellow-500';
    return 'text-green-600 dark:text-green-500';
  };

  const getSeverityBadge = (severity: string) => {
    const colors: any = {
      critical: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-500 dark:border-red-500/50',
      high: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-500 dark:border-orange-500/50',
      moderate: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-500 dark:border-yellow-500/50',
      low: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-500 dark:border-green-500/50',
    };
    return `${colors[severity] || 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-600'} border px-3 py-1 rounded-full text-xs font-semibold uppercase`;
  };

  return (
    <div className="space-y-6 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">System Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Real-time status of the FloodGuard AI network.</p>
        </div>
        
        {/* Current Status */}
        <div className="flex items-center space-x-3 bg-white dark:bg-gray-800/50 p-2 pl-4 pr-3 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Status:</span>
          <span className={getSeverityBadge(simulationState.riskLevel.toLowerCase())}>
            {simulationState.riskLevel}
          </span>
        </div>
      </div>

      {/* AI Insight Panel */}
      {insight && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-4 shadow-sm flex gap-4 items-start">
          <div className="bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 p-2 rounded-xl flex-shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">AI Executive Summary</h3>
            <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">{insight}</p>
          </div>
        </div>
      )}

      {/* Main Prediction Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-xl relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10">
            <ShieldAlert size={80} />
          </div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
            <Activity size={16} className="mr-2" /> 
            Risk Score
          </div>
          <div className={`text-5xl font-extrabold tracking-tighter ${getRiskColor(simulationState.riskScore)}`}>
            {simulationState.riskScore.toFixed(1)}
            <span className="text-lg text-gray-400 dark:text-gray-500 font-medium tracking-normal ml-1">/ 100</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-xl transition-colors">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
            <Droplets size={16} className="mr-2 text-blue-500 dark:text-blue-400" />
            Flood Probability
          </div>
          <div className="text-5xl font-extrabold tracking-tighter text-blue-600 dark:text-blue-400">
            {(simulationState.floodProbability).toFixed(1)}%
          </div>
        </div>
        
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-xl transition-colors">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
            <CheckCircle size={16} className="mr-2 text-green-500 dark:text-green-400" />
            AI Confidence
          </div>
          <div className="text-5xl font-extrabold tracking-tighter text-green-600 dark:text-green-400">
            {simulationState.tick > 0 ? (88 + (simulationState.tick % 5)).toFixed(1) : '0.0'}%
          </div>
        </div>
      </div>

      {/* Sensor Readings */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Live Environmental Sensors</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-800 transition-all hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">River Level</div>
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg"><Droplets size={18} className="text-blue-500 dark:text-blue-400" /></div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {simulationState.riverLevel.toFixed(2)}<span className="text-base text-gray-400 dark:text-gray-500 ml-1">m</span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-800 transition-all hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Rainfall (1hr)</div>
              <div className="p-2 bg-cyan-50 dark:bg-cyan-500/10 rounded-lg"><CloudRain size={18} className="text-cyan-600 dark:text-cyan-400" /></div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {simulationState.rainfall.toFixed(1)}<span className="text-base text-gray-400 dark:text-gray-500 ml-1">mm</span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-800 transition-all hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Humidity</div>
              <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg"><Wind size={18} className="text-purple-600 dark:text-purple-400" /></div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {simulationState.humidity.toFixed(0)}<span className="text-base text-gray-400 dark:text-gray-500 ml-1">%</span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-800 transition-all hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Temperature</div>
              <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-lg"><Thermometer size={18} className="text-orange-500 dark:text-orange-400" /></div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {simulationState.temperature.toFixed(1)}<span className="text-base text-gray-400 dark:text-gray-500 ml-1">°C</span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Alerts */}
        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-5">Emergency Alerts</h3>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Warnings</span>
                <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 leading-none">{simulationState.tick > 5 ? Math.floor(simulationState.tick / 2) : 0}</span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 dark:bg-yellow-500 rounded-full" style={{ width: `${Math.min((simulationState.tick > 5 ? Math.floor(simulationState.tick / 2) : 0) * 10, 100)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical Alerts Sent</span>
                <span className="text-2xl font-bold text-red-600 dark:text-red-400 leading-none">{simulationState.riskLevel === 'CRITICAL' ? 1 : 0}</span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${simulationState.riskLevel === 'CRITICAL' ? 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Shelters */}
        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-5">Evacuation Shelters</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Shelters</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">4</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Capacity</div>
              <div className="text-xl font-semibold text-blue-600 dark:text-blue-400">1200</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Occupied</div>
              <div className="text-xl font-semibold text-orange-600 dark:text-orange-400">{Math.min(1200, simulationState.tick * 35)}</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Available</div>
              <div className="text-xl font-semibold text-green-600 dark:text-green-400">{Math.max(0, 1200 - (simulationState.tick * 35))}</div>
            </div>
          </div>
        </div>

        {/* Agent Health */}
        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-5">AI Agent Health</h3>
          <div className="space-y-3">
            {['hydrological', 'mapping', 'routing', 'alert', 'coordinator'].map((agent) => {
              const isHealthy = true;
              return (
                <div key={agent} className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize flex items-center">
                    <Cpu size={14} className="mr-2 text-gray-400 dark:text-gray-500" />
                    {agent} Agent
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs ${isHealthy ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isHealthy ? 'Online' : 'Offline'}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse'}`}></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
