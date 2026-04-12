'use client';

import { motion } from 'framer-motion';
import { Calendar, Sprout, Leaf, Scissors, Star, Sun, CloudRain } from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  bestVarieties?: string[];
  season?: string;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function SeasonCalendar({ sowingMonths, growingMonths, harvestMonths, bestVarieties, season }: SeasonCalendarProps) {
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
    <div className="space-y-6">
      {/* Season Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {season && (
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Sun className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Season</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{season}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Duration</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {sowingMonths.length + growingMonths.length + harvestMonths.length} months
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Gantt Chart */}
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

      {/* Best Varieties */}
      {bestVarieties && bestVarieties.length > 0 && (
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
              <Star className="h-5 w-5 text-amber-500" />
              Recommended Varieties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {bestVarieties.map((variety, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium"
                >
                  {variety}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
