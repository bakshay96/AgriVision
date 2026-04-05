import mongoose, { Document, Schema } from 'mongoose';

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

const NotificationSchema = new Schema<INotification>(
  {
    tenantId: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { 
      type: String, 
      required: true,
      enum: ['ORDER_STATUS_UPDATE', 'LOW_STOCK', 'NEW_ORDER', 'AI_ANALYSIS_COMPLETE', 'SYSTEM']
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    inventoryId: { type: Schema.Types.ObjectId, ref: 'Inventory' },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>('Notification', NotificationSchema);
