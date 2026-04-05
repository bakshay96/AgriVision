import mongoose, { Document, Schema } from 'mongoose';

export type InventoryUnit = 'ton' | 'kg' | 'lb' | 'bushel' | 'crate' | 'box' | 'quintal';
export type InventoryStatus = 'available' | 'low_stock' | 'out_of_stock' | 'reserved';

export interface IInventory extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: string;
  farmerId: mongoose.Types.ObjectId;
  cropId?: mongoose.Types.ObjectId;
  cropName: string;
  variety: string;
  description?: string;
  quantity: number;
  unit: InventoryUnit;
  pricePerUnit: number;
  currency: string;
  status: InventoryStatus;
  minimumOrderQuantity: number;
  availableFrom: Date;
  expiryDate?: Date;
  harvestDate?: Date;
  certifications: string[]; // e.g. ['Organic', 'Non-GMO', 'Fair Trade']
  images: string[];
  location: {
    address: string;
    city: string;
    district?: string;
    taluka?: string;
    state: string;
    country: string;
    pin: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  isFeatured: boolean;
  totalOrders: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>(
  {
    tenantId: { type: String, required: true },
    farmerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cropId: { type: Schema.Types.ObjectId, ref: 'Crop' },
    cropName: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
    },
    variety: { type: String, trim: true, default: 'Standard' },
    description: { type: String, maxlength: 2000 },
    quantity: { type: Number, required: true, min: 0 },
    unit: {
      type: String,
      enum: ['ton', 'kg', 'lb', 'bushel', 'crate', 'box', 'quintal'],
      default: 'ton',
    },
    pricePerUnit: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    status: {
      type: String,
      enum: ['available', 'low_stock', 'out_of_stock', 'reserved'],
      default: 'available',
    },
    minimumOrderQuantity: { type: Number, default: 1, min: 0.01 },
    availableFrom: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    harvestDate: { type: Date },
    certifications: [{ type: String }],
    images: [{ type: String }],
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      district: { type: String },
      taluka: { type: String },
      state: { type: String, required: true },
      country: { type: String, required: true, default: 'IN' },
      pin:   { type:String, required:true },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    isFeatured: { type: Boolean, default: false },
    totalOrders: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Text search index for marketplace search
InventorySchema.index({
  cropName: 'text',
  variety: 'text',
  description: 'text',
  'location.city': 'text',
});
InventorySchema.index({ tenantId: 1, status: 1, isActive: 1 });
InventorySchema.index({ tenantId: 1, cropName: 1 });
InventorySchema.index({ pricePerUnit: 1 });
InventorySchema.index({ isFeatured: 1, isActive: 1 });

// Auto-update status based on quantity
InventorySchema.pre('save', function (this: IInventory & mongoose.Document, next: mongoose.CallbackWithoutResultAndOptionalError) {
  if (this.isModified('quantity')) {
    if (this.quantity <= 0) {
      this.status = 'out_of_stock';
    } else if (this.quantity <= this.minimumOrderQuantity * 2) {
      this.status = 'low_stock';
    } else {
      this.status = 'available';
    }
  }
  next();
});

export default mongoose.model<IInventory>('Inventory', InventorySchema);
