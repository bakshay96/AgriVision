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
const WeatherForecastSchema = new mongoose_1.Schema({
    date: { type: Date, required: true },
    temperature: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
        avg: { type: Number, required: true },
    },
    humidity: { type: Number, required: true, min: 0, max: 100 },
    rainfall: { type: Number, default: 0 },
    windSpeed: { type: Number, default: 0 },
    condition: { type: String, required: true },
    icon: { type: String, required: true },
    uvIndex: { type: Number, default: 0 },
    precipitationProbability: { type: Number, default: 0, min: 0, max: 100 },
});
const WeatherAlertSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ['heavy_rain', 'drought', 'frost', 'heat_wave', 'strong_wind', 'pest_favorable'],
        required: true,
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    affectedCrops: [{ type: String }],
    recommendations: [{ type: String }],
});
const WeatherSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    farmerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        address: { type: String, required: true },
    },
    current: {
        temperature: { type: Number, required: true },
        humidity: { type: Number, required: true },
        rainfall: { type: Number, default: 0 },
        windSpeed: { type: Number, default: 0 },
        condition: { type: String, required: true },
        icon: { type: String, required: true },
        uvIndex: { type: Number, default: 0 },
        feelsLike: { type: Number, required: true },
        pressure: { type: Number, default: 1013 },
        visibility: { type: Number, default: 10 },
        lastUpdated: { type: Date, default: Date.now },
    },
    forecast: [WeatherForecastSchema],
    alerts: [WeatherAlertSchema],
    cropRecommendations: [{
            cropId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Crop' },
            cropName: { type: String, required: true },
            action: { type: String, required: true },
            priority: { type: String, enum: ['low', 'medium', 'high'], required: true },
            reason: { type: String, required: true },
        }],
    lastUpdated: { type: Date, default: Date.now },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Indexes for performance
WeatherSchema.index({ tenantId: 1, farmerId: 1, lastUpdated: -1 });
WeatherSchema.index({ tenantId: 1, 'alerts.severity': 1 });
exports.default = mongoose_1.default.model('Weather', WeatherSchema);
//# sourceMappingURL=Weather.js.map