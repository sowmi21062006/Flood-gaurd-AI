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
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Listen to Firestore Global State
  useEffect(() => {
    const docRef = doc(db, 'global_simulation', 'master');
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setSimulationState(snap.data() as GlobalSimulationState);
      } else {
        // Initialize if doesn't exist
        setDoc(docRef, INITIAL_SIMULATION_STATE);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Manage the 5-second tick loop based on status
  useEffect(() => {
    if (simulationState.status === 'RUNNING') {
      if (!tickIntervalRef.current) {
        tickIntervalRef.current = setInterval(() => {
          // Call backend to process the tick securely
          fetch('/api/simulation/tick', { method: 'POST' }).catch(console.error);
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
  }, [simulationState.status]);

  const startSimulation = () => {
    fetch('/api/simulation/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' }),
    }).catch(console.error);
  };

  const pauseSimulation = () => {
    fetch('/api/simulation/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pause' }),
    }).catch(console.error);
  };

  const resetSimulation = () => {
    fetch('/api/simulation/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset' }),
    }).catch(console.error);
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
