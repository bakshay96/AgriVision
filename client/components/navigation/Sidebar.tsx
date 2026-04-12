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
  PanelLeft,
  PanelLeftClose,
  Handshake,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useQuery } from '@tanstack/react-query';
import { negotiationApi } from '@/lib/api';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

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
    label: 'nav.negotiations',
    href: '/negotiations',
    icon: Handshake,
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
  const { user, isSidebarOpen, setSidebarOpen, isSidebarCollapsed, toggleSidebarCollapse, clearUser } = useAppStore();
  const { t } = useLanguageStore();
  const [pendingNegotiationCount, setPendingNegotiationCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  // Fetch pending negotiation count (negotiations needing this user's action)
  const { data: negotiationsData } = useQuery({
    queryKey: ['negotiations-badge-count'],
    queryFn: () => negotiationApi.getAll({ status: 'pending,countered', limit: 100 }).then(r => r.data.data),
    enabled: !!user,
    refetchInterval: 30000,
    staleTime: 15000,
  });

  // Compute how many negotiations need THIS user's action
  useEffect(() => {
    if (!negotiationsData?.negotiations || !user) return;
    const myRole = user.role?.toLowerCase();
    const actionRequired = negotiationsData.negotiations.filter((neg: any) => {
      if (neg.status === 'accepted' || neg.status === 'rejected' || neg.status === 'expired') return false;
      // If there's a counter, the non-countering party needs to respond
      if (neg.counterBy) return neg.counterBy !== myRole;
      // If no counter, the non-proposing party needs to respond
      return neg.proposedBy !== myRole;
    });
    setPendingNegotiationCount(actionRequired.length);
  }, [negotiationsData, user]);

  // Real-time socket increment for instant feedback
  useEffect(() => {
    if (!user) return;
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.emit('join_user', user._id);

    socket.on('negotiation_update', (data: any) => {
      const action = data?.payload?.action;
      // Only increment when a NEW negotiation or counter arrives that needs MY attention
      if (action === 'new' || action === 'counter') {
        // Only add badge if we are NOT already on the negotiations page
        if (!window.location.pathname.includes('/negotiations')) {
          setPendingNegotiationCount(prev => prev + 1);
        }
      }
    });

    return () => {
      socket.off('negotiation_update');
      socket.disconnect();
    };
  }, [user]);

  // Clear badge when user is on the negotiations page
  useEffect(() => {
    if (pathname.includes('/negotiations')) {
      setPendingNegotiationCount(0);
    }
  }, [pathname]);

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
          // Desktop: responsive width based on collapsed state
          isSidebarCollapsed ? 'md:w-[72px]' : 'md:w-64',
          // Mobile: always 256px when visible
          'w-64'
        )}
      >
        {/* Logo section */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-5 md:justify-center md:px-2 md:py-4">
          {/* Logo + text (hidden when collapsed on desktop) */}
          <Link href="/dashboard" className={cn("flex items-center gap-2.5", isSidebarCollapsed ? "md:hidden" : "flex")}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600">
              <Leaf className="h-4 w-4 text-white" />
            </div>
            <div className={cn("flex flex-col", isSidebarCollapsed ? "md:hidden" : "flex")}>
              <p className="text-sm font-bold text-slate-900 dark:text-white">AgriVision</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Pro</p>
            </div>
          </Link>

          {/* Icon-only logo (shown when collapsed on desktop) */}
          <Link href="/dashboard" className={cn("hidden", isSidebarCollapsed ? "md:flex" : "md:hidden")}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600">
              <Leaf className="h-4 w-4 text-white" />
            </div>
          </Link>

          {/* Close button (mobile only) */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1 text-slate-400 hover:text-slate-600 md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Farm info section (icon-only when collapsed, full when expanded) */}
        {user && (
          <div className="border-b border-slate-100 dark:border-slate-800 px-3 py-3 md:flex md:justify-center md:px-2">
            {/* Full card (shown when not collapsed) */}
            <div className={cn("rounded-lg bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2.5 w-full", isSidebarCollapsed ? "hidden" : "block")}>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                {user.farmName || user.name}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 capitalize">{user.role?.toLowerCase() || 'user'}</p>
            </div>

            {/* Icon-only avatar (shown when collapsed on desktop) */}
            <div className={cn("hidden md:flex md:h-8 md:w-8 md:items-center md:justify-center md:rounded-full md:bg-emerald-600 md:text-xs md:font-bold md:text-white", isSidebarCollapsed ? "md:flex" : "md:hidden")}>
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1 md:flex md:flex-col md:items-center md:px-1 relative">
          {/* Collapse toggle button - positioned at top right of navigation */}
          <div className="hidden md:flex w-full justify-end mb-2 px-1">
            <motion.button 
              onClick={toggleSidebarCollapse}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ 
                  rotate: isSidebarCollapsed ? 180 : 0,
                  x: isSidebarCollapsed ? 0 : 0
                }}
                transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
              >
                {isSidebarCollapsed ? (
                  <ChevronsRight className="h-4 w-4" />
                ) : (
                  <ChevronsLeft className="h-4 w-4" />
                )}
              </motion.div>
            </motion.button>
          </div>

          {filteredNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            const isNegotiations = item.href === '/negotiations';
            const showBadge = isNegotiations && pendingNegotiationCount > 0;

            return (
              <Link key={item.href} href={item.href} className="w-full">
                <motion.div
                  whileHover={{ x: isSidebarCollapsed ? 0 : 2 }}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors group relative',
                    isSidebarCollapsed ? 'md:justify-center md:px-0 md:py-3' : 'md:justify-start md:px-3',
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  )}
                  title={t(item.label)}
                >
                  {/* Icon with badge dot in collapsed mode */}
                  <div className="relative shrink-0">
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        isActive
                          ? 'text-white'
                          : 'text-slate-400 group-hover:text-emerald-600'
                      )}
                    />
                    {/* Collapsed sidebar: show dot badge on icon */}
                    {showBadge && isSidebarCollapsed && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white dark:border-slate-900 animate-pulse" />
                    )}
                  </div>

                  {/* Label (hidden when collapsed) */}
                  <div className={cn("flex-1 min-w-0", isSidebarCollapsed ? "md:hidden" : "")}>
                    <p className="font-medium truncate">{t(item.label)}</p>
                  </div>

                  {/* Badge count in expanded mode (replaces chevron for negotiations) */}
                  {showBadge && !isSidebarCollapsed ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        "ml-auto min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                        isActive
                          ? "bg-white/30 text-white"
                          : "bg-red-500 text-white animate-pulse"
                      )}
                    >
                      {pendingNegotiationCount > 9 ? '9+' : pendingNegotiationCount}
                    </motion.span>
                  ) : (
                    isActive && (
                      <ChevronRight className={cn("h-3 w-3 text-emerald-200 shrink-0 ml-auto", isSidebarCollapsed ? "md:hidden" : "")} />
                    )
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Logout button */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-3 md:flex md:justify-center md:p-2">
          <button
            onClick={handleLogout}
            className={cn(
              'w-full rounded-lg px-3 py-2 text-left text-sm text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors',
              isSidebarCollapsed ? 'md:rounded-full md:p-2 md:flex md:justify-center' : 'md:rounded-lg md:px-3 md:py-2 md:text-left'
            )}
            title="Sign out"
          >
            <span className={cn(isSidebarCollapsed ? "md:hidden" : "")}>Sign out</span>
            <span className={cn("md:text-xs md:font-bold", !isSidebarCollapsed ? "md:hidden" : "")}>←</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
