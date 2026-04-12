'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare, TrendingDown, CheckCircle, XCircle, Clock, RefreshCw,
  ChevronRight, IndianRupee, Package, MapPin, Handshake, AlertTriangle,
  Sprout, User, RefreshCcw, X, ArrowLeft, Truck, Check
} from 'lucide-react';
import { negotiationApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { showErrorToast } from '@/lib/errorHandler';
import NegotiationChat from '@/components/negotiations/NegotiationChat';
import { getAllStates, getDistrictsByState, getTalukasByDistrict } from '@/lib/indianLocations';

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
  proposedPricePerUnit: number;
  proposedQuantity: number;
  counterPricePerUnit?: number;
  counterQuantity?: number;
  agreedPricePerUnit?: number;
  agreedQuantity?: number;
  originalPricePerUnit: number;
  originalQuantity: number;
  proposedBy: 'buyer' | 'farmer';
  counterBy?: 'buyer' | 'farmer';
  messages: NegotiationMessage[];
  inventoryId?: { 
    _id: string; 
    cropName: string; 
    variety: string; 
    unit: string; 
    images?: string[];
    location?: { address: string };
    pricePerUnit: number;
  };
  buyerId?: { _id: string; name: string; email: string; phoneNumber?: string };
  farmerId?: { _id: string; name: string; farmName?: string; email: string; phoneNumber?: string };
  createdAt: string;
  expiresAt: string;
  orderId?: string;
}

