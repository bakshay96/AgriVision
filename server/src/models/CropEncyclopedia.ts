import mongoose, { Document, Schema } from 'mongoose';

export interface IPlantingGuide {
  season: string;
  months: string[];
  soilType: string[];
  soilPH: { min: number; max: number };
  temperature: { min: number; max: number; optimal: number };
  rainfall: { min: number; max: number };
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
    priceRange: { min: number; max: number; unit: string };
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

const PlantingGuideSchema = new Schema<IPlantingGuide>({
  season: { type: String, required: true },
  months: [{ type: String }],
  soilType: [{ type: String }],
  soilPH: {
    min: { type: Number },
    max: { type: Number },
  },
  temperature: {
    min: { type: Number },
    max: { type: Number },
    optimal: { type: Number },
  },
  rainfall: {
    min: { type: Number },
    max: { type: Number },
  },
  spacing: { type: String },
  seedDepth: { type: String },
  germinationDays: { type: Number },
});

const CareGuideSchema = new Schema<ICareGuide>({
  watering: { type: String },
  fertilization: [{ type: String }],
  pruning: { type: String },
  pestControl: [{ type: String }],
  diseasePrevention: [{ type: String }],
  weedManagement: { type: String },
});

const PestDiseaseSchema = new Schema<IPestDisease>({
  name: { type: String, required: true },
  type: { type: String, enum: ['pest', 'disease'], required: true },
  symptoms: [{ type: String }],
  causes: [{ type: String }],
  organicRemedies: [{ type: String }],
  chemicalTreatments: [{ type: String }],
  prevention: [{ type: String }],
  images: [{ type: String }],
});

const HarvestInfoSchema = new Schema<IHarvestInfo>({
  daysToMaturity: { type: Number },
  indicators: [{ type: String }],
  harvestingMethod: { type: String },
  postHarvestHandling: [{ type: String }],
  storageConditions: { type: String },
  shelfLife: { type: String },
});

const CropEncyclopediaSchema = new Schema<ICropEncyclopedia>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, index: true },
    scientificName: { type: String },
    family: { type: String },
    origin: { type: String },
    description: { type: String },
    category: {
      type: String,
      enum: ['cereal', 'pulse', 'oilseed', 'vegetable', 'fruit', 'spice', 'fiber', 'fodder', 'cash_crop'],
      required: true,
    },
    images: [{ type: String }],
    varieties: [{
      name: { type: String },
      characteristics: [{ type: String }],
      yield: { type: String },
      diseaseResistance: [{ type: String }],
      daysToMaturity: { type: Number },
    }],
    plantingGuide: PlantingGuideSchema,
    careGuide: CareGuideSchema,
    pestsAndDiseases: [PestDiseaseSchema],
    harvestInfo: HarvestInfoSchema,
    nutritionalValue: {
      calories: { type: Number },
      protein: { type: Number },
      carbohydrates: { type: Number },
      fiber: { type: Number },
      vitamins: [{ type: String }],
      minerals: [{ type: String }],
    },
    marketInfo: {
      demand: { type: String, enum: ['high', 'medium', 'low'] },
      priceRange: {
        min: { type: Number },
        max: { type: Number },
        unit: { type: String },
      },
      exportPotential: { type: Boolean, default: false },
      majorMarkets: [{ type: String }],
    },
    companionCrops: [{ type: String }],
    rotationCrops: [{ type: String }],
    searchTags: [{ type: String }],
    isActive: { type: Boolean, default: true },
    viewCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Text search index
CropEncyclopediaSchema.index({ name: 'text', scientificName: 'text', description: 'text', searchTags: 'text' });
CropEncyclopediaSchema.index({ tenantId: 1, category: 1 });
CropEncyclopediaSchema.index({ tenantId: 1, isActive: 1 });

export default mongoose.model<ICropEncyclopedia>('CropEncyclopedia', CropEncyclopediaSchema);
