'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, ChevronRight, Loader2, Bell } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { useFloatingChat } from '@/hooks/useFloatingChat';
import { ordersApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

export default function ChatLauncher() {
  const { user } = useAppStore();
  const userRole = user?.role?.toUpperCase() || 'FARMER';
  const { sessions, openFloatingChat } = useFloatingChat();
  const unreadOrders = useChatStore((state) => state.unreadOrders);
  const totalUnreadCount = useChatStore((state) => state.totalUnreadCount);
  const markAsRead = useChatStore((state) => state.markAsRead);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  // Fetch recent orders for quick chat access
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders-recent-chat'],
    queryFn: () => ordersApi.getAll({ limit: 10 }).then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  const orders = ordersData?.orders || [];
  
  // Active orders that can be chatted about (all non-terminal B2B statuses)
  const activeOrders = orders.filter((o: any) =>
    ['pending', 'confirmed', 'processing', 'negotiating', 'deal_confirmed',
     'ready_for_pickup', 'picked_up', 'in_transit'].includes(o.status)
  );

  // Animation effect when new message arrives
  useEffect(() => {
    if (totalUnreadCount > 0) {
      setHasNewMessage(true);
      const timer = setTimeout(() => setHasNewMessage(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [totalUnreadCount]);

  // Sort by most recent activity
  const sortedOrders = [...activeOrders].sort((a: any, b: any) => 
    new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
  );
  
  // Merge unread info with orders for display
  const getUnreadCountForOrder = (orderId: string) => {
    const unread = unreadOrders.find(u => u.orderId === orderId);
    return unread?.unreadCount || 0;
  };
  
  // Sort unread orders to the top
  const sortedOrdersWithUnread = [...sortedOrders].sort((a: any, b: any) => {
    const aUnread = getUnreadCountForOrder(a._id);
    const bUnread = getUnreadCountForOrder(b._id);
    return bUnread - aUnread;
  });

  return (
    <>
      {/* Floating launcher button */}
      <div className="fixed right-4 bottom-20 z-[80]">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className="absolute bottom-16 right-0 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    <h3 className="font-semibold">Quick Chat</h3>
                    {totalUnreadCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded-full text-xs font-bold animate-pulse">
                        {totalUnreadCount} new
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs opacity-80 mt-1">
                  {userRole === 'FARMER' ? 'Chat with buyers' : 'Chat with farmers'}
                </p>
              </div>

              {/* Unread Messages Section */}
              {unreadOrders.length > 0 && (
                <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-red-50/50 dark:bg-red-900/10">
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                    <Bell className="h-3 w-3" />
                    New Messages ({totalUnreadCount})
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {unreadOrders.map((unread) => (
                      <button
                        key={unread.orderId}
                        onClick={() => {
                          const order = sortedOrders.find((o: any) => o._id === unread.orderId);
                          const otherPartyName = order
                            ? (userRole === 'FARMER'
                                ? (order as any).buyerId?.name
                                : (order as any).farmerId?.name)
                            : unread.otherPartyName;
                          openFloatingChat({
                            orderId: unread.orderId,
                            orderNumber: unread.orderNumber,
                            otherPartyName: otherPartyName || unread.otherPartyName,
                            otherPartyRole: unread.otherPartyRole,
                            // Pass actual messages so the chat widget shows history
                            messages: (order as any)?.messageHistory || [],
                          });
                          markAsRead(unread.orderId);
                          setIsExpanded(false);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg bg-red-100/50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-red-200 dark:bg-red-800 flex items-center justify-center text-red-600 dark:text-red-300 text-sm font-bold">
                          {unread.otherPartyName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {unread.otherPartyName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {unread.lastMessage}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-bold">
                          {unread.unreadCount}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Chats */}
              {sessions.length > 0 && (
                <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                    Active Chats ({sessions.length})
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {sessions.map((session) => {
                      const unreadForSession = session.unreadCount || 0;
                      return (
                        <button
                          key={session.id}
                          onClick={() => {
                            if (session.isMinimized) {
                              useChatStore.getState().restoreChat(session.id);
                            } else {
                              useChatStore.getState().focusChat(session.id);
                            }
                            markAsRead(session.orderId);
                            setIsExpanded(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-2 p-2 rounded-lg transition-colors text-left",
                            unreadForSession > 0 
                              ? "bg-red-50 dark:bg-red-900/20" 
                              : "hover:bg-slate-100 dark:hover:bg-slate-800"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                            unreadForSession > 0
                              ? "bg-red-200 dark:bg-red-800 text-red-600 dark:text-red-300"
                              : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                          )}>
                            {session.otherPartyName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {session.otherPartyName}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              #{session.orderNumber}
                            </p>
                          </div>
                          {unreadForSession > 0 ? (
                            <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-xs font-bold">
                              {unreadForSession}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Orders */}
              <div className="p-3">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  Recent Orders
                </p>
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  </div>
                ) : sortedOrdersWithUnread.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
                    No active orders to chat about
                  </p>
                ) : (
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {sortedOrdersWithUnread.map((order: any) => {
                      const otherPartyName = userRole === 'FARMER' 
                        ? order.buyerId?.name 
                        : order.farmerId?.name;
                      const isOpen = sessions.some(s => s.orderId === order._id);
                      const unreadCount = getUnreadCountForOrder(order._id);
                      
                      return (
                        <button
                          key={order._id}
                          onClick={() => {
                            openFloatingChat({
                              orderId: order._id,
                              orderNumber: order.orderNumber,
                              otherPartyName: otherPartyName || 'Unknown',
                              otherPartyRole: userRole === 'FARMER' ? 'BUYER' : 'FARMER',
                              messages: order.messageHistory || [],
                            });
                            if (unreadCount > 0) {
                              markAsRead(order._id);
                            }
                            setIsExpanded(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-2 p-2 rounded-lg transition-colors text-left",
                            unreadCount > 0 
                              ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                              : isOpen 
                                ? "bg-emerald-50 dark:bg-emerald-900/20" 
                                : "hover:bg-slate-100 dark:hover:bg-slate-800"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                            unreadCount > 0 
                              ? "bg-red-200 dark:bg-red-800 text-red-600 dark:text-red-300"
                              : isOpen 
                                ? "bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300" 
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          )}>
                            {otherPartyName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {otherPartyName || 'Unknown'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              #{order.orderNumber} • {order.status}
                            </p>
                          </div>
                          {unreadCount > 0 ? (
                            <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-xs font-bold animate-pulse">
                              {unreadCount}
                            </span>
                          ) : isOpen ? (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400">
                              Open
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* View All Orders Link */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                <a
                  href="/orders"
                  className="flex items-center justify-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
                >
                  View All Orders
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main launcher button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "relative p-4 rounded-full shadow-lg transition-all",
            isExpanded 
              ? "bg-slate-700 dark:bg-slate-600 text-white" 
              : totalUnreadCount > 0
                ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
          )}
        >
          {isExpanded ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageSquare className="h-6 w-6" />
          )}
          
          {/* Notification badge for unread messages */}
          {totalUnreadCount > 0 && !isExpanded && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md border-2 border-white dark:border-slate-900"
            >
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </motion.span>
          )}
          
          {/* Active sessions badge */}
          {sessions.length > 0 && totalUnreadCount === 0 && !isExpanded && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">
              {sessions.length > 9 ? '9+' : sessions.length}
            </span>
          )}
        </motion.button>

        {/* Pulse animation for new messages */}
        {hasNewMessage && !isExpanded && (
          <motion.span 
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 rounded-full bg-red-400 pointer-events-none" 
          />
        )}
        
        {/* Animated ring for unread messages */}
        {totalUnreadCount > 0 && !isExpanded && (
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 rounded-full border-2 border-red-400 pointer-events-none"
          />
        )}
      </div>
    </>
  );
}
