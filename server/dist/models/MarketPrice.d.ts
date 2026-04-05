import mongoose, { Document } from 'mongoose';
export interface IMarketPrice extends Document {
    _id: mongoose.Types.ObjectId;
    tenantId: string;
    cropName: string;
    variety: string;
    marketName: string;
    marketLocation: {
        lat: number;
        lng: number;
        address: string;
        state: string;
        district: string;
    };
    price: {
        min: number;
        max: number;
        modal: number;
        unit: string;
    };
    arrivalDate: Date;
    quantity: {
        value: number;
        unit: string;
    };
    grade: string;
    priceTrend: 'up' | 'down' | 'stable';
    priceChangePercent: number;
    lastWeekAvgPrice: number;
    lastMonthAvgPrice: number;
    isOrganic: boolean;
    source: string;
    lastUpdated: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IMarketPrice, {}, {}, {}, mongoose.Document<unknown, {}, IMarketPrice, {}, {}> & IMarketPrice & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=MarketPrice.d.ts.map