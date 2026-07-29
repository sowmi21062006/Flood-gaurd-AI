import { NextRequest, NextResponse } from 'next/server';

// Default coordinates for Bangalore (demo city)
const DEFAULT_LAT = 12.9716;
const DEFAULT_LON = 77.5946;

// Fallback weather data in case Open-Meteo API is unreachable
const FALLBACK_WEATHER = {
  temperature: 28.2,
  humidity: 85,
  precipitation: 15.4,
  rain: 10.2,
  windSpeed: 14.5,
  isFallback: true
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('latitude') || String(DEFAULT_LAT));
    const lon = parseFloat(searchParams.get('longitude') || String(DEFAULT_LON));

    // Construct the Open-Meteo API request URL
    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m`;

    const response = await fetch(openMeteoUrl, { next: { revalidate: 300 } }); // Cache for 5 mins
    if (!response.ok) {
      throw new Error(`Open-Meteo status error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.current) {
      throw new Error("Current weather metrics not returned from Open-Meteo");
    }

    const currentWeather = {
      temperature: data.current.temperature_2m || 25,
      humidity: data.current.relative_humidity_2m || 75,
      precipitation: data.current.precipitation || 0,
      rain: data.current.rain || 0,
      windSpeed: data.current.wind_speed_10m || 0,
      isFallback: false
    };

    return NextResponse.json({ success: true, weather: currentWeather });
  } catch (error) {
    console.warn("Weather API call failed. Using mock data fallback:", error);
    return NextResponse.json({ success: true, weather: FALLBACK_WEATHER });
  }
}
