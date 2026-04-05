'use client';

import { motion } from 'framer-motion';
import { Sprout, Droplets, Ruler, Sun, Thermometer } from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';

interface PlantingGuideProps {
  soilType: string;
  phRange: string;
  sowingDepth: string;
  spacing: string;
  waterFrequency: string;
  sunlight: string;
  temperature: string;
}

export default function PlantingGuide({
  soilType,
  phRange,
  sowingDepth,
  spacing,
  waterFrequency,
  sunlight,
  temperature,
}: PlantingGuideProps) {
  const { t } = useLanguageStore();

  const guideItems = [
    {
      icon: Sprout,
      title: t('encyclo.soilRequirements'),
      value: soilType,
      subtext: `pH: ${phRange}`,
      color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
    {
      icon: Ruler,
      title: t('encyclo.sowingDepth'),
      value: sowingDepth,
      subtext: `Spacing: ${spacing}`,
      color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    },
    {
      icon: Droplets,
      title: t('encyclo.waterFrequency'),
      value: waterFrequency,
      subtext: 'Based on soil moisture',
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    },
    {
      icon: Sun,
      title: 'Sunlight Requirements',
      value: sunlight,
      subtext: 'Daily exposure',
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    },
    {
      icon: Thermometer,
      title: 'Temperature',
      value: temperature,
      subtext: 'Optimal range',
      color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {guideItems.map((item, idx) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${item.color}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{item.title}</p>
              <p className="font-semibold text-slate-900 dark:text-white mt-1">{item.value}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.subtext}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
