'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, Tractor, ShoppingBag, ShoppingCart,
  TrendingUp, Bell, MessageSquare, Package,
  BarChart3, Activity,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import StatsCard from '@/components/admin/StatsCard';
import { useAppStore } from '@/store/useAppStore';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', confirmed: '#3b82f6', processing: '#8b5cf6',
  delivered: '#10b981', cancelled: '#ef4444', shipped: '#06b6d4',
  deal_confirmed: '#0ea5e9', in_transit: '#f97316', negotiating: '#a78bfa',
};

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

function formatMonth(year: number, month: number) {
  return `${MONTH_NAMES[month - 1]} ${String(year).slice(2)}`;
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

export default function AdminDashboardPage() {
  const { token } = useAppStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => fetchStats(token!),
    enabled: !!token,
    staleTime: 60_000,
  });

  // Build monthly signups chart data
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

  // Revenue chart data
  const revenueChartData = (data?.orders?.monthlyRevenue || []).map(
    (e: { _id: { year: number; month: number }; revenue: number; count: number }) => ({
      month: formatMonth(e._id.year, e._id.month),
      revenue: Number(e.revenue.toFixed(2)),
      orders: e.count,
    })
  );

  // Order status pie data
  const pieData = (data?.orders?.byStatus || []).map(
    (e: { _id: string; count: number }) => ({ name: e._id, value: e.count })
  );

  const stats = data?.users;
  const orders = data?.orders;

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-red-500 text-sm">Failed to load dashboard stats. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
        <p className="mt-0.5 text-sm text-slate-500">Platform health at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <StatsCard
          title="Total Users" value={isLoading ? '—' : stats?.total ?? 0}
          icon={Users} delay={0}
          subtitle={`${stats?.newThisMonth ?? 0} new this month`}
        />
        <StatsCard
          title="Farmers" value={isLoading ? '—' : stats?.farmers ?? 0}
          icon={Tractor} iconColor="text-green-600" iconBg="bg-green-50 dark:bg-green-900/30" delay={0.05}
        />
        <StatsCard
          title="Buyers" value={isLoading ? '—' : stats?.buyers ?? 0}
          icon={ShoppingBag} iconColor="text-blue-600" iconBg="bg-blue-50 dark:bg-blue-900/30" delay={0.1}
        />
        <StatsCard
          title="Total Orders" value={isLoading ? '—' : orders?.total ?? 0}
          icon={ShoppingCart} iconColor="text-violet-600" iconBg="bg-violet-50 dark:bg-violet-900/30" delay={0.15}
          subtitle={`${orders?.newThisMonth ?? 0} new this month`}
        />
        <StatsCard
          title="Revenue" value={isLoading ? '—' : formatCurrency(orders?.totalRevenue ?? 0)}
          icon={TrendingUp} iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-900/30" delay={0.2}
        />
        <StatsCard
          title="Active Listings" value={isLoading ? '—' : data?.inventory?.totalListings ?? 0}
          icon={Package} iconColor="text-orange-500" iconBg="bg-orange-50 dark:bg-orange-900/30" delay={0.25}
        />
        <StatsCard
          title="Notifications" value={isLoading ? '—' : data?.platform?.notificationCount ?? 0}
          icon={Bell} iconColor="text-amber-600" iconBg="bg-amber-50 dark:bg-amber-900/30" delay={0.3}
        />
        <StatsCard
          title="Feedback" value={isLoading ? '—' : data?.platform?.feedbackCount ?? 0}
          icon={MessageSquare} iconColor="text-pink-600" iconBg="bg-pink-50 dark:bg-pink-900/30" delay={0.35}
        />
        <StatsCard
          title="Active Users" value={isLoading ? '—' : stats?.active ?? 0}
          icon={Activity} iconColor="text-teal-600" iconBg="bg-teal-50 dark:bg-teal-900/30" delay={0.4}
          subtitle={`${stats?.inactive ?? 0} inactive`}
        />
        <StatsCard
          title="Featured" value={isLoading ? '—' : data?.inventory?.featuredListings ?? 0}
          icon={BarChart3} iconColor="text-indigo-600" iconBg="bg-indigo-50 dark:bg-indigo-900/30" delay={0.45}
          subtitle="Featured listings"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Monthly Signups */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">Monthly Signups by Role</h3>
          {isLoading ? (
            <div className="h-48 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          ) : signupChartData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={signupChartData} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '11px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="FARMER" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="BUYER" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ADMIN" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Revenue Trend */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">Revenue & Orders Trend</h3>
          {isLoading ? (
            <div className="h-48 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          ) : revenueChartData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v: number) => formatCurrency(v)} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '11px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => {
                    if (typeof value !== 'number') return [String(value ?? ''), name];
                    return name === 'revenue' ? [formatCurrency(value), 'Revenue'] : [value, 'Orders'];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} name="revenue" />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#a855f7" strokeWidth={2} dot={false} name="orders" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Order Status Pie */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">Order Status</h3>
          {isLoading ? (
            <div className="h-48 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          ) : pieData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">No orders yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value">
                  {pieData.map((entry: { name: string }, index: number) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Top States */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="col-span-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">Users by State (Top 10)</h3>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-6 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              ))}
            </div>
          ) : (data?.users?.byState || []).length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">No state data</div>
          ) : (
            <div className="space-y-2">
              {(data.users.byState as { _id: string; count: number }[]).map((s, i) => {
                const pct = stats?.total ? Math.round((s.count / stats.total) * 100) : 0;
                return (
                  <div key={s._id} className="flex items-center gap-3">
                    <span className="w-24 truncate text-xs text-slate-600 dark:text-slate-400">{s._id}</span>
                    <div className="flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.7 + i * 0.05, duration: 0.5 }}
                        className="h-2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                      />
                    </div>
                    <span className="w-12 text-right text-xs font-medium text-slate-600 dark:text-slate-400">
                      {s.count} <span className="text-slate-400">({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
