'use client';

import { motion } from 'framer-motion';
import { MapPin, Calendar, Leaf, TrendingUp, Sprout, AlertTriangle } from 'lucide-react';
import { formatDate, getHealthColor, getStatusColor, cn } from '@/lib/utils';

interface CropStatusCardProps {
  crop: Record<string, unknown>;
  index: number;
}

export default function CropStatusCard({ crop, index }: CropStatusCardProps) {
  const name = String(crop.name || '');
  const variety = String(crop.variety || 'Standard');
  const fieldLocation = String(crop.fieldLocation || '');
  const status = String(crop.status || 'growing');
  const healthScore = String(crop.healthScore || 'good');
  const areaAcres = Number(crop.areaAcres || 0);
  const expectedYieldTons = Number(crop.expectedYieldTons || 0);
  const predictedHarvestDate = crop.predictedHarvestDate
    ? String(crop.predictedHarvestDate)
    : null;
  const expectedHarvestDate = String(crop.expectedHarvestDate || '');

  const harvestDate = predictedHarvestDate || expectedHarvestDate;
  const daysUntil = harvestDate
    ? Math.ceil(
        (new Date(harvestDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const badgeColor = 'bg-emerald-100 dark:bg-emerald-900/30';
  const iconColor = 'text-emerald-600 dark:text-emerald-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/5 dark:hover:shadow-emerald-500/5"
    >
      {/* Background decoration */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-slate-50 dark:bg-slate-800/50 transition-transform duration-500 group-hover:scale-150" />

      <div>
        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${badgeColor} shadow-sm`}>
              <Sprout className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                {crop.name as string}
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {crop.variety as string}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-medium',
                getStatusColor(status)
              )}
            >
              {status.replace('_', ' ')}
            </span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-medium border',
                getHealthColor(healthScore)
              )}
            >
              {healthScore}
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-2 text-center transition-colors group-hover:bg-white dark:group-hover:bg-slate-800">
            <p className="text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Age</p>
            <p className="mt-0.5 text-sm font-bold text-slate-700 dark:text-slate-300">
              {crop.growthStage === 'seedling' ? '< 2 wks' : crop.growthStage === 'vegetative' ? '3-6 wks' : '> 8 wks'}
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-2 text-center transition-colors group-hover:bg-white dark:group-hover:bg-slate-800">
            <p className="text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Est. Yield</p>
            <p className="mt-0.5 text-sm font-bold text-slate-700 dark:text-slate-300">
              {crop.expectedYield ? `${crop.expectedYield} kg` : 'TBD'}
            </p>
          </div>
        </div>

        {/* Warning Indicator (added as per user request for plant details warning) */}
        {(healthScore === 'critical' || healthScore === 'poor' || status === 'diseased') && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-2 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800"
          >
            <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Health Alert: Immediate Scan</span>
          </motion.div>
        )}
      </div>

      <div className="relative mt-5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
        <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
          <MapPin className="h-3 w-3" />
          <span className="truncate max-w-[100px]">{fieldLocation}</span>
        </div>
        {daysUntil !== null && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium',
              daysUntil <= 7
                ? 'text-amber-600'
                : daysUntil <= 0
                ? 'text-red-600'
                : 'text-emerald-600'
            )}
          >
            <Calendar className="h-3 w-3" />
            {daysUntil <= 0
              ? 'Ready!'
              : `${daysUntil}d to harvest`}
          </div>
        )}
      </div>
    </motion.div>
  );
}
