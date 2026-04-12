'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare, TrendingDown, CheckCircle, XCircle, Clock, RefreshCw,
  ChevronRight, IndianRupee, Package, MapPin, Handshake, Filter,
  Send, ArrowLeftRight, AlertTriangle, Sprout, User, Plus, RefreshCcw
} from 'lucide-react';
import { negotiationApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { showErrorToast } from '@/lib/errorHandler';
import NegotiationChat from '@/components/negotiations/NegotiationChat';

// ─── Types ────────────────────────────────────────────────────────────────────
interface NegotiationMessage {
  _id?: string;
  senderId: string | { _id: string; name: string };
  senderRole: 'buyer' | 'farmer';
  message: string;
  proposedPrice?: number;
  proposedQuantity?: number;
  timestamp: string;
}

interface Negotiation {
  _id: string;
  status: 'pending' | 'countered' | 'accepted' | 'rejected' | 'expired';
  proposedBy: 'buyer' | 'farmer';
  counterBy?: 'buyer' | 'farmer';
  proposedPricePerUnit: number;
  proposedQuantity: number;
  originalPricePerUnit: number;
  originalQuantity: number;
  counterPricePerUnit?: number;
  counterQuantity?: number;
  buyerMessage?: string;
  farmerMessage?: string;
  messages: NegotiationMessage[];
  inventoryId?: {
    _id: string;
    cropName: string;
    variety: string;
    images?: string[];
    location?: { address: string };
    pricePerUnit: number;
    unit: string;
  };
  buyerId?: { _id: string; name: string; email: string; phoneNumber?: string };
  farmerId?: { _id: string; name: string; farmName?: string; email: string; phoneNumber?: string };
  createdAt: string;
  expiresAt: string;
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
  countered: { label: 'Countered', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: ArrowLeftRight },
  accepted: { label: 'Accepted', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
  expired: { label: 'Expired', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: AlertTriangle },
};

const TABS = ['all', 'pending', 'countered', 'accepted', 'rejected'] as const;
type Tab = typeof TABS[number];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NegotiationsPage() {
  const { user } = useAppStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [selectedNegotiation, setSelectedNegotiation] = useState<Negotiation | null>(null);
  const isFarmer = user?.role === 'FARMER';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['negotiations', activeTab],
    queryFn: async () => {
      const params = activeTab !== 'all' ? { status: activeTab } : {};
      const res = await negotiationApi.getAll(params);
      return res.data?.data?.negotiations || res.data?.negotiations || [];
    },
    refetchInterval: 60000, // poll every 60s for real-time updates to avoid rate limit
  });

  const negotiations: Negotiation[] = data || [];

  // Fetch full negotiation detail (with messages) when selected
  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['negotiation-detail', selectedNegotiation?._id],
    queryFn: async () => {
      if (!selectedNegotiation?._id) return null;
      const res = await negotiationApi.getById(selectedNegotiation._id);
      return res.data?.data?.negotiation || null;
    },
    enabled: !!selectedNegotiation?._id,
    refetchInterval: 30000, // poll every 30s to avoid backend rate limit
  });

  // Use full detail when available, fallback to list item
  const activeNegotiation: Negotiation | null = detailData || selectedNegotiation;

  // Accept negotiation
  const acceptMutation = useMutation({
    mutationFn: (id: string) => negotiationApi.accept(id),
    onSuccess: () => {
      toast.success('Negotiation accepted! Order created.');
      queryClient.invalidateQueries({ queryKey: ['negotiations'] });
      queryClient.invalidateQueries({ queryKey: ['negotiation-detail', selectedNegotiation?._id] });
    },
    onError: (err) => showErrorToast(err, 'Failed to accept'),
  });

  // Reject negotiation
  const rejectMutation = useMutation({
    mutationFn: (id: string) => negotiationApi.reject(id),
    onSuccess: () => {
      toast.success('Negotiation rejected');
      queryClient.invalidateQueries({ queryKey: ['negotiations'] });
      queryClient.invalidateQueries({ queryKey: ['negotiation-detail', selectedNegotiation?._id] });
    },
    onError: (err) => showErrorToast(err, 'Failed to reject'),
  });

  const getSavingsPercent = (neg: Negotiation) => {
    const original = neg.originalPricePerUnit;
    const proposed = neg.proposedPricePerUnit;
    return original > 0 ? Math.round(((original - proposed) / original) * 100) : 0;
  };

  const getCounterParty = (neg: Negotiation) => {
    if (isFarmer) return neg.buyerId;
    return neg.farmerId;
  };

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-white">
      {/* Header */}
      <div className="bg-[#0d1510] border-b border-white/10 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <Handshake className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Negotiations</h1>
              <p className="text-sm text-white/50">Manage price negotiations with {isFarmer ? 'buyers' : 'farmers'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-1.5 text-white/40 hover:text-white/70 hover:bg-white/5 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
            <div className="text-sm text-white/40 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
              {negotiations.length} total
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-6 h-[calc(100vh-180px)]">
          {/* Left: List */}
          <div className="w-96 flex flex-col gap-4 flex-shrink-0">
            {/* Tabs */}
            <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium capitalize transition-all whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-28 bg-white/5 rounded-xl animate-pulse border border-white/10" />
                ))
              ) : negotiations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-white/30">
                  <Handshake className="w-12 h-12 mb-3 opacity-30" />
                  <p className="font-medium">No negotiations yet</p>
                  <p className="text-xs mt-1">
                    {isFarmer ? 'Negotiations from buyers will appear here' : 'Start negotiating in the marketplace'}
                  </p>
                </div>
              ) : (
                negotiations.map(neg => {
                  const sc = STATUS_CONFIG[neg.status] || STATUS_CONFIG.pending;
                  const StatusIcon = sc.icon;
                  const counterParty = getCounterParty(neg);
                  const savings = getSavingsPercent(neg);
                  const isSelected = selectedNegotiation?._id === neg._id;

                  return (
                    <motion.div
                      key={neg._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => setSelectedNegotiation(neg)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
                      }`}
                    >
                      {/* Crop name + status */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Sprout className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="font-semibold text-white text-sm truncate">
                            {neg.inventoryId?.cropName || 'Crop'}
                          </span>
                          {neg.inventoryId?.variety && (
                            <span className="text-white/40 text-xs truncate">{neg.inventoryId.variety}</span>
                          )}
                        </div>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border flex-shrink-0 ${sc.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </div>

                      {/* Price comparison */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-white/50 text-xs line-through">
                          {formatCurrency(neg.originalPricePerUnit)}
                        </div>
                        <ChevronRight className="w-3 h-3 text-white/30" />
                        <div className="text-emerald-400 font-bold text-sm">
                          {formatCurrency(neg.proposedPricePerUnit)}
                        </div>
                        {savings > 0 && (
                          <span className="text-xs bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                            -{savings}%
                          </span>
                        )}
                      </div>

                      {/* Counter party + messages count */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-white/40 text-xs">
                          <User className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">
                            {((counterParty as any)?.farmName || counterParty?.name) || '—'}
                          </span>
                        </div>
                        {neg.messages?.length > 0 && (
                          <div className="flex items-center gap-1 text-white/40 text-xs">
                            <MessageSquare className="w-3 h-3" />
                            {neg.messages.length}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Chat / Detail */}
          <div className="flex-1 min-w-0">
            {selectedNegotiation ? (
              detailLoading && !detailData ? (
                <div className="h-full flex items-center justify-center text-white/30">
                  <div className="animate-spin w-8 h-8 border-2 border-emerald-500/50 border-t-emerald-400 rounded-full" />
                </div>
              ) : activeNegotiation ? (
                <NegotiationChat
                  negotiation={activeNegotiation}
                  currentUserId={user?._id || ''}
                  isFarmer={isFarmer}
                  onAccept={() => acceptMutation.mutate(selectedNegotiation._id)}
                  onReject={() => rejectMutation.mutate(selectedNegotiation._id)}
                  isAccepting={acceptMutation.isPending}
                  isRejecting={rejectMutation.isPending}
                  onUpdate={(updated) => {
                    queryClient.invalidateQueries({ queryKey: ['negotiation-detail', updated._id] });
                    queryClient.invalidateQueries({ queryKey: ['negotiations'] });
                  }}
                />
              ) : null
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white/30 bg-white/3 rounded-2xl border border-white/10">
                <Handshake className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-semibold text-lg">Select a negotiation</p>
                <p className="text-sm mt-2 text-white/20">Click any negotiation on the left to view the conversation</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
