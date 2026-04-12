'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, Leaf, AlertTriangle, ChevronDown, ChevronUp, Shield, AlertCircle } from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';

interface PestOrDisease {
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
  pests: PestOrDisease[];
  diseases?: PestOrDisease[];
}

export default function PestManagement({ pests, diseases }: PestManagementProps) {
  const { t } = useLanguageStore();
  const [expandedPest, setExpandedPest] = useState<string | null>(null);
  const [expandedDisease, setExpandedDisease] = useState<string | null>(null);

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

  const renderItem = (item: PestOrDisease, isExpanded: boolean, toggle: () => void, isPest: boolean) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={toggle}
        className="w-full px-4 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        {/* Image or Icon */}
        <div className={`w-16 h-16 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${isPest ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
          {item.image ? (
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          ) : isPest ? (
            <Bug className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          ) : (
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 dark:text-white">{item.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityColor(item.severity)}`}>
              {item.severity}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">{item.scientificName}</p>
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
              <p className="text-sm text-slate-600 dark:text-slate-300">{item.description}</p>

              {/* Symptoms */}
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Symptoms
                </h4>
                <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  {item.symptoms.map((symptom, i) => (
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
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">{item.organicSolution}</p>
                </div>

                {/* Chemical Solution */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {t('encyclo.chemicalSolution')}
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400">{item.chemicalSolution}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Pests Section */}
      {pests && pests.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Common Pests</h3>
          </div>
          <div className="space-y-3">
            {pests.map((pest, idx) => renderItem(
              pest,
              expandedPest === pest.id,
              () => setExpandedPest(expandedPest === pest.id ? null : pest.id),
              true
            ))}
          </div>
        </div>
      )}

      {/* Diseases Section */}
      {diseases && diseases.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Common Diseases</h3>
          </div>
          <div className="space-y-3">
            {diseases.map((disease, idx) => renderItem(
              disease,
              expandedDisease === disease.id,
              () => setExpandedDisease(expandedDisease === disease.id ? null : disease.id),
              false
            ))}
          </div>
        </div>
      )}

      {/* No Data */}
      {(!pests || pests.length === 0) && (!diseases || diseases.length === 0) && (
        <div className="text-center py-8">
          <Bug className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="mt-2 text-slate-500 dark:text-slate-400">No pest or disease information available</p>
        </div>
      )}
    </div>
  );
}
