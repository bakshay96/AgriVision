'use client';

/**
 * CropScanner — AI Health Scan component
 *
 * Architecture:
 *   Dropzone (react-dropzone)
 *     → useMutation (TanStack Query) → POST /api/ai/scan
 *       → ScanningOverlay (Framer Motion pulse beam)
 *         → DiagnosisCard (full report with plant name + image)
 */

import { useState, useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, ScanLine, Loader2, CheckCircle2, AlertTriangle,
  ShieldAlert, RefreshCw, Cpu, Clock, Leaf, X, FlaskConical,
  Sprout, Activity, Info,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/lib/api';
import { getSeverityColor } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useLoader } from '@/hooks/useLoader';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ScanResult {
  condition: string;
  plantName: string;
  confidenceScore: number;
  severity: 'healthy' | 'mild' | 'moderate' | 'severe' | 'critical';
  symptoms: string[];
  recommendedTreatment: string;
  organicRemedies: string[];
  chemicalTreatments: string[];
  affectedArea: string;
  description: string;
  aiModel: string;
  processingTimeMs: number;
  isMockResponse: boolean;
  imageUrl?: string;
  uploadSuccess?: boolean;
}


interface CropScannerProps {
  onScanComplete?: (result: ScanResult, analysisId: string) => void;
  cropId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// ─────────────────────────────────────────────────────────────────────────────
// Severity config
// ─────────────────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<
  ScanResult['severity'],
  {
    label: string;
    gradient: string;
    border: string;
    bg: string;
    icon: React.ElementType;
    iconBg: string;
    textColor: string;
    badgeBg: string;
    badgeText: string;
    bar: string;
  }
> = {
  healthy: {
    label: 'Healthy',
    gradient: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50',
    icon: CheckCircle2,
    iconBg: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    bar: 'bg-emerald-500',
  },
  mild: {
    label: 'Mild Issue',
    gradient: 'from-yellow-400 to-amber-500',
    border: 'border-yellow-200',
    bg: 'bg-yellow-50',
    icon: AlertTriangle,
    iconBg: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-800',
    bar: 'bg-yellow-500',
  },
  moderate: {
    label: 'Moderate',
    gradient: 'from-amber-500 to-orange-500',
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    textColor: 'text-amber-700',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    bar: 'bg-amber-500',
  },
  severe: {
    label: 'Severe',
    gradient: 'from-orange-500 to-red-500',
    border: 'border-orange-200',
    bg: 'bg-orange-50',
    icon: ShieldAlert,
    iconBg: 'bg-orange-100',
    textColor: 'text-orange-700',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-800',
    bar: 'bg-orange-500',
  },
  critical: {
    label: 'Critical',
    gradient: 'from-red-500 to-rose-600',
    border: 'border-red-200',
    bg: 'bg-red-50',
    icon: ShieldAlert,
    iconBg: 'bg-red-100',
    textColor: 'text-red-700',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-800',
    bar: 'bg-red-500',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ScanningOverlay — animated while AI is processing
// ─────────────────────────────────────────────────────────────────────────────

function ScanningOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/65 backdrop-blur-sm overflow-hidden">
      {/* Scan beam */}
      <motion.div
        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
        initial={{ top: '0%' }}
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Corner brackets */}
      {['top-3 left-3 border-t-2 border-l-2',
        'top-3 right-3 border-t-2 border-r-2',
        'bottom-3 left-3 border-b-2 border-l-2',
        'bottom-3 right-3 border-b-2 border-r-2',
      ].map((cls, i) => (
        <div key={i} className={`absolute h-6 w-6 border-emerald-400 ${cls}`} />
      ))}

      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        className="flex flex-col items-center gap-3"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/20">
          <ScanLine className="h-8 w-8 text-emerald-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-white tracking-wide">AI Analysing</p>
          <p className="text-xs text-emerald-300 mt-1">Detecting plant & disease...</p>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DiagnosisCard — full report: image + plant name + diagnosis
// ─────────────────────────────────────────────────────────────────────────────

function DiagnosisCard({
  result,
  preview,
  onReset,
}: {
  result: ScanResult;
  preview: string | null;
  onReset: () => void;
}) {
  const cfg = SEVERITY_CONFIG[result.severity] ?? SEVERITY_CONFIG.mild;
  const Icon = cfg.icon;

  const confidenceColor =
    result.confidenceScore >= 80
      ? 'bg-emerald-500'
      : result.confidenceScore >= 60
        ? 'bg-amber-500'
        : 'bg-red-500';

  const displayImage = result.imageUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={`rounded-2xl border overflow-hidden shadow-sm ${cfg.border}`}
    >
      {/* ── Header gradient strip ── */}
      <div className={`bg-gradient-to-r ${cfg.gradient} px-4 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-white/80 uppercase tracking-wider">
                {cfg.label}
              </p>
              <p className="text-base font-bold text-white leading-tight">
                {result.condition}
              </p>
            </div>
          </div>
          <button
            onClick={onReset}
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/15 transition-colors"
            title="Scan another image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Main body ── */}
      <div className={`${cfg.bg} p-4 space-y-4`}>

        {/* Uploaded image + plant name side by side */}
        {displayImage && (
          <div className="flex gap-3 items-start">
            {/* Thumbnail */}
            <div className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImage}
                alt="Scanned crop"
                className="h-24 w-24 rounded-xl object-cover border-2 border-white shadow-md bg-slate-100"
                onError={(e) => {
                  console.error('[DiagnosisCard] ⚠️ Image failed to load:', displayImage);
                  (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Image';
                }}
              />

              <div className={`absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br ${cfg.gradient} shadow`}>
                <Icon className="h-3 w-3 text-white" />
              </div>
            </div>

            {/* Plant info */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className={`rounded-xl border ${cfg.border} bg-white/70 px-3 py-2.5`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Sprout className={`h-3.5 w-3.5 ${cfg.textColor} shrink-0`} />
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Plant Identified
                  </span>
                </div>
                <p className={`text-lg font-bold ${cfg.textColor} leading-tight`}>
                  {result.plantName}
                </p>
              </div>

              {/* Confidence */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    AI Confidence
                  </span>
                  <span className={`text-xs font-bold ${cfg.textColor}`}>
                    {result.confidenceScore}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/70 shadow-inner">
                  <motion.div
                    className={`h-full rounded-full ${confidenceColor}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${result.confidenceScore}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {result.description && (
          <div className="rounded-xl border border-white/60 bg-white/50 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Info className="h-3.5 w-3.5 text-slate-500" />
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Diagnosis</p>
            </div>
            <p className="text-xs leading-relaxed text-slate-700">{result.description}</p>
          </div>
        )}

        {/* Symptoms */}
        {result.symptoms.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Activity className="h-3.5 w-3.5 text-slate-500" />
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                Symptoms Detected
              </p>
            </div>
            <ul className="space-y-1.5">
              {result.symptoms.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${cfg.bar}`} />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Treatment */}
        <div className="rounded-xl border border-white/60 bg-white/60 p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Leaf className={`h-3.5 w-3.5 ${cfg.textColor}`} />
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
              Recommended Treatment
            </p>
          </div>
          <p className="text-xs leading-relaxed text-slate-700 mb-3">{result.recommendedTreatment}</p>
          
          {result.organicRemedies.length > 0 && (
            <div className="mt-3 border-t border-slate-200/50 pt-2">
              <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-1.5">
                Jaivik Upay (Organic)
              </p>
              <ul className="space-y-1">
                {result.organicRemedies.map((s, i) => (
                  <li key={i} className="text-xs text-slate-700 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.chemicalTreatments.length > 0 && (
            <div className="mt-2 border-t border-slate-200/50 pt-2">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1.5">
                Fertilizers & Sprays
              </p>
              <ul className="space-y-1">
                {result.chemicalTreatments.map((s, i) => (
                  <li key={i} className="text-xs text-slate-700 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Affected area pill */}
        {result.affectedArea && result.affectedArea !== 'N/A' && (
          <div className="flex items-center gap-2">
            <FlaskConical className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <p className="text-xs text-slate-500">
              Affected area:{' '}
              <span className="font-semibold text-slate-700">{result.affectedArea}</span>
            </p>
          </div>
        )}

        {/* Footer meta */}
        <div className="flex items-center justify-between border-t border-white/50 pt-2">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Cpu className="h-3 w-3" />
            <span>{result.aiModel}</span>
            {result.isMockResponse && (
              <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                DEMO
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Clock className="h-3 w-3" />
            {(result.processingTimeMs / 1000).toFixed(1)}s
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CropScanner — main exported component
// ─────────────────────────────────────────────────────────────────────────────

export default function CropScanner({ onScanComplete, cropId }: CropScannerProps) {
  const qc = useQueryClient();
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const { language } = useLanguageStore();
  const { showLoader, hideLoader } = useLoader();

  // ── TanStack Query mutation ───────────────────────────────────────────────
  const { mutate: scan, isPending: isScanning } = useMutation({
    mutationFn: (file: File) => {
      showLoader({ variant: 'analysis', message: 'Analyzing Crop...' });
      // Map tight language codes to full names for Gemini AI understanding
      const languageMap: Record<string, string> = { en: 'English', mr: 'Marathi', hi: 'Hindi' };
      const fullLanguageName = languageMap[language] || 'English';

      console.log('[CropScanner] 📤 Uploading image for AI scan:', {
        filename: file.name,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        type: file.type,
        language: fullLanguageName,
        cropId: cropId || 'none'
      });

      const fd = new FormData();
      fd.append('image', file);
      fd.append('language', fullLanguageName);
      if (cropId) fd.append('cropId', cropId);
      return aiApi.scanCrop(fd);
    },
    onSuccess: (res) => {
      const { scan: scanData, analysisId } = res.data.data as {
        scan: ScanResult;
        analysisId: string;
      };

      console.log('[CropScanner] ✅ AI Scan completed successfully:', {
        analysisId,
        plantName: scanData.plantName,
        condition: scanData.condition,
        severity: scanData.severity,
        confidence: scanData.confidenceScore,
        imageUrl: scanData.imageUrl,
        uploadSuccess: scanData.uploadSuccess,
        processingTimeMs: scanData.processingTimeMs,
        aiModel: scanData.aiModel
      });

      setResult(scanData);
      qc.invalidateQueries({ queryKey: ['ai', 'analyses'] });
      onScanComplete?.(scanData, analysisId);
      hideLoader();
      toast.success(
        scanData.severity === 'healthy'
          ? `✅ ${scanData.plantName} looks healthy!`
          : `⚠️ Detected: ${scanData.condition} on ${scanData.plantName}`,
        { duration: 6000 }
      );
    },
    onError: (err: unknown) => {
      hideLoader();
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'AI scan failed. Please try again.';
      
      console.error('[CropScanner] ❌ AI Scan failed:', {
        error: msg,
        fullError: err
      });
      
      toast.error(msg, { duration: 5000 });
      setPreview(null);
    },
  });

  // ── Dropzone ──────────────────────────────────────────────────────────────
  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      setFileError(null);
      setResult(null);

      if (rejected.length > 0) {
        const code = rejected[0]?.errors?.[0]?.code as string | undefined;
        setFileError(
          code === 'file-too-large'
            ? 'Image exceeds 5 MB. Please compress or resize.'
            : code === 'file-invalid-type'
              ? 'Only JPEG, PNG and WebP images are accepted.'
              : 'Invalid file. Please try again.'
        );
        return;
      }

      const file = accepted[0];
      if (!file) return;

      // Show preview immediately
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      scan(file);
    },
    [scan]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: MAX_SIZE,
    disabled: isScanning,
  });

  const handleReset = () => {
    setPreview(null);
    setResult(null);
    setFileError(null);
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all select-none ${isScanning
                  ? 'cursor-not-allowed border-emerald-300 bg-slate-50'
                  : isDragActive
                    ? 'border-emerald-500 bg-emerald-50 scale-[1.01]'
                    : fileError
                      ? 'border-red-300 bg-red-50'
                      : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50'
                }`}
            >
              <input {...getInputProps()} />

              {preview ? (
                /* Image preview with scanning overlay */
                <div className="relative mx-auto max-w-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Crop preview"
                    className="mx-auto max-h-52 w-full rounded-xl object-cover shadow-md"
                  />
                  {isScanning && <ScanningOverlay />}
                </div>
              ) : (
                /* Empty state */
                <div className="space-y-3">
                  <motion.div
                    animate={isDragActive ? { scale: 1.12 } : { scale: 1 }}
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100"
                  >
                    {isScanning ? (
                      <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
                    ) : (
                      <Upload className="h-7 w-7 text-emerald-600" />
                    )}
                  </motion.div>

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      {isDragActive ? 'Drop the image here' : 'Drop crop photo or click to browse'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      JPEG · PNG · WebP &nbsp;·&nbsp; Max 5 MB
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <ScanLine className="h-3 w-3" /> Gemini Vision AI
                    </span>
                    <span className="flex items-center gap-1">
                      <Sprout className="h-3 w-3" /> Identifies plant & disease
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Validation error */}
            <AnimatePresence>
              {fileError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-2 flex items-center gap-1.5 text-xs text-red-500"
                >
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {fileError}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* DiagnosisCard — shown after successful scan */
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <DiagnosisCard result={result} preview={preview} onReset={handleReset} />

            {/* Rescan button */}
            <button
              onClick={handleReset}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-emerald-700 transition-colors shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Scan Another Image
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
