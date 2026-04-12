'use client';

import { motion } from 'framer-motion';
import { Sprout, Droplets, Ruler, Sun, Thermometer, Beaker, Clock } from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Fertilizer {
  name: string;
  timing: string;
  amount: string;
}

interface GrowthStage {
  stage: string;
  duration: string;
  description: string;
}

interface PlantingGuideProps {
  soilType: string;
  phRange: string;
  sowingDepth: string;
  spacing: string;
  waterFrequency: string;
  sunlight: string;
  temperature: string;
  fertilizers?: Fertilizer[];
  growthStages?: GrowthStage[];
}

export default function PlantingGuide({
  soilType,
  phRange,
  sowingDepth,
  spacing,
  waterFrequency,
  sunlight,
  temperature,
  fertilizers,
  growthStages,
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
    <div className="space-y-6">
      {/* Basic Requirements Grid */}
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

      {/* Fertilizers Section */}
      {fertilizers && fertilizers.length > 0 && (
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
              <Beaker className="h-5 w-5 text-purple-600" />
              Fertilizer Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fertilizers.map((fert, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{fert.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{fert.timing}</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium">
                    {fert.amount}
                  </span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Growth Stages Section */}
      {growthStages && growthStages.length > 0 && (
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
              <Clock className="h-5 w-5 text-blue-600" />
              Growth Stages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
              <div className="space-y-4">
                {growthStages.map((stage, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative pl-10"
                  >
                    <div className="absolute left-2 top-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800" />
                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-900 dark:text-white">{stage.stage}</p>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{stage.duration}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{stage.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
