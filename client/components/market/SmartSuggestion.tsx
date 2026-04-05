'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Sprout, Lightbulb, ArrowRight, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguageStore } from '@/store/useLanguageStore';
import { formatCurrency } from '@/lib/utils';
import SmartSuggestionAnalytics from './SmartSuggestionAnalytics';

interface ROIPrediction {
  cropName: string;
  variety: string;
  currentPrice: number;
  predictedPrice: number;
  roi: number;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

interface SmartSuggestionProps {
  predictions: ROIPrediction[];
}

export default function SmartSuggestion({ predictions }: SmartSuggestionProps) {
  const { t } = useLanguageStore();
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);

  // Sort by ROI and take top 3
  const topPredictions = [...predictions]
    .sort((a, b) => b.roi - a.roi)
    .slice(0, 3);

  const handleViewAnalytics = (cropName: string) => {
    setSelectedCrop(cropName);
    setIsAnalyticsOpen(true);
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-white">
          <Lightbulb className="h-5 w-5 text-yellow-300" />
          {t('market.smartSuggestion')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-indigo-100 text-sm mb-4">
          Based on 6-month price trends and seasonal patterns
        </p>
        
        <div className="space-y-3">
          {topPredictions.map((prediction, idx) => (
            <motion.div
              key={prediction.cropName}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Sprout className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">{prediction.cropName}</p>
                    <p className="text-xs text-indigo-200">{prediction.variety}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-emerald-300">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-bold">+{prediction.roi}% ROI</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceColor(prediction.confidence)}`}>
                    {prediction.confidence} confidence
                  </span>
                </div>
              </div>
              
              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-sm">
                <div className="flex gap-4">
                  <span className="text-indigo-200">
                    Current: <span className="text-white">{formatCurrency(prediction.currentPrice)}</span>
                  </span>
                  <span className="text-indigo-200">
                    Predicted: <span className="text-emerald-300">{formatCurrency(prediction.predictedPrice)}</span>
                  </span>
                </div>
              </div>
              
              <p className="mt-2 text-xs text-indigo-200">
                {prediction.reason}
              </p>
            </motion.div>
          ))}
        </div>

        <button 
          onClick={() => handleViewAnalytics(topPredictions[0]?.cropName || '')}
          className="mt-4 w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          {t('market.viewAnalytics') || 'View Analytics'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </CardContent>

      <SmartSuggestionAnalytics
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />
    </Card>
  );
}
