'use client';

import { motion } from 'framer-motion';
import { Sprout, CloudRain, TrendingUp, AlertCircle, ArrowRight, Droplets, Sun } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSelectedCrops } from '@/hooks/useUser';
import { useLanguageStore } from '@/store/useLanguageStore';
import Link from 'next/link';

// Mock data for crop-specific information - in production, this would come from APIs
const getCropWeatherAdvice = (cropName: string) => {
  const advice: Record<string, { condition: string; advice: string; icon: any; color: string }> = {
    'Wheat': { 
      condition: 'Favorable', 
      advice: 'Optimal conditions for irrigation. Expected light rain tomorrow.',
      icon: CloudRain,
      color: 'text-blue-600 bg-blue-50'
    },
    'Rice': { 
      condition: 'Good', 
      advice: 'Maintain water level. High humidity expected.',
      icon: Droplets,
      color: 'text-emerald-600 bg-emerald-50'
    },
    'Cotton': { 
      condition: 'Alert', 
      advice: 'High temperature expected. Increase irrigation frequency.',
      icon: Sun,
      color: 'text-amber-600 bg-amber-50'
    },
    'Sugarcane': { 
      condition: 'Good', 
      advice: 'Good growing conditions. Monitor for pests.',
      icon: Sprout,
      color: 'text-green-600 bg-green-50'
    },
    'Soybean': { 
      condition: 'Favorable', 
      advice: 'Ideal conditions for growth. Continue regular care.',
      icon: Sun,
      color: 'text-emerald-600 bg-emerald-50'
    },
  };
  return advice[cropName] || { 
    condition: 'Good', 
    advice: 'Conditions are favorable for growth.',
    icon: Sprout,
    color: 'text-emerald-600 bg-emerald-50'
  };
};

const getCropMarketPrice = (cropName: string) => {
  const prices: Record<string, { price: number; trend: 'up' | 'down' | 'stable'; change: number }> = {
    'Wheat': { price: 2250, trend: 'up', change: 2.5 },
    'Rice': { price: 3800, trend: 'up', change: 1.8 },
    'Cotton': { price: 6200, trend: 'down', change: -0.5 },
    'Sugarcane': { price: 320, trend: 'stable', change: 0 },
    'Soybean': { price: 4200, trend: 'up', change: 3.2 },
    'Maize': { price: 2100, trend: 'up', change: 1.5 },
    'Groundnut': { price: 5500, trend: 'up', change: 2.1 },
    'Mustard': { price: 4800, trend: 'down', change: -1.2 },
  };
  return prices[cropName] || { price: 2500, trend: 'stable', change: 0 };
};

export default function MyCropsWidget() {
  const { t, language } = useLanguageStore();
  const { data: cropsData, isLoading } = useSelectedCrops();
  
  const selectedCrops = cropsData?.selectedCrops || [];

  if (isLoading) {
    return (
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardContent className="p-6">
          <div className="h-32 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selectedCrops.length === 0) {
    return (
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Sprout className="h-5 w-5 text-emerald-500" />
            {language === 'mr' ? 'माझी पिके' : language === 'hi' ? 'मेरी फसलें' : 'My Crops'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Sprout className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              {language === 'mr' 
                ? 'तुमची अद्याप कोणतीही पिके निवडलेली नाहीत' 
                : language === 'hi' 
                  ? 'आपने अभी तक कोई फसल नहीं चुनी है' 
                  : 'You haven\'t selected any crops yet'}
            </p>
            <Link
              href="/profile"
              className="mt-3 inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700"
            >
              {language === 'mr' ? 'प्रोफाइलमध्ये पिके जोडा' : language === 'hi' ? 'प्रोफाइल में फसलें जोड़ें' : 'Add crops in profile'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dark:bg-slate-900 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 dark:text-white">
          <Sprout className="h-5 w-5 text-emerald-500" />
          {language === 'mr' ? 'माझी पिके' : language === 'hi' ? 'मेरी फसलें' : 'My Crops'}
          <span className="text-sm font-normal text-slate-500">
            ({selectedCrops.length}/5)
          </span>
        </CardTitle>
        <Link
          href="/profile"
          className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
        >
          {language === 'mr' ? 'व्यवस्थापित करा' : language === 'hi' ? 'प्रबंधित करें' : 'Manage'}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {selectedCrops.slice(0, 3).map((cropName: string, idx: number) => {
            const weather = getCropWeatherAdvice(cropName);
            const market = getCropMarketPrice(cropName);
            const WeatherIcon = weather.icon;
            
            return (
              <motion.div
                key={cropName}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <Sprout className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">{cropName}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${weather.color}`}>
                          <WeatherIcon className="h-3 w-3" />
                          {weather.condition}
                        </span>
                        <span className={`flex items-center gap-1 text-xs ${market.trend === 'up' ? 'text-green-600' : market.trend === 'down' ? 'text-red-600' : 'text-slate-500'}`}>
                          <TrendingUp className="h-3 w-3" />
                          ₹{market.price}
                          {market.change !== 0 && (
                            <span>({market.change > 0 ? '+' : ''}{market.change}%)</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  {weather.advice}
                </p>
              </motion.div>
            );
          })}
          
          {selectedCrops.length > 3 && (
            <p className="text-center text-sm text-slate-500">
              +{selectedCrops.length - 3} {language === 'mr' ? 'आणखी पिके' : language === 'hi' ? 'और फसलें' : 'more crops'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
