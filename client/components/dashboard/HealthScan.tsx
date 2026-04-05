'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, ScanLine, Loader2, CheckCircle2, AlertTriangle,
  ShieldAlert, X, Leaf, ClipboardList, RefreshCw,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import toast from 'react-hot-toast';

// Shadcn/UI components
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Diagnosis {
  disease: string;
  confidence: number; // 0–100
  severity: 'healthy' | 'mild' | 'moderate' | 'severe' | 'critical';
  affectedArea: string;
  description: string;
  symptoms: string[];
}

interface TreatmentStep {
  step: number;
  action: string;
  timing: string;
  product?: string;
}

interface TreatmentPlan {
  urgency: 'immediate' | 'within_week' | 'routine';
  steps: TreatmentStep[];
  preventionTips: string[];
  estimatedRecoveryDays: number;
}

interface AIAnalysis {
  diagnosis: Diagnosis;
  treatmentPlan: TreatmentPlan;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const SEVERITY_META: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; badgeVariant: 'HEALTHY' | 'STRESSED' | 'DISEASED' | 'UNKNOWN' }
> = {
  healthy: {
    label: 'Healthy',
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
    color: 'text-emerald-600',
    badgeVariant: 'HEALTHY',
  },
  mild: {
    label: 'Mild Stress',
    icon: <Leaf className="h-4 w-4 text-amber-500" />,
    color: 'text-amber-600',
    badgeVariant: 'STRESSED',
  },
  moderate: {
    label: 'Moderate',
    icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
    color: 'text-orange-600',
    badgeVariant: 'STRESSED',
  },
  severe: {
    label: 'Severe',
    icon: <ShieldAlert className="h-4 w-4 text-red-500" />,
    color: 'text-red-600',
    badgeVariant: 'DISEASED',
  },
  critical: {
    label: 'Critical',
    icon: <ShieldAlert className="h-4 w-4 text-red-600" />,
    color: 'text-red-700',
    badgeVariant: 'DISEASED',
  },
};

const URGENCY_COLORS: Record<string, string> = {
  immediate: 'text-red-600 bg-red-50 border-red-200',
  within_week: 'text-amber-600 bg-amber-50 border-amber-200',
  routine: 'text-emerald-600 bg-emerald-50 border-emerald-200',
};

// ─────────────────────────────────────────────────────────────────────────────
// AnalysisCard sub-component — shows full diagnosis with progress bar
// ─────────────────────────────────────────────────────────────────────────────

