/**
 * Lightweight Zustand store for sidebar badge counts.
 * Updated by useSocket (single source of truth) — no extra API calls needed.
 * Sidebar reads from here instead of making its own socket or API requests.
 */
import { create } from 'zustand';

interface NotificationStore {
  pendingNegotiationCount: number;
  pendingOrderCount: number;

  // Called by useSocket when a new negotiation or order arrives
  incrementNegotiationBadge: () => void;
  incrementOrderBadge: () => void;

  // Called when user visits the page or when queries resolve exact counts
  setNegotiationBadge: (count: number) => void;
  setOrderBadge: (count: number) => void;

  clearNegotiationBadge: () => void;
  clearOrderBadge: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  pendingNegotiationCount: 0,
  pendingOrderCount: 0,

  incrementNegotiationBadge: () =>
    set((s) => ({ pendingNegotiationCount: s.pendingNegotiationCount + 1 })),

  incrementOrderBadge: () =>
    set((s) => ({ pendingOrderCount: s.pendingOrderCount + 1 })),

  setNegotiationBadge: (count) => set({ pendingNegotiationCount: count }),
  setOrderBadge:       (count) => set({ pendingOrderCount: count }),

  clearNegotiationBadge: () => set({ pendingNegotiationCount: 0 }),
  clearOrderBadge:       () => set({ pendingOrderCount: 0 }),
}));
