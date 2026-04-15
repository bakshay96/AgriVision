'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, MapPin, Calendar, Droplets, Sun, CloudRain, Wind } from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';
import { getHealthColor, getStatusColor, cn } from '@/lib/utils';
import Link from 'next/link';

interface Crop {
  _id?: string;
  name?: string;
  variety?: string;
  fieldLocation?: string;
  status?: string;
  healthScore?: string;
  areaAcres?: number;
  expectedYieldTons?: number;
  predictedHarvestDate?: string;
  expectedHarvestDate?: string;
  growthStage?: string;
  expectedYield?: number;
  moistureLevel?: number;
  temperature?: number;
  weatherCondition?: 'sunny' | 'cloudy' | 'rainy' | 'windy';
  lastIrrigation?: string;
  nextTask?: string;
  daysToHarvest?: number;
}

interface AutoSwapCropCardsProps {
  crops: Crop[];
  isLoading?: boolean;
}

const SWAP_INTERVAL = 4000; // 4 seconds

const weatherIcons = {
  sunny: Sun,
  cloudy: CloudRain,
  rainy: Droplets,
  windy: Wind,
};

const weatherColors = {
  sunny: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30',
  cloudy: 'text-slate-500 bg-slate-50 dark:bg-slate-800',
  rainy: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30',
  windy: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/30',
};

