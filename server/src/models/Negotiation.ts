import mongoose, { Document, Schema } from 'mongoose';

export const NEGOTIATION_STATUSES = ['pending', 'accepted', 'rejected', 'countered', 'expired'] as const;
export type NegotiationStatus = typeof NEGOTIATION_STATUSES[number];

export interface INegotiation extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: string;
  orderId: mongoose.Types.ObjectId;
  inventoryId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  farmerId: mongoose.Types.ObjectId;
  
  // Original listing details
  originalPricePerUnit: number;
  originalQuantity: number;
  
  // Negotiation details
  proposedPricePerUnit: number;
  proposedQuantity: number;
  proposedBy: 'buyer' | 'farmer';
  
  // Counter offer (if any)
  counterPricePerUnit?: number;
  counterQuantity?: number;
  counterBy?: 'buyer' | 'farmer';
  
  // Messages - support for conversation thread
  messages: Array<{
    senderId: mongoose.Types.ObjectId;
    senderRole: 'buyer' | 'farmer';
    message: string;
    proposedPrice?: number;
    proposedQuantity?: number;
    timestamp: Date;
  }>;
  
  // Legacy fields - kept for backward compatibility
  buyerMessage?: string;
  farmerMessage?: string;
  
  // Status tracking
  status: NegotiationStatus;
  
  // Expiry
  expiresAt?: Date;
  
  // Final agreement
  agreedPricePerUnit?: number;
  agreedQuantity?: number;
  agreedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const NegotiationSchema = new Schema<INegotiation>(
  {
    tenantId: { type: String, required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', index: true },
    inventoryId: { type: Schema.Types.ObjectId, ref: 'Inventory', required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    
    originalPricePerUnit: { type: Number, required: true, min: 0 },
    originalQuantity: { type: Number, required: true, min: 0 },
    
    proposedPricePerUnit: { type: Number, required: true, min: 0 },
    proposedQuantity: { type: Number, required: true, min: 0 },
    proposedBy: { type: String, enum: ['buyer', 'farmer'], required: true },
    
    counterPricePerUnit: { type: Number, min: 0 },
    counterQuantity: { type: Number, min: 0 },
    counterBy: { type: String, enum: ['buyer', 'farmer'] },
    
    // Messages array for conversation thread
    messages: [{
      senderId: { type: Schema.Types.ObjectId, required: true },
      senderRole: { type: String, enum: ['buyer', 'farmer'], required: true },
      message: { type: String, required: true, maxlength: 1000 },
      proposedPrice: { type: Number, min: 0 },
      proposedQuantity: { type: Number, min: 0 },
      timestamp: { type: Date, default: Date.now },
    }],
    
    // Legacy message fields
    buyerMessage: { type: String, maxlength: 500 },
    farmerMessage: { type: String, maxlength: 500 },
    
    status: {
      type: String,
      enum: NEGOTIATION_STATUSES,
      default: 'pending' as NegotiationStatus,
    },
    
    expiresAt: { type: Date },
    
    agreedPricePerUnit: { type: Number, min: 0 },
    agreedQuantity: { type: Number, min: 0 },
    agreedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
NegotiationSchema.index({ tenantId: 1, buyerId: 1, status: 1 });
NegotiationSchema.index({ tenantId: 1, farmerId: 1, status: 1 });
NegotiationSchema.index({ status: 1, expiresAt: 1 });

// Auto-expire pending negotiations after 7 days
NegotiationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<INegotiation>('Negotiation', NegotiationSchema);
