'use client';

import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, MapPin, Loader2, ChevronDown, ChevronUp, AlertTriangle, Droplets, ThermometerSun, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useUserProfile } from '@/hooks/useUser';

interface WeatherData {
  temperature: number;
  windspeed: number;
  weathercode: number;
  is_day: number;
  time: string;
}

interface HourlyData {
  time: string[];
  temperature_2m: number[];
  relativehumidity_2m: number[];
}

interface WeatherWidgetProps {
  crops?: any[];
}

export default function WeatherWidget({ crops = [] }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [hourly, setHourly] = useState<HourlyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState('');
  const [expanded, setExpanded] = useState(false);
  
  const { language } = useLanguageStore();
  const { data: profile } = useUserProfile();

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number, locationLabel?: string) => {
      try {
        // Use provided location label or reverse geocode
        if (locationLabel) {
          setLocationName(locationLabel);
        } else {
          // Reverse Geocode (Simple OpenStreetMap)
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
            .then(r => r.json())
            .then(d => {
              const addr = d.address;
              const city = addr.city || addr.town || addr.village || addr.suburb || addr.state_district;
              if (city) setLocationName(city);
            }).catch(() => {});
        }

        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m`);
        const data = await res.json();
        if (data.current_weather) {
          setWeather(data.current_weather);
          setHourly(data.hourly);
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      } finally {
        setLoading(false);
      }
    };

    // Use user's farmLocation from profile if available
    if (profile?.farmLocation?.lat && profile?.farmLocation?.lng) {
      const locationLabel = profile.farmLocation.address || 
                           (profile.village ? `${profile.village}, ${profile.district || ''}` : '') ||
                           (profile.district ? profile.district : '');
      fetchWeather(profile.farmLocation.lat, profile.farmLocation.lng, locationLabel);
    } else {
      // Fallback to browser geolocation if no profile location
      const detectLoc = () => {
        if (language === 'hi') setLocationName('स्थान का पता लगा रहा है...');
        else if (language === 'mr') setLocationName('स्थान शोधत आहे...');
        else setLocationName('Detecting location...');
      };
      detectLoc();

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            if (language === 'hi') setLocationName('वर्तमान स्थान');
            else if (language === 'mr') setLocationName('सध्याचे स्थान');
            else setLocationName('Current Location');
            fetchWeather(latitude, longitude);
          },
          () => {
            setLocationName('New Delhi, India');
            fetchWeather(28.6139, 77.2090);
          }
        );
      } else {
        setLocationName('New Delhi, India');
        fetchWeather(28.6139, 77.2090);
      }
    }
  }, [language, profile]);

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="h-10 w-10 text-amber-500" />;
    if (code >= 1 && code <= 3) return <Cloud className="h-10 w-10 text-slate-400 dark:text-slate-200" />;
    if (code >= 51 && code <= 99) return <CloudRain className="h-10 w-10 text-blue-500" />;
    return <Cloud className="h-10 w-10 text-slate-400" />;
  };

  const translations = {
    en: {
      clear: 'Clear sky',
      cloudy: 'Partly cloudy',
      fog: 'Foggy',
      rain: 'Rain / Drizzle',
      snow: 'Snow fall',
      storm: 'Thunderstorm',
      unavail: 'Weather data unavailable',
      alerts: 'Weather Alerts & Advisory',
      cropImpact: 'Crop Impact Analysis',
      noCrops: 'Add crops to your farm to view personalized weather impacts.',
      stable: 'Stable',
      needsWater: 'Needs Water',
      optimal: 'Optimal weather conditions. Routine farming activities are safe.',
      highTemp: 'High temperature alert. Ensure adequate irrigation for heat-sensitive crops.',
      heavyRain: 'Heavy rain forecasted. Halt pesticide/fungicide spraying to prevent wash-off.',
      highWind: 'High winds detected. Watch for physical damage to tall crops.',
      hourly: 'Today\'s Forecast',
      farmerSuggestion: 'Farmer Suggestion',
      suggClear: 'Great day to apply fertilizers or prepare the soil.',
      suggRain: 'Delay chemical sprays. Check drainage channels in the field.',
      windSpeed: 'km/h',
    },
    hi: {
      clear: 'साफ आसमान',
      cloudy: 'आंशिक रूप से बादल',
      fog: 'कोहरा',
      rain: 'बारिश / बूंदाबांदी',
      snow: 'बर्फबारी',
      storm: 'आंधी तूफान',
      unavail: 'मौसम डेटा अनुपलब्ध',
      alerts: 'मौसम चेतावनी और सलाह',
      cropImpact: 'फसल प्रभाव विश्लेषण',
      noCrops: 'व्यक्तिगत मौसम प्रभाव देखने के लिए अपने खेत में फसलें जोड़ें।',
      stable: 'स्थिर',
      needsWater: 'पानी चाहिए',
      optimal: 'अनुकूल मौसम। सामान्य खेती की गतिविधियाँ सुरक्षित हैं।',
      highTemp: 'उच्च तापमान चेतावनी। गर्मी के प्रति संवेदनशील फसलों के लिए पर्याप्त सिंचाई सुनिश्चित करें।',
      heavyRain: 'भारी बारिश का अनुमान। कीटनाशक छिड़काव रोक दें।',
      highWind: 'तेज हवाएं। लंबी फसलों को संभावित नुकसान से बचाएं।',
      hourly: 'आज का पूर्वानुमान',
      farmerSuggestion: 'किसान के लिए सुझाव',
      suggClear: 'उर्वरक डालने या मिट्टी तैयार करने के लिए बढ़िया दिन है।',
      suggRain: 'रासायनिक छिड़काव में देरी करें। खेत में जलनिकासी की जांच करें।',
      windSpeed: 'किमी/घंटा',
    },
    mr: {
      clear: 'निरभ्र आकाश',
      cloudy: 'अंशतः ढगाळ',
      fog: 'धुके',
      rain: 'पाऊस / रिमझिम',
      snow: 'हिमवर्षाव',
      storm: 'वादळ',
      unavail: 'हवामानाचा डेटा उपलब्ध नाही',
      alerts: 'हवामान सूचना आणि सल्ला',
      cropImpact: 'पीक प्रभाव विश्लेषण',
      noCrops: 'वैयक्तिक हवामान प्रभाव पाहण्यासाठी तुमच्या शेतात पिके जोडा.',
      stable: 'स्थिर',
      needsWater: 'पाण्याची गरज',
      optimal: 'अनुकूल हवामान. दैनंदिन शेतीची कामे सुरक्षित आहेत.',
      highTemp: 'उच्च तापमान! उष्णतेला संवेदनशील पिकांसाठी योग्य सिंचन सुनिश्चित करा.',
      heavyRain: 'मुसळधार पावसाचा अंदाज. कीटकनाशकांची फवारणी थांबवा.',
      highWind: 'सोसाट्याचा वारा. उंच पिकांचे संरक्षण करा.',
      hourly: 'आजचा अंदाज',
      farmerSuggestion: 'शेतकऱ्यांसाठी सल्ला',
      suggClear: 'खते देण्यासाठी किंवा मातीची तयारी करण्यासाठी उत्तम दिवस.',
      suggRain: 'फवारणी पुढे ढकला. शेतातील पाण्याचा निचरा तपासा.',
      windSpeed: 'किमी/तास',
    }
  };

  const t = (key: keyof typeof translations.en) => translations[language as keyof typeof translations]?.[key] || translations.en[key];

  const getWeatherDesc = (code: number) => {
    if (code === 0) return t('clear');
    if (code >= 1 && code <= 3) return t('cloudy');
    if (code >= 45 && code <= 48) return t('fog');
    if (code >= 51 && code <= 67) return t('rain');
    if (code >= 71 && code <= 77) return t('snow');
    if (code >= 95 && code <= 99) return t('storm');
    return t('cloudy');
  };

  const getAlerts = () => {
    if (!weather) return [];
    const alerts = [];
    if (weather.temperature > 35) {
      alerts.push({ type: 'danger', icon: <ThermometerSun className="h-4 w-4 text-red-500" />, text: t('highTemp') });
    }
    if (weather.weathercode >= 61 && weather.weathercode <= 99) {
      alerts.push({ type: 'warning', icon: <Droplets className="h-4 w-4 text-amber-500" />, text: t('heavyRain') });
    }
    if (weather.windspeed > 30) {
      alerts.push({ type: 'warning', icon: <Wind className="h-4 w-4 text-amber-500" />, text: t('highWind') });
    }
    return alerts;
  };

  const getNextFewHours = () => {
    if (!hourly || !weather) return [];
    const currentIndex = hourly.time.findIndex(t_str => t_str.startsWith(weather.time.substring(0, 13)));
    if (currentIndex === -1) return [];
    
    // Get next 12 hours
    const nextHours = [];
    for(let i=1; i<=12; i++) {
       if (hourly.time[currentIndex+i]) {
         const d = new Date(hourly.time[currentIndex+i]);
         const formattedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
         nextHours.push({
           time: formattedTime,
           temp: Math.round(hourly.temperature_2m[currentIndex+i])
         });
       }
    }
    return nextHours;
  };

  const alerts = getAlerts();
  const nextHours = getNextFewHours();

  return (
    <Card className="w-full bg-gradient-to-br from-blue-50 to-sky-100 dark:from-slate-900 dark:to-slate-800 border-blue-200 dark:border-slate-700 overflow-hidden cursor-pointer" onClick={() => setExpanded(!expanded)}>
      <CardHeader className="py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-blue-900 dark:text-blue-100">
            <MapPin className="h-4 w-4" /> {locationName}
          </CardTitle>
          <div className="flex items-center gap-2">
            {alerts.length > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                <AlertTriangle className="h-3 w-3" /> {alerts.length}
              </span>
            )}
            {expanded ? <ChevronUp className="h-5 w-5 text-slate-500 dark:text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-500 dark:text-slate-400" />}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
          </div>
        ) : weather ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getWeatherIcon(weather.weathercode)}
              <div>
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  {weather.temperature}°C
                </p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {getWeatherDesc(weather.weathercode)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 font-medium justify-end">
                <Wind className="h-4 w-4" />
                <span>{weather.windspeed} {t('windSpeed')}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('unavail')}</p>
        )}

        <AnimatePresence>
          {expanded && weather && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-blue-200/50 dark:border-slate-700 mt-4 pt-4"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Column 1: Hourly Forecast */}
                <div className="border border-indigo-100 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 rounded-xl p-3">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {t('hourly')}
                  </h4>
                  <div className="flex justify-between items-center text-center gap-2 overflow-x-auto pb-2">
                    {nextHours.map((hr, idx) => (
                      <div key={idx} className="min-w-[50px] flex flex-col items-center">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{hr.time}</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{hr.temp}°</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: Alerts & Suggestion */}
                <div className="col-span-1 lg:col-span-1 space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('farmerSuggestion')}</h4>
                  
                  {/* Smart suggestion based on weather code */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-lg shadow-sm">
                    <p className="text-[11px] font-medium leading-relaxed text-blue-800 dark:text-blue-100">
                      {weather.weathercode >= 60 ? t('suggRain') : t('suggClear')}
                    </p>
                  </div>
                  
                  {alerts.length > 0 ? (
                    <div className="space-y-2">
                      {alerts.map((alert, idx) => (
                        <div key={idx} className={`p-2 rounded-lg border flex gap-2 items-start shadow-sm ${alert.type === 'danger' ? 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800 text-red-800 dark:text-red-200' : 'bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800 text-amber-800 dark:text-amber-200'}`}>
                          <div className="mt-0.5">{alert.icon}</div>
                          <p className="text-[11px] leading-relaxed font-medium">{alert.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-lg flex items-center gap-2 shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-200 font-medium">{t('optimal')}</p>
                    </div>
                  )}
                </div>

                {/* Column 3: Crop Impacts */}
                <div className="col-span-1">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">{t('cropImpact')}</h4>
                  {crops.length > 0 ? (
                    <ul className="space-y-2">
                      {crops.slice(0, 3).map((crop, i) => (
                        <li key={i} className="flex justify-between items-center bg-white/80 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{crop.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${weather.temperature > 30 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
                            {weather.temperature > 30 ? t('needsWater') : t('stable')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">{t('noCrops')}</p>
                  )}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
