'use client';

import dynamic from 'next/dynamic';
import { MapPin, Layers, Route, AlertTriangle, PlayCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';

// Dynamic import of MapComponent with SSR disabled
const MapComponent = dynamic(() => import('@/components/dashboard/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-800">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      <span className="ml-3 text-gray-500 dark:text-gray-400 font-medium">Loading Map Data...</span>
    </div>
  ),
});

import { useSimulation } from '@/components/dashboard/SimulationProvider';

export default function MapPage() {
  const [layersOpen, setLayersOpen] = useState(false);
  const { simulationState, startSimulation, pauseSimulation } = useSimulation();

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] transition-colors relative z-0">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4 z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Live Flood Map</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Real-time geospatial tracking and predictive inundation.</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setLayersOpen(!layersOpen)}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg flex items-center text-sm font-medium transition shadow-sm"
          >
            <Layers size={16} className="mr-2" /> Map Layers
          </button>
          <button 
            onClick={simulationState.status === 'RUNNING' ? pauseSimulation : startSimulation}
            className={`${simulationState.status === 'RUNNING' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-3 py-1.5 rounded-lg flex items-center text-sm font-medium transition shadow-lg shadow-blue-500/20`}
          >
            <PlayCircle size={16} className={`mr-2 ${simulationState.status === 'RUNNING' ? 'animate-pulse' : ''}`} /> 
            {simulationState.status === 'RUNNING' ? 'Pause Simulation' : 'Start Simulation'}
          </button>
        </div>
      </div>

      <div className="flex-1 relative rounded-2xl overflow-hidden shadow-sm group z-0">
        
        {/* Dynamic Leaflet Map */}
        <MapComponent isSimulating={simulationState.status === 'RUNNING'} globalTick={simulationState.tick} />

        {/* Map Legend Overlay */}
        <div className="absolute top-4 left-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-lg z-[1000] max-w-xs transition-colors pointer-events-auto">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
            Map Legend
          </h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center">
              <span className="w-4 h-4 rounded bg-red-500/50 border border-red-500 mr-3"></span>
              <span className="text-gray-700 dark:text-gray-300">Severe Flood Zone</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 rounded bg-orange-500/50 border border-orange-500 mr-3"></span>
              <span className="text-gray-700 dark:text-gray-300">Warning Zone</span>
            </div>
            <div className="flex items-center pt-2 border-t border-gray-100 dark:border-gray-800">
              <Route size={16} className="text-green-500 mr-3" />
              <span className="text-gray-700 dark:text-gray-300">Safe Evac Route</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white mr-3 shadow-sm border border-white">🏠</span>
              <span className="text-gray-700 dark:text-gray-300">Emergency Shelter</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] text-white mr-3 shadow-sm border border-white">📡</span>
              <span className="text-gray-700 dark:text-gray-300">River Sensor</span>
            </div>
          </div>
        </div>

        {/* Dynamic Critical Alert Overlay */}
        {(simulationState.status === 'RUNNING' || simulationState.riskLevel === 'CRITICAL' || simulationState.riskLevel === 'SEVERE') && (
          <div className={`absolute top-4 right-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur border border-red-200 dark:border-red-900/50 rounded-lg p-3 shadow-lg z-[1000] flex items-start space-x-3 max-w-xs transition-all pointer-events-auto ${simulationState.status === 'RUNNING' ? 'animate-bounce' : ''}`}>
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <div className="text-sm font-bold text-red-600 dark:text-red-400">Critical Zone detected</div>
              <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">{simulationState.city} is currently experiencing rapid water level rise.</div>
              {simulationState.status === 'RUNNING' && <div className="text-xs font-bold text-red-500 mt-1 uppercase tracking-wide animate-pulse">Simulation Tick: {simulationState.tick}</div>}
            </div>
          </div>
        )}

        {/* Layer Controls Dropdown */}
        {layersOpen && (
          <div className="absolute top-16 right-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-lg p-3 shadow-lg z-[1000] min-w-[200px] transition-colors pointer-events-auto">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Visible Layers</h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700" />
                <span>Flood Polygons</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700" />
                <span>Shelters</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700" />
                <span>Sensors</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
