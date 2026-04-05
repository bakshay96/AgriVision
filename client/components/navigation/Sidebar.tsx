'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Microscope,
  ShoppingCart,
  Package,
  Leaf,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ShoppingBag,
  Cloud,
  TrendingUp,
  BookOpen,
  Wallet,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { useLanguageStore } from '@/store/useLanguageStore';

// ─────────────────────────────────────────────────────────────────────────────
// Navigation items (role-based filtering happens below)
// ─────────────────────────────────────────────────────────────────────────────
const navItems = [
  {
    label: 'nav.dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['FARMER', 'BUYER', 'ADMIN'],
  },
  {
    label: 'nav.weather',
    href: '/weather',
    icon: Cloud,
    roles: ['FARMER', 'ADMIN'],
  },
  {
    label: 'nav.marketPrices',
    href: '/market-prices',
    icon: TrendingUp,
    roles: ['FARMER', 'BUYER', 'ADMIN'],
  },
  {
    label: 'nav.encyclopedia',
    href: '/crop-encyclopedia',
    icon: BookOpen,
    roles: ['FARMER', 'BUYER', 'ADMIN'],
  },
  {
    label: 'nav.health',
    href: '/health-monitor',
    icon: Microscope,
    roles: ['FARMER', 'ADMIN'],
  },
  {
    label: 'nav.marketplace',
    href: '/marketplace',
    icon: ShoppingCart,
    roles: ['FARMER', 'BUYER', 'ADMIN'],
  },
  {
    label: 'nav.inventory',
    href: '/inventory',
    icon: Package,
    roles: ['FARMER', 'ADMIN'],
  },
  {
    label: 'nav.orders',
    href: '/orders',
    icon: ShoppingBag,
    roles: ['FARMER', 'BUYER', 'ADMIN'],
  },
  {
    label: 'nav.financial',
    href: '/financial',
    icon: Wallet,
    roles: ['FARMER', 'ADMIN'],
  },
  {
    label: 'nav.profile',
    href: '/profile',
    icon: User,
    roles: ['FARMER', 'BUYER', 'ADMIN'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar component with desktop icon-only collapsible mode
// ─────────────────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isSidebarOpen, setSidebarOpen, clearUser } = useAppStore();
  const { t } = useLanguageStore();

  // Normalize to uppercase so both 'farmer' (old localStorage) and 'FARMER' (new) work
  const filteredNav = navItems.filter(
    (item) => user && item.roles.includes(user.role.toUpperCase())
  );

  const handleLogout = () => {
    clearUser();
    router.push('/auth/login');
  };

  return (
    <>
      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* Mobile overlay (only shown on small screens when sidebar is open) */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* Main sidebar — responsive width based on breakpoint */}
      {/* Desktop (md+): icon-only when collapsed, full when expanded */}
      {/* Mobile: fixed overlay when opened */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <motion.aside
        initial={false}
        animate={{
          x: isSidebarOpen ? 0 : '-100%',
          width: isSidebarOpen ? 'auto' : 'auto',
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          'fixed left-0 top-0 z-30 flex h-full flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl',
          'md:relative md:translate-x-0 md:shadow-none',
          // Desktop: responsive width (icon-only = 72px, full = 256px)
          'md:w-[72px] xl:w-64',
          // Mobile: always 256px when visible
          'w-64'
        )}
      >
        {/* Logo section */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-5 md:justify-center xl:justify-between">
          {/* Logo + text (hidden on md, shown on xl) */}
          <Link href="/dashboard" className="flex items-center gap-2.5 xl:gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600">
              <Leaf className="h-4 w-4 text-white" />
            </div>
            <div className="hidden xl:block">
              <p className="text-sm font-bold text-slate-900 dark:text-white">AgriVision</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Pro</p>
            </div>
          </Link>

          {/* Close button (mobile only) */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1 text-slate-400 hover:text-slate-600 md:hidden"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Collapse toggle (desktop only) — hidden, for future enhancement */}
          {/* Uncomment to add desktop collapse toggle */}
          {/* <button className="hidden md:block p-1 text-slate-400 hover:text-slate-600">
            {isSidebarOpen ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
          </button> */}
        </div>

        {/* Farm info section (icon-only on md, full on xl) */}
        {user && (
          <div className="border-b border-slate-100 dark:border-slate-800 px-3 py-3 md:flex md:justify-center xl:block xl:px-4">
            {/* Mobile + XL: full card */}
            <div className="hidden rounded-lg bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2.5 md:hidden xl:block">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                {user.farmName || user.name}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 capitalize">{user.role?.toLowerCase() || 'user'}</p>
            </div>

            {/* Desktop (md): icon-only avatar */}
            <div className="hidden md:flex md:h-8 md:w-8 md:items-center md:justify-center md:rounded-full md:bg-emerald-600 md:text-xs md:font-bold md:text-white xl:hidden">
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1 md:flex md:flex-col md:items-center md:px-1 xl:px-3">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors group',
                    'md:justify-center md:px-0 md:py-3 md:gap-0 xl:justify-start xl:px-3 xl:gap-3',
                    isActive
                      ? 'bg-emerald-600 text-white md:bg-emerald-100 dark:md:bg-emerald-900/40 md:text-emerald-600 dark:md:text-emerald-400 xl:bg-emerald-600 xl:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 md:hover:bg-slate-100 dark:md:hover:bg-slate-800 xl:hover:bg-slate-100 dark:xl:hover:bg-slate-800'
                  )}
                  title={t(item.label)}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 shrink-0 md:h-4 md:w-4',
                      isActive
                        ? 'text-white md:text-emerald-600 xl:text-white'
                        : 'text-slate-400 group-hover:text-emerald-600 md:group-hover:text-emerald-600'
                    )}
                  />

                  {/* Label + description (hidden on md, shown on xl) */}
                  <div className="hidden flex-1 min-w-0 xl:block">
                    <p className="font-medium truncate">{t(item.label)}</p>
                  </div>

                  {/* Active indicator (right side on xl) */}
                  {isActive && (
                    <ChevronRight className="hidden h-3 w-3 text-emerald-200 xl:block shrink-0 ml-auto" />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Logout button */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-3 md:flex md:justify-center md:p-2 xl:block xl:px-4 xl:py-4">
          <button
            onClick={handleLogout}
            className={cn(
              'w-full rounded-lg px-3 py-2 text-left text-sm text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors',
              'md:rounded-full md:p-2 md:flex md:justify-center xl:w-full xl:rounded-lg xl:px-3 xl:py-2 xl:text-left'
            )}
            title="Sign out"
          >
            <span className="hidden xl:inline">Sign out</span>
            <span className="md:text-xs md:font-bold md:hidden xl:hidden">←</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
