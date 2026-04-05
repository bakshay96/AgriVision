import mongoose, { Document } from 'mongoose';
export type InventoryUnit = 'ton' | 'kg' | 'lb' | 'bushel' | 'crate' | 'box' | 'quintal';
export type InventoryStatus = 'available' | 'low_stock' | 'out_of_stock' | 'reserved';
export interface IInventory extends Document {
    _id: mongoose.Types.ObjectId;
    tenantId: string;
    farmerId: mongoose.Types.ObjectId;
    cropId?: mongoose.Types.ObjectId;
    cropName: string;
    variety: string;
    description?: string;
    quantity: number;
    unit: InventoryUnit;
    pricePerUnit: number;
    currency: string;
    status: InventoryStatus;
    minimumOrderQuantity: number;
    availableFrom: Date;
    expiryDate?: Date;
    harvestDate?: Date;
    certifications: string[];
    images: string[];
    location: {
        address: string;
        city: string;
        district?: string;
        taluka?: string;
        state: string;
        country: string;
        pin: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    isFeatured: boolean;
    totalOrders: number;
    rating: number;
    reviewCount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IInventory, {}, {}, {}, mongoose.Document<unknown, {}, IInventory, {}, {}> & IInventory & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Inventory.d.ts.map