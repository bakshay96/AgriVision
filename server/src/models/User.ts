import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// ─── Strict Role Enum (per spec: FARMER | BUYER | ADMIN) ─────────────────────
export const USER_ROLES = ['FARMER', 'BUYER', 'ADMIN'] as const;
export type UserRole = typeof USER_ROLES[number];

// ─── FarmLocation sub-document interface ─────────────────────────────────────
export interface IFarmLocation {
  lat: number;
  lng: number;
  address?: string; // human-readable address (optional)
}

// ─── Main User Interface ──────────────────────────────────────────────────────
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  farmName?: string;
  /** Structured geo-location {lat, lng} replacing plain string */
  farmLocation?: IFarmLocation;
  farmSizeAcres?: number;
  phoneNumber?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  // New fields for enhanced farmer profile
  selectedCrops?: string[]; // Up to 5 crops farmer wants to track
  preferredLanguage?: 'en' | 'hi' | 'mr';
  state?: string;
  district?: string;
  taluka?: string;
  village?: string;
  pincode?: string;
  aadharNumber?: string; // For government integration
  bankDetails?: {
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  };
  // Instance method
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
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
      enum: USER_ROLES,
      default: 'FARMER' as UserRole,
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for multi-tenancy performance
UserSchema.index({ tenantId: 1, email: 1 });
UserSchema.index({ tenantId: 1, role: 1 });

// Hash password before saving
UserSchema.pre('save', async function (this: mongoose.Document & IUser, next: mongoose.CallbackWithoutResultAndOptionalError) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
