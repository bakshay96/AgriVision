'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Calendar, DollarSign, BarChart3, Leaf, AlertCircle, CheckCircle } from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';
import { formatCurrency } from '@/lib/utils';

interface AnalyticsData {
  crop: string;
  currentPrice: number;
  predictedPrice: number;
  confidence: number;
  season: string;
  demand: 'high' | 'medium' | 'low';
  supply: 'high' | 'medium' | 'low';
  historicalData: { month: string; price: number }[];
  factors: { factor: string; impact: 'positive' | 'negative' | 'neutral'; description: string }[];
}

interface SmartSuggestionAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
  data?: AnalyticsData;
}

export default function SmartSuggestionAnalytics({ isOpen, onClose, data }: SmartSuggestionAnalyticsProps) {
  const { t } = useLanguageStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'factors'>('overview');

  // Default mock data if none provided
  const analyticsData: AnalyticsData = data || {
    crop: 'Wheat',
    currentPrice: 2250,
    predictedPrice: 2450,
    confidence: 85,
    season: 'Rabi',
    demand: 'high',
    supply: 'medium',
    historicalData: [
      { month: 'Jan', price: 2100 },
      { month: 'Feb', price: 2180 },
      { month: 'Mar', price: 2250 },
      { month: 'Apr', price: 2300 },
      { month: 'May', price: 2350 },
      { month: 'Jun', price: 2450 },
    ],
    factors: [
      { factor: 'Government MSP', impact: 'positive', description: 'MSP increased by 7% this year' },
      { factor: 'Weather Conditions', impact: 'positive', description: 'Favorable monsoon predicted' },
      { factor: 'Export Demand', impact: 'positive', description: 'Rising demand from Middle East' },
      { factor: 'Input Costs', impact: 'negative', description: 'Fertilizer prices up by 12%' },
    ],
  };

  const priceChange = ((analyticsData.predictedPrice - analyticsData.currentPrice) / analyticsData.currentPrice) * 100;
  const isPositive = priceChange > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-10 lg:inset-20 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-emerald-600" />
                  {analyticsData.crop} Analytics
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  AI-powered market insights and price predictions
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              {(['overview', 'trends', 'factors'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Price Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
                      <p className="text-blue-100 text-sm">Current Price</p>
                      <p className="text-3xl font-bold mt-1">{formatCurrency(analyticsData.currentPrice)}</p>
                      <p className="text-blue-100 text-sm mt-1">per quintal</p>
                    </div>

                    <div className={`rounded-xl p-5 text-white ${isPositive ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
                      <p className="text-white/80 text-sm">Predicted Price</p>
                      <p className="text-3xl font-bold mt-1">{formatCurrency(analyticsData.predictedPrice)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        <span className="text-sm">{priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
                      <p className="text-purple-100 text-sm">AI Confidence</p>
                      <p className="text-3xl font-bold mt-1">{analyticsData.confidence}%</p>
                      <div className="w-full bg-white/20 rounded-full h-2 mt-3">
                        <div
                          className="bg-white rounded-full h-2 transition-all"
                          style={{ width: `${analyticsData.confidence}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Market Indicators */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { icon: Calendar, label: 'Season', value: analyticsData.season, color: 'text-orange-600 bg-orange-50' },
                      { icon: TrendingUp, label: 'Demand', value: analyticsData.demand, color: 'text-emerald-600 bg-emerald-50' },
                      { icon: Leaf, label: 'Supply', value: analyticsData.supply, color: 'text-blue-600 bg-blue-50' },
                      { icon: DollarSign, label: 'Profit Potential', value: isPositive ? 'High' : 'Low', color: isPositive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50' },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                        <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center mb-2`}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                        <p className="font-semibold text-slate-900 dark:text-white capitalize">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Recommendation */}
                  <div className={`rounded-xl p-5 ${isPositive ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'}`}>
                    <div className="flex items-start gap-3">
                      {isPositive ? (
                        <CheckCircle className="h-6 w-6 text-emerald-600 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-amber-600 mt-0.5" />
                      )}
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {isPositive ? 'Favorable Time to Sell' : 'Hold or Store'}
                        </h4>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                          {isPositive
                            ? `Market conditions suggest selling ${analyticsData.crop} now. Prices are expected to rise by ${priceChange.toFixed(1)}% in the coming weeks.`
                            : `Consider storing ${analyticsData.crop} for better prices later. Current market conditions indicate price volatility.`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'trends' && (
                <div className="space-y-6">
                  <h3 className="font-semibold text-slate-900 dark:text-white">6-Month Price Trend</h3>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6">
                    <div className="flex items-end gap-4 h-48">
                      {analyticsData.historicalData.map((data, idx) => {
                        const maxPrice = Math.max(...analyticsData.historicalData.map(d => d.price));
                        const height = (data.price / maxPrice) * 100;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                            <div
                              className="w-full bg-emerald-500 rounded-t-lg transition-all hover:bg-emerald-600"
                              style={{ height: `${height}%` }}
                            />
                            <p className="text-xs text-slate-500">{data.month}</p>
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">₹{data.price}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'factors' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Market Factors</h3>
                  {analyticsData.factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        factor.impact === 'positive' ? 'bg-emerald-100 text-emerald-600' :
                        factor.impact === 'negative' ? 'bg-red-100 text-red-600' :
                        'bg-slate-200 text-slate-600'
                      }`}>
                        {factor.impact === 'positive' ? <TrendingUp className="h-5 w-5" /> :
                         factor.impact === 'negative' ? <TrendingDown className="h-5 w-5" /> :
                         <AlertCircle className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-900 dark:text-white">{factor.factor}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                            factor.impact === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                            factor.impact === 'negative' ? 'bg-red-100 text-red-700' :
                            'bg-slate-200 text-slate-700'
                          }`}>
                            {factor.impact}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{factor.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
