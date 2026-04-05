import mongoose, { Document, Schema } from 'mongoose';

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

const WeatherForecastSchema = new Schema<IWeatherForecast>({
  date: { type: Date, required: true },
  temperature: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    avg: { type: Number, required: true },
  },
  humidity: { type: Number, required: true, min: 0, max: 100 },
  rainfall: { type: Number, default: 0 },
  windSpeed: { type: Number, default: 0 },
  condition: { type: String, required: true },
  icon: { type: String, required: true },
  uvIndex: { type: Number, default: 0 },
  precipitationProbability: { type: Number, default: 0, min: 0, max: 100 },
});

const WeatherAlertSchema = new Schema<IWeatherAlert>({
  type: {
    type: String,
    enum: ['heavy_rain', 'drought', 'frost', 'heat_wave', 'strong_wind', 'pest_favorable'],
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  affectedCrops: [{ type: String }],
  recommendations: [{ type: String }],
});

const WeatherSchema = new Schema<IWeather>(
  {
    tenantId: { type: String, required: true, index: true },
    farmerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, required: true },
    },
    current: {
      temperature: { type: Number, required: true },
      humidity: { type: Number, required: true },
      rainfall: { type: Number, default: 0 },
      windSpeed: { type: Number, default: 0 },
      condition: { type: String, required: true },
      icon: { type: String, required: true },
      uvIndex: { type: Number, default: 0 },
      feelsLike: { type: Number, required: true },
      pressure: { type: Number, default: 1013 },
      visibility: { type: Number, default: 10 },
      lastUpdated: { type: Date, default: Date.now },
    },
    forecast: [WeatherForecastSchema],
    alerts: [WeatherAlertSchema],
    cropRecommendations: [{
      cropId: { type: Schema.Types.ObjectId, ref: 'Crop' },
      cropName: { type: String, required: true },
      action: { type: String, required: true },
      priority: { type: String, enum: ['low', 'medium', 'high'], required: true },
      reason: { type: String, required: true },
    }],
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
WeatherSchema.index({ tenantId: 1, farmerId: 1, lastUpdated: -1 });
WeatherSchema.index({ tenantId: 1, 'alerts.severity': 1 });

export default mongoose.model<IWeather>('Weather', WeatherSchema);
