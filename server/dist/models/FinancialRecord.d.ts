import mongoose, { Document } from 'mongoose';
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
export declare const FinancialRecord: mongoose.Model<IFinancialRecord, {}, {}, {}, mongoose.Document<unknown, {}, IFinancialRecord, {}, {}> & IFinancialRecord & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export declare const Budget: mongoose.Model<IBudget, {}, {}, {}, mongoose.Document<unknown, {}, IBudget, {}, {}> & IBudget & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=FinancialRecord.d.ts.map