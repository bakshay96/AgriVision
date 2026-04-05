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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_ROLES = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// ─── Strict Role Enum (per spec: FARMER | BUYER | ADMIN) ─────────────────────
exports.USER_ROLES = ['FARMER', 'BUYER', 'ADMIN'];
const UserSchema = new mongoose_1.Schema({
    tenantId: {
        type: String,
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false,
    },
    role: {
        type: String,
        enum: exports.USER_ROLES,
        default: 'FARMER',
    },
    farmName: { type: String, trim: true },
    farmLocation: {
        lat: { type: Number, min: -90, max: 90 },
        lng: { type: Number, min: -180, max: 180 },
        address: { type: String, trim: true, maxlength: 500 },
    },
    farmSizeAcres: { type: Number, min: 0 },
    phoneNumber: { type: String, trim: true },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    // New fields for enhanced farmer profile
    selectedCrops: [{ type: String, maxlength: 50 }],
    preferredLanguage: { type: String, enum: ['en', 'hi', 'mr'], default: 'en' },
    state: { type: String, trim: true },
    district: { type: String, trim: true },
    taluka: { type: String, trim: true },
    village: { type: String, trim: true },
    pincode: { type: String, trim: true, match: /^[0-9]{6}$/ },
    aadharNumber: { type: String, trim: true, match: /^[0-9]{12}$/ },
    bankDetails: {
        accountNumber: { type: String, trim: true },
        ifscCode: { type: String, trim: true, match: /^[A-Z]{4}0[A-Z0-9]{6}$/ },
        bankName: { type: String, trim: true },
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Indexes for multi-tenancy performance
UserSchema.index({ tenantId: 1, email: 1 });
UserSchema.index({ tenantId: 1, role: 1 });
// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    const salt = await bcryptjs_1.default.genSalt(12);
    this.password = await bcryptjs_1.default.hash(this.password, salt);
    next();
});
// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
exports.default = mongoose_1.default.model('User', UserSchema);
//# sourceMappingURL=User.js.map