/**
 * Rule-Based Risk Engine
 * Calculates flood risk score from weather data using weighted formula.
 */

import { WeatherData } from './open-meteo';

export interface RiskResult {
  riskScore: number;
  riskLevel: 'SAFE' | 'WATCH' | 'HIGH' | 'CRITICAL';
  isInDangerZone: boolean;
  explanation: string;
  recommendedAction: string;
}

// Known high-risk demo coordinates (lat ranges)
const HIGH_RISK_DEMO_ZONES: Array<{ lat: number; lng: number; name: string }> = [
  { lat: 13.0827, lng: 80.2707, name: 'Chennai' },     // Chennai
  { lat: 12.9716, lng: 77.5946, name: 'Bangalore' },   // Bangalore
  { lat: 19.0760, lng: 72.8777, name: 'Mumbai' },      // Mumbai
];

function normalize(value: number, min: number, max: number): number {
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

function getLocationBaseRisk(lat: number, lng: number): number {
  // Check proximity to known flood-prone demo cities
  for (const zone of HIGH_RISK_DEMO_ZONES) {
    const dist = Math.sqrt(Math.pow(lat - zone.lat, 2) + Math.pow(lng - zone.lng, 2));
    if (dist < 0.5) return 65; // Close to a demo city → high base risk
    if (dist < 1.0) return 40;
  }
  return 20; // Default base risk
}

function classifyRisk(score: number): 'SAFE' | 'WATCH' | 'HIGH' | 'CRITICAL' {
  if (score >= 81) return 'CRITICAL';
  if (score >= 61) return 'HIGH';
  if (score >= 31) return 'WATCH';
  return 'SAFE';
}

export function calculateFallbackRisk(weather: WeatherData, lat: number, lng: number): RiskResult {
  const rainScore = normalize(weather.rain, 0, 50);
  const forecastRainScore = normalize(weather.forecastRainNext6Hours, 0, 100);
  const humidityScore = normalize(weather.humidity, 40, 100);
  const windScore = normalize(weather.windSpeed, 0, 80);
  const locationBaseRisk = getLocationBaseRisk(lat, lng);

  const riskScore = Math.round(
    rainScore * 0.35 +
    forecastRainScore * 0.25 +
    humidityScore * 0.15 +
    windScore * 0.10 +
    locationBaseRisk * 0.15
  );

  const riskLevel = classifyRisk(riskScore);
  const isInDangerZone = riskLevel === 'HIGH' || riskLevel === 'CRITICAL';

  let explanation: string;
  let recommendedAction: string;

  switch (riskLevel) {
    case 'CRITICAL':
      explanation = `Extreme flood risk detected. Current rainfall: ${weather.rain}mm, forecast rain next 6h: ${weather.forecastRainNext6Hours}mm, humidity: ${weather.humidity}%, wind: ${weather.windSpeed}km/h. Your area is in immediate danger.`;
      recommendedAction = 'EVACUATE IMMEDIATELY to the nearest safe shelter. Avoid low-lying areas, bridges, and waterways. Follow official instructions.';
      break;
    case 'HIGH':
      explanation = `High flood risk. Rainfall: ${weather.rain}mm with ${weather.forecastRainNext6Hours}mm expected in 6 hours. Humidity at ${weather.humidity}%. Conditions are deteriorating.`;
      recommendedAction = 'Prepare to evacuate. Pack essential documents and supplies. Move to higher ground if water starts rising. Stay alert for updates.';
      break;
    case 'WATCH':
      explanation = `Moderate conditions. Rain: ${weather.rain}mm, forecast: ${weather.forecastRainNext6Hours}mm in 6h. Humidity: ${weather.humidity}%. Monitor closely.`;
      recommendedAction = 'Stay informed. Keep emergency kit ready. Avoid unnecessary travel near rivers and low areas. Monitor weather updates.';
      break;
    default:
      explanation = `Conditions are normal. Temperature: ${weather.temperature}°C, rainfall: ${weather.rain}mm, humidity: ${weather.humidity}%. No immediate flood threat.`;
      recommendedAction = 'No action needed. Stay aware of weather changes. Ensure your emergency contacts are up to date.';
  }

  return { riskScore, riskLevel, isInDangerZone, explanation, recommendedAction };
}
