'use client';

import { Bell, Menu, Search, User, Image as ImageIcon, LogOut, MapPin, Clock, X } from 'lucide-react';
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
  const { language, setLanguage } = useLanguageStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { theme, setTheme, systemTheme } = useTheme();
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

  // Auto-close notification after 8s
  useEffect(() => {
    if (!notifOpen) return;
    const t = setTimeout(() => setNotifOpen(false), 8000);
    return () => clearTimeout(t);
  }, [notifOpen]);

  useEffect(() => setMounted(true), []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

        {/* Search bar with functionality */}
        <div className="relative hidden items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 sm:flex">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'mr' ? 'पिके, ऑर्डर शोधा...' : language === 'hi' ? 'फसलें, ऑर्डर खोजें...' : 'Search crops, orders...'}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(e.target.value.length > 0);
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                window.location.href = `/dashboard?search=${encodeURIComponent(searchQuery)}`;
              }
            }}
            className="w-48 bg-transparent text-sm text-slate-600 dark:text-slate-300 placeholder-slate-400 outline-none"
          />
          {searchQuery && (
            <button 
              onClick={() => { setSearchQuery(''); setShowSearchResults(false); }}
              className="text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          )}
        </div>

        {/* Location Selector */}
        <button
          onClick={() => setShowLocationPicker(true)}
          className="hidden md:flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Change location"
        >
          <MapPin className="h-3.5 w-3.5 text-emerald-600" />
          <span className="max-w-[120px] truncate">
            {sessionLocation?.address?.split(',')[0] || (language === 'mr' ? 'स्थान निवडा' : language === 'hi' ? 'स्थान चुनें' : 'Select Location')}
          </span>
        </button>
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
        <div className="relative" ref={notifRef}>
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{notifications.length} total</span>
                    <button onClick={() => setNotifOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
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

        {/* User Dropdown */}
        {user && (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2.5 rounded-lg border border-slate-100 dark:border-slate-800 p-1 pr-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                {user.name[0].toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-white leading-tight">{user.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] capitalize text-slate-500 dark:text-slate-400 leading-tight">{user.role?.toLowerCase() || 'user'}</p>
                  <span className="text-[10px] text-slate-400">•</span>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
              </div>
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl"
                >
                  <div className="p-2 space-y-0.5">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      href="/upload-images"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <ImageIcon className="h-4 w-4" />
                      <span>Upload Images</span>
                    </Link>
                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        clearUser();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Location Picker Modal */}
      <LocationPicker
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelect={handleLocationSelect}
        initialLocation={sessionLocation || undefined}
      />
    </header>
  );
}
