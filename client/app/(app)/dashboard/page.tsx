'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sprout, TrendingUp, ShoppingBag, AlertTriangle, Calendar, ArrowUpRight,
  Cloud, BookOpen, Droplets, Wind, CloudRain, Thermometer, Sun, Clock, Search
} from 'lucide-react';
import { useCrops, useCropStats } from '@/hooks/useCrops';
import { useSelectedCrops, useUserProfile } from '@/hooks/useUser';
import { useQuery } from '@tanstack/react-query';
import { ordersApi, aiApi, weatherApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { SkeletonCard, SkeletonCropCard } from '@/components/ui/SkeletonLoaders';
import CropStatusCard from '@/components/dashboard/CropStatusCard';
import DashboardSubNav from '@/components/dashboard/DashboardSubNav';
import DashboardWeatherWidget from '@/components/dashboard/DashboardWeatherWidget';
import DashboardMarketWidget from '@/components/dashboard/DashboardMarketWidget';
import MyCropsWidget from '@/components/dashboard/MyCropsWidget';
import OrderAlerts from '@/components/dashboard/OrderAlerts';
import AutoSwapCropCards from '@/components/dashboard/AutoSwapCropCards';
import RecentOrdersCard from '@/components/dashboard/RecentOrdersCard';
import NegotiationsWidget from '@/components/dashboard/NegotiationsWidget';
import { useLanguageStore } from '@/store/useLanguageStore';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import WeatherWidget from '@/components/dashboard/WeatherWidget';

// ─────────────────────────────────────────────────────────────────────────────
// Framer Motion variants
// ─────────────────────────────────────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38 } },
};

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Page
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAppStore();
  const { data: cropsData, isLoading: cropsLoading } = useCrops();
  const { data: statsData, isLoading: statsLoading } = useCropStats();
  const { data: selectedCropsData, isLoading: selectedCropsLoading } = useSelectedCrops();
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', 'recent'],
    queryFn: () => ordersApi.getAll({ limit: 5 }).then((r) => r.data.data),
  });
  
  // Fetch AI scan count
  const { data: aiData, isLoading: aiLoading } = useQuery({
    queryKey: ['ai', 'analyses'],
    queryFn: () => aiApi.getAnalyses({ limit: 100 }).then((r) => r.data.data),
  });
  
  // Fetch weather data from backend API
  const { data: weatherData, isLoading: weatherLoading, refetch: refetchWeather } = useQuery({
    queryKey: ['weather'],
    queryFn: () => weatherApi.getWeather().then((r) => r.data.data.weather),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
  
  const { t, language } = useLanguageStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get crops from Crop collection OR user's selected crops
  const cropsFromCollection = (cropsData?.crops ?? cropsData ?? []) as Array<{ healthScore?: string; status?: string; name?: string; variety?: string; _id?: string }>;
  
  // Transform selectedCrops (array of strings) into crop-like objects for display
  const selectedCrops = (selectedCropsData?.selectedCrops || []) as string[];
  const cropsFromProfile = selectedCrops.map((cropName, index) => ({
    _id: `selected-${index}`,
    name: cropName,
    variety: 'Standard',
    status: 'growing',
    healthScore: 'good',
    fieldLocation: user?.farmName || 'Farm',
  }));
  
  // Use crops from collection if available, otherwise use selected crops from profile
  const crops = cropsFromCollection.length > 0 ? cropsFromCollection : cropsFromProfile;
  const recentOrders = (ordersData?.orders ?? ordersData ?? []) as Array<{ status?: string }>;
  const aiAnalyses = (aiData?.analyses ?? aiData ?? []) as Array<unknown>;
  
  // Debug log for crops data
  console.log('[Dashboard] Crops data:', { 
    cropsLoading, 
    selectedCropsLoading,
    cropsFromCollection: cropsFromCollection?.length, 
    selectedCrops: selectedCrops?.length,
    finalCrops: crops?.length 
  });
  
  // Calculate real stats from data
  const totalCrops = Array.isArray(crops) ? crops.length : 0;
  
  // Count healthy crops (good or excellent health score)
  const healthyCrops = Array.isArray(crops) 
    ? crops.filter((c) => 
        ['good', 'excellent'].includes(c.healthScore?.toLowerCase() || '')
      ).length 
    : 0;
  
  // Count pending orders
  const pendingOrders = Array.isArray(recentOrders) 
    ? recentOrders.filter((o) => 
        (o.status?.toLowerCase() || '') === 'pending'
      ).length 
    : 0;
  
  // Count crop alerts (critical or poor health)
  const cropAlerts = Array.isArray(crops) 
    ? crops.filter((c) => 
        ['critical', 'poor'].includes(c.healthScore?.toLowerCase() || '')
      ).length 
    : 0;
  
  // Count AI verified scans
  const aiVerifiedCount = Array.isArray(aiAnalyses) ? aiAnalyses.length : 0;

  const stats = [
    {
      label: t('dash.totalCrops'),
      value: totalCrops,
      icon: Sprout,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      change: totalCrops > 0 ? `${totalCrops} active` : 'No crops yet',
    },
    {
      label: t('dash.healthyCrops') || 'Healthy Crops',
      value: healthyCrops,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      change: totalCrops > 0 ? `${Math.round((healthyCrops / totalCrops) * 100)}% healthy` : '0% healthy',
    },
    {
      label: t('dash.pendingOrders') || 'Pending Orders',
      value: pendingOrders,
      icon: ShoppingBag,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      change: pendingOrders > 0 ? 'Needs action' : 'All caught up',
    },
    {
      label: t('dash.cropAlerts') || 'Crop Alerts',
      value: cropAlerts,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-900/20',
      change: cropAlerts > 0 ? 'Require attention' : 'All healthy',
    },
    {
      label: language === 'mr' ? 'एआय तपासणी' : language === 'hi' ? 'एआई स्कैन' : 'AI Scans',
      value: aiVerifiedCount,
      icon: Cloud,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      change: aiVerifiedCount > 0 ? 'Health verified' : 'No scans yet',
    },
  ];

  // Quick links for sub-navigation tabs
  const quickLinks = {
    weather: {
      icon: Cloud,
      title: 'Weather Intelligence',
      description: 'Check weather forecast and farming advisories',
      href: '/weather',
      color: 'from-blue-500 to-blue-600',
    },
    marketPrices: {
      icon: TrendingUp,
      title: 'Market Prices',
      description: 'View real-time mandi prices and trends',
      href: '/market-prices',
      color: 'from-emerald-500 to-emerald-600',
    },
    encyclopedia: {
      icon: BookOpen,
      title: 'Crop Encyclopedia',
      description: 'Explore crop guides and best practices',
      href: '/crop-encyclopedia',
      color: 'from-amber-500 to-amber-600',
    },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('dash.welcome')}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>{user?.farmName || t('dash.farm')} · {formatDate(new Date())}</span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <Clock className="h-3.5 w-3.5" />
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Sub Navigation ──────────────────────────────────────────────────── */}
      <motion.div variants={item}>
        <DashboardSubNav activeTab={activeTab} onTabChange={setActiveTab} />
      </motion.div>

      {/* ── Tab Content ─────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <>
          {/* ── Weather Widget (Top Level) ───────────────────────────────────── */}
          <motion.div variants={item}>
            {/* <WeatherWidget crops={crops} /> */}
          </motion.div>

          {/* ── Stats Grid — 1-col mobile → 2-col sm → 4-col lg ──────────────── */}
          <motion.div
            variants={item}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
          >
            {statsLoading || cropsLoading || ordersLoading || aiLoading
              ? Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)
              : stats.map((stat) => (
                  <motion.div
                    key={stat.label}
                    whileHover={{ scale: 1.02 }}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 card-hover"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                      <div className={`rounded-lg p-2 ${stat.bg}`}>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      </div>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{stat.change}</p>
                  </motion.div>
                ))}
          </motion.div>

          {/* ── Main 3-column grid — 1-col mobile → 3-col desktop ───────────── */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* ── Crop Status (2 of 3 cols on desktop) ───────────────────────── */}
            <motion.div variants={item} className="md:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('dash.cropStatus')}</h2>
                <span className="text-xs text-slate-400 dark:text-slate-500">{crops.length} {t('dash.active')}</span>
              </div>

              {/* Crops sub-grid: 1-col → 2-col sm → 3-col xl */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {cropsLoading
                  ? Array(6).fill(0).map((_, i) => <SkeletonCropCard key={i} />)
                  : crops.slice(0, 6).map(
                      (crop: Record<string, unknown>, i: number) => (
                        <CropStatusCard key={String(crop._id)} crop={crop} index={i} />
                      )
                    )}
                {!cropsLoading && crops.length === 0 && (
                  <div className="col-span-full rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-10 text-center">
                    <Sprout className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                    <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">No crops yet</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Add your first crop to get started
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── Right Column widgets (1 of 3 cols on desktop) ───────────────── */}
            <motion.div variants={item} className="md:col-span-1 space-y-4">
              <AutoSwapCropCards crops={crops} isLoading={cropsLoading || selectedCropsLoading} />
              <NegotiationsWidget isFarmer={user?.role === 'FARMER'} />
              <RecentOrdersCard orders={recentOrders} isLoading={ordersLoading} />
            </motion.div>
          </div>
        </>
      )}

      {/* ── Weather Tab Content ─────────────────────────────────────────────── */}
      {activeTab === 'weather' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          
            <WeatherWidget crops={crops} />
         
          
          {/* Weather Details Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* 7-Day Forecast */}
            <Card className="dark:bg-slate-900 dark:border-slate-800 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  {language === 'mr' ? '7 दिवसांचा अंदाज' : language === 'hi' ? '7 दिनों का पूर्वानुमान' : '7-Day Forecast'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weatherLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    ))}
                  </div>
                ) : weatherData?.forecast && weatherData.forecast.length > 0 ? (
                  <div className="space-y-3">
                    {weatherData.forecast.slice(0, 7).map((day: any, idx: number) => {
                      const dayName = idx === 0 
                        ? (language === 'mr' ? 'आज' : language === 'hi' ? 'आज' : 'Today')
                        : idx === 1 
                          ? (language === 'mr' ? 'उद्या' : language === 'hi' ? 'कल' : 'Tomorrow')
                          : new Date(day.date).toLocaleDateString(language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'short' });
                      
                      // Get weather icon based on condition
                      const getWeatherIcon = (condition: string) => {
                        switch (condition?.toLowerCase()) {
                          case 'clear': return <Sun className="w-full h-full text-amber-500" />;
                          case 'clouds': return <Cloud className="w-full h-full text-slate-400" />;
                          case 'rain': return <CloudRain className="w-full h-full text-blue-500" />;
                          case 'drizzle': return <CloudRain className="w-full h-full text-blue-400" />;
                          case 'thunderstorm': return <CloudRain className="w-full h-full text-purple-500" />;
                          default: return <Sun className="w-full h-full text-amber-500" />;
                        }
                      };
                      
                      return (
                        <motion.div 
                          key={idx} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-slate-700 dark:text-slate-300 w-20">{dayName}</span>
                            <div className="w-8 h-8">
                              {getWeatherIcon(day.condition)}
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 capitalize hidden sm:inline">{day.condition}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-blue-500 text-sm">{Math.round(day.temperature.min)}°</span>
                            <div className="w-16 h-1.5 bg-gradient-to-r from-blue-400 via-amber-400 to-red-400 rounded-full" />
                            <span className="text-red-500 text-sm font-medium">{Math.round(day.temperature.max)}°</span>
                            {day.precipitationProbability > 0 && (
                              <span className="text-xs text-blue-400 flex items-center gap-1">
                                <Droplets className="h-3 w-3" />
                                {day.precipitationProbability}%
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <Cloud className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{language === 'mr' ? 'हवामान डेटा उपलब्ध नाही' : language === 'hi' ? 'मौसम डेटा उपलब्ध नहीं है' : 'Weather data not available'}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Farming Advisory */}
            <Card className="dark:bg-slate-900 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  {language === 'mr' ? 'शेतकरी सल्ला' : language === 'hi' ? 'किसान सलाह' : 'Farming Advisory'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weatherData?.alerts && weatherData.alerts.length > 0 ? (
                  <div className="space-y-3">
                    {weatherData.alerts.map((alert: any, idx: number) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${
                          alert.severity === 'high' 
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-500' 
                            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'
                        }`}
                      >
                        <span className={alert.severity === 'high' ? 'text-red-600' : 'text-amber-600'}>⚠️</span>
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {alert.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {alert.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border-l-4 border-emerald-500"
                    >
                      <span className="text-emerald-600">✓</span>
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {language === 'mr' ? 'अनुकूल हवामान' : language === 'hi' ? 'अनुकूल मौसम' : 'Favorable Weather'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {language === 'mr' ? 'शेतीच्या कामांसाठी चांगली परिस्थिती.' : language === 'hi' ? 'खेती के कामों के लिए अच्छी स्थिति।' : 'Good conditions for farming activities.'}
                        </p>
                      </div>
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500"
                    >
                      <span className="text-blue-600">💧</span>
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {language === 'mr' ? 'सिंचनासाठी योग्य' : language === 'hi' ? 'सिंचाई के लिए उपयुक्त' : 'Good for Irrigation'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {language === 'mr' ? 'मातीतील ओलावा इष्टतम आहे.' : language === 'hi' ? 'मिट्टी की नमी इष्टतम है।' : 'Soil moisture is optimal.'}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Weather Info */}
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { 
                icon: Droplets, 
                label: language === 'mr' ? 'आर्द्रता' : language === 'hi' ? 'आर्द्रता' : 'Humidity', 
                value: weatherData?.current?.humidity ? `${weatherData.current.humidity}%` : '--',
                color: 'text-blue-600'
              },
              { 
                icon: Wind, 
                label: language === 'mr' ? 'वारा' : language === 'hi' ? 'हवा' : 'Wind Speed', 
                value: weatherData?.current?.windSpeed ? `${Math.round(weatherData.current.windSpeed)} km/h` : '--',
                color: 'text-cyan-600'
              },
              { 
                icon: CloudRain, 
                label: language === 'mr' ? 'पावसाची शक्यता' : language === 'hi' ? 'वर्षा की संभावना' : 'Rain Chance', 
                value: weatherData?.forecast?.[0]?.precipitationProbability ? `${weatherData.forecast[0].precipitationProbability}%` : '0%',
                color: 'text-indigo-600'
              },
              { 
                icon: Thermometer, 
                label: language === 'mr' ? 'उष्णता निर्देशक' : language === 'hi' ? 'गर्मी सूचकांक' : 'Heat Index', 
                value: weatherData?.current?.feelsLike ? `${Math.round(weatherData.current.feelsLike)}°C` : '--',
                color: 'text-orange-600'
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-center hover:shadow-md transition-shadow"
              >
                <item.icon className={`h-6 w-6 mx-auto mb-2 ${item.color}`} />
                <p className="text-lg font-bold text-slate-900 dark:text-white">{item.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/weather"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            >
              {language === 'mr' ? 'पूर्ण हवामान डॅशबोर्ड पहा' : language === 'hi' ? 'पूर्ण मौसम डैशबोर्ड देखें' : 'View Full Weather Dashboard'}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      )}

      {/* ── Market Prices Tab Content ───────────────────────────────────────── */}
      {activeTab === 'marketPrices' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <DashboardMarketWidget />
          
          {/* Market Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: language === 'mr' ? 'सरासरी भाव' : language === 'hi' ? 'औसत मूल्य' : 'Avg Price', value: '₹2,450', change: '+2.3%', positive: true },
              { label: language === 'mr' ? 'वाढ' : language === 'hi' ? 'वृद्धि' : 'Top Gainer', value: 'Cotton', change: '+5.8%', positive: true },
              { label: language === 'mr' ? 'घट' : language === 'hi' ? 'गिरावट' : 'Top Loser', value: 'Wheat', change: '-1.2%', positive: false },
              { label: language === 'mr' ? 'व्यापार' : language === 'hi' ? 'व्यापार' : 'Volume', value: '1.2M', change: '+12%', positive: true },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{stat.value}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stat.positive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {stat.change}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Crop Prices Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Wheat', icon: '🌾', color: 'from-amber-500 to-amber-600', price: 2450, change: 2.3 },
              { name: 'Rice', icon: '🍚', color: 'from-emerald-500 to-emerald-600', price: 3200, change: 1.8 },
              { name: 'Cotton', icon: '🧵', color: 'from-blue-500 to-blue-600', price: 6800, change: 5.8 },
              { name: 'Soybean', icon: '🫘', color: 'from-yellow-500 to-yellow-600', price: 4200, change: -0.5 },
              { name: 'Maize', icon: '🌽', color: 'from-orange-500 to-orange-600', price: 2100, change: 1.2 },
              { name: 'Sugarcane', icon: '🎋', color: 'from-green-500 to-green-600', price: 350, change: 0.8 },
            ].map((crop, idx) => (
              <motion.div
                key={crop.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 hover:shadow-lg transition-all"
              >
                {/* Gradient accent */}
                <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${crop.color}`} />
                
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{crop.icon}</span>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{crop.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {language === 'mr' ? 'प्रति क्विंटल' : language === 'hi' ? 'प्रति क्विंटल' : 'per quintal'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(crop.price)}</p>
                    <div className={`flex items-center justify-end gap-1 text-xs font-medium ${crop.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      <TrendingUp className={`h-3 w-3 ${crop.change < 0 ? 'rotate-180' : ''}`} />
                      {crop.change > 0 ? '+' : ''}{crop.change}%
                    </div>
                  </div>
                </div>

                {/* Price info only - no animation */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'mr' ? 'किमान: ₹2,200' : language === 'hi' ? 'न्यूनतम: ₹2,200' : 'Min: ₹2,200'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'mr' ? 'कमाल: ₹2,800' : language === 'hi' ? 'अधिकतम: ₹2,800' : 'Max: ₹2,800'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/market-prices"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
            >
              {language === 'mr' ? 'पूर्ण बाजार भाव पहा' : language === 'hi' ? 'पूर्ण बाजार भाव देखें' : 'View Full Market Prices'}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      )}

      {/* ── Encyclopedia Tab Content ────────────────────────────────────────── */}
      {activeTab === 'encyclopedia' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Search Bar */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'mr' ? 'पिकांची माहिती शोधा...' : language === 'hi' ? 'फसल की जानकारी खोजें...' : 'Search crop information...'}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 pl-12 pr-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:bg-slate-800 dark:text-white"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    window.location.href = `/crop-encyclopedia?search=${encodeURIComponent((e.target as HTMLInputElement).value)}`;
                  }
                }}
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Wheat', category: 'Cereal', season: 'Rabi', image: '🌾', scientificName: 'Triticum aestivum' },
              { name: 'Rice', category: 'Cereal', season: 'Kharif', image: '🍚', scientificName: 'Oryza sativa' },
              { name: 'Cotton', category: 'Fiber', season: 'Kharif', image: '🧵', scientificName: 'Gossypium hirsutum' },
              { name: 'Sugarcane', category: 'Cash Crop', season: 'Year-round', image: '🎋', scientificName: 'Saccharum officinarum' },
              { name: 'Turmeric', category: 'Spice', season: 'Kharif', image: '🟡', scientificName: 'Curcuma longa' },
              { name: 'Groundnut', category: 'Oilseed', season: 'Kharif', image: '🥜', scientificName: 'Arachis hypogaea' },
            ].map((crop, idx) => (
              <motion.div
                key={crop.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                onClick={() => window.location.href = `/crop-encyclopedia?crop=${encodeURIComponent(crop.name)}`}
                className="cursor-pointer"
              >
                <Card className="h-full dark:bg-slate-900 dark:border-slate-800 hover:shadow-xl transition-all overflow-hidden group">
                  <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <motion.span 
                        className="text-4xl"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        {crop.image}
                      </motion.span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{crop.name}</h3>
                        <p className="text-xs italic text-slate-400">{crop.scientificName}</p>
                        <p className="text-sm text-slate-500 mt-1">{crop.category}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="inline-block px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded">
                            {crop.season}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            {language === 'mr' ? 'अधिक माहितीसाठी क्लिक करा' : language === 'hi' ? 'अधिक जानकारी के लिए क्लिक करें' : 'Click for details'}
                            <ArrowUpRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <div className="text-center">
            <Link
              href="/crop-encyclopedia"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-colors"
            >
              {language === 'mr' ? 'पूर्ण माहिती पहा' : language === 'hi' ? 'पूर्ण जानकारी देखें' : 'Explore Full Encyclopedia'}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
