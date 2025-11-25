import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../components/glass/GlassCard';
import { GlassButton } from '../../components/glass/GlassButton';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { weatherService } from '../../services/features/weatherService';
import { ROUTES } from '../../config/constants';
import './Weather.css';

// Memoized weather metric card to prevent unnecessary re-renders
const WeatherMetric = memo(({ icon, label, value, status }) => (
    <GlassCard className="weather-metric">
        <div className="weather-metric__header">
            <span className="material-icons-outlined weather-metric__icon">{icon}</span>
            <p className="weather-metric__label">{label}</p>
        </div>
        <div className="weather-metric__main">
            <h2 className="weather-metric__value">{value}</h2>
            {status && <p className="weather-metric__status">{status}</p>}
        </div>
    </GlassCard>
));

WeatherMetric.displayName = 'WeatherMetric';

// Function to convert date string to day name in Spanish
const getDayName = (dateString) => {
    const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
    const days = ['DOM', 'LUN', 'MAR', 'MIÉR', 'JUE', 'VIE', 'SÁB'];
    return days[date.getDay()];
};

// Memoized forecast day item
const ForecastDay = memo(({ day }) => (
    <div className="weather-forecast__day">
        <p className="weather-forecast__day-name">
            {getDayName(day.date)}
        </p>
        <span className="material-symbols-outlined weather-forecast__day-icon">
            wb_sunny
        </span>
        <p className="weather-forecast__day-temps">
            {Math.round(day.tempMax)}° {Math.round(day.tempMin)}°
        </p>
    </div>
));

ForecastDay.displayName = 'ForecastDay';

/**
 * Weather Screen
 * Displays current weather and forecast with Spanish language support
 * Optimized with memoization and efficient state updates
 */
const Weather = () => {
    const navigate = useNavigate();
    const [currentWeather, setCurrentWeather] = useState(null);
    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [locationError, setLocationError] = useState(null);

    // Location Detection
    const detectLocation = useCallback(async (force = false) => {
        setLocationError(null);
        if (force) {
            localStorage.removeItem('helen_weather_location');
        }
        // Try cache first
        if (!force) {
            const cached = localStorage.getItem('helen_weather_location');
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    if (parsed && parsed.latitude && parsed.longitude) {
                        return parsed;
                    }
                } catch {
                    // Invalid cache, continue
                }
            }
        }
        // Try browser geolocation
        if (navigator.geolocation) {
            try {
                const coords = await new Promise((resolve) => {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            const coords = {
                                latitude: pos.coords.latitude,
                                longitude: pos.coords.longitude,
                            };
                            localStorage.setItem('helen_weather_location', JSON.stringify(coords));
                            resolve(coords);
                        },
                        () => {
                            resolve(null);
                        },
                        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
                    );
                });
                if (coords) return coords;
            } catch {
                // Geolocation failed, continue to default
            }
        }
        // Final fallback: use default city (Tijuana City Center, MX)
        const defaultLoc = { latitude: 32.5027, longitude: -117.0089, default: true };
        setLocationError('No se pudo obtener la ubicación real. Mostrando clima de Tijuana.');
        return defaultLoc;
    }, []);

    // --- Weather Data Loader ---
    const loadWeatherData = useCallback(async (coords) => {
        setLoading(true);
        setError(null);
        let latitude, longitude;
        if (coords && coords.latitude && coords.longitude) {
            latitude = coords.latitude;
            longitude = coords.longitude;
        } else {
            setError('Ubicación no disponible.');
            setLoading(false);
            return;
        }

        try {
            // Fetch weather data from backend
            const [current, forecastData] = await Promise.all([
                weatherService.getCurrentWeather(latitude, longitude, 'es'),
                weatherService.getForecast(latitude, longitude, 'es')
            ]);

            setCurrentWeather(current.data || current);
            setForecast(forecastData.data || forecastData);
            setError(null);
        } catch (err) {
            console.error('Failed to load weather data:', err);
            setError('No se pudieron cargar los datos del clima. Verifica tu conexión.');
            setCurrentWeather(null);
            setForecast([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial Effect: Detect Location, then Load Weather
    useEffect(() => {
        (async () => {
            const coords = await detectLocation();
            if (coords) {
                await loadWeatherData(coords);
            }
        })();
    }, [detectLocation, loadWeatherData]);

    // Retry Handler
    const handleRetry = useCallback(() => {
        setError(null);
        setLoading(true);
        setLocationError(null);
        (async () => {
            const coords = await detectLocation(true);
            if (coords) {
                await loadWeatherData(coords);
            }
        })();
    }, [detectLocation, loadWeatherData]);

    // Log locationError only when it changes
    useEffect(() => {
        if (locationError) {
            console.warn(locationError);
        }
    }, [locationError]);

    return (
        <div className="weather-screen">
            <ScreenHeader
                title="Clima"
                variant="basic"
                onClose={() => navigate(ROUTES.HOME)}
                onRefresh={loadWeatherData}
                showRefreshButton={true}
                className="weather-header"
            />

            <div className="weather-content">
                {loading ? (
                    <GlassCard className="weather-loading">
                        <p>Cargando datos del clima...</p>
                    </GlassCard>
                ) : error ? (
                    <GlassCard className="weather-error">
                        <p>{error}</p>
                        <GlassButton onClick={handleRetry}>
                            Reintentar
                        </GlassButton>
                    </GlassCard>
                ) : (
                    <>
                        {/* Top Section: Current Weather + Metrics */}
                        {currentWeather && (
                            <div className="weather-top">
                                {/* Left: Main Temperature */}
                                <div className="weather-main">
                                    <p className="weather-main__location">
                                        {currentWeather.location}
                                    </p>
                                    <h1 className="weather-main__temp">
                                        {Math.round(currentWeather.temperature)}°
                                    </h1>
                                    <p className="weather-main__range">
                                        Max: {currentWeather.tempMax ? Math.round(currentWeather.tempMax) : '30'}° Min: {currentWeather.tempMin ? Math.round(currentWeather.tempMin) : '20'}°
                                    </p>
                                </div>

                                {/* Right: Metric Cards */}
                                <div className="weather-metrics">
                                    <WeatherMetric
                                        icon="wb_sunny"
                                        label="ÍNDICE UV"
                                        value={currentWeather.uvIndex ? Math.round(currentWeather.uvIndex) : 0}
                                        status="Bajo"
                                    />
                                    
                                    <WeatherMetric
                                        icon="thermostat"
                                        label="SENSACIÓN"
                                        value={`${Math.round(currentWeather.feelsLike)}°`}
                                    />
                                    
                                    <WeatherMetric
                                        icon="water_drop"
                                        label="HUMEDAD"
                                        value={`${currentWeather.humidity}%`}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Forecast Section */}
                        {forecast.length > 0 && (
                            <GlassCard className="weather-forecast">
                                                        <div className="weather-forecast__days">
                            {forecast.map((day, index) => (
                                <ForecastDay key={index} day={day} />
                            ))}
                        </div>
                            </GlassCard>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Weather;
