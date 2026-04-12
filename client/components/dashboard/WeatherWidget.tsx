'use client';

import { useState, useEffect } from 'react';
import { 
  Cloud, Sun, CloudRain, Wind, MapPin, Loader2, ChevronDown, ChevronUp, 
  AlertTriangle, Droplets, ThermometerSun, Clock, CloudSnow, CloudLightning, 
  CloudFog, Search, Eye, Gauge, Thermometer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useUserProfile } from '@/hooks/useUser';
import { cn } from '@/lib/utils';
import { getWeatherAnimation, getWeatherCardGradient } from '@/components/weather/WeatherAnimations';
import LocationPicker from '@/components/location/LocationPicker';
import { weatherApi } from '@/lib/api';
import { toast } from 'sonner';

interface CurrentWeather {
  temperature: number;
  humidity: number;
  windspeed?: number;
  windSpeed?: number;
  rainfall: number;
  condition: string;
  icon: string;
  uvIndex: number;
  feelsLike: number;
  pressure: number;
  visibility: number;
  lastUpdated: string;
}

interface ForecastDay {
  date: string;
  temperature: {
    min: number;
    max: number;
    avg: number;
  };
  humidity: number;
  rainfall: number;
  windSpeed: number;
  condition: string;
  icon: string;
  uvIndex: number;
  precipitationProbability: number;
}

interface WeatherData {
  current: CurrentWeather;
  forecast: ForecastDay[];
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  alerts: Array<{
    type: string;
    severity: string;
    title: string;
    description: string;
  }>;
}

interface WeatherWidgetProps {
  crops?: any[];
}

// Map condition names to display text
const getConditionDisplay = (condition: string): string => {
  const conditionMap: Record<string, string> = {
    'Clear': 'Clear sky',
    'Clouds': 'Cloudy',
    'Rain': 'Rain',
    'Drizzle': 'Drizzle',
    'Thunderstorm': 'Thunderstorm',
    'Snow': 'Snow',
    'Mist': 'Foggy',
    'Haze': 'Hazy',
  };
  return conditionMap[condition] || condition;
};