function AnalysisCard({ analysis }: { analysis: AIAnalysis }) {
  const { diagnosis, treatmentPlan } = analysis;
  const meta = SEVERITY_META[diagnosis.severity] ?? SEVERITY_META['moderate'];
  const confidence = Math.round(diagnosis.confidence);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
    >
      <Card className="border-slate-200 overflow-hidden">
        {/* Colour band at top */}
        <div
          className={`h-1.5 w-full ${
            diagnosis.severity === 'healthy'
              ? 'bg-emerald-500'
              : diagnosis.severity === 'mild' || diagnosis.severity === 'moderate'
              ? 'bg-amber-400'
              : 'bg-red-500'
          }`}
        />

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {meta.icon}
              <CardTitle className={`${meta.color} dark:${meta.color.replace('600', '400').replace('700', '400')}`}>{diagnosis.disease}</CardTitle>
            </div>
            <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
          </div>
          <CardDescription className="dark:text-slate-400">{diagnosis.affectedArea}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* ── Confidence Score ── */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">
                AI Confidence
              </span>
              <span className={`text-sm font-bold ${meta.color}`}>
                {confidence}%
              </span>
            </div>
            <Progress value={confidence} className="h-3" />
          </div>

          {/* ── Description ── */}
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {diagnosis.description}
          </p>

          {/* ── Symptoms ── */}
          {diagnosis.symptoms.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Detected Symptoms
              </p>
              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {diagnosis.symptoms.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Treatment Plan ── */}
          {treatmentPlan && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Treatment Plan
                  </span>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                    URGENCY_COLORS[treatmentPlan.urgency] ?? ''
                  }`}
                >
                  {treatmentPlan.urgency.replace('_', ' ')}
                </span>
              </div>

              <ol className="space-y-2.5">
                {treatmentPlan.steps.slice(0, 4).map((step) => (
                  <li key={step.step} className="flex gap-3 text-xs">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                      {step.step}
                    </span>
                    <div className="flex-1 pt-0.5">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {step.action}
                      </span>
                      {step.product && step.product !== 'None' && (
                        <span className="text-slate-400"> · {step.product}</span>
                      )}
                      <span className="ml-1 text-slate-400">({step.timing})</span>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                <RefreshCw className="h-3 w-3" />
                Est. recovery:{' '}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {treatmentPlan.estimatedRecoveryDays} days
                </span>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t border-slate-100 dark:border-slate-800 pt-4">
          <Button variant="emerald" size="sm" className="w-full" asChild>
            <a href="/health-monitor">View Full Analysis History →</a>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HealthScan — main exported component
// ─────────────────────────────────────────────────────────────────────────────

export default function HealthScan() {
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const { setIsAnalyzing, isAnalyzing } = useAppStore();
  const qc = useQueryClient();

  const { mutate: runScan } = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('image', file);
      return aiApi.analyzeImage(fd);
    },
    onMutate: () => setIsAnalyzing(true),
    onSuccess: (res) => {
      const data = res.data?.data?.analysis ?? res.data?.data;
      setAnalysis(data as AIAnalysis);
      qc.invalidateQueries({ queryKey: ['ai', 'analyses'] });
      toast.success('HealthScan complete!', { icon: '🌿' });
    },
    onError: () => toast.error('Analysis failed. Check your Gemini API key.'),
    onSettled: () => setIsAnalyzing(false),
  });

  const onDrop = useCallback(
    (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
      setAnalysis(null);
      runScan(file);
    },
    [runScan]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDropRejected: () => toast.error('File too large or unsupported format'),
  });

  const clear = () => {
    setPreview(null);
    setAnalysis(null);
  };

  return (
    <Card className="overflow-hidden dark:bg-slate-900 dark:border-slate-800">
      {/* ── Header ── */}
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
              <ScanLine className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="dark:text-white">AI HealthScan</CardTitle>
              <CardDescription className="dark:text-slate-400">Gemini Vision · Disease Detection</CardDescription>
            </div>
          </div>
          {(preview || analysis) && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clear}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-5">
        {/* ── Drop Zone ── */}
        <div
          {...getRootProps()}
          className={[
            'relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center',
            'transition-all duration-200',
            isDragActive
              ? 'scale-[1.02] border-emerald-500 bg-emerald-50'
              : preview
              ? 'border-emerald-300 bg-white'
              : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50',
          ].join(' ')}
        >
          <input {...getInputProps()} />

          {preview ? (
            /* ── Image preview with analysing overlay ── */
            <div className="relative mx-auto max-w-[240px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Crop scan preview"
                className="mx-auto max-h-44 w-full rounded-xl object-cover shadow-sm"
              />
              {isAnalyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-black/55 backdrop-blur-[2px]">
                  <Loader2 className="h-9 w-9 animate-spin text-white" />
                  <p className="text-xs font-medium text-white">
                    Analysing with Gemini AI…
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* ── Empty state ── */
            <div className="space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                <Upload className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {isDragActive ? '📸 Drop the image now!' : 'Drag & drop or click to upload'}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  JPG · PNG · WebP &mdash; max 10 MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Scanning Progress Bar ── */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-lg bg-emerald-50 px-4 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                  <p className="text-xs font-medium text-emerald-700">
                    Running Gemini Vision analysis…
                  </p>
                </div>
                <Progress value={undefined} className="h-1.5 bg-emerald-100 [&>div]:animate-pulse [&>div]:bg-emerald-400" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Analysis Card ── */}
        <AnimatePresence>
          {analysis && !isAnalyzing && (
            <AnalysisCard analysis={analysis} />
          )}
        </AnimatePresence>

        {/* ── Upload button (shown only when empty) ── */}
        {!preview && !isAnalyzing && (
          <Button
            variant="emerald-outline"
            size="sm"
            className="w-full"
            onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            Choose Image
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
