import mongoose, { Document } from 'mongoose';
export declare const CROP_STATUSES: readonly ["growing", "ready_to_harvest", "harvested", "diseased", "dormant"];
export type CropStatus = typeof CROP_STATUSES[number];
export declare const CROP_HEALTH_SCORES: readonly ["excellent", "good", "fair", "poor", "critical"];
export type CropHealthScore = typeof CROP_HEALTH_SCORES[number];
/** AI-derived triage status — set by the HealthScan / Gemini Vision analysis */
export declare const CROP_AI_STATUSES: readonly ["HEALTHY", "STRESSED", "DISEASED", "UNKNOWN"];
export type CropAIStatus = typeof CROP_AI_STATUSES[number];
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
    lastScannedAt?: Date;
    notes?: string;
    images: string[];
    weatherData?: IWeatherData;
    soilData?: ISoilData;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ICrop, {}, {}, {}, mongoose.Document<unknown, {}, ICrop, {}, {}> & ICrop & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Crop.d.ts.map