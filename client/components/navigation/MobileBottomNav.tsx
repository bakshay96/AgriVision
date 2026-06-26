'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Microscope, ShoppingCart,
  BookOpen, TrendingUp, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { useLanguageStore } from '@/store/useLanguageStore';

const mobileNavItems = [
  { href: '/dashboard',       icon: LayoutDashboard, labelKey: 'nav.dashboard',    roles: ['FARMER', 'BUYER', 'ADMIN'] },
  { href: '/market-prices',   icon: TrendingUp,      labelKey: 'nav.marketPrices', roles: ['FARMER', 'BUYER', 'ADMIN'] },
  { href: '/crop-encyclopedia', icon: BookOpen,       labelKey: 'nav.encyclopedia', roles: ['FARMER', 'BUYER', 'ADMIN'] },
  { href: '/health-monitor',  icon: Microscope,      labelKey: 'nav.health',       roles: ['FARMER', 'ADMIN'] },
  { href: '/marketplace',     icon: ShoppingCart,    labelKey: 'nav.marketplace',  roles: ['FARMER', 'BUYER', 'ADMIN'] },
  { href: '/profile',         icon: User,            labelKey: 'nav.profile',      roles: ['FARMER', 'BUYER', 'ADMIN'] },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAppStore();
  const { t } = useLanguageStore();

  const role = user?.role?.toUpperCase() || 'FARMER';
  const items = mobileNavItems.filter((i) => i.roles.includes(role));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pb-safe">
      <div className="flex items-center justify-around px-1 py-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 px-2 rounded-xl transition-all min-w-0',
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
              )}
            >
              <div className={cn(
                'p-1.5 rounded-xl transition-colors',
                isActive ? 'bg-emerald-50 dark:bg-emerald-900/30' : ''
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={cn(
                'text-[9px] font-medium leading-tight truncate max-w-[48px] text-center',
                isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
              )}>
                {t(item.labelKey).split(' ')[0]}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
