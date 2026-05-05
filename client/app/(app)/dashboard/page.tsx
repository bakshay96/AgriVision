'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Sprout, TrendingUp, ShoppingBag, AlertTriangle, ArrowRight,
  Cloud, BookOpen
} from 'lucide-react';
import { useCrops, useCropStats } from '@/hooks/useCrops';
import { useSelectedCrops } from '@/hooks/useUser';
import { useQuery } from '@tanstack/react-query';
import { ordersApi, aiApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { SkeletonCard, SkeletonCropCard } from '@/components/ui/SkeletonLoaders';
import CropStatusCard from '@/components/dashboard/CropStatusCard';
import DashboardSubNav from '@/components/dashboard/DashboardSubNav';
import DashboardMarketWidget from '@/components/dashboard/DashboardMarketWidget';
import AutoSwapCropCards from '@/components/dashboard/AutoSwapCropCards';
import RecentOrdersCard from '@/components/dashboard/RecentOrdersCard';
import NegotiationsWidget from '@/components/dashboard/NegotiationsWidget';
import { useLanguageStore } from '@/store/useLanguageStore';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import WeatherWidget from '@/components/dashboard/WeatherWidget';

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38 } },
};

export default function DashboardPage() {
  const { user } = useAppStore();
  const { data: cropsData, isLoading: cropsLoading } = useCrops();
  const { data: selectedCropsData } = useSelectedCrops();
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', 'recent'],
    queryFn: () => ordersApi.getAll({ limit: 5 }).then((r) => r.data.data),
  });
  
  const { data: aiData, isLoading: aiLoading } = useQuery({
    queryKey: ['ai', 'analyses'],
    queryFn: () => aiApi.getAnalyses({ limit: 100 }).then((r) => r.data.data),
  });
  
  const { t, language } = useLanguageStore();
  const [activeTab, setActiveTab] = useState('overview');

  const cropsFromCollection = useMemo(() => 
    (cropsData?.crops ?? cropsData ?? []) as Array<{ healthScore?: string; status?: string; name?: string; variety?: string; _id?: string }>,
  [cropsData]);
  
  const selectedCrops = useMemo(() => 
    (selectedCropsData?.selectedCrops || []) as string[],
  [selectedCropsData]);

  const cropsFromProfile = useMemo(() => 
    selectedCrops.map((cropName, index) => ({
      _id: `selected-${index}`,
      name: cropName,
      variety: 'Standard',
      status: 'growing',
      healthScore: 'good',
      fieldLocation: user?.farmName || 'Farm',
    })),
  [selectedCrops, user?.farmName]);
  
  const crops = useMemo(() => 
    cropsFromCollection.length > 0 ? cropsFromCollection : cropsFromProfile,
  [cropsFromCollection, cropsFromProfile]);

  const recentOrders = useMemo(() => 
    (ordersData?.orders ?? ordersData ?? []) as Array<{ status?: string }>,
  [ordersData]);

  const aiAnalyses = useMemo(() => 
    (aiData?.analyses ?? aiData ?? []) as Array<unknown>,
  [aiData]);
  
  const totalCrops = Array.isArray(crops) ? crops.length : 0;
  const healthyCrops = Array.isArray(crops) 
    ? crops.filter((c) => ['good', 'excellent'].includes(c.healthScore?.toLowerCase() || '')).length 
    : 0;
  const pendingOrders = Array.isArray(recentOrders) 
    ? recentOrders.filter((o) => (o.status?.toLowerCase() || '') === 'pending').length 
    : 0;
  const cropAlerts = Array.isArray(crops) 
    ? crops.filter((c) => ['critical', 'poor'].includes(c.healthScore?.toLowerCase() || '')).length 
    : 0;
  const aiVerifiedCount = Array.isArray(aiAnalyses) ? aiAnalyses.length : 0;

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!scrollRef.current || crops.length <= 1) return;
    let currentIndex = 0;
    const interval = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      currentIndex = (currentIndex + 1) % crops.length;
      el.scrollTo({ left: currentIndex * el.clientWidth, behavior: 'smooth' });
    }, 4500);
    return () => clearInterval(interval);
  }, [crops.length]);

  const stats = [
    { label: t('dash.totalCrops'), value: totalCrops, icon: Sprout, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', change: totalCrops > 0 ? `${totalCrops} active` : 'No crops yet' },
    { label: t('dash.healthyCrops') || 'Healthy Crops', value: healthyCrops, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', change: totalCrops > 0 ? `${Math.round((healthyCrops / totalCrops) * 100)}% healthy` : '0% healthy' },
    { label: t('dash.pendingOrders') || 'Pending Orders', value: pendingOrders, icon: ShoppingBag, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', change: pendingOrders > 0 ? 'Needs action' : 'All caught up' },
    { label: t('dash.cropAlerts') || 'Crop Alerts', value: cropAlerts, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', change: cropAlerts > 0 ? 'Require attention' : 'All healthy' },
    { label: language === 'mr' ? 'एआय तपासणी' : language === 'hi' ? 'एआई स्कैन' : 'AI Scans', value: aiVerifiedCount, icon: Cloud, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', change: aiVerifiedCount > 0 ? 'Health verified' : 'No scans yet' },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('dash.welcome')}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>{user?.farmName || t('dash.farm')} · {formatDate(new Date())}</span>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <DashboardSubNav activeTab={activeTab} onTabChange={setActiveTab} />
      </motion.div>

      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6">
          <motion.div variants={item} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {cropsLoading || ordersLoading || aiLoading
              ? Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)
              : stats.map((stat) => (
                  <motion.div key={stat.label} whileHover={{ scale: 1.02 }} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 card-hover">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                      <div className={`rounded-lg p-2 ${stat.bg}`}><stat.icon className={`h-4 w-4 ${stat.color}`} /></div>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{stat.change}</p>
                  </motion.div>
                ))}
          </motion.div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <motion.div variants={item} className="space-y-4">
              <div className="flex items-center justify-between mb-3"><h2 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-white"><Sprout className="h-5 w-5 text-emerald-500" />{t('dash.cropStatus')}</h2><span className="text-xs text-slate-400">{crops.length} {t('dash.active')}</span></div>
              <div ref={scrollRef} className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 pb-2 w-full pl-1 scroll-smooth">
                {cropsLoading ? Array(3).fill(0).map((_, i) => <div key={i} className="min-w-full snap-center shrink-0"><SkeletonCropCard /></div>) : crops.map((crop: any, i: number) => <div key={String(crop._id)} className="min-w-full snap-center shrink-0 px-[1px]"><CropStatusCard crop={crop} index={i} /></div>)}
                {!cropsLoading && crops.length === 0 && <div className="min-w-full snap-center shrink-0 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-10 text-center"><Sprout className="mx-auto h-10 w-10 text-slate-300 opacity-50" /><p className="mt-3 text-sm text-slate-500">No crops yet</p></div>}
              </div>
            </motion.div>
            <motion.div variants={item}><AutoSwapCropCards crops={crops} isLoading={cropsLoading} /></motion.div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <motion.div variants={item}><NegotiationsWidget isFarmer={user?.role === 'FARMER'} /></motion.div>
            <motion.div variants={item}><RecentOrdersCard orders={recentOrders} isLoading={ordersLoading} /></motion.div>
          </div>
        </div>
      )}

      {activeTab === 'weather' && <WeatherWidget crops={crops} />}
      {activeTab === 'marketPrices' && <div className="space-y-6"><DashboardMarketWidget /><div className="text-center"><Link href="/market-prices" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors">View Full Market Prices<ArrowRight className="h-4 w-4" /></Link></div></div>}
      {activeTab === 'encyclopedia' && <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"><div className="col-span-full text-center py-12"><p className="text-slate-500">Crop Encyclopedia content coming soon...</p><Link href="/crop-encyclopedia" className="mt-4 inline-block text-emerald-600 font-medium">Visit Encyclopedia →</Link></div></div>}
    </motion.div>
  );
}
