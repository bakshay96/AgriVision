'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sprout, TrendingUp, ShoppingBag, AlertTriangle, Calendar, ArrowUpRight,
  Cloud, BookOpen
} from 'lucide-react';
import { useCrops, useCropStats } from '@/hooks/useCrops';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { SkeletonCard, SkeletonCropCard } from '@/components/ui/SkeletonLoaders';
import CropStatusCard from '@/components/dashboard/CropStatusCard';
import HealthScan from '@/components/dashboard/HealthScan';
import WeatherWidget from '@/components/dashboard/WeatherWidget';
import DashboardSubNav from '@/components/dashboard/DashboardSubNav';
import DashboardWeatherWidget from '@/components/dashboard/DashboardWeatherWidget';
import DashboardMarketWidget from '@/components/dashboard/DashboardMarketWidget';
import MyCropsWidget from '@/components/dashboard/MyCropsWidget';
import OrderAlerts from '@/components/dashboard/OrderAlerts';
import { useLanguageStore } from '@/store/useLanguageStore';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

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
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', 'recent'],
    queryFn: () => ordersApi.getAll({ limit: 5 }).then((r) => r.data.data),
  });
  
  const { t } = useLanguageStore();
  const [activeTab, setActiveTab] = useState('overview');

  const crops = cropsData?.crops ?? [];
  const recentOrders = ordersData?.orders ?? [];

  const stats = [
    {
      label: t('dash.totalCrops'),
      value: cropsData?.total ?? '—',
      icon: Sprout,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      change: '+2 this month',
    },
    {
      label: t('dash.healthyCrops'),
      value: statsData?.healthStats?.find(
        (s: { _id: string }) => s._id === 'good'
      )?.count ?? 0,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      change: 'AI-verified',
    },
    {
      label: t('dash.pendingOrders'),
      value: recentOrders.filter(
        (o: { status: string }) => o.status === 'pending'
      ).length,
      icon: ShoppingBag,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      change: 'Needs action',
    },
    {
      label: t('dash.cropAlerts'),
      value: crops.filter((c: { healthScore: string }) =>
        ['critical', 'poor'].includes(c.healthScore)
      ).length,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-900/20',
      change: 'Require attention',
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
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {user?.farmName || t('dash.farm')} · {formatDate(new Date())}
          </p>
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
            <WeatherWidget crops={crops} />
          </motion.div>

          {/* ── Stats Grid — 1-col mobile → 2-col sm → 4-col lg ──────────────── */}
          <motion.div
            variants={item}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {statsLoading || cropsLoading || ordersLoading
              ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
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
            <motion.div variants={item} className="md:col-span-1 space-y-6">
              <OrderAlerts />
              <MyCropsWidget />
              <HealthScan />
            </motion.div>
          </div>

          {/* ── Recent Orders (full-width, below 3-col grid) ────────────────── */}
          <motion.div variants={item}>
            <Card className="dark:bg-slate-900 dark:border-slate-800 hidden md:block">
              <CardHeader className="border-b border-slate-100 dark:border-slate-700 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="dark:text-white">{t('dash.recentOrders')}</CardTitle>
                  <Link
                    href="/orders"
                    className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                  >
                    {t('dash.viewAll')} <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {ordersLoading ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-4">
                        <div className="skeleton h-4 w-28" />
                        <div className="skeleton h-4 w-20 ml-auto" />
                        <div className="skeleton h-6 w-20 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="p-8 text-center">
                    <ShoppingBag className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">No orders yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentOrders.map((order: Record<string, unknown>) => (
                      <div
                        key={String(order._id)}
                        className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {String(order.orderNumber)}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(String(order.createdAt))}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(Number(order.totalAmount))}
                          </p>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                              String(order.status)
                            )}`}
                          >
                            {String(order.status).replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      {/* ── Weather Tab Content ─────────────────────────────────────────────── */}
      {activeTab === 'weather' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <DashboardWeatherWidget />
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="dark:bg-slate-900 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">5-Day Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Today', 'Tomorrow', 'Wed', 'Thu', 'Fri'].map((day, idx) => (
                    <div key={day} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{day}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-500">{idx % 2 === 0 ? '☀️' : '⛅'} 28°C</span>
                        <span className="text-slate-400">22°C</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-slate-900 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">Farming Advisory</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <span className="text-amber-600">⚠️</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300">Light rain expected tomorrow. Postpone pesticide application.</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <span className="text-emerald-600">💧</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300">Soil moisture is optimal for irrigation today.</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-blue-600">🌱</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300">Good conditions for sowing leafy vegetables.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="text-center">
            <Link
              href="/weather"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            >
              View Full Weather Dashboard
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
          <div className="grid gap-6 md:grid-cols-3">
            {['Wheat', 'Rice', 'Cotton', 'Soybean', 'Maize', 'Sugarcane'].map((crop) => (
              <Card key={crop} className="dark:bg-slate-900 dark:border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{crop}</p>
                      <p className="text-sm text-slate-500">per quintal</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">{formatCurrency(Math.floor(Math.random() * 3000 + 2000))}</p>
                      <p className="text-xs text-green-600">+{(Math.random() * 5).toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center">
            <Link
              href="/market-prices"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
            >
              View Full Market Prices
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Wheat', category: 'Cereal', season: 'Rabi', image: '🌾' },
              { name: 'Rice', category: 'Cereal', season: 'Kharif', image: '🍚' },
              { name: 'Cotton', category: 'Fiber', season: 'Kharif', image: '🧵' },
              { name: 'Sugarcane', category: 'Cash Crop', season: 'Year-round', image: '🎋' },
              { name: 'Turmeric', category: 'Spice', season: 'Kharif', image: '🟡' },
              { name: 'Groundnut', category: 'Oilseed', season: 'Kharif', image: '🥜' },
            ].map((crop) => (
              <Card key={crop.name} className="dark:bg-slate-900 dark:border-slate-800 hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{crop.image}</span>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{crop.name}</h3>
                      <p className="text-sm text-slate-500">{crop.category}</p>
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded">
                        {crop.season}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center">
            <Link
              href="/crop-encyclopedia"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-colors"
            >
              Explore Full Encyclopedia
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
