import mongoose, { Schema, Document } from 'mongoose';

export interface IUpload extends Document {
  tenantId: string;
  userId: mongoose.Types.ObjectId;
  url: string;
  key: string;
  originalName: string;
  size: number;
  mimeType: string;
  folder: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UploadSchema: Schema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    folder: {
      type: String,
      default: 'uploads',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUpload>('Upload', UploadSchema);
