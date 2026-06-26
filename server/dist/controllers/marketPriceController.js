"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNearbyMarkets = exports.getPriceTrends = exports.getMarketPrices = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const errorHandler_1 = require("../middleware/errorHandler");
const governmentApiService_1 = require("../services/governmentApiService");
// Get market prices with filters - Government API Integration
exports.getMarketPrices = (0, express_async_handler_1.default)(async (req, res) => {
    const { crop, state, district, taluka, fromDate, toDate, search, page = 1, limit = 50 } = req.query;
    try {
        // Fetch real government prices
        const govPrices = await (0, governmentApiService_1.fetchAgmarknetPrices)(state, district, crop, fromDate, toDate, 500, // fetching a larger set to allow local filtering
        0);
        // Apply remaining filters locally
        let filteredPrices = govPrices;
        if (taluka && taluka !== '') {
            filteredPrices = filteredPrices.filter((p) => p.marketLocation.taluka?.toLowerCase().includes(taluka.toLowerCase()));
        }
        if (search && search !== '') {
            const searchLower = search.toLowerCase();
            filteredPrices = filteredPrices.filter((p) => p.cropName.toLowerCase().includes(searchLower) ||
                p.variety.toLowerCase().includes(searchLower) ||
                p.marketName.toLowerCase().includes(searchLower));
        }
        // Pagination
        const total = filteredPrices.length;
        const skip = (Number(page) - 1) * Number(limit);
        const paginatedPrices = filteredPrices.slice(skip, skip + Number(limit));
        // Get unique values for filters based on what's populated in the service
        const crops = Object.keys(governmentApiService_1.cropVarieties);
        const states = Array.from(new Set([...Object.keys(governmentApiService_1.stateMarkets), ...governmentApiService_1.ALL_INDIA_STATES])).sort();
        const districts = state ? (governmentApiService_1.stateMarkets[state] || []) : [];
        res.status(200).json({
            success: true,
            data: {
                prices: paginatedPrices,
                crops,
                states,
                districts,
                pagination: {
                    total,
                    page: Number(page),
                    pages: Math.ceil(total / Number(limit)),
                },
                source: 'Agmarknet (Government of India)',
                lastUpdated: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        console.error('Error fetching market prices:', error);
        throw (0, errorHandler_1.createError)('Failed to fetch market prices', 500);
    }
});
// Get price trends for a specific crop - Government API
exports.getPriceTrends = (0, express_async_handler_1.default)(async (req, res) => {
    const { cropName } = req.params;
    if (!cropName) {
        throw (0, errorHandler_1.createError)('Crop name is required', 400);
    }
    const trends = await (0, governmentApiService_1.getPriceTrends)(cropName);
    res.status(200).json({
        success: true,
        data: {
            trends,
            cropName,
            source: 'Agmarknet (Government of India)',
        },
    });
});
// Get nearby markets based on farmer location - Government API
exports.getNearbyMarkets = (0, express_async_handler_1.default)(async (req, res) => {
    const { state, district } = req.query;
    // Fetch real government data
    const govPrices = await (0, governmentApiService_1.fetchAgmarknetPrices)(state, district, undefined, undefined, undefined, 100);
    // Group by market
    const marketMap = new Map();
    govPrices.forEach((price) => {
        const key = price.marketName;
        if (!marketMap.has(key)) {
            marketMap.set(key, {
                _id: price.marketName,
                location: price.marketLocation,
                crops: new Set(),
                prices: [],
            });
        }
        const market = marketMap.get(key);
        market.crops.add(price.cropName);
        market.prices.push(price.price.modal);
    });
    const markets = Array.from(marketMap.values()).map(m => ({
        _id: m._id,
        location: m.location,
        crops: Array.from(m.crops),
        avgPrice: Math.round(m.prices.reduce((a, b) => a + b, 0) / m.prices.length),
    }));
    res.status(200).json({
        success: true,
        data: {
            markets,
            source: 'Agmarknet (Government of India)',
        },
    });
});
//# sourceMappingURL=marketPriceController.js.map