// ─── Status Config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:   { label: 'Pending',   color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',   icon: Clock },
  countered: { label: 'Countered', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',     icon: RefreshCw },
  accepted:  { label: 'Accepted',  color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
  rejected:  { label: 'Rejected',  color: 'bg-red-500/20 text-red-400 border-red-500/30',        icon: XCircle },
  expired:   { label: 'Expired',   color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',     icon: AlertTriangle },
};

const TABS = ['all', 'pending', 'countered', 'accepted', 'rejected'] as const;
type Tab = typeof TABS[number];

// ─── Accept Modal ─────────────────────────────────────────────────────────────
interface AcceptModalProps {
  negotiation: Negotiation;
  isFarmer: boolean;
  onConfirm: (shippingAddress: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function AcceptModal({ negotiation, isFarmer, onConfirm, onCancel, isLoading }: AcceptModalProps) {
  const agreedPrice = negotiation.counterPricePerUnit ?? negotiation.proposedPricePerUnit;
  const agreedQty   = negotiation.counterQuantity ?? negotiation.proposedQuantity;
  const total       = agreedPrice * agreedQty;

  const [shippingAddress, setShippingAddress] = useState({
    street: '', city: '', district: '', taluka: '', state: '', pinCode: '', country: 'IN',
  });
  const [selectedState, setSelectedState]       = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableTalukas, setAvailableTalukas]     = useState<string[]>([]);

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedDistrict('');
    setShippingAddress(a => ({ ...a, state, district: '', taluka: '', city: '' }));
    setAvailableDistricts(getDistrictsByState(state));
    setAvailableTalukas([]);
  };
  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    setShippingAddress(a => ({ ...a, district, taluka: '', city: '' }));
    setAvailableTalukas(getTalukasByDistrict(selectedState, district));
  };
  const handleTalukaChange = (taluka: string) => {
    setShippingAddress(a => ({ ...a, taluka, city: taluka }));
  };

  // Farmer just confirms — no address needed (pickup from farm)
  // Buyer must fill at least state & city
  const canSubmit = isFarmer || (selectedState !== '' && (shippingAddress.city || shippingAddress.taluka));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onCancel}
        />
        <motion.div
          initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full sm:max-w-lg bg-[#0d1510] border border-emerald-500/20 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[#0d1510] border-b border-white/10 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Confirm Deal</h2>
                <p className="text-xs text-white/40">Review and finalize negotiation</p>
              </div>
            </div>
            <button onClick={onCancel} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Deal Summary */}
            <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-5 space-y-3">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Deal Summary</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Crop</p>
                  <p className="text-sm font-bold text-white">{negotiation.inventoryId?.cropName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Agreed Price</p>
                  <p className="text-sm font-bold text-emerald-400">{formatCurrency(agreedPrice)}/{negotiation.inventoryId?.unit || 'unit'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Quantity</p>
                  <p className="text-sm font-bold text-white">{agreedQty} {negotiation.inventoryId?.unit || 'units'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Total Value</p>
                  <p className="text-lg font-black text-emerald-400">{formatCurrency(total)}</p>
                </div>
              </div>
            </div>

            {/* Address section — only for buyer */}
            {!isFarmer && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-white/50" />
                  <p className="text-sm font-bold text-white">Delivery Address</p>
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">Required</span>
                </div>

                {/* Street */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Street / Landmark</label>
                  <input
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                    placeholder="House no., Street (optional)"
                    value={shippingAddress.street}
                    onChange={e => setShippingAddress(a => ({ ...a, street: e.target.value }))}
                  />
                </div>

                {/* State */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">State *</label>
                  <select
                    value={selectedState}
                    onChange={e => handleStateChange(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-slate-900">Select State</option>
                    {getAllStates().map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                  </select>
                </div>

                {/* District */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">District</label>
                    <select
                      value={selectedDistrict}
                      onChange={e => handleDistrictChange(e.target.value)}
                      disabled={!selectedState}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer disabled:opacity-40"
                    >
                      <option value="" className="bg-slate-900">Select</option>
                      {availableDistricts.map(d => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Taluka</label>
                    <select
                      value={shippingAddress.taluka}
                      onChange={e => handleTalukaChange(e.target.value)}
                      disabled={!selectedDistrict}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer disabled:opacity-40"
                    >
                      <option value="" className="bg-slate-900">Select</option>
                      {availableTalukas.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* PIN */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">PIN Code</label>
                  <input
                    type="text" maxLength={6}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-emerald-500/50 transition-all"
                    placeholder="e.g. 400001"
                    value={shippingAddress.pinCode}
                    onChange={e => setShippingAddress(a => ({ ...a, pinCode: e.target.value.replace(/\D/g, '') }))}
                  />
                </div>
              </div>
            )}

            {isFarmer && (
              <div className="rounded-2xl bg-blue-500/5 border border-blue-500/20 p-4">
                <p className="text-sm text-blue-300 font-medium">
                  ✅ As the farmer, you're confirming readiness to fulfill this order. Buyer will arrange pickup logistics.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onCancel}
                className="flex-1 rounded-xl border border-white/10 py-3.5 text-sm font-bold text-white/60 hover:bg-white/5 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(shippingAddress)}
                disabled={isLoading || !canSubmit}
                className="flex-1 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {isLoading ? 'Confirming...' : 'Confirm Deal'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NegotiationsPage() {
  const { user } = useAppStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab]                   = useState<Tab>('all');
  const [selectedNegotiation, setSelectedNegotiation] = useState<Negotiation | null>(null);
  const [showAcceptModal, setShowAcceptModal]        = useState(false);
  const [showDetailMobile, setShowDetailMobile]      = useState(false);
  const isFarmer = user?.role === 'FARMER';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['negotiations', 'all'],
    queryFn: async () => {
      const params = activeTab !== 'all' ? { status: activeTab } : {};
      const res = await negotiationApi.getAll(params);
      return res.data?.data?.negotiations || res.data?.negotiations || [];
    },
    refetchInterval: 90000, // 90s fallback — useSocket invalidates on events
    staleTime: 60 * 1000,
  });

  const negotiations: Negotiation[] = data || [];

  // Per-tab counts for badges
  const pendingCount   = negotiations.filter(n => n.status === 'pending').length;
  const counteredCount = negotiations.filter(n => n.status === 'countered').length;
  const alertCount     = pendingCount + counteredCount;

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['negotiation-detail', selectedNegotiation?._id],
    queryFn: async () => {
      if (!selectedNegotiation?._id) return null;
      const res = await negotiationApi.getById(selectedNegotiation._id);
      return res.data?.data?.negotiation || null;
    },
    enabled: !!selectedNegotiation?._id,
    refetchInterval: 60000, // 60s fallback only
    staleTime: 30 * 1000,
  });

  const activeNegotiation: Negotiation | null = detailData || selectedNegotiation;

  // Accept negotiation (with optional shipping address from modal)
  const acceptMutation = useMutation({
    mutationFn: (payload: { id: string; shippingAddress?: any }) =>
      negotiationApi.accept(payload.id, payload.shippingAddress ? { shippingAddress: payload.shippingAddress } : undefined),
    onSuccess: () => {
      toast.success('🎉 Deal accepted! Order has been created.');
      queryClient.invalidateQueries({ queryKey: ['negotiations'] });
      queryClient.invalidateQueries({ queryKey: ['negotiation-detail', selectedNegotiation?._id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowAcceptModal(false);
    },
    onError: (err) => showErrorToast(err, 'Failed to accept'),
  });

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
    const proposed = neg.counterPricePerUnit ?? neg.proposedPricePerUnit;
    return original > 0 ? Math.round(((original - proposed) / original) * 100) : 0;
  };

  const getCounterParty = (neg: Negotiation) => isFarmer ? neg.buyerId : neg.farmerId;

  const handleSelectNegotiation = (neg: Negotiation) => {
    setSelectedNegotiation(neg);
    setShowDetailMobile(true);
  };

  const handleAcceptClick = () => setShowAcceptModal(true);
  const handleAcceptConfirm = (shippingAddress: any) => {
    if (!selectedNegotiation) return;
    acceptMutation.mutate({ id: selectedNegotiation._id, shippingAddress });
  };

  const tabBadge: Record<string, number> = {
    pending: pendingCount,
    countered: counteredCount,
  };

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-white">
      {/* Header */}
      <div className="bg-[#0d1510] border-b border-white/10 px-4 sm:px-6 py-4 sm:py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shrink-0">
              <Handshake className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white truncate">Negotiations</h1>
                {alertCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black animate-pulse"
                  >
                    {alertCount}
                  </motion.span>
                )}
              </div>
              <p className="text-xs text-white/50 hidden sm:block">Manage price negotiations with {isFarmer ? 'buyers' : 'farmers'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => refetch()}
              className="p-1.5 text-white/40 hover:text-white/70 hover:bg-white/5 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
            <div className="text-xs text-white/40 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hidden sm:block">
              {negotiations.length} total
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        {/* Mobile: show detail panel as overlay */}
        <AnimatePresence>
          {showDetailMobile && selectedNegotiation && (
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed inset-0 z-40 bg-[#0a0f0d] flex flex-col md:hidden"
            >
              {/* Mobile detail header */}
              <div className="flex items-center gap-3 px-4 py-4 bg-[#0d1510] border-b border-white/10">
                <button
                  onClick={() => setShowDetailMobile(false)}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">
                    {activeNegotiation?.inventoryId?.cropName || 'Negotiation'}
                  </p>
                  <p className="text-xs text-white/40">
                    {STATUS_CONFIG[activeNegotiation?.status || 'pending']?.label}
                  </p>
                </div>
                {/* Badge for action-needed */}
                {(activeNegotiation?.status === 'pending' || activeNegotiation?.status === 'countered') && (
                  <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full border border-amber-500/30">
                    Action Needed
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                {detailLoading && !detailData ? (
                  <div className="h-full flex items-center justify-center text-white/30">
                    <div className="animate-spin w-8 h-8 border-2 border-emerald-500/50 border-t-emerald-400 rounded-full" />
                  </div>
                ) : activeNegotiation ? (
                  <NegotiationChat
                    negotiation={activeNegotiation}
                    currentUserId={user?._id || ''}
                    isFarmer={isFarmer}
                    onAccept={handleAcceptClick}
                    onReject={() => rejectMutation.mutate(selectedNegotiation._id)}
                    isAccepting={acceptMutation.isPending}
                    isRejecting={rejectMutation.isPending}
                    onUpdate={(updated) => {
                      queryClient.invalidateQueries({ queryKey: ['negotiation-detail', updated._id] });
                      queryClient.invalidateQueries({ queryKey: ['negotiations'] });
                    }}
                  />
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop: two-column layout */}
        <div className="flex gap-4 lg:gap-6 h-[calc(100vh-140px)] sm:h-[calc(100vh-180px)]">
          {/* Left: List Panel */}
          <div className="w-full md:w-80 lg:w-96 flex flex-col gap-3 flex-shrink-0">
            {/* Tabs with badges */}
            <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto no-scrollbar">
              {TABS.map(tab => {
                const badge = tabBadge[tab] || 0;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-shrink-0 flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium capitalize transition-all ${
                      activeTab === tab
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {tab}
                    {badge > 0 && (
                      <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black">
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-28 bg-white/5 rounded-xl animate-pulse border border-white/10" />
                ))
              ) : negotiations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-white/30">
                  <Handshake className="w-12 h-12 mb-3 opacity-30" />
                  <p className="font-medium">No negotiations yet</p>
                  <p className="text-xs mt-1 text-center px-6">
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
                  const currentPrice = neg.counterPricePerUnit ?? neg.proposedPricePerUnit;

                  // Does this neg need current user action?
                  const myRole = user?.role?.toLowerCase();
                  const needsAction = (neg.status === 'pending' || neg.status === 'countered') && (
                    neg.counterBy ? neg.counterBy !== myRole : neg.proposedBy !== myRole
                  );

                  return (
                    <motion.div
                      key={neg._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => handleSelectNegotiation(neg)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all group ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-900/20'
                          : needsAction
                          ? 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10'
                          : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
                      }`}
                    >
                      {/* Action needed badge */}
                      {needsAction && (
                        <div className="flex items-center gap-1 mb-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Action Required
                          </span>
                        </div>
                      )}

                      {/* Crop name + status */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Sprout className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="font-semibold text-white text-sm truncate">
                            {neg.inventoryId?.cropName || 'Crop'}
                          </span>
                          {neg.inventoryId?.variety && (
                            <span className="text-white/40 text-xs truncate hidden sm:inline">{neg.inventoryId.variety}</span>
                          )}
                        </div>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border flex-shrink-0 ${sc.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          <span className="hidden sm:inline">{sc.label}</span>
                        </span>
                      </div>

                      {/* Price comparison */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-white/40 text-xs line-through">{formatCurrency(neg.originalPricePerUnit)}</div>
                        <ChevronRight className="w-3 h-3 text-white/30 flex-shrink-0" />
                        <div className="text-emerald-400 font-bold text-sm">{formatCurrency(currentPrice)}</div>
                        {savings > 0 && (
                          <span className="text-xs bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                            -{savings}%
                          </span>
                        )}
                      </div>

                      {/* Counter party */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-white/40 text-xs">
                          <User className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">
                            {((counterParty as any)?.farmName || counterParty?.name) || '—'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {neg.messages?.length > 0 && (
                            <div className="flex items-center gap-1 text-white/40 text-xs">
                              <MessageSquare className="w-3 h-3" />
                              {neg.messages.length}
                            </div>
                          )}
                          <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/50 transition-colors md:hidden" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Chat / Detail (Desktop only) */}
          <div className="flex-1 min-w-0 hidden md:block">
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
                  onAccept={handleAcceptClick}
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
                {alertCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-6 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-amber-400 text-sm font-medium">
                      {alertCount} negotiation{alertCount > 1 ? 's' : ''} need your attention
                    </span>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Accept Modal */}
      {showAcceptModal && activeNegotiation && (
        <AcceptModal
          negotiation={activeNegotiation}
          isFarmer={isFarmer}
          onConfirm={handleAcceptConfirm}
          onCancel={() => setShowAcceptModal(false)}
          isLoading={acceptMutation.isPending}
        />
      )}
    </div>
  );
}
