'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, Leaf, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';

interface Pest {
  id: string;
  name: string;
  scientificName: string;
  image?: string;
  description: string;
  symptoms: string[];
  organicSolution: string;
  chemicalSolution: string;
  severity: 'low' | 'medium' | 'high';
}

interface PestManagementProps {
  pests: Pest[];
}

export default function PestManagement({ pests }: PestManagementProps) {
  const { t } = useLanguageStore();
  const [expandedPest, setExpandedPest] = useState<string | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    }
  };

  return (
    <div className="space-y-4">
      {pests.map((pest, idx) => {
        const isExpanded = expandedPest === pest.id;
        
        return (
          <motion.div
            key={pest.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            {/* Header */}
            <button
              onClick={() => setExpandedPest(isExpanded ? null : pest.id)}
              className="w-full px-4 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              {/* Pest Image or Icon */}
              <div className="w-16 h-16 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 overflow-hidden">
                {pest.image ? (
                  <img src={pest.image} alt={pest.name} className="w-full h-full object-cover" />
                ) : (
                  <Bug className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{pest.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityColor(pest.severity)}`}>
                    {pest.severity}
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">{pest.scientificName}</p>
              </div>

              {/* Expand Icon */}
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-200 dark:border-slate-700"
                >
                  <div className="p-4 space-y-4">
                    {/* Description */}
                    <p className="text-sm text-slate-600 dark:text-slate-300">{pest.description}</p>

                    {/* Symptoms */}
                    <div>
                      <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Symptoms
                      </h4>
                      <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1">
                        {pest.symptoms.map((symptom, i) => (
                          <li key={i}>{symptom}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Solutions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Organic Solution */}
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-2">
                          <Leaf className="h-4 w-4" />
                          {t('encyclo.organicSolution')}
                        </h4>
                        <p className="text-sm text-emerald-700 dark:text-emerald-400">{pest.organicSolution}</p>
                      </div>

                      {/* Chemical Solution */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                          <Bug className="h-4 w-4" />
                          {t('encyclo.chemicalSolution')}
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-400">{pest.chemicalSolution}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
