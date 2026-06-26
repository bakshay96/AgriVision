'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import { useQueryClient } from '@tanstack/react-query';
import { useChatStore, UnreadMessageInfo } from '@/store/useChatStore';
import { useNotificationStore } from '@/store/useNotificationStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

// Module-level singleton — one socket for the entire app lifetime
let socketInstance: Socket | null = null;

export const useSocket = () => {
  const { user, addNotification } = useAppStore();
  const socketRef  = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  // ── Chat store references via refs so that the main useEffect NEVER
  //    re-runs just because a chat message arrived (sessions changes).
  //    This prevents handler stacking (duplicate event listeners).
  const addUnreadMessageRef   = useRef(useChatStore.getState().addUnreadMessage);
  const appendChatMessageRef  = useRef(useChatStore.getState().appendChatMessage);
  const sessionsRef           = useRef(useChatStore.getState().sessions);

  // Keep refs in sync without triggering re-renders
  useEffect(() => {
    return useChatStore.subscribe((state) => {
      addUnreadMessageRef.current  = state.addUnreadMessage;
      appendChatMessageRef.current = state.appendChatMessage;
      sessionsRef.current          = state.sessions;
    });
  }, []);

  // ── Notification badge store (no re-render trigger on socket events)
  const incrementNegotiationBadge = useRef(useNotificationStore.getState().incrementNegotiationBadge);
  const incrementOrderBadge       = useRef(useNotificationStore.getState().incrementOrderBadge);
  useEffect(() => {
    return useNotificationStore.subscribe((state) => {
      incrementNegotiationBadge.current = state.incrementNegotiationBadge;
      incrementOrderBadge.current       = state.incrementOrderBadge;
    });
  }, []);

  const currentUserIdRef = useRef(user?._id?.toString() ?? '');
  useEffect(() => {
    currentUserIdRef.current = user?._id?.toString() ?? '';
  }, [user?._id]);

  // ── Main socket effect — runs ONLY when user changes ────────────────────
  useEffect(() => {
    if (!user) return;

    // Reuse a single socket for the entire app — never create a second one
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

    // ── Event Handlers ─────────────────────────────────────────────────────
    const handleNewOrder = (data: { payload: Record<string, unknown>; timestamp: string }) => {
      const { payload } = data;
      const msg = `New order #${payload.orderNumber} from ${payload.buyerName} — ₹${payload.totalAmount}`;
      addNotification({ type: 'NEW_ORDER', message: msg, payload, timestamp: data.timestamp });
      toast.success(msg, {
        icon: '🛒',
        duration: 6000,
        action: { label: 'View', onClick: () => { window.location.href = '/orders'; } },
      });
      // Increment sidebar badge for orders
      if (!window.location.pathname.includes('/orders')) {
        incrementOrderBadge.current();
      }
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'notifications'] });
    };

    const handleOrderUpdate = (data: { payload: Record<string, unknown>; timestamp: string }) => {
      const { payload } = data;
      const msg = `Order #${payload.orderNumber} is now ${String(payload.status).replace(/_/g, ' ')}`;
      addNotification({ type: 'ORDER_STATUS_UPDATE', message: msg, payload, timestamp: data.timestamp });
      toast.success(msg, { icon: '📦' });
      // Invalidate ALL orders-related query keys so every component stays fresh
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'notifications'] });
    };

    const handleNewMessage = (data: { payload: Record<string, unknown>; timestamp: string }) => {
      const { payload }   = data;
      const senderName    = String(payload.senderName || 'Someone');
      const orderId       = String(payload.orderId || '');
      const orderNumber   = String(payload.orderNumber || '');
      const senderRole    = String(payload.senderRole || 'BUYER');
      const messageText   = String(payload.message || '').substring(0, 50) || 'New message';
      const senderId      = String(payload.senderId || '');
      const fullMessage   = String(payload.message || '');
      const timestamp     = String(payload.timestamp || data.timestamp || new Date().toISOString());

      // ── Always append to open session for live chat rendering ──────────
      const session = sessionsRef.current.find(s => s.orderId === orderId);
      if (session) {
        appendChatMessageRef.current(orderId, {
          _id:        String(payload.messageId || ''),
          senderId,
          senderName,
          senderRole,
          message:    fullMessage,
          timestamp,
        });
      }

      const msgObj = {
        _id: String(payload.messageId || ''),
        senderId,
        senderName,
        senderRole,
        message: fullMessage,
        timestamp,
      };

      const updateCache = (oldData: any) => {
        if (!oldData) return oldData;
        const updateList = (list: any[]) => list.map((o: any) => {
          if (o._id === orderId) {
            const history = o.messageHistory || [];
            const exists = history.some((m: any) => 
              m._id === msgObj._id || 
              (m.timestamp === msgObj.timestamp && (typeof m.senderId === 'string' ? m.senderId : m.senderId?._id) === msgObj.senderId)
            );
            if (exists) return o;
            return { ...o, messageHistory: [...history, msgObj] };
          }
          return o;
        });

        if (Array.isArray(oldData)) return updateList(oldData);
        if (oldData.orders) return { ...oldData, orders: updateList(oldData.orders) };
        return oldData;
      };

      // ── Do not count own messages as unread ────────────────────────────
      if (senderId && currentUserIdRef.current && senderId === currentUserIdRef.current) {
        queryClient.setQueriesData({ queryKey: ['orders'] }, updateCache);
        return;
      }

      // ── Add to unread only when chat is not visible ────────────────────
      const isVisible = session && !session.isMinimized;
      if (!isVisible) {
        const unreadInfo: UnreadMessageInfo = {
          orderId,
          orderNumber,
          otherPartyName: senderName,
          otherPartyRole: senderRole === 'FARMER' ? 'FARMER' : 'BUYER',
          unreadCount:    1,
          lastMessage:    messageText,
          lastMessageTime: data.timestamp,
        };
        addUnreadMessageRef.current(unreadInfo);
      }

      const msg = `💬 ${senderName}: ${messageText}`;
      addNotification({ type: 'NEW_MESSAGE', message: msg, payload, timestamp: data.timestamp });

      toast.success(msg, {
        icon: '💬',
        duration: 5000,
        action: { label: 'Reply', onClick: () => { window.location.href = '/orders'; } },
      });

      queryClient.setQueriesData({ queryKey: ['orders'] }, updateCache);
    };

    const handleCropAlert = (data: { payload: Record<string, unknown>; timestamp: string }) => {
      const msg = String(data.payload.message || 'Crop health alert!');
      addNotification({ type: 'CROP_ALERT', message: msg, payload: data.payload, timestamp: data.timestamp });
      toast.error(msg, { duration: 8000 });
      queryClient.invalidateQueries({ queryKey: ['user', 'notifications'] });
    };

    const handleAIComplete = (data: { payload: Record<string, unknown>; timestamp: string }) => {
      const { payload } = data;
      const msg = `AI Analysis done: ${payload.disease} detected (${payload.confidence}% confidence)`;
      addNotification({ type: 'AI_ANALYSIS_COMPLETE', message: msg, payload, timestamp: data.timestamp });
      toast.success(msg, { icon: '🤖' });
      queryClient.invalidateQueries({ queryKey: ['user', 'notifications'] });
    };

    const handleNegotiationUpdate = (data: { payload: Record<string, unknown>; timestamp: string }) => {
      const { payload } = data;
      const action  = String(payload.action || '');
      const negId   = String(payload.negotiationId || '');

      queryClient.invalidateQueries({ queryKey: ['negotiations'] });
      queryClient.invalidateQueries({ queryKey: ['negotiation-detail', negId] });

      if (action === 'new' || action === 'counter') {
        // Add badge only if user is away from negotiations page
        if (!window.location.pathname.includes('/negotiations')) {
          incrementNegotiationBadge.current();
        }
      }

      if (action === 'message') {
        // silent — just refresh data
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
      queryClient.invalidateQueries({ queryKey: ['user', 'notifications'] });
    };

    const handleSystemNotification = (data: { type: string; payload: Record<string, unknown>; timestamp: string }) => {
      const { payload, type } = data;
      const msg = String(payload.message || 'System Notification');
      addNotification({ type: 'SYSTEM', message: msg, payload, timestamp: data.timestamp });
      toast.info(msg, { icon: '🔔', duration: 8000 });
      queryClient.invalidateQueries({ queryKey: ['user', 'notifications'] });
    };

    socket.on('new_order',           handleNewOrder);
    socket.on('order_status_update', handleOrderUpdate);
    socket.on('new_message',         handleNewMessage);
    socket.on('crop_alert',          handleCropAlert);
    socket.on('ai_analysis_complete', handleAIComplete);
    socket.on('negotiation_update',  handleNegotiationUpdate);
    socket.on('system_notification', handleSystemNotification);

    return () => {
      socket.off('new_order',           handleNewOrder);
      socket.off('order_status_update', handleOrderUpdate);
      socket.off('new_message',         handleNewMessage);
      socket.off('crop_alert',          handleCropAlert);
      socket.off('ai_analysis_complete', handleAIComplete);
      socket.off('negotiation_update',  handleNegotiationUpdate);
      socket.off('system_notification', handleSystemNotification);
    };

  // ⚠️ Intentionally excludes `sessions` and chat store methods from deps.
  // They are accessed via refs, so the effect never re-runs on message receipt.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, addNotification, queryClient]);

  return socketRef.current;
};
