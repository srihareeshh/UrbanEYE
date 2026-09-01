/**
 * Weather & Environmental Risk Service
 * Provides grounded, category-sensitive meteorological context for civic risk calculations.
 */

export class WeatherService {
  constructor(options = {}) {
    this.providerName = options.provider || 'open_meteo_live';
    this.cache = new Map();
  }

  /**
   * Retrieves weather context for given GPS and category
   */
  async getContext(latitude, longitude, timestamp = Date.now(), category = 'General') {
    const lat = Number(latitude) || 19.0760;
    const lng = Number(longitude) || 72.8777;
    const date = new Date(timestamp || Date.now());
    const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}`;

    let weatherData = null;
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < 600000) { // 10-min cache
      weatherData = cached.data;
    }

    if (!weatherData) {
      weatherData = {
        temperatureC: 28,
        precipitationMm: 0.0,
        rainfallProbability: 10,
        windSpeedKmh: 12,
        weatherCode: 0,
        isRaining: false,
        isStormy: false,
        conditionSummary: 'Clear Weather Conditions'
      };

      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current=temperature_2m,precipitation,weather_code,wind_speed_10m&timezone=auto`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          const current = json.current || {};
          const precip = Number(current.precipitation || 0);
          const code = Number(current.weather_code || 0);
          const wind = Number(current.wind_speed_10m || 10);
          const temp = Number(current.temperature_2m || 28);

          const isRain = precip > 0.5 || (code >= 51 && code <= 67) || (code >= 80 && code <= 82);
          const isStorm = (code >= 95 && code <= 99) || wind > 40;

          let summary = 'Clear Weather';
          if (isStorm) summary = 'Thunderstorm & High Winds Alert';
          else if (precip > 15) summary = 'Heavy Rainfall Alert';
          else if (isRain) summary = 'Light to Moderate Rainfall';
          else if (temp > 38) summary = 'High Heat Conditions';

          weatherData = {
            temperatureC: temp,
            precipitationMm: precip,
            rainfallProbability: isRain ? 80 : 15,
            windSpeedKmh: wind,
            weatherCode: code,
            isRaining: isRain,
            isStormy: isStorm,
            conditionSummary: summary
          };
        }
      } catch (fetchErr) {
        const month = date.getMonth();
        const isMonsoonSeason = month >= 5 && month <= 9;

        weatherData = {
          temperatureC: 29,
          precipitationMm: isMonsoonSeason ? 2.5 : 0.0,
          rainfallProbability: isMonsoonSeason ? 35 : 10,
          windSpeedKmh: 14,
          weatherCode: isMonsoonSeason ? 51 : 0,
          isRaining: false,
          isStormy: false,
          conditionSummary: isMonsoonSeason ? 'Normal Seasonal Weather' : 'Clear Weather Conditions'
        };
      }

      this.cache.set(cacheKey, { timestamp: Date.now(), data: weatherData });
    }

    // Category-specific environmental risk evaluation (0-100)
    let weatherScore = 10;
    const catLower = (category || '').toLowerCase();

    if (weatherData.isStormy) {
      if (catLower.includes('electr') || catLower.includes('power')) weatherScore = 85;
      else if (catLower.includes('water') || catLower.includes('flood') || catLower.includes('drain')) weatherScore = 90;
      else if (catLower.includes('road') || catLower.includes('tree')) weatherScore = 80;
      else weatherScore = 65;
    } else if (weatherData.precipitationMm > 15) {
      if (catLower.includes('water') || catLower.includes('flood') || catLower.includes('drain')) weatherScore = 85;
      else if (catLower.includes('road')) weatherScore = 70;
      else if (catLower.includes('electr')) weatherScore = 40;
      else weatherScore = 30;
    } else if (weatherData.isRaining) {
      if (catLower.includes('water') || catLower.includes('flood')) weatherScore = 55;
      else if (catLower.includes('road')) weatherScore = 40;
      else weatherScore = 15;
    } else {
      weatherScore = 10;
    }

    return {
      provider: this.providerName,
      latitude: lat,
      longitude: lng,
      timestamp: date.toISOString(),
      temperature_c: weatherData.temperatureC,
      precipitation_mm: weatherData.precipitationMm,
      rainfall_probability: weatherData.rainfallProbability,
      wind_speed_kmh: weatherData.windSpeedKmh,
      severe_weather: weatherData.isStormy,
      flood_warning: weatherData.precipitationMm > 30,
      is_raining: weatherData.isRaining,
      weather_score: weatherScore,
      condition_summary: weatherData.conditionSummary
    };
  }
}

export const weatherService = new WeatherService();
