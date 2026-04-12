import mongoose, { Document, Schema } from 'mongoose';

// ─── Strict Enums ───────────────────────────────────────────────────────────────────────
export const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'negotiating', 'deal_confirmed', 'ready_for_pickup', 'picked_up', 'in_transit', 'delivered', 'cancelled'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const;
export type PaymentStatus = typeof PAYMENT_STATUSES[number];

export const DEAL_CONFIRMATION_STATUS = ['pending', 'buyer_confirmed', 'farmer_confirmed', 'both_confirmed'] as const;
export type DealConfirmationStatus = typeof DEAL_CONFIRMATION_STATUS[number];

// ─── Sub-document interfaces ──────────────────────────────────────────────────────────────
export interface IOrderItem {
  inventoryId: mongoose.Types.ObjectId;
  cropName: string;
  variety: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
}

export interface IShippingAddress {
  street: string;
  city: string;
  district?: string;
  taluka?: string;
  state: string;
  zipCode?: string;
  pinCode: string;
  country: string;
}

export interface IOrderMessage {
  senderId: mongoose.Types.ObjectId;
  senderName?: string;
  senderRole?: string;
  message: string;
  timestamp: Date;
}

// ─── Main Order Interface ───────────────────────────────────────────────────────────────────
export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: string;
  orderNumber: string;
  buyerId: mongoose.Types.ObjectId;
  farmerId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  shippingAddress: IShippingAddress;
  deliveryDate?: Date;
  notes?: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  /** Unique transaction ID from payment gateway (e.g. Stripe charge ID) */
  transactionId?: string;
  trackingNumber?: string;
  messageHistory: IOrderMessage[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // ─── B2B Deal Management ─────────────────────────────────────────────────────────────
  
  // Deal Confirmation
  dealConfirmation: {
    status: DealConfirmationStatus;
    buyerConfirmedAt?: Date;
    farmerConfirmedAt?: Date;
    buyerNotes?: string;
    farmerNotes?: string;
  };
  
  // Negotiation reference
  negotiationId?: mongoose.Types.ObjectId;
  agreedPricePerUnit?: number;
  agreedQuantity?: number;
  
  // Procurement & Pickup
  procurement: {
    arrangedBy: 'buyer' | 'farmer' | 'third_party';
    transporterName?: string;
    transporterContact?: string;
    vehicleNumber?: string;
    pickupScheduledAt?: Date;
    actualPickupAt?: Date;
  };
  
  // Weight/Quantity Verification at Pickup
  verification: {
    requestedQuantity: number;
    actualQuantity?: number;
    quantityUnit: string;
    verifiedAt?: Date;
    verifiedBy?: mongoose.Types.ObjectId;
    verificationNotes?: string;
    qualityGrade?: string;
    qualityCheckPassed?: boolean;
  };
  
  // Delivery tracking
  delivery: {
    estimatedDeliveryDate?: Date;
    actualDeliveryDate?: Date;
    deliveryNotes?: string;
    proofOfDelivery?: string[]; // Image URLs
  };
}

const OrderItemSchema = new Schema<IOrderItem>({
  inventoryId: { type: Schema.Types.ObjectId, ref: 'Inventory', required: true },
  cropName: { type: String, required: true },
  variety: { type: String, default: 'Standard' },
  quantity: { type: Number, required: true, min: 0.01 },
  unit: { type: String, required: true, default: 'ton' },
  pricePerUnit: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
});

const OrderSchema = new Schema<IOrder>(
  {
    tenantId: { type: String, required: true, index: true },
    orderNumber: { type: String, unique: true },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    farmerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending' as OrderStatus,
    },
    shippingAddress: {
      street: { type: String, required: false, default: '' },
      city: { type: String, required: true },
      district: { type: String },
      taluka: { type: String },
      state: { type: String, required: true },
      zipCode: { type: String, required: false },
      pinCode: { type: String, required: false, default: '' },
      country: { type: String, required: true, default: 'IN' },
    },
    deliveryDate: { type: Date },
    notes: { type: String, maxlength: 1000 },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'pending' as PaymentStatus,
    },
    paymentMethod: { type: String },
    /** Unique transaction ID from payment gateway */
    transactionId: { type: String, sparse: true, index: true },
    trackingNumber: { type: String },
    messageHistory: [{
      senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      senderName: { type: String },
      senderRole: { type: String },
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }],
    isActive: { type: Boolean, default: true },
    
    // ─── B2B Deal Management Fields ──────────────────────────────────────────────────────
    
    // Deal Confirmation
    dealConfirmation: {
      status: {
        type: String,
        enum: DEAL_CONFIRMATION_STATUS,
        default: 'pending' as DealConfirmationStatus,
      },
      buyerConfirmedAt: { type: Date },
      farmerConfirmedAt: { type: Date },
      buyerNotes: { type: String, maxlength: 500 },
      farmerNotes: { type: String, maxlength: 500 },
    },
    
    // Negotiation reference
    negotiationId: { type: Schema.Types.ObjectId, ref: 'Negotiation' },
    agreedPricePerUnit: { type: Number, min: 0 },
    agreedQuantity: { type: Number, min: 0 },
    
    // Procurement & Pickup
    procurement: {
      arrangedBy: {
        type: String,
        enum: ['buyer', 'farmer', 'third_party'],
        default: 'buyer',
      },
      transporterName: { type: String },
      transporterContact: { type: String },
      vehicleNumber: { type: String },
      pickupScheduledAt: { type: Date },
      actualPickupAt: { type: Date },
    },
    
    // Weight/Quantity Verification at Pickup
    verification: {
      requestedQuantity: { type: Number, min: 0.01 },
      actualQuantity: { type: Number, min: 0 },
      quantityUnit: { type: String, required: true, default: 'quintal' },
      verifiedAt: { type: Date },
      verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      verificationNotes: { type: String, maxlength: 500 },
      qualityGrade: { type: String },
      qualityCheckPassed: { type: Boolean },
    },
    
    // Delivery tracking
    delivery: {
      estimatedDeliveryDate: { type: Date },
      actualDeliveryDate: { type: Date },
      deliveryNotes: { type: String, maxlength: 500 },
      proofOfDelivery: [{ type: String }], // Image URLs
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate order number before saving
OrderSchema.pre('save', function (this: IOrder & mongoose.Document, next: mongoose.CallbackWithoutResultAndOptionalError) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `AGV-${timestamp}-${random}`;
  }
  next();
});

// Indexes — note: orderNumber has unique:true on the field, no extra index needed
OrderSchema.index({ tenantId: 1, farmerId: 1, status: 1 });
OrderSchema.index({ tenantId: 1, buyerId: 1, status: 1 });
OrderSchema.index({ tenantId: 1, createdAt: -1 });

export default mongoose.model<IOrder>('Order', OrderSchema);
