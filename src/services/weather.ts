import { adminDb } from '@/lib/firebase/admin';

export interface WeatherData {
  rainfall: number; // mm/hr
  temperature: number; // C
  humidity: number; // %
  windSpeed: number; // km/h
  pressure: number; // hPa
  timestamp: string;
}

/**
 * OpenWeatherMap Mock Service
 * In a production app, this would make an axios call to api.openweathermap.org
 */
export async function fetchLiveWeather(lat: number, lon: number): Promise<WeatherData> {
  // If API key is not present, use stochastic simulation mode
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  
  if (apiKey && apiKey !== 'demo') {
    // Production behavior would go here
    // return await axios.get(...)
  }

  // Simulation Mode: Fetch previous reading from Firestore to create continuous realistic trends
  let lastRainfall = 0;
  let lastTemp = 28.5;
  let lastHumid = 65;
  let lastWind = 12;
  let lastPress = 1012;

  try {
    const recentWeather = await adminDb.collection('weather_logs')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();
      
    if (!recentWeather.empty) {
      const data = recentWeather.docs[0].data();
      lastRainfall = data.rainfall;
      lastTemp = data.temperature;
      lastHumid = data.humidity;
      lastWind = data.windSpeed;
      lastPress = data.pressure;
    }
  } catch (e) {
    console.warn("Weather simulation: Could not fetch previous data", e);
  }

  // Generate stochastic delta (Random walk)
  const isStorming = lastRainfall > 10;
  
  // Rain trends up aggressively if storming, otherwise random walk
  let rainDelta = isStorming ? (Math.random() * 15 - 5) : (Math.random() * 5 - 2);
  let newRainfall = Math.max(0, Math.min(150, lastRainfall + rainDelta)); // cap at 150mm/hr

  // Humidity correlates with rain
  let newHumidity = Math.max(30, Math.min(100, lastHumid + (newRainfall > 0 ? (Math.random() * 5) : (Math.random() * 4 - 2))));

  // Temperature inversely correlates with rain
  let newTemp = Math.max(15, Math.min(45, lastTemp + (newRainfall > 0 ? (Math.random() * -1) : (Math.random() * 2 - 1))));

  // Wind speeds up during storms
  let newWind = Math.max(0, Math.min(150, lastWind + (isStorming ? (Math.random() * 10 - 2) : (Math.random() * 4 - 2))));

  const currentData: WeatherData = {
    rainfall: Number(newRainfall.toFixed(1)),
    temperature: Number(newTemp.toFixed(1)),
    humidity: Number(newHumidity.toFixed(0)),
    windSpeed: Number(newWind.toFixed(1)),
    pressure: Number(lastPress.toFixed(0)),
    timestamp: new Date().toISOString(),
  };

  // Save to DB for next iteration
  await adminDb.collection('weather_logs').add(currentData);

  return currentData;
}
