'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Activity, MapPin, Clock, LogIn, UserX } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const API = process.env.NEXT_PUBLIC_API_URL;
const ROLE_COLORS: Record<string, string> = {
  FARMER: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  BUYER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

async function fetchActivity(token: string) {
  const res = await fetch(`${API}/admin/activity`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export default function AdminActivityPage() {
  const { token } = useAppStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-activity'],
    queryFn: () => fetchActivity(token!),
    enabled: !!token,
    staleTime: 60_000,
  });

  const stateChartData = (data?.stateActivity || []).slice(0, 12).map(
    (s: { _id: string; total: number; active: number }) => ({
      state: s._id.length > 10 ? s._id.slice(0, 10) + '…' : s._id,
      total: s.total,
      active: s.active,
    })
  );

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-red-500 text-sm">Failed to load activity data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">User Activity</h1>
        <p className="text-sm text-slate-500 mt-0.5">Recent logins and geographic distribution</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center gap-2 mb-1">
            <LogIn className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active (30d)</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {isLoading ? '—' : data?.recentLogins?.length ?? 0}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center gap-2 mb-1">
            <UserX className="h-4 w-4 text-red-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Never Logged In</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {isLoading ? '—' : data?.neverLoggedIn ?? 0}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">States Covered</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {isLoading ? '—' : data?.stateActivity?.length ?? 0}
          </p>
        </motion.div>
      </div>

      {/* State Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      >
        <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">Users by State (Active vs Total)</h3>
        {isLoading ? (
          <div className="h-48 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        ) : stateChartData.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-slate-400">No state data</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stateChartData} barGap={2} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="state" tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '11px' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="total" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Total" />
              <Bar dataKey="active" fill="#10b981" radius={[4, 4, 0, 0]} name="Active" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Recent Logins Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
      >
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 px-4 py-3">
          <Activity className="h-4 w-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Recent Logins (Last 30 Days)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">User</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Role</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">State</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Last Login</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (data?.recentLogins || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-slate-400">No recent activity</td>
                </tr>
              ) : (
                (data.recentLogins as {
                  _id: string; name: string; email: string; role: string;
                  state?: string; lastLogin: string; isActive: boolean;
                }[]).map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-[10px] font-bold flex-shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-slate-800 dark:text-white">{u.name}</p>
                          <p className="truncate text-[10px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-600')}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {u.state || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-xs text-slate-700 dark:text-slate-300">{format(new Date(u.lastLogin), 'MMM d, yyyy HH:mm')}</p>
                        <p className="text-[10px] text-slate-400">{formatDistanceToNow(new Date(u.lastLogin), { addSuffix: true })}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'flex items-center gap-1 text-xs font-medium',
                        u.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                      )}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', u.isActive ? 'bg-emerald-500' : 'bg-red-500')} />
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
