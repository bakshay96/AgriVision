'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminNavbar from '@/components/admin/AdminNavbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user, isSidebarCollapsed } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    if (user?.role?.toUpperCase() !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [mounted, isAuthenticated, user, router]);

  if (!mounted || !isAuthenticated || user?.role?.toUpperCase() !== 'ADMIN') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Verifying admin access…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 border-t-4 border-amber-500">
      <AdminSidebar />

      {/*
       * Main panel — right lobe of the figure-8.
       * Left edge curves INWARD (concave) while the sidebar right edge
       * curves OUTWARD (convex), creating matching lemniscate lobes at
       * their shared boundary. Both animate together over 0.45s.
       */}
      <motion.div
        animate={{
          // Left edge curves inward — the concave side of the right lobe
          borderTopLeftRadius: isSidebarCollapsed
            ? ['0px', '48px', '64px', '48px', '0px']
            : ['0px', '48px', '64px', '48px', '0px'],
          borderBottomLeftRadius: isSidebarCollapsed
            ? ['0px', '48px', '64px', '48px', '0px']
            : ['0px', '48px', '64px', '48px', '0px'],
          // Vertical squeeze at the crossing point of the 8
          scaleY: isSidebarCollapsed
            ? [1, 0.985, 1.008, 0.998, 1]
            : [1, 0.985, 1.008, 0.998, 1],
          // Amber glow on the left edge — visible crossing point of ∞
          boxShadow: isSidebarCollapsed
            ? [
                '-4px 0px 0px 0px rgba(245,158,11,0)',
                '-10px 0px 28px 4px rgba(245,158,11,0.55)',
                '-4px 0px 0px 0px rgba(245,158,11,0)'
              ]
            : [
                '-4px 0px 0px 0px rgba(245,158,11,0)',
                '-10px 0px 28px 4px rgba(245,158,11,0.55)',
                '-4px 0px 0px 0px rgba(245,158,11,0)'
              ]
        }}
        transition={{
          borderTopLeftRadius: { duration: 0.45, ease: 'easeInOut' },
          borderBottomLeftRadius: { duration: 0.45, ease: 'easeInOut' },
          scaleY: { duration: 0.45, ease: 'easeInOut' },
          boxShadow: { duration: 0.45, ease: 'easeInOut' }
        }}
        className="flex flex-1 flex-col overflow-hidden min-w-0 origin-center"
      >
        <AdminNavbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </motion.div>
    </div>
  );
}
