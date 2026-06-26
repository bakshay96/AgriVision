'use client';

import { Bell, Menu, User, Image as ImageIcon, LogOut, MapPin, Clock, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useTheme } from 'next-themes';
import { formatRelativeTime } from '@/lib/utils';
import LocationPicker from '@/components/location/LocationPicker';

export default function Navbar() {
  const { user, toggleSidebar, markAllRead, unreadCount, notifications, clearUser } = useAppStore();
  const { language, setLanguage, t } = useLanguageStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifOpen && notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileOpen && profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen, profileOpen]);

  useEffect(() => setMounted(true), []);

  // Session Timeout Logic
  const [sessionTimeLeft, setSessionTimeLeft] = useState(60 * 60);
  useEffect(() => {
    const storedSessionStart = localStorage.getItem('agrivision_session_start');
    const startTime = storedSessionStart ? parseInt(storedSessionStart) : Date.now();
    
    if (!storedSessionStart) {
      localStorage.setItem('agrivision_session_start', startTime.toString());
    }

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, 60 * 60 - elapsed);
      setSessionTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(timer);
        localStorage.removeItem('agrivision_session_start');
        localStorage.removeItem('agrivision_token');
        localStorage.removeItem('agrivision_user');
        window.location.href = '/auth/login';
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);
 
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get session location
  const [sessionLocation, setSessionLocation] = useState<{ lat: number, lng: number, address: string } | null>(null);
  useEffect(() => {
    const saved = localStorage.getItem('agrivision_session_location');
    if (saved) {
      try {
        setSessionLocation(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleLocationSelect = (location: any) => {
    const newLoc = { lat: location.lat, lng: location.lng, address: location.address };
    setSessionLocation(newLoc);
    localStorage.setItem('agrivision_session_location', JSON.stringify(newLoc));
    setShowLocationPicker(false);
  };

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
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Session Timer */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 shadow-sm shadow-amber-200/20">
          <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 tabular-nums">
            {formatTime(sessionTimeLeft)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Location Picker */}
        <button
          onClick={() => setShowLocationPicker(true)}
          className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <MapPin className="h-4 w-4 text-emerald-600" />
          <span className="max-w-[100px] truncate">
            {sessionLocation?.address?.split(',')[0] || 'Location'}
          </span>
        </button>

        <div className="flex items-center gap-1">
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

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) markAllRead(); }}
              className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 border-2 border-white dark:border-slate-900" />
              )}
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-3 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <span className="text-sm font-bold dark:text-white">Notifications</span>
                    <button onClick={() => setNotifOpen(false)}><X className="h-4 w-4 text-slate-400" /></button>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 text-sm">No new notifications</div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div key={n.id} className="p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors">
                          <div className="flex gap-3">
                            <span className="text-xl">{getNotifIcon(n.type)}</span>
                            <div>
                              <p className="text-xs text-slate-600 dark:text-slate-300">{n.message}</p>
                              <p className="text-[10px] text-slate-400 mt-1">{formatRelativeTime(n.timestamp)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Language Selector */}
          <div className="relative mr-2 flex items-center">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold outline-none border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all shadow-sm"
              title="Select language / भाषा निवडा / भाषा चुनें"
            >
              <option value="en" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">English (EN)</option>
              <option value="hi" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">हिंदी (HI)</option>
              <option value="mr" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">मराठी (MR)</option>
            </select>
          </div>

          {/* User Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 rounded-xl p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-600/20">
                {user?.name?.[0].toUpperCase() || 'U'}
              </div>
              <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${profileOpen ? 'rotate-90' : ''} hidden sm:block`} />
            </button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-3 w-56 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-2 z-[60]">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                    <p className="text-sm font-bold dark:text-white truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <User className="h-4 w-4" /> Profile Settings
                  </Link>
                  <Link href="/upload-images" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <ImageIcon className="h-4 w-4" /> My Media
                  </Link>
                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-2" />
                  <button onClick={clearUser} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <LocationPicker isOpen={showLocationPicker} onClose={() => setShowLocationPicker(false)} onSelect={handleLocationSelect} initialLocation={sessionLocation || undefined} />
    </header>
  );
}
