'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingCart, Package, Truck, CheckCircle, Clock, X, XCircle,
  ChevronDown, ChevronUp, MapPin, Phone,
  Calendar, IndianRupee, Filter, Search, ExternalLink, AlertTriangle, Popcorn
} from 'lucide-react';
import { ordersApi } from '@/lib/api';
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
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
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
    name: string;
    email: string;
    phoneNumber: string;
  };
  farmerId?: {
    name: string;
    email: string;
    farmName: string;
    farmLocation: { address: string };
    phoneNumber?: string;
  };
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    pin: string;
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
    farmerAction: 'Confirm or cancel this order',
    buyerAction: 'Waiting for farmer to confirm'
  },
  confirmed: { 
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', 
    icon: CheckCircle,
    label: 'Confirmed',
    description: 'Farmer has confirmed the order',
    farmerAction: 'Waiting for buyer to process',
    buyerAction: 'Mark as Processing or cancel'
  },
  processing: { 
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', 
    icon: Package,
    label: 'Processing',
    description: 'Order is being prepared',
    farmerAction: 'Order is being processed by buyer',
    buyerAction: 'Mark as Shipped or cancel'
  },
  shipped: { 
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', 
    icon: Truck,
    label: 'Shipped',
    description: 'Order is in transit',
    farmerAction: 'Order has been shipped',
    buyerAction: 'Mark as Delivered when received'
  },
  delivered: { 
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', 
    icon: CheckCircle,
    label: 'Delivered',
    description: 'Order delivered successfully',
    farmerAction: 'Order completed',
    buyerAction: 'Order received'
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

const statusFlow = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

// Status permissions - matches backend logic
// PENDING: Farmer can confirm/cancel, Buyer can cancel
// CONFIRMED: Buyer can process/cancel
// PROCESSING: Buyer can ship/cancel
// SHIPPED: Buyer can mark delivered
// DELIVERED: Final state
const statusPermissions: Record<'farmer' | 'buyer', Record<string, string[]>> = {
  farmer: {
    pending: ['confirmed', 'cancelled'],
    confirmed: [],
    processing: [],
    shipped: [],
    delivered: [],
    cancelled: []
  },
  buyer: {
    pending: ['cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
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

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchQuery || 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(i => i.cropName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  // Calculate stats
  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => ['confirmed', 'processing'].includes(o.status)).length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalRevenue: orders
      .filter(o => ['confirmed', 'processing', 'shipped', 'delivered'].includes(o.status))
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

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Orders</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{orderStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pending</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{orderStats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Processing</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{orderStats.processing}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Truck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Shipped</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{orderStats.shipped}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Delivered</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{orderStats.delivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Cancelled</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{orderStats.cancelled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
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
            
            return (
              <motion.div
                key={order._id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card className="dark:bg-slate-900 dark:border-slate-800">
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
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", status.color)}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
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
                        <button
                          onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
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

                    {/* Quick Actions for Farmers with Pending Orders - Always Visible */}
                    {userRole === 'FARMER' && order.status === 'pending' && (
                      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Action Required
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                title: 'Confirm Order',
                                message: `Confirm order #${order.orderNumber}? The buyer will be notified and the order will proceed to processing.`,
                                confirmText: 'Confirm Order',
                                variant: 'success',
                                onConfirm: () => {
                                  updateStatusMutation.mutate({ id: order._id, status: 'confirmed' });
                                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                }
                              });
                            }}
                            disabled={updateStatusMutation.isPending}
                            className="flex-1 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Confirm Order
                          </button>
                          <button
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                title: 'Decline Order',
                                message: `Decline order #${order.orderNumber}? The inventory will be restored and the buyer will be notified.`,
                                confirmText: 'Decline Order',
                                variant: 'danger',
                                onConfirm: () => {
                                  updateStatusMutation.mutate({ id: order._id, status: 'cancelled' });
                                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                }
                              });
                            }}
                            disabled={updateStatusMutation.isPending}
                            className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <X className="h-4 w-4" />
                            Decline
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Quick Actions for Buyers with Confirmed Orders - Always Visible */}
                    {userRole === 'BUYER' && order.status === 'confirmed' && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                          🎉 Farmer confirmed your order! What's next?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                title: 'Start Processing',
                                message: 'Mark order as Processing? The order will proceed to the next stage.',
                                confirmText: 'Start Processing',
                                variant: 'success',
                                onConfirm: () => {
                                  updateStatusMutation.mutate({ id: order._id, status: 'processing' });
                                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                }
                              });
                            }}
                            disabled={updateStatusMutation.isPending}
                            className="flex-1 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <Package className="h-4 w-4" />
                            Start Processing
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
                                  updateStatusMutation.mutate({ id: order._id, status: 'cancelled' });
                                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                }
                              });
                            }}
                            disabled={updateStatusMutation.isPending}
                            className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Quick Actions for Buyers with Shipped Orders - Always Visible */}
                    {userRole === 'BUYER' && order.status === 'shipped' && (
                      <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                        <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-2">
                          🚚 Your order is on the way!
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
                                updateStatusMutation.mutate({ id: order._id, status: 'delivered' });
                                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                              }
                            });
                          }}
                          disabled={updateStatusMutation.isPending}
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
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 border-t pt-2">
                                  {order.shippingAddress.address}<br />
                                  {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                                  PIN: {order.shippingAddress.pin}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-slate-600 dark:text-slate-300">
                                {order.shippingAddress.address}<br />
                                {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                                PIN: {order.shippingAddress.pin}
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
