/**
 * Weather service: Fetches weather data from OpenWeatherMap API with caching.
 * Replaces Tauri/Rust weather functionality with Electron-native implementation.
 * 
 * @module weatherService
 */

const { EventEmitter } = require('events');
const https = require('https');
const configService = require('../core/configService');

class WeatherService extends EventEmitter {
    constructor() {
        super();
        
        // OpenWeatherMap configuration
        // Get API key from environment or config
        this.apiKey = process.env.OPENWEATHER_API_KEY || '049c515ebb704efda08203643252311';
        this.baseUrl = 'api.openweathermap.org';
        
        // Default location (Tijuana, Mexico - City Center)
        this.defaultLat = 32.5027;
        this.defaultLon = -117.0089;
        
        // Cache configuration
        this.cache = new Map();
        this.CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
        
        // In-flight request tracking
        this.pendingRequests = new Map();
        
        console.log('WeatherService initialized with OpenWeatherMap');
    }

    /**
     * Make HTTPS request to OpenWeatherMap API
     * @param {string} endpoint - API endpoint (onecall)
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} API response
     */
    async makeRequest(endpoint, params = {}) {
        // Add API key and units
        const queryParams = {
            appid: this.apiKey,
            units: 'metric',
            lang: 'es',
            ...params
        };
        
        const queryString = Object.entries(queryParams)
            .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
            .join('&');
        
        const path = `/data/2.5/${endpoint}?${queryString}`;
        
        return new Promise((resolve, reject) => {
            const options = {
                hostname: this.baseUrl,
                path: path,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            https.get(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        if (res.statusCode === 200) {
                            resolve(JSON.parse(data));
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                        }
                    } catch (error) {
                        reject(new Error(`Failed to parse response: ${error.message}`));
                    }
                });
            }).on('error', (error) => {
                reject(new Error(`Request failed: ${error.message}`));
            });
        });
    }

    /**
     * Get current weather
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Promise<Object>} Current weather data
     */
    async getCurrentWeather(lat = null, lon = null) {
        try {
            // Use defaults if not provided
            const latitude = lat || this.defaultLat;
            const longitude = lon || this.defaultLon;
            
            // Check cache
            const cacheKey = `current_${latitude}_${longitude}`;
            const cached = this.cache.get(cacheKey);
            
            if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
                console.log('Returning cached current weather');
                return cached.data;
            }
            
            // Check for in-flight request
            if (this.pendingRequests.has(cacheKey)) {
                console.log('Waiting for pending current weather request');
                return await this.pendingRequests.get(cacheKey);
            }
            
            // Make new request
            console.log(`Fetching current weather for ${latitude}, ${longitude}`);
            
            const requestPromise = this.makeRequest('onecall', {
                lat: latitude,
                lon: longitude,
                exclude: 'minutely,hourly,alerts' // We only need current + daily
            });
            
            this.pendingRequests.set(cacheKey, requestPromise);
            
            try {
                const response = await requestPromise;
                const formatted = this.formatCurrentWeather(response);
                
                // Cache the result
                this.cache.set(cacheKey, {
                    data: formatted,
                    timestamp: Date.now()
                });
                
                // Emit event
                this.emit('weather:updated', formatted);
                
                console.log('Current weather fetched successfully');
                return formatted;
                
            } finally {
                this.pendingRequests.delete(cacheKey);
            }
            
        } catch (error) {
            console.error('Error fetching current weather:', error);
            console.error('Error details:', error.message);
            
            // Return mock data if API fails
            return this.getMockCurrentWeather();
        }
    }

    /**
     * Get weather forecast
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @param {number} days - Number of days (max 5)
     * @returns {Promise<Object>} Forecast data
     */
    async getWeatherForecast(lat = null, lon = null, days = 5) {
        try {
            // Use defaults if not provided
            const latitude = lat || this.defaultLat;
            const longitude = lon || this.defaultLon;
            
            // Check cache
            const cacheKey = `forecast_${latitude}_${longitude}`;
            const cached = this.cache.get(cacheKey);
            
            if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
                console.log('Returning cached forecast');
                return cached.data;
            }
            
            // Check for in-flight request
            if (this.pendingRequests.has(cacheKey)) {
                console.log('Waiting for pending forecast request');
                return await this.pendingRequests.get(cacheKey);
            }
            
            // Make new request
            console.log(`Fetching forecast for ${latitude}, ${longitude}`);
            
            const requestPromise = this.makeRequest('onecall', {
                lat: latitude,
                lon: longitude,
                exclude: 'minutely,hourly,alerts' // We only need current + daily
            });
            
            this.pendingRequests.set(cacheKey, requestPromise);
            
            try {
                const response = await requestPromise;
                const formatted = this.formatForecast(response, days);
                
                console.log(`Forecast returned ${formatted.forecast?.length || 0} days`);
                
                // Cache the result
                this.cache.set(cacheKey, {
                    data: formatted,
                    timestamp: Date.now()
                });
                
                console.log('Forecast fetched successfully');
                return formatted;
                
            } finally {
                this.pendingRequests.delete(cacheKey);
            }
            
        } catch (error) {
            console.error('Error fetching forecast:', error);
            console.error('Error details:', error.message);
            
            // Return mock data if API fails
            return this.getMockForecast(days);
        }
    }

    /**
     * Format current weather data from OpenWeatherMap One Call API 3.0
     * @param {Object} data - Raw API response
     * @returns {Object} Formatted weather data with camelCase field names
     */
    formatCurrentWeather(data) {
        const current = data.current || {};
        const weather = current.weather?.[0] || {};
        
        return {
            location: data.timezone || 'Tijuana', // One Call API doesn't return city name, use timezone
            temperature: Math.round(current.temp || 22),
            feelsLike: Math.round(current.feels_like || 20),
            condition: weather.description || 'Despejado',
            conditionCode: this.mapWeatherCode(weather.id),
            humidity: current.humidity || 45,
            windSpeed: Math.round(current.wind_speed * 3.6 || 12), // m/s to km/h
            windDirection: this.getWindDirection(current.wind_deg || 0),
            pressure: current.pressure || 1013,
            visibility: Math.round((current.visibility || 10000) / 1000), // meters to km
            uvIndex: current.uvi || 5,
            sunrise: this.formatTime(current.sunrise),
            sunset: this.formatTime(current.sunset),
            lastUpdate: new Date(current.dt * 1000).toISOString()
        };
    }

    /**
     * Format forecast data from OpenWeatherMap One Call API 3.0
     * @param {Object} data - Raw API response
     * @param {number} days - Number of days to return (max 8 with One Call)
     * @returns {Object} Formatted forecast with camelCase field names
     */
    formatForecast(data, days = 5) {
        const dailyForecasts = [];
        const dailyData = data.daily || [];
        
        // One Call API provides 8 days of daily forecast
        dailyData.slice(0, days).forEach((day) => {
            const weather = day.weather?.[0] || {};
            const date = new Date(day.dt * 1000);
            
            dailyForecasts.push({
                date: date.toISOString().split('T')[0], // YYYY-MM-DD format
                tempMax: Math.round(day.temp.max || 25),
                tempMin: Math.round(day.temp.min || 15),
                condition: weather.description || 'Despejado',
                conditionCode: this.mapWeatherCode(weather.id),
                precipitation: Math.round((day.rain || 0) + (day.snow || 0)),
                humidity: day.humidity || 50
            });
        });
        
        return {
            location: data.timezone || 'Tijuana',
            forecast: dailyForecasts
        };
    }

    /**
     * Map OpenWeatherMap weather codes to simplified condition codes
     * @param {number} code - OpenWeatherMap weather condition code
     * @returns {string} Simplified condition code
     */
    mapWeatherCode(code) {
        if (!code) return 'clear';
        
        // Thunderstorm (200-232)
        if (code >= 200 && code < 300) return 'storm';
        
        // Drizzle (300-321)
        if (code >= 300 && code < 400) return 'rain';
        
        // Rain (500-531)
        if (code >= 500 && code < 600) {
            return code >= 502 ? 'heavy-rain' : 'rain'; // 502+ is heavy rain
        }
        
        // Snow (600-622)
        if (code >= 600 && code < 700) return 'snow';
        
        // Atmosphere (fog, mist, haze, etc.) (701-781)
        if (code >= 701 && code < 800) return 'fog';
        
        // Clear (800)
        if (code === 800) return 'clear';
        
        // Clouds (801-804)
        if (code === 801 || code === 802) return 'partly-cloudy';
        if (code === 803 || code === 804) return 'cloudy';
        
        return 'clear';
    }

    /**
     * Map WeatherAPI.com condition text to simplified codes (kept for compatibility)
     * @param {string} condition - Weather condition text
     * @returns {string} Simplified condition code
     */
    mapWeatherCondition(condition) {
        if (!condition) return 'clear';
        
        const lower = condition.toLowerCase();
        
        if (lower.includes('storm') || lower.includes('thunder')) return 'storm';
        if (lower.includes('heavy rain') || lower.includes('torrential')) return 'heavy-rain';
        if (lower.includes('rain') || lower.includes('drizzle') || lower.includes('shower')) return 'rain';
        if (lower.includes('snow') || lower.includes('sleet') || lower.includes('blizzard')) return 'snow';
        if (lower.includes('fog') || lower.includes('mist') || lower.includes('haze')) return 'fog';
        if (lower.includes('sunny') || lower.includes('clear')) return 'clear';
        if (lower.includes('partly cloudy') || lower.includes('partly')) return 'partly-cloudy';
        if (lower.includes('cloudy') || lower.includes('overcast')) return 'cloudy';
        if (lower.includes('wind')) return 'wind';
        
        return 'clear';
    }

    /**
     * Convert wind degrees to cardinal direction
     * @param {number} deg - Wind direction in degrees
     * @returns {string} Cardinal direction
     */
    getWindDirection(deg) {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(deg / 45) % 8;
        return directions[index];
    }

    /**
     * Format Unix timestamp to time string
     * @param {number} timestamp - Unix timestamp
     * @returns {string} Formatted time (HH:MM)
     */
    formatTime(timestamp) {
        if (!timestamp) return '--:--';
        
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Clear weather cache
     * @returns {boolean} Success status
     */
    clearCache() {
        this.cache.clear();
        console.log('Weather cache cleared');
        return true;
    }

    /**
     * Mock current weather data (fallback) with camelCase field names
     * @returns {Object} Mock data
     */
    getMockCurrentWeather() {
        return {
            location: 'Tijuana',
            temperature: 22,
            feelsLike: 20,
            condition: 'Parcialmente nublado',
            conditionCode: 'partly-cloudy',
            humidity: 45,
            windSpeed: 12,
            windDirection: 'NE',
            pressure: 1013,
            visibility: 10,
            uvIndex: 6,
            sunrise: '06:30',
            sunset: '18:45',
            lastUpdate: new Date().toISOString()
        };
    }

    /**
     * Mock forecast data (fallback) with camelCase field names
     * @param {number} days - Number of days
     * @returns {Object} Mock forecast
     */
    getMockForecast(days = 5) {
        const conditions = ['clear', 'partly-cloudy', 'cloudy', 'rain'];
        const forecast = [];

        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            
            forecast.push({
                date: date.toISOString().split('T')[0], // Return YYYY-MM-DD format
                tempMax: 20 + Math.floor(Math.random() * 10),
                tempMin: 15 + Math.floor(Math.random() * 5),
                condition: 'Soleado',
                conditionCode: conditions[i % conditions.length],
                precipitation: Math.floor(Math.random() * 30),
                humidity: 40 + Math.floor(Math.random() * 30)
            });
        }

        return {
            location: 'Tijuana',
            forecast
        };
    }
}

// Singleton instance
const weatherService = new WeatherService();

module.exports = weatherService;
