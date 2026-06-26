'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingCart, Package, Truck, CheckCircle, Clock, X, XCircle,
  ChevronDown, ChevronUp, MapPin, Phone,
  Calendar, IndianRupee, Filter, Search, ExternalLink, AlertTriangle, Popcorn,
  MessageSquare
} from 'lucide-react';
import { ordersApi, negotiationApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguageStore } from '@/store/useLanguageStore';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import { showErrorToast } from '@/lib/errorHandler';
import OrderChat from '@/components/orders/OrderChat';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useFloatingChat } from '@/hooks/useFloatingChat';

interface Order {
  _id: string;
  orderNumber: string;
  status: 'pending' | 'negotiating' | 'deal_confirmed' | 'ready_for_pickup' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  totalAmount: number;
  items: Array<{
    cropName: string;
    variety: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    totalPrice: number;
  }>;
  buyerId?: {
    _id?: string;
    name: string;
    email: string;
    phoneNumber: string;
  };
  farmerId?: {
    _id?: string;
    name: string;
    email: string;
    farmName: string;
    farmLocation: { address: string };
    phoneNumber?: string;
  };
  shippingAddress: {
    street?: string;
    address?: string;
    city: string;
    state: string;
    pinCode?: string;
    pin?: string;
    district?: string;
    taluka?: string;
    country?: string;
  };
  deliveryDate?: string;
  trackingNumber?: string;
  notes?: string;
  messageHistory: Array<{
    senderId: string;
    message: string;
    timestamp: string;
  }>;
  createdAt: string;
}

const statusConfig: Record<string, { 
  color: string; 
  icon: typeof Clock; 
  label: string; 
  description: string;
  farmerAction: string;
  buyerAction: string;
}> = {
  pending: { 
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', 
    icon: Clock,
    label: 'Pending',
    description: 'Order placed, waiting for farmer confirmation',
    farmerAction: 'Review and confirm the deal',
    buyerAction: 'Waiting for farmer to confirm'
  },
  negotiating: { 
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', 
    icon: MessageSquare,
    label: 'Negotiating',
    description: 'Price/quantity negotiation in progress',
    farmerAction: 'Respond to buyer offer',
    buyerAction: 'Waiting for farmer response'
  },
  deal_confirmed: { 
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', 
    icon: CheckCircle,
    label: 'Deal Confirmed',
    description: 'Both parties confirmed the deal',
    farmerAction: 'Prepare goods for pickup',
    buyerAction: 'Arrange transport & confirm deal'
  },
  ready_for_pickup: { 
    color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', 
    icon: Package,
    label: 'Ready for Pickup',
    description: 'Goods ready, awaiting buyer pickup',
    farmerAction: 'Goods prepared and ready',
    buyerAction: 'Arrange pickup & transport'
  },
  picked_up: { 
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', 
    icon: Truck,
    label: 'Picked Up',
    description: 'Goods picked up, in transit',
    farmerAction: 'Handed over to transporter',
    buyerAction: 'Goods collected from farm'
  },
  in_transit: { 
    color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', 
    icon: Truck,
    label: 'In Transit',
    description: 'Goods being transported to destination',
    farmerAction: 'Tracking delivery progress',
    buyerAction: 'Monitor shipment arrival'
  },
  delivered: { 
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', 
    icon: CheckCircle,
    label: 'Delivered',
    description: 'Order delivered successfully',
    farmerAction: 'Order completed - payment pending',
    buyerAction: 'Received goods - complete payment'
  },
  cancelled: { 
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', 
    icon: X,
    label: 'Cancelled',
    description: 'Order has been cancelled',
    farmerAction: 'Order cancelled, inventory restored',
    buyerAction: 'Order cancelled'
  },
};

const statusFlow = ['pending', 'negotiating', 'deal_confirmed', 'ready_for_pickup', 'picked_up', 'in_transit', 'delivered'];

