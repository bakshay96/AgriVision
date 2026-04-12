'use client';

import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Clock, Package, CheckCircle, Truck, Calendar } from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import Link from 'next/link';

interface Order {
  _id?: string;
  orderNumber?: string;
  status?: string;
  totalAmount?: number;
  createdAt?: string;
  items?: Array<{ cropName: string; quantity: number; unit: string }>;
}

interface RecentOrdersCardProps {
  orders: Order[];
  isLoading?: boolean;
}

const statusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  negotiating: Package,
  deal_confirmed: CheckCircle,
  ready_for_pickup: Package,
  picked_up: Truck,
  in_transit: Truck,
  delivered: CheckCircle,
  cancelled: Clock,
  '': Package,
};

export default function RecentOrdersCard({ orders, isLoading }: RecentOrdersCardProps) {
  const { language } = useLanguageStore();

  const getTranslatedText = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'title': { en: 'Recent Orders', hi: 'हाल के ऑर्डर', mr: 'अलीकडील्या ऑर्डर' },
      'viewAll': { en: 'View All', hi: 'सभी देखें', mr: 'सर्व पहा' },
      'noOrders': { en: 'No orders yet', hi: 'अभी तक कोई ऑर्डर नहीं', mr: 'अद्याप कोणतेही ऑर्डर नाहीत' },
      'items': { en: 'items', hi: 'आइटम', mr: 'वस्तू' },
    };
    return translations[key]?.[language] || translations[key]?.en || key;
  };

  if (isLoading) {
    return (
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4">
        <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mb-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mb-2" />
        ))}
      </div>
    );
  }

  const recentOrders = orders.slice(0, 3);

  return (
    <Link href="/orders" className="block">
      <motion.div
        whileHover={{ y: -2 }}
        className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 cursor-pointer hover:shadow-md transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <ShoppingBag className="h-4 w-4 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {getTranslatedText('title')}
            </h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-600">
            {getTranslatedText('viewAll')}
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>

        {/* Orders List */}
        {recentOrders.length === 0 ? (
          <div className="text-center py-6">
            <ShoppingBag className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-xs text-slate-400">{getTranslatedText('noOrders')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order, index) => {
              const StatusIcon = statusIcons[order.status || 'pending'] || Package;
              const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
              
              return (
                <motion.div
                  key={order._id || index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(order.status || 'pending')}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        #{order.orderNumber || '---'}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(order.createdAt || new Date())}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(order.totalAmount || 0)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {order.items?.length || 0} {getTranslatedText('items')}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </Link>
  );
}
