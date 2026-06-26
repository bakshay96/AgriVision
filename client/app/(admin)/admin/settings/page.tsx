'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Server, Database, Clock, Layers, Users, ShoppingCart,
  Package, GitMerge, CheckCircle, AlertCircle, RefreshCw,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const API = process.env.NEXT_PUBLIC_API_URL;

async function fetchHealth(token: string) {
  const res = await fetch(`${API}/admin/health`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

function InfoRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 dark:border-slate-800">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <span className={cn('text-xs font-medium text-slate-700 dark:text-slate-300', mono && 'font-mono')}>
        {value}
      </span>
    </div>
  );
}

const APP_INFO = {
  name: 'AgriVision Pro',
  version: '2.0.0',
  stack: 'Next.js 14 + Express + MongoDB',
  nodejsVersion: typeof process !== 'undefined' ? process.version : 'N/A',
};

export default function AdminSettingsPage() {
  const { token } = useAppStore();

  const { data: health, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-health'],
    queryFn: () => fetchHealth(token!),
    enabled: !!token,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const dbOnline = health?.database?.status === 'connected';
  const uptimeDays = health?.uptime ? Math.floor(health.uptime / 86400) : 0;
  const uptimeHours = health?.uptime ? Math.floor((health.uptime % 86400) / 3600) : 0;
  const uptimeMins = health?.uptime ? Math.floor((health.uptime % 3600) / 60) : 0;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Settings & System</h1>
          <p className="text-sm text-slate-500 mt-0.5">Platform configuration and health monitoring</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors disabled:opacity-60"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* App Info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white">
            <Layers className="h-4 w-4 text-indigo-500" />
            Application Info
          </h3>
          <InfoRow label="Application" value={APP_INFO.name} />
          <InfoRow label="Version" value={APP_INFO.version} mono />
          <InfoRow label="Stack" value={APP_INFO.stack} />
          <InfoRow label="Environment" value={
            <span className={cn(
              'rounded-full px-2 py-0.5 text-xs font-semibold',
              health?.environment === 'production'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/25'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            )}>
              {health?.environment || 'N/A'}
            </span>
          } />
          <InfoRow label="Server Time" value={health?.timestamp ? format(new Date(health.timestamp), 'PPpp') : '—'} />
          <InfoRow label="Uptime" value={`${uptimeDays}d ${uptimeHours}h ${uptimeMins}m`} mono />
        </motion.div>

        {/* Database Health */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white">
            <Database className="h-4 w-4 text-blue-500" />
            Database Health
          </h3>

          <div className="mb-4 flex items-center gap-3 rounded-xl border p-3 dark:border-slate-700"
            style={{ borderColor: dbOnline ? '#6366f1' : '#ef4444' }}>
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
            ) : dbOnline ? (
              <CheckCircle className="h-5 w-5 text-indigo-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">
                MongoDB {dbOnline ? 'Connected' : 'Disconnected'}
              </p>
              <p className="text-xs text-slate-400">Status: {health?.database?.status || '—'}</p>
            </div>
          </div>

          <div className="space-y-0">
            {[
              { label: 'Users', value: health?.database?.collections?.users, icon: Users },
              { label: 'Orders', value: health?.database?.collections?.orders, icon: ShoppingCart },
              { label: 'Inventory', value: health?.database?.collections?.inventory, icon: Package },
              { label: 'Negotiations', value: health?.database?.collections?.negotiations, icon: GitMerge },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{label} collection</span>
                </div>
                <span className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                  {isLoading ? '—' : value?.toLocaleString() ?? 0}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* API & Rate Limit Config */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white">
            <Server className="h-4 w-4 text-violet-500" />
            API Configuration
          </h3>
          <InfoRow label="API Base URL" value={process.env.NEXT_PUBLIC_API_URL || '—'} mono />
          <InfoRow label="Rate Limit Window" value="15 minutes" />
          <InfoRow label="Rate Limit Max" value="100 req/window" />
          <InfoRow label="Max Upload Size" value="10 MB" />
          <InfoRow label="JWT Expiry" value="7 days" mono />
          <InfoRow label="Password Hash Rounds" value="12" mono />
        </motion.div>

        {/* System Timer */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white">
            <Clock className="h-4 w-4 text-amber-500" />
            Cache & Performance
          </h3>
          <InfoRow label="Market Price Cache TTL" value="10 minutes" />
          <InfoRow label="Query Stale Time (Admin)" value="30–60 seconds" />
          <InfoRow label="Notification Batch" value="insertMany (bulk)" />
          <InfoRow label="Aggregation Strategy" value="$facet pipeline" />
          <InfoRow label="Pagination Default" value="20 items/page" />
          <InfoRow label="Max page size" value="100 items" />
        </motion.div>
      </div>
    </div>
  );
}
