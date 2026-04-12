'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { Toaster } from 'sonner';

import { ThemeProvider } from 'next-themes';
import { GlobalLoader } from '@/components/ui/GlobalLoader';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

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
