import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import '../styles/main.css';

interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
}

interface ForecastData {
  date: string;
  temperature: number;
  condition: string;
  icon: string;
}

const getWeatherIcon = (condition: string, isNight: boolean = false): string => {
  const baseUrl = '/images/weather-icons/';
  
  switch (condition.toLowerCase()) {
    case 'clear':
      return `${baseUrl}${isNight ? 'clear-night.png' : 'clear-day.png'}`;
    case 'clouds':
      return `${baseUrl}cloudy.png`;
    case 'rain':
      return `${baseUrl}rain.png`;
    case 'drizzle':
      return `${baseUrl}drizzle.png`;
    case 'thunderstorm':
      return `${baseUrl}thunderstorm.png`;
    case 'snow':
      return `${baseUrl}snow.png`;
    case 'mist':
    case 'fog':
      return `${baseUrl}fog.png`;
    default:
      return `${baseUrl}default.png`;
  }
};

export const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const apiKey = process.env.REACT_APP_OPENWEATHER_API_KEY;
        
        if (!apiKey) {
          throw new Error('OpenWeather API key is not configured');
        }

        const city = 'Calgary'; // You can make this dynamic based on user location
        
        // Fetch current weather
        const currentWeatherResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
        );
        
        if (!currentWeatherResponse.ok) {
          throw new Error('Failed to fetch current weather data');
        }

        const currentWeatherData = await currentWeatherResponse.json();
        const isNight = currentWeatherData.dt > currentWeatherData.sys.sunset || currentWeatherData.dt < currentWeatherData.sys.sunrise;
        
        setWeather({
          temperature: Math.round(currentWeatherData.main.temp),
          condition: currentWeatherData.weather[0].main,
          icon: getWeatherIcon(currentWeatherData.weather[0].main, isNight)
        });

        // Fetch 5-day forecast
        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`
        );

        if (!forecastResponse.ok) {
          throw new Error('Failed to fetch forecast data');
        }

        const forecastData = await forecastResponse.json();
        
        // Process forecast data to get one reading per day at noon
        const dailyForecasts = forecastData.list
          .filter((item: any, index: number) => index % 8 === 0)
          .map((item: any) => ({
            date: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
            temperature: Math.round(item.main.temp),
            condition: item.weather[0].main,
            icon: getWeatherIcon(item.weather[0].main)
          }))
          .slice(0, 5);

        setForecast(dailyForecasts);
      } catch (error) {
        console.error('Error fetching weather:', error);
        setError(error instanceof Error ? error.message : 'Failed to load weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div className="weather-widget">
        <div className="weather-info">
          <div className="spinner" style={{ marginRight: '0.5rem' }}></div>
          Loading weather...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather-widget">
        <div className="weather-info">
          <p style={{ color: '#991b1b' }}>Error: {error}</p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Please check your OpenWeather API key configuration
          </p>
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="weather-widget">
        <div className="weather-info">
          <p style={{ color: '#991b1b' }}>Unable to load weather data</p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Please check your OpenWeather API key configuration
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="weather-widget">
      <div className="weather-info">
        <img src={weather.icon} alt={weather.condition} className="weather-icon" />
        <div className="weather-details">
          <p className="temperature">{weather.temperature}°C</p>
          <p className="condition">{weather.condition}</p>
        </div>
      </div>
      <div className="forecast-container">
        {forecast.map((day, index) => (
          <div key={index} className="forecast-day">
            <p className="forecast-date">{day.date}</p>
            <img src={day.icon} alt={day.condition} className="forecast-icon" />
            <p className="forecast-temp">{day.temperature}°</p>
          </div>
        ))}
      </div>
    </div>
  );
}; 