// Status permissions - matches backend logic
// PENDING: Farmer can confirm/cancel, Buyer can cancel
// NEGOTIATING: Both can counter/accept/reject
// DEAL_CONFIRMED: Both confirm deal, then ready for pickup
// READY_FOR_PICKUP: Buyer arranges transport
// PICKED_UP: Buyer verifies weight/quantity
// IN_TRANSIT: Transport in progress
// DELIVERED: Final state
const statusPermissions: Record<'farmer' | 'buyer', Record<string, string[]>> = {
  farmer: {
    pending: ['deal_confirmed', 'cancelled'],
    negotiating: ['deal_confirmed', 'cancelled'],
    deal_confirmed: [],
    ready_for_pickup: [],
    picked_up: [],
    in_transit: [],
    delivered: [],
    cancelled: []
  },
  buyer: {
    pending: ['cancelled'],
    negotiating: ['deal_confirmed', 'cancelled'],
    deal_confirmed: ['ready_for_pickup', 'cancelled'],
    ready_for_pickup: ['picked_up', 'cancelled'],
    picked_up: ['in_transit', 'cancelled'],
    in_transit: ['delivered'],
    delivered: [],
    cancelled: []
  }
};

export default function OrdersPage() {
  const { t } = useLanguageStore();
  const queryClient = useQueryClient();
  const { user } = useAppStore();
  const userRole = user?.role?.toUpperCase() || 'FARMER';
  const { openFloatingChat, isChatOpen } = useFloatingChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeView, setActiveView] = useState<'active' | 'delivered' | 'cancelled'>('active');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'sales' | 'purchases'>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'success' | 'warning' | 'info';
    confirmText: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'info', confirmText: 'Confirm' });

  // Fetch orders
  const { data, isLoading } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: () => ordersApi.getAll({ status: statusFilter || undefined, limit: 50 }).then(r => r.data.data),
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['orders', 'stats'],
    queryFn: () => ordersApi.getStats().then(r => r.data.data),
  });

  const orders: Order[] = data?.orders || [];
  const stats = statsData?.stats || [];

  // Filter orders - show active orders by default
  const activeStatuses = ['pending', 'negotiating', 'deal_confirmed', 'ready_for_pickup', 'picked_up', 'in_transit'];
  
  const getOrderCategory = (order: Order) => {
    const isSales = order.farmerId?._id === user?._id || 
                    (typeof order.farmerId === 'string' && order.farmerId === user?._id) ||
                    (userRole === 'FARMER' && order.buyerId?._id !== user?._id);
    return isSales ? 'sales' : 'purchases';
  };

  const salesOrders = orders.filter(o => getOrderCategory(o) === 'sales');
  const purchaseOrders = orders.filter(o => getOrderCategory(o) === 'purchases');

  const filteredByView = orders.filter(order => {
    let matchesView = true;
    if (activeView === 'active') matchesView = activeStatuses.includes(order.status);
    else if (activeView === 'delivered') matchesView = order.status === 'delivered';
    else if (activeView === 'cancelled') matchesView = order.status === 'cancelled';
    
    if (!matchesView) return false;

    const category = getOrderCategory(order);
    if (orderTypeFilter === 'sales') return category === 'sales';
    if (orderTypeFilter === 'purchases') return category === 'purchases';
    return true;
  });
  
  // Further filter by search and status filter
  const filteredOrders = filteredByView.filter(order => {
    const matchesSearch = !searchQuery || 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(i => i.cropName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    negotiating: orders.filter(o => o.status === 'negotiating').length,
    dealConfirmed: orders.filter(o => o.status === 'deal_confirmed').length,
    readyForPickup: orders.filter(o => o.status === 'ready_for_pickup').length,
    pickedUp: orders.filter(o => o.status === 'picked_up').length,
    inTransit: orders.filter(o => o.status === 'in_transit').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalRevenue: orders
      .filter(o => ['deal_confirmed', 'ready_for_pickup', 'picked_up', 'in_transit', 'delivered'].includes(o.status))
      .reduce((sum, o) => sum + o.totalAmount, 0),
  };

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      ordersApi.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Status updated successfully');
    },
    onError: (error) => showErrorToast(error, 'Update Failed'),
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: (id: string) => ordersApi.updateStatus(id, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order cancelled successfully');
    },
    onError: (error) => showErrorToast(error, 'Cancel Failed'),
  });

  // B2B Deal Confirmation
  const confirmDealMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => ordersApi.confirmDeal(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Deal confirmed successfully');
    },
    onError: (error) => showErrorToast(error, 'Confirmation Failed'),
  });

  // Update Procurement
  const updateProcurementMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => 
      ordersApi.updateProcurement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Procurement details updated');
    },
    onError: (error) => showErrorToast(error, 'Update Failed'),
  });

  // Verify Pickup
  const verifyPickupMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => 
      ordersApi.verifyPickup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Pickup verified successfully');
    },
    onError: (error) => showErrorToast(error, 'Verification Failed'),
  });

  // Mark In Transit
  const markInTransitMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data?: Record<string, unknown> }) => 
      ordersApi.markInTransit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order marked as in transit');
    },
    onError: (error) => showErrorToast(error, 'Update Failed'),
  });

  // Mark Delivered
  const markDeliveredMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data?: Record<string, unknown> }) => 
      ordersApi.markDelivered(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order marked as delivered');
    },
    onError: (error) => showErrorToast(error, 'Update Failed'),
  });
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {userRole === 'FARMER' ? 'Orders Management' : 'My Orders'}
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          {userRole === 'FARMER' ? 'Manage orders from buyers' : 'Track your purchases'}
        </p>
      </div>

      {/* Stats Cards - Slim Design */}
      <div className="grid gap-3 grid-cols-4 sm:grid-cols-4 lg:grid-cols-8">
        {[
          { label: 'Total', value: orderStats.total, icon: ShoppingCart, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
          { label: 'Pending', value: orderStats.pending, icon: Clock, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
          { label: 'Negotiating', value: orderStats.negotiating, icon: MessageSquare, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
          { label: 'Deal Confirmed', value: orderStats.dealConfirmed, icon: CheckCircle, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
          { label: 'Ready', value: orderStats.readyForPickup, icon: Package, color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400' },
          { label: 'Picked Up', value: orderStats.pickedUp, icon: Truck, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
          { label: 'In Transit', value: orderStats.inTransit, icon: Truck, color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
          { label: 'Delivered', value: orderStats.delivered, icon: CheckCircle, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
        ].map((stat, i) => (
          <Card key={i} className="dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="p-3">
              <div className="flex flex-col items-center text-center gap-1">
                <div className={cn("p-1.5 rounded-lg", stat.color)}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Tabs - Active / Delivered / Cancelled - Now below stats cards */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveView('active')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all",
            activeView === 'active'
              ? "bg-emerald-600 text-white shadow-lg"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300"
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <Package className="h-4 w-4" />
            Active Orders
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs",
              activeView === 'active' ? "bg-white/20" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            )}>
              {orderStats.pending + orderStats.negotiating + orderStats.dealConfirmed + orderStats.readyForPickup + orderStats.pickedUp + orderStats.inTransit}
            </span>
          </span>
        </button>
        <button
          onClick={() => setActiveView('delivered')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all",
            activeView === 'delivered'
              ? "bg-emerald-600 text-white shadow-lg"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300"
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Delivered
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs",
              activeView === 'delivered' ? "bg-white/20" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            )}>
              {orderStats.delivered}
            </span>
          </span>
        </button>
        <button
          onClick={() => setActiveView('cancelled')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all",
            activeView === 'cancelled'
              ? "bg-red-600 text-white shadow-lg"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-red-300"
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <XCircle className="h-4 w-4" />
            Cancelled
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs",
              activeView === 'cancelled' ? "bg-white/20" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}>
              {orderStats.cancelled}
            </span>
          </span>
        </button>
      </div>

      {/* Order Type Category Toggle */}
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 max-w-lg">
        <button
          onClick={() => setOrderTypeFilter('all')}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg font-medium text-xs transition-all",
            orderTypeFilter === 'all'
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          )}
        >
          All Orders ({orders.length})
        </button>
        <button
          onClick={() => setOrderTypeFilter('sales')}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-1.5",
            orderTypeFilter === 'sales'
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          )}
        >
          <span className={cn("w-1.5 h-1.5 rounded-full", orderTypeFilter === 'sales' ? "bg-white" : "bg-emerald-500")} />
          Sales Orders ({salesOrders.length})
        </button>
        <button
          onClick={() => setOrderTypeFilter('purchases')}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-1.5",
            orderTypeFilter === 'purchases'
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          )}
        >
          <span className={cn("w-1.5 h-1.5 rounded-full", orderTypeFilter === 'purchases' ? "bg-white" : "bg-blue-500")} />
          Purchase Orders ({purchaseOrders.length})
        </button>
      </div>

      {/* Filters */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 pl-10 pr-4 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:bg-slate-800 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="negotiating">Negotiating</option>
              <option value="deal_confirmed">Deal Confirmed</option>
              <option value="ready_for_pickup">Ready for Pickup</option>
              <option value="picked_up">Picked Up</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-12 text-center">
            <ShoppingCart className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="mt-4 text-slate-500 dark:text-slate-400">No orders found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const status = statusConfig[order.status];
            const StatusIcon = status.icon;
            const isExpanded = expandedOrder === order._id;
            const category = getOrderCategory(order);
            const isSalesOrder = category === 'sales';
            const counterpartyName = isSalesOrder 
              ? (order.buyerId?.name || 'Unknown Buyer') 
              : (order.farmerId?.farmName || order.farmerId?.name || 'Unknown Seller');
            
            return (
              <motion.div
                key={order._id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card 
                  className={cn(
                    "dark:bg-slate-900 dark:border-slate-800 cursor-pointer border-l-4 transition-all duration-200 shadow-sm hover:shadow-md",
                    isSalesOrder 
                      ? "border-l-emerald-500 hover:border-l-emerald-600" 
                      : "border-l-blue-500 hover:border-l-blue-600"
                  )}
                  onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                >
                  {/* Order Header */}
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-lg", status.color)}>
                          <StatusIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              #{order.orderNumber}
                            </h3>
                            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border", isSalesOrder ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500/20" : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-500/20")}>
                              {isSalesOrder ? 'Sales' : 'Purchase'}
                            </span>
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", status.color)}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {isSalesOrder ? `Buyer: ${counterpartyName}` : `Seller: ${counterpartyName}`}
                            {' · '}
                            {new Date(order.createdAt).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(order.totalAmount)}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {order.items.length} item{order.items.length > 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Current Status Above Progress Bar */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={cn("h-4 w-4", order.status === 'cancelled' ? "text-red-500" : "text-emerald-500")} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {statusConfig[order.status].label}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {statusConfig[order.status].description}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex gap-1">
                        {statusFlow.map((s, i) => {
                          const currentIndex = statusFlow.indexOf(order.status);
                          const isActive = order.status === 'cancelled' ? false : i <= currentIndex;
                          const isCurrent = s === order.status;
                          
                          return (
                            <div
                              key={s}
                              className={cn(
                                "flex-1 h-2 rounded-full transition-colors",
                                order.status === 'cancelled' 
                                  ? (isCurrent ? "bg-red-500" : "bg-slate-200 dark:bg-slate-700")
                                  : isActive ? (isCurrent ? "bg-emerald-500" : "bg-emerald-300") : "bg-slate-200 dark:bg-slate-700"
                              )}
                            />
                          );
                        })}
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-slate-400">
                        <span>Pending</span>
                        <span>Delivered</span>
                      </div>
                    </div>

                    {/* Quick Actions for Farmers with Pending/Negotiating/Deal_confirmed Orders */}
                    {(order.status === 'pending' || order.status === 'negotiating' || order.status === 'deal_confirmed') && userRole === 'FARMER' && (
                      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800" onClick={(e) => e.stopPropagation()}>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          {order.status === 'deal_confirmed' ? 'Deal in progress — Confirm your side to proceed' : 'Action Required'}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDialog({
                                isOpen: true,
                                title: 'Confirm Deal',
                                message: `Confirm deal for order #${order.orderNumber}? This will lock in the agreement and proceed to pickup arrangement.`,
                                confirmText: 'Confirm Deal',
                                variant: 'success',
                                onConfirm: () => {
                                  confirmDealMutation.mutate({ id: order._id, notes: 'Deal confirmed by farmer' });
                                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                }
                              });
                            }}
                            disabled={confirmDealMutation.isPending}
                            className="flex-1 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            {confirmDealMutation.isPending ? 'Confirming...' : 'Confirm Deal'}
                          </button>
                          {order.status !== 'deal_confirmed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'Decline Order',
                                  message: `Decline order #${order.orderNumber}? The inventory will be restored and the buyer will be notified.`,
                                  confirmText: 'Decline Order',
                                  variant: 'danger',
                                  onConfirm: () => {
                                    cancelOrderMutation.mutate(order._id);
                                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                  }
                                });
                              }}
                              disabled={cancelOrderMutation.isPending}
                              className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                            >
                              <X className="h-4 w-4" />
                              Decline
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Quick Actions for Buyers with Deal Confirmed Orders */}
                    {userRole === 'BUYER' && order.status === 'deal_confirmed' && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800" onClick={(e) => e.stopPropagation()}>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                          🤝 Deal confirmed! Arrange pickup now?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                title: 'Arrange Pickup',
                                message: 'Mark order as Ready for Pickup? The farmer will prepare the goods.',
                                confirmText: 'Arrange Pickup',
                                variant: 'success',
                                onConfirm: () => {
                                  updateStatusMutation.mutate({ id: order._id, status: 'ready_for_pickup' });
                                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                }
                              });
                            }}
                            disabled={updateStatusMutation.isPending}
                            className="flex-1 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <Truck className="h-4 w-4" />
                            Arrange Pickup
                          </button>
                          <button
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                title: 'Cancel Order',
                                message: 'Cancel this order? The inventory will be restored and the farmer will be notified.',
                                confirmText: 'Cancel Order',
                                variant: 'danger',
                                onConfirm: () => {
                                  cancelOrderMutation.mutate(order._id);
                                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                }
                              });
                            }}
                            disabled={cancelOrderMutation.isPending}
                            className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Quick Actions for Buyers with Ready for Pickup Orders */}
                    {userRole === 'BUYER' && order.status === 'ready_for_pickup' && (
                      <div className="mt-4 p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800" onClick={(e) => e.stopPropagation()}>
                        <p className="text-sm font-medium text-cyan-800 dark:text-cyan-300 mb-2">
                          📦 Goods ready! Verify pickup details?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                title: 'Verify Pickup',
                                message: 'Confirm goods picked up and verify quantity/weight?',
                                confirmText: 'Verify Pickup',
                                variant: 'success',
                                onConfirm: () => {
                                  verifyPickupMutation.mutate({ 
                                    id: order._id, 
                                    data: { actualQuantity: order.items[0]?.quantity, qualityCheckPassed: true }
                                  });
                                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                }
                              });
                            }}
                            disabled={verifyPickupMutation.isPending}
                            className="flex-1 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <Package className="h-4 w-4" />
                            Verify Pickup
                          </button>
                          <button
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                title: 'Cancel Order',
                                message: 'Cancel this order? The inventory will be restored.',
                                confirmText: 'Cancel Order',
                                variant: 'danger',
                                onConfirm: () => {
                                  cancelOrderMutation.mutate(order._id);
                                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                }
                              });
                            }}
                            disabled={cancelOrderMutation.isPending}
                            className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Quick Actions for Buyers with Picked Up Orders */}
                    {userRole === 'BUYER' && order.status === 'picked_up' && (
                      <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800" onClick={(e) => e.stopPropagation()}>
                        <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-2">
                          🚚 Goods picked up! Mark as in transit?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                title: 'Mark In Transit',
                                message: 'Mark order as In Transit? Add tracking details if available.',
                                confirmText: 'Mark In Transit',
                                variant: 'success',
                                onConfirm: () => {
                                  markInTransitMutation.mutate({ id: order._id });
                                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                }
                              });
                            }}
                            disabled={markInTransitMutation.isPending}
                            className="flex-1 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <Truck className="h-4 w-4" />
                            Mark In Transit
                          </button>
                          <button
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                title: 'Cancel Order',
                                message: 'Cancel this order? The inventory will be restored.',
                                confirmText: 'Cancel Order',
                                variant: 'danger',
                                onConfirm: () => {
                                  cancelOrderMutation.mutate(order._id);
                                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                }
                              });
                            }}
                            disabled={cancelOrderMutation.isPending}
                            className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Quick Actions for Buyers with In Transit Orders */}
                    {userRole === 'BUYER' && order.status === 'in_transit' && (
                      <div className="mt-4 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800" onClick={(e) => e.stopPropagation()}>
                        <p className="text-sm font-medium text-violet-800 dark:text-violet-300 mb-2">
                          🚚 Order is on the way!
                        </p>
                        <button
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              title: 'Confirm Delivery',
                              message: 'Confirm delivery of this order? This will mark the order as complete.',
                              confirmText: 'Confirm Delivery',
                              variant: 'success',
                              onConfirm: () => {
                                markDeliveredMutation.mutate({ id: order._id });
                                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                              }
                            });
                          }}
                          disabled={markDeliveredMutation.isPending}
                          className="w-full px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Confirm Delivery
                        </button>
                      </div>
                    )}

                    {/* Expanded Details */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Items */}
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white mb-2">Items</h4>
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                              >
                                <div>
                                  <p className="font-medium text-slate-900 dark:text-white">{item.cropName}</p>
                                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.variety}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-slate-600 dark:text-slate-300">
                                    {item.quantity} {item.unit}
                                  </p>
                                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                                    {formatCurrency(item.totalPrice)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Shipping Details */}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {userRole === 'FARMER' ? 'Buyer Details' : 'Shipping Address'}
                            </h4>
                            {userRole === 'FARMER' && order.buyerId ? (
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                  {order.buyerId.name}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                  {order.buyerId.email}
                                </p>
                                {order.buyerId.phoneNumber && (
                                  <p className="text-sm text-slate-600 dark:text-slate-300">
                                    {order.buyerId.phoneNumber}
                                  </p>
                                )}
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 border-t pt-2 leading-relaxed">
                                  {order.shippingAddress.street || order.shippingAddress.address || 'No Street Address'}
                                  {(order.shippingAddress.taluka || order.shippingAddress.district) && (
                                    <>
                                      <br />
                                      {order.shippingAddress.taluka ? `Taluka: ${order.shippingAddress.taluka}` : ''}
                                      {order.shippingAddress.taluka && order.shippingAddress.district ? ', ' : ''}
                                      {order.shippingAddress.district ? `Dist: ${order.shippingAddress.district}` : ''}
                                    </>
                                  )}
                                  <br />
                                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pinCode || order.shippingAddress.pin || ''}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                {order.shippingAddress.street || order.shippingAddress.address || 'No Street Address'}
                                {(order.shippingAddress.taluka || order.shippingAddress.district) && (
                                  <>
                                    <br />
                                    {order.shippingAddress.taluka ? `Taluka: ${order.shippingAddress.taluka}` : ''}
                                    {order.shippingAddress.taluka && order.shippingAddress.district ? ', ' : ''}
                                    {order.shippingAddress.district ? `Dist: ${order.shippingAddress.district}` : ''}
                                  </>
                                )}
                                <br />
                                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pinCode || order.shippingAddress.pin || ''}
                              </p>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {userRole === 'BUYER' ? 'Farmer Details' : 'Contact'}
                            </h4>
                            {userRole === 'BUYER' && order.farmerId ? (
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                  {order.farmerId.name}
                                </p>
                                {order.farmerId.farmName && (
                                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                    {order.farmerId.farmName}
                                  </p>
                                )}
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                  {order.farmerId.email}
                                </p>
                                {order.farmerId.phoneNumber && (
                                  <p className="text-sm text-slate-600 dark:text-slate-300">
                                    {order.farmerId.phoneNumber}
                                  </p>
                                )}
                              </div>
                            ) : (
                              order.buyerId && (
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                  {order.buyerId.name}<br />
                                  {order.buyerId.phoneNumber}
                                </p>
                              )
                            )}
                          </div>
                        </div>

                        {/* Status Update Section */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <h4 className="font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                            {userRole === 'FARMER' ? (
                              <><Package className="h-4 w-4" /> Order Actions</>
                            ) : (
                              <><Truck className="h-4 w-4" /> Update Order Status</>
                            )}
                          </h4>
                          
                          {/* Current Status Info */}
                          <div className="mb-3 p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                              {(() => {
                                const config = statusConfig[order.status];
                                const IconComponent = config.icon;
                                return (
                                  <>
                                    <IconComponent className={cn("h-4 w-4", order.status === 'cancelled' ? "text-red-500" : "text-emerald-500")} />
                                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                                      {config.label}
                                    </span>
                                  </>
                                );
                              })()}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {statusConfig[order.status].description}
                            </p>
                          </div>
                          
                          {/* Get allowed actions for current role and status */}
                          {(() => {
                            const roleKey = userRole.toLowerCase() as 'farmer' | 'buyer';
                            const allowedActions = statusPermissions[roleKey]?.[order.status] || [];
                            
                            if (order.status === 'delivered') {
                              return (
                                <div className="flex items-center gap-2 p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                    Order completed successfully!
                                  </span>
                                </div>
                              );
                            }
                            
                            if (order.status === 'cancelled') {
                              return (
                                <div className="flex items-center gap-2 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                  <XCircle className="h-5 w-5 text-red-600" />
                                  <span className="text-sm font-medium text-red-700 dark:text-red-400">
                                    This order has been cancelled
                                  </span>
                                </div>
                              );
                            }
                            
                            if (allowedActions.length === 0) {
                              return (
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                  <Clock className="h-4 w-4" />
                                  {userRole === 'FARMER' 
                                    ? statusConfig[order.status].farmerAction
                                    : statusConfig[order.status].buyerAction
                                  }
                                </div>
                              );
                            }
                            
                            return (
                              <div className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                  {allowedActions.map((action) => {
                                    const actionConfig = statusConfig[action];
                                    const IconComponent = actionConfig.icon;
                                    const isCancel = action === 'cancelled';
                                    
                                    return (
                                      <button
                                        key={action}
                                        onClick={() => {
                                          setConfirmDialog({
                                            isOpen: true,
                                            title: isCancel ? 'Cancel Order' : `Mark as ${actionConfig.label}`,
                                            message: isCancel
                                              ? 'Are you sure you want to cancel this order? This action cannot be undone and inventory will be restored.'
                                              : `Mark order as ${actionConfig.label}?`,
                                            confirmText: isCancel ? 'Cancel Order' : `Mark as ${actionConfig.label}`,
                                            variant: isCancel ? 'danger' : 'success',
                                            onConfirm: () => {
                                              updateStatusMutation.mutate({ id: order._id, status: action });
                                              setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                            }
                                          });
                                        }}
                                        disabled={updateStatusMutation.isPending}
                                        className={cn(
                                          "px-4 py-2 text-sm rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50",
                                          isCancel 
                                            ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                                        )}
                                      >
                                        <IconComponent className="h-4 w-4" />
                                        {isCancel ? 'Cancel Order' : `Mark as ${actionConfig.label}`}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Messages - Using OrderChat Component */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Order Chat</span>
                            <button
                              onClick={() => {
                                openFloatingChat({
                                  orderId: order._id,
                                  orderNumber: order.orderNumber,
                                  otherPartyName: (userRole === 'FARMER' ? order.buyerId?.name : order.farmerId?.name) || 'Unknown',
                                  otherPartyRole: userRole === 'FARMER' ? 'BUYER' : 'FARMER',
                                  messages: order.messageHistory || [],
                                });
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                            >
                              <Popcorn className="h-3.5 w-3.5" />
                              Popout Chat
                            </button>
                          </div>
                          <OrderChat
                            orderId={order._id}
                            orderNumber={order.orderNumber}
                            messages={order.messageHistory || []}
                            otherPartyName={userRole === 'FARMER' ? order.buyerId?.name : order.farmerId?.name}
                            otherPartyRole={userRole === 'FARMER' ? 'BUYER' : 'FARMER'}
                            isExpanded={true}
                            className="h-[450px]"
                          />
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
      
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        isLoading={updateStatusMutation.isPending}
      />
    </motion.div>
  );
}
