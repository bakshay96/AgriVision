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
const PlantingGuideSchema = new mongoose_1.Schema({
    season: { type: String, required: true },
    months: [{ type: String }],
    soilType: [{ type: String }],
    soilPH: {
        min: { type: Number },
        max: { type: Number },
    },
    temperature: {
        min: { type: Number },
        max: { type: Number },
        optimal: { type: Number },
    },
    rainfall: {
        min: { type: Number },
        max: { type: Number },
    },
    spacing: { type: String },
    seedDepth: { type: String },
    germinationDays: { type: Number },
});
const CareGuideSchema = new mongoose_1.Schema({
    watering: { type: String },
    fertilization: [{ type: String }],
    pruning: { type: String },
    pestControl: [{ type: String }],
    diseasePrevention: [{ type: String }],
    weedManagement: { type: String },
});
const PestDiseaseSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['pest', 'disease'], required: true },
    symptoms: [{ type: String }],
    causes: [{ type: String }],
    organicRemedies: [{ type: String }],
    chemicalTreatments: [{ type: String }],
    prevention: [{ type: String }],
    images: [{ type: String }],
});
const HarvestInfoSchema = new mongoose_1.Schema({
    daysToMaturity: { type: Number },
    indicators: [{ type: String }],
    harvestingMethod: { type: String },
    postHarvestHandling: [{ type: String }],
    storageConditions: { type: String },
    shelfLife: { type: String },
});
const CropEncyclopediaSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, index: true },
    scientificName: { type: String },
    family: { type: String },
    origin: { type: String },
    description: { type: String },
    category: {
        type: String,
        enum: ['cereal', 'pulse', 'oilseed', 'vegetable', 'fruit', 'spice', 'fiber', 'fodder', 'cash_crop'],
        required: true,
    },
    images: [{ type: String }],
    varieties: [{
            name: { type: String },
            characteristics: [{ type: String }],
            yield: { type: String },
            diseaseResistance: [{ type: String }],
            daysToMaturity: { type: Number },
        }],
    plantingGuide: PlantingGuideSchema,
    careGuide: CareGuideSchema,
    pestsAndDiseases: [PestDiseaseSchema],
    harvestInfo: HarvestInfoSchema,
    nutritionalValue: {
        calories: { type: Number },
        protein: { type: Number },
        carbohydrates: { type: Number },
        fiber: { type: Number },
        vitamins: [{ type: String }],
        minerals: [{ type: String }],
    },
    marketInfo: {
        demand: { type: String, enum: ['high', 'medium', 'low'] },
        priceRange: {
            min: { type: Number },
            max: { type: Number },
            unit: { type: String },
        },
        exportPotential: { type: Boolean, default: false },
        majorMarkets: [{ type: String }],
    },
    companionCrops: [{ type: String }],
    rotationCrops: [{ type: String }],
    searchTags: [{ type: String }],
    isActive: { type: Boolean, default: true },
    viewCount: { type: Number, default: 0 },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Text search index
CropEncyclopediaSchema.index({ name: 'text', scientificName: 'text', description: 'text', searchTags: 'text' });
CropEncyclopediaSchema.index({ tenantId: 1, category: 1 });
CropEncyclopediaSchema.index({ tenantId: 1, isActive: 1 });
exports.default = mongoose_1.default.model('CropEncyclopedia', CropEncyclopediaSchema);
//# sourceMappingURL=CropEncyclopedia.js.map