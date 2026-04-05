import { create } from 'zustand';

export interface ChatMessage {
  _id?: string;
  senderId: string | { _id: string };
  senderName?: string;
  senderRole?: string;
  message: string;
  timestamp: string;
  isRead?: boolean;
}

export interface FloatingChatSession {
  id: string;
  orderId: string;
  orderNumber: string;
  otherPartyName: string;
  otherPartyRole: 'FARMER' | 'BUYER';
  messages: ChatMessage[];
  position: { x: number; y: number };
  isMinimized: boolean;
  zIndex: number;
  unreadCount: number;
}

export interface UnreadMessageInfo {
  orderId: string;
  orderNumber: string;
  otherPartyName: string;
  otherPartyRole: 'FARMER' | 'BUYER';
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

interface ChatStore {
  sessions: FloatingChatSession[];
  maxZIndex: number;
  unreadOrders: UnreadMessageInfo[];
  totalUnreadCount: number;
  
  // Actions
  openChat: (session: Omit<FloatingChatSession, 'position' | 'isMinimized' | 'zIndex' | 'unreadCount'>) => void;
  closeChat: (id: string) => void;
  minimizeChat: (id: string) => void;
  restoreChat: (id: string) => void;
  focusChat: (id: string) => void;
  updateChatPosition: (id: string, position: { x: number; y: number }) => void;
  updateChatMessages: (id: string, messages: ChatMessage[]) => void;
  isChatOpen: (orderId: string) => boolean;
  markAsRead: (orderId: string) => void;
  addUnreadMessage: (info: UnreadMessageInfo) => void;
  removeUnreadOrder: (orderId: string) => void;
  incrementUnread: (orderId: string) => void;
}

// Default positions for multiple chat windows
const getDefaultPosition = (index: number): { x: number; y: number } => {
  const baseX = window.innerWidth - 380;
  const baseY = 100;
  const offset = index * 30;
  return { 
    x: Math.max(20, baseX - offset), 
    y: Math.min(baseY + offset, window.innerHeight - 500) 
  };
};

export const useChatStore = create<ChatStore>((set, get) => ({
  sessions: [],
  maxZIndex: 100,
  unreadOrders: [],
  totalUnreadCount: 0,

  openChat: (session) => {
    const { sessions, maxZIndex, unreadOrders } = get();
    
    // Check if chat already exists for this order
    const existingIndex = sessions.findIndex(s => s.orderId === session.orderId);
    
    if (existingIndex !== -1) {
      // Focus existing chat and mark as read
      const updatedSessions = [...sessions];
      updatedSessions[existingIndex] = {
        ...updatedSessions[existingIndex],
        isMinimized: false,
        zIndex: maxZIndex + 1,
        unreadCount: 0,
      };
      // Remove from unread orders
      const newUnreadOrders = unreadOrders.filter(u => u.orderId !== session.orderId);
      const newTotalUnread = newUnreadOrders.reduce((sum, u) => sum + u.unreadCount, 0);
      set({ 
        sessions: updatedSessions, 
        maxZIndex: maxZIndex + 1,
        unreadOrders: newUnreadOrders,
        totalUnreadCount: newTotalUnread,
      });
      return;
    }

    // Calculate position for new chat
    const position = getDefaultPosition(sessions.length);

    const newSession: FloatingChatSession = {
      ...session,
      position,
      isMinimized: false,
      zIndex: maxZIndex + 1,
      unreadCount: 0,
    };

    // Remove from unread orders when opening chat
    const newUnreadOrders = unreadOrders.filter(u => u.orderId !== session.orderId);
    const newTotalUnread = newUnreadOrders.reduce((sum, u) => sum + u.unreadCount, 0);

    set({ 
      sessions: [...sessions, newSession],
      maxZIndex: maxZIndex + 1,
      unreadOrders: newUnreadOrders,
      totalUnreadCount: newTotalUnread,
    });
  },

  closeChat: (id) => {
    set((state) => ({
      sessions: state.sessions.filter(s => s.id !== id),
    }));
  },

  minimizeChat: (id) => {
    set((state) => ({
      sessions: state.sessions.map(s => 
        s.id === id ? { ...s, isMinimized: true } : s
      ),
    }));
  },

  restoreChat: (id) => {
    const { sessions, maxZIndex, unreadOrders, totalUnreadCount } = get();
    const session = sessions.find(s => s.id === id);
    
    if (session) {
      // Clear unread count for this session
      const sessionId = session.orderId;
      const unreadInfo = unreadOrders.find(u => u.orderId === sessionId);
      const newUnreadOrders = unreadOrders.filter(u => u.orderId !== sessionId);
      const newTotalUnread = totalUnreadCount - (unreadInfo?.unreadCount || 0);
      
      set({
        sessions: sessions.map(s => 
          s.id === id ? { ...s, isMinimized: false, zIndex: maxZIndex + 1, unreadCount: 0 } : s
        ),
        maxZIndex: maxZIndex + 1,
        unreadOrders: newUnreadOrders,
        totalUnreadCount: Math.max(0, newTotalUnread),
      });
    } else {
      set({
        sessions: sessions.map(s => 
          s.id === id ? { ...s, isMinimized: false, zIndex: maxZIndex + 1 } : s
        ),
        maxZIndex: maxZIndex + 1,
      });
    }
  },

  focusChat: (id) => {
    const { sessions, maxZIndex } = get();
    set({
      sessions: sessions.map(s => 
        s.id === id ? { ...s, zIndex: maxZIndex + 1 } : s
      ),
      maxZIndex: maxZIndex + 1,
    });
  },

  updateChatPosition: (id, position) => {
    set((state) => ({
      sessions: state.sessions.map(s => 
        s.id === id ? { ...s, position } : s
      ),
    }));
  },

  updateChatMessages: (id, messages) => {
    set((state) => ({
      sessions: state.sessions.map(s => 
        s.id === id ? { ...s, messages } : s
      ),
    }));
  },

  isChatOpen: (orderId) => {
    return get().sessions.some(s => s.orderId === orderId);
  },

  markAsRead: (orderId) => {
    const { sessions, unreadOrders, totalUnreadCount } = get();
    
    // Update session unread count
    const updatedSessions = sessions.map(s => 
      s.orderId === orderId ? { ...s, unreadCount: 0 } : s
    );
    
    // Remove from unread orders
    const unreadInfo = unreadOrders.find(u => u.orderId === orderId);
    const newUnreadOrders = unreadOrders.filter(u => u.orderId !== orderId);
    const newTotalUnread = totalUnreadCount - (unreadInfo?.unreadCount || 0);
    
    set({ 
      sessions: updatedSessions,
      unreadOrders: newUnreadOrders,
      totalUnreadCount: Math.max(0, newTotalUnread),
    });
  },

  addUnreadMessage: (info) => {
    const { unreadOrders, totalUnreadCount, sessions } = get();
    
    // Check if chat is open and not minimized
    const openSession = sessions.find(s => s.orderId === info.orderId);
    if (openSession && !openSession.isMinimized) {
      // Chat is open and visible, don't add to unread
      return;
    }
    
    const existingIndex = unreadOrders.findIndex(u => u.orderId === info.orderId);
    
    if (existingIndex !== -1) {
      const updatedUnreadOrders = [...unreadOrders];
      updatedUnreadOrders[existingIndex] = {
        ...updatedUnreadOrders[existingIndex],
        unreadCount: updatedUnreadOrders[existingIndex].unreadCount + 1,
        lastMessage: info.lastMessage,
        lastMessageTime: info.lastMessageTime,
      };
      set({ 
        unreadOrders: updatedUnreadOrders,
        totalUnreadCount: totalUnreadCount + 1,
      });
    } else {
      set({ 
        unreadOrders: [...unreadOrders, { ...info, unreadCount: 1 }],
        totalUnreadCount: totalUnreadCount + 1,
      });
    }
    
    // Also update session if it exists but is minimized
    if (openSession) {
      set({
        sessions: sessions.map(s => 
          s.orderId === info.orderId 
            ? { ...s, unreadCount: s.unreadCount + 1 } 
            : s
        ),
      });
    }
  },

  removeUnreadOrder: (orderId) => {
    const { unreadOrders, totalUnreadCount } = get();
    const unreadInfo = unreadOrders.find(u => u.orderId === orderId);
    const newUnreadOrders = unreadOrders.filter(u => u.orderId !== orderId);
    const newTotalUnread = totalUnreadCount - (unreadInfo?.unreadCount || 0);
    
    set({
      unreadOrders: newUnreadOrders,
      totalUnreadCount: Math.max(0, newTotalUnread),
    });
  },

  incrementUnread: (orderId) => {
    const { sessions, totalUnreadCount } = get();
    const session = sessions.find(s => s.orderId === orderId);
    
    if (session && session.isMinimized) {
      set({
        sessions: sessions.map(s => 
          s.orderId === orderId 
            ? { ...s, unreadCount: s.unreadCount + 1 } 
            : s
        ),
        totalUnreadCount: totalUnreadCount + 1,
      });
    }
  },
}));
