'use client';

import { Menu, Bell, Sun, Moon, Play, Pause, RotateCcw } from 'lucide-react';
import { useAuth } from '@/components/SessionProvider';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useSimulation } from './SimulationProvider';

export function TopNav({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, userData } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { simulationState, startSimulation, pauseSimulation, resetSimulation } = useSimulation();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-white/80 dark:bg-gray-900/80 px-4 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 lg:px-8 transition-colors">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="mr-4 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white lg:hidden"
        >
          <Menu size={24} />
        </button>
        
        {/* Master Simulation Controls */}
        <div className="hidden md:flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 ml-4">
          <div className="px-3 py-1 flex items-center space-x-2 border-r border-gray-200 dark:border-gray-700">
            <span className={`w-2 h-2 rounded-full ${simulationState.status === 'RUNNING' ? 'bg-green-500 animate-pulse' : simulationState.status === 'PAUSED' ? 'bg-yellow-500' : 'bg-gray-400'}`}></span>
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 tracking-wider">
              TICK: {simulationState.tick}
            </span>
          </div>
          
          {simulationState.status !== 'RUNNING' ? (
            <button 
              onClick={startSimulation}
              className="p-1.5 text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400 hover:bg-white dark:hover:bg-gray-700 rounded transition shadow-sm"
              title="Start Global Simulation"
            >
              <Play size={16} />
            </button>
          ) : (
            <button 
              onClick={pauseSimulation}
              className="p-1.5 text-gray-600 hover:text-yellow-600 dark:text-gray-300 dark:hover:text-yellow-400 hover:bg-white dark:hover:bg-gray-700 rounded transition shadow-sm"
              title="Pause Global Simulation"
            >
              <Pause size={16} />
            </button>
          )}
          
          <button 
            onClick={resetSimulation}
            className="p-1.5 text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 hover:bg-white dark:hover:bg-gray-700 rounded transition shadow-sm"
            title="Reset Global Simulation"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          {mounted && theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-gray-700">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white leading-none">
              {userData?.name || user?.displayName || 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
              {userData?.role || 'Guest'}
            </p>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {(userData?.name || user?.displayName || 'U').charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
