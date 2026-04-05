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
const MarketPriceSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Compound indexes for efficient queries
MarketPriceSchema.index({ tenantId: 1, cropName: 1, arrivalDate: -1 });
MarketPriceSchema.index({ tenantId: 1, 'marketLocation.state': 1, 'marketLocation.district': 1 });
MarketPriceSchema.index({ tenantId: 1, cropName: 1, 'marketLocation.state': 1, arrivalDate: -1 });
exports.default = mongoose_1.default.model('MarketPrice', MarketPriceSchema);
//# sourceMappingURL=MarketPrice.js.map