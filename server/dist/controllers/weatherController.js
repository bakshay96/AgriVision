"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCropRecommendations = exports.updateLocation = exports.getWeather = void 0;
const Weather_1 = __importDefault(require("../models/Weather"));
const User_1 = __importDefault(require("../models/User"));
const errorHandler_1 = require("../middleware/errorHandler");
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
// Mock weather data generator for demo
const generateMockWeather = (lat, lng) => {
    const conditions = ['Clear', 'Clouds', 'Rain', 'Drizzle', 'Thunderstorm'];
    const icons = ['01d', '02d', '03d', '10d', '09d'];
    const current = {
        temperature: 28 + Math.random() * 10,
        humidity: 60 + Math.floor(Math.random() * 30),
        rainfall: Math.random() > 0.7 ? Math.random() * 10 : 0,
        windSpeed: 5 + Math.random() * 10,
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        icon: icons[Math.floor(Math.random() * icons.length)],
        uvIndex: Math.floor(Math.random() * 10),
        feelsLike: 30 + Math.random() * 8,
        pressure: 1013 + Math.floor(Math.random() * 20),
        visibility: 10,
        lastUpdated: new Date(),
    };
    const forecast = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i + 1);
        const tempBase = 25 + Math.random() * 10;
        return {
            date,
            temperature: {
                min: tempBase - 5,
                max: tempBase + 5,
                avg: tempBase,
            },
            humidity: 50 + Math.floor(Math.random() * 40),
            rainfall: Math.random() > 0.6 ? Math.random() * 15 : 0,
            windSpeed: 3 + Math.random() * 12,
            condition: conditions[Math.floor(Math.random() * conditions.length)],
            icon: icons[Math.floor(Math.random() * icons.length)],
            uvIndex: Math.floor(Math.random() * 10),
            precipitationProbability: Math.floor(Math.random() * 100),
        };
    });
    const alerts = [];
    if (Math.random() > 0.8) {
        alerts.push({
            type: 'heavy_rain',
            severity: 'medium',
            title: 'Heavy Rain Expected',
            description: 'Precipitation of 20-30mm expected in the next 24 hours.',
            startDate: new Date(),
            endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            affectedCrops: ['Rice', 'Wheat'],
            recommendations: ['Delay irrigation', 'Check drainage systems'],
        });
    }
    return { current, forecast, alerts };
};
// Get weather for farmer's location
const getWeather = async (req, res) => {
    const tenantId = req.tenantId;
    const farmerId = req.user._id;
    // Fetch user profile to get farmLocation
    const user = await User_1.default.findById(farmerId);
    if (!user) {
        throw (0, errorHandler_1.createError)('User not found', 404);
    }
    // Use user's farmLocation from profile, or fallback to default
    const lat = user.farmLocation?.lat || 19.076;
    const lng = user.farmLocation?.lng || 72.877;
    const address = user.farmLocation?.address ||
        (user.village ? `${user.village}, ${user.district || ''}` : '') ||
        (user.district ? user.district : 'Mumbai, Maharashtra');
    let weather = await Weather_1.default.findOne({ tenantId, farmerId }).sort({ lastUpdated: -1 });
    // If no weather data or older than 1 hour, generate new data
    if (!weather || Date.now() - weather.lastUpdated.getTime() > 60 * 60 * 1000) {
        const { current, forecast, alerts } = generateMockWeather(lat, lng);
        weather = await Weather_1.default.create({
            tenantId,
            farmerId,
            location: {
                lat,
                lng,
                address,
            },
            current,
            forecast,
            alerts,
            cropRecommendations: [
                {
                    cropId: new (await Promise.resolve().then(() => __importStar(require('mongoose')))).Types.ObjectId(),
                    cropName: 'Rice',
                    action: 'Irrigate tomorrow morning',
                    priority: 'high',
                    reason: 'Soil moisture levels are low and no rain expected for 3 days',
                },
            ],
            lastUpdated: new Date(),
        });
    }
    res.status(200).json({
        success: true,
        data: { weather },
    });
};
exports.getWeather = getWeather;
// Update weather location
const updateLocation = async (req, res) => {
    const { lat, lng, address } = req.body;
    const tenantId = req.tenantId;
    const farmerId = req.user._id;
    if (!lat || !lng || !address) {
        throw (0, errorHandler_1.createError)('Latitude, longitude, and address are required', 400);
    }
    // Generate new weather data for new location
    const { current, forecast, alerts } = generateMockWeather(lat, lng);
    const weather = await Weather_1.default.findOneAndUpdate({ tenantId, farmerId }, {
        location: { lat, lng, address },
        current,
        forecast,
        alerts,
        lastUpdated: new Date(),
    }, { upsert: true, new: true });
    res.status(200).json({
        success: true,
        message: 'Weather location updated',
        data: { weather },
    });
};
exports.updateLocation = updateLocation;
// Get crop-specific weather recommendations
const getCropRecommendations = async (req, res) => {
    const tenantId = req.tenantId;
    const farmerId = req.user._id;
    const weather = await Weather_1.default.findOne({ tenantId, farmerId })
        .sort({ lastUpdated: -1 })
        .populate('cropRecommendations.cropId', 'name');
    if (!weather) {
        throw (0, errorHandler_1.createError)('Weather data not found. Please fetch weather first.', 404);
    }
    res.status(200).json({
        success: true,
        data: { recommendations: weather.cropRecommendations },
    });
};
exports.getCropRecommendations = getCropRecommendations;
//# sourceMappingURL=weatherController.js.map