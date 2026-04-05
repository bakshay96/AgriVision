'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package, Plus, Search, Filter, MoreVertical, Edit2, Trash2,
  TrendingUp, AlertCircle, CheckCircle, X, Image as ImageIcon,
  MapPin, IndianRupee, Box, Calendar, Upload, Loader2, ShoppingCart,
  MessageSquare, ChevronDown, ChevronUp, Truck, Clock, XCircle, AlertTriangle, Popcorn
} from 'lucide-react';
import { inventoryApi, uploadApi, ordersApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguageStore } from '@/store/useLanguageStore';
import { formatCurrency, resolveUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { showErrorToast } from '@/lib/errorHandler';
import { getAllStates, getDistrictsByState, getTalukasByDistrict } from '@/lib/indianLocations';
import OrderChat from '@/components/orders/OrderChat';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useAppStore } from '@/store/useAppStore';
import { useFloatingChat } from '@/hooks/useFloatingChat';

interface InventoryItem {
  _id: string;
  cropName: string;
  variety: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  status: 'available' | 'low_stock' | 'out_of_stock' | 'reserved';
  location: {
    address: string;
    city: string;
    district?: string;
    taluka?: string;
    state: string;
    country: string;
    pin: string;
  };
  description?: string;
  certifications?: string[];
  images: string[];
  totalOrders: number;
  minimumOrderQuantity: number;
  harvestDate?: string;
}

const statusConfig = {
  available: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  low_stock: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: AlertCircle },
  out_of_stock: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: X },
  reserved: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Box },
};

const unitOptions = ['kg', 'quintal', 'ton', 'box', 'crate'];

