'use client';

import { MapPin, Navigation, AlertTriangle, ShieldCheck, Clock, Car, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useGroq } from '@/hooks/useGroq';
import { useSimulation } from '@/components/dashboard/SimulationProvider';

const mockRoutes = [
  { id: 1, name: 'Northern Highland Escape', origin: 'Sector 4', destination: 'Highland Shelter A', status: 'safe', time: '15 mins', distance: '4.2 km' },
  { id: 2, name: 'East Valley Connector', origin: 'Sector 2', destination: 'City Center', status: 'caution', time: '28 mins', distance: '8.5 km' },
  { id: 3, name: 'Riverside Parkway', origin: 'Sector 1', destination: 'West Ridge', status: 'blocked', time: '--', distance: '6.1 km' },
];

export default function RoutesPage() {
  const [insights, setInsights] = useState<Record<number, string>>({});
  const { generateOneOff } = useGroq({ context: 'routing' });
  const { simulationState } = useSimulation();

  // Dynamically compute route status based on global simulation tick
  const routes = [
    { id: 1, name: 'Northern Highland Escape', origin: 'Sector 4', destination: 'Highland Shelter A', status: simulationState.tick > 25 ? 'caution' : 'safe', time: '15 mins', distance: '4.2 km' },
    { id: 2, name: 'East Valley Connector', origin: 'Sector 2', destination: 'City Center', status: simulationState.tick > 15 ? 'blocked' : simulationState.tick > 8 ? 'caution' : 'safe', time: simulationState.tick > 15 ? '--' : '28 mins', distance: '8.5 km' },
    { id: 3, name: 'Riverside Parkway', origin: 'Sector 1', destination: 'West Ridge', status: simulationState.tick > 5 ? 'blocked' : 'caution', time: simulationState.tick > 5 ? '--' : '45 mins', distance: '6.1 km' },
  ];

  useEffect(() => {
    // Generate insights for safe routes periodically
    if (simulationState.tick % 10 === 0 || Object.keys(insights).length === 0) {
      routes.filter(r => r.status === 'safe').forEach(async (route) => {
        const prompt = `Route: ${route.name}
From: ${route.origin}, To: ${route.destination}
Distance: ${route.distance}, Time: ${route.time}
Status: ${route.status}

Why is this route safe during current Tick ${simulationState.tick}? Suggest alternates if any.`;
        const aiResponse = await generateOneOff(prompt);
        if (aiResponse) {
          setInsights(prev => ({ ...prev, [route.id]: aiResponse }));
        }
      });
    }
  }, [simulationState.tick]);

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'safe': return { icon: ShieldCheck, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-500/20' };
      case 'caution': return { icon: AlertTriangle, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/20' };
      case 'blocked': return { icon: Navigation, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20' };
      default: return { icon: Navigation, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700' };
    }
  };

  return (
    <div className="space-y-6 transition-colors">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Evacuation Routes</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Dynamic routing based on real-time flood inundation mapping.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-lg shadow-blue-500/20">
          Recalculate Routes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {routes.map((route) => {
            const config = getStatusConfig(route.status);
            const Icon = config.icon;
            
            return (
              <div key={route.id} className={`rounded-xl p-5 border ${config.bg} transition-all hover:shadow-md`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-white dark:bg-gray-900 shadow-sm ${config.color}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{route.name}</h3>
                      <span className={`text-xs font-medium uppercase tracking-wider ${config.color}`}>
                        {route.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-center">
                    <MapPin size={14} className="mr-1 text-gray-400" /> {route.origin}
                  </div>
                  <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700 border-dashed border-t"></div>
                  <div className="flex items-center font-medium text-gray-900 dark:text-gray-300">
                    <MapPin size={14} className="mr-1 text-blue-500" /> {route.destination}
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700/50">
                  <div className="flex items-center">
                    <Clock size={14} className="mr-1" /> {route.time}
                  </div>
                  <div className="flex items-center">
                    <Car size={14} className="mr-1" /> {route.distance}
                  </div>
                </div>

                {insights[route.id] && (
                  <div className="mt-4 pt-3 border-t border-green-100 dark:border-green-900/30">
                    <div className="flex items-center text-green-700 dark:text-green-400 text-xs font-semibold mb-2">
                      <Sparkles size={12} className="mr-1" /> AI Route Analysis
                    </div>
                    <p className="text-sm text-green-800 dark:text-green-200/80 leading-relaxed">
                      {insights[route.id]}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Map Placeholder for Routes */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
          <MapPin size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Interactive Route Map Integration</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Requires Leaflet & GeoJSON layers</p>
        </div>
      </div>
    </div>
  );
}
