import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  _id: string;
  name: string;
  email: string;
  // Uppercase to match backend enum (FARMER | BUYER | ADMIN).
  // .toUpperCase() guards are used in comparisons to handle any old
  // lowercase values that may still be in localStorage.
  role: 'FARMER' | 'BUYER' | 'ADMIN' | string;
  tenantId: string;
  farmName?: string;
  farmLocation?: { lat?: number; lng?: number; address?: string } | string;
  farmSizeAcres?: number;
  phoneNumber?: string;
  avatar?: string;
}

export interface OrderNotification {
  id: string;
  type: 'NEW_ORDER' | 'ORDER_STATUS_UPDATE' | 'NEW_MESSAGE' | 'CROP_ALERT' | 'AI_ANALYSIS_COMPLETE';
  message: string;
  payload: Record<string, unknown>;
  timestamp: string;
  isRead: boolean;
}

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Notifications
  notifications: OrderNotification[];
  unreadCount: number;

  // UI
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  isAnalyzing: boolean; // AI processing state
  uploadProgress: number;

  // Actions
  setUser: (user: User, token: string) => void;
  clearUser: () => void;
  addNotification: (notification: Omit<OrderNotification, 'id' | 'isRead'>) => void;
  markAllRead: () => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setUploadProgress: (progress: number) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth state
      user: null,
      token: null,
      isAuthenticated: false,

      // Notification state
      notifications: [],
      unreadCount: 0,

      // UI state
      isSidebarOpen: true,
      isSidebarCollapsed: false,
      isAnalyzing: false,
      uploadProgress: 0,

      // ── Auth Actions ──────────────────────────────────────────────────────
      setUser: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('agrivision_token', token);
          localStorage.setItem('agrivision_user', JSON.stringify(user));
        }
        set({ user, token, isAuthenticated: true });
      },

      clearUser: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('agrivision_token');
          localStorage.removeItem('agrivision_user');
        }
        set({ user: null, token: null, isAuthenticated: false, notifications: [], unreadCount: 0 });
      },

      // ── Notification Actions ──────────────────────────────────────────────
      addNotification: (notif) => {
        const newNotif: OrderNotification = {
          ...notif,
          id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          isRead: false,
        };
        set((state) => ({
          notifications: [newNotif, ...state.notifications].slice(0, 50), // keep last 50
          unreadCount: state.unreadCount + 1,
        }));
      },

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        })),

      markNotificationRead: (id) =>
        set((state) => {
          const updated = state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          );
          const unread = updated.filter((n) => !n.isRead).length;
          return { notifications: updated, unreadCount: unread };
        }),

      clearNotifications: () => set({ notifications: [], unreadCount: 0 }),

      // ── UI Actions ────────────────────────────────────────────────────────
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      toggleSidebarCollapse: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
      setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
      setUploadProgress: (progress) => set({ uploadProgress: progress }),
    }),
    {
      name: 'agrivision-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ─────────────────────────────────────────────────────────────────────────────
// Convenience selectors
// ─────────────────────────────────────────────────────────────────────────────

export const selectUser = (state: AppState) => state.user;
export const selectIsAuthenticated = (state: AppState) => state.isAuthenticated;
export const selectNotifications = (state: AppState) => state.notifications;
export const selectUnreadCount = (state: AppState) => state.unreadCount;
export const selectIsSidebarOpen = (state: AppState) => state.isSidebarOpen;
