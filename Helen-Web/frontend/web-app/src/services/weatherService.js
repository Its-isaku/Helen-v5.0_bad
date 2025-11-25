/**
 * Weather Service: WeatherAPI.com - Compatible with both location and coordinates
 */

class EventEmitter {
  constructor() {
    this.events = {};
  }
  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }
  emit(event, ...args) {
    if (!this.events[event]) return;
    this.events[event].forEach(cb => cb(...args));
  }
}

class WeatherService extends EventEmitter {
    constructor() {
        super();
        
        this.apiKey = import.meta.env.VITE_WEATHER_API_KEY;
        this.baseUrl = import.meta.env.VITE_WEATHER_API_URL || 'https://api.weatherapi.com/v1';
        
        if (!this.apiKey) {
            // Log error if weather API key is not configured
            console.error('VITE_WEATHER_API_KEY not configured!');
        }
        
        this.defaultLocation = 'Tijuana,Mexico'; // Default location
        
        this.cache = new Map();
        this.CACHE_DURATION = 10 * 60 * 1000;
        this.pendingRequests = new Map();
    }

    async makeRequest(endpoint, params = {}) {
        if (!this.apiKey) {
            throw new Error('Weather API key not configured');
        }

        const queryParams = {
            key: this.apiKey,
            ...params
        };
        
        const queryString = new URLSearchParams(queryParams).toString();
        const url = `${this.baseUrl}/${endpoint}?${queryString}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorText = await response.text();
            // Log API error with status
            console.error(`API Error ${response.status}:`, errorText);
            throw new Error(`Weather API error: ${response.status}`);
        }
        
        return response.json();
    }

    // Support both location string and lat/lon coordinates
    resolveLocation(latOrLocation, lon) {
        // If first parameter is a string, use as location
        if (typeof latOrLocation === 'string') {
            return latOrLocation;
        }
        
        // If latitude/longitude provided, convert to coordinates string
        if (typeof latOrLocation === 'number' && typeof lon === 'number') {
            return `${latOrLocation},${lon}`;
        }
        
        // Use default location if none provided
        return this.defaultLocation;
    }

    async getCurrentWeather(latOrLocation = null, lon = null, lang = 'es') {
        try {
            const location = this.resolveLocation(latOrLocation, lon);
            
            const cacheKey = `current_${location}`;
            const cached = this.cache.get(cacheKey);
            // Return cached data if valid
            if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
                return cached.data;
            }
            // Await pending request if exists
            if (this.pendingRequests.has(cacheKey)) {
                return await this.pendingRequests.get(cacheKey);
            }
            
            const requestPromise = (async () => {
                const response = await this.makeRequest('current.json', {
                    q: location,
                    aqi: 'no',
                    lang: lang || 'es'
                });
                return this.formatCurrentWeather(response);
            })();
            
            this.pendingRequests.set(cacheKey, requestPromise);
            
            try {
                const formatted = await requestPromise;
                
                this.cache.set(cacheKey, {
                    data: formatted,
                    timestamp: Date.now()
                });
                
                // Emit weather updated event
                this.emit('weather:updated', formatted);
                return formatted;
                
            } finally {
                this.pendingRequests.delete(cacheKey);
            }
            
        } catch (error) {
            // Log error if unable to fetch weather
            console.error('Error fetching weather:', error.message);
            throw error;
        }
    }

    async getForecast(latOrLocation = null, lonOrDays = null, langOrIgnored = 'es') {
        try {
            // Support both signatures:
            // getForecast(lat, lon, lang) - from component
            // getForecast(location, days, lang) - direct call
            
            let location;
            let days = 5;
            let lang = 'es';
            
            if (typeof latOrLocation === 'string') {
                // String location provided
                location = latOrLocation;
                days = typeof lonOrDays === 'number' ? lonOrDays : 5;
                lang = langOrIgnored || 'es';
            } else if (typeof latOrLocation === 'number' && typeof lonOrDays === 'number') {
                // Lat/lon coordinates provided
                location = `${latOrLocation},${lonOrDays}`;
                days = 5;
                lang = langOrIgnored || 'es';
            } else {
                // No params, use default
                location = this.defaultLocation;
            }
            
            const cacheKey = `forecast_${location}_${days}`;
            const cached = this.cache.get(cacheKey);
            // Return cached forecast if valid
            if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
                return cached.data;
            }
            
            const response = await this.makeRequest('forecast.json', {
                q: location,
                days: days,
                aqi: 'no',
                alerts: 'no',
                lang: lang
            });
            
            const formatted = this.formatForecast(response);
            
            this.cache.set(cacheKey, {
                data: formatted,
                timestamp: Date.now()
            });
            
            return formatted;
            
        } catch (error) {
            // Log error if unable to fetch forecast
            console.error('Error fetching forecast:', error.message);
            throw error;
        }
    }

    // Alias for compatibility with other calls
    async getWeatherForecast(latOrLocation = null, lonOrDays = null, lang = 'es') {
        return this.getForecast(latOrLocation, lonOrDays, lang);
    }

    formatCurrentWeather(data) {
        const location = data.location || {};
        const current = data.current || {};
        
        return {
            location: location.name || 'Unknown',
            temperature: Math.round(current.temp_c || 0),
            feelsLike: Math.round(current.feelslike_c || 0),
            condition: current.condition?.text || 'Unknown',
            conditionCode: this.mapWeatherCondition(current.condition?.text),
            humidity: current.humidity || 0,
            windSpeed: Math.round(current.wind_kph || 0),
            windDirection: current.wind_dir || 'N',
            pressure: Math.round(current.pressure_mb || 0),
            visibility: Math.round(current.vis_km || 0),
            uvIndex: current.uv || 0,
            sunrise: data.forecast?.forecastday?.[0]?.astro?.sunrise || '--:--',
            sunset: data.forecast?.forecastday?.[0]?.astro?.sunset || '--:--',
            lastUpdate: current.last_updated || new Date().toISOString()
        };
    }

    formatForecast(data) {
        const location = data.location || {};
        const forecast = data.forecast?.forecastday || [];
        
        const dailyForecasts = forecast.map(day => ({
            date: day.date,
            tempMax: Math.round(day.day.maxtemp_c || 0),
            tempMin: Math.round(day.day.mintemp_c || 0),
            condition: day.day.condition?.text || 'Unknown',
            conditionCode: this.mapWeatherCondition(day.day.condition?.text),
            precipitation: Math.round(day.day.totalprecip_mm || 0),
            humidity: day.day.avghumidity || 0
        }));
        return {
            location: location.name || 'Unknown',
            forecast: dailyForecasts
        };
    }

    mapWeatherCondition(condition) {
        if (!condition) return 'clear';
        
        const lower = condition.toLowerCase();
        
        if (lower.includes('storm') || lower.includes('thunder') || lower.includes('tormenta')) return 'storm';
        if (lower.includes('heavy rain') || lower.includes('torrential') || lower.includes('lluvia fuerte')) return 'heavy-rain';
        if (lower.includes('rain') || lower.includes('drizzle') || lower.includes('shower') || lower.includes('lluvia')) return 'rain';
        if (lower.includes('snow') || lower.includes('sleet') || lower.includes('blizzard') || lower.includes('nieve')) return 'snow';
        if (lower.includes('fog') || lower.includes('mist') || lower.includes('haze') || lower.includes('niebla')) return 'fog';
        if (lower.includes('sunny') || lower.includes('clear') || lower.includes('despejado') || lower.includes('soleado')) return 'clear';
        if (lower.includes('partly cloudy') || lower.includes('partly') || lower.includes('parcialmente')) return 'partly-cloudy';
        if (lower.includes('cloudy') || lower.includes('overcast') || lower.includes('nublado')) return 'cloudy';
        if (lower.includes('wind') || lower.includes('viento')) return 'wind';
        
        return 'clear';
    }

    clearCache() {
        this.cache.clear();
        return true;
    }
}

const weatherService = new WeatherService();
export default weatherService;
export { weatherService };