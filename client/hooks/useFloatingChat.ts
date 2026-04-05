import { useCallback } from 'react';
import { useChatStore, FloatingChatSession } from '@/store/useChatStore';

// Generate unique ID without uuid package
const generateId = () => `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

interface OpenChatOptions {
  orderId: string;
  orderNumber: string;
  otherPartyName: string;
  otherPartyRole: 'FARMER' | 'BUYER';
  messages: FloatingChatSession['messages'];
}

export function useFloatingChat() {
  const openChat = useChatStore((state) => state.openChat);
  const isChatOpen = useChatStore((state) => state.isChatOpen);
  const sessions = useChatStore((state) => state.sessions);

  const openFloatingChat = useCallback((options: OpenChatOptions) => {
    const sessionId = generateId();
    
    openChat({
      id: sessionId,
      orderId: options.orderId,
      orderNumber: options.orderNumber,
      otherPartyName: options.otherPartyName,
      otherPartyRole: options.otherPartyRole,
      messages: options.messages || [],
    });
  }, [openChat]);

  const getChatSession = useCallback((orderId: string) => {
    return sessions.find(s => s.orderId === orderId);
  }, [sessions]);

  return {
    openFloatingChat,
    isChatOpen,
    getChatSession,
    sessions,
  };
}
