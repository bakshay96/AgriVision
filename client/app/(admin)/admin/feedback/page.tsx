'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Trash2, AlertTriangle, Star, MessageSquare, Filter,
  Send, CheckCircle, Reply, RefreshCw, MessageCircle, Clock
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const API = process.env.NEXT_PUBLIC_API_URL;
function hdrs(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

const CATEGORIES = ['', 'bug', 'feature', 'general', 'other'];
const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug Report', feature: 'Feature Request', general: 'General', other: 'Other',
};
const CATEGORY_COLORS: Record<string, string> = {
  bug: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  feature: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  general: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  other: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

interface FeedbackItem {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  rating: number;
  category: string;
  createdAt: string;
  adminReply?: string;
  repliedAt?: string;
  repliedBy?: { name: string };
  userId?: { name: string; email: string; role: string };
}

async function fetchFeedback(token: string, params: URLSearchParams) {
  const res = await fetch(`${API}/admin/feedback?${params}`, { headers: hdrs(token) });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
}

async function deleteFeedbackApi(token: string, id: string) {
  const res = await fetch(`${API}/admin/feedback/${id}`, { method: 'DELETE', headers: hdrs(token) });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
}

async function replyFeedbackApi(token: string, id: string, reply: string) {
  const res = await fetch(`${API}/admin/feedback/${id}/reply`, {
    method: 'POST', headers: hdrs(token), body: JSON.stringify({ reply }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn('h-3 w-3', i < rating ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-slate-300')} />
      ))}
    </div>
  );
}

// ─── Reply Modal ──────────────────────────────────────────────────────────────
function ReplyModal({ fb, onClose, onReply }: { fb: FeedbackItem | null; onClose: () => void; onReply: (id: string, text: string) => Promise<void> }) {
  const DEFAULT = `Thank you for taking the time to share your feedback with us! 🙏\n\nWe have carefully reviewed your submission and truly appreciate your input. Your ideas help us make AgriVision better for every farmer and buyer on our platform. Our team will consider your suggestions as we continue improving the product.\n\nThank you for being a valued member of the AgriVision community!`;
  const [text, setText] = useState(DEFAULT);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!fb || !text.trim()) return;
    setSending(true);
    try {
      await onReply(fb._id, text.trim());
      onClose();
    } finally { setSending(false); }
  };

  return (
    <AnimatePresence>
      {fb && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl border border-amber-100 bg-white shadow-2xl shadow-amber-500/10 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                  <Reply className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Reply to Feedback</h3>
                  <p className="text-xs text-slate-400">{fb.name} · {fb.email}</p>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-600 dark:text-slate-400">
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Original: "{fb.subject}"</p>
                  <p className="line-clamp-2">{fb.message}</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Your Reply (Sent as in-app notification)</label>
                  <textarea value={text} onChange={e => setText(e.target.value.slice(0, 800))} rows={7}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white resize-none" />
                  <p className="mt-1 text-right text-xs text-slate-400">{text.length}/800</p>
                </div>
              </div>
              <div className="flex gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                <button onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSend} disabled={sending || !text.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-2 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60 transition-colors">
                  {sending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Send Reply
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TABS = [
  { value: 'all', label: 'All Feedback', icon: MessageSquare },
  { value: 'replied', label: 'Replied', icon: CheckCircle },
  { value: 'pending', label: 'Pending Reply', icon: Clock },
];

export default function AdminFeedbackPage() {
  const { token } = useAppStore();
  const qc = useQueryClient();

  const [tab, setTab] = useState('all');
  const [category, setCategory] = useState('');
  const [rating, setRating] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeedbackItem | null>(null);
  const [replyTarget, setReplyTarget] = useState<FeedbackItem | null>(null);

  const params = new URLSearchParams({
    page: String(page), limit: '15',
    ...(category && { category }),
    ...(rating && { rating }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-feedback', page, category, rating],
    queryFn: () => fetchFeedback(token!, params),
    enabled: !!token,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFeedbackApi(token!, id),
    onSuccess: () => { toast.success('Feedback deleted'); setDeleteTarget(null); qc.invalidateQueries({ queryKey: ['admin-feedback'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) => replyFeedbackApi(token!, id, reply),
    onSuccess: () => { toast.success('Reply sent & notification delivered! ✅'); qc.invalidateQueries({ queryKey: ['admin-feedback'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const allFeedbacks: FeedbackItem[] = data?.data || [];

  const feedbacks = allFeedbacks.filter(fb => {
    if (tab === 'replied') return !!fb.adminReply;
    if (tab === 'pending') return !fb.adminReply;
    return true;
  });

  const pagination = data?.pagination;
  const repliedCount = allFeedbacks.filter(f => f.adminReply).length;
  const pendingCount = allFeedbacks.filter(f => !f.adminReply).length;

  return (
    <div className="space-y-4 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Feedback Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Review, reply, and manage user feedback</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 px-3 py-2 border border-amber-200/60 dark:border-amber-800/40">
          <MessageCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">{pagination?.total ?? 0} Total Entries</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900/50">
        {TABS.map(({ value, label, icon: Icon }) => {
          const count = value === 'replied' ? repliedCount : value === 'pending' ? pendingCount : allFeedbacks.length;
          return (
            <button key={value} onClick={() => { setTab(value); setPage(1); }}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all',
                tab === value
                  ? 'bg-white shadow-sm text-amber-700 dark:bg-slate-800 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              )}>
              <Icon className="h-3.5 w-3.5" />
              {label}
              <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                tab === value ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
              )}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400" />
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-200 bg-white py-2 pl-2 pr-6 text-sm text-slate-700 focus:border-amber-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          {CATEGORIES.map(c => <option key={c} value={c}>{c ? CATEGORY_LABELS[c] : 'All Categories'}</option>)}
        </select>
        <select value={rating} onChange={e => { setRating(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-200 bg-white py-2 pl-2 pr-6 text-sm text-slate-700 focus:border-amber-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          <option value="">All Ratings</option>
          {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>)}
        </select>
      </div>

      {/* Feedback Cards */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-white border border-slate-200 dark:border-slate-800 dark:bg-slate-900" />
          ))
        ) : feedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 dark:border-slate-700 dark:bg-slate-900">
            <MessageSquare className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">No feedback found</p>
          </div>
        ) : (
          feedbacks.map(fb => (
            <motion.div key={fb._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={cn('rounded-xl border bg-white dark:bg-slate-900 overflow-hidden',
                fb.adminReply
                  ? 'border-green-200 dark:border-green-900/40'
                  : 'border-slate-200 dark:border-slate-800'
              )}>
              <div className="flex cursor-pointer items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                onClick={() => setExpandedId(expandedId === fb._id ? null : fb._id)}>
                {/* Rating bubble */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-lg font-bold text-amber-600 dark:bg-amber-900/30">
                    {fb.rating}
                  </div>
                  <StarRating rating={fb.rating} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800 dark:text-white text-sm">{fb.subject}</p>
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', CATEGORY_COLORS[fb.category])}>
                      {CATEGORY_LABELS[fb.category] || fb.category}
                    </span>
                    {fb.adminReply && (
                      <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle className="h-3 w-3" /> Replied
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{fb.name} · {fb.email}</p>
                  <p className="mt-1 truncate text-xs text-slate-600 dark:text-slate-400">{fb.message}</p>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-xs text-slate-400">{format(new Date(fb.createdAt), 'MMM d, yyyy')}</span>
                  <div className="flex items-center gap-1">
                    {!fb.adminReply && (
                      <button onClick={e => { e.stopPropagation(); setReplyTarget(fb); }}
                        className="rounded-lg p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors" title="Reply">
                        <Reply className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={e => { e.stopPropagation(); setDeleteTarget(fb); }}
                      className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded detail */}
              <AnimatePresence>
                {expandedId === fb._id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-slate-100 dark:border-slate-800">
                    <div className="p-4 pt-3 space-y-3">
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{fb.message}</p>
                      {fb.userId && (
                        <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-800 px-3 py-2">
                          <span className="text-xs text-slate-500">Registered user:</span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{fb.userId.name}</span>
                          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{fb.userId.role}</span>
                        </div>
                      )}
                      {fb.adminReply && (
                        <div className="rounded-xl border border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-900/10 p-3">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                            <span className="text-xs font-bold text-green-700 dark:text-green-400">Admin Reply</span>
                            {fb.repliedAt && <span className="text-[10px] text-green-600/70 dark:text-green-500/70">· {format(new Date(fb.repliedAt), 'MMM d, yyyy')}</span>}
                          </div>
                          <p className="text-xs text-green-800 dark:text-green-300 leading-relaxed">{fb.adminReply}</p>
                        </div>
                      )}
                      {!fb.adminReply && (
                        <button onClick={() => setReplyTarget(fb)}
                          className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 transition-colors">
                          <Reply className="h-3.5 w-3.5" /> Send Reply & Notify User
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-600 disabled:opacity-30 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
            Previous
          </button>
          <span className="flex items-center text-xs text-slate-400">Page {page} of {pagination.totalPages}</span>
          <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-600 disabled:opacity-30 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
            Next
          </button>
        </div>
      )}

      {/* Reply Modal */}
      <ReplyModal
        fb={replyTarget}
        onClose={() => setReplyTarget(null)}
        onReply={async (id, reply) => { await replyMutation.mutateAsync({ id, reply }); }}
      />

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Delete Feedback?</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">This will permanently remove this feedback entry.</p>
                <div className="flex gap-2">
                  <button onClick={() => setDeleteTarget(null)}
                    className="flex-1 rounded-xl border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => deleteMutation.mutate(deleteTarget._id)} disabled={deleteMutation.isPending}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
