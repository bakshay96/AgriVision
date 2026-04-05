import { CropAIStatus } from '../models/Crop';
export type AIErrorCode = 'API_UNAVAILABLE' | 'INVALID_KEY' | 'RATE_LIMITED' | 'PARSE_ERROR' | 'MODEL_NOT_FOUND' | 'INVALID_IMAGE';
export declare class AIServiceError extends Error {
    readonly code: AIErrorCode;
    readonly originalError?: unknown | undefined;
    constructor(code: AIErrorCode, message: string, originalError?: unknown | undefined);
}
/** Simplified scan result — aligned with the user-facing DiagnosisCard */
export interface ScanResult {
    condition: string;
    plantName: string;
    confidenceScore: number;
    severity: 'healthy' | 'mild' | 'moderate' | 'severe' | 'critical';
    symptoms: string[];
    recommendedTreatment: string;
    organicRemedies: string[];
    chemicalTreatments: string[];
    affectedArea: string;
    description: string;
    aiModel: string;
    processingTimeMs: number;
}
/** Legacy full diagnosis (kept for backward-compat with existing /analyze route) */
export interface CropDiagnosisResult {
    disease: string;
    plantName: string;
    confidence: number;
    severity: 'healthy' | 'mild' | 'moderate' | 'severe' | 'critical';
    affectedArea: string;
    description: string;
    symptoms: string[];
    treatmentPlan: {
        urgency: 'immediate' | 'within_week' | 'routine';
        steps: Array<{
            step: number;
            action: string;
            timing: string;
            product?: string;
        }>;
        preventionTips: string[];
        estimatedRecoveryDays: number;
    };
    aiModel: string;
    processingTimeMs: number;
}
export interface HarvestPredictionResult {
    cropName: string;
    predictedHarvestDate: Date;
    confidenceLevel: number;
    daysFromNow: number;
    factors: string[];
    yieldEstimate: number;
    yieldUnit: string;
    recommendations: string[];
}
export declare const analyzeImageBuffer: (buffer: Buffer, mimeType: string, language?: string) => Promise<ScanResult>;
export declare const analyzeImageWithGemini: (imagePath: string, mimeType?: string) => Promise<CropDiagnosisResult>;
export declare const predictHarvestDate: (params: {
    cropName: string;
    plantedDate: Date;
    areaAcres: number;
    soilPh?: number;
    rainfall?: number;
}) => Promise<HarvestPredictionResult>;
export declare const mapSeverityToAIStatus: (severity: string) => CropAIStatus;
//# sourceMappingURL=aiService.d.ts.map