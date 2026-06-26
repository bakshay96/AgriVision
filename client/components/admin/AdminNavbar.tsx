'use client';

import { Moon, Sun, Shield } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function AdminNavbar() {
  const { user } = useAppStore();

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-sm px-4 dark:border-slate-800 dark:bg-slate-950/80 flex-shrink-0">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 dark:bg-indigo-950/30 border border-indigo-100/50 dark:border-indigo-900/30">
          <Shield className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">
            Master Admin Portal
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-sm">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
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
