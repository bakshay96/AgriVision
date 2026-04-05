'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton h-4 w-full', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function SkeletonCropCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

export function SkeletonInventoryCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-28" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 border-b border-slate-100 py-3 px-4">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-4 w-24 ml-auto" />
    </div>
  );
}

export function SkeletonAnalysisCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-20 w-20 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}
