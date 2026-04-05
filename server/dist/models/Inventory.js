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
const InventorySchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true },
    farmerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    cropId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Crop' },
    cropName: {
        type: String,
        required: [true, 'Crop name is required'],
        trim: true,
    },
    variety: { type: String, trim: true, default: 'Standard' },
    description: { type: String, maxlength: 2000 },
    quantity: { type: Number, required: true, min: 0 },
    unit: {
        type: String,
        enum: ['ton', 'kg', 'lb', 'bushel', 'crate', 'box', 'quintal'],
        default: 'ton',
    },
    pricePerUnit: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    status: {
        type: String,
        enum: ['available', 'low_stock', 'out_of_stock', 'reserved'],
        default: 'available',
    },
    minimumOrderQuantity: { type: Number, default: 1, min: 0.01 },
    availableFrom: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    harvestDate: { type: Date },
    certifications: [{ type: String }],
    images: [{ type: String }],
    location: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        district: { type: String },
        taluka: { type: String },
        state: { type: String, required: true },
        country: { type: String, required: true, default: 'IN' },
        pin: { type: String, required: true },
        coordinates: {
            lat: Number,
            lng: Number,
        },
    },
    isFeatured: { type: Boolean, default: false },
    totalOrders: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Text search index for marketplace search
InventorySchema.index({
    cropName: 'text',
    variety: 'text',
    description: 'text',
    'location.city': 'text',
});
InventorySchema.index({ tenantId: 1, status: 1, isActive: 1 });
InventorySchema.index({ tenantId: 1, cropName: 1 });
InventorySchema.index({ pricePerUnit: 1 });
InventorySchema.index({ isFeatured: 1, isActive: 1 });
// Auto-update status based on quantity
InventorySchema.pre('save', function (next) {
    if (this.isModified('quantity')) {
        if (this.quantity <= 0) {
            this.status = 'out_of_stock';
        }
        else if (this.quantity <= this.minimumOrderQuantity * 2) {
            this.status = 'low_stock';
        }
        else {
            this.status = 'available';
        }
    }
    next();
});
exports.default = mongoose_1.default.model('Inventory', InventorySchema);
//# sourceMappingURL=Inventory.js.map