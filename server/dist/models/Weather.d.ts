import mongoose, { Document } from 'mongoose';
export interface IWeatherForecast {
    date: Date;
    temperature: {
        min: number;
        max: number;
        avg: number;
    };
    humidity: number;
    rainfall: number;
    windSpeed: number;
    condition: string;
    icon: string;
    uvIndex: number;
    precipitationProbability: number;
}
export interface IWeatherAlert {
    type: 'heavy_rain' | 'drought' | 'frost' | 'heat_wave' | 'strong_wind' | 'pest_favorable';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    affectedCrops: string[];
    recommendations: string[];
}
export interface IWeather extends Document {
    _id: mongoose.Types.ObjectId;
    tenantId: string;
    farmerId: mongoose.Types.ObjectId;
    location: {
        lat: number;
        lng: number;
        address: string;
    };
    current: {
        temperature: number;
        humidity: number;
        rainfall: number;
        windSpeed: number;
        condition: string;
        icon: string;
        uvIndex: number;
        feelsLike: number;
        pressure: number;
        visibility: number;
        lastUpdated: Date;
    };
    forecast: IWeatherForecast[];
    alerts: IWeatherAlert[];
    cropRecommendations: {
        cropId: mongoose.Types.ObjectId;
        cropName: string;
        action: string;
        priority: 'low' | 'medium' | 'high';
        reason: string;
    }[];
    lastUpdated: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IWeather, {}, {}, {}, mongoose.Document<unknown, {}, IWeather, {}, {}> & IWeather & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Weather.d.ts.map