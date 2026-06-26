'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send, CheckCircle, XCircle, ArrowLeftRight, IndianRupee,
  Package, MapPin, Sprout, User, Clock, Handshake, TrendingDown,
  ChevronRight, AlertTriangle
} from 'lucide-react';
import { negotiationApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { showErrorToast } from '@/lib/errorHandler';

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

interface Props {
  negotiation: Negotiation;
  currentUserId: string;
  isFarmer: boolean;
  onAccept: () => void;
  onReject: () => void;
  onUpdate: (updated: Negotiation) => void;
  isAccepting?: boolean;
  isRejecting?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function NegotiationChat({ negotiation, currentUserId, isFarmer, onAccept, onReject, onUpdate, isAccepting, isRejecting }: Props) {
  const [text, setText] = useState('');
  const [showCounter, setShowCounter] = useState(false);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterQty, setCounterQty] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [negotiation.messages]);

  const isActive = !['accepted', 'rejected', 'expired'].includes(negotiation.status);
  const crop = negotiation.inventoryId;

  // Determine whose turn it is to respond
  // If no counter: the non-proposing party should respond
  // If countered: the non-countering party should respond
  const myRole = isFarmer ? 'farmer' : 'buyer';
  const canAcceptOrReject = (() => {
    if (!isActive) return false;
    if (negotiation.counterBy) {
      // Someone made a counter — the OTHER party can accept/reject
      return negotiation.counterBy !== myRole;
    }
    // No counter yet — the non-proposing party can accept/reject
    return negotiation.proposedBy !== myRole;
  })();
  const canCounter = isActive; // Both parties can always send a counter offer
  const sendMutation = useMutation({
    mutationFn: (msg: string) => negotiationApi.sendMessage(negotiation._id, msg),
    onSuccess: (res) => {
      setText('');
      const updated = res.data?.data?.negotiation;
      if (updated) onUpdate(updated);
    },
    onError: (err) => showErrorToast(err, 'Failed to send'),
  });

  // Counter offer
  const counterMutation = useMutation({
    mutationFn: () => negotiationApi.counter(negotiation._id, {
      counterPricePerUnit: parseFloat(counterPrice),
      counterQuantity: parseFloat(counterQty) || negotiation.proposedQuantity,
      message: text || undefined,
    }),
    onSuccess: (res) => {
      setShowCounter(false);
      setCounterPrice('');
      setCounterQty('');
      setText('');
      const updated = res.data?.data?.negotiation;
      if (updated) onUpdate(updated);
      toast.success('Counter offer sent!');
    },
    onError: (err) => showErrorToast(err, 'Failed to counter'),
  });

  const handleSend = () => {
    if (!text.trim()) return;
    sendMutation.mutate(text.trim());
  };

  const getSenderName = (msg: NegotiationMessage): string => {
    const sId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
    if (sId === currentUserId) return 'You';
    if (msg.senderRole === 'farmer') {
      return negotiation.farmerId?.farmName || negotiation.farmerId?.name || 'Farmer';
    }
    return negotiation.buyerId?.name || 'Buyer';
  };

  const isMyMessage = (msg: NegotiationMessage): boolean => {
    const sId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
    return sId === currentUserId;
  };

  const savings = negotiation.originalPricePerUnit > 0
    ? Math.round(((negotiation.originalPricePerUnit - negotiation.proposedPricePerUnit) / negotiation.originalPricePerUnit) * 100)
    : 0;

  const STATUS_COLORS: Record<string, string> = {
    pending: 'text-yellow-600 dark:text-yellow-400',
    countered: 'text-blue-600 dark:text-blue-400',
    accepted: 'text-green-600 dark:text-green-400',
    rejected: 'text-red-600 dark:text-red-400',
    expired: 'text-slate-500 dark:text-gray-400',
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 shrink-0">
        <div className="flex items-start justify-between gap-4">
          {/* Crop info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20 flex-shrink-0">
              <Sprout className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-800 dark:text-white truncate">{crop?.cropName || 'Crop'}</h2>
                {crop?.variety && <span className="text-slate-400 dark:text-white/40 text-sm">{crop.variety}</span>}
              </div>
              {crop?.location?.address && (
                <div className="flex items-center gap-1 text-slate-500 dark:text-white/40 text-xs mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{crop.location.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status badge */}
          <span className={`text-sm font-semibold capitalize flex-shrink-0 ${STATUS_COLORS[negotiation.status]}`}>
            {negotiation.status}
          </span>
        </div>

        {/* Price summary */}
        <div className="mt-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 dark:text-white/40 text-xs">Original</span>
            <span className="text-slate-700 dark:text-white/60 text-sm line-through">{formatCurrency(negotiation.originalPricePerUnit)}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-white/20" />
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg px-3 py-2 border border-emerald-200 dark:border-emerald-500/20">
            <span className="text-slate-500 dark:text-white/40 text-xs">Proposed</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{formatCurrency(negotiation.proposedPricePerUnit)}</span>
            {savings > 0 && (
              <span className="text-xs bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">-{savings}%</span>
            )}
          </div>
          {negotiation.counterPricePerUnit && (
            <>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-white/20" />
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg px-3 py-2 border border-blue-200 dark:border-blue-500/20">
                <span className="text-slate-500 dark:text-white/40 text-xs">Counter</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">{formatCurrency(negotiation.counterPricePerUnit)}</span>
              </div>
            </>
          )}
          <div className="flex items-center gap-1 text-slate-500 dark:text-white/40 text-xs ml-auto">
            <Package className="w-3 h-3" />
            {negotiation.proposedQuantity} {crop?.unit}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {negotiation.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-white/30">
            <Handshake className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          negotiation.messages.map((msg, idx) => {
            const mine = isMyMessage(msg);
            const hasProposal = msg.proposedPrice != null;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] ${mine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {/* Sender label */}
                  <div className={`flex items-center gap-1.5 text-xs text-slate-400 dark:text-white/40 ${mine ? 'flex-row-reverse' : ''}`}>
                    <span>{getSenderName(msg)}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      msg.senderRole === 'farmer'
                        ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                    }`}>
                      {msg.senderRole}
                    </span>
                  </div>

                  {/* Bubble */}
                  <div className={`rounded-2xl px-4 py-3 ${
                    mine
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-slate-900 dark:text-white'
                      : 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
                  }`}>
                    {/* Price proposal card inside message */}
                    {hasProposal && (
                      <div className={`mb-2 p-2 rounded-xl border flex items-center gap-3 ${
                        mine ? 'bg-white dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-200/50 dark:bg-white/5 border-slate-300/50 dark:border-white/10'
                      }`}>
                        <IndianRupee className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <div>
                          <div className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                            {formatCurrency(msg.proposedPrice!)}
                          </div>
                          {msg.proposedQuantity && (
                            <div className="text-slate-500 dark:text-white/40 text-xs">
                              Qty: {msg.proposedQuantity} {crop?.unit}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                  </div>

                  {/* Timestamp */}
                  <div className="text-[10px] text-slate-400 dark:text-white/30 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {new Date(msg.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Counter offer form */}
      <AnimatePresence>
        {showCounter && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10 shrink-0"
          >
            <div className="p-4 bg-slate-50 dark:bg-slate-900 space-y-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-white/70 flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Send Counter Offer
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 dark:text-white/40 mb-1 block">Counter Price (₹/unit)</label>
                  <input
                    type="number"
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(e.target.value)}
                    placeholder={String(negotiation.proposedPricePerUnit)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm outline-none focus:border-emerald-500 placeholder:text-slate-400 dark:placeholder:text-white/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-white/40 mb-1 block">Quantity ({crop?.unit})</label>
                  <input
                    type="number"
                    value={counterQty}
                    onChange={(e) => setCounterQty(e.target.value)}
                    placeholder={String(negotiation.proposedQuantity)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm outline-none focus:border-emerald-500 placeholder:text-slate-400 dark:placeholder:text-white/20"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCounter(false)}
                  className="flex-1 py-2 bg-white dark:bg-white/5 text-slate-600 dark:text-white/60 rounded-xl border border-slate-200 dark:border-white/10 text-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => counterMutation.mutate()}
                  disabled={!counterPrice || counterMutation.isPending}
                  className="flex-1 py-2 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-500/30 text-sm hover:bg-blue-100 dark:hover:bg-blue-500/30 transition-colors disabled:opacity-40 font-semibold"
                >
                  {counterMutation.isPending ? 'Sending...' : 'Send Counter'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons (accept/reject/counter) for active negotiations */}
      {isActive && (
        <div className="border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 px-4 py-3 flex gap-2 shrink-0 overflow-x-auto">
          {/* Counter — always available when negotiation is active */}
          {canCounter && (
            <button
              onClick={() => setShowCounter(!showCounter)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 rounded-xl text-sm hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors font-medium"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Counter
            </button>
          )}
          {/* Accept / Reject — only for the party who needs to respond */}
          {canAcceptOrReject && (
            <>
              <button
                onClick={onAccept}
                disabled={isAccepting}
                className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-emerald-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-emerald-500/20 rounded-xl text-sm hover:bg-green-100 dark:hover:bg-emerald-500/20 transition-colors font-medium disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                {isAccepting ? 'Accepting...' : 'Accept'}
              </button>
              <button
                onClick={onReject}
                disabled={isRejecting}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-xl text-sm hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors font-medium disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                {isRejecting ? 'Rejecting...' : 'Reject'}
              </button>
            </>
          )}
          {/* Waiting indicator when it's not your turn */}
          {!canAcceptOrReject && !canCounter && (
            <div className="flex items-center gap-2 text-slate-500 dark:text-white/30 text-sm">
              <Clock className="w-4 h-4" />
              Waiting for the other party to respond
            </div>
          )}
          {!canAcceptOrReject && canCounter && (
            <div className="flex items-center gap-2 text-slate-500 dark:text-white/30 text-sm ml-auto">
              <Clock className="w-4 h-4" />
              Waiting for response — you can still counter
            </div>
          )}
        </div>
      )}

      {/* Accepted / Rejected banner */}
      {!isActive && (
        <div className={`border-t border-slate-200 dark:border-white/10 px-4 py-3 text-center text-sm font-semibold shrink-0 ${
          negotiation.status === 'accepted'
            ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400'
            : negotiation.status === 'rejected'
            ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
            : 'bg-slate-50 dark:bg-gray-500/10 text-slate-700 dark:text-gray-400'
        }`}>
          {negotiation.status === 'accepted' && '✓ Negotiation accepted — proceed to place the order'}
          {negotiation.status === 'rejected' && '✗ Negotiation rejected'}
          {negotiation.status === 'expired' && '⏰ This negotiation has expired'}
        </div>
      )}

      {/* Message input */}
      {isActive && (
        <div className="border-t border-slate-200 dark:border-white/10 p-3 flex items-end gap-2 bg-white dark:bg-slate-950 shrink-0">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm outline-none focus:border-emerald-500 placeholder:text-slate-400 dark:placeholder:text-white/20 resize-none"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sendMutation.isPending}
            className="p-2.5 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/30 transition-colors disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
