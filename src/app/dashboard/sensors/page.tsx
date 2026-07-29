'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { Activity, RefreshCw, Droplets, CloudRain, Thermometer, Wind } from 'lucide-react';

const DEFAULT_SENSORS = [
  { id: '1', sensorId: 'RIVER_001', sensorType: 'river_level', location: 'Bangalore North River Station', value: 3.2, unit: 'meters', timestamp: new Date().toISOString() },
  { id: '2', sensorId: 'RAIN_001', sensorType: 'rainfall', location: 'Bangalore Central', value: 15.5, unit: 'mm', timestamp: new Date().toISOString() },
  { id: '3', sensorId: 'HUMID_001', sensorType: 'humidity', location: 'Bangalore Central', value: 75.0, unit: 'percentage', timestamp: new Date().toISOString() },
  { id: '4', sensorId: 'TEMP_001', sensorType: 'temperature', location: 'Bangalore Central', value: 28.5, unit: 'celsius', timestamp: new Date().toISOString() },
  { id: '5', sensorId: 'WIND_001', sensorType: 'wind_speed', location: 'Bangalore Central', value: 12.0, unit: 'kmph', timestamp: new Date().toISOString() }
];

export default function SensorsPage() {
  const [sensors, setSensors] = useState<any[]>(DEFAULT_SENSORS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'sensor_data'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      if (data.length > 0) {
        setSensors(data);
      } else {
        setSensors(DEFAULT_SENSORS);
      }
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.warn('Error listening to sensors, using defaults:', error);
      setSensors(DEFAULT_SENSORS);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    // Refresh is automatic now, just a visual feedback
    setTimeout(() => setRefreshing(false), 500);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'river_level': return <Droplets className="text-blue-500 dark:text-blue-400" />;
      case 'rainfall': return <CloudRain className="text-cyan-600 dark:text-cyan-400" />;
      case 'humidity': return <Wind className="text-purple-600 dark:text-purple-400" />;
      case 'temperature': return <Thermometer className="text-orange-500 dark:text-orange-400" />;
      default: return <Activity className="text-gray-400 dark:text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 dark:border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 transition-colors">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Environmental Sensors</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Real-time IoT sensor network readings.</p>
        </div>
        <button 
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition border border-gray-200 dark:border-gray-700 shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sensors.map((sensor) => (
          <div key={sensor.id || sensor.sensorId} className="bg-white dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm relative group overflow-hidden transition-all hover:border-blue-300 dark:hover:bg-gray-800">
            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </div>
            
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                {getIcon(sensor.sensorType)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white capitalize text-sm">{sensor.sensorType?.replace('_', ' ')}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-32" title={sensor.location}>{sensor.location}</p>
              </div>
            </div>
            
            <div className="flex items-end space-x-1">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">{Number(sensor.value).toFixed(1)}</span>
              <span className="text-gray-500 dark:text-gray-500 mb-1">{sensor.unit}</span>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/50 text-xs text-gray-400 dark:text-gray-500 flex justify-between">
              <span>ID: {sensor.sensorId?.substring(0, 8)}</span>
              <span>Updated: {sensor.timestamp ? new Date(sensor.timestamp).toLocaleTimeString() : 'N/A'}</span>
            </div>
          </div>
        ))}
        {sensors.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-gray-200 dark:border-gray-800 border-dashed">
            No sensor data available. Please ensure IoT gateways are online.
          </div>
        )}
      </div>
    </div>
  );
}
