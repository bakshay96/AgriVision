'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Microscope, ShoppingCart, Package,
  Leaf, X, ChevronRight, ShoppingBag, Cloud, TrendingUp,
  BookOpen, Wallet, User, Handshake, MessageSquare, MessageCircle,
  ChevronLeft, LogOut, Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useChatStore } from '@/store/useChatStore';
import { useEffect, useState } from 'react';

// ─── Nav items ────────────────────────────────────────────────────────────────
const navItems = [
  { label: 'nav.dashboard',    href: '/dashboard',        icon: LayoutDashboard, roles: ['FARMER', 'BUYER', 'ADMIN'] },
  { label: 'nav.weather',      href: '/weather',           icon: Cloud,           roles: ['FARMER', 'ADMIN'] },
  { label: 'nav.marketPrices', href: '/market-prices',     icon: TrendingUp,      roles: ['FARMER', 'BUYER', 'ADMIN'] },
  { label: 'nav.encyclopedia', href: '/crop-encyclopedia', icon: BookOpen,        roles: ['FARMER', 'BUYER', 'ADMIN'] },
  { label: 'nav.health',       href: '/health-monitor',    icon: Microscope,      roles: ['FARMER', 'ADMIN'] },
  { label: 'nav.marketplace',  href: '/marketplace',       icon: ShoppingCart,    roles: ['FARMER', 'BUYER', 'ADMIN'] },
  { label: 'nav.inventory',    href: '/inventory',         icon: Package,         roles: ['FARMER', 'ADMIN'] },
  { label: 'nav.orders',       href: '/orders',            icon: ShoppingBag,     roles: ['FARMER', 'BUYER', 'ADMIN'] },
  { label: 'nav.negotiations', href: '/negotiations',      icon: Handshake,       roles: ['FARMER', 'BUYER', 'ADMIN'] },
  { label: 'nav.chat',         href: '/chat',              icon: MessageSquare,   roles: ['FARMER', 'BUYER', 'ADMIN'] },
  { label: 'nav.financial',    href: '/financial',         icon: Wallet,          roles: ['FARMER', 'ADMIN'] },
  { label: 'nav.profile',      href: '/profile',           icon: User,            roles: ['FARMER', 'BUYER', 'ADMIN'] },
  { label: 'nav.feedback',     href: '/feedback',          icon: MessageCircle,   roles: ['FARMER', 'BUYER', 'ADMIN'] },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, isSidebarOpen, setSidebarOpen, isSidebarCollapsed, toggleSidebarCollapse, clearUser } = useAppStore();
  const { t } = useLanguageStore();

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pendingNegotiationCount = useNotificationStore(s => s.pendingNegotiationCount);
  const pendingOrderCount       = useNotificationStore(s => s.pendingOrderCount);
  const clearNegotiationBadge   = useNotificationStore(s => s.clearNegotiationBadge);
  const clearOrderBadge         = useNotificationStore(s => s.clearOrderBadge);
  const totalUnreadCount        = useChatStore(s => s.totalUnreadCount);

  useEffect(() => {
    if (pathname.includes('/negotiations')) clearNegotiationBadge();
    if (pathname.includes('/orders'))       clearOrderBadge();
  }, [pathname, clearNegotiationBadge, clearOrderBadge]);

  const filteredNav = navItems.filter(
    item => user && item.roles.includes(user.role.toUpperCase())
  );

  const handleLogout = () => {
    clearUser();
    router.push('/auth/login');
  };

  // ── Sidebar width values ──
  const EXPANDED_W  = 240; // px
  const COLLAPSED_W = 68;  // px

  return (
    <>
      {/* ── Mobile overlay ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar wrapper (handles desktop width/mobile slide animation) ── */}
      <motion.aside
        initial={false}
        animate={{
          // Mobile: slide in/out. Desktop: animate width
          x: isMobile ? (isSidebarOpen ? 0 : -240) : 0,
          width: isMobile ? 240 : (isSidebarCollapsed ? COLLAPSED_W : EXPANDED_W),
          // Right-edge curves outward — left lobe of ∞
          borderTopRightRadius: isSidebarCollapsed
            ? ['0px', '48px', '64px', '48px', '0px']
            : ['0px', '48px', '64px', '48px', '0px'],
          borderBottomRightRadius: isSidebarCollapsed
            ? ['0px', '48px', '64px', '48px', '0px']
            : ['0px', '48px', '64px', '48px', '0px'],
          // Emerald glow on the right boundary edge
          boxShadow: isSidebarCollapsed
            ? [
                '4px 0px 0px 0px rgba(16,185,129,0)',
                '8px 0px 24px 2px rgba(16,185,129,0.6)',
                '4px 0px 0px 0px rgba(16,185,129,0)'
              ]
            : [
                '4px 0px 0px 0px rgba(16,185,129,0)',
                '8px 0px 24px 2px rgba(16,185,129,0.6)',
                '4px 0px 0px 0px rgba(16,185,129,0)'
              ]
        }}
        transition={{
          x: { type: 'spring', damping: 28, stiffness: 260 },
          width: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
          borderTopRightRadius: { duration: 0.45, ease: 'easeInOut' },
          borderBottomRightRadius: { duration: 0.45, ease: 'easeInOut' },
          boxShadow: { duration: 0.45, ease: 'easeInOut' }
        }}
        className={cn(
          // Base — always a vertical flex column
          'relative flex flex-col h-full flex-shrink-0',
          'border-r border-slate-200 dark:border-slate-800',
          'bg-white dark:bg-slate-900',
          // Mobile: fixed overlay
          'fixed left-0 top-0 z-30 shadow-xl md:relative md:shadow-none md:z-auto',
          // Mobile: animate translate, Desktop: no translate needed (width handles it)
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          // Mobile width always 240
          'w-60 md:w-auto',
        )}
      >
        {/* ── Logo / Brand ────────────────────────────────────────────────── */}
        <div className={cn(
          'flex items-center border-b border-slate-100 dark:border-slate-800 shrink-0',
          'h-16 px-4 transition-all duration-300',
          isSidebarCollapsed ? 'justify-center px-2' : 'justify-between'
        )}>
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600">
              <Leaf className="h-4 w-4 text-white" />
            </div>
            <AnimatePresence initial={false}>
              {!isSidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col overflow-hidden whitespace-nowrap"
                >
                  <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">AgriVision</span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 leading-tight">Pro</span>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>

          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden rounded-md p-1 text-slate-400 hover:text-slate-600 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── User info pill ──────────────────────────────────────────────── */}
        {user && (
          <div className={cn(
            'border-b border-slate-100 dark:border-slate-800 px-3 py-3 shrink-0 flex',
            isSidebarCollapsed ? 'justify-center' : ''
          )}>
            {isSidebarCollapsed ? (
              // Collapsed: avatar only
              <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {(user.name || 'U').charAt(0).toUpperCase()}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2.5 w-full min-w-0"
              >
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                  {user.farmName || user.name}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 capitalize">
                  {user.role?.toLowerCase() || 'user'}
                </p>
              </motion.div>
            )}
          </div>
        )}

        {/* ── Nav items ────────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 overflow-x-hidden">
          {filteredNav.map(item => {
            const isActive       = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon           = item.icon;
            const isNegotiations = item.href === '/negotiations';
            const isOrders       = item.href === '/orders';
            const isChat         = item.href === '/chat';
            const showBadge      = (isNegotiations && pendingNegotiationCount > 0) || 
                                   (isOrders && pendingOrderCount > 0) ||
                                   (isChat && totalUnreadCount > 0);
            const badgeCount     = isNegotiations 
              ? pendingNegotiationCount 
              : isOrders 
                ? pendingOrderCount 
                : totalUnreadCount;

            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                <motion.div
                  whileHover={{ x: isSidebarCollapsed ? 0 : 3 }}
                  whileTap={{ scale: 0.97 }}
                  title={isSidebarCollapsed ? t(item.label) : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors group relative',
                    isSidebarCollapsed ? 'justify-center px-2' : '',
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  )}
                >
                  {/* Icon */}
                  <div className="relative shrink-0">
                    <Icon className={cn('h-5 w-5', isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600')} />
                    {/* Dot badge when collapsed */}
                    {showBadge && isSidebarCollapsed && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white dark:border-slate-900 animate-pulse" />
                    )}
                  </div>

                  {/* Label — fades out when collapsing */}
                  <AnimatePresence initial={false}>
                    {!isSidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex-1 font-medium truncate overflow-hidden whitespace-nowrap"
                      >
                        {t(item.label)}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Badge / chevron in expanded mode */}
                  {!isSidebarCollapsed && (
                    showBadge ? (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          'ml-auto min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                          isActive ? 'bg-white/30 text-white' : 'bg-red-500 text-white animate-pulse'
                        )}
                      >
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </motion.span>
                    ) : isActive ? (
                      <ChevronRight className="h-3 w-3 text-emerald-200 shrink-0 ml-auto" />
                    ) : null
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* ── Logout ──────────────────────────────────────────────────────── */}
        <div className={cn(
          'border-t border-slate-100 dark:border-slate-800 p-2 shrink-0',
          isSidebarCollapsed ? 'flex flex-col items-center gap-1' : 'space-y-1'
        )}>
          {/* Admin Panel Link — ADMIN role only */}
          {user?.role?.toUpperCase() === 'ADMIN' && (
            <Link
              href="/admin/dashboard"
              title={isSidebarCollapsed ? 'Admin Panel' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-violet-600 dark:text-violet-400',
                'hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors group',
                isSidebarCollapsed ? 'justify-center px-2' : 'w-full'
              )}
            >
              <Shield className="h-4 w-4 shrink-0" />
              <AnimatePresence initial={false}>
                {!isSidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden whitespace-nowrap font-medium"
                  >
                    Admin Panel
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )}
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            title="Sign out"
            className={cn(
              'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-500 dark:text-slate-400',
              'hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors group',
              isSidebarCollapsed ? 'justify-center px-2' : 'w-full'
            )}
          >
            <LogOut className="h-5 w-5 shrink-0 group-hover:text-red-500 transition-colors" />
            <AnimatePresence initial={false}>
              {!isSidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden whitespace-nowrap font-medium"
                >
                  Sign out
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* ── Floating collapse toggle — sits on the RIGHT EDGE of sidebar ── */}
        {/* Desktop only */}
        <motion.button
          onClick={toggleSidebarCollapse}
          className={cn(
            'hidden md:flex',
            'absolute -right-3.5 top-1/2 -translate-y-1/2 z-50',
            'h-7 w-7 items-center justify-center rounded-full',
            'bg-white dark:bg-slate-800',
            'border border-slate-200 dark:border-slate-700',
            'text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400',
            'shadow-md hover:shadow-emerald-500/20 dark:hover:shadow-emerald-400/20',
            'hover:border-emerald-400 dark:hover:border-emerald-500',
            'transition-all duration-200 hover:scale-110',
          )}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          whileTap={{ scale: 0.9 }}
        >
          <motion.div
            animate={{ rotate: isSidebarCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 200, damping: 20 }}
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.div>
        </motion.button>
      </motion.aside>
    </>
  );
}
