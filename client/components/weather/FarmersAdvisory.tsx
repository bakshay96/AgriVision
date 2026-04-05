'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Sprout, Droplets, Sun, Wind, Leaf, ThumbsUp, Info } from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';

interface AdvisoryItem {
  id: string;
  type: 'warning' | 'suggestion' | 'info';
  icon: React.ElementType;
  title: string;
  description: string;
  affectedCrops?: string[];
  action?: string;
}

interface FarmersAdvisoryProps {
  isOpen: boolean;
  onClose: () => void;
  weatherData: {
    current: {
      temperature: number;
      condition: string;
      rainfall: number;
      humidity: number;
      windSpeed: number;
    };
    forecast: Array<{
      date: string;
      condition: string;
      rainfall: number;
      temperature: { max: number; min: number };
    }>;
  };
  crops: string[];
}

export default function FarmersAdvisory({ isOpen, onClose, weatherData, crops }: FarmersAdvisoryProps) {
  const { t, language } = useLanguageStore();

  const generateAdvisories = (): AdvisoryItem[] => {
    const advisories: AdvisoryItem[] = [];
    const { current, forecast } = weatherData;

    // Check for rain in next 48 hours
    const next48hRain = forecast.slice(0, 2).some(day => day.rainfall > 5);
    if (next48hRain || current.rainfall > 0) {
      advisories.push({
        id: 'spray-warning',
        type: 'warning',
        icon: Droplets,
        title: language === 'mr' ? 'फवारणी टाळा' : language === 'hi' ? 'छिड़काव से बचें' : 'Avoid Spraying',
        description: language === 'mr'
          ? 'पुढील 48 तासांत पाऊस अपेक्षित आहे. कीटकनाशके आणि खतांची फवारणी पुढे ढकला.'
          : language === 'hi'
          ? 'अगले 48 घंटों में बारिश की संभावना है। कीटनाशक और उर्वरक छिड़काव स्थगित करें।'
          : 'Rain expected in the next 48 hours. Postpone pesticide and fertilizer spraying to prevent washout.',
        affectedCrops: crops.slice(0, 3),
        action: language === 'mr' ? 'पाऊस थांबल्यावर फवारणी करा' : language === 'hi' ? 'बारिश के बाद छिड़काव करें' : 'Spray after rain stops',
      });
    }

    // Check for high heat
    const maxTemp = Math.max(...forecast.slice(0, 3).map(d => d.temperature.max));
    if (maxTemp > 38 || current.temperature > 38) {
      advisories.push({
        id: 'heat-warning',
        type: 'warning',
        icon: Sun,
        title: language === 'mr' ? 'उष्णतेचा धोका' : language === 'hi' ? 'गर्मी का खतरा' : 'Heat Stress Alert',
        description: language === 'mr'
          ? `तापमान ${maxTemp}°C पर्यंत पोहोचेल. सिंचनाची वारंवारता वाढवा आणि संवेदनशील पिकांसाठी सावली वापरा.`
          : language === 'hi'
          ? `तापमान ${maxTemp}°C तक पहुंचने की संभावना है। सिंचाई की आवृत्ति बढ़ाएं।`
          : `Temperature may reach ${maxTemp}°C. Increase irrigation frequency and use shade nets for sensitive crops.`,
        affectedCrops: ['Tomato', 'Capsicum', 'Lettuce'],
        action: language === 'mr' ? 'सकाळी आणि संध्याकाळी सिंचन करा' : language === 'hi' ? 'सुबह-शाम सिंचाई करें' : 'Irrigate in morning & evening',
      });
    }

    // High wind warning
    if (current.windSpeed > 25) {
      advisories.push({
        id: 'wind-warning',
        type: 'warning',
        icon: Wind,
        title: language === 'mr' ? 'वाऱ्याचा इशारा' : language === 'hi' ? 'तेज हवा चेतावनी' : 'High Wind Alert',
        description: language === 'mr'
          ? '25 km/h पेक्षा जास्त वाऱ्याचा वेग. सैल संरचना सुरक्षित करा.'
          : language === 'hi'
          ? '25 km/h से अधिक हवा। ढीली संरचनाओं को सुरक्षित करें।'
          : 'Wind speeds exceeding 25 km/h. Secure loose structures and delay spraying operations.',
        affectedCrops: ['Tall crops', 'Young plants'],
        action: language === 'mr' ? 'सहाय्यक खांब लावा' : language === 'hi' ? 'सहायक खंभे लगाएं' : 'Install support stakes',
      });
    }

    // Optimal sowing conditions
    if (current.humidity > 60 && current.temperature > 20 && current.temperature < 30 && current.rainfall === 0) {
      advisories.push({
        id: 'sowing-suggestion',
        type: 'suggestion',
        icon: Sprout,
        title: language === 'mr' ? 'पेरणीसाठी उत्तम परिस्थिती' : language === 'hi' ? 'बुआई के लिए आदर्श स्थिति' : 'Ideal Sowing Conditions',
        description: language === 'mr'
          ? 'सध्याची परिस्थिती खरीप पिकांच्या पेरणीसाठी आदर्श आहे. मातीतील ओलावा पुरेसा आहे.'
          : language === 'hi'
          ? 'वर्तमान स्थिति खरीफ फसलों की बुआई के लिए आदर्श है।'
          : 'Current conditions are ideal for sowing Kharif crops. Soil moisture is adequate.',
        affectedCrops: ['Rice', 'Cotton', 'Soybean', 'Maize'],
        action: language === 'mr' ? 'आजच पेरणी सुरू करा' : language === 'hi' ? 'आज बुआई शुरू करें' : 'Begin sowing today',
      });
    }

    // General good weather
    if (current.temperature >= 20 && current.temperature <= 32 && current.humidity >= 40 && current.humidity <= 70) {
      advisories.push({
        id: 'fertilizer-suggestion',
        type: 'info',
        icon: Leaf,
        title: language === 'mr' ? 'खत देण्यासाठी योग्य वेळ' : language === 'hi' ? 'उर्वरक देने का सही समय' : 'Good Time for Fertilization',
        description: language === 'mr'
          ? 'हवामान खत देण्यासाठी अनुकूल आहे. NPK खत मातीत मिसळा.'
          : language === 'hi'
          ? 'मौसम उर्वरक देने के लिए अनुकूल है। NPK उर्वरक मिट्टी में मिलाएं।'
          : 'Weather conditions are favorable for fertilization. Mix NPK fertilizer into the soil.',
        affectedCrops: crops.slice(0, 4),
        action: language === 'mr' ? 'NPK 10:26:26 वापरा' : language === 'hi' ? 'NPK 10:26:26 उपयोग करें' : 'Apply NPK 10:26:26',
      });
    }

    return advisories;
  };

  const advisories = generateAdvisories();

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'warning': return { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-l-4 border-amber-500', icon: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' };
      case 'suggestion': return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-l-4 border-emerald-500', icon: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' };
      default: return { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-l-4 border-blue-500', icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Right Sidebar Panel */}
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-emerald-600 to-emerald-700 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {t('weather.advisory.title')}
                  </h2>
                  <p className="text-sm text-emerald-100">
                    {language === 'mr' ? 'हवामान आधारित सल्ला' : language === 'hi' ? 'मौसम आधारित सलाह' : 'Weather-based Recommendations'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Weather Summary Bar */}
            <div className="px-6 py-4 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800 flex-shrink-0">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-slate-600 dark:text-slate-300">🌡️ {Math.round(weatherData.current.temperature)}°C</span>
                  <span className="text-slate-600 dark:text-slate-300">💧 {weatherData.current.humidity}%</span>
                  <span className="text-slate-600 dark:text-slate-300">💨 {Math.round(weatherData.current.windSpeed)} km/h</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  advisories.filter(a => a.type === 'warning').length > 0
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                }`}>
                  {advisories.filter(a => a.type === 'warning').length} {language === 'mr' ? 'इशारे' : language === 'hi' ? 'चेतावनी' : 'Alerts'}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {advisories.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <ThumbsUp className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {language === 'mr' ? 'सर्व ठीक आहे!' : language === 'hi' ? 'सब ठीक है!' : 'All Clear!'}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {language === 'mr'
                      ? 'हवामान परिस्थिती आपल्या पिकांसाठी अनुकूल आहे.'
                      : language === 'hi'
                      ? 'मौसम की स्थिति आपकी फसलों के लिए अनुकूल है।'
                      : 'Weather conditions are favorable for your crops. Continue with regular farming activities.'}
                  </p>
                </div>
              ) : (
                advisories.map((advisory, idx) => {
                  const Icon = advisory.icon;
                  const styles = getTypeStyles(advisory.type);
                  return (
                    <motion.div
                      key={advisory.id}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className={`rounded-xl p-4 ${styles.bg} ${styles.border}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${styles.icon}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                            {advisory.title}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                            {advisory.description}
                          </p>

                          {/* Action Button */}
                          {advisory.action && (
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                {language === 'mr' ? 'कृती:' : language === 'hi' ? 'कार्रवाई:' : 'Action:'}
                              </span>
                              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-800 px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-700">
                                {advisory.action}
                              </span>
                            </div>
                          )}

                          {/* Affected Crops */}
                          {advisory.affectedCrops && advisory.affectedCrops.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {advisory.affectedCrops.map((crop) => (
                                <span
                                  key={crop}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600"
                                >
                                  🌱 {crop}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'mr'
                    ? 'सल्ले रिअल-टाइम हवामान डेटावर आधारित आहेत'
                    : language === 'hi'
                    ? 'सलाह रियल-टाइम मौसम डेटा पर आधारित हैं'
                    : 'Advisories updated based on real-time weather data'}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
