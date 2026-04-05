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
exports.CROP_AI_STATUSES = exports.CROP_HEALTH_SCORES = exports.CROP_STATUSES = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// ─── Strict Enums ───────────────────────────────────────────────────────────────────────
exports.CROP_STATUSES = ['growing', 'ready_to_harvest', 'harvested', 'diseased', 'dormant'];
exports.CROP_HEALTH_SCORES = ['excellent', 'good', 'fair', 'poor', 'critical'];
/** AI-derived triage status — set by the HealthScan / Gemini Vision analysis */
exports.CROP_AI_STATUSES = ['HEALTHY', 'STRESSED', 'DISEASED', 'UNKNOWN'];
const CropSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    farmerId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        enum: exports.CROP_STATUSES,
        default: 'growing',
    },
    healthScore: {
        type: String,
        enum: exports.CROP_HEALTH_SCORES,
        default: 'good',
    },
    aiStatus: {
        type: String,
        enum: exports.CROP_AI_STATUSES,
        default: 'UNKNOWN',
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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Compound indexes for performance
CropSchema.index({ tenantId: 1, farmerId: 1 });
CropSchema.index({ tenantId: 1, status: 1 });
CropSchema.index({ tenantId: 1, createdAt: -1 });
// Virtual: days until harvest
CropSchema.virtual('daysUntilHarvest').get(function () {
    const target = this.predictedHarvestDate || this.expectedHarvestDate;
    const diff = target.getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
});
exports.default = mongoose_1.default.model('Crop', CropSchema);
//# sourceMappingURL=Crop.js.map