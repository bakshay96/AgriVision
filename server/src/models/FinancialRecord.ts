import mongoose, { Document, Schema } from 'mongoose';

export interface IFinancialRecord extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: string;
  farmerId: mongoose.Types.ObjectId;
  cropId?: mongoose.Types.ObjectId;
  type: 'income' | 'expense';
  category: string;
  subcategory: string;
  amount: number;
  currency: string;
  date: Date;
  description: string;
  paymentMethod?: string;
  receiptUrl?: string;
  relatedOrderId?: mongoose.Types.ObjectId;
  tags: string[];
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  isTaxDeductible: boolean;
  gstAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBudget extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: string;
  farmerId: mongoose.Types.ObjectId;
  cropId?: mongoose.Types.ObjectId;
  season: string;
  year: number;
  category: string;
  allocatedAmount: number;
  spentAmount: number;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const FinancialRecordSchema = new Schema<IFinancialRecord>(
  {
    tenantId: { type: String, required: true, index: true },
    farmerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cropId: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const BudgetSchema = new Schema<IBudget>(
  {
    tenantId: { type: String, required: true, index: true },
    farmerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cropId: {
      type: Schema.Types.ObjectId,
      ref: 'Crop',
    },
    season: { type: String, required: true },
    year: { type: Number, required: true },
    category: { type: String, required: true },
    allocatedAmount: { type: Number, required: true, min: 0 },
    spentAmount: { type: Number, default: 0, min: 0 },
    notes: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
FinancialRecordSchema.index({ tenantId: 1, farmerId: 1, date: -1 });
FinancialRecordSchema.index({ tenantId: 1, farmerId: 1, type: 1, category: 1 });
FinancialRecordSchema.index({ tenantId: 1, farmerId: 1, cropId: 1 });

BudgetSchema.index({ tenantId: 1, farmerId: 1, year: -1, season: 1 });

export const FinancialRecord = mongoose.model<IFinancialRecord>('FinancialRecord', FinancialRecordSchema);
export const Budget = mongoose.model<IBudget>('Budget', BudgetSchema);
