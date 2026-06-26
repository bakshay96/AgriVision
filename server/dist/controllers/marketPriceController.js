"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNearbyMarkets = exports.getPriceTrends = exports.getDistrictsForState = exports.getMarketPrices = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const errorHandler_1 = require("../middleware/errorHandler");
const governmentApiService_1 = require("../services/governmentApiService");
// ─── Get Market Prices with filters ────────────────────────────────────────────
exports.getMarketPrices = (0, express_async_handler_1.default)(async (req, res) => {
    const { crop, state, district, market, fromDate, toDate, search, page = 1, limit = 50 } = req.query;
    try {
        const govPrices = await (0, governmentApiService_1.fetchAgmarknetPrices)(state, district, crop, fromDate, toDate, 500, 0);
        let filteredPrices = govPrices;
        // 'market' is the city/taluka-level filter (Agmarknet market name)
        if (market && market !== '') {
            filteredPrices = filteredPrices.filter((p) => p.marketName.toLowerCase().includes(market.toLowerCase()));
        }
        if (search && search !== '') {
            const searchLower = search.toLowerCase();
            filteredPrices = filteredPrices.filter((p) => p.cropName.toLowerCase().includes(searchLower) ||
                p.variety.toLowerCase().includes(searchLower) ||
                p.marketName.toLowerCase().includes(searchLower));
        }
        const total = filteredPrices.length;
        const skip = (Number(page) - 1) * Number(limit);
        const paginatedPrices = filteredPrices.slice(skip, skip + Number(limit));
        // Derive available filter options from the current fetch
        const crops = Array.from(new Set(govPrices.map((p) => p.cropName))).filter(Boolean).sort();
        const states = Array.from(new Set([...Object.keys(governmentApiService_1.stateMarkets), ...governmentApiService_1.ALL_INDIA_STATES])).sort();
        // Districts come from what the API returned for the selected state (live, not cached)
        const districts = state
            ? Array.from(new Set(govPrices.map((p) => p.marketLocation.district))).filter(Boolean).sort()
            : [];
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
// ─── Get Districts & Talukas for a State (or talukas for State+District) ─────
exports.getDistrictsForState = (0, express_async_handler_1.default)(async (req, res) => {
    const { state, district } = req.query;
    if (!state) {
        res.status(400).json({ success: false, message: 'State query param is required' });
        return;
    }
    // Fetch records filtered by state (+ district if provided)
    const govPrices = await (0, governmentApiService_1.fetchAgmarknetPrices)(state, district, // when district given, narrows to talukas
    undefined, undefined, undefined, 500, 0);
    // Districts = all districts in the state
    const districts = Array.from(new Set(govPrices.map((p) => p.marketLocation.district)))
        .filter(Boolean).sort();
    // Talukas = unique market names within the (optionally filtered) district
    // In Agmarknet, market name == taluka/sub-division city
    const talukas = Array.from(new Set(govPrices.map((p) => p.marketName)))
        .filter(Boolean).sort();
    res.status(200).json({
        success: true,
        data: {
            state,
            district: district || null,
            districts, // populated when no district filter
            talukas, // populated always; narrowed when district filter is set
        },
    });
});
// ─── Get Price Trends for a crop ──────────────────────────────────────────────
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
// ─── Get Nearby Markets ───────────────────────────────────────────────────────
exports.getNearbyMarkets = (0, express_async_handler_1.default)(async (req, res) => {
    const { state, district } = req.query;
    const govPrices = await (0, governmentApiService_1.fetchAgmarknetPrices)(state, district, undefined, undefined, undefined, 100);
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
        const m = marketMap.get(key);
        m.crops.add(price.cropName);
        m.prices.push(price.price.modal);
    });
    const markets = Array.from(marketMap.values()).map(m => ({
        _id: m._id,
        location: m.location,
        crops: Array.from(m.crops),
        avgPrice: Math.round(m.prices.reduce((a, b) => a + b, 0) / m.prices.length),
    }));
    res.status(200).json({
        success: true,
        data: { markets, source: 'Agmarknet (Government of India)' },
    });
});
//# sourceMappingURL=marketPriceController.js.map