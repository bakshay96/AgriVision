"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPriceTrends = exports.fetchAgmarknetPrices = exports.parseArrivalDate = exports.ALL_INDIA_STATES = exports.stateMarkets = exports.cropVarieties = void 0;
const axios_1 = __importDefault(require("axios"));
const AGMARKNET_API = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
const DATA_GOV_API_KEY = process.env.DATA_GOV_API_KEY || '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
exports.cropVarieties = {};
exports.stateMarkets = {};
exports.ALL_INDIA_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli',
    'Daman & Diu', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
].sort();
const priceCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const parseArrivalDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string')
        return null;
    const cleaned = dateStr.trim();
    // Try YYYY-MM-DD or DD-MM-YYYY
    if (cleaned.includes('-')) {
        const parts = cleaned.split('-');
        if (parts.length === 3) {
            const p0 = Number(parts[0]);
            const p1 = Number(parts[1]);
            const p2 = Number(parts[2]);
            if (p0 > 1000) {
                return new Date(p0, p1 - 1, p2); // YYYY-MM-DD
            }
            else {
                return new Date(p2, p1 - 1, p0); // DD-MM-YYYY
            }
        }
    }
    // Try DD/MM/YYYY or YYYY/MM/DD
    if (cleaned.includes('/')) {
        const parts = cleaned.split('/');
        if (parts.length === 3) {
            const p0 = Number(parts[0]);
            const p1 = Number(parts[1]);
            const p2 = Number(parts[2]);
            if (p2 > 1000) {
                return new Date(p2, p1 - 1, p0); // DD/MM/YYYY
            }
            else if (p0 > 1000) {
                return new Date(p0, p1 - 1, p2); // YYYY/MM/DD
            }
        }
    }
    // Fallback to standard parser
    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) {
        return parsed;
    }
    return null;
};
exports.parseArrivalDate = parseArrivalDate;
const fetchAgmarknetPrices = async (state, district, crop, fromDate, toDate, limit = 200, offset = 0) => {
    try {
        let url = `${AGMARKNET_API}?api-key=${DATA_GOV_API_KEY}&format=json&limit=${limit}&offset=${offset}`;
        if (state)
            url += `&filters[state]=${encodeURIComponent(state)}`;
        if (district)
            url += `&filters[district]=${encodeURIComponent(district)}`;
        if (crop)
            url += `&filters[commodity]=${encodeURIComponent(crop)}`;
        const cacheKey = url;
        const now = Date.now();
        const cached = priceCache.get(cacheKey);
        let prices = [];
        if (cached && now - cached.timestamp < CACHE_TTL) {
            console.log(`[Cache Hit] Serving Agmarknet prices for key: ${cacheKey}`);
            // Return a copy so in-memory filters don't mutate cache source
            prices = [...cached.prices];
        }
        else {
            console.log(`[Cache Miss] Fetching Agmarknet prices from API: ${url}`);
            const response = await axios_1.default.get(url);
            const records = response.data.records || [];
            prices = records.map((record) => {
                // Build dynamic unique crops and states mapping
                if (!exports.cropVarieties[record.commodity])
                    exports.cropVarieties[record.commodity] = [];
                if (!exports.cropVarieties[record.commodity].includes(record.variety))
                    exports.cropVarieties[record.commodity].push(record.variety);
                if (!exports.stateMarkets[record.state])
                    exports.stateMarkets[record.state] = [];
                if (!exports.stateMarkets[record.state].includes(record.district))
                    exports.stateMarkets[record.state].push(record.district);
                return {
                    cropName: record.commodity,
                    variety: record.variety,
                    marketName: record.market,
                    marketLocation: {
                        state: record.state,
                        district: record.district,
                        taluka: '',
                    },
                    price: {
                        min: Number(record.min_price),
                        max: Number(record.max_price),
                        modal: Number(record.modal_price),
                        unit: 'per quintal',
                    },
                    arrivalDate: record.arrival_date, // e.g. DD/MM/YYYY or YYYY-MM-DD
                    quantity: { value: 0, unit: 'quintals' },
                    grade: record.grade,
                    priceTrend: 'stable',
                    priceChangePercent: 0,
                    lastWeekAvgPrice: Number(record.modal_price),
                    lastMonthAvgPrice: Number(record.modal_price),
                    isOrganic: false,
                    source: 'Agmarknet/Government Data',
                    reportingDate: record.arrival_date,
                };
            });
            priceCache.set(cacheKey, {
                timestamp: now,
                prices: [...prices],
            });
        }
        // In-memory date filtering
        if (fromDate || toDate) {
            prices = prices.filter((p) => {
                const arrivalDate = (0, exports.parseArrivalDate)(p.arrivalDate);
                if (!arrivalDate)
                    return false;
                // Zero out time boundaries to compare calendar dates precisely
                arrivalDate.setHours(0, 0, 0, 0);
                if (fromDate) {
                    const from = new Date(fromDate);
                    from.setHours(0, 0, 0, 0);
                    if (arrivalDate < from)
                        return false;
                }
                if (toDate) {
                    const to = new Date(toDate);
                    to.setHours(0, 0, 0, 0);
                    if (arrivalDate > to)
                        return false;
                }
                return true;
            });
        }
        return prices;
    }
    catch (error) {
        console.error('Error fetching Agmarknet prices:', error);
        return [];
    }
};
exports.fetchAgmarknetPrices = fetchAgmarknetPrices;
const getPriceTrends = async (cropName) => {
    const prices = await (0, exports.fetchAgmarknetPrices)(undefined, undefined, cropName, undefined, undefined, 100);
    const trends = {};
    prices.forEach((price) => {
        const key = `${price.cropName}-${price.variety}`;
        if (!trends[key]) {
            trends[key] = {
                cropName: price.cropName,
                variety: price.variety,
                markets: [],
                avgPrice: 0,
                minPrice: Infinity,
                maxPrice: 0,
                count: 0,
            };
        }
        trends[key].markets.push({
            market: price.marketName,
            price: price.price.modal,
            trend: price.priceTrend,
            change: price.priceChangePercent,
        });
        trends[key].minPrice = Math.min(trends[key].minPrice, price.price.min);
        trends[key].maxPrice = Math.max(trends[key].maxPrice, price.price.max);
        trends[key].count++;
    });
    Object.values(trends).forEach((trend) => {
        trend.avgPrice = Math.round(trend.markets.reduce((sum, m) => sum + m.price, 0) / trend.count);
    });
    return Object.values(trends).sort((a, b) => b.avgPrice - a.avgPrice);
};
exports.getPriceTrends = getPriceTrends;
exports.default = {
    fetchAgmarknetPrices: exports.fetchAgmarknetPrices,
    getPriceTrends: exports.getPriceTrends,
    cropVarieties: exports.cropVarieties,
    stateMarkets: exports.stateMarkets,
};
//# sourceMappingURL=governmentApiService.js.map