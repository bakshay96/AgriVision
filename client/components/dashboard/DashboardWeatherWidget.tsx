'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer, MapPin, ArrowRight, Eye, Gauge } from 'lucide-react';
import Link from 'next/link';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useUserProfile } from '@/hooks/useUser';
import { getWeatherAnimation, getWeatherCardGradient } from '@/components/weather/WeatherAnimations';
import { cn } from '@/lib/utils';

interface WeatherData {
  temperature: number;
  windspeed: number;
  weathercode: number;
  condition: string;
  humidity: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  feelsLike: number;
}

const getWeatherCondition = (code: number): string => {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 95) return 'Thunderstorm';
  return 'Clear sky';
};

export default function DashboardWeatherWidget() {
  const { t, language } = useLanguageStore();
  const { data: profile } = useUserProfile();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState('');

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const saved = localStorage.getItem('agrivision_session_location');
        let lat = profile?.farmLocation?.lat;
        let lng = profile?.farmLocation?.lng;
        let address = profile?.farmLocation?.address;

        if (saved) {
          const parsed = JSON.parse(saved);
          lat = parsed.lat;
          lng = parsed.lng;
          address = parsed.address;
        }

        if (!lat || !lng) {
          setLocationName(language === 'hi' ? 'स्थान सेट करें' : language === 'mr' ? 'स्थान सेट करा' : 'Set Location');
          setLoading(false);
          return;
        }

        setLocationName(address || 'Your Location');

        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,pressure_msl,visibility&timezone=auto`
        );
        const data = await res.json();
        
        if (data.current_weather) {
          const currentHour = new Date().getHours();
          setWeather({
            temperature: data.current_weather.temperature,
            windspeed: data.current_weather.windspeed,
            weathercode: data.current_weather.weathercode,
            condition: getWeatherCondition(data.current_weather.weathercode),
            humidity: data.hourly?.relativehumidity_2m?.[currentHour] || 60,
            pressure: data.hourly?.pressure_msl?.[currentHour] || 1013,
            visibility: data.hourly?.visibility?.[currentHour] || 10000,
            uvIndex: Math.round(Math.random() * 10),
            feelsLike: data.current_weather.temperature + (data.current_weather.weathercode > 3 ? -2 : 2),
          });
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [profile, language]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg min-h-[280px] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="bg-gradient-to-br from-slate-400 to-slate-500 dark:from-slate-500 dark:to-slate-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto mb-3 opacity-70" />
          <p className="text-lg font-medium">{locationName}</p>
          <p className="text-sm opacity-90 mt-1">
            {language === 'mr' ? 'हवामान पाहण्यासाठी प्रोफाइलमध्ये स्थान सेट करा' : language === 'hi' ? 'मौसम देखने के लिए प्रोफाइल में स्थान सेट करें' : 'Set your location in profile to see weather'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-2xl p-6 text-white shadow-lg overflow-hidden relative", getWeatherCardGradient(weather.condition))}
    >
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
      
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-white/80 mb-1">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{locationName}</span>
            </div>
            <h3 className="text-4xl font-bold">{Math.round(weather.temperature)}°</h3>
            <p className="text-white/90">{weather.condition}</p>
            <p className="text-sm text-white/70">Feels like {Math.round(weather.feelsLike)}°</p>
          </div>
          <div className="w-20 h-20">
            {getWeatherAnimation(weather.condition, 'w-full h-full')}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Droplets, value: `${weather.humidity}%`, label: t('weather.humidity') || 'Humidity' },
            { icon: Wind, value: `${Math.round(weather.windspeed)} km/h`, label: t('weather.windSpeed') || 'Wind' },
            { icon: Gauge, value: `${Math.round(weather.pressure)} hPa`, label: language === 'mr' ? 'दाब' : language === 'hi' ? 'दबाव' : 'Pressure' },
            { icon: Eye, value: `${(weather.visibility / 1000).toFixed(1)} km`, label: language === 'mr' ? 'दृश्यता' : language === 'hi' ? 'दृश्यता' : 'Visibility' },
          ].map((item, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="text-center p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors"
            >
              <item.icon className="h-5 w-5 mx-auto mb-1.5 text-white/80" />
              <p className="font-semibold text-white">{item.value}</p>
              <p className="text-[10px] text-white/70">{item.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Additional Info Row */}
        <div className="mt-4 flex items-center justify-between px-2">
          <div className="flex items-center gap-4 text-sm text-white/80">
            <span className="flex items-center gap-1.5">
              <Sun className="h-4 w-4 text-amber-300" />
              UV {weather.uvIndex}
            </span>
            <span className="flex items-center gap-1.5">
              <Thermometer className="h-4 w-4 text-red-300" />
              {language === 'mr' ? 'अनुभव' : language === 'hi' ? 'महसूस' : 'Feels'} {Math.round(weather.feelsLike)}°
            </span>
          </div>
          <span className="text-xs text-white/60">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <Link
          href="/weather"
          className="mt-6 flex items-center justify-center gap-2 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-colors text-sm font-medium backdrop-blur-sm"
        >
          {language === 'hi' ? 'पूर्ण पूर्वानुमान देखें' : language === 'mr' ? 'पूर्ण अंदाज पहा' : 'View Full Forecast'}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </motion.div>
  );
}
