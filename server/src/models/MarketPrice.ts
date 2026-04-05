import mongoose, { Document, Schema } from 'mongoose';

export interface IMarketPrice extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: string;
  cropName: string;
  variety: string;
  marketName: string;
  marketLocation: {
    lat: number;
    lng: number;
    address: string;
    state: string;
    district: string;
  };
  price: {
    min: number;
    max: number;
    modal: number;
    unit: string;
  };
  arrivalDate: Date;
  quantity: {
    value: number;
    unit: string;
  };
  grade: string;
  priceTrend: 'up' | 'down' | 'stable';
  priceChangePercent: number;
  lastWeekAvgPrice: number;
  lastMonthAvgPrice: number;
  isOrganic: boolean;
  source: string;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MarketPriceSchema = new Schema<IMarketPrice>(
  {
    tenantId: { type: String, required: true, index: true },
    cropName: { type: String, required: true, index: true },
    variety: { type: String, default: 'Standard' },
    marketName: { type: String, required: true },
    marketLocation: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String },
      state: { type: String, required: true },
      district: { type: String, required: true },
    },
    price: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      modal: { type: Number, required: true },
      unit: { type: String, default: 'per quintal' },
    },
    arrivalDate: { type: Date, required: true },
    quantity: {
      value: { type: Number, default: 0 },
      unit: { type: String, default: 'quintals' },
    },
    grade: { type: String, default: 'Average' },
    priceTrend: {
      type: String,
      enum: ['up', 'down', 'stable'],
      default: 'stable',
    },
    priceChangePercent: { type: Number, default: 0 },
    lastWeekAvgPrice: { type: Number },
    lastMonthAvgPrice: { type: Number },
    isOrganic: { type: Boolean, default: false },
    source: { type: String, default: 'Agmarknet' },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for efficient queries
MarketPriceSchema.index({ tenantId: 1, cropName: 1, arrivalDate: -1 });
MarketPriceSchema.index({ tenantId: 1, 'marketLocation.state': 1, 'marketLocation.district': 1 });
MarketPriceSchema.index({ tenantId: 1, cropName: 1, 'marketLocation.state': 1, arrivalDate: -1 });

export default mongoose.model<IMarketPrice>('MarketPrice', MarketPriceSchema);
