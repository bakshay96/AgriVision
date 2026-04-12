'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Cloud, Sun, CloudRain, Wind, Droplets, Thermometer,
  AlertTriangle, Calendar, MapPin, Sprout, ChevronLeft,
  Navigation, RefreshCw, Sunrise, Sunset, Eye, Gauge,
  ArrowLeft, Clock, Leaf, CloudSnow, CloudLightning, Search
} from 'lucide-react';
import { weatherApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguageStore } from '@/store/useLanguageStore';
import { toast } from 'sonner';
import { useUserProfile } from '@/hooks/useUser';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getWeatherAnimation, getWeatherBackground, getWeatherCardGradient } from '@/components/weather/WeatherAnimations';
import FarmersAdvisory from '@/components/weather/FarmersAdvisory';
import LocationPicker from '@/components/location/LocationPicker';
import { cn } from '@/lib/utils';

// ────────────────────────────────────────────────────────────────
// Static particle positions – avoids hydration mismatch
// ────────────────────────────────────────────────────────────────
const PARTICLES = [
  { left: '10%', top: '20%' },
  { left: '60%', top: '10%' },
  { left: '80%', top: '60%' },
  { left: '30%', top: '70%' },
  { left: '50%', top: '40%' },
];

// Generate realistic hourly forecast from daily data
function generateHourlyForecast(day: any) {
  const hours = [];
  const baseTemp = day.temperature?.avg || day.temperature || 25;
  const minT = day.temperature?.min || baseTemp - 5;
  const maxT = day.temperature?.max || baseTemp + 5;

  for (let h = 0; h < 24; h++) {
    // Temperature curve: coolest at 5am, hottest at 2pm
    const factor = Math.sin(((h - 5) / 24) * Math.PI * 2) * 0.5 + 0.5;
    const temp = minT + (maxT - minT) * factor;
    const rain = h >= 14 && h <= 18 && day.rainfall > 0 ? Math.random() * day.rainfall * 0.3 : 0;
    hours.push({
      hour: h,
      temp: Math.round(temp),
      condition: rain > 1 ? 'Rainy' : h < 6 || h >= 20 ? 'Clear Night' : 'Sunny',
      rain: Math.round(rain * 10) / 10,
      humidity: Math.round(60 + Math.random() * 20),
      windSpeed: Math.round(5 + Math.random() * 15),
    });
  }
  return hours;
}

// Farmer suggestions based on weather
function getFarmerSuggestions(day: any, language: string) {
  const suggestions = [];
  const maxT = day.temperature?.max || 30;
  const minT = day.temperature?.min || 15;
  const rain = day.rainfall || 0;

  if (rain > 10) {
    suggestions.push({
      icon: '🌧️',
      text: language === 'mr' ? 'जास्त पाऊस: सिंचन बंद करा, निचरा तपासा' : language === 'hi' ? 'भारी बारिश: सिंचाई रोकें, जल निकासी जांचें' : 'Heavy rain: Stop irrigation, check drainage channels',
      type: 'warning',
    });
    suggestions.push({
      icon: '🚫',
      text: language === 'mr' ? 'फवारणी टाळा - औषधे धुतली जातात' : language === 'hi' ? 'छिड़काव टालें - दवाएं बह जाएंगी' : 'Avoid spraying – pesticides will wash off',
      type: 'warning',
    });
  } else if (rain > 0 && rain <= 10) {
    suggestions.push({
      icon: '💧',
      text: language === 'mr' ? 'हलका पाऊस: सिंचन कमी करा' : language === 'hi' ? 'हल्की बारिश: सिंचाई घटाएं' : 'Light rain: Reduce irrigation frequency',
      type: 'info',
    });
  } else {
    suggestions.push({
      icon: '💦',
      text: language === 'mr' ? 'कोरडे हवामान: सकाळी/संध्याकाळी सिंचन करा' : language === 'hi' ? 'शुष्क मौसम: सुबह/शाम सिंचाई करें' : 'Dry weather: Irrigate in morning or evening',
      type: 'info',
    });
  }

  if (maxT > 38) {
    suggestions.push({
      icon: '🌡️',
      text: language === 'mr' ? 'उष्ण दिवस: झाडांना सावली द्या, जास्त पाणी द्या' : language === 'hi' ? 'गर्म दिन: पौधों को छाया दें, अधिक पानी दें' : 'Hot day: Provide shade for sensitive crops',
      type: 'danger',
    });
  }
  if (minT < 10) {
    suggestions.push({
      icon: '❄️',
      text: language === 'mr' ? 'थंडी रात्र: रोपांना प्रोटेक्शन द्या' : language === 'hi' ? 'ठंडी रात: पौधों को सुरक्षा दें' : 'Cold night: Cover sensitive seedlings',
      type: 'warning',
    });
  }
  if (maxT >= 20 && maxT <= 32 && rain === 0) {
    suggestions.push({
      icon: '🌱',
      text: language === 'mr' ? 'खत देण्यास / फवारणीस योग्य दिवस' : language === 'hi' ? 'खाद/छिड़काव के लिए उपयुक्त दिन' : 'Good day for fertilization or pesticide spraying',
      type: 'success',
    });
  }

  return suggestions;
}

// Glassmorphic card
function GlassCard({ children, className = '', gradient = 'from-blue-500/80 to-indigo-600/80' }: {
  children: React.ReactNode; className?: string; gradient?: string;
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl bg-gradient-to-br backdrop-blur-xl border border-white/20 shadow-2xl', gradient, className)}>
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
      <div className="absolute inset-0 overflow-hidden">
        {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            className="absolute w-32 h-32 rounded-full bg-white/5"
            style={{ left: p.left, top: p.top }}
            animate={{ y: [0, -30, 0], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// Day Detail Panel
function DayDetailPanel({ day, language, t, onClose }: { day: any; language: string; t: (k: string) => string; onClose: () => void }) {
  const hourly = useMemo(() => generateHourlyForecast(day), [day]);
  const suggestions = getFarmerSuggestions(day, language);
  const date = new Date(day.date);
  const [activeHour, setActiveHour] = useState<number | null>(null);

  // Simulated sun times based on month
  const month = date.getMonth();
  const sunriseHour = month >= 4 && month <= 8 ? 5 : 6;
  const sunsetHour = month >= 4 && month <= 8 ? 19 : 18;

  const gradientForCondition = () => {
    return getWeatherCardGradient(day.condition || 'Clear');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="space-y-6"
    >
      {/* Back */}
      <button onClick={onClose} className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:gap-3 transition-all font-medium">
        <ArrowLeft className="h-4 w-4" /> {language === 'mr' ? 'परत' : language === 'hi' ? 'वापस' : 'Back to Forecast'}
      </button>

      {/* Hero Card */}
      <GlassCard gradient={gradientForCondition()} className="text-white">
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-sm text-white/70 mb-1">
                {date.toLocaleDateString(language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <p className="text-7xl font-bold">{Math.round(day.temperature?.avg || day.temperature)}°</p>
              <p className="text-2xl font-medium mt-1">{day.condition}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-white/80">
                <span>↑ {Math.round(day.temperature?.max)}°</span>
                <span>↓ {Math.round(day.temperature?.min)}°</span>
                {day.rainfall > 0 && <span>🌧 {Math.round(day.rainfall)}mm</span>}
              </div>
            </div>
            <div className="w-36 h-36">
              {getWeatherAnimation(day.condition, 'w-full h-full')}
            </div>
          </div>

          {/* Metrics */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Droplets, label: t('weather.humidity'), value: `${day.humidity || 70}%` },
              { icon: Wind, label: t('weather.windSpeed'), value: `${Math.round(day.windSpeed || 10)} km/h` },
              { icon: Eye, label: language === 'mr' ? 'दृश्यमानता' : language === 'hi' ? 'दृश्यता' : 'Visibility', value: '10 km' },
              { icon: Gauge, label: language === 'mr' ? 'दाब' : language === 'hi' ? 'दबाव' : 'Pressure', value: '1013 hPa' },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-white/10 p-3 text-center">
                <m.icon className="h-4 w-4 mx-auto mb-1 text-white/70" />
                <p className="font-semibold">{m.value}</p>
                <p className="text-xs text-white/60">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Sun info */}
          <div className="mt-4 flex items-center justify-around rounded-xl bg-white/10 p-4">
            <div className="text-center">
              <Sunrise className="h-6 w-6 mx-auto mb-1 text-amber-300" />
              <p className="font-semibold">{sunriseHour}:00 AM</p>
              <p className="text-xs text-white/60">{language === 'mr' ? 'सूर्योदय' : language === 'hi' ? 'सूर्योदय' : 'Sunrise'}</p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div className="text-center">
              <Sun className="h-6 w-6 mx-auto mb-1 text-yellow-300" />
              <p className="font-semibold">{sunsetHour - sunriseHour}h</p>
              <p className="text-xs text-white/60">{language === 'mr' ? 'दिवसभर' : language === 'hi' ? 'दिन की लंबाई' : 'Daylight'}</p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div className="text-center">
              <Sunset className="h-6 w-6 mx-auto mb-1 text-orange-300" />
              <p className="font-semibold">{sunsetHour}:00 PM</p>
              <p className="text-xs text-white/60">{language === 'mr' ? 'सूर्यास्त' : language === 'hi' ? 'सूर्यास्त' : 'Sunset'}</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Hourly Forecast */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base dark:text-white">
            <Clock className="h-4 w-4 text-emerald-600" />
            {language === 'mr' ? 'तासानुसार हवामान' : language === 'hi' ? 'प्रति घंटा मौसम' : 'Hourly Forecast'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-3 min-w-max">
              {hourly.map((hr) => (
                <motion.button
                  key={hr.hour}
                  whileHover={{ scale: 1.05, y: -2 }}
                  onClick={() => setActiveHour(activeHour === hr.hour ? null : hr.hour)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl px-3 py-3 text-center transition-all min-w-[60px] border',
                    activeHour === hr.hour
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-400 shadow-md'
                      : 'border-slate-100 dark:border-slate-700 hover:border-emerald-300'
                  )}
                >
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {hr.hour === 0 ? '12am' : hr.hour < 12 ? `${hr.hour}am` : hr.hour === 12 ? '12pm' : `${hr.hour - 12}pm`}
                  </p>
                  <div className="w-8 h-8">
                    {getWeatherAnimation(hr.rain > 0 ? 'Rainy' : hr.hour < 6 || hr.hour >= 20 ? 'Clear' : 'Sunny', 'w-full h-full')}
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{hr.temp}°</p>
                  {hr.rain > 0 && <p className="text-xs text-blue-500">{hr.rain}mm</p>}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Expanded hourly detail */}
          <AnimatePresence>
            {activeHour !== null && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <p className="font-medium text-slate-900 dark:text-white mb-3">
                  {activeHour}:00 — {language === 'mr' ? 'तपशीलवार माहिती' : language === 'hi' ? 'विस्तृत जानकारी' : 'Detailed info'}
                </p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  {[
                    { label: language === 'mr' ? 'तापमान' : 'Temp', value: `${hourly[activeHour].temp}°C` },
                    { label: language === 'mr' ? 'आर्द्रता' : 'Humidity', value: `${hourly[activeHour].humidity}%` },
                    { label: language === 'mr' ? 'वेग' : 'Wind', value: `${hourly[activeHour].windSpeed} km/h` },
                  ].map(item => (
                    <div key={item.label} className="text-center">
                      <p className="text-slate-400 text-xs">{item.label}</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Farmer Suggestions */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base dark:text-white">
            <Leaf className="h-4 w-4 text-emerald-600" />
            {language === 'mr' ? 'शेतकरी सूचना' : language === 'hi' ? 'किसान सुझाव' : 'Farmer Suggestions'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestions.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className={cn(
                'flex items-start gap-3 p-3 rounded-xl border-l-4 text-sm',
                s.type === 'danger' ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-200' :
                s.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-800 dark:text-amber-200' :
                s.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-800 dark:text-emerald-200' :
                'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-800 dark:text-blue-200'
              )}
            >
              <span className="text-xl flex-shrink-0">{s.icon}</span>
              <span>{s.text}</span>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────
// Main Weather Page
// ────────────────────────────────────────────────────────────────
export default function WeatherPage() {
  const { t, language } = useLanguageStore();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showAdvisory, setShowAdvisory] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [sessionLocation, setSessionLocation] = useState<{ lat: number, lng: number, address: string } | null>(null);

  const { latitude: detectedLat, longitude: detectedLng, address: detectedAddr, loading: detecting, refetch: detectNow } = useGeolocation({ enableHighAccuracy: true });

  // Initialize session location from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('agrivision_session_location');
    if (saved) {
      try {
        setSessionLocation(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved location', e);
      }
    }
  }, []);

  const handleDetect = async () => {
    await detectNow();
    if (detectedLat && detectedLng) {
      const newLoc = {
        lat: detectedLat,
        lng: detectedLng,
        address: detectedAddr || ''
      };
      setSessionLocation(newLoc);
      localStorage.setItem('agrivision_session_location', JSON.stringify(newLoc));
    }
  };

  const handleLocationSelect = (location: {
    lat: number;
    lng: number;
    address: string;
    village?: string;
    taluka?: string;
    district?: string;
    state?: string;
    pincode?: string;
  }) => {
    const newLoc = {
      lat: location.lat,
      lng: location.lng,
      address: location.address
    };
    setSessionLocation(newLoc);
    localStorage.setItem('agrivision_session_location', JSON.stringify(newLoc));
    toast.success('Location updated successfully!');
  };

  // Resolve which location to use: detected session loc > profile farm loc
  const latitude = sessionLocation?.lat || profile?.farmLocation?.lat;
  const longitude = sessionLocation?.lng || profile?.farmLocation?.lng;
  const displayAddress = sessionLocation?.address || 
                 profile?.farmLocation?.address || 
                 (profile?.village ? `${profile.village}, ${profile.district || ''}` : '') ||
                 (profile?.district ? profile.district : '');

  const { data, isLoading } = useQuery({
    queryKey: ['weather', latitude, longitude],
    queryFn: () => weatherApi.getWeather({ lat: latitude, lon: longitude }).then(r => r.data.data.weather || r.data.data),
    enabled: (!profileLoading || !!sessionLocation) && !!latitude && !!longitude,
  });

  const loading = (isLoading || profileLoading) && !sessionLocation;



  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <p className="text-sm text-slate-500">{t('weather.location.detecting')}</p>
        </div>
      </div>
    );
  }

  // Show message if no location is set in profile
  if (!latitude || !longitude) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <MapPin className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {language === 'mr' ? 'स्थान सेट करा' : language === 'hi' ? 'स्थान सेट करें' : 'Set Your Location'}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {language === 'mr' 
              ? 'कृपया आपल्या प्रोफाइलमध्ये शेताचे स्थान (latitude/longitude) जोडा जेणेकरून अचूक हवामान माहिती मिळू शकेल.' 
              : language === 'hi'
                ? 'कृपया अपने प्रोफाइल में खेत का स्थान (latitude/longitude) जोड़ें ताकि सटीक मौसम जानकारी मिल सके।'
                : 'Please add your farm location (latitude/longitude) in your profile to get accurate weather information.'}
          </p>
          <a
            href="/profile"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <MapPin className="h-4 w-4" />
            {language === 'mr' ? 'प्रोफाइलवर जा' : language === 'hi' ? 'प्रोफाइल पर जाएं' : 'Go to Profile'}
          </a>
        </div>
      </div>
    );
  }

  const weather = data;
  if (!weather) return null;

  const WeatherIcon = getWeatherAnimation(weather.current.condition, 'w-full h-full');

  // If a day is selected, show detail panel
  if (selectedDay !== null && weather.forecast[selectedDay]) {
    return (
      <DayDetailPanel
        day={weather.forecast[selectedDay]}
        language={language}
        t={t}
        onClose={() => setSelectedDay(null)}
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('weather.title')}</h1>
          <div className="mt-1 flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span className="font-medium">{displayAddress || (profileLoading ? 'Loading Profile...' : 'Location Not Set')}</span>
            </div>
            <button
              onClick={() => setShowLocationPicker(true)}
              className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-all text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
              title="Search Location"
            >
              <Search className="h-3 w-3" />
              Search
            </button>
            <button
              onClick={handleDetect}
              disabled={detecting}
              className={cn(
                "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-all",
                detecting 
                  ? "text-slate-400 bg-slate-100 animate-pulse" 
                  : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"
              )}
              title="Detect Current Location"
            >
              <Navigation className={cn("h-3 w-3", detecting && "animate-spin")} />
              {detecting ? 'Detecting...' : 'Detect'}
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowAdvisory(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/25 font-medium"
        >
          <AlertTriangle className="h-4 w-4" />
          <span>{t('weather.advisory.title')}</span>
        </button>
      </div>


      {/* Current Weather with Dynamic Background */}
      <GlassCard 
        gradient={getWeatherCardGradient(weather.current.condition)} 
        className="text-white"
      >
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-sm text-white/70 mb-1">
                {new Date().toLocaleDateString(language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <p className="text-6xl md:text-7xl font-bold">{Math.round(weather.current.temperature)}°C</p>
              <p className="mt-2 text-xl md:text-2xl font-medium">{weather.current.condition}</p>
              <p className="text-blue-100">{t('weather.feelsLike')} {Math.round(weather.current.feelsLike)}°C</p>
            </div>
            <div className="w-32 h-32 md:w-40 md:h-40">{WeatherIcon}</div>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Droplets, value: `${weather.current.humidity}%`, label: t('weather.humidity') },
              { icon: Wind, value: `${Math.round(weather.current.windSpeed)} km/h`, label: t('weather.windSpeed') },
              { icon: CloudRain, value: `${weather.current.rainfall} mm`, label: t('weather.rainfall') },
              { icon: Thermometer, value: `UV ${weather.current.uvIndex}`, label: t('weather.uvIndex') },
            ].map((metric, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="rounded-xl bg-white/10 backdrop-blur-sm p-4 text-center"
              >
                <metric.icon className="h-5 w-5 mx-auto mb-2 text-blue-100" />
                <p className="text-xl font-semibold">{metric.value}</p>
                <p className="text-xs text-blue-100">{metric.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* 7-Day Forecast */}
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-emerald-600" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {language === 'mr' ? '7 दिवसांचे अंदाज' : language === 'hi' ? '7 दिनों का पूर्वानुमान' : '7-Day Forecast'}
        </h2>
        <span className="text-sm text-slate-400 dark:text-slate-500 ml-1">
          ({language === 'mr' ? 'विस्तारासाठी क्लिक करा' : language === 'hi' ? 'विवरण के लिए क्लिक करें' : 'click for details'})
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {weather.forecast.map((day: any, idx: number) => {
          const dayGradient = getWeatherCardGradient(day.condition || 'Clear');
          return (
            <motion.button
              key={idx}
              onClick={() => setSelectedDay(idx)}
              whileHover={{ scale: 1.04, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'relative overflow-hidden rounded-2xl p-4 text-center transition-all hover:shadow-xl border border-white/20',
                'bg-gradient-to-br',
                dayGradient
              )}
            >
              {/* Glass overlay */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
              
              <div className="relative z-10">
                <p className="text-xs text-white/80 font-medium">
                  {idx === 0
                    ? (language === 'mr' ? 'आज' : language === 'hi' ? 'आज' : 'Today')
                    : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </p>
                <div className="w-12 h-12 mx-auto my-2">
                  {getWeatherAnimation(day.condition, 'w-full h-full')}
                </div>
                <p className="font-bold text-white text-lg">{Math.round(day.temperature?.avg || day.temperature)}°</p>
                <p className="text-xs text-white/70">
                  {Math.round(day.temperature?.min)}° / {Math.round(day.temperature?.max)}°
                </p>
                {(day.rainfall || 0) > 0 && (
                  <p className="mt-1 text-xs text-blue-200 font-medium">{Math.round(day.rainfall)}mm</p>
                )}
                {/* Humidity indicator */}
                <div className="mt-2 flex items-center justify-center gap-1 text-white/60">
                  <Droplets className="h-3 w-3" />
                  <span className="text-[10px]">{day.humidity || 60}%</span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Alerts & Recommendations - Only show if data exists */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Weather Alerts - Only show if there are alerts */}
        {(weather.alerts || []).length > 0 && (
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
                {t('weather.alerts')}
                <span className="ml-2 px-2 py-0.5 text-xs bg-amber-500 text-white rounded-full">
                  {weather.alerts.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weather.alerts.map((alert: any, idx: number) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="rounded-lg p-3 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500"
                  >
                    <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm">{alert.title}</p>
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{alert.description}</p>
                    {alert.severity && (
                      <span className={cn(
                        'mt-2 inline-block px-2 py-0.5 text-[10px] rounded-full font-medium',
                        alert.severity === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                        alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      )}>
                        {alert.severity === 'high' 
                          ? (language === 'mr' ? 'उच्च' : language === 'hi' ? 'उच्च' : 'High')
                          : alert.severity === 'medium'
                          ? (language === 'mr' ? 'मध्यम' : language === 'hi' ? 'मध्यम' : 'Medium')
                          : (language === 'mr' ? 'कमी' : language === 'hi' ? 'कम' : 'Low')
                        }
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Crop Recommendations - Enhanced with more details */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 md:col-span-{(weather.alerts || []).length > 0 ? 1 : 2}">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Sprout className="h-5 w-5" />
              {language === 'mr' ? 'पीक शिफारसी' : language === 'hi' ? 'फसल सिफारिशें' : 'Crop Recommendations'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(weather.cropRecommendations || []).length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                  <Sprout className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="text-slate-400 dark:text-slate-500 text-sm">
                  {language === 'mr' ? 'शिफारसी उपलब्ध नाहीत' : language === 'hi' ? 'कोई सिफारिश उपलब्ध नहीं' : 'No recommendations available'}
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {(weather.cropRecommendations || []).map((rec: any, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border p-4 transition-all hover:shadow-md',
                      rec.priority === 'high' ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800' :
                      rec.priority === 'medium' ? 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800' :
                      'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                    )}
                  >
                    <div className={cn('rounded-xl p-2.5 flex-shrink-0',
                      rec.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                      rec.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                      'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    )}>
                      <Sprout className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{rec.cropName}</p>
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium flex-shrink-0',
                          rec.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                          rec.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                          'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        )}>
                          {rec.priority === 'high' 
                            ? (language === 'mr' ? 'उच्च' : language === 'hi' ? 'उच्च' : 'High')
                            : rec.priority === 'medium'
                            ? (language === 'mr' ? 'मध्यम' : language === 'hi' ? 'मध्यम' : 'Medium')
                            : (language === 'mr' ? 'सामान्य' : language === 'hi' ? 'सामान्य' : 'Normal')
                          }
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{rec.action}</p>
                      {rec.reason && (
                        <p className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-slate-400" />
                          {rec.reason}
                        </p>
                      )}
                      {rec.impact && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className={cn(
                            'text-[10px] px-2 py-0.5 rounded-full',
                            rec.impact === 'positive' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            rec.impact === 'negative' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          )}>
                            {rec.impact === 'positive' 
                              ? (language === 'mr' ? 'सकारात्मक' : language === 'hi' ? 'सकारात्मक' : 'Positive')
                              : rec.impact === 'negative'
                              ? (language === 'mr' ? 'नकारात्मक' : language === 'hi' ? 'नकारात्मक' : 'Negative')
                              : (language === 'mr' ? 'तटस्थ' : language === 'hi' ? 'तटस्थ' : 'Neutral')
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Farmers Advisory Sidebar */}
      <FarmersAdvisory
        isOpen={showAdvisory}
        onClose={() => setShowAdvisory(false)}
        weatherData={weather}
        crops={(weather.cropRecommendations || []).map((r: any) => r.cropName)}
      />

      {/* Location Picker Modal */}
      <LocationPicker
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelect={handleLocationSelect}
        initialLocation={sessionLocation || undefined}
      />
    </motion.div>
  );
}
