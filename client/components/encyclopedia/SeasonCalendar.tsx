'use client';

import { motion } from 'framer-motion';
import { Calendar, Sprout, Leaf, Scissors } from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';

interface SeasonPhase {
  name: string;
  startMonth: number; // 0-11
  duration: number; // in months
  color: string;
  icon: React.ElementType;
}

interface SeasonCalendarProps {
  sowingMonths: number[];
  growingMonths: number[];
  harvestMonths: number[];
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function SeasonCalendar({ sowingMonths, growingMonths, harvestMonths }: SeasonCalendarProps) {
  const { t } = useLanguageStore();

  // Create phases from months
  const phases: SeasonPhase[] = [
    {
      name: t('encyclo.sowing'),
      startMonth: sowingMonths[0] || 0,
      duration: sowingMonths.length || 2,
      color: 'bg-emerald-500',
      icon: Sprout,
    },
    {
      name: t('encyclo.growing'),
      startMonth: growingMonths[0] || 2,
      duration: growingMonths.length || 4,
      color: 'bg-green-500',
      icon: Leaf,
    },
    {
      name: t('encyclo.harvest'),
      startMonth: harvestMonths[0] || 9,
      duration: harvestMonths.length || 2,
      color: 'bg-amber-500',
      icon: Scissors,
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      {/* Month headers */}
      <div className="grid grid-cols-12 gap-1 mb-4">
        {months.map((month) => (
          <div key={month} className="text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
            {month}
          </div>
        ))}
      </div>

      {/* Gantt chart */}
      <div className="space-y-4">
        {phases.map((phase, idx) => {
          const Icon = phase.icon;
          return (
            <motion.div
              key={phase.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative"
            >
              {/* Phase label */}
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${phase.color} bg-opacity-20`}>
                  <Icon className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{phase.name}</span>
              </div>

              {/* Timeline bar */}
              <div className="relative h-8 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                {/* Grid lines */}
                <div className="absolute inset-0 grid grid-cols-12">
                  {months.map((_, i) => (
                    <div key={i} className="border-r border-slate-200 dark:border-slate-600 last:border-r-0" />
                  ))}
                </div>

                {/* Phase bar */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(phase.duration / 12) * 100}%` }}
                  transition={{ duration: 0.8, delay: idx * 0.2 }}
                  className={`absolute h-full ${phase.color} rounded-lg`}
                  style={{ left: `${(phase.startMonth / 12) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-white/20" />
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        {phases.map((phase) => (
          <div key={phase.name} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${phase.color}`} />
            <span className="text-slate-600 dark:text-slate-400">{phase.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
