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
const axios_1 = __importDefault(require("axios"));
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
// Fetch real weather data from OpenWeatherMap API
const fetchRealWeather = async (lat, lng) => {
    if (!OPENWEATHER_API_KEY) {
        console.warn('[Weather] No OPENWEATHER_API_KEY found, using mock data');
        return generateMockWeather(lat, lng);
    }
    try {
        // Fetch current weather
        const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        const currentResponse = await axios_1.default.get(currentUrl);
        const currentData = currentResponse.data;
        // Fetch 7-day forecast (One Call API or 5-day forecast as fallback)
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        const forecastResponse = await axios_1.default.get(forecastUrl);
        const forecastData = forecastResponse.data;
        // Map weather condition codes to our condition names
        const mapCondition = (id) => {
            if (id >= 200 && id < 300)
                return 'Thunderstorm';
            if (id >= 300 && id < 500)
                return 'Drizzle';
            if (id >= 500 && id < 600)
                return 'Rain';
            if (id >= 600 && id < 700)
                return 'Snow';
            if (id >= 700 && id < 800)
                return 'Mist';
            if (id === 800)
                return 'Clear';
            return 'Clouds';
        };
        // Get icon from API response
        const currentIcon = currentData.weather[0]?.icon || '01d';
        const current = {
            temperature: currentData.main.temp,
            humidity: currentData.main.humidity,
            rainfall: currentData.rain?.['1h'] || currentData.rain?.['3h'] || 0,
            windSpeed: currentData.wind.speed * 3.6, // Convert m/s to km/h
            condition: mapCondition(currentData.weather[0]?.id || 800),
            icon: currentIcon,
            uvIndex: 5, // OpenWeatherMap free tier doesn't provide UV index
            feelsLike: currentData.main.feels_like,
            pressure: currentData.main.pressure,
            visibility: (currentData.visibility || 10000) / 1000, // Convert to km
            lastUpdated: new Date(),
        };
        // Process forecast - group by day and get daily summaries
        const dailyForecasts = new Map();
        forecastData.list.forEach((item) => {
            const date = new Date(item.dt * 1000).toDateString();
            if (!dailyForecasts.has(date)) {
                dailyForecasts.set(date, []);
            }
            dailyForecasts.get(date).push(item);
        });
        const forecast = Array.from(dailyForecasts.entries())
            .slice(0, 7)
            .map(([dateStr, items], i) => {
            const date = new Date(dateStr);
            const temps = items.map((item) => item.main.temp);
            const minTemp = Math.min(...temps);
            const maxTemp = Math.max(...temps);
            const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
            const avgHumidity = items.reduce((sum, item) => sum + item.main.humidity, 0) / items.length;
            const avgWind = items.reduce((sum, item) => sum + item.wind.speed, 0) / items.length * 3.6;
            const rainProbability = items.reduce((sum, item) => sum + (item.pop || 0), 0) / items.length * 100;
            const rainAmount = items.reduce((sum, item) => sum + (item.rain?.['3h'] || 0), 0);
            // Use the weather from noon or closest to noon
            const noonItem = items.find((item) => {
                const hour = new Date(item.dt * 1000).getHours();
                return hour >= 11 && hour <= 13;
            }) || items[Math.floor(items.length / 2)];
            const weatherId = noonItem.weather[0]?.id || 800;
            const icon = i === 0 ? currentIcon : (noonItem.weather[0]?.icon || '01d');
            return {
                date,
                temperature: {
                    min: minTemp,
                    max: maxTemp,
                    avg: avgTemp,
                },
                humidity: Math.round(avgHumidity),
                rainfall: rainAmount,
                windSpeed: Math.round(avgWind * 10) / 10,
                condition: i === 0 ? current.condition : mapCondition(weatherId),
                icon,
                uvIndex: 5,
                precipitationProbability: Math.round(rainProbability),
            };
        });
        // Generate alerts based on weather conditions
        const alerts = [];
        if (current.condition === 'Thunderstorm' || current.condition === 'Rain') {
            alerts.push({
                type: 'heavy_rain',
                severity: current.condition === 'Thunderstorm' ? 'high' : 'medium',
                title: current.condition === 'Thunderstorm' ? 'Thunderstorm Warning' : 'Rain Expected',
                description: `Current conditions show ${current.condition.toLowerCase()}. Take necessary precautions.`,
                startDate: new Date(),
                endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                affectedCrops: ['All crops'],
                recommendations: ['Delay spraying operations', 'Ensure proper drainage', 'Protect harvested crops'],
            });
        }
        if (current.temperature > 35) {
            alerts.push({
                type: 'heat_wave',
                severity: 'medium',
                title: 'High Temperature Alert',
                description: `Temperature is ${Math.round(current.temperature)}°C. Increase irrigation frequency.`,
                startDate: new Date(),
                endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                affectedCrops: ['Vegetables', 'Cotton'],
                recommendations: ['Increase irrigation', 'Provide shade for sensitive crops', 'Avoid midday field work'],
            });
        }
        console.log('[Weather] Successfully fetched real weather data for', lat, lng);
        return { current, forecast, alerts };
    }
    catch (error) {
        console.error('[Weather] Error fetching real weather:', error.message);
        // Fallback to mock data on error
        return generateMockWeather(lat, lng);
    }
};
// Mock weather data generator for demo/fallback
const generateMockWeather = (lat, lng) => {
    const conditions = ['Clear', 'Clouds', 'Rain', 'Drizzle', 'Thunderstorm'];
    const icons = ['01d', '02d', '03d', '10d', '09d'];
    // Generate current weather first
    const currentConditionIndex = Math.floor(Math.random() * conditions.length);
    const current = {
        temperature: 28 + Math.random() * 10,
        humidity: 60 + Math.floor(Math.random() * 30),
        rainfall: Math.random() > 0.7 ? Math.random() * 10 : 0,
        windSpeed: 5 + Math.random() * 10,
        condition: conditions[currentConditionIndex],
        icon: icons[currentConditionIndex],
        uvIndex: Math.floor(Math.random() * 10),
        feelsLike: 30 + Math.random() * 8,
        pressure: 1013 + Math.floor(Math.random() * 20),
        visibility: 10,
        lastUpdated: new Date(),
    };
    // Generate forecast - first day should match current weather
    const forecast = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const tempBase = 25 + Math.random() * 10;
        // For today (i=0), use the same condition as current weather
        const conditionIndex = i === 0 ? currentConditionIndex : Math.floor(Math.random() * conditions.length);
        return {
            date,
            temperature: {
                min: tempBase - 5,
                max: tempBase + 5,
                avg: tempBase,
            },
            humidity: 50 + Math.floor(Math.random() * 40),
            rainfall: i === 0 ? current.rainfall : (Math.random() > 0.6 ? Math.random() * 15 : 0),
            windSpeed: i === 0 ? current.windSpeed : (3 + Math.random() * 12),
            condition: conditions[conditionIndex],
            icon: icons[conditionIndex],
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
    // If no weather data or older than 1 hour, fetch new data
    if (!weather || Date.now() - weather.lastUpdated.getTime() > 60 * 60 * 1000) {
        const { current, forecast, alerts } = await fetchRealWeather(lat, lng);
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
    // Fetch new weather data for new location
    const { current, forecast, alerts } = await fetchRealWeather(lat, lng);
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