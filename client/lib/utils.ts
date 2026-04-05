import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);

export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(new Date(date));

export const formatRelativeTime = (date: string | Date): string => {
  const diff = Date.now() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
};

export const getHealthColor = (score: string) => {
  const map: Record<string, string> = {
    excellent: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    good: 'text-emerald-500 bg-emerald-50 border-emerald-200',
    fair: 'text-amber-600 bg-amber-50 border-amber-200',
    poor: 'text-orange-600 bg-orange-50 border-orange-200',
    critical: 'text-red-600 bg-red-50 border-red-200',
  };
  return map[score] || 'text-slate-600 bg-slate-50 border-slate-200';
};

export const getSeverityColor = (severity: string) => {
  const map: Record<string, { badge: string; dot: string }> = {
    healthy: { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    mild: { badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
    moderate: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
    severe: { badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
    critical: { badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  };
  return map[severity] || { badge: 'bg-slate-100 text-slate-700', dot: 'bg-slate-500' };
};

export const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    growing: 'bg-emerald-100 text-emerald-700',
    ready_to_harvest: 'bg-amber-100 text-amber-700',
    harvested: 'bg-slate-100 text-slate-700',
    diseased: 'bg-red-100 text-red-700',
    dormant: 'bg-blue-100 text-blue-700',
    available: 'bg-emerald-100 text-emerald-700',
    low_stock: 'bg-amber-100 text-amber-700',
    out_of_stock: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-emerald-100 text-emerald-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return map[status] || 'bg-slate-100 text-slate-700';
};

export const truncate = (str: string, maxLength: number): string =>
  str.length <= maxLength ? str : `${str.slice(0, maxLength - 3)}...`;

export const resolveUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${baseUrl}/${cleanPath}`;
};
