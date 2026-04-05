import mongoose, { Document } from 'mongoose';
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
    diagnosis: {
        plantName: string;
        disease: string;
        confidence: number;
        severity: DiagnosisSeverity;
        affectedArea: string;
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
    aiModel: string;
    processingTimeMs: number;
    rawResponse?: string;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IAIAnalysis, {}, {}, {}, mongoose.Document<unknown, {}, IAIAnalysis, {}, {}> & IAIAnalysis & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=AIAnalysis.d.ts.map