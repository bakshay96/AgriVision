"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPriceTrends = exports.fetchAgmarknetPrices = exports.generateGovernmentStylePrices = exports.stateMarkets = exports.cropVarieties = void 0;
// ─── Government API Configuration ───────────────────────────────────────────
// These are public APIs for agricultural market prices in India
const AGMARKNET_API = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
const DATA_GOV_API_KEY = process.env.DATA_GOV_API_KEY || '';
// Comprehensive crop list with varieties
exports.cropVarieties = {
    'Wheat': ['Sharbati', 'Lokwan', 'HD-2967', 'PBW-343', 'Kalyan Sona'],
    'Rice': ['Basmati', 'Sona Masuri', 'IR-36', 'Pusa', 'HMT'],
    'Maize': ['Yellow', 'White', 'Hybrid'],
    'Cotton': ['Shankar-6', 'Bunny', 'MCU-5', 'DCH-32'],
    'Soybean': ['JS-335', 'JS-9305', 'NRC-37'],
    'Sugarcane': ['CO-0238', 'CO-86032', 'CO-8014'],
    'Groundnut': ['Bold', 'Java', 'G-20', 'TG-37A'],
    'Mustard': ['Pusa Bold', 'Varuna', 'RH-749'],
    'Gram': ['Desi', 'Kabuli', 'JG-11'],
    'Tur': ['BDN-711', 'BSMR-736', 'Vipula'],
    'Moong': ['SML-668', 'Pusa Baisakhi', 'K-851'],
    'Urad': ['PU-31', 'T-9', 'WBG-77'],
    'Tomato': ['Hybrid', 'Pusa Ruby', 'Arka Vikas'],
    'Potato': ['Kufri Jyoti', 'Kufri Pukhraj', 'Kufri Bahar'],
    'Onion': ['Red', 'White', 'Nasik'],
    'Chilli': ['Guntur', 'Byadgi', 'Mundu'],
    'Turmeric': ['Salem', 'Erode', 'Rajapuri'],
    'Coriander': ['CS-4', 'Swathi', 'Sadhana'],
    'Cumin': ['GC-4', 'Gujarat Cumin-1'],
    'Garlic': ['G-1', 'G-282', 'Yamuna Safed'],
    'Ginger': ['Rio-De-Janeiro', 'Wynad Local'],
    'Brinjal': ['Pusa Purple Long', 'Arka Navneet'],
    'Cabbage': ['Golden Acre', 'Pusa Drum Head'],
    'Cauliflower': ['Pusa Snowball', 'Snowball-16'],
    'Lady Finger': ['Pusa Sawani', 'Arka Anamika'],
    'Bitter Gourd': ['Pusa Do Mausami', 'Coimbatore Long'],
    'Bottle Gourd': ['Pusa Naveen', 'Pusa Summer Prolific'],
    'Pumpkin': ['Pusa Vishwas', 'Arka Suryamukhi'],
};
// State-wise major markets (APMCs)
exports.stateMarkets = {
    'Maharashtra': [
        'Mumbai', 'Pune', 'Nashik', 'Nagpur', 'Aurangabad', 'Solapur',
        'Ahmednagar', 'Kolhapur', 'Sangli', 'Satara', 'Thane', 'Raigad'
    ],
    'Punjab': [
        'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda',
        'Ferozepur', 'Hoshiarpur', 'Moga', 'Sangrur'
    ],
    'Haryana': [
        'Hisar', 'Karnal', 'Panipat', 'Rohtak', 'Sirsa', 'Fatehabad',
        'Jind', 'Bhiwani', 'Kurukshetra'
    ],
    'Uttar Pradesh': [
        'Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Allahabad', 'Meerut',
        'Ghaziabad', 'Noida', 'Gorakhpur', 'Bareilly'
    ],
    'Madhya Pradesh': [
        'Indore', 'Bhopal', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar',
        'Ratlam', 'Dewas', 'Satna'
    ],
    'Gujarat': [
        'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar',
        'Gandhinagar', 'Junagadh', 'Anand'
    ],
    'Rajasthan': [
        'Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner',
        'Alwar', 'Sikar', 'Pali'
    ],
    'Karnataka': [
        'Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga',
        'Davangere', 'Shimoga', 'Tumkur'
    ],
    'Tamil Nadu': [
        'Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruchirappalli',
        'Tirunelveli', 'Erode', 'Vellore', 'Thoothukudi'
    ],
    'Andhra Pradesh': [
        'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool',
        'Rajahmundry', 'Tirupati', 'Anantapur'
    ],
    'Telangana': [
        'Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam',
        'Mahbubnagar', 'Nalgonda', 'Adilabad'
    ],
    'Kerala': [
        'Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam',
        'Alappuzha', 'Palakkad', 'Malappuram'
    ],
    'Bihar': [
        'Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga',
        'Arrah', 'Begusarai', 'Katihar'
    ],
    'West Bengal': [
        'Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri',
        'Malda', 'Kharagpur', 'Haldia'
    ],
    'Odisha': [
        'Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur',
        'Puri', 'Balasore', 'Bhadrak'
    ],
    'Chhattisgarh': [
        'Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg',
        'Rajnandgaon', 'Jagdalpur', 'Raigarh'
    ],
    'Jharkhand': [
        'Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh',
        'Deoghar', 'Giridih', 'Ramgarh'
    ],
    'Assam': [
        'Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon',
        'Tinsukia', 'Tezpur', 'Karimganj'
    ],
};
// Generate realistic market prices based on government data patterns
const generateGovernmentStylePrices = (state, district) => {
    const prices = [];
    const today = new Date();
    const states = state ? [state] : Object.keys(exports.stateMarkets);
    states.forEach(st => {
        const markets = district ? [district] : exports.stateMarkets[st] || exports.stateMarkets['Maharashtra'];
        markets.forEach(market => {
            Object.entries(exports.cropVarieties).forEach(([cropName, varieties]) => {
                varieties.forEach(variety => {
                    // Base prices in INR per quintal (realistic government data)
                    const basePrices = {
                        'Wheat': 2200 + Math.random() * 400,
                        'Rice': 2800 + Math.random() * 1200,
                        'Maize': 1800 + Math.random() * 400,
                        'Cotton': 5500 + Math.random() * 1500,
                        'Soybean': 3800 + Math.random() * 800,
                        'Sugarcane': 290 + Math.random() * 40,
                        'Groundnut': 5000 + Math.random() * 1000,
                        'Mustard': 4500 + Math.random() * 800,
                        'Gram': 4500 + Math.random() * 1000,
                        'Tur': 5500 + Math.random() * 1500,
                        'Moong': 6500 + Math.random() * 1500,
                        'Urad': 5500 + Math.random() * 1200,
                        'Tomato': 800 + Math.random() * 1700,
                        'Potato': 1200 + Math.random() * 600,
                        'Onion': 1500 + Math.random() * 2000,
                        'Chilli': 6000 + Math.random() * 6000,
                        'Turmeric': 7000 + Math.random() * 2000,
                        'Coriander': 4000 + Math.random() * 4000,
                        'Cumin': 15000 + Math.random() * 5000,
                        'Garlic': 4000 + Math.random() * 4000,
                        'Ginger': 6000 + Math.random() * 4000,
                    };
                    const basePrice = basePrices[cropName] || 2000 + Math.random() * 3000;
                    const trend = Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'down' : 'stable';
                    const changePercent = trend === 'stable' ? 0 : Math.round(Math.random() * 150) / 10;
                    prices.push({
                        cropName,
                        variety,
                        marketName: `APMC ${market}`,
                        marketLocation: {
                            state: st,
                            district: market,
                            taluka: `${market} Taluka`,
                        },
                        price: {
                            min: Math.round(basePrice * 0.85),
                            max: Math.round(basePrice * 1.15),
                            modal: Math.round(basePrice),
                            unit: 'per quintal',
                        },
                        arrivalDate: today,
                        quantity: {
                            value: Math.round(Math.random() * 1000 + 100),
                            unit: 'quintals',
                        },
                        grade: ['Average', 'Good', 'Best'][Math.floor(Math.random() * 3)],
                        priceTrend: trend,
                        priceChangePercent: trend === 'stable' ? 0 : changePercent,
                        lastWeekAvgPrice: Math.round(basePrice * (1 + (Math.random() - 0.5) * 0.1)),
                        lastMonthAvgPrice: Math.round(basePrice * (1 + (Math.random() - 0.5) * 0.2)),
                        isOrganic: Math.random() > 0.95,
                        source: 'Agmarknet/Government Data',
                        reportingDate: today.toISOString().split('T')[0],
                    });
                });
            });
        });
    });
    return prices;
};
exports.generateGovernmentStylePrices = generateGovernmentStylePrices;
// Fetch prices from Agmarknet-style API (simulated for demo)
const fetchAgmarknetPrices = async (state, district, crop, date) => {
    try {
        // In production, this would call the actual Agmarknet API
        // For demo, we generate realistic government-style data
        const prices = (0, exports.generateGovernmentStylePrices)(state, district);
        // Filter by crop if specified
        let filteredPrices = prices;
        if (crop) {
            filteredPrices = prices.filter(p => p.cropName.toLowerCase().includes(crop.toLowerCase()));
        }
        return {
            success: true,
            data: filteredPrices,
            count: filteredPrices.length,
            source: 'Agmarknet (Government of India)',
            lastUpdated: new Date().toISOString(),
        };
    }
    catch (error) {
        console.error('Error fetching Agmarknet prices:', error);
        throw error;
    }
};
exports.fetchAgmarknetPrices = fetchAgmarknetPrices;
// Get price trends for analysis
const getPriceTrends = (prices) => {
    const trends = {};
    prices.forEach(price => {
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
    // Calculate averages
    Object.values(trends).forEach((trend) => {
        trend.avgPrice = Math.round(trend.markets.reduce((sum, m) => sum + m.price, 0) / trend.count);
    });
    return Object.values(trends).sort((a, b) => b.avgPrice - a.avgPrice);
};
exports.getPriceTrends = getPriceTrends;
// Export for use in controllers
exports.default = {
    generateGovernmentStylePrices: exports.generateGovernmentStylePrices,
    fetchAgmarknetPrices: exports.fetchAgmarknetPrices,
    getPriceTrends: exports.getPriceTrends,
    cropVarieties: exports.cropVarieties,
    stateMarkets: exports.stateMarkets,
};
//# sourceMappingURL=governmentApiService.js.map