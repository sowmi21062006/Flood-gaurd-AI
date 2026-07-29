/**
 * Open-Meteo Weather Service
 * Fetches current weather + hourly forecast. No API key needed.
 */

export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  rain: number;
  windSpeed: number;
  forecastRainNext6Hours: number;
}

const DEMO_WEATHER: WeatherData = {
  temperature: 29,
  humidity: 88,
  precipitation: 12,
  rain: 18,
  windSpeed: 25,
  forecastRainNext6Hours: 72,
};

export async function fetchCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m&hourly=precipitation,rain,relative_humidity_2m,wind_speed_10m&forecast_days=1`;

    const response = await fetch(url, { next: { revalidate: 300 } });

    if (!response.ok) {
      console.warn('[open-meteo] API returned status', response.status, '- using demo weather');
      return DEMO_WEATHER;
    }

    const data = await response.json();

    const current = data.current || {};
    const hourly = data.hourly || {};

    // Sum rain for next 6 hours from current hour
    const currentHour = new Date().getHours();
    const hourlyRain: number[] = hourly.rain || [];
    const forecastRainNext6Hours = hourlyRain
      .slice(currentHour, currentHour + 6)
      .reduce((sum: number, val: number) => sum + (val || 0), 0);

    return {
      temperature: current.temperature_2m ?? DEMO_WEATHER.temperature,
      humidity: current.relative_humidity_2m ?? DEMO_WEATHER.humidity,
      precipitation: current.precipitation ?? DEMO_WEATHER.precipitation,
      rain: current.rain ?? DEMO_WEATHER.rain,
      windSpeed: current.wind_speed_10m ?? DEMO_WEATHER.windSpeed,
      forecastRainNext6Hours: forecastRainNext6Hours || DEMO_WEATHER.forecastRainNext6Hours,
    };
  } catch (error) {
    console.error('[open-meteo] Failed to fetch weather:', error);
    return DEMO_WEATHER;
  }
}