export default function AutoSwapCropCards({ crops, isLoading }: AutoSwapCropCardsProps) {
  const { language } = useLanguageStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-swap mechanism
  useEffect(() => {
    if (!crops || crops.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % crops.length);
    }, SWAP_INTERVAL);

    return () => clearInterval(interval);
  }, [crops]);

  // Generate dynamic crop data
  const getCropDynamicData = (crop: Crop) => {
    const index = crops?.findIndex(c => c._id === crop._id) || 0;
    const weatherOptions: Array<'sunny' | 'cloudy' | 'rainy' | 'windy'> = ['sunny', 'cloudy', 'rainy', 'windy'];
    const weather = crop.weatherCondition || weatherOptions[index % 4];
    
    return {
      moistureLevel: crop.moistureLevel || 60 + (index * 10) % 40,
      temperature: crop.temperature || 25 + (index * 3) % 15,
      weatherCondition: weather,
      lastIrrigation: crop.lastIrrigation || `${2 + (index % 5)} days ago`,
      nextTask: crop.nextTask || (index % 3 === 0 ? 'Irrigation needed' : index % 3 === 1 ? 'Fertilizer application' : 'Pest check'),
      daysToHarvest: crop.daysToHarvest || Math.max(0, 30 - (index * 7)),
    };
  };

  // Get translated text
  const getTranslatedText = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'moisture': { en: 'Moisture', hi: 'नमी', mr: 'ओलावा' },
      'temperature': { en: 'Temp', hi: 'तापमान', mr: 'तापमान' },
      'daysToHarvest': { en: 'Days to Harvest', hi: 'कटाई तक दिन', mr: 'काढणीपर्यंत दिवस' },
      'lastIrrigation': { en: 'Last Watered', hi: 'अंतिम सिंचाई', mr: 'शेवटचे सिंचन' },
      'nextTask': { en: 'Next Task', hi: 'अगला काम', mr: 'पुढील काम' },
      'viewAll': { en: 'View All', hi: 'सभी देखें', mr: 'सर्व पहा' },
    };
    return translations[key]?.[language] || translations[key]?.en || key;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-64 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      </div>
    );
  }

  if (!crops || crops.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-8 text-center">
        <Sprout className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
        <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
          {language === 'mr' ? 'तुमची अद्याप कोणतीही पिके नाहीत' : 
           language === 'hi' ? 'आपकी अभी तक कोई फसल नहीं है' : 
           'No crops yet'}
        </p>
        <Link
          href="/profile"
          className="mt-3 inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700"
        >
          {language === 'mr' ? 'पिके जोडा' : language === 'hi' ? 'फसलें जोड़ें' : 'Add crops'}
        </Link>
      </div>
    );
  }

  const currentCrop = crops[currentIndex];
  const dynamicData = getCropDynamicData(currentCrop);
  const status = currentCrop.status || 'growing';
  const healthScore = currentCrop.healthScore || 'good';
  const WeatherIcon = weatherIcons[dynamicData.weatherCondition];
  const weatherColor = weatherColors[dynamicData.weatherCondition];

  return (
    <div className="relative">
      {/* Header aligned exactly like Crop Status on the left */}
      <div className="flex items-center justify-between mb-3 mt-1">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Sprout className="h-5 w-5 text-emerald-500" />
          {language === 'mr' ? 'माझी पिके' : language === 'hi' ? 'मेरी फसलें' : 'My Crops'}
          <span className="text-xs font-normal text-slate-500">({crops.length})</span>
        </h2>
        <Link
          href="/profile"
          className="text-xs text-emerald-600 hover:text-emerald-700"
        >
          {getTranslatedText('viewAll')}
        </Link>
      </div>

      {/* Single Card Container with Stacking Animation */}
      <div className="relative" style={{ perspective: '1200px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCrop._id || currentIndex}
            initial={{ 
              opacity: 0, 
              y: 60,
              scale: 0.9,
              rotateX: -15 
            }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: 1,
              rotateX: 0 
            }}
            exit={{ 
              opacity: 0, 
              y: -60,
              scale: 0.9,
              rotateX: 15 
            }}
            transition={{ 
              duration: 0.5,
              ease: [0.4, 0, 0.2, 1]
            }}
            className="w-full"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div 
              className={cn(
                "rounded-xl border bg-white dark:bg-slate-900 p-4 shadow-lg",
                "border-slate-200 dark:border-slate-700"
              )}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                    <Sprout className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-base">
                      {currentCrop.name || 'Unknown Crop'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {currentCrop.variety || 'Standard Variety'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', getStatusColor(status))}>
                    {(status || '').replace('_', ' ')}
                  </span>
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium border', getHealthColor(healthScore))}>
                    {healthScore}
                  </span>
                </div>
              </div>

              {/* Dynamic Data Grid */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-xl">
                  <Droplets className="h-4 w-4 mx-auto mb-1.5 text-blue-500" />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{getTranslatedText('moisture')}</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{dynamicData.moistureLevel}%</p>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/30 rounded-xl">
                  <Sun className="h-4 w-4 mx-auto mb-1.5 text-amber-500" />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{getTranslatedText('temperature')}</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{dynamicData.temperature}°C</p>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/30 rounded-xl">
                  <Calendar className="h-4 w-4 mx-auto mb-1.5 text-emerald-500" />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{getTranslatedText('daysToHarvest')}</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{dynamicData.daysToHarvest}d</p>
                </div>
              </div>

              {/* Weather & Location */}
              <div className="flex items-center justify-between text-xs mb-3 px-1">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[120px]">{currentCrop.fieldLocation || 'Farm Location'}</span>
                </div>
                <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium', weatherColor)}>
                  <WeatherIcon className="h-3.5 w-3.5" />
                  <span className="capitalize">{dynamicData.weatherCondition}</span>
                </div>
              </div>

              {/* Task & Irrigation Info */}
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{getTranslatedText('lastIrrigation')}:</span>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">{dynamicData.lastIrrigation}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{getTranslatedText('nextTask')}:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{dynamicData.nextTask}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Indicators */}
      {crops.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {crops.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "rounded-full transition-all duration-300",
                index === currentIndex 
                  ? "w-6 h-2 bg-emerald-500" 
                  : "w-2 h-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
              )}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      {crops.length > 1 && (
        <div className="text-center mt-2">
          <span className="text-xs text-slate-400">
            {currentIndex + 1} / {crops.length}
          </span>
        </div>
      )}
    </div>
  );
}
