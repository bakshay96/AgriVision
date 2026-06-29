'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { usePathname } from 'next/navigation';
import { useLoader } from '@/hooks/useLoader';

import { ThemeProvider } from 'next-themes';
import { GlobalLoader } from '@/components/ui/GlobalLoader';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000,     // 2 min — sockets handle real-time
            gcTime:    5 * 60 * 1000,      // keep unused cache 5 min
            refetchOnWindowFocus: false,   // never re-fetch on tab focus
            refetchOnMount: false,         // use cache if within staleTime
            retry: 1,
          },
        },
      })
  );

  const pathname = usePathname();
  const { hideLoader } = useLoader();
  const router = useRouter();
  const { isAuthenticated, clearUser } = useAppStore();

  useEffect(() => {
    hideLoader();
  }, [pathname, hideLoader]);

  // Global Sliding Session Inactivity Tracker
  useEffect(() => {
    if (!isAuthenticated) return;

    const updateActivity = () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('agrivision_last_activity', Date.now().toString());
      }
    };

    // Initialize if missing
    if (typeof window !== 'undefined' && !localStorage.getItem('agrivision_last_activity')) {
      updateActivity();
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    const interval = setInterval(() => {
      if (typeof window !== 'undefined') {
        const lastActivity = localStorage.getItem('agrivision_last_activity');
        if (lastActivity) {
          const elapsed = Date.now() - parseInt(lastActivity, 10);
          const oneHour = 60 * 60 * 1000;

          if (elapsed > oneHour) {
            localStorage.removeItem('agrivision_last_activity');
            clearUser();
            router.replace('/auth/login');
          }
        }
      }
    }, 10000); // Check every 10 seconds

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(interval);
    };
  }, [isAuthenticated, clearUser, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <GlobalLoader />
        {children}
        <Toaster
          position="top-right"
          richColors
          theme="system"
          closeButton
        />
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

