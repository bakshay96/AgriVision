import mongoose, { Document } from 'mongoose';
export interface INotification extends Document {
    tenantId: string;
    userId: mongoose.Types.ObjectId;
    type: 'ORDER_STATUS_UPDATE' | 'LOW_STOCK' | 'NEW_ORDER' | 'AI_ANALYSIS_COMPLETE' | 'SYSTEM';
    message: string;
    isRead: boolean;
    orderId?: mongoose.Types.ObjectId;
    inventoryId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<INotification, {}, {}, {}, mongoose.Document<unknown, {}, INotification, {}, {}> & INotification & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Notification.d.ts.map