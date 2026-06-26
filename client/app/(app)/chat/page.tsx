'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Search, Filter, ShoppingBag, ArrowLeft,
  ChevronRight, Calendar, IndianRupee, Loader2, Sparkles,
  MapPin, ShieldCheck, Truck, CheckCircle2, User, Building, Info,
  Package
} from 'lucide-react';
import { ordersApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { formatCurrency, cn } from '@/lib/utils';
import OrderChat from '@/components/orders/OrderChat';
import { Card, CardContent } from '@/components/ui/card';
import { useChatStore } from '@/store/useChatStore';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAppStore();
  const { t } = useLanguageStore();
  const userRole = user?.role?.toUpperCase() || 'FARMER';
  const markAsRead = useChatStore((state) => state.markAsRead);
  const unreadOrders = useChatStore((state) => state.unreadOrders);

  // Selected order state
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'completed'>('active');

  // Fetch orders
  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'chat-page'],
    queryFn: () => ordersApi.getAll({ limit: 100 }).then(r => r.data.data),
    staleTime: 60 * 1000,
  });

  const orders = data?.orders || [];

  // Sync selectedOrderId from query param
  useEffect(() => {
    const orderIdParam = searchParams.get('orderId');
    if (orderIdParam) {
      setSelectedOrderId(orderIdParam);
      markAsRead(orderIdParam);
    }
  }, [searchParams, markAsRead]);

  // Filter orders
  const filteredOrders = orders.filter((order: any) => {
    const isSales = order.farmerId?._id === user?._id || 
                    (typeof order.farmerId === 'string' && order.farmerId === user?._id) ||
                    (userRole === 'FARMER' && order.buyerId?._id !== user?._id);
    const category = isSales ? 'sales' : 'purchases';

    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((i: any) => i.cropName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (isSales ? order.buyerId?.name : order.farmerId?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const isCompleted = ['delivered', 'cancelled'].includes(order.status);
    
    if (filterType === 'active' && isCompleted) return false;
    if (filterType === 'completed' && !isCompleted) return false;

    return matchesSearch;
  });

  const selectedOrder = orders.find((o: any) => o._id === selectedOrderId);

  // Mark selected order as read when it changes
  useEffect(() => {
    if (selectedOrderId) {
      markAsRead(selectedOrderId);
    }
  }, [selectedOrderId, markAsRead]);

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    // Update URL query param silently
    router.replace(`/chat?orderId=${orderId}`);
  };

  const getUnreadCount = (orderId: string) => {
    const unread = unreadOrders.find(u => u.orderId === orderId);
    return unread?.unreadCount || 0;
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-6.5rem)] rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-xl">
      {/* Left Pane: Chat List */}
      <div className={cn(
        "w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30",
        selectedOrderId && "hidden md:flex" // Hide on mobile when chat is active
      )}>
        {/* Search & Header */}
        <div className="p-4 space-y-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
              B2B Messages
            </h1>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search chat or order no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 pl-10 pr-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none dark:text-white"
            />
          </div>

          {/* Filters */}
          <div className="flex bg-slate-100 dark:bg-slate-800/60 p-0.5 rounded-lg text-[10px] font-bold">
            <button
              onClick={() => setFilterType('active')}
              className={cn(
                "flex-1 py-1.5 rounded-md",
                filterType === 'active' 
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-500"
              )}
            >
              Active
            </button>
            <button
              onClick={() => setFilterType('completed')}
              className={cn(
                "flex-1 py-1.5 rounded-md",
                filterType === 'completed' 
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-500"
              )}
            >
              Completed
            </button>
            <button
              onClick={() => setFilterType('all')}
              className={cn(
                "flex-1 py-1.5 rounded-md",
                filterType === 'all' 
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-500"
              )}
            >
              All
            </button>
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40 p-2 space-y-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              <span className="text-xs text-slate-400 font-bold">Loading chats...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 space-y-2 mt-8">
              <ShoppingBag className="h-8 w-8 mx-auto opacity-40" />
              <p className="text-xs font-bold">No active conversations</p>
              <p className="text-[10px]">Create an order or place bids on the B2B Marketplace to start chatting.</p>
            </div>
          ) : (
            filteredOrders.map((order: any) => {
              const isSelected = order._id === selectedOrderId;
              const isSales = order.farmerId?._id === user?._id || 
                              (typeof order.farmerId === 'string' && order.farmerId === user?._id) ||
                              (userRole === 'FARMER' && order.buyerId?._id !== user?._id);
              const otherParty = isSales ? order.buyerId : order.farmerId;
              const otherPartyName = otherParty?.name || 'Unknown User';
              const lastMsg = order.messageHistory?.[order.messageHistory.length - 1];
              const unreadCount = getUnreadCount(order._id);

              return (
                <button
                  key={order._id}
                  onClick={() => handleSelectOrder(order._id)}
                  className={cn(
                    "w-full flex gap-3 p-3 rounded-2xl transition-all text-left group",
                    isSelected 
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10" 
                      : "hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-200"
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm",
                    isSelected 
                      ? "bg-white/20 text-white" 
                      : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                  )}>
                    {otherPartyName.charAt(0).toUpperCase()}
                  </div>

                  {/* Info details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-start">
                      <p className={cn(
                        "text-xs font-black truncate",
                        isSelected ? "text-white" : "text-slate-900 dark:text-white"
                      )}>
                        {otherPartyName}
                      </p>
                      <span className={cn(
                        "text-[9px] font-bold whitespace-nowrap",
                        isSelected ? "text-white/80" : "text-slate-400"
                      )}>
                        {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>

                    <div className="flex justify-between items-center gap-1.5">
                      <p className={cn(
                        "text-[10px] font-bold truncate leading-snug",
                        isSelected ? "text-white/90" : "text-slate-900 dark:text-white"
                      )}>
                        {order.items?.[0]?.cropName || 'Order'} - {order.items?.[0]?.quantity} {order.items?.[0]?.unit}
                      </p>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
                        isSelected 
                          ? "bg-white/20 text-white" 
                          : isSales 
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" 
                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      )}>
                        {isSales ? 'Sales' : 'Purchase'}
                      </span>
                    </div>

                    {lastMsg ? (
                      <p className={cn(
                        "text-[10px] truncate leading-normal",
                        isSelected ? "text-white/70" : "text-slate-500 dark:text-slate-400"
                      )}>
                        {lastMsg.message}
                      </p>
                    ) : (
                      <p className={cn(
                        "text-[10px] italic",
                        isSelected ? "text-white/60" : "text-slate-400"
                      )}>
                        No messages yet
                      </p>
                    )}
                  </div>

                  {/* Unread badge count */}
                  {unreadCount > 0 && !isSelected && (
                    <div className="self-center shrink-0">
                      <span className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black animate-pulse shadow-md">
                        {unreadCount}
                      </span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane: Chat Window / Empty State */}
      <div className={cn(
        "flex-1 flex flex-col bg-white dark:bg-slate-950 relative",
        !selectedOrderId && "hidden md:flex" // Hide on mobile when no chat is active
      )}>
        {selectedOrder ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header info */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-950 shadow-sm z-10 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {/* Back button on mobile */}
                <button
                  onClick={() => setSelectedOrderId(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl md:hidden shrink-0"
                >
                  <ArrowLeft className="h-5 w-5 text-slate-500" />
                </button>

                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                  {((userRole === 'FARMER' ? selectedOrder.buyerId?.name : selectedOrder.farmerId?.name) || 'U').charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <h2 className="text-sm font-black text-slate-950 dark:text-white truncate">
                    {userRole === 'FARMER' ? selectedOrder.buyerId?.name : selectedOrder.farmerId?.name || 'Unknown counterparty'}
                  </h2>
                  <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span>Order: #{selectedOrder.orderNumber}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                    <span className="text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{selectedOrder.status}</span>
                  </p>
                </div>
              </div>

              {/* Order quick overview */}
              <div className="hidden lg:flex items-center gap-6 border-l border-slate-200 dark:border-slate-800 pl-6 text-xs">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Agreed Total</p>
                  <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
                    {formatCurrency(selectedOrder.totalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Product</p>
                  <p className="font-black text-slate-700 dark:text-slate-300 mt-0.5 truncate max-w-[120px]">
                    {selectedOrder.items?.[0]?.cropName || 'N/A'} ({selectedOrder.items?.[0]?.quantity} {selectedOrder.items?.[0]?.unit})
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">State</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-[9px] uppercase tracking-wider border border-emerald-100 dark:border-emerald-950">
                    {selectedOrder.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Embedded OrderChat widget */}
            <div className="flex-1 overflow-hidden flex flex-col p-4 bg-slate-50/50 dark:bg-slate-900/10">
              <OrderChat
                orderId={selectedOrder._id}
                orderNumber={selectedOrder.orderNumber}
                messages={selectedOrder.messageHistory || []}
                otherPartyName={userRole === 'FARMER' ? selectedOrder.buyerId?.name : selectedOrder.farmerId?.name}
                otherPartyRole={userRole === 'FARMER' ? 'BUYER' : 'FARMER'}
                isExpanded={true}
                className="h-full"
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/20 dark:bg-slate-900/10">
            <div className="max-w-md text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <Sparkles className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Secure B2B Messaging</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Select a B2B order from the sidebar to chat directly with the buyer or farmer. You can coordinate pricing, verify transport vehicles, check certification details, and share delivery photos in real-time.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-950">
                <ShieldCheck className="h-4.5 w-4.5" /> Direct Farmer-Buyer Channel
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
