'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Tractor, ShoppingBag, ShoppingCart,
  TrendingUp, Bell, MessageSquare, Package,
  BarChart3, Activity, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', confirmed: '#3b82f6', processing: '#8b5cf6',
  delivered: '#10b981', cancelled: '#ef4444', shipped: '#06b6d4',
  deal_confirmed: '#0ea5e9', in_transit: '#f97316', negotiating: '#a78bfa',
};
const PIE_COLORS = ['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316'];

function formatMonth(year: number, month: number) {
  return `${MONTH_NAMES[month - 1]} '${String(year).slice(2)}`;
}
function formatCurrency(v: number) {
  if (v >= 1_000_000) return `₹${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `₹${(v / 1_000).toFixed(1)}K`;
  return `₹${v.toFixed(0)}`;
}

async function fetchStats(token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

// ─── Compact KPI row item ─────────────────────────────────────────────────────
function KpiItem({
  icon: Icon, label, value, sub, iconColor, delay,
}: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  iconColor: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className={cn('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg', iconColor)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
        <p className="text-base font-bold tabular-nums text-slate-900 dark:text-white leading-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {sub && <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ─── Chart Tab UI ─────────────────────────────────────────────────────────────
const CHART_TABS = ['Signups', 'Revenue', 'Orders'] as const;
type ChartTab = typeof CHART_TABS[number];

export default function AdminDashboardPage() {
  const { token } = useAppStore();
  const [chartTab, setChartTab] = useState<ChartTab>('Signups');
  const [showStates, setShowStates] = useState(false);
  const [isChartsCollapsed, setIsChartsCollapsed] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => fetchStats(token!),
    enabled: !!token,
    staleTime: 60_000,
  });

  // ── Derived chart data ────────────────────────────────────────────────────
  const signupChartData = (() => {
    if (!data?.users?.monthlySignups) return [];
    const map: Record<string, { month: string; FARMER: number; BUYER: number; ADMIN: number }> = {};
    data.users.monthlySignups.forEach((e: { _id: { year: number; month: number; role: string }; count: number }) => {
      const key = `${e._id.year}-${e._id.month}`;
      if (!map[key]) map[key] = { month: formatMonth(e._id.year, e._id.month), FARMER: 0, BUYER: 0, ADMIN: 0 };
      map[key][e._id.role as 'FARMER' | 'BUYER' | 'ADMIN'] = e.count;
    });
    return Object.values(map);
  })();

  const revenueChartData = (data?.orders?.monthlyRevenue || []).map(
    (e: { _id: { year: number; month: number }; revenue: number; count: number }) => ({
      month: formatMonth(e._id.year, e._id.month),
      revenue: Number(e.revenue.toFixed(2)),
      orders: e.count,
    })
  );

  const pieData = (data?.orders?.byStatus || []).map(
    (e: { _id: string; count: number }) => ({ name: e._id, value: e.count })
  );

  const s = data?.users;
  const o = data?.orders;

  const kpis = [
    { icon: Users, label: 'Total Users', value: isLoading ? '—' : s?.total ?? 0, sub: `+${s?.newThisMonth ?? 0} this month`, iconColor: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', delay: 0 },
    { icon: Tractor, label: 'Farmers', value: isLoading ? '—' : s?.farmers ?? 0, iconColor: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400', delay: 0.04 },
    { icon: ShoppingBag, label: 'Buyers', value: isLoading ? '—' : s?.buyers ?? 0, iconColor: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', delay: 0.08 },
    { icon: Activity, label: 'Active', value: isLoading ? '—' : s?.active ?? 0, sub: `${s?.inactive ?? 0} inactive`, iconColor: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400', delay: 0.12 },
    { icon: ShoppingCart, label: 'Orders', value: isLoading ? '—' : o?.total ?? 0, sub: `+${o?.newThisMonth ?? 0} this month`, iconColor: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400', delay: 0.16 },
    { icon: TrendingUp, label: 'Revenue', value: isLoading ? '—' : formatCurrency(o?.totalRevenue ?? 0), iconColor: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', delay: 0.2 },
    { icon: Package, label: 'Listings', value: isLoading ? '—' : data?.inventory?.totalListings ?? 0, sub: `${data?.inventory?.featuredListings ?? 0} featured`, iconColor: 'bg-orange-100 text-orange-500 dark:bg-orange-900/30 dark:text-orange-400', delay: 0.24 },
    { icon: Bell, label: 'Notifs', value: isLoading ? '—' : data?.platform?.notificationCount ?? 0, iconColor: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', delay: 0.28 },
    { icon: MessageSquare, label: 'Feedback', value: isLoading ? '—' : data?.platform?.feedbackCount ?? 0, iconColor: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400', delay: 0.32 },
    { icon: BarChart3, label: 'Featured', value: isLoading ? '—' : data?.inventory?.featuredListings ?? 0, iconColor: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400', delay: 0.36 },
  ];

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-red-500 text-sm">Failed to load dashboard stats. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* ── Page header ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
        <p className="mt-0.5 text-sm text-slate-500">Platform health at a glance</p>
      </div>

      {/* ── Compact KPI grid (2 rows of 5 on desktop, 2-col on mobile) ─── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-10">
        {kpis.map((k) => (
          <KpiItem key={k.label} {...k} />
        ))}
      </div>

      {/* ── Tabbed Charts ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-4 pt-3 gap-1">
          {CHART_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setChartTab(tab)}
              className={cn(
                'px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all',
                chartTab === tab
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-900/10'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              )}
            >
              {tab === 'Signups' && '👤 '}
              {tab === 'Revenue' && '💰 '}
              {tab === 'Orders' && '📦 '}
              {tab}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 pb-2">
            <span className="text-xs text-slate-400">Last 6 months</span>
            <button
              onClick={() => setIsChartsCollapsed(prev => !prev)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-805 dark:text-slate-500 transition-colors"
              title={isChartsCollapsed ? 'Expand Charts' : 'Collapse Charts'}
            >
              {isChartsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Chart panels */}
        <AnimatePresence initial={false}>
          {!isChartsCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                {isLoading ? (
                  <div className="h-52 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                ) : (
                  <>
                    {chartTab === 'Signups' && (
                      signupChartData.length === 0 ? (
                        <EmptyChart label="No signup data yet" />
                      ) : (
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={signupChartData} barSize={10}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                            <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', fontSize: '11px' }} labelStyle={{ color: '#e2e8f0' }} />
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                            <Bar dataKey="FARMER" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="BUYER" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="ADMIN" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )
                    )}
                    {chartTab === 'Revenue' && (
                      revenueChartData.length === 0 ? (
                        <EmptyChart label="No revenue data yet" />
                      ) : (
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart data={revenueChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v: number) => formatCurrency(v)} />
                            <Tooltip
                              contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', fontSize: '11px' }}
                              labelStyle={{ color: '#e2e8f0' }}
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              formatter={(value: any, name: any) => {
                                if (typeof value !== 'number') return [String(value ?? ''), name];
                                return [formatCurrency(value), 'Revenue'];
                              }}
                            />
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                            <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      )
                    )}
                    {chartTab === 'Orders' && (
                      pieData.length === 0 ? (
                        <EmptyChart label="No order data yet" />
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                                {pieData.map((entry: { name: string }, index: number) => (
                                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', fontSize: '11px' }} />
                              <Legend wrapperStyle={{ fontSize: '10px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex flex-col justify-center gap-2 py-2">
                            {pieData.map((entry: { name: string; value: number }, index: number) => (
                              <div key={entry.name} className="flex items-center gap-2">
                                <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: STATUS_COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length] }} />
                                <span className="flex-1 text-xs capitalize text-slate-600 dark:text-slate-400">{entry.name.replace(/_/g, ' ')}</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-white">{entry.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Users by State ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <button
          onClick={() => setShowStates(s => !s)}
          className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-bold text-slate-800 dark:text-white"
        >
          <span>🗺️ Users by State (Top 10)</span>
          {showStates ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>
        {showStates && (
          <div className="border-t border-slate-100 dark:border-slate-800 px-5 pb-5 pt-4 space-y-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-5 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              ))
            ) : (data?.users?.byState || []).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No state data available</p>
            ) : (
              (data.users.byState as { _id: string; count: number }[]).map((st, i) => {
                const pct = s?.total ? Math.round((st.count / s.total) * 100) : 0;
                return (
                  <div key={st._id} className="flex items-center gap-3">
                    <span className="w-28 truncate text-xs text-slate-600 dark:text-slate-400">{st._id}</span>
                    <div className="flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.1 + i * 0.04, duration: 0.5 }}
                        className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                      />
                    </div>
                    <span className="w-16 text-right text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {st.count} <span className="text-slate-400">({pct}%)</span>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-52 items-center justify-center text-sm text-slate-400">{label}</div>
  );
}
