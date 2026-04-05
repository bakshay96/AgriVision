'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PriceTickerItem {
  cropName: string;
  variety: string;
  price: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  marketName: string;
}

interface PriceTickerProps {
  prices: PriceTickerItem[];
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const trendColors = {
  up: 'text-green-600 dark:text-green-400',
  down: 'text-red-600 dark:text-red-400',
  stable: 'text-slate-500 dark:text-slate-400',
};

export default function PriceTicker({ prices }: PriceTickerProps) {
  // Duplicate prices for seamless loop
  const duplicatedPrices = [...prices, ...prices, ...prices];

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-emerald-700 py-3">
      {/* Gradient overlays for fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-emerald-600 to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-emerald-700 to-transparent z-10" />
      
      {/* Scrolling container */}
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{
          x: [0, -50 * prices.length * 3],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: 40,
            ease: 'linear',
          },
        }}
      >
        {duplicatedPrices.map((price, idx) => {
          const TrendIcon = trendIcons[price.trend];
          return (
            <div
              key={`${price.cropName}-${idx}`}
              className="flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg"
            >
              <span className="text-white font-medium">{price.cropName}</span>
              <span className="text-emerald-100 text-sm">({price.variety})</span>
              <span className="text-white font-bold">{formatCurrency(price.price)}</span>
              <div className={`flex items-center gap-1 ${trendColors[price.trend]}`}>
                <TrendIcon className="h-3 w-3" />
                <span className="text-xs font-medium">
                  {price.trend === 'up' ? '+' : ''}{price.changePercent}%
                </span>
              </div>
              <span className="text-emerald-200 text-xs">{price.marketName}</span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