const translations = {
  en: {
    clear: 'Clear sky', cloudy: 'Partly cloudy', fog: 'Foggy', rain: 'Rain / Drizzle',
    snow: 'Snow fall', storm: 'Thunderstorm', unavail: 'Weather data unavailable',
    alerts: 'Weather Alerts', cropImpact: 'Crop Impact', noCrops: 'Add crops to view impacts.',
    stable: 'Stable', needsWater: 'Needs Water', optimal: 'Optimal conditions.',
    highTemp: 'High temperature alert. Ensure adequate irrigation.',
    heavyRain: 'Heavy rain forecasted. Halt pesticide spraying.',
    highWind: 'High winds detected. Watch for crop damage.',
    hourly: "Today's Forecast", farmerSuggestion: 'Farmer Suggestion',
    suggClear: 'Great day to apply fertilizers or prepare soil.',
    suggRain: 'Delay chemical sprays. Check drainage channels.',
    windSpeed: 'km/h', humidity: 'Humidity', pressure: 'Pressure', visibility: 'Visibility',
    setLocation: 'Set Your Location', setLocationDesc: 'Set your farm location to get accurate weather forecasts.',
    searchLocation: 'Search Location',
    feelsLike: 'Feels like',
    lastUpdated: 'Last updated',
  },
  hi: {
    clear: 'साफ आसमान', cloudy: 'आंशिक बादल', fog: 'कोहरा', rain: 'बारिश',
    snow: 'बर्फबारी', storm: 'आंधी तूफान', unavail: 'मौसम डेटा अनुपलब्ध',
    alerts: 'मौसम चेतावनी', cropImpact: 'फसल प्रभाव', noCrops: 'फसलें जोड़ें।',
    stable: 'स्थिर', needsWater: 'पानी चाहिए', optimal: 'अनुकूल मौसम।',
    highTemp: 'उच्च तापमान चेतावनी। पर्याप्त सिंचाई सुनिश्चित करें।',
    heavyRain: 'भारी बारिश का अनुमान। कीटनाशक छिड़काव रोकें।',
    highWind: 'तेज हवाएं। फसलों को नुकसान से बचाएं।',
    hourly: 'आज का पूर्वानुमान', farmerSuggestion: 'किसान सुझाव',
    suggClear: 'उर्वरक डालने के लिए बढ़िया दिन।',
    suggRain: 'रासायनिक छिड़काव में देरी करें।',
    windSpeed: 'किमी/घंटा', humidity: 'आर्द्रता', pressure: 'दबाव', visibility: 'दृश्यता',
    setLocation: 'स्थान सेट करें', setLocationDesc: 'सटीक मौसम पूर्वानुमान के लिए अपने खेत का स्थान सेट करें।',
    searchLocation: 'स्थान खोजें',
    feelsLike: 'महसूस होता है',
    lastUpdated: 'अंतिम अपडेट',
  },
  mr: {
    clear: 'निरभ्र आकाश', cloudy: 'अंशतः ढगाळ', fog: 'धुके', rain: 'पाऊस',
    snow: 'हिमवर्षाव', storm: 'वादळ', unavail: 'हवामान डेटा उपलब्ध नाही',
    alerts: 'हवामान सूचना', cropImpact: 'पीक प्रभाव', noCrops: 'पिके जोडा.',
    stable: 'स्थिर', needsWater: 'पाण्याची गरज', optimal: 'अनुकूल हवामान.',
    highTemp: 'उच्च तापमान! योग्य सिंचन सुनिश्चित करा.',
    heavyRain: 'मुसळधार पाऊस. कीटकनाशक फवारणी थांबवा.',
    highWind: 'सोसाट्याचा वारा. पिकांचे संरक्षण करा.',
    hourly: 'आजचा अंदाज', farmerSuggestion: 'शेतकरी सल्ला',
    suggClear: 'खते देण्यासाठी उत्तम दिवस.',
    suggRain: 'फवारणी पुढे ढकला.',
    windSpeed: 'किमी/तास', humidity: 'आर्द्रता', pressure: 'दाब', visibility: 'दृश्यता',
    setLocation: 'स्थान सेट करा', setLocationDesc: 'अचूक हवामान अंदाजासाठी तुमचे शेत स्थान सेट करा.',
    searchLocation: 'स्थान शोधा',
    feelsLike: 'जाणवते',
    lastUpdated: 'शेवटचे अपडेट',
  }
};

