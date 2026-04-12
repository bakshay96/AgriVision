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
  const { addUnreadMessage, sessions, isChatOpen, updateChatMessages, appendChatMessage } = useChatStore();
  const currentUserId = user?._id?.toString();

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
      const senderId = String(payload.senderId || '');
      const fullMessage = String(payload.message || '');
      const timestamp = String(payload.timestamp || data.timestamp || new Date().toISOString());

      // ── Always push the message into the open session for live rendering ──
      // This makes both sender and receiver see new messages in real-time.
      const session = sessions.find(s => s.orderId === orderId);
      if (session) {
        appendChatMessage(orderId, {
          _id: String(payload.messageId || ''),
          senderId,
          senderName,
          senderRole,
          message: fullMessage,
          timestamp,
        });
      }

      // ── Skip unread tracking if the message is from the current user ──
      if (senderId && currentUserId && senderId === currentUserId) {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['orders-recent-chat'] });
        return;
      }

      // ── Add to unread only if the chat is not currently open & visible ──
      const isVisible = session && !session.isMinimized;
      if (!isVisible) {
        const unreadInfo: UnreadMessageInfo = {
          orderId,
          orderNumber,
          otherPartyName: senderName,
          otherPartyRole: senderRole === 'FARMER' ? 'FARMER' : 'BUYER',
          unreadCount: 1,
          lastMessage: messageText,
          lastMessageTime: data.timestamp,
        };
        addUnreadMessage(unreadInfo);
      }

      const msg = `💬 ${senderName}: ${messageText}`;
      addNotification({
        type: 'NEW_MESSAGE',
        message: msg,
        payload,
        timestamp: data.timestamp
      });

      // Show toast notification (only for messages from others)
      toast.success(msg, {
        icon: '💬',
        duration: 5000,
        action: {
          label: 'Reply',
          onClick: () => {
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

    const handleNegotiationUpdate = (data: { payload: Record<string, unknown>; timestamp: string }) => {
      const { payload } = data;
      const action = String(payload.action || '');
      const negId = String(payload.negotiationId || '');

      // Invalidate negotiation queries for real-time refresh
      queryClient.invalidateQueries({ queryKey: ['negotiations'] });
      queryClient.invalidateQueries({ queryKey: ['negotiation-detail', negId] });
      queryClient.invalidateQueries({ queryKey: ['negotiations', 'widget'] });

      if (action === 'message') {
        // Silent update — just refresh data
      } else if (action === 'accepted') {
        const msg = 'Negotiation accepted — order has been created!';
        addNotification({ type: 'ORDER_STATUS_UPDATE', message: msg, payload, timestamp: data.timestamp });
        toast.success(msg, { icon: '🤝', duration: 6000, action: { label: 'Orders', onClick: () => { window.location.href = '/orders'; } } });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      } else if (action === 'counter') {
        const msg = 'Counter offer received on your negotiation';
        addNotification({ type: 'ORDER_STATUS_UPDATE', message: msg, payload, timestamp: data.timestamp });
        toast.info(msg, { icon: '💰', duration: 5000, action: { label: 'View', onClick: () => { window.location.href = '/negotiations'; } } });
      } else if (action === 'rejected') {
        const msg = 'A negotiation has been rejected';
        addNotification({ type: 'ORDER_STATUS_UPDATE', message: msg, payload, timestamp: data.timestamp });
        toast.error(msg, { icon: '❌' });
      }
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_status_update', handleOrderUpdate);
    socket.on('new_message', handleNewMessage);
    socket.on('crop_alert', handleCropAlert);
    socket.on('ai_analysis_complete', handleAIComplete);
    socket.on('negotiation_update', handleNegotiationUpdate);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order_status_update', handleOrderUpdate);
      socket.off('new_message', handleNewMessage);
      socket.off('crop_alert', handleCropAlert);
      socket.off('ai_analysis_complete', handleAIComplete);
      socket.off('negotiation_update', handleNegotiationUpdate);
    };
  }, [user, addNotification, queryClient, addUnreadMessage, sessions, currentUserId, updateChatMessages, appendChatMessage]);

  return socketRef.current;
};
