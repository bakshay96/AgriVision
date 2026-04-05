import mongoose, { Document, Schema } from 'mongoose';

// ─── Strict Enums ───────────────────────────────────────────────────────────────────────
export const CROP_STATUSES = ['growing', 'ready_to_harvest', 'harvested', 'diseased', 'dormant'] as const;
export type CropStatus = typeof CROP_STATUSES[number];

export const CROP_HEALTH_SCORES = ['excellent', 'good', 'fair', 'poor', 'critical'] as const;
export type CropHealthScore = typeof CROP_HEALTH_SCORES[number];

/** AI-derived triage status — set by the HealthScan / Gemini Vision analysis */
export const CROP_AI_STATUSES = ['HEALTHY', 'STRESSED', 'DISEASED', 'UNKNOWN'] as const;
export type CropAIStatus = typeof CROP_AI_STATUSES[number];

// ─── Sub-document interfaces ──────────────────────────────────────────────────────────────
export interface IWeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  lastUpdated: Date;
}

export interface ISoilData {
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}

// ─── Main Crop Interface ───────────────────────────────────────────────────────────────────
export interface ICrop extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: string;
  farmerId: mongoose.Types.ObjectId;
  name: string;
  variety: string;
  fieldLocation: string;
  plantedDate: Date;
  expectedHarvestDate: Date;
  predictedHarvestDate?: Date;
  status: CropStatus;
  healthScore: CropHealthScore;
  /** AI triage status set by Gemini Vision analysis (HEALTHY | STRESSED | DISEASED) */
  aiStatus: CropAIStatus;
  aiStatusUpdatedAt?: Date;
  areaAcres: number;
  expectedYieldTons: number;
  currentYieldEstimate?: number;
  irrigationSchedule?: string;
  lastInspectionDate?: Date;
  lastScannedAt?: Date; // Last AI scan timestamp
  notes?: string;
  images: string[];
  weatherData?: IWeatherData;
  soilData?: ISoilData;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CropSchema = new Schema<ICrop>(
  {
    tenantId: { type: String, required: true, index: true },
    farmerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
    },
    variety: { type: String, trim: true, default: 'Standard' },
    fieldLocation: {
      type: String,
      required: [true, 'Field location is required'],
      trim: true,
    },
    plantedDate: { type: Date, required: [true, 'Planted date is required'] },
    expectedHarvestDate: {
      type: Date,
      required: [true, 'Expected harvest date is required'],
    },
    predictedHarvestDate: { type: Date },
    status: {
      type: String,
      enum: CROP_STATUSES,
      default: 'growing' as CropStatus,
    },
    healthScore: {
      type: String,
      enum: CROP_HEALTH_SCORES,
      default: 'good' as CropHealthScore,
    },
    aiStatus: {
      type: String,
      enum: CROP_AI_STATUSES,
      default: 'UNKNOWN' as CropAIStatus,
    },
    aiStatusUpdatedAt: { type: Date },
    areaAcres: { type: Number, required: true, min: 0 },
    expectedYieldTons: { type: Number, required: true, min: 0 },
    currentYieldEstimate: { type: Number, min: 0 },
    irrigationSchedule: { type: String },
    lastInspectionDate: { type: Date },
    lastScannedAt: { type: Date },
    notes: { type: String, maxlength: 2000 },
    images: [{ type: String }],
    weatherData: {
      temperature: Number,
      humidity: Number,
      rainfall: Number,
      lastUpdated: Date,
    },
    soilData: {
      ph: Number,
      nitrogen: Number,
      phosphorus: Number,
      potassium: Number,
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for performance
CropSchema.index({ tenantId: 1, farmerId: 1 });
CropSchema.index({ tenantId: 1, status: 1 });
CropSchema.index({ tenantId: 1, createdAt: -1 });

// Virtual: days until harvest
CropSchema.virtual('daysUntilHarvest').get(function (this: ICrop) {
  const target = this.predictedHarvestDate || this.expectedHarvestDate;
  const diff = target.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

export default mongoose.model<ICrop>('Crop', CropSchema);
