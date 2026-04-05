import mongoose, { Document } from 'mongoose';
export interface IPlantingGuide {
    season: string;
    months: string[];
    soilType: string[];
    soilPH: {
        min: number;
        max: number;
    };
    temperature: {
        min: number;
        max: number;
        optimal: number;
    };
    rainfall: {
        min: number;
        max: number;
    };
    spacing: string;
    seedDepth: string;
    germinationDays: number;
}
export interface ICareGuide {
    watering: string;
    fertilization: string[];
    pruning: string;
    pestControl: string[];
    diseasePrevention: string[];
    weedManagement: string;
}
export interface IPestDisease {
    name: string;
    type: 'pest' | 'disease';
    symptoms: string[];
    causes: string[];
    organicRemedies: string[];
    chemicalTreatments: string[];
    prevention: string[];
    images: string[];
}
export interface IHarvestInfo {
    daysToMaturity: number;
    indicators: string[];
    harvestingMethod: string;
    postHarvestHandling: string[];
    storageConditions: string;
    shelfLife: string;
}
export interface ICropEncyclopedia extends Document {
    _id: mongoose.Types.ObjectId;
    tenantId: string;
    name: string;
    scientificName: string;
    family: string;
    origin: string;
    description: string;
    category: 'cereal' | 'pulse' | 'oilseed' | 'vegetable' | 'fruit' | 'spice' | 'fiber' | 'fodder' | 'cash_crop';
    images: string[];
    varieties: {
        name: string;
        characteristics: string[];
        yield: string;
        diseaseResistance: string[];
        daysToMaturity: number;
    }[];
    plantingGuide: IPlantingGuide;
    careGuide: ICareGuide;
    pestsAndDiseases: IPestDisease[];
    harvestInfo: IHarvestInfo;
    nutritionalValue: {
        calories: number;
        protein: number;
        carbohydrates: number;
        fiber: number;
        vitamins: string[];
        minerals: string[];
    };
    marketInfo: {
        demand: 'high' | 'medium' | 'low';
        priceRange: {
            min: number;
            max: number;
            unit: string;
        };
        exportPotential: boolean;
        majorMarkets: string[];
    };
    companionCrops: string[];
    rotationCrops: string[];
    searchTags: string[];
    isActive: boolean;
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ICropEncyclopedia, {}, {}, {}, mongoose.Document<unknown, {}, ICropEncyclopedia, {}, {}> & ICropEncyclopedia & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=CropEncyclopedia.d.ts.map