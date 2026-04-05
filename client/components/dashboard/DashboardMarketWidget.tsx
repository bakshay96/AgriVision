'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRight, Store } from 'lucide-react';
import Link from 'next/link';
import { useLanguageStore } from '@/store/useLanguageStore';
import { formatCurrency } from '@/lib/utils';

export default function DashboardMarketWidget() {
  const { t } = useLanguageStore();

  // Mock market data - in production, this would come from API
  const topCrops = [
    { name: 'Wheat', price: 2250, trend: 'up', change: 2.5 },
    { name: 'Rice', price: 3800, trend: 'up', change: 1.8 },
    { name: 'Cotton', price: 6200, trend: 'down', change: -0.5 },
    { name: 'Soybean', price: 4200, trend: 'up', change: 3.2 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-800"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-emerald-600" />
          <h3 className="font-semibold text-slate-900 dark:text-white">{t('market.title')}</h3>
        </div>
        <Link
          href="/market-prices"
          className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {topCrops.map((crop, idx) => (
          <div
            key={crop.name}
            className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
          >
            <div>
              <p className="font-medium text-slate-900 dark:text-white">{crop.name}</p>
              <p className="text-sm text-slate-500">per quintal</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-900 dark:text-white">{formatCurrency(crop.price)}</p>
              <div className={`flex items-center gap-1 text-sm ${crop.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {crop.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{crop.change > 0 ? '+' : ''}{crop.change}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
