'use client';

import dynamic from 'next/dynamic';
import { MapPin, Loader2, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/components/SessionProvider';
import type { SafetyMapData } from '@/components/dashboard/MapComponent';

// Dynamic import of MapComponent with SSR disabled
const MapComponent = dynamic(() => import('@/components/dashboard/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-800">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      <span className="ml-3 text-gray-500 dark:text-gray-400 font-medium">Loading Map...</span>
    </div>
  ),
});

export default function MapPage() {
  const { user, userData } = useAuth();
  const [safetyData, setSafetyData] = useState<SafetyMapData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheckSafety = async () => {
    setLoading(true);
    let lat = 13.0827;
    let lng = 80.2707;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, enableHighAccuracy: true });
      });
      lat = position.coords.latitude;
      lng = position.coords.longitude;
    } catch {
      // Use Chennai demo
    }

    try {
      const response = await fetch('/api/safety/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat, lng,
          userId: user?.uid || 'demo-user',
          phoneNumber: userData?.phoneNumber || '',
          telegramChatId: userData?.telegramChatId || '',
          district: userData?.district || 'Chennai',
          language: userData?.language || 'english',
        }),
      });
      const result = await response.json();
      if (result.success) {
        setSafetyData({
          userLocation: result.userLocation,
          dangerZone: result.dangerZone,
          nearestShelter: result.nearestShelter,
          safeRoute: result.safeRoute,
          riskLevel: result.riskLevel,
          riskScore: result.riskScore,
        });
      }
    } catch (err) {
      console.error('[map] Safety check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] transition-colors relative z-0">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4 z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Safety Map</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            View your danger zone, nearest shelter, and safe evacuation route.
          </p>
        </div>
        <button
          onClick={handleCheckSafety}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center text-sm font-bold transition shadow-lg shadow-blue-500/20"
        >
          {loading ? (
            <><Loader2 size={16} className="mr-2 animate-spin" /> Checking...</>
          ) : (
            <><ShieldCheck size={16} className="mr-2" /> Check My Safety on Map</>
          )}
        </button>
      </div>

      <div className="flex-1 relative rounded-2xl overflow-hidden shadow-sm z-0">
        <MapComponent safetyData={safetyData} />

        {/* Map Legend */}
        <div className="absolute top-4 left-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-lg z-[1000] max-w-xs transition-colors pointer-events-auto">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Map Legend</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center">
              <span className="w-4 h-4 rounded-full bg-blue-500 mr-3 flex-shrink-0"></span>
              <span className="text-gray-700 dark:text-gray-300">Your Location</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 rounded bg-red-500/50 border border-red-500 mr-3 flex-shrink-0"></span>
              <span className="text-gray-700 dark:text-gray-300">Danger Zone</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 rounded-full bg-green-500 mr-3 flex-shrink-0"></span>
              <span className="text-gray-700 dark:text-gray-300">Safe Shelter</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-1 bg-green-500 mr-3 flex-shrink-0" style={{ borderTop: '2px dashed #22c55e' }}></span>
              <span className="text-gray-700 dark:text-gray-300">Evacuation Route (Demo)</span>
            </div>
          </div>
        </div>

        {/* Risk Badge */}
        {safetyData && (
          <div className={`absolute top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-[1000] text-sm font-bold text-white pointer-events-auto ${
            safetyData.riskLevel === 'CRITICAL' ? 'bg-red-600' :
            safetyData.riskLevel === 'HIGH' ? 'bg-orange-500' :
            safetyData.riskLevel === 'WATCH' ? 'bg-yellow-500 text-gray-900' :
            'bg-green-500'
          }`}>
            {safetyData.riskLevel} — Score: {safetyData.riskScore}/100
          </div>
        )}
      </div>
    </div>
  );
}
