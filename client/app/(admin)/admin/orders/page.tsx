'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { ShoppingCart, TrendingUp, Package, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import StatsCard from '@/components/admin/StatsCard';
import { format } from 'date-fns';

const API = process.env.NEXT_PUBLIC_API_URL;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', confirmed: '#3b82f6', processing: '#8b5cf6',
  delivered: '#10b981', cancelled: '#ef4444', shipped: '#06b6d4',
  deal_confirmed: '#0ea5e9', in_transit: '#f97316',
};
const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#a78bfa'];

function formatMonth(y: number, m: number) {
  return `${MONTH_NAMES[m - 1]} '${String(y).slice(2)}`;
}
function formatCurrency(v: number) {
  if (v >= 1_000_000) return `₹${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `₹${(v / 1_000).toFixed(1)}K`;
  return `₹${v.toFixed(0)}`;
}

async function fetchOrderAnalytics(token: string) {
  const res = await fetch(`${API}/admin/orders/analytics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export default function AdminOrdersPage() {
  const { token } = useAppStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-orders-analytics'],
    queryFn: () => fetchOrderAnalytics(token!),
    enabled: !!token,
    staleTime: 60_000,
  });

  const revenueChartData = (data?.monthlyRevenue || []).map(
    (e: { _id: { year: number; month: number }; revenue: number; count: number }) => ({
      month: formatMonth(e._id.year, e._id.month),
      revenue: Number(e.revenue.toFixed(2)),
      orders: e.count,
    })
  );

  const statusPieData = (data?.byStatus || []).map(
    (e: { _id: string; count: number }) => ({ name: e._id, value: e.count })
  );

  const topCrops = data?.topCrops || [];
  const recentOrders = data?.recentOrders || [];

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-red-500 text-sm">Failed to load order analytics.</p>
      </div>
    );
  }

  const totalOrders = statusPieData.reduce((a: number, b: { value: number }) => a + b.value, 0);
  const deliveredCount = statusPieData.find((s: { name: string }) => s.name === 'delivered')?.value || 0;
  const pendingCount = statusPieData.find((s: { name: string }) => s.name === 'pending')?.value || 0;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Order Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">Order performance and revenue insights</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatsCard
          title="Total Orders" value={isLoading ? '—' : totalOrders}
          icon={ShoppingCart} delay={0}
        />
        <StatsCard
          title="Total Revenue" value={isLoading ? '—' : formatCurrency(data?.totalRevenue || 0)}
          icon={TrendingUp} iconColor="text-indigo-600" iconBg="bg-indigo-50 dark:bg-indigo-900/30" delay={0.05}
        />
        <StatsCard
          title="Delivered" value={isLoading ? '—' : deliveredCount}
          icon={CheckCircle} iconColor="text-green-600" iconBg="bg-green-50 dark:bg-green-900/30" delay={0.1}
        />
        <StatsCard
          title="Pending" value={isLoading ? '—' : pendingCount}
          icon={Package} iconColor="text-amber-600" iconBg="bg-amber-50 dark:bg-amber-900/30" delay={0.15}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="col-span-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">Revenue & Orders (6 Months)</h3>
          {isLoading ? (
            <div className="h-48 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          ) : revenueChartData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">No revenue data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis yAxisId="l" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={formatCurrency} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '11px' }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any, n: any) => {
                    if (typeof v !== 'number') return [String(v ?? ''), n];
                    return n === 'revenue' ? [formatCurrency(v), 'Revenue'] : [v, 'Orders'];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line yAxisId="l" type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="revenue" />
                <Line yAxisId="r" type="monotone" dataKey="orders" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} name="orders" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Status Pie */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">Order Status</h3>
          {isLoading ? (
            <div className="h-48 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusPieData} cx="50%" cy="45%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value">
                  {statusPieData.map((e: { name: string }, i: number) => (
                    <Cell key={e.name} fill={STATUS_COLORS[e.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Top Crops + Recent Orders */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Crops */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">Top Crops by Revenue</h3>
          {isLoading ? (
            <div className="h-48 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          ) : topCrops.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">No crop data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topCrops} layout="vertical" barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={formatCurrency} />
                <YAxis type="category" dataKey="_id" tick={{ fontSize: 10, fill: '#94a3b8' }} width={70} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '11px' }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => [typeof v === 'number' ? formatCurrency(v) : String(v ?? ''), 'Revenue']}
                />
                <Bar dataKey="totalRevenue" fill="#818cf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">Recent Orders</h3>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">No orders yet</div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-52">
              {recentOrders.map((o: {
                _id: string;
                orderNumber: string;
                totalAmount: number;
                status: string;
                createdAt: string;
                buyer?: { name: string };
                farmer?: { name: string };
              }) => (
                <div key={o._id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 dark:text-white truncate">{o.orderNumber}</p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {o.buyer?.name || '—'} → {o.farmer?.name || '—'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(o.totalAmount)}</p>
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{ background: `${STATUS_COLORS[o.status]}22`, color: STATUS_COLORS[o.status] }}
                    >
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
