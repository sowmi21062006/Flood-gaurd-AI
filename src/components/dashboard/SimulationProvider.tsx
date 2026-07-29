'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase/config';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { GlobalSimulationState, INITIAL_SIMULATION_STATE } from '@/lib/simulation-state';

interface SimulationContextType {
  simulationState: GlobalSimulationState;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
}

const SimulationContext = createContext<SimulationContextType | null>(null);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [simulationState, setSimulationState] = useState<GlobalSimulationState>(INITIAL_SIMULATION_STATE);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const isDemoActive = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || (typeof window !== 'undefined' && localStorage.getItem('demo_mode') === 'true');
    setIsDemoMode(isDemoActive);
  }, []);

  // 1. Listen to Firestore Global State
  useEffect(() => {
    if (isDemoMode) {
      return;
    }
    const docRef = doc(db, 'global_simulation', 'master');
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setSimulationState(snap.data() as GlobalSimulationState);
      } else {
        // Initialize if doesn't exist
        setDoc(docRef, INITIAL_SIMULATION_STATE);
      }
    }, (error) => {
      console.warn("Firestore listener failed, switching to local demo mode", error);
      setIsDemoMode(true);
    });

    return () => unsubscribe();
  }, [isDemoMode]);

  const runLocalTick = () => {
    setSimulationState((prev) => {
      const newTick = prev.tick + 1;
      const progress = Math.min(newTick / 20, 1);
      
      const newRainfall = 10 + progress * (185 - 10);
      const newRiverLevel = 2.1 + progress * (8.2 - 2.1);
      const newHumidity = 60 + progress * (94 - 60);
      const newFloodProbability = 5 + progress * (91 - 5);
      const newRiskScore = 10 + progress * (90 - 10);

      let newRiskLevel: 'NORMAL' | 'WARNING' | 'SEVERE' | 'CRITICAL' = 'NORMAL';
      if (newRiskScore >= 90) newRiskLevel = 'CRITICAL';
      else if (newRiskScore >= 70) newRiskLevel = 'SEVERE';
      else if (newRiskScore >= 30) newRiskLevel = 'WARNING';

      return {
        ...prev,
        tick: newTick,
        rainfall: parseFloat(newRainfall.toFixed(2)),
        riverLevel: parseFloat(newRiverLevel.toFixed(2)),
        humidity: parseFloat(newHumidity.toFixed(2)),
        floodProbability: parseFloat(newFloodProbability.toFixed(2)),
        riskScore: parseFloat(newRiskScore.toFixed(2)),
        riskLevel: newRiskLevel,
        updatedAt: new Date().toISOString()
      };
    });
  };

  // 2. Manage the 5-second tick loop based on status
  useEffect(() => {
    if (simulationState.status === 'RUNNING') {
      if (!tickIntervalRef.current) {
        tickIntervalRef.current = setInterval(() => {
          if (isDemoMode) {
            runLocalTick();
          } else {
            fetch('/api/simulation/tick', { method: 'POST' }).catch((err) => {
              console.warn("Simulation tick failed, running locally", err);
              runLocalTick();
            });
          }
        }, 5000);
      }
    } else {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    }

    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    };
  }, [simulationState.status, isDemoMode]);

  const startSimulation = () => {
    if (isDemoMode) {
      setSimulationState(prev => ({ ...prev, status: 'RUNNING' }));
    } else {
      fetch('/api/simulation/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      }).catch((err) => {
        console.warn("Using local simulation fallback", err);
        setSimulationState(prev => ({ ...prev, status: 'RUNNING' }));
      });
    }
  };

  const pauseSimulation = () => {
    if (isDemoMode) {
      setSimulationState(prev => ({ ...prev, status: 'PAUSED' }));
    } else {
      fetch('/api/simulation/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause' }),
      }).catch((err) => {
        console.warn("Using local simulation fallback", err);
        setSimulationState(prev => ({ ...prev, status: 'PAUSED' }));
      });
    }
  };

  const resetSimulation = () => {
    if (isDemoMode) {
      setSimulationState({ ...INITIAL_SIMULATION_STATE, status: 'IDLE' });
    } else {
      fetch('/api/simulation/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      }).catch((err) => {
        console.warn("Using local simulation fallback", err);
        setSimulationState({ ...INITIAL_SIMULATION_STATE, status: 'IDLE' });
      });
    }
  };

  return (
    <SimulationContext.Provider value={{ simulationState, startSimulation, pauseSimulation, resetSimulation }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
}
