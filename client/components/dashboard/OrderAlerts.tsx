'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ShoppingBag, Clock, CheckCircle, X, Package, Truck, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface OrderAlert {
  _id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  buyerId?: { name: string };
  createdAt: string;
  items: Array<{ cropName: string; quantity: number; unit: string }>;
}

export default function OrderAlerts() {
  const { user, notifications, clearNotifications } = useAppStore();
  const queryClient = useQueryClient();
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'success' | 'warning' | 'info';
    confirmText: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'info', confirmText: 'Confirm' });

  // Fetch pending orders that need farmer attention
  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['orders', 'alerts'],
    queryFn: () => ordersApi.getAll({ status: 'pending', limit: 10 }).then(r => {
      console.log('[OrderAlerts] Fetched orders:', r.data.data);
      return r.data.data;
    }),
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnWindowFocus: true,
  });

  const pendingOrders: OrderAlert[] = ordersData?.orders || [];
  
  console.log('[OrderAlerts] User role:', user?.role, 'Pending orders count:', pendingOrders.length);
  
  // Get recent order notifications from store
  const orderNotifications = notifications.filter(n => n.type === 'NEW_ORDER').slice(0, 5);

  // Update status mutation for quick actions
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  // Show toast for new notifications
  useEffect(() => {
    const latestNotification = orderNotifications[0];
    if (latestNotification && Date.now() - new Date(latestNotification.timestamp).getTime() < 5000) {
      toast.success(latestNotification.message, {
        icon: '🛒',
        duration: 6000,
        action: {
          label: 'View',
          onClick: () => window.location.href = '/orders',
        },
      });
    }
  }, [orderNotifications]);

  if (user?.role?.toUpperCase() !== 'FARMER') return null;

  // Don't render if no pending orders and no notifications
  if (pendingOrders.length === 0 && orderNotifications.length === 0 && !isLoading) {
    return null;
  }

  return (
    <Card className="dark:bg-slate-900 dark:border-slate-800">
      <CardHeader className="border-b border-slate-100 dark:border-slate-700 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base dark:text-white flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-500" />
            Order Alerts
            {pendingOrders.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full animate-pulse">
                {pendingOrders.length}
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1"
            >
              <Clock className="h-3 w-3" />
              Refresh
            </button>
            {orderNotifications.length > 0 && (
              <button
                onClick={() => clearNotifications()}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : pendingOrders.length === 0 ? (
          <div className="p-6 text-center">
            <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">All caught up!</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">No pending orders requiring action</p>
            <button
              onClick={() => refetch()}
              className="mt-3 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              Click to refresh
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <AnimatePresence>
              {pendingOrders.slice(0, 5).map((order) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                        <ShoppingBag className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          #{order.orderNumber}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {order.buyerId?.name || 'Unknown buyer'}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {order.items?.length || 0} item{(order.items?.length || 0) > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  {/* Quick Action Buttons - Prominent */}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => {
                        setConfirmDialog({
                          isOpen: true,
                          title: 'Confirm Order',
                          message: `Confirm order #${order.orderNumber}? The buyer will be notified and the order will proceed.`,
                          confirmText: 'Confirm Order',
                          variant: 'success',
                          onConfirm: () => {
                            updateStatusMutation.mutate({ id: order._id, status: 'confirmed' });
                            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                          }
                        });
                      }}
                      disabled={updateStatusMutation.isPending}
                      className="flex-1 px-4 py-2.5 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Confirm
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
                      className="px-4 py-2.5 text-sm font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <X className="h-4 w-4" />
                      Decline
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        
        {pendingOrders.length > 5 && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/orders?status=pending"
              className="block text-center text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
            >
              View all {pendingOrders.length} pending orders →
            </Link>
          </div>
        )}
      </CardContent>
      
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
    </Card>
  );
}
