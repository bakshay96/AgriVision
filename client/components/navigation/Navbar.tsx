'use client';

import { Bell, Menu, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useTheme } from 'next-themes';
import { formatRelativeTime } from '@/lib/utils';

export default function Navbar() {
  const { user, toggleSidebar, markAllRead, unreadCount, notifications } = useAppStore();
  const { language, setLanguage } = useLanguageStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const getNotifIcon = (type: string) => {
    const icons: Record<string, string> = {
      NEW_ORDER: '🛒',
      ORDER_STATUS_UPDATE: '📦',
      CROP_ALERT: '⚠️',
      AI_ANALYSIS_COMPLETE: '🤖',
    };
    return icons[type] || '🔔';
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-4 backdrop-blur-sm sm:px-6">
      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* Left: Menu toggle (mobile only) + Search */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Hamburger menu toggle — MOBILE ONLY (md: hidden) */}
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors md:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search bar (hidden on small screens) */}
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 sm:flex">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search crops, orders..."
            className="w-48 bg-transparent text-sm text-slate-600 dark:text-slate-300 placeholder-slate-400 outline-none"
          />
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* Right: Notifications + User info */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Language Selector */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as any)}
          className="bg-transparent text-sm font-medium text-slate-600 dark:text-slate-300 outline-none cursor-pointer hidden sm:block *:bg-white dark:*:bg-slate-900"
        >
          <option value="en">English</option>
          <option value="mr">मराठी</option>
          <option value="hi">हिंदी</option>
        </select>
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 hidden sm:block mx-1"></div>

        {/* Theme Toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:block"
            title="Toggle theme"
          >
            {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '💻'}
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((o) => !o);
              if (!notifOpen) markAllRead();
            }}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl"
              >
                <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
                  <span className="text-xs text-slate-400">{notifications.length} total</span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-6 text-center text-sm text-slate-400">No notifications yet</p>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        className="flex gap-3 border-b border-slate-50 dark:border-slate-800/50 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <span className="text-lg">{getNotifIcon(n.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{n.message}</p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {formatRelativeTime(n.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Avatar + Info */}
        {user && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
              {user.name[0].toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
              <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{user.role?.toLowerCase() || 'user'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Overlay to close notifications panel */}
      {notifOpen && (
        <div className="fixed inset-0 z-[-1]" onClick={() => setNotifOpen(false)} />
      )}
    </header>
  );
}
