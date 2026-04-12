'use client';

import { create } from 'zustand';
import type { LoaderVariant } from '@/components/ui/AgriLoader';

// ─────────────────────────────────────────────────────────────────────────────
// Loader State Interface
// ─────────────────────────────────────────────────────────────────────────────

interface LoaderState {
  isLoading: boolean;
  message?: string;
  subtitle?: string;
  variant: LoaderVariant;
  
  // Actions
  showLoader: (options?: { 
    message?: string; 
    subtitle?: string; 
    variant?: LoaderVariant 
  }) => void;
  hideLoader: () => void;
  setLoading: (loading: boolean, options?: { 
    message?: string; 
    subtitle?: string; 
    variant?: LoaderVariant 
  }) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Global Loader Store
// ─────────────────────────────────────────────────────────────────────────────

export const useLoaderStore = create<LoaderState>((set) => ({
  isLoading: false,
  message: undefined,
  subtitle: undefined,
  variant: 'default',

  showLoader: (options) => set({
    isLoading: true,
    message: options?.message,
    subtitle: options?.subtitle,
    variant: options?.variant || 'default',
  }),

  hideLoader: () => set({
    isLoading: false,
    message: undefined,
    subtitle: undefined,
  }),

  setLoading: (loading, options) => set({
    isLoading: loading,
    message: options?.message,
    subtitle: options?.subtitle,
    variant: options?.variant || 'default',
  }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Hook for easy loader control
// ─────────────────────────────────────────────────────────────────────────────

export function useLoader() {
  const { 
    isLoading, 
    message, 
    subtitle, 
    variant, 
    showLoader, 
    hideLoader, 
    setLoading 
  } = useLoaderStore();

  // Convenience methods for common operations
  const showAuth = (message?: string) => showLoader({ variant: 'auth', message });
  const showUpload = (message?: string) => showLoader({ variant: 'upload', message });
  const showAnalysis = (message?: string) => showLoader({ variant: 'analysis', message });
  const showSaving = (message?: string) => showLoader({ variant: 'saving', message });
  const showFetching = (message?: string) => showLoader({ variant: 'fetching', message });

  // Async wrapper - shows loader during async operation
  const withLoader = async <T,>(
    fn: () => Promise<T>,
    options?: { 
      message?: string; 
      subtitle?: string; 
      variant?: LoaderVariant 
    }
  ): Promise<T> => {
    showLoader(options);
    try {
      const result = await fn();
      return result;
    } finally {
      hideLoader();
    }
  };

  return {
    isLoading,
    message,
    subtitle,
    variant,
    showLoader,
    hideLoader,
    setLoading,
    // Convenience methods
    showAuth,
    showUpload,
    showAnalysis,
    showSaving,
    showFetching,
    // Async wrapper
    withLoader,
  };
}
