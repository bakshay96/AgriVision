import mongoose, { Document, Schema } from 'mongoose';

// ─── Strict Enums ───────────────────────────────────────────────────────────────────────
export const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const;
export type PaymentStatus = typeof PAYMENT_STATUSES[number];

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
      street: { type: String, required: true },
      city: { type: String, required: true },
      district: { type: String },
      taluka: { type: String },
      state: { type: String, required: true },
      zipCode: { type: String, required: false },
      pinCode: { type: String, required: true },
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
