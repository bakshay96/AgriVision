'use client';

import { motion } from 'framer-motion';
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useGeolocation } from '@/hooks/useGeolocation';

export default function DashboardWeatherWidget() {
  const { t } = useLanguageStore();
  const { address, loading } = useGeolocation();

  // Mock current weather data - in production, this would come from API
  const currentWeather = {
    temp: 28,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 12,
    rainfall: 0,
    uvIndex: 6,
  };

  const WeatherIcon = currentWeather.rainfall > 0 ? CloudRain : currentWeather.temp > 25 ? Sun : Cloud;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-blue-100 mb-1">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{loading ? 'Detecting...' : address || 'Your Location'}</span>
          </div>
          <h3 className="text-3xl font-bold">{currentWeather.temp}°C</h3>
          <p className="text-blue-100">{currentWeather.condition}</p>
        </div>
        <WeatherIcon className="h-16 w-16 text-white/80" />
      </div>

      <div className="mt-6 grid grid-cols-4 gap-4">
        {[
          { icon: Droplets, value: `${currentWeather.humidity}%`, label: t('weather.humidity') },
          { icon: Wind, value: `${currentWeather.windSpeed} km/h`, label: t('weather.windSpeed') },
          { icon: CloudRain, value: `${currentWeather.rainfall} mm`, label: t('weather.rainfall') },
          { icon: Thermometer, value: currentWeather.uvIndex, label: t('weather.uvIndex') },
        ].map((item, idx) => (
          <div key={idx} className="text-center">
            <item.icon className="h-5 w-5 mx-auto mb-1 text-blue-200" />
            <p className="font-semibold">{item.value}</p>
            <p className="text-xs text-blue-200">{item.label}</p>
          </div>
        ))}
      </div>

      <Link
        href="/weather"
        className="mt-6 flex items-center justify-center gap-2 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
      >
        View Full Forecast
        <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}
