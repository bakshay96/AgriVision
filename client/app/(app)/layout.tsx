'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/navigation/Sidebar';
import Navbar from '@/components/navigation/Navbar';
import { useAppStore } from '@/store/useAppStore';
import { useSocket } from '@/hooks/useSocket';
import FloatingChatContainer from '@/components/chat/FloatingChatContainer';
import ChatLauncher from '@/components/chat/ChatLauncher';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAppStore();

  // ── Hydration guard ────────────────────────────────────────────────────────
  // Zustand persist rehydrates from localStorage asynchronously.
  // We must wait for the first client-side render before checking auth,
  // otherwise isAuthenticated is always false (SSR initial state) and we
  // immediately redirect logged-in users to /auth/login.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize socket connection (no-op until authenticated)
  useSocket();

  // Redirect unauthenticated users after mount
  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [mounted, isAuthenticated, router]);

  // Don't render anything until Zustand has rehydrated from localStorage
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

  // Show loading while redirecting
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
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
      {/* Floating Chat Container - renders all active chat widgets */}
      <FloatingChatContainer />
      
      {/* Chat Launcher Button */}
      <ChatLauncher />
    </div>
  );
}
