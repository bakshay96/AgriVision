'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import { useQueryClient } from '@tanstack/react-query';
import { useChatStore, UnreadMessageInfo } from '@/store/useChatStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socketInstance: Socket | null = null;

export const useSocket = () => {
  const { user, addNotification } = useAppStore();
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const { addUnreadMessage, sessions, isChatOpen } = useChatStore();

  useEffect(() => {
    if (!user) return;

    // Create or reuse singleton connection
    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    }

    socketRef.current = socketInstance;
    const socket = socketInstance;

    socket.emit('join_tenant', user.tenantId);
    socket.emit('join_user', user._id);

    // ── Event Handlers ────────────────────────────────────────────────────
    const handleNewOrder = (data: { payload: Record<string, unknown>; timestamp: string }) => {
      const { payload } = data;
      const msg = `New order #${payload.orderNumber} from ${payload.buyerName} — ₹${payload.totalAmount}`;
      addNotification({ type: 'NEW_ORDER', message: msg, payload, timestamp: data.timestamp });
      toast.success(msg, { 
        icon: '🛒', 
        duration: 6000,
        action: {
          label: 'View',
          onClick: () => window.location.href = '/orders',
        },
      });
    };

    const handleOrderUpdate = (data: { payload: Record<string, unknown>; timestamp: string }) => {
      const { payload } = data;
      const msg = `Order #${payload.orderNumber} is now ${String(payload.status).replace('_', ' ')}`;
      addNotification({ type: 'ORDER_STATUS_UPDATE', message: msg, payload, timestamp: data.timestamp });
      toast.success(msg, { icon: '📦' });
      // Invalidate orders query to refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    };

    const handleNewMessage = (data: { payload: Record<string, unknown>; timestamp: string }) => {
      const { payload } = data;
      const senderName = String(payload.senderName || 'Someone');
      const orderId = String(payload.orderId || '');
      const orderNumber = String(payload.orderNumber || '');
      const senderRole = String(payload.senderRole || 'BUYER');
      const messageText = String(payload.message || '').substring(0, 50) || 'New message';
      
      // Add to unread messages
      const unreadInfo: UnreadMessageInfo = {
        orderId,
        orderNumber,
        otherPartyName: senderName,
        otherPartyRole: senderRole === 'FARMER' ? 'FARMER' : 'BUYER',
        unreadCount: 1,
        lastMessage: messageText,
        lastMessageTime: data.timestamp,
      };
      
      // Check if chat is open and visible
      const session = sessions.find(s => s.orderId === orderId);
      const isVisible = session && !session.isMinimized;
      
      if (!isVisible) {
        // Only add to unread if chat is not visible
        addUnreadMessage(unreadInfo);
      }
      
      const msg = `💬 ${senderName}: ${messageText}`;
      addNotification({ 
        type: 'NEW_MESSAGE', 
        message: msg, 
        payload, 
        timestamp: data.timestamp 
      });
      
      // Show toast notification
      toast.success(msg, { 
        icon: '💬',
        duration: 5000,
        action: {
          label: 'Reply',
          onClick: () => {
            // Will navigate to orders where they can open chat
            window.location.href = '/orders';
          },
        },
      });
      
      // Invalidate orders query to refetch messages
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders-recent-chat'] });
    };

    const handleCropAlert = (data: { payload: Record<string, unknown>; timestamp: string }) => {
      const msg = String(data.payload.message || 'Crop health alert!');
      addNotification({ type: 'CROP_ALERT', message: msg, payload: data.payload, timestamp: data.timestamp });
      toast.error(msg, { duration: 8000 });
    };

    const handleAIComplete = (data: { payload: Record<string, unknown>; timestamp: string }) => {
      const { payload } = data;
      const msg = `AI Analysis done: ${payload.disease} detected (${payload.confidence}% confidence)`;
      addNotification({ type: 'AI_ANALYSIS_COMPLETE', message: msg, payload, timestamp: data.timestamp });
      toast.success(msg, { icon: '🤖' });
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_status_update', handleOrderUpdate);
    socket.on('new_message', handleNewMessage);
    socket.on('crop_alert', handleCropAlert);
    socket.on('ai_analysis_complete', handleAIComplete);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order_status_update', handleOrderUpdate);
      socket.off('new_message', handleNewMessage);
      socket.off('crop_alert', handleCropAlert);
      socket.off('ai_analysis_complete', handleAIComplete);
    };
  }, [user, addNotification, queryClient, addUnreadMessage, sessions]);

  return socketRef.current;
};
