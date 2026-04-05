import mongoose, { Document } from 'mongoose';
export declare const ORDER_STATUSES: readonly ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
export type OrderStatus = typeof ORDER_STATUSES[number];
export declare const PAYMENT_STATUSES: readonly ["pending", "paid", "failed", "refunded"];
export type PaymentStatus = typeof PAYMENT_STATUSES[number];
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
}
declare const _default: mongoose.Model<IOrder, {}, {}, {}, mongoose.Document<unknown, {}, IOrder, {}, {}> & IOrder & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Order.d.ts.map