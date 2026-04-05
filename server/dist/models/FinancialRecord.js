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
exports.Budget = exports.FinancialRecord = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const FinancialRecordSchema = new mongoose_1.Schema({
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
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true,
    },
    category: {
        type: String,
        required: true,
        enum: [
            // Singular (original)
            'seed', 'fertilizer', 'pesticide', 'labor', 'equipment', 'irrigation',
            'transport', 'storage', 'packaging', 'marketing', 'insurance',
            'loan_repayment', 'land_lease', 'utilities', 'maintenance',
            'crop_sale', 'government_subsidy', 'insurance_claim', 'other_income',
            'other_expense',
            // Plural / UI aliases
            'seeds', 'fertilizers', 'pesticides', 'equipment_rental',
            'harvesting', 'weeding', 'ploughing', 'fuel', 'veterinary',
            'tools', 'machinery', 'rent', 'wages', 'miscellaneous',
            // Income aliases
            'sale', 'subsidy', 'loan', 'grant', 'dairy', 'poultry', 'other',
        ],
    },
    subcategory: { type: String },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    date: { type: Date, required: true },
    description: { type: String },
    paymentMethod: {
        type: String,
        enum: ['cash', 'bank_transfer', 'upi', 'cheque', 'card', 'other'],
    },
    receiptUrl: { type: String },
    relatedOrderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Order',
    },
    tags: [{ type: String }],
    isRecurring: { type: Boolean, default: false },
    recurringFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
    },
    isTaxDeductible: { type: Boolean, default: false },
    gstAmount: { type: Number, default: 0 },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
const BudgetSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    farmerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    cropId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Crop',
    },
    season: { type: String, required: true },
    year: { type: Number, required: true },
    category: { type: String, required: true },
    allocatedAmount: { type: Number, required: true, min: 0 },
    spentAmount: { type: Number, default: 0, min: 0 },
    notes: { type: String },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Indexes
FinancialRecordSchema.index({ tenantId: 1, farmerId: 1, date: -1 });
FinancialRecordSchema.index({ tenantId: 1, farmerId: 1, type: 1, category: 1 });
FinancialRecordSchema.index({ tenantId: 1, farmerId: 1, cropId: 1 });
BudgetSchema.index({ tenantId: 1, farmerId: 1, year: -1, season: 1 });
exports.FinancialRecord = mongoose_1.default.model('FinancialRecord', FinancialRecordSchema);
exports.Budget = mongoose_1.default.model('Budget', BudgetSchema);
//# sourceMappingURL=FinancialRecord.js.map