export default function WeatherWidget({ crops = [] }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [sessionLocation, setSessionLocation] = useState<{ lat: number, lng: number, address: string } | null>(null);
  
  const { language } = useLanguageStore();
  const { data: profile } = useUserProfile();
  const t = (key: keyof typeof translations.en) => translations[language as keyof typeof translations]?.[key] || translations.en[key];

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

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        
        // Use session location or profile location
        const latitude = sessionLocation?.lat || profile?.farmLocation?.lat;
        const longitude = sessionLocation?.lng || profile?.farmLocation?.lng;

        if (!latitude || !longitude) {
          setLoading(false);
          return;
        }

        // If we have a session location, update the weather location first
        if (sessionLocation) {
          try {
            await weatherApi.updateLocation({
              lat: sessionLocation.lat,
              lng: sessionLocation.lng,
              address: sessionLocation.address,
            });
          } catch (e) {
            console.log('Could not update weather location, using cached data');
          }
        }

        // Fetch weather from backend API
        const response = await weatherApi.getWeather();
        const weatherData = response.data.data.weather;
        
        setWeather(weatherData);
      } catch (error) {
        console.error('Failed to fetch weather:', error);
        toast.error('Failed to fetch weather data');
      } finally {
        setLoading(false);
      }
    };

    if (sessionLocation || profile?.farmLocation?.lat) {
      fetchWeather();
    } else {
      setLoading(false);
    }
  }, [profile, sessionLocation]);

  const handleLocationSelect = async (location: {
    lat: number; lng: number; address: string;
    village?: string; taluka?: string; district?: string; state?: string; pincode?: string;
  }) => {
    const newLoc = { lat: location.lat, lng: location.lng, address: location.address };
    setSessionLocation(newLoc);
    localStorage.setItem('agrivision_session_location', JSON.stringify(newLoc));
    
    // Update weather location on backend
    try {
      await weatherApi.updateLocation(newLoc);
      toast.success('Location updated! Fetching weather data...');
      // Trigger a re-fetch
      setWeather(null);
    } catch (error) {
      toast.error('Failed to update location');
    }
  };

  const getAlerts = () => {
    if (!weather) return [];
    const alerts = [];
    if (weather.current.temperature > 35) {
      alerts.push({ type: 'danger', icon: <ThermometerSun className="h-4 w-4 text-red-400" />, text: t('highTemp') });
    }
    if (weather.current.condition === 'Rain' || weather.current.condition === 'Thunderstorm') {
      alerts.push({ type: 'warning', icon: <Droplets className="h-4 w-4 text-amber-400" />, text: t('heavyRain') });
    }
    if ((weather.current.windSpeed || weather.current.windspeed || 0) > 30) {
      alerts.push({ type: 'warning', icon: <Wind className="h-4 w-4 text-amber-400" />, text: t('highWind') });
    }
    return alerts;
  };

  const alerts = getAlerts();
  const condition = weather?.current?.condition ? getConditionDisplay(weather.current.condition) : 'Clear sky';
  const locationName = weather?.location?.address || sessionLocation?.address || profile?.farmLocation?.address || '';
  
  // Get today's forecast from the forecast array
  const todayForecast = weather?.forecast?.[0];

  if (!loading && !locationName) {
    return (
      <div className="w-full bg-gradient-to-br from-blue-50 to-sky-100 dark:from-slate-900 dark:to-slate-800 border border-blue-200 dark:border-slate-700 rounded-2xl p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <MapPin className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{t('setLocation')}</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4 max-w-sm mx-auto">{t('setLocationDesc')}</p>
          <button
            onClick={() => setShowLocationPicker(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors mx-auto"
          >
            <Search className="h-4 w-4" />
            {t('searchLocation')}
          </button>
        </div>
        <LocationPicker isOpen={showLocationPicker} onClose={() => setShowLocationPicker(false)} onSelect={handleLocationSelect} />
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("w-full rounded-2xl overflow-hidden shadow-xl transition-all duration-500 bg-gradient-to-br", getWeatherCardGradient(condition))}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
          
          {/* Header */}
          <div className="relative p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/90">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium truncate max-w-[200px]">{locationName}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowLocationPicker(true)} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors" title="Change location">
                <Search className="h-3.5 w-3.5 text-white" />
              </button>
              {alerts.length > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-900 bg-amber-300 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="h-3 w-3" /> {alerts.length}
                </span>
              )}
              <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                {expanded ? <ChevronUp className="h-4 w-4 text-white" /> : <ChevronDown className="h-4 w-4 text-white" />}
              </button>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="relative px-6 pb-6">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-white/70" />
              </div>
            ) : weather ? (
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 md:w-24 md:h-24">
                    {getWeatherAnimation(condition, 'w-full h-full')}
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-5xl md:text-6xl font-bold text-white tracking-tight">{Math.round(weather.current.temperature)}°</p>
                    <p className="text-lg text-white/90 font-medium">{condition}</p>
                    <p className="text-sm text-white/70">{t('feelsLike')} {Math.round(weather.current.feelsLike)}°</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Droplets, value: `${weather.current.humidity}%`, label: t('humidity') },
                    { icon: Wind, value: `${Math.round(weather.current.windSpeed || weather.current.windspeed || 0)} km/h`, label: t('windSpeed') },
                    { icon: Gauge, value: `${Math.round(weather.current.pressure)} hPa`, label: t('pressure') },
                    { icon: Eye, value: `${weather.current.visibility.toFixed(1)} km`, label: t('visibility') },
                  ].map((item, idx) => (
                    <div key={idx} className="text-center p-2 rounded-xl bg-white/10 backdrop-blur-sm">
                      <item.icon className="h-4 w-4 mx-auto mb-1 text-white/70" />
                      <p className="text-sm font-semibold text-white">{item.value}</p>
                      <p className="text-[10px] text-white/60">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-white/70">{t('unavail')}</p>
            )}
          </div>
        </div>
        
        {/* Expanded Content */}
        <AnimatePresence>
          {expanded && weather && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white/10 backdrop-blur-md border-t border-white/20"
            >
              <div className="p-4 space-y-4">
                {/* Today's Forecast Hours */}
                <div>
                  <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {t('hourly')}
                  </h4>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {/* Show today's forecast details */}
                    {todayForecast && (
                      <>
                        <div className="min-w-[60px] flex flex-col items-center p-2 rounded-lg bg-white/10">
                          <span className="text-[10px] text-white/60">Now</span>
                          <span className="text-sm font-bold text-white mt-1">{Math.round(weather.current.temperature)}°</span>
                        </div>
                        <div className="min-w-[60px] flex flex-col items-center p-2 rounded-lg bg-white/10">
                          <span className="text-[10px] text-white/60">Min</span>
                          <span className="text-sm font-bold text-white mt-1">{Math.round(todayForecast.temperature.min)}°</span>
                        </div>
                        <div className="min-w-[60px] flex flex-col items-center p-2 rounded-lg bg-white/10">
                          <span className="text-[10px] text-white/60">Max</span>
                          <span className="text-sm font-bold text-white mt-1">{Math.round(todayForecast.temperature.max)}°</span>
                        </div>
                        <div className="min-w-[60px] flex flex-col items-center p-2 rounded-lg bg-white/10">
                          <span className="text-[10px] text-white/60">Rain</span>
                          <span className="text-sm font-bold text-white mt-1">{todayForecast.precipitationProbability}%</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Alerts & Suggestions */}
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/10">
                    <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2">{t('farmerSuggestion')}</h4>
                    <p className="text-xs text-white/90 leading-relaxed">
                      {weather.current.condition === 'Rain' || weather.current.condition === 'Thunderstorm' 
                        ? t('suggRain') 
                        : t('suggClear')}
                    </p>
                  </div>
                  
                  <div className="p-3 rounded-xl bg-white/10">
                    <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2">{t('alerts')}</h4>
                    {alerts.length > 0 ? (
                      <div className="space-y-2">
                        {alerts.map((alert, idx) => (
                          <div key={idx} className="flex gap-2 items-start">
                            <div className="mt-0.5">{alert.icon}</div>
                            <p className="text-xs text-white/90">{alert.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <p className="text-xs text-white/90">{t('optimal')}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Crop Impact */}
                {crops.length > 0 && (
                  <div className="p-3 rounded-xl bg-white/10">
                    <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2">{t('cropImpact')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {crops.slice(0, 5).map((crop, i) => (
                        <span key={i} className={`text-[10px] px-2 py-1 rounded-full font-medium ${weather.current.temperature > 30 ? 'bg-blue-500/30 text-blue-100' : 'bg-emerald-500/30 text-emerald-100'}`}>
                          {crop.name}: {weather.current.temperature > 30 ? t('needsWater') : t('stable')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Last Updated */}
                {weather.current.lastUpdated && (
                  <div className="text-center">
                    <span className="text-[10px] text-white/50">
                      {t('lastUpdated')}: {new Date(weather.current.lastUpdated).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <LocationPicker isOpen={showLocationPicker} onClose={() => setShowLocationPicker(false)} onSelect={handleLocationSelect} initialLocation={sessionLocation || undefined} />
    </>
  );
}
