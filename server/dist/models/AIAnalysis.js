"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const TreatmentStepSchema = new mongoose_1.Schema({
    step: { type: Number, required: true },
    action: { type: String, required: true },
    timing: { type: String, required: true },
    product: { type: String },
});
const AIAnalysisSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    farmerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    cropId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        recommendedTreatment: { type: String, default: '' },
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
        sprayInstructions: { type: String, default: '' },
        requiredNutrients: [{ type: String }],
        preventionTips: [{ type: String }],
        estimatedRecoveryDays: { type: Number, default: 0 },
    },
    aiModel: { type: String, required: true },
    processingTimeMs: { type: Number, default: 0 },
    rawResponse: { type: String, select: false },
    isArchived: { type: Boolean, default: false },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Indexes
AIAnalysisSchema.index({ tenantId: 1, farmerId: 1, createdAt: -1 });
AIAnalysisSchema.index({ tenantId: 1, 'diagnosis.severity': 1 });
exports.default = mongoose_1.default.model('AIAnalysis', AIAnalysisSchema);
//# sourceMappingURL=AIAnalysis.js.map