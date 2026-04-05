"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCropAdvice = exports.getPestsAndDiseases = exports.getCropByName = exports.searchCrops = exports.getCropById = exports.getAllCrops = void 0;
const CropEncyclopedia_1 = __importDefault(require("../models/CropEncyclopedia"));
const errorHandler_1 = require("../middleware/errorHandler");
// Sample crop data for encyclopedia
const sampleCrops = [
    {
        name: 'Rice',
        scientificName: 'Oryza sativa',
        family: 'Poaceae',
        origin: 'Asia',
        description: 'Rice is a staple food crop for more than half of the world\'s population. It is primarily grown in flooded fields called paddies.',
        category: 'cereal',
        images: ['https://images.unsplash.com/photo-1536617621572-1d5f1e6269a0?w=800'],
        varieties: [
            { name: 'Basmati', characteristics: ['Aromatic', 'Long grain'], yield: '25-30 quintals/acre', diseaseResistance: ['Blast resistant'], daysToMaturity: 120 },
            { name: 'IR-64', characteristics: ['High yielding', 'Fine grain'], yield: '30-35 quintals/acre', diseaseResistance: ['Bacterial blight resistant'], daysToMaturity: 110 },
        ],
        plantingGuide: {
            season: 'Kharif',
            months: ['June', 'July'],
            soilType: ['Clay loam', 'Silty clay'],
            soilPH: { min: 5.5, max: 6.5 },
            temperature: { min: 20, max: 35, optimal: 25 },
            rainfall: { min: 1000, max: 2000 },
            spacing: '20cm x 15cm',
            seedDepth: '2-3 cm',
            germinationDays: 7,
        },
        careGuide: {
            watering: 'Maintain 5-10cm water level during growth',
            fertilization: ['Apply NPK 120:60:60 kg/ha', 'Top dress with urea at tillering'],
            pruning: 'Not required',
            pestControl: ['Use neem oil for stem borer', 'Install pheromone traps'],
            diseasePrevention: ['Treat seeds with carbendazim', 'Avoid stagnant water'],
            weedManagement: 'Hand weeding at 20 and 40 days',
        },
        pestsAndDiseases: [
            {
                name: 'Stem Borer',
                type: 'pest',
                symptoms: ['Dead heart', 'White head'],
                causes: ['Scirpophaga incertulas moth'],
                organicRemedies: ['Neem oil spray', 'Trichogramma release'],
                chemicalTreatments: ['Chlorpyrifos 0.1%'],
                prevention: ['Early planting', 'Resistant varieties'],
            },
            {
                name: 'Blast Disease',
                type: 'disease',
                symptoms: ['Diamond shaped lesions', 'Gray centers'],
                causes: ['Pyricularia oryzae fungus'],
                organicRemedies: ['Neem cake application', 'Bio-control agents'],
                chemicalTreatments: ['Tricyclazole 75 WP'],
                prevention: ['Balanced fertilization', 'Field sanitation'],
            },
        ],
        harvestInfo: {
            daysToMaturity: 120,
            indicators: ['Golden yellow straw', 'Hard grains'],
            harvestingMethod: 'Manual cutting or combine harvester',
            postHarvestHandling: ['Threshing within 24 hours', 'Drying to 14% moisture'],
            storageConditions: 'Cool, dry place with proper aeration',
            shelfLife: '12-18 months',
        },
        nutritionalValue: {
            calories: 130,
            protein: 2.7,
            carbohydrates: 28,
            fiber: 0.4,
            vitamins: ['B1', 'B3', 'B6'],
            minerals: ['Iron', 'Magnesium', 'Phosphorus'],
        },
        marketInfo: {
            demand: 'high',
            priceRange: { min: 1800, max: 4500, unit: 'per quintal' },
            exportPotential: true,
            majorMarkets: ['India', 'China', 'Thailand', 'Vietnam'],
        },
        companionCrops: ['Azolla', 'Sesbania'],
        rotationCrops: ['Wheat', 'Legumes', 'Vegetables'],
        searchTags: ['paddy', 'rice', 'staple food', 'kharif crop'],
    },
    {
        name: 'Wheat',
        scientificName: 'Triticum aestivum',
        family: 'Poaceae',
        origin: 'Fertile Crescent',
        description: 'Wheat is one of the world\'s most important cereal crops, used for bread, pasta, and many other food products.',
        category: 'cereal',
        images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800'],
        varieties: [
            { name: 'HD-2967', characteristics: ['High yielding', 'Disease resistant'], yield: '50-55 quintals/acre', diseaseResistance: ['Rust resistant'], daysToMaturity: 140 },
            { name: 'PBW-343', characteristics: ['Good chapati quality'], yield: '45-50 quintals/acre', diseaseResistance: ['Moderate resistance'], daysToMaturity: 145 },
        ],
        plantingGuide: {
            season: 'Rabi',
            months: ['November', 'December'],
            soilType: ['Loam', 'Clay loam'],
            soilPH: { min: 6.0, max: 7.5 },
            temperature: { min: 10, max: 25, optimal: 15 },
            rainfall: { min: 300, max: 500 },
            spacing: '23cm row to row',
            seedDepth: '5-6 cm',
            germinationDays: 10,
        },
        careGuide: {
            watering: 'Critical at crown root initiation and flowering',
            fertilization: ['Apply NPK 120:60:40 kg/ha', 'Split nitrogen application'],
            pruning: 'Not required',
            pestControl: ['Monitor for aphids', 'Use sticky traps'],
            diseasePrevention: ['Seed treatment', 'Timely sowing'],
            weedManagement: '2-3 hand weedings or herbicide',
        },
        pestsAndDiseases: [
            {
                name: 'Aphids',
                type: 'pest',
                symptoms: ['Yellowing leaves', 'Honeydew secretion'],
                causes: ['High humidity', 'Dense planting'],
                organicRemedies: ['Neem spray', 'Ladybird beetles'],
                chemicalTreatments: ['Imidacloprid'],
                prevention: ['Early sowing', 'Proper spacing'],
            },
            {
                name: 'Yellow Rust',
                type: 'disease',
                symptoms: ['Yellow stripes on leaves', 'Reduced tillering'],
                causes: ['Puccinia striiformis fungus'],
                organicRemedies: ['Sulphur dusting'],
                chemicalTreatments: ['Propiconazole'],
                prevention: ['Resistant varieties', 'Early sowing'],
            },
        ],
        harvestInfo: {
            daysToMaturity: 140,
            indicators: ['Golden yellow color', 'Hard grains'],
            harvestingMethod: 'Combine harvester or manual',
            postHarvestHandling: ['Threshing', 'Cleaning', 'Drying'],
            storageConditions: 'Dry, ventilated godown',
            shelfLife: '12-24 months',
        },
        nutritionalValue: {
            calories: 340,
            protein: 13,
            carbohydrates: 72,
            fiber: 12,
            vitamins: ['B1', 'B3', 'B6', 'E'],
            minerals: ['Iron', 'Zinc', 'Magnesium'],
        },
        marketInfo: {
            demand: 'high',
            priceRange: { min: 2000, max: 2600, unit: 'per quintal' },
            exportPotential: true,
            majorMarkets: ['India', 'USA', 'Russia', 'Canada'],
        },
        companionCrops: ['Chickpea', 'Mustard'],
        rotationCrops: ['Rice', 'Sugarcane', 'Cotton'],
        searchTags: ['wheat', 'bread', 'rabi crop', 'cereal'],
    },
];
// Get all crops from encyclopedia
const getAllCrops = async (req, res) => {
    const tenantId = req.tenantId;
    const { search, category, page = 1, limit = 20 } = req.query;
    // Check if we have crops in the database
    const existingCount = await CropEncyclopedia_1.default.countDocuments({ tenantId });
    // Seed sample data if none exists
    if (existingCount === 0) {
        const cropsWithTenant = sampleCrops.map(crop => ({
            ...crop,
            tenantId,
            isActive: true,
        }));
        await CropEncyclopedia_1.default.insertMany(cropsWithTenant);
    }
    // Build filter
    const filter = { tenantId, isActive: true };
    if (category)
        filter.category = category;
    if (search) {
        filter.$text = { $search: search };
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [crops, total, categories] = await Promise.all([
        CropEncyclopedia_1.default.find(filter)
            .select('name scientificName category images description varieties.name')
            .skip(skip)
            .limit(Number(limit))
            .sort({ name: 1 }),
        CropEncyclopedia_1.default.countDocuments(filter),
        CropEncyclopedia_1.default.distinct('category', { tenantId, isActive: true }),
    ]);
    res.status(200).json({
        success: true,
        data: {
            crops,
            categories,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / Number(limit)),
            },
        },
    });
};
exports.getAllCrops = getAllCrops;
// Get single crop details
const getCropById = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const crop = await CropEncyclopedia_1.default.findOne({ _id: id, tenantId });
    if (!crop) {
        throw (0, errorHandler_1.createError)('Crop not found', 404);
    }
    // Increment view count
    crop.viewCount += 1;
    await crop.save();
    res.status(200).json({
        success: true,
        data: { crop },
    });
};
exports.getCropById = getCropById;
// Search crops
const searchCrops = async (req, res) => {
    const tenantId = req.tenantId;
    const { q } = req.query;
    if (!q) {
        throw (0, errorHandler_1.createError)('Search query is required', 400);
    }
    const crops = await CropEncyclopedia_1.default.find({
        tenantId,
        isActive: true,
        $text: { $search: q },
    }, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .limit(10);
    res.status(200).json({
        success: true,
        data: { crops },
    });
};
exports.searchCrops = searchCrops;
// Get crop by name
const getCropByName = async (req, res) => {
    const tenantId = req.tenantId;
    const { name } = req.params;
    const crop = await CropEncyclopedia_1.default.findOne({
        tenantId,
        name: new RegExp(name, 'i'),
        isActive: true,
    });
    if (!crop) {
        throw (0, errorHandler_1.createError)('Crop not found', 404);
    }
    res.status(200).json({
        success: true,
        data: { crop },
    });
};
exports.getCropByName = getCropByName;
// Get pests and diseases for a crop
const getPestsAndDiseases = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const crop = await CropEncyclopedia_1.default.findOne({ _id: id, tenantId }, { pestsAndDiseases: 1, name: 1 });
    if (!crop) {
        throw (0, errorHandler_1.createError)('Crop not found', 404);
    }
    res.status(200).json({
        success: true,
        data: {
            cropName: crop.name,
            pestsAndDiseases: crop.pestsAndDiseases,
        },
    });
};
exports.getPestsAndDiseases = getPestsAndDiseases;
// Get AI advice for crop
const getCropAdvice = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { question } = req.body;
    const crop = await CropEncyclopedia_1.default.findOne({ _id: id, tenantId });
    if (!crop) {
        throw (0, errorHandler_1.createError)('Crop not found', 404);
    }
    // Mock AI response based on crop data
    const advice = {
        crop: crop.name,
        question: question || 'General cultivation advice',
        answer: `Based on ${crop.name} cultivation best practices: ${crop.plantingGuide.soilType.join(', ')} soils with pH ${crop.plantingGuide.soilPH.min}-${crop.plantingGuide.soilPH.max} are ideal. ${crop.careGuide.watering}`,
        recommendations: [
            ...crop.careGuide.fertilization.slice(0, 2),
            ...crop.careGuide.pestControl.slice(0, 2),
        ],
    };
    res.status(200).json({
        success: true,
        data: { advice },
    });
};
exports.getCropAdvice = getCropAdvice;
//# sourceMappingURL=cropEncyclopediaController.js.map