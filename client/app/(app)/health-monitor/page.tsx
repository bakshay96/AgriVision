'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Microscope, ChevronDown, ChevronUp, Clock, Trash2, AlertTriangle,
  CheckCircle2, ShieldAlert,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/lib/api';
import { SkeletonAnalysisCard } from '@/components/ui/SkeletonLoaders';
import { getSeverityColor, formatRelativeTime } from '@/lib/utils';
import CropScanner, { ScanResult } from '@/components/health/CropScanner';
import { toast } from 'sonner';
import { showErrorToast } from '@/lib/errorHandler';

// ─────────────────────────────────────────────────────────────────────────────
// Animation variants
// ─────────────────────────────────────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

// ─────────────────────────────────────────────────────────────────────────────
// Severity icon helper
// ─────────────────────────────────────────────────────────────────────────────
function SeverityIcon({ severity }: { severity: string }) {
  if (severity === 'healthy') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (severity === 'critical' || severity === 'severe')
    return <ShieldAlert className="h-4 w-4 text-red-500" />;
  return <AlertTriangle className="h-4 w-4 text-amber-500" />;
}

interface IAIAnalysis {
  _id: string;
  imageUrl?: string;
  createdAt: string;
  diagnosis: {
    plantName: string;
    disease: string;
    recommendedTreatment?: string;
    severity: string;
    confidence: number;
    description: string;
    symptoms: string[];
  };
  treatmentPlan?: {
    urgency: string;
    steps: Array<{ step: number; action: string; product?: string }>;
    organicRemedies: string[];
    chemicalTreatments: string[];
    sprayInstructions?: string;
    requiredNutrients?: string[];
    preventionTips?: string[];
    estimatedRecoveryDays?: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AnalysisHistoryCard — expandable card for the scan history panel
// ─────────────────────────────────────────────────────────────────────────────
function AnalysisHistoryCard({
  analysis,
  isExpanded,
  onToggle,
  onArchive,
}: {
  analysis: IAIAnalysis;
  isExpanded: boolean;
  onToggle: () => void;
  onArchive: () => void;
}) {
  const diagnosis = analysis.diagnosis;
  const treatPlan = analysis.treatmentPlan;
  const severity = diagnosis?.severity || 'mild';
  const { badge: badgeCls } = getSeverityColor(severity);

  const resolveImg = (path?: string) => {
    if (!path || path === '') return null;
    if (path.startsWith('http')) return path;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${baseUrl}${path}`;
  };


  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Collapsed row */}
      <div
        className="flex cursor-pointer items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
        onClick={onToggle}
        role="button"
        aria-expanded={isExpanded}
      >
        {analysis.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={resolveImg(analysis.imageUrl) || ''} 
            alt="Scanned" 
            className="h-10 w-10 shrink-0 rounded-lg object-cover border border-slate-200"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/40/10b981/ffffff?text=X';
            }}
          />

        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
            <SeverityIcon severity={severity} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {diagnosis?.plantName || 'Unknown Plant'}
            <span className="font-normal text-xs text-slate-500 ml-2">
              ({diagnosis?.disease || 'Unknown Condition'})
            </span>
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeCls}`}>
              {severity}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              {String(analysis.createdAt) !== 'undefined' ? formatRelativeTime(analysis.createdAt) : 'Recently'}
            </span>
            <span className="text-xs text-slate-400">
              {diagnosis?.confidence || 0}% confidence
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onArchive(); }}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Delete scan"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {isExpanded
            ? <ChevronUp className="h-4 w-4 text-slate-400" />
            : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="p-4 space-y-4">
              {/* Image Preview (Larger) */}
              {analysis.imageUrl && (
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                  <img 
                    src={resolveImg(analysis.imageUrl) || ''} 
                    alt="Scan Detail" 
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Scan+Image+Unavailable';
                    }}
                  />
                  <a 
                    href={resolveImg(analysis.imageUrl) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
                  >
                    Open Original
                  </a>
                </div>
              )}


              {/* Description */}
              {diagnosis?.description != null && (
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">AI Diagnosis</p>
                  <p className="text-xs leading-relaxed text-slate-600">
                    {String(diagnosis.description)}
                  </p>
                </div>
              )}


              {/* Symptoms */}
              {Array.isArray(diagnosis?.symptoms) && (diagnosis.symptoms as string[]).length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-slate-700">Symptoms</p>
                  <ul className="space-y-1">
                    {(diagnosis.symptoms as string[]).map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Treatments — full section */}
              {treatPlan && (
                <div className="space-y-2">
                  {/* Organic Remedies */}
                  {Array.isArray(treatPlan.organicRemedies) && (treatPlan.organicRemedies as string[]).length > 0 && (
                    <div className="rounded-lg bg-emerald-50 p-3">
                      <p className="mb-1.5 text-xs font-semibold text-emerald-700">Jaivik Upay (Organic Remedies)</p>
                      <ul className="space-y-1">
                        {(treatPlan.organicRemedies as string[]).map((r, i) => (
                          <li key={i} className="flex gap-2 text-xs text-slate-600">
                            <span className="mt-1 w-1 h-1 rounded-full bg-emerald-500 shrink-0" />{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Chemical Treatments */}
                  {Array.isArray(treatPlan.chemicalTreatments) && (treatPlan.chemicalTreatments as string[]).length > 0 && (
                    <div className="rounded-lg bg-blue-50 p-3">
                      <p className="mb-1.5 text-xs font-semibold text-blue-700">Fertilizers &amp; Sprays</p>
                      <ul className="space-y-1">
                        {(treatPlan.chemicalTreatments as string[]).map((r, i) => (
                          <li key={i} className="flex gap-2 text-xs text-slate-600">
                            <span className="mt-1 w-1 h-1 rounded-full bg-blue-500 shrink-0" />{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Required Nutrients */}
                  {Array.isArray(treatPlan.requiredNutrients) && (treatPlan.requiredNutrients as string[]).length > 0 && (
                    <div className="rounded-lg bg-purple-50 p-3">
                      <p className="mb-2 text-xs font-semibold text-purple-700">Required Nutrients</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(treatPlan.requiredNutrients as string[]).map((n, i) => (
                          <span key={i} className="rounded-md bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 border border-purple-200">{n}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Spray Instructions */}
                  {treatPlan.sprayInstructions && (
                    <div className="rounded-lg bg-sky-50 p-3 border border-sky-100">
                      <p className="mb-1.5 text-xs font-semibold text-sky-700">Dosage &amp; Spray Instructions (Per Acre)</p>
                      <p className="text-xs leading-relaxed text-slate-600">{String(treatPlan.sprayInstructions)}</p>
                    </div>
                  )}

                  {/* Prevention Tips */}
                  {Array.isArray(treatPlan.preventionTips) && (treatPlan.preventionTips as string[]).length > 0 && (
                    <div className="rounded-lg bg-teal-50 p-3">
                      <p className="mb-1.5 text-xs font-semibold text-teal-700">Prevention Tips</p>
                      <ul className="space-y-1">
                        {(treatPlan.preventionTips as string[]).map((t, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />{t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommended Treatment Steps */}
                  {Array.isArray(treatPlan.steps) && treatPlan.steps.length > 0 && (
                    <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                      <p className="mb-1.5 text-xs font-semibold text-slate-700 flex flex-wrap items-center gap-1.5">
                        Recommended Treatment
                        {treatPlan.urgency && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                            {String(treatPlan.urgency).replace('_', ' ')}
                          </span>
                        )}
                        {treatPlan.estimatedRecoveryDays != null && Number(treatPlan.estimatedRecoveryDays) > 0 && (
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            ~{Number(treatPlan.estimatedRecoveryDays)}d recovery
                          </span>
                        )}
                      </p>
                      <ol className="space-y-1.5">
                        {treatPlan.steps.map((step) => (
                          <li key={Number(step.step)} className="flex gap-2 text-xs text-slate-600">
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-400 text-[9px] font-bold text-white">
                              {Number(step.step)}
                            </span>
                            <span>
                              <span className="font-medium">{String(step.action)}</span>
                              {step.product != null && String(step.product) !== 'None' && (
                                <span className="text-slate-400"> · {String(step.product)}</span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function HealthMonitorPage() {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: analysesData, isLoading } = useQuery<{ analyses: IAIAnalysis[] }>({
    queryKey: ['ai', 'analyses'],
    queryFn: () => aiApi.getAnalyses({ limit: 30 }).then((r) => r.data.data),
  });

  const { mutate: archive } = useMutation({
    mutationFn: (id: string) => aiApi.archiveAnalysis(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'analyses'] });
      toast.success('Analysis deleted');
    },
    onError: (error) => showErrorToast(error, 'Delete Failed'),
  });

  const analyses: IAIAnalysis[] = analysesData?.analyses || [];

  const handleScanComplete = (_result: ScanResult, _analysisId: string) => {
    qc.invalidateQueries({ queryKey: ['ai', 'analyses'] });
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Page header */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-slate-900">AI Health Monitor</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload crop photos for instant Gemini Vision disease detection — images are saved for your history.
        </p>
      </motion.div>

      {/* Main 2-panel layout: scanner left, history right */}
      <div className="grid gap-6 lg:grid-cols-5">

        {/* ── Left: CropScanner ───────────────────────────────────────────── */}
        <motion.div variants={item} className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Microscope className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-slate-900">Scan New Image</h2>
            </div>

            {/* CropScanner handles dropzone + animation + DiagnosisCard */}
            <CropScanner onScanComplete={handleScanComplete} />
          </div>
        </motion.div>

        {/* ── Right: Scan history ──────────────────────────────────────────── */}
        <motion.div variants={item} className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Scan History
              {analyses.length > 0 && (
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  {analyses.length}
                </span>
              )}
            </h2>
          </div>

          <div className="space-y-3">
            {isLoading
              ? Array(3).fill(0).map((_, i) => <SkeletonAnalysisCard key={i} />)
              : analyses.length === 0
              ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
                  <Microscope className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm text-slate-400">No scans yet</p>
                  <p className="mt-1 text-xs text-slate-300">
                    Upload a crop image on the left to get started
                  </p>
                </div>
              )
              : analyses.map((a) => (
                <AnalysisHistoryCard
                  key={String(a._id)}
                  analysis={a}
                  isExpanded={expandedId === String(a._id)}
                  onToggle={() =>
                    setExpandedId((id) => id === String(a._id) ? null : String(a._id))
                  }
                  onArchive={() => archive(String(a._id))}
                />
              ))
            }
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
