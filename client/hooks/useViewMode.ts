'use client';

import { useState, useEffect } from 'react';

export type ViewMode = 'table' | 'card';

/**
 * Custom hook to manage user view mode preference (table vs card view)
 * with secure input sanitization and localStorage persistence.
 */
export function useViewMode(key = 'agrivision_admin_view_mode', defaultMode: ViewMode = 'table') {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultMode);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem(key);
      // Security Sanitization: strict validation of input value
      if (stored === 'table' || stored === 'card') {
        setViewMode(stored);
      }
    } catch (error) {
      console.error('[useViewMode] Failed to retrieve from localStorage:', error);
    }
  }, [key]);

  const toggleViewMode = () => {
    const nextMode: ViewMode = viewMode === 'table' ? 'card' : 'table';
    setViewMode(nextMode);
    try {
      localStorage.setItem(key, nextMode);
    } catch (error) {
      console.error('[useViewMode] Failed to save to localStorage:', error);
    }
  };

  const setExplicitViewMode = (mode: ViewMode) => {
    if (mode === 'table' || mode === 'card') {
      setViewMode(mode);
      try {
        localStorage.setItem(key, mode);
      } catch (error) {
        console.error('[useViewMode] Failed to save to localStorage:', error);
      }
    }
  };

  return { viewMode, toggleViewMode, setExplicitViewMode, isMounted };
}
