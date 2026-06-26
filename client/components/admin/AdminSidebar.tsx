'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Bell,
  MessageSquare,
  ShoppingCart,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  LogOut,
  Activity,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
  { href: '/admin/activity', label: 'Activity', icon: Activity },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { clearUser, user, isSidebarOpen, setSidebarOpen } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    clearUser();
    router.push('/auth/login');
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden animate-fade-in"
        />
      )}

      <motion.aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex h-full flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 overflow-hidden flex-shrink-0 transition-transform duration-300 md:transition-none md:translate-x-0 md:relative md:z-auto shadow-2xl md:shadow-none",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-3 dark:border-slate-800">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 min-w-0"
              >
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 shadow shadow-amber-500/20">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <span className="truncate text-xs font-black tracking-wider text-amber-600 dark:text-amber-400 uppercase">
                  AgriVision Admin
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {collapsed && (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 shadow mx-auto">
              <Shield className="h-4 w-4 text-white" />
            </div>
          )}

          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              'rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors flex-shrink-0 hidden md:block',
              collapsed && 'hidden'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="absolute -right-3 top-12 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm text-slate-500 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 transition-colors hidden md:flex"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                title={collapsed ? label : undefined}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-400 border-l-2 border-amber-500'
                    : 'text-slate-600 hover:bg-amber-50/30 hover:text-amber-900 dark:text-slate-400 dark:hover:bg-amber-950/20 dark:hover:text-white'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 flex-shrink-0 transition-colors',
                    active ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-300'
                  )}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {active && !collapsed && (
                  <motion.div
                    layoutId="admin-nav-indicator"
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-500"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200 p-2 dark:border-slate-800 space-y-1">
          {/* Go to App */}
          <Link
            href="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-slate-500 hover:bg-indigo-50/50 hover:text-indigo-900 dark:hover:bg-indigo-950/20 dark:hover:text-white transition-colors"
            title={collapsed ? 'Back to App' : undefined}
          >
            <LayoutDashboard className="h-4 w-4 flex-shrink-0 text-slate-400" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                  Back to App
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* User */}
          {!collapsed && user && (
            <div className="px-2.5 py-2">
              <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">{user.name}</p>
              <p className="truncate text-[10px] text-slate-400">{user.email}</p>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={() => { handleLogout(); setSidebarOpen(false); }}
            title={collapsed ? 'Logout' : undefined}
            className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
