'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, TrendingUp, BookOpen, LayoutDashboard, ChevronDown } from 'lucide-react';
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
  const { t, language } = useLanguageStore();
  const [isExpanded, setIsExpanded] = useState(true);

  const navItems: SubNavItem[] = [
    { id: 'overview', label: language === 'mr' ? 'विहंगावलोकन' : language === 'hi' ? 'अवलोकन' : 'Overview', icon: LayoutDashboard },
    { id: 'weather', label: language === 'mr' ? 'हवामान' : language === 'hi' ? 'मौसम' : 'Weather', icon: Cloud },
    { id: 'marketPrices', label: language === 'mr' ? 'बाजार भाव' : language === 'hi' ? 'बाजार भाव' : 'Market Prices', icon: TrendingUp },
    { id: 'encyclopedia', label: language === 'mr' ? 'पीक माहिती' : language === 'hi' ? 'फसल ज्ञानकोश' : 'Crop Encyclopedia', icon: BookOpen },
  ];

  return (
    <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      {/* Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <span>{language === 'mr' ? 'डॅशबोर्ड विभाग' : language === 'hi' ? 'डैशबोर्ड अनुभाग' : 'Dashboard Sections'}</span>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>

      {/* Animated Nav Items */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex space-x-1 px-4 py-2 overflow-x-auto scrollbar-hide">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <motion.button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
