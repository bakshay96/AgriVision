import mongoose, { Document } from 'mongoose';
export declare const ORDER_STATUSES: readonly ["pending", "negotiating", "deal_confirmed", "ready_for_pickup", "picked_up", "in_transit", "delivered", "cancelled"];
export type OrderStatus = typeof ORDER_STATUSES[number];
export declare const PAYMENT_STATUSES: readonly ["pending", "paid", "failed", "refunded"];
export type PaymentStatus = typeof PAYMENT_STATUSES[number];
export declare const DEAL_CONFIRMATION_STATUS: readonly ["pending", "buyer_confirmed", "farmer_confirmed", "both_confirmed"];
export type DealConfirmationStatus = typeof DEAL_CONFIRMATION_STATUS[number];
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
    dealConfirmation: {
        status: DealConfirmationStatus;
        buyerConfirmedAt?: Date;
        farmerConfirmedAt?: Date;
        buyerNotes?: string;
        farmerNotes?: string;
    };
    negotiationId?: mongoose.Types.ObjectId;
    agreedPricePerUnit?: number;
    agreedQuantity?: number;
    procurement: {
        arrangedBy: 'buyer' | 'farmer' | 'third_party';
        transporterName?: string;
        transporterContact?: string;
        vehicleNumber?: string;
        pickupScheduledAt?: Date;
        actualPickupAt?: Date;
    };
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
    delivery: {
        estimatedDeliveryDate?: Date;
        actualDeliveryDate?: Date;
        deliveryNotes?: string;
        proofOfDelivery?: string[];
    };
}
declare const _default: mongoose.Model<IOrder, {}, {}, {}, mongoose.Document<unknown, {}, IOrder, {}, {}> & IOrder & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Order.d.ts.map