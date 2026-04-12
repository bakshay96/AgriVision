'use client';

import AgriLoader from '@/components/ui/AgriLoader';
import { useLoaderStore } from '@/hooks/useLoader';

/**
 * Global Loader Component
 * 
 * Add this to your root layout to enable global loader state.
 * The loader will automatically show/hide based on the global store.
 * 
 * Usage in layout.tsx:
 * ```tsx
 * import { GlobalLoader } from '@/components/ui/GlobalLoader';
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <GlobalLoader />
 *         {children}
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function GlobalLoader() {
  const { isLoading, message, subtitle, variant } = useLoaderStore();

  return (
    <AgriLoader
      isLoading={isLoading}
      message={message}
      subtitle={subtitle}
      variant={variant}
      overlay={true}
      size="lg"
    />
  );
}

export default GlobalLoader;
