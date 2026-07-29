export type SimulationStatus = 'IDLE' | 'RUNNING' | 'PAUSED';
export type RiskLevel = 'NORMAL' | 'WARNING' | 'SEVERE' | 'CRITICAL';

export interface GlobalSimulationState {
  status: SimulationStatus;
  city: string;
  tick: number;
  rainfall: number;
  riverLevel: number;
  humidity: number;
  temperature: number;
  windSpeed: number;
  soilMoisture: number;
  floodProbability: number;
  riskScore: number;
  riskLevel: RiskLevel;
  affectedPopulation: number;
  workflowId: string | null;
  updatedAt: string;
}

export const INITIAL_SIMULATION_STATE: GlobalSimulationState = {
  status: 'IDLE',
  city: 'Bengaluru',
  tick: 0,
  rainfall: 10,
  riverLevel: 2.1,
  humidity: 60,
  temperature: 28,
  windSpeed: 12,
  soilMoisture: 30,
  floodProbability: 5,
  riskScore: 10,
  riskLevel: 'NORMAL',
  affectedPopulation: 0,
  workflowId: null,
  updatedAt: new Date().toISOString(),
};
