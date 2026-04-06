"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAYMENT_STATUSES = exports.ORDER_STATUSES = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// ─── Strict Enums ───────────────────────────────────────────────────────────────────────
exports.ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
exports.PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
const OrderItemSchema = new mongoose_1.Schema({
    inventoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    cropName: { type: String, required: true },
    variety: { type: String, default: 'Standard' },
    quantity: { type: Number, required: true, min: 0.01 },
    unit: { type: String, required: true, default: 'ton' },
    pricePerUnit: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
});
const OrderSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    orderNumber: { type: String, unique: true },
    buyerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    farmerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    status: {
        type: String,
        enum: exports.ORDER_STATUSES,
        default: 'pending',
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
        enum: exports.PAYMENT_STATUSES,
        default: 'pending',
    },
    paymentMethod: { type: String },
    /** Unique transaction ID from payment gateway */
    transactionId: { type: String, sparse: true, index: true },
    trackingNumber: { type: String },
    messageHistory: [{
            senderId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
            senderName: { type: String },
            senderRole: { type: String },
            message: { type: String, required: true },
            timestamp: { type: Date, default: Date.now }
        }],
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Auto-generate order number before saving
OrderSchema.pre('save', function (next) {
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
exports.default = mongoose_1.default.model('Order', OrderSchema);
//# sourceMappingURL=Order.js.map