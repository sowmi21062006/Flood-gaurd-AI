'use client';

import { Home, Users, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';

export default function SheltersPage() {
  const [shelters, setShelters] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'shelters'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setShelters(data);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6 transition-colors">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Shelter Management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Monitor capacity and dispatch supplies to active evacuation centers.</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-lg shadow-blue-500/20">
          <Plus size={16} className="mr-2" /> Activate Shelter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shelters.map((shelter) => {
          const occupancyRate = (shelter.occupancy / shelter.capacity) * 100;
          let statusColor = 'text-green-600 dark:text-green-400';
          let barColor = 'bg-green-500';
          
          if (occupancyRate >= 100) {
            statusColor = 'text-red-600 dark:text-red-400';
            barColor = 'bg-red-500';
          } else if (occupancyRate >= 85) {
            statusColor = 'text-orange-600 dark:text-orange-400';
            barColor = 'bg-orange-500';
          }

          return (
            <div key={shelter.id} className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Home size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{shelter.name}</h3>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Updated: {shelter.lastUpdated}</div>
                  </div>
                </div>
              </div>
              
              <div className="p-5 space-y-4">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400">
                      <Users size={16} className="mr-2" /> Occupancy
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      <span className={statusColor}>{shelter.occupancy}</span> / {shelter.capacity}
                    </div>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(occupancyRate, 100)}%` }}></div>
                  </div>
                  <div className="mt-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                    {occupancyRate.toFixed(1)}% Filled
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800/50 flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Supplies Status:</span>
                  <span className={`flex items-center text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    shelter.supplies === 'critical' || occupancyRate >= 100 ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 
                    shelter.supplies === 'adequate' || occupancyRate >= 85 ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 
                    'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'
                  }`}>
                    {shelter.supplies === 'critical' || occupancyRate >= 100 ? <AlertCircle size={12} className="mr-1" /> : <CheckCircle size={12} className="mr-1" />}
                    {occupancyRate >= 100 ? 'critical' : occupancyRate >= 85 ? 'adequate' : 'abundant'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
