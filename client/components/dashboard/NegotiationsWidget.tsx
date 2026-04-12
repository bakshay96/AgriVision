'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Handshake, ArrowLeftRight, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { negotiationApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface Negotiation {
  _id: string;
  status: string;
  proposedPricePerUnit: number;
  originalPricePerUnit: number;
  proposedQuantity: number;
  inventoryId?: { cropName: string; unit: string };
  buyerId?: { name: string };
  farmerId?: { name: string; farmName?: string };
  createdAt: string;
}

const STATUS_ICON: Record<string, React.ElementType> = {
  pending: Clock,
  countered: ArrowLeftRight,
  accepted: CheckCircle,
  rejected: XCircle,
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'text-yellow-400',
  countered: 'text-blue-400',
  accepted: 'text-green-400',
  rejected: 'text-red-400',
};

interface Props {
  isFarmer: boolean;
}

export default function NegotiationsWidget({ isFarmer }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['negotiations', 'all'],
    queryFn: async () => {
      const res = await negotiationApi.getAll({ limit: 5 });
      return res.data?.data?.negotiations || res.data?.negotiations || [];
    },
    staleTime: 2 * 60 * 1000, // 2 min — dashboard widget doesn't need real-time
  });

  const negotiations: Negotiation[] = data || [];
  const active = negotiations.filter(n => ['pending', 'countered'].includes(n.status));
  const total = negotiations.length;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
            <Handshake className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="font-semibold text-slate-800 dark:text-white text-sm">Negotiations</span>
          {active.length > 0 && (
            <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded-full font-medium">
              {active.length} active
            </span>
          )}
        </div>
        <Link href="/negotiations" className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Content */}
      <div className="p-3">
        {isLoading ? (
          <div className="space-y-2">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : negotiations.length === 0 ? (
          <div className="py-6 text-center text-slate-400 dark:text-slate-500">
            <Handshake className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No negotiations yet</p>
            <p className="text-xs mt-1">
              {isFarmer ? 'Buyers will send offers here' : 'Go to marketplace to start'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {negotiations.slice(0, 5).map((neg, idx) => {
              const StatusIcon = STATUS_ICON[neg.status] || Clock;
              const color = STATUS_COLOR[neg.status] || 'text-slate-400';
              const counterParty = isFarmer
                ? neg.buyerId?.name
                : neg.farmerId?.farmName || neg.farmerId?.name;
              const savings = neg.originalPricePerUnit > 0
                ? Math.round(((neg.originalPricePerUnit - neg.proposedPricePerUnit) / neg.originalPricePerUnit) * 100)
                : 0;

              return (
                <motion.div
                  key={neg._id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link href="/negotiations">
                    <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                      <StatusIcon className={`w-4 h-4 flex-shrink-0 ${color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                          {neg.inventoryId?.cropName || 'Crop'}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                          {counterParty || '—'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(neg.proposedPricePerUnit)}
                        </p>
                        {savings > 0 && (
                          <p className="text-[10px] text-emerald-500">-{savings}%</p>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