export default function InventoryPage() {
  const { t } = useLanguageStore();
  const queryClient = useQueryClient();
  const { user } = useAppStore();
  const userRole = user?.role?.toUpperCase() || 'FARMER';
  const { openFloatingChat } = useFloatingChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [viewingOrders, setViewingOrders] = useState<string | null>(null); // Inventory ID
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'success' | 'warning' | 'info';
    confirmText: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'info', confirmText: 'Confirm' });

  // Fetch inventory
  const { data, isLoading } = useQuery({
    queryKey: ['inventory', 'my-listings'],
    queryFn: () => inventoryApi.getMyListings({ limit: 100 }).then(r => {
      console.log('[InventoryPage] Received inventory data:', r.data.data);
      if (r.data.data.items?.length > 0) {
        console.log('[InventoryPage] First item images:', r.data.data.items[0].images);
      }
      return r.data.data;
    }),
  });

  const items: InventoryItem[] = data?.items || [];

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.variety.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: items.length,
    available: items.filter(i => i.status === 'available').length,
    lowStock: items.filter(i => i.status === 'low_stock').length,
    outOfStock: items.filter(i => i.status === 'out_of_stock').length,
    totalValue: items.reduce((sum, i) => sum + (i.quantity * i.pricePerUnit), 0),
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Item removed successfully');
    },
    onError: (error: any) => {
      showErrorToast(error, 'Delete Failed');
    },
  });

  // Fetch order details for selected inventory
  const { data: orderDetails, isLoading: loadingOrders } = useQuery({
    queryKey: ['inventory-orders', viewingOrders],
    queryFn: () => viewingOrders ? inventoryApi.getDetails(viewingOrders).then(r => r.data.data) : null,
    enabled: !!viewingOrders,
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated successfully');
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            My Inventory
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Manage your crop listings and stock levels
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add New Item
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Items</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Available</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.available}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Low Stock</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.lowStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <X className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Out of Stock</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.outOfStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <IndianRupee className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Value</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.totalValue)}</p>
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
                  placeholder="Search crops..."
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
              <option value="available">Available</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="mt-4 text-slate-500 dark:text-slate-400">No inventory items found</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Add your first item
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const status = statusConfig[item.status];
            const StatusIcon = status.icon;
            
            return (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group"
              >
                <Card className="h-full dark:bg-slate-900 dark:border-slate-800 hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    {/* Image & Status */}
                    <div className="relative h-40 mb-4 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {item.images?.[0] ? (
                        <img
                          src={resolveUrl(item.images[0])}
                          alt={item.cropName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ImageIcon className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                        </div>
                      )}
                      <div className={cn("absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1", status.color)}>
                        <StatusIcon className="h-3 w-3" />
                        {item.status.replace('_', ' ')}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">{item.cropName}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{item.variety}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setViewingOrders(item._id)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="View Orders"
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (item.totalOrders > 0) {
                                toast.error(`Cannot delete: ${item.totalOrders} order(s) exist for this item`);
                              } else {
                                deleteMutation.mutate(item._id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                          <Box className="h-4 w-4 text-slate-400" />
                          {item.quantity} {item.unit}
                        </div>
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          {item.location.city}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <p className="text-xs text-slate-400 dark:text-slate-500">Price per {item.unit}</p>
                          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(item.pricePerUnit)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400 dark:text-slate-500">Total Value</p>
                          <p className="font-medium text-slate-700 dark:text-slate-300">
                            {formatCurrency(item.quantity * item.pricePerUnit)}
                          </p>
                        </div>
                      </div>

                      {item.certifications && item.certifications.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-2">
                          {item.certifications!.map((cert) => (
                            <span
                              key={cert}
                              className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs rounded-full"
                            >
                              {cert}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <InventoryModal
        isOpen={showAddModal || !!editingItem}
        onClose={() => {
          setShowAddModal(false);
          setEditingItem(null);
        }}
        item={editingItem}
      />

      {/* Order Details Modal */}
      <AnimatePresence>
        {viewingOrders && orderDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-xl"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Order History</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {orderDetails.inventory.cropName} - {orderDetails.inventory.variety}
                    </p>
                  </div>
                  <button
                    onClick={() => setViewingOrders(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="dark:bg-slate-800 dark:border-slate-700">
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Total Orders</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{orderDetails.stats.totalOrders}</p>
                    </CardContent>
                  </Card>
                  <Card className="dark:bg-slate-800 dark:border-slate-700">
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Active Orders</p>
                      <p className="text-2xl font-bold text-blue-600">{orderDetails.stats.activeOrders}</p>
                    </CardContent>
                  </Card>
                  <Card className="dark:bg-slate-800 dark:border-slate-700">
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Completed</p>
                      <p className="text-2xl font-bold text-emerald-600">{orderDetails.stats.completedOrders}</p>
                    </CardContent>
                  </Card>
                  <Card className="dark:bg-slate-800 dark:border-slate-700">
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Qty Sold</p>
                      <p className="text-2xl font-bold text-purple-600">{orderDetails.stats.totalQuantitySold} {orderDetails.inventory.unit}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Current Inventory Status */}
                <Card className="dark:bg-slate-800 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white">Current Inventory Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Available Quantity</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{orderDetails.inventory.quantity} {orderDetails.inventory.unit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Status</p>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {orderDetails.inventory.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Price per Unit</p>
                        <p className="text-lg font-bold text-emerald-600">{formatCurrency(orderDetails.inventory.pricePerUnit)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Active</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${orderDetails.inventory.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {orderDetails.inventory.isActive ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Orders List */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Recent Orders ({orderDetails.orders?.length || 0})</h3>
                  {loadingOrders ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    </div>
                  ) : !orderDetails.orders || orderDetails.orders.length === 0 ? (
                    <p className="text-center text-slate-500 dark:text-slate-400 py-8">No orders yet for this inventory item</p>
                  ) : (
                    <div className="space-y-4">
                      {orderDetails.orders.map((order: any) => {
                        // Find the item in this order that matches our inventory
                        const orderItem = order.items?.find((i: any) => 
                          i.inventoryId?._id?.toString() === viewingOrders || 
                          i.inventoryId?.toString() === viewingOrders
                        );
                        const statusColors: Record<string, string> = {
                          pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
                          confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                          processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
                          shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
                          delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
                          cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                        };
                        const statusIcons: Record<string, any> = {
                          pending: Clock,
                          confirmed: CheckCircle,
                          processing: Package,
                          shipped: Truck,
                          delivered: CheckCircle,
                          cancelled: XCircle,
                        };
                        const StatusIcon = statusIcons[order.status] || Clock;
                        
                        return (
                          <motion.div
                            key={order._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                          >
                            {/* Order Header */}
                            <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className={cn("p-2 rounded-lg", statusColors[order.status])}>
                                    <StatusIcon className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">#{order.orderNumber}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                      {formatCurrency(orderItem?.totalPrice || 0)}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {orderItem?.quantity || 0} {orderItem?.unit || 'units'}
                                    </p>
                                  </div>
                                  <span className={cn("px-3 py-1 rounded-full text-xs font-medium capitalize", statusColors[order.status] || 'bg-slate-100 text-slate-800')}>
                                    {order.status}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Order Details Grid */}
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-700">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                  <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Buyer</p>
                                  <p className="font-medium text-slate-900 dark:text-white">{order.buyerId?.name || 'N/A'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                  <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Location</p>
                                  <p className="font-medium text-slate-900 dark:text-white text-sm truncate">
                                    {order.shippingAddress?.city || 'N/A'}, {order.shippingAddress?.state || ''}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                  <IndianRupee className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Price/Unit</p>
                                  <p className="font-medium text-slate-900 dark:text-white">{formatCurrency(orderItem?.pricePerUnit || 0)}</p>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons for Pending Orders - Farmer Only */}
                            {userRole === 'FARMER' && order.status === 'pending' && (
                              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800">
                                <div className="flex items-center gap-2 mb-3">
                                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                  <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Action Required</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
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
                                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
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
                                    className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                  >
                                    <X className="h-4 w-4" />
                                    Decline
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Order Chat Component */}
                            <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Order Chat</span>
                                <button
                                  onClick={() => {
                                    openFloatingChat({
                                      orderId: order._id,
                                      orderNumber: order.orderNumber,
                                      otherPartyName: order.buyerId?.name || 'Buyer',
                                      otherPartyRole: 'BUYER',
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
                                otherPartyName={order.buyerId?.name}
                                otherPartyRole="BUYER"
                                isExpanded={false}
                              />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

// Inventory Modal Component
function InventoryModal({
  isOpen,
  onClose,
  item,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Location dropdown state
  const [selectedState, setSelectedState] = useState(item?.location?.state || '');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableTalukas, setAvailableTalukas] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    cropName: item?.cropName || '',
    variety: item?.variety || '',
    quantity: item?.quantity || '',
    unit: item?.unit || 'quintal',
    pricePerUnit: item?.pricePerUnit || '',
    minimumOrderQuantity: item?.minimumOrderQuantity || 1,
    location: {
      address: item?.location?.address || '',
      city: item?.location?.city || '',
      district: item?.location?.district || '',
      taluka: item?.location?.taluka || '',
      state: item?.location?.state || '',
      country: item?.location?.country || 'IN',
      pin: item?.location?.pin || '',
    },
    description: item?.description || '',
    certifications: item?.certifications || [] as string[],
    images: item?.images || [] as string[],
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>(item?.images || []);

  // Initialize districts and talukas when editing
  useEffect(() => {
    if (item && item.location) {
      const state = item.location.state;
      const district = (item.location as any).district || '';
      
      if (state) {
        setSelectedState(state);
        const districts = getDistrictsByState(state);
        setAvailableDistricts(districts);
        
        if (district) {
          setSelectedDistrict(district);
          const talukas = getTalukasByDistrict(state, district);
          setAvailableTalukas(talukas);
        }
      }
    }
  }, [item]);

  // Handle state selection
  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedDistrict('');
    setFormData({ 
      ...formData, 
      location: { 
        ...formData.location, 
        state, 
        district: '', 
        taluka: '',
        city: ''
      } 
    });
    const districts = getDistrictsByState(state);
    setAvailableDistricts(districts);
    setAvailableTalukas([]);
  };

  // Handle district selection
  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    setFormData({ 
      ...formData, 
      location: { 
        ...formData.location, 
        district, 
        taluka: '' 
      } 
    });
    const talukas = getTalukasByDistrict(selectedState, district);
    setAvailableTalukas(talukas);
  };

  // Handle taluka selection
  const handleTalukaChange = (taluka: string) => {
    setFormData({ 
      ...formData, 
      location: { 
        ...formData.location, 
        taluka,
        city: taluka // Auto-populate city with taluka name
      } 
    });
  };

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => inventoryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Item created successfully');
      onClose();
    },
    onError: (error) => showErrorToast(error, 'Create Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => inventoryApi.update(item!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Item updated successfully');
      onClose();
    },
    onError: (error) => showErrorToast(error, 'Update Failed'),
  });

  // Handle image file selection and upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    console.log('[InventoryModal] Starting image upload, files:', files.length);

    // Validate file count (max 5 images)
    if (previewImages.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setUploadingImages(true);
    const newImages: string[] = [];
    const newPreviews: string[] = [...previewImages];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 5MB limit`);
          continue;
        }

        // Create preview
        const previewUrl = URL.createObjectURL(file);
        newPreviews.push(previewUrl);

        // Upload to S3
        console.log(`[InventoryModal] Uploading image ${i + 1}/${files.length}:`, file.name);
        const response = await uploadApi.uploadImage(file, 'inventory');
        const imageUrl = response.data.data.url;
        console.log(`[InventoryModal] Image ${i + 1} uploaded successfully:`, imageUrl);
        newImages.push(imageUrl);
      }

      console.log('[InventoryModal] All images uploaded. Total URLs:', newImages.length);
      setPreviewImages(newPreviews);
      setFormData({ ...formData, images: [...formData.images, ...newImages] });
      console.log('[InventoryModal] Updated formData.images:', [...formData.images, ...newImages]);
      toast.success(`${newImages.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('[InventoryModal] Image upload error:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove image from preview and form data
  const removeImage = (index: number) => {
    const newPreviews = previewImages.filter((_, i) => i !== index);
    const newImages = formData.images.filter((_, i) => i !== index);
    setPreviewImages(newPreviews);
    setFormData({ ...formData, images: newImages });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[InventoryModal] Submitting form data:', {
      cropName: formData.cropName,
      imagesCount: formData.images.length,
      images: formData.images,
    });
    
    if (item) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-xl"
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {item ? 'Edit Item' : 'Add New Item'}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Crop Name *
              </label>
              <input
                type="text"
                required
                value={formData.cropName}
                onChange={(e) => setFormData({ ...formData, cropName: e.target.value })}
                disabled={!!item} // Disable when editing
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:bg-slate-800 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                placeholder="e.g., Wheat"
              />
              {item && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Crop name cannot be changed</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Variety
              </label>
              <input
                type="text"
                value={formData.variety}
                onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                disabled={!!item} // Disable when editing
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:bg-slate-800 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                placeholder="e.g., HD-2967"
              />
              {item && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Variety cannot be changed</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Unit *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:bg-slate-800 dark:text-white"
              >
                {unitOptions.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Price per Unit (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.pricePerUnit}
                onChange={(e) => setFormData({ ...formData, pricePerUnit: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* State Dropdown */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                State *
              </label>
              <select
                required
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:bg-slate-800 dark:text-white"
              >
                <option value="">Select State</option>
                {getAllStates().map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            {/* District Dropdown */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                District *
              </label>
              <select
                required
                value={selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                disabled={!selectedState}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:bg-slate-800 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
              >
                <option value="">Select District</option>
                {availableDistricts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
              {!selectedState && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Select state first</p>
              )}
            </div>

            {/* Taluka/Subdivision Dropdown */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Taluka / Subdivision *
              </label>
              <select
                required
                value={formData.location.taluka || ''}
                onChange={(e) => handleTalukaChange(e.target.value)}
                disabled={!selectedDistrict}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:bg-slate-800 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
              >
                <option value="">Select Taluka</option>
                {availableTalukas.map((taluka) => (
                  <option key={taluka} value={taluka}>
                    {taluka}
                  </option>
                ))}
              </select>
              {!selectedDistrict && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Select district first</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Address *
              </label>
              <input
                type="text"
                required
                value={formData.location.address}
                onChange={(e) => setFormData({ ...formData, location: { ...formData.location, address: e.target.value } })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:bg-slate-800 dark:text-white"
                placeholder="Street address, village name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                PIN Code *
              </label>
              <input
                type="text"
                required
                value={formData.location.pin}
                onChange={(e) => setFormData({ ...formData, location: { ...formData.location, pin: e.target.value } })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:bg-slate-800 dark:text-white"
                placeholder="e.g., 400001"
              />
            </div>
          </div>

          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Crop Images (Max 5)
            </label>
            
            {/* Image Preview Grid */}
            {previewImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                {previewImages.map((img, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group aspect-square rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700"
                  >
                    <img
                      src={img}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
                        Cover
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <div
              onClick={() => !uploadingImages && fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all",
                uploadingImages
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                  : "border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadingImages || previewImages.length >= 5}
              />
              {uploadingImages ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
                  <p className="text-sm text-emerald-600 font-medium">Uploading...</p>
                </div>
              ) : previewImages.length >= 5 ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">Maximum images reached</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Click to upload images
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      PNG, JPG, WebP up to 5MB each
                    </p>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              First image will be used as the cover photo. Add clear photos of your harvested crop.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:bg-slate-800 dark:text-white"
              placeholder="Describe your crop quality, harvest details, etc."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : item ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
