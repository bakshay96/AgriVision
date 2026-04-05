'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Microscope, Loader2, CheckCircle, X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import toast from 'react-hot-toast';
import { getSeverityColor } from '@/lib/utils';

export default function AICropScan() {
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const { setIsAnalyzing, isAnalyzing } = useAppStore();
  const qc = useQueryClient();

  const { mutate: analyze } = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return aiApi.analyzeImage(formData);
    },
    onMutate: () => setIsAnalyzing(true),
    onSuccess: (res) => {
      // API returns { data: { scan: {...}, analysisId: '...' } }
      const scanData = res.data.data.scan;
      setResult(scanData);
      qc.invalidateQueries({ queryKey: ['ai', 'analyses'] });
      toast.success(`AI analysis complete! Detected: ${scanData.plantName || 'Unknown Plant'}`);
    },
    onError: () => toast.error('Analysis failed. Please try again.'),
    onSettled: () => setIsAnalyzing(false),
  });

  const onDrop = useCallback(
    (files: File[]) => {
      const file = files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
      setResult(null);
      analyze(file);
    },
    [analyze]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const clearScan = () => {
    setPreview(null);
    setResult(null);
  };

  // Result now contains scan data directly: plantName, condition, severity, etc.
  const severity = String(result?.severity || '');
  const severityColors = getSeverityColor(severity);
  const plantName = String(result?.plantName || 'Unknown Plant');
  const condition = String(result?.condition || 'Unknown');
  const confidenceScore = Number(result?.confidenceScore || 0);
  const affectedArea = String(result?.affectedArea || 'N/A');
  const description = String(result?.description || '');
  const recommendedTreatment = String(result?.recommendedTreatment || '');

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600">
            <Microscope className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">AI Crop Scan</p>
            <p className="text-xs text-slate-400">Powered by Gemini Vision</p>
          </div>
        </div>
        {(preview || result) && (
          <button onClick={clearScan} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={`relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
            isDragActive
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50'
          }`}
        >
          <input {...getInputProps()} />
          {preview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Crop scan preview"
                className="mx-auto max-h-40 rounded-lg object-cover"
              />
              {isAnalyzing && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                <Upload className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-slate-700">
                {isDragActive ? 'Drop your crop image' : 'Upload crop image'}
              </p>
              <p className="text-xs text-slate-400">JPG, PNG, WebP · max 10MB</p>
            </div>
          )}
        </div>

        {/* AI Result */}
        <AnimatePresence>
          {result && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
            >
              {/* Plant Name Header */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                  <span className="text-xs">🌱</span>
                </div>
                <p className="text-sm font-bold text-emerald-700">{plantName}</p>
              </div>

              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <p className="text-sm font-semibold text-slate-900">
                      {condition}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {confidenceScore}% confidence · {affectedArea}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${severityColors.badge}`}>
                  {severity}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {description.slice(0, 150)}...
              </p>

              {/* Treatment */}
              {recommendedTreatment && (
                <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                  <p className="text-xs font-medium text-slate-700">
                    Treatment:{' '}
                    <span className="text-amber-600">
                      {recommendedTreatment.slice(0, 60)}...
                    </span>
                  </p>
                </div>
              )}

              <a
                href="/health-monitor"
                className="block w-full rounded-lg bg-emerald-600 py-2 text-center text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                View Full Analysis →
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        {isAnalyzing && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            <p className="text-xs text-emerald-700">Analyzing with Gemini Vision AI...</p>
          </div>
        )}
      </div>
    </div>
  );
}
