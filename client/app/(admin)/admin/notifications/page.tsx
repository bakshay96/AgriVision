'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Send, Bell, Users, Tractor, ShoppingBag, Loader2,
  CheckCircle, Clock, User, Search, X, AlertCircle,
  History, Filter,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const API = process.env.NEXT_PUBLIC_API_URL;
function hdrs(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

const NOTIF_TYPES = [
  { value: 'SYSTEM', label: '📢 System Alert' },
  { value: 'ORDER_STATUS_UPDATE', label: '📦 Order Update' },
  { value: 'LOW_STOCK', label: '⚠️ Low Stock Warning' },
  { value: 'NEW_ORDER', label: '🛒 New Order Announcement' },
  { value: 'AI_ANALYSIS_COMPLETE', label: '🤖 AI Analysis Report' },
];

const TARGET_OPTIONS = [
  { value: '', label: 'All Users', icon: Users },
  { value: 'FARMER', label: 'Farmers Only', icon: Tractor },
  { value: 'BUYER', label: 'Buyers Only', icon: ShoppingBag },
  { value: 'SPECIFIC', label: 'Specific Users', icon: User },
];

const TYPE_STYLES: Record<string, string> = {
  SYSTEM: 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/40',
  NEW_ORDER: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/40',
  ORDER_STATUS_UPDATE: 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/40',
  LOW_STOCK: 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-800/40',
  AI_ANALYSIS_COMPLETE: 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800/40',
};

async function broadcastNotif(token: string, body: Record<string, unknown>) {
  const res = await fetch(`${API}/admin/notifications`, {
    method: 'POST', headers: hdrs(token), body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
}

async function fetchNotifs(token: string, page: number, typeFilter: string, readFilter: string) {
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (typeFilter) params.set('type', typeFilter);
  if (readFilter !== '') params.set('isRead', readFilter);
  const res = await fetch(`${API}/admin/notifications?${params}`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
}

// ─── Compose Tab ──────────────────────────────────────────────────────────────
function ComposeTab() {
  const { token } = useAppStore();
  const qc = useQueryClient();

  const [message, setMessage] = useState('');
  const [type, setType] = useState('SYSTEM');
  const [targetRole, setTargetRole] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<{ _id: string; name: string; email: string; role?: string }[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: searchResults = [], isFetching: isSearchingUsers } = useQuery({
    queryKey: ['admin-users-search', userSearch],
    queryFn: async () => {
      if (!userSearch.trim()) return [];
      const res = await fetch(`${API}/admin/users?search=${encodeURIComponent(userSearch)}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      return data.success ? data.data : [];
    },
    enabled: !!token && targetRole === 'SPECIFIC' && userSearch.trim().length > 0,
  });

  const sendMutation = useMutation({
    mutationFn: () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> = { message: message.trim(), type };
      if (targetRole === 'SPECIFIC') {
        if (selectedUsers.length === 0) throw new Error('At least one user must be selected');
        payload.userIds = selectedUsers.map(u => u._id);
      } else {
        payload.targetRole = targetRole;
      }
      return broadcastNotif(token!, payload);
    },
    onSuccess: (data) => {
      toast.success(`✅ Notification sent to ${data.data.sentCount} user(s)`);
      setMessage(''); setSelectedUsers([]); setUserSearch('');
      qc.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSend = () => {
    if (!message.trim()) { toast.error('Message is required'); return; }
    if (targetRole === 'SPECIFIC' && selectedUsers.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }
    sendMutation.mutate();
  };

  const handleAddUser = (user: { _id: string; name: string; email: string; role?: string }) => {
    if (!selectedUsers.some(u => u._id === user._id)) {
      setSelectedUsers(prev => [...prev, user]);
    }
    setUserSearch(''); setDropdownOpen(false);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Compose card */}
      <div className="lg:col-span-2 rounded-2xl border border-amber-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-5">
          {/* Step 1 – Target */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              1 · Target Audience
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TARGET_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => { setTargetRole(value); if (value !== 'SPECIFIC') setSelectedUsers([]); }}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-bold transition-all',
                    targetRole === value
                      ? 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-400/20 dark:bg-amber-950/20 dark:text-amber-400'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Specific user picker */}
          <AnimatePresence>
            {targetRole === 'SPECIFIC' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Select Recipients
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text" value={userSearch}
                    onChange={e => { setUserSearch(e.target.value); setDropdownOpen(true); }}
                    onFocus={() => setDropdownOpen(true)}
                    placeholder="Search by name or email…"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <AnimatePresence>
                    {dropdownOpen && userSearch.trim().length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                        className="absolute z-10 mt-1 w-full max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800"
                      >
                        {isSearchingUsers ? (
                          <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-400">
                            <Loader2 className="h-4 w-4 animate-spin text-amber-500" /> Searching…
                          </div>
                        ) : searchResults.length === 0 ? (
                          <div className="py-4 text-center text-sm text-slate-400">No users found</div>
                        ) : (
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          searchResults.map((u: any) => (
                            <button key={u._id} onClick={() => handleAddUser(u)}
                              className="flex w-full flex-col px-4 py-2.5 text-left hover:bg-amber-50/40 dark:hover:bg-slate-700/60 transition-colors border-b border-slate-50 last:border-0 dark:border-slate-700/50">
                              <span className="text-sm font-semibold text-slate-800 dark:text-white">{u.name}</span>
                              <span className="text-xs text-slate-500">{u.email}
                                <span className="ml-2 rounded-full bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">{u.role}</span>
                              </span>
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {/* Selected user tags */}
                <div className="flex flex-wrap gap-1.5 min-h-[40px] items-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-2">
                  {selectedUsers.length === 0 ? (
                    <span className="flex items-center gap-1.5 text-xs text-slate-400 pl-1">
                      <AlertCircle className="h-3.5 w-3.5" /> No recipients selected yet
                    </span>
                  ) : selectedUsers.map(u => (
                    <span key={u._id} className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200/60 pl-2.5 pr-1 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-500/30">
                      {u.name}
                      <button onClick={() => setSelectedUsers(prev => prev.filter(x => x._id !== u._id))}
                        className="rounded p-0.5 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-500">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 2 – Type */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              2 · Alert Type
            </label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              {NOTIF_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Step 3 – Message */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              3 · Message
            </label>
            <textarea value={message} onChange={e => setMessage(e.target.value.slice(0, 500))} rows={4}
              placeholder="Type your notification message… e.g. Mandi rates for Tomato are rising today!"
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-600" />
            <div className="mt-1 flex justify-between text-xs">
              <span className="text-slate-400">Keep it clear and concise.</span>
              <span className={cn('font-medium', message.length > 450 ? 'text-rose-500 font-bold' : 'text-slate-400')}>
                {message.length}/500
              </span>
            </div>
          </div>
        </div>

        {/* Send button */}
        <div className="mt-5 flex justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
          <button onClick={handleSend} disabled={sendMutation.isPending || !message.trim()}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition-all shadow-md shadow-amber-500/20">
            {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Dispatch Notification
          </button>
        </div>
      </div>

      {/* Quick guide */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
        <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3">📋 Broadcast Guidelines</h4>
        <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400 list-disc pl-4">
          <li><strong>All Users</strong> – reaches every active account on the platform.</li>
          <li><strong>Farmers / Buyers</strong> – role-specific targeted alerts.</li>
          <li><strong>Specific Users</strong> – search and pick individual accounts.</li>
          <li><strong>Real-time</strong> – delivered instantly via WebSockets and saved to DB.</li>
          <li>Include crop names or order IDs for higher engagement.</li>
        </ul>
      </div>
    </div>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────
function HistoryTab() {
  const { token } = useAppStore();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-notifications', page, typeFilter, readFilter],
    queryFn: () => fetchNotifs(token!, page, typeFilter, readFilter),
    enabled: !!token,
    staleTime: 30_000,
  });

  const notifications = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400" />
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-200 bg-white py-2 pl-2 pr-6 text-sm text-slate-700 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          <option value="">All Types</option>
          {NOTIF_TYPES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
        </select>
        <select value={readFilter} onChange={e => { setReadFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-200 bg-white py-2 pl-2 pr-6 text-sm text-slate-700 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          <option value="">All Status</option>
          <option value="true">Read</option>
          <option value="false">Unread</option>
        </select>
        <span className="ml-auto text-xs text-slate-400">{pagination?.total ?? 0} notifications</span>
      </div>

      {/* Mobile Card-based UI */}
      <div className="grid gap-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-4 w-1/4 rounded bg-slate-100 dark:bg-slate-850" />
                <div className="h-3 w-1/5 rounded bg-slate-100 dark:bg-slate-850" />
              </div>
              <div className="h-3.5 w-full rounded bg-slate-100 dark:bg-slate-850" />
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-slate-400 text-sm">
            No notifications found
          </div>
        ) : (
          notifications.map((n: any) => (
            <motion.div
              key={n._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-sm"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-50 dark:border-slate-800/60 pb-2">
                <span className={cn(
                  'inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase',
                  TYPE_STYLES[n.type] || TYPE_STYLES.SYSTEM
                )}>
                  {n.type?.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {format(new Date(n.createdAt), 'MMM d · h:mm a')}
                </span>
              </div>

              {/* Recipient */}
              <div className="text-xs">
                <span className="block text-[9px] text-slate-400 uppercase tracking-wider">Recipient</span>
                {typeof n.userId === 'object' && n.userId ? (
                  <div className="font-semibold text-slate-700 dark:text-slate-200">
                    {n.userId.name} <span className="font-normal text-slate-400">({n.userId.email})</span>
                  </div>
                ) : (
                  <span className="text-slate-400">— (All Users)</span>
                )}
              </div>

              {/* Message */}
              <div className="text-xs">
                <span className="block text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Message</span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 rounded-lg p-2 border border-slate-105 dark:border-slate-800/50">
                  {n.message}
                </p>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-slate-400">Status</span>
                <span className={cn('inline-flex items-center gap-1 font-semibold',
                  n.isRead ? 'text-slate-400 dark:text-slate-500' : 'text-amber-600 dark:text-amber-400'
                )}>
                  {n.isRead
                    ? <><CheckCircle className="h-3.5 w-3.5" /> Read</>
                    : <><Clock className="h-3.5 w-3.5 animate-pulse" /> Unread</>
                  }
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Desktop Table UI */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                <th className="px-4 py-3 text-left">Recipient</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Message</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Sent At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-slate-400 text-sm">
                    No notifications found
                  </td>
                </tr>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                notifications.map((n: any) => (
                  <motion.tr key={n._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      {typeof n.userId === 'object' && n.userId ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-800 dark:text-white">{n.userId.name}</span>
                          <span className="text-[10px] text-slate-400">{n.userId.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
                        TYPE_STYLES[n.type] || TYPE_STYLES.SYSTEM
                      )}>
                        {n.type?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2" title={n.message}>{n.message}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1 text-xs font-semibold',
                        n.isRead ? 'text-slate-400 dark:text-slate-500' : 'text-amber-600 dark:text-amber-400'
                      )}>
                        {n.isRead
                          ? <><CheckCircle className="h-3.5 w-3.5" /> Read</>
                          : <><Clock className="h-3.5 w-3.5 animate-pulse" /> Unread</>
                        }
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {format(new Date(n.createdAt), 'MMM d, yyyy · hh:mm a')}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-5 py-3">
          <span className="text-xs text-slate-400">Page {page} of {pagination.totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-850 transition-colors bg-white dark:bg-slate-900">
              Previous
            </button>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-850 transition-colors bg-white dark:bg-slate-900">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const PAGE_TABS = [
  { value: 'compose', label: 'Compose & Broadcast', icon: Send },
  { value: 'history', label: 'Dispatch History', icon: History },
] as const;

type PageTab = typeof PAGE_TABS[number]['value'];

export default function AdminNotificationsPage() {
  const [tab, setTab] = useState<PageTab>('compose');

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Bell className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
            </span>
            Notification Center
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">Broadcast alerts or send targeted messages to specific users</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900/50 w-full sm:w-auto sm:inline-flex">
        {PAGE_TABS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={cn(
              'flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all',
              tab === value
                ? 'bg-white shadow-sm text-amber-700 dark:bg-slate-800 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/30'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {tab === 'compose' ? <ComposeTab /> : <HistoryTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
