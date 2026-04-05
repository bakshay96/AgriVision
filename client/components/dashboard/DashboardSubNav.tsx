'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Cloud, TrendingUp, BookOpen, LayoutDashboard } from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';
import { cn } from '@/lib/utils';

interface SubNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface DashboardSubNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function DashboardSubNav({ activeTab, onTabChange }: DashboardSubNavProps) {
  const { t } = useLanguageStore();

  const navItems: SubNavItem[] = [
    { id: 'overview', label: t('dash.subnav.overview'), icon: LayoutDashboard },
    { id: 'weather', label: t('dash.subnav.weather'), icon: Cloud },
    { id: 'marketPrices', label: t('dash.subnav.marketPrices'), icon: TrendingUp },
    { id: 'encyclopedia', label: t('dash.subnav.encyclopedia'), icon: BookOpen },
  ];

  return (
    <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <div className="flex space-x-1 px-4 py-2 overflow-x-auto scrollbar-hide">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                isActive
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
