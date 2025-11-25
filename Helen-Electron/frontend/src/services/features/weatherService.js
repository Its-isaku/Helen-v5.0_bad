/**
 * Weather Service: handles weather API integration with Spanish language support
 */

import { electronBackend } from '../api/electronBackend';

class WeatherService {
    constructor() {
        this.language = 'es'; // Spanish language support
        this.units = 'metric'; // Celsius for temperature
        this.cache = null;
        this.cacheExpiry = null;
        this.CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
        // Track in-flight requests to deduplicate
        this.pendingRequest = null;
        this.pendingForecast = null;
    }

    /**
     * Get current weather for a location
     * @param {number} lat - Latitude (default: Tijuana City Center)
     * @param {number} lon - Longitude (default: Tijuana City Center)
     * @returns {Promise<Object>} Weather data
     */
    async getCurrentWeather(lat = 32.5027, lon = -117.0089) {
        // Check if Electron backend is available
        if (!window.electronBackend) {
            console.warn('⚠️ Electron backend not available, using mock data');
            return this.getMockWeatherData();
        }

        // Check cache first
        if (this.cache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
            console.log('📦 Returning cached weather data');
            return this.cache;
        }

        // Deduplicate concurrent requests
        if (this.pendingRequest) {
            console.log('⏳ Waiting for pending weather request');
            return this.pendingRequest;
        }

        this.pendingRequest = (async () => {
            try {
                console.log(`🌤️ Fetching current weather from API...`);
                const response = await electronBackend.weather.getCurrent(lat, lon);

                if (!response.success) {
                    throw new Error(response.error || 'Failed to fetch weather');
                }

                console.log('Weather data received successfully');

                // Cache the result
                this.cache = response.data;
                this.cacheExpiry = Date.now() + this.CACHE_DURATION;

                return this.cache;
            } catch (error) {
                console.error('Error fetching current weather:', error);
                console.warn('Using mock weather data as fallback');
                // Return mock data for development
                return this.getMockWeatherData();
            } finally {
                this.pendingRequest = null;
            }
        })();

        return this.pendingRequest;
    }

    /**
     * Get weather forecast for the next days
     * @param {number} lat - Latitude (default: Tijuana City Center)
     * @param {number} lon - Longitude (default: Tijuana City Center)
     * @param {number} days - Number of days to forecast (default: 5)
     * @returns {Promise<Array>} Array of daily forecasts
     */
    async getWeatherForecast(lat = 32.5027, lon = -117.0089, days = 5) {
        // Check if Electron backend is available
        if (!window.electronBackend) {
            console.warn('Electron backend not available, using mock forecast');
            return this.getMockForecastData(days);
        }

        if (this.pendingForecast) {
            console.log('Waiting for pending forecast request');
            return this.pendingForecast;
        }

        this.pendingForecast = (async () => {
            try {
                console.log(`Fetching weather forecast from API...`);
                const response = await electronBackend.weather.getForecast(lat, lon, days);

                if (!response.success) {
                    throw new Error(response.error || 'Failed to fetch forecast');
                }

                console.log('Forecast data received successfully');
                return response.data.forecast || [];
            } catch (error) {
                console.error('Error fetching weather forecast:', error);
                console.warn('Using mock forecast data as fallback');
                return this.getMockForecastData(days);
            } finally {
                this.pendingForecast = null;
            }
        })();

        return this.pendingForecast;
    }

    /**
     * Alias for getWeatherForecast (for backward compatibility)
     * @param {number} lat - Latitude (default: Tijuana City Center)
     * @param {number} lon - Longitude (default: Tijuana City Center)
     * @param {string} lang - Language (ignored, kept for compatibility)
     * @returns {Promise<Array>} Array of daily forecasts
     */
    async getForecast(lat = 32.5027, lon = -117.0089, lang = 'es') {
        return this.getWeatherForecast(lat, lon, 5);
    }

    /**
     * Format weather data for consistent display (now handled by backend)
     * @param {Object} data - Already formatted weather data from backend
     * @returns {Object} Formatted weather data
     */
    formatWeatherData(data) {
        // Backend already formats the data, just pass through
        return data;
    }

    /**
     * Format forecast day data (now handled by backend)
     * @param {Object} day - Already formatted forecast day data
     * @returns {Object} Formatted forecast day
     */
    formatForecastDay(day) {
        // Backend already formats the data, just pass through
        return day;
    }

    /**
     * Get weather icon based on condition code
     * @param {string} conditionCode - Weather condition code
     * @returns {string} Material Icon name
     */
    getWeatherIcon(conditionCode) {
        const iconMap = {
            'clear': 'wb_sunny',
            'partly-cloudy': 'partly_cloudy_day',
            'cloudy': 'cloud',
            'overcast': 'cloud',
            'rain': 'rainy',
            'heavy-rain': 'thunderstorm',
            'snow': 'weather_snowy',
            'fog': 'foggy',
            'wind': 'air',
            'storm': 'weather_hail',
        };

        return iconMap[conditionCode] || 'clear_day';
    }

    /**
     * Get Spanish description for weather condition
     * @param {string} conditionCode - Weather condition code
     * @returns {string} Spanish description
     */
    getConditionDescription(conditionCode) {
        const descriptions = {
            'clear': 'Despejado',
            'partly-cloudy': 'Parcialmente nublado',
            'cloudy': 'Nublado',
            'overcast': 'Cubierto',
            'rain': 'Lluvia',
            'heavy-rain': 'Lluvia intensa',
            'snow': 'Nieve',
            'fog': 'Niebla',
            'wind': 'Ventoso',
            'storm': 'Tormenta',
        };

        return descriptions[conditionCode] || 'Desconocido';
    }

    /**
     * Clear weather cache
     */
    async clearCache() {
        this.cache = null;
        this.cacheExpiry = null;
        
        try {
            // Also clear backend cache if available
            if (window.electronBackend) {
                await electronBackend.weather.clearCache();
                console.log('Weather cache cleared');
            }
        } catch (error) {
            console.error('Error clearing backend cache:', error);
        }
    }

    /**
     * Mock weather data for development with camelCase field names
     * @returns {Object} Mock weather data
     */
    getMockWeatherData() {
        return {
            location: 'Ciudad de México',
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
            lastUpdate: new Date().toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            }),
        };
    }

    /**
     * Mock forecast data for development with camelCase field names
     * @param {number} days - Number of days
     * @returns {Array} Mock forecast data
     */
    getMockForecastData(days = 5) {
        const conditions = ['clear', 'partly-cloudy', 'cloudy', 'rain'];
        const forecast = [];

        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            
            forecast.push({
                date: date.toLocaleDateString('es-ES', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                }),
                tempMax: 20 + Math.floor(Math.random() * 10),
                tempMin: 15 + Math.floor(Math.random() * 5),
                condition: this.getConditionDescription(conditions[i % conditions.length]),
                conditionCode: conditions[i % conditions.length],
                precipitation: Math.floor(Math.random() * 30),
                humidity: 40 + Math.floor(Math.random() * 30),
            });
        }

        return forecast;
    }
}

export const weatherService = new WeatherService();
