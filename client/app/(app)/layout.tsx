'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/navigation/Sidebar';
import Navbar from '@/components/navigation/Navbar';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';
import { useAppStore } from '@/store/useAppStore';
import { useSocket } from '@/hooks/useSocket';
import FloatingChatContainer from '@/components/chat/FloatingChatContainer';
import ChatLauncher from '@/components/chat/ChatLauncher';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isSidebarCollapsed } = useAppStore();
  const [mounted, setMounted] = useState(false);

  // ── Hydration guard ────────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
  }, []);

  useSocket();

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading AgriVision Pro...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Sidebar />

      {/*
       * Main panel — right lobe of the figure-8.
       * Left edge curves INWARD while the Sidebar right edge curves OUTWARD,
       * together forming the crossing point of a lemniscate (∞) at the
       * shared boundary between both panels.
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
          // Vertical pinch at the crossing point
          scaleY: isSidebarCollapsed
            ? [1, 0.985, 1.008, 0.998, 1]
            : [1, 0.985, 1.008, 0.998, 1],
          // Emerald glow on the left edge — visible crossing point of ∞
          boxShadow: isSidebarCollapsed
            ? [
                '-4px 0px 0px 0px rgba(16,185,129,0)',
                '-10px 0px 28px 4px rgba(16,185,129,0.55)',
                '-4px 0px 0px 0px rgba(16,185,129,0)'
              ]
            : [
                '-4px 0px 0px 0px rgba(16,185,129,0)',
                '-10px 0px 28px 4px rgba(16,185,129,0.55)',
                '-4px 0px 0px 0px rgba(16,185,129,0)'
              ]
        }}
        transition={{
          borderTopLeftRadius: { duration: 0.45, ease: 'easeInOut' },
          borderBottomLeftRadius: { duration: 0.45, ease: 'easeInOut' },
          scaleY: { duration: 0.45, ease: 'easeInOut' },
          boxShadow: { duration: 0.45, ease: 'easeInOut' }
        }}
        className="flex flex-1 flex-col overflow-hidden origin-center"
      >
        <Navbar />
        <main className="flex-1 overflow-y-auto px-4 py-6 pb-20 sm:px-6 lg:px-8 md:pb-6">
          {children}
        </main>
      </motion.div>

      <MobileBottomNav />
      <FloatingChatContainer />
      <ChatLauncher />
    </div>
  );
}
