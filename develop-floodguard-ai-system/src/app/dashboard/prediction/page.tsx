'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, 
  Title, Tooltip, Legend, Filler 
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrendingUp, AlertTriangle, Clock, Activity, Cpu, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useGroq } from '@/hooks/useGroq';
import { useSimulation } from '@/components/dashboard/SimulationProvider';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
);

export default function PredictionPage() {
  const [insight, setInsight] = useState<string | null>(null);
  const { theme } = useTheme();
  const { generateOneOff } = useGroq({ context: 'prediction' });
  const { simulationState } = useSimulation();
  
  const isDark = theme === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const tickColor = isDark ? '#9ca3af' : '#6b7280';

  useEffect(() => {
    const fetchPrediction = async () => {
      // Fetch insight initially and every 10 ticks
      if (!insight || simulationState.tick % 10 === 0) {
        try {
          const prompt = `Explain the following prediction:
Risk: ${simulationState.riskScore}, Prob: ${simulationState.floodProbability}%, Severity: ${simulationState.riskLevel}
Include recommendations.`;
          const aiResponse = await generateOneOff(prompt);
          setInsight(aiResponse);
        } catch (error) {
          console.error('Failed to fetch insight:', error);
        }
      }
    };
    if (simulationState.tick > 0) fetchPrediction();
  }, [simulationState.tick]);

  const chartData = {
    labels: ['12 AM', '4 AM', '8 AM', '12 PM', '4 PM', '8 PM', 'Now'],
    datasets: [
      {
        fill: true,
        label: 'Flood Risk Score',
        data: [20, 25, 40, 55, 75, 82, simulationState.riskScore],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      y: { min: 0, max: 100, grid: { color: gridColor }, ticks: { color: tickColor } },
      x: { grid: { display: false }, ticks: { color: tickColor } }
    },
    interaction: { mode: 'nearest' as const, axis: 'x' as const, intersect: false },
  };


  return (
    <div className="space-y-6 transition-colors">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Flood Prediction Model</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">AI-driven hydrological forecasting and risk analysis.</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 px-4 py-2 rounded-lg flex items-center text-sm font-medium shadow-sm">
          <Activity size={16} className="mr-2" /> Model V2.4 (Active)
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <TrendingUp size={18} className="mr-2 text-gray-500 dark:text-gray-400" />
                Risk Trend Analysis (24h)
              </h2>
            </div>
            <div className="h-[300px]">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-gradient-to-br dark:from-indigo-900/40 dark:to-purple-900/40 rounded-2xl border border-indigo-200 dark:border-indigo-500/20 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-indigo-900 dark:text-white flex items-center mb-4">
              <Sparkles size={18} className="mr-2 text-indigo-600 dark:text-indigo-400" />
              Groq AI Explanation
            </h2>
            <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed space-y-3">
              {insight ? (
                <p>{insight}</p>
              ) : (
                <div className="flex items-center space-x-2 text-indigo-500">
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating AI insights...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side Stats Area */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Current Assessment</h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Risk Score</span>
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">{simulationState.riskScore.toFixed(1)}/100</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${simulationState.riskScore}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Probability</span>
                  <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">{simulationState.floodProbability.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${simulationState.floodProbability}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Model Confidence</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">{simulationState.tick > 0 ? (88 + (simulationState.tick % 5)).toFixed(1) : '0.0'}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${simulationState.tick > 0 ? (88 + (simulationState.tick % 5)) : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-200 dark:border-red-500/20 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center mb-4">
              <AlertTriangle size={16} className="mr-2" />
              Critical Alerts
            </h3>
            <div className="bg-white dark:bg-red-500/20 rounded-lg p-4 mb-3 border border-red-200 dark:border-red-500/30 shadow-sm">
              <div className="flex items-center text-red-700 dark:text-red-200 text-sm font-semibold mb-1">
                <Clock size={14} className="mr-1" /> Estimated TTA (Time to Action)
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">2h 15m</div>
            </div>
            <p className="text-xs text-red-600 dark:text-red-300/80">
              Expected flood arrival at Sector 4 based on current flow rates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
