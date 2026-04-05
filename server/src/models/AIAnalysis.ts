import mongoose, { Document, Schema } from 'mongoose';

export type DiagnosisSeverity = 'healthy' | 'mild' | 'moderate' | 'severe' | 'critical';

export interface ITreatmentStep {
  step: number;
  action: string;
  timing: string;
  product?: string;
}

export interface IAIAnalysis extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: string;
  farmerId: mongoose.Types.ObjectId;
  cropId?: mongoose.Types.ObjectId;
  imageUrl: string;
  imageName: string;
  analysisType: 'disease_detection' | 'yield_prediction' | 'soil_analysis';
  // Gemini Vision response fields
  diagnosis: {
    plantName: string;
    disease: string;
    confidence: number; // 0-100
    severity: DiagnosisSeverity;
    affectedArea: string; // e.g., "30% of visible leaves"
    description: string;
    symptoms: string[];
  };
  treatmentPlan: {
    urgency: 'immediate' | 'within_week' | 'routine';
    steps: ITreatmentStep[];
    organicRemedies: string[];
    chemicalTreatments: string[];
    preventionTips: string[];
    estimatedRecoveryDays: number;
  };
  aiModel: string; // e.g., "gemini-1.5-pro-vision"
  processingTimeMs: number;
  rawResponse?: string; // Store raw AI response for auditing
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TreatmentStepSchema = new Schema<ITreatmentStep>({
  step: { type: Number, required: true },
  action: { type: String, required: true },
  timing: { type: String, required: true },
  product: { type: String },
});

const AIAnalysisSchema = new Schema<IAIAnalysis>(
  {
    tenantId: { type: String, required: true, index: true },
    farmerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cropId: {
      type: Schema.Types.ObjectId,
      ref: 'Crop',
    },
    imageUrl: { type: String, required: false, default: '' },
    imageName: { type: String, required: true },
    analysisType: {
      type: String,
      enum: ['disease_detection', 'yield_prediction', 'soil_analysis'],
      default: 'disease_detection',
    },
    diagnosis: {
      plantName: { type: String, default: 'Unknown Plant' },
      disease: { type: String, required: true },
      confidence: { type: Number, min: 0, max: 100, required: true },
      severity: {
        type: String,
        enum: ['healthy', 'mild', 'moderate', 'severe', 'critical'],
        required: true,
      },
      affectedArea: { type: String, default: 'Unknown' },
      description: { type: String, required: true },
      symptoms: [{ type: String }],
    },
    treatmentPlan: {
      urgency: {
        type: String,
        enum: ['immediate', 'within_week', 'routine'],
        default: 'routine',
      },
      steps: [TreatmentStepSchema],
      organicRemedies: [{ type: String }],
      chemicalTreatments: [{ type: String }],
      preventionTips: [{ type: String }],
      estimatedRecoveryDays: { type: Number, default: 0 },
    },
    aiModel: { type: String, required: true },
    processingTimeMs: { type: Number, default: 0 },
    rawResponse: { type: String, select: false },
    isArchived: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
AIAnalysisSchema.index({ tenantId: 1, farmerId: 1, createdAt: -1 });
AIAnalysisSchema.index({ tenantId: 1, 'diagnosis.severity': 1 });

export default mongoose.model<IAIAnalysis>('AIAnalysis', AIAnalysisSchema);
