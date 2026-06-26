'use client';

import { Moon, Sun, Shield, Menu } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export default function AdminNavbar() {
  const { user, toggleSidebar } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-sm px-4 dark:border-slate-800 dark:bg-slate-950/80 flex-shrink-0">
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-150 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 md:hidden transition-colors flex items-center justify-center border border-slate-200 dark:border-slate-800"
          title="Open Menu"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>
        <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 dark:bg-amber-950/30 border border-amber-100/50 dark:border-amber-900/30">
          <Shield className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">
            AgriVision Admin Portal
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-2"
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4.5 w-4.5 text-amber-500" />
            ) : (
              <Moon className="h-4.5 w-4.5 text-slate-600 dark:text-slate-400" />
            )}
          </button>
        )}

        <div className="hidden sm:flex items-center gap-2 text-sm border-l border-slate-200 dark:border-slate-800 pl-3">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-800 dark:text-white leading-none">{user?.name || 'Admin'}</p>
            <p className="text-[10px] text-slate-400 leading-none mt-0.5">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

