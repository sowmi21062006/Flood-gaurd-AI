'use client';

import { useState } from 'react';
import {
  ShieldAlert, ShieldCheck, CloudRain, Thermometer, Wind,
  Droplets, MapPin, Navigation, Bell, Loader2, AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/components/SessionProvider';

interface SafetyResult {
  success: boolean;
  riskScore: number;
  riskLevel: 'SAFE' | 'WATCH' | 'HIGH' | 'CRITICAL';
  isInDangerZone: boolean;
  explanation: string;
  recommendedAction: string;
  userLocation: { lat: number; lng: number };
  dangerZone: {
    center: { lat: number; lng: number };
    radiusMeters: number;
    polygon: [number, number][];
  };
  nearestShelter: {
    name: string;
    lat: number;
    lng: number;
    capacity: number;
  };
  safeRoute: [number, number][];
  telegram: {
    attempted: boolean;
    sent: boolean;
    status: string;
  };
  message: string;
  weather: {
    temperature: number;
    humidity: number;
    precipitation: number;
    rain: number;
    windSpeed: number;
    forecastRainNext6Hours: number;
  };
  aiUsed: boolean;
}

type LoadingStep =
  | 'idle'
  | 'location'
  | 'weather'
  | 'ai'
  | 'shelter'
  | 'guidance'
  | 'done'
  | 'error';

const LOADING_STEPS: { key: LoadingStep; label: string; icon: any }[] = [
  { key: 'location', label: 'Getting your location...', icon: MapPin },
  { key: 'weather', label: 'Checking weather...', icon: CloudRain },
  { key: 'ai', label: 'Running AI risk prediction...', icon: ShieldAlert },
  { key: 'shelter', label: 'Finding safe shelter...', icon: Navigation },
  { key: 'guidance', label: 'Preparing safety guidance...', icon: ShieldCheck },
];

export default function DashboardPage() {
  const { user, userData } = useAuth();
  const [loadingStep, setLoadingStep] = useState<LoadingStep>('idle');
  const [safetyResult, setSafetyResult] = useState<SafetyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAmISafe = async () => {
    setError(null);
    setSafetyResult(null);
    setLoadingStep('location');

    let lat = 13.0827;
    let lng = 80.2707;

    // Step 1: Get GPS location
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 8000,
          enableHighAccuracy: true,
        });
      });
      lat = position.coords.latitude;
      lng = position.coords.longitude;
    } catch {
      // User denied or timeout — use Chennai demo coordinates
      console.log('[safety] Using demo coordinates (Chennai)');
    }

    // Step 2–5: Call backend
    setLoadingStep('weather');

    try {
      // Simulate step progression for UX
      await new Promise((r) => setTimeout(r, 600));
      setLoadingStep('ai');
      await new Promise((r) => setTimeout(r, 400));

      const response = await fetch('/api/safety/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lng,
          userId: user?.uid || 'demo-user',
          phoneNumber: userData?.phoneNumber || '',
          telegramChatId: userData?.telegramChatId || '',
          district: userData?.district || 'Chennai',
          language: userData?.language || 'english',
        }),
      });

      setLoadingStep('shelter');
      await new Promise((r) => setTimeout(r, 400));
      setLoadingStep('guidance');
      await new Promise((r) => setTimeout(r, 400));

      const result = await response.json();

      if (result.success) {
        setSafetyResult(result);
        setLoadingStep('done');
      } else {
        setError(result.error || 'Safety check failed');
        setLoadingStep('error');
      }
    } catch (err: any) {
      setError(err.message || 'Network error — please try again');
      setLoadingStep('error');
    }
  };

  const getRiskGradient = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'from-red-600 to-red-800';
      case 'HIGH': return 'from-orange-500 to-red-600';
      case 'WATCH': return 'from-yellow-500 to-orange-500';
      default: return 'from-green-500 to-emerald-600';
    }
  };

  const getRiskBg = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'HIGH': return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'WATCH': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default: return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    }
  };

  const getRiskEmoji = (level: string) => {
    switch (level) {
      case 'CRITICAL': return '🔴';
      case 'HIGH': return '🟠';
      case 'WATCH': return '⚠️';
      default: return '✅';
    }
  };

  return (
    <div className="space-y-6 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Welcome, {userData?.name || 'Citizen'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            FloodRakshak AI — Your Personal Disaster Safety Assistant
          </p>
        </div>
        {safetyResult && (
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getRiskBg(safetyResult.riskLevel)}`}>
            {getRiskEmoji(safetyResult.riskLevel)} {safetyResult.riskLevel}
          </span>
        )}
      </div>

      {/* Am I Safe? Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 md:p-10 shadow-xl shadow-blue-500/20 text-white">
        <div className="absolute top-0 right-0 opacity-10">
          <ShieldCheck size={200} />
        </div>
        <div className="relative z-10 text-center max-w-xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight">
            🛡️ Am I Safe?
          </h2>
          <p className="text-blue-100 mb-6 text-sm md:text-base leading-relaxed">
            Check your real-time flood risk using live weather data, AI prediction, and your GPS location. 
            Get instant Telegram alerts if danger is detected.
          </p>
          <button
            onClick={handleAmISafe}
            disabled={loadingStep !== 'idle' && loadingStep !== 'done' && loadingStep !== 'error'}
            className="px-10 py-4 bg-white text-blue-700 font-extrabold text-lg rounded-xl shadow-lg hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 uppercase tracking-wider"
          >
            {loadingStep === 'idle' || loadingStep === 'done' || loadingStep === 'error'
              ? '🛡️ Check My Safety'
              : '⏳ Checking...'}
          </button>
        </div>
      </div>

      {/* Loading Progress */}
      {loadingStep !== 'idle' && loadingStep !== 'done' && loadingStep !== 'error' && (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">
            Safety Check Progress
          </h3>
          <div className="space-y-3">
            {LOADING_STEPS.map((step) => {
              const stepIndex = LOADING_STEPS.findIndex((s) => s.key === step.key);
              const currentIndex = LOADING_STEPS.findIndex((s) => s.key === loadingStep);
              const isComplete = stepIndex < currentIndex;
              const isCurrent = step.key === loadingStep;
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex items-center space-x-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isComplete
                      ? 'bg-green-500 text-white'
                      : isCurrent
                        ? 'bg-blue-500 text-white animate-pulse'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  }`}>
                    {isComplete ? '✓' : isCurrent ? <Loader2 size={14} className="animate-spin" /> : stepIndex + 1}
                  </div>
                  <Icon size={16} className={isComplete ? 'text-green-500' : isCurrent ? 'text-blue-500' : 'text-gray-400'} />
                  <span className={`text-sm font-medium ${
                    isComplete ? 'text-green-700 dark:text-green-400' : isCurrent ? 'text-blue-700 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start space-x-3">
          <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-red-800 dark:text-red-300 text-sm font-semibold">Safety check failed</p>
            <p className="text-red-600 dark:text-red-400 text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Safety Result */}
      {safetyResult && loadingStep === 'done' && (
        <div className="space-y-6">
          {/* Risk Score Card */}
          <div className={`rounded-2xl p-6 border shadow-sm ${getRiskBg(safetyResult.riskLevel)}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getRiskGradient(safetyResult.riskLevel)} flex items-center justify-center shadow-lg`}>
                  <span className="text-white text-3xl font-extrabold">{safetyResult.riskScore}</span>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                    {getRiskEmoji(safetyResult.riskLevel)} {safetyResult.riskLevel}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {safetyResult.isInDangerZone ? '⚠️ You are in a danger zone' : '✅ You are outside the danger zone'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {safetyResult.aiUsed ? '🤖 AI-enhanced prediction' : '📊 Rule-based prediction (demo)'}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Score: <strong>{safetyResult.riskScore}/100</strong>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
            <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{safetyResult.message}</p>
          </div>

          {/* Explanation & Action */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                📋 Explanation
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {safetyResult.explanation}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                🏃 Recommended Action
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {safetyResult.recommendedAction}
              </p>
            </div>
          </div>

          {/* Weather & Shelter & Telegram */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Weather */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                🌦️ Current Weather
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <Thermometer size={14} className="mr-2 text-orange-500" /> Temperature
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{safetyResult.weather.temperature}°C</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <CloudRain size={14} className="mr-2 text-blue-500" /> Rain
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{safetyResult.weather.rain}mm</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <Droplets size={14} className="mr-2 text-cyan-500" /> Humidity
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{safetyResult.weather.humidity}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <Wind size={14} className="mr-2 text-purple-500" /> Wind
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{safetyResult.weather.windSpeed} km/h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <CloudRain size={14} className="mr-2 text-indigo-500" /> 6hr Forecast
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{safetyResult.weather.forecastRainNext6Hours}mm</span>
                </div>
              </div>
            </div>

            {/* Nearest Shelter */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                🏥 Nearest Safe Shelter
              </h3>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{safetyResult.nearestShelter.name}</p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Capacity: <strong>{safetyResult.nearestShelter.capacity}</strong> people
                </div>
                <a
                  href={`https://www.google.com/maps/dir/${safetyResult.userLocation.lat},${safetyResult.userLocation.lng}/${safetyResult.nearestShelter.lat},${safetyResult.nearestShelter.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-sm"
                >
                  <Navigation size={12} className="mr-1.5" /> Open in Google Maps
                </a>
              </div>
            </div>

            {/* Telegram Status */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                📲 Telegram Alert
              </h3>
              <div className="space-y-3">
                <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                  safetyResult.telegram.sent
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : safetyResult.telegram.attempted
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {safetyResult.telegram.sent ? '✅ Alert Sent' : safetyResult.telegram.attempted ? '⚠️ Attempted' : '— Not triggered'}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{safetyResult.telegram.status}</p>
              </div>
            </div>
          </div>

          {/* View on Map Link */}
          <div className="text-center">
            <a
              href="/dashboard/map"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-500/20"
            >
              <MapPin size={16} className="mr-2" />
              View Danger Zone & Shelter on Map
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
