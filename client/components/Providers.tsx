'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { usePathname } from 'next/navigation';
import { useLoader } from '@/hooks/useLoader';

import { ThemeProvider } from 'next-themes';
import { GlobalLoader } from '@/components/ui/GlobalLoader';

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

  useEffect(() => {
    hideLoader();
  }, [pathname, hideLoader]);

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

