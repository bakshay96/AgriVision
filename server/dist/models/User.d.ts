import mongoose, { Document } from 'mongoose';
export declare const USER_ROLES: readonly ["FARMER", "BUYER", "ADMIN"];
export type UserRole = typeof USER_ROLES[number];
export interface IFarmLocation {
    lat: number;
    lng: number;
    address?: string;
}
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
    selectedCrops?: string[];
    preferredLanguage?: 'en' | 'hi' | 'mr';
    state?: string;
    district?: string;
    taluka?: string;
    village?: string;
    pincode?: string;
    aadharNumber?: string;
    bankDetails?: {
        accountNumber?: string;
        ifscCode?: string;
        bankName?: string;
    };
    comparePassword(candidatePassword: string): Promise<boolean>;
}
declare const _default: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=User.d.ts.map