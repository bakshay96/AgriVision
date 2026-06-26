'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Send, Bell, Users, Tractor, ShoppingBag, Loader2, CheckCircle, Clock } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const API = process.env.NEXT_PUBLIC_API_URL;
function headers(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

const NOTIF_TYPES = [
  { value: 'SYSTEM', label: 'System', color: 'text-slate-600' },
  { value: 'ORDER_STATUS_UPDATE', label: 'Order Update', color: 'text-blue-600' },
  { value: 'LOW_STOCK', label: 'Low Stock', color: 'text-amber-600' },
  { value: 'NEW_ORDER', label: 'New Order', color: 'text-emerald-600' },
  { value: 'AI_ANALYSIS_COMPLETE', label: 'AI Analysis', color: 'text-purple-600' },
];

const TARGET_OPTIONS = [
  { value: '', label: 'All Users', icon: Users },
  { value: 'FARMER', label: 'Farmers Only', icon: Tractor },
  { value: 'BUYER', label: 'Buyers Only', icon: ShoppingBag },
];

async function broadcastNotif(token: string, body: Record<string, string>) {
  const res = await fetch(`${API}/admin/notifications`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
}

async function fetchNotifs(token: string, page: number) {
  const res = await fetch(`${API}/admin/notifications?page=${page}&limit=20`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
}

export default function AdminNotificationsPage() {
  const { token } = useAppStore();
  const qc = useQueryClient();

  const [message, setMessage] = useState('');
  const [type, setType] = useState('SYSTEM');
  const [targetRole, setTargetRole] = useState('');
  const [page, setPage] = useState(1);

  const { data: notifsData, isLoading } = useQuery({
    queryKey: ['admin-notifications', page],
    queryFn: () => fetchNotifs(token!, page),
    enabled: !!token,
    staleTime: 30_000,
  });

  const sendMutation = useMutation({
    mutationFn: () => broadcastNotif(token!, { message, type, targetRole }),
    onSuccess: (data) => {
      toast.success(`Sent to ${data.data.sentCount} user(s)`);
      setMessage('');
      qc.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSend = () => {
    if (!message.trim()) { toast.error('Message is required'); return; }
    sendMutation.mutate();
  };

  const notifications = notifsData?.data || [];
  const pagination = notifsData?.pagination;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Notification Center</h1>
        <p className="text-sm text-slate-500 mt-0.5">Broadcast messages to users across the platform</p>
      </div>

      {/* Compose Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
      >
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white">
          <Send className="h-4 w-4 text-indigo-500" />
          Compose Broadcast
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Target */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">Target Audience</label>
            <div className="flex gap-2">
              {TARGET_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTargetRole(value)}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-medium transition-all',
                    targetRole === value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">Notification Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {NOTIF_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Message */}
        <div className="mt-4">
          <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Type your notification message here…"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-600 resize-none"
          />
          <p className="mt-1 text-right text-xs text-slate-400">{message.length}/500</p>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSend}
            disabled={sendMutation.isPending || !message.trim()}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send Broadcast
          </button>
        </div>
      </motion.div>

      {/* History */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white">
          <Bell className="h-4 w-4 text-slate-400" />
          Broadcast History
        </h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">User</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Type</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Message</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-slate-400">No notifications sent yet</td>
                </tr>
              ) : (
                notifications.map((n: {
                  _id: string;
                  userId?: { name: string; email: string } | string;
                  type: string;
                  message: string;
                  isRead: boolean;
                  createdAt: string;
                }) => (
                  <tr key={n._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                      {typeof n.userId === 'object' ? n.userId?.name : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {n.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="truncate text-xs text-slate-700 dark:text-slate-300">{n.message}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'flex items-center gap-1 text-xs font-medium',
                        n.isRead ? 'text-slate-400' : 'text-indigo-600 dark:text-indigo-400'
                      )}>
                        {n.isRead
                          ? <CheckCircle className="h-3 w-3" />
                          : <Clock className="h-3 w-3" />}
                        {n.isRead ? 'Read' : 'Unread'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {format(new Date(n.createdAt), 'MMM d, yyyy HH:mm')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-3 flex justify-end gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 disabled:opacity-30 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
              Previous
            </button>
            <span className="flex items-center text-xs text-slate-400">Page {page} of {pagination.totalPages}</span>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 disabled:opacity-30 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
