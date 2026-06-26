"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCropAdvice = exports.getPestsAndDiseases = exports.getCropByName = exports.searchCrops = exports.getCropById = exports.getAllCrops = exports.aiSearchCrop = void 0;
const generative_ai_1 = require("@google/generative-ai");
const CropEncyclopedia_1 = __importDefault(require("../models/CropEncyclopedia"));
const errorHandler_1 = require("../middleware/errorHandler");
// ─── Sample crop seed data (10 crops) ─────────────────────────────────────────
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
            { name: 'Sona Masuri', characteristics: ['Medium grain', 'Low starch'], yield: '28-32 quintals/acre', diseaseResistance: ['Moderate'], daysToMaturity: 115 },
        ],
        plantingGuide: {
            season: 'Kharif', months: ['June', 'July'],
            soilType: ['Clay loam', 'Silty clay'],
            soilPH: { min: 5.5, max: 6.5 },
            temperature: { min: 20, max: 35, optimal: 25 },
            rainfall: { min: 1000, max: 2000 },
            spacing: '20cm x 15cm', seedDepth: '2-3 cm', germinationDays: 7,
        },
        careGuide: {
            watering: 'Maintain 5-10cm water level during growth',
            fertilization: ['Apply NPK 120:60:60 kg/ha', 'Top dress with urea at tillering', 'Apply zinc sulphate 25 kg/ha'],
            pruning: 'Not required',
            pestControl: ['Use neem oil for stem borer', 'Install pheromone traps @ 10/ha'],
            diseasePrevention: ['Treat seeds with carbendazim', 'Avoid stagnant water', 'Field sanitation after harvest'],
            weedManagement: 'Hand weeding at 20 and 40 days; use butachlor herbicide',
        },
        pestsAndDiseases: [
            { name: 'Stem Borer', type: 'pest', symptoms: ['Dead heart', 'White head', 'Bored stems'], causes: ['Scirpophaga incertulas moth'], organicRemedies: ['Neem oil spray', 'Trichogramma release @ 5 cards/ha'], chemicalTreatments: ['Chlorpyrifos 0.1%', 'Carbofuran 3G @ 25kg/ha'], prevention: ['Early planting', 'Resistant varieties', 'Field sanitation'], images: [] },
            { name: 'Blast Disease', type: 'disease', symptoms: ['Diamond shaped lesions', 'Gray centers', 'Neck rot'], causes: ['Pyricularia oryzae fungus'], organicRemedies: ['Neem cake application', 'Bio-control agents'], chemicalTreatments: ['Tricyclazole 75 WP @ 0.6g/L'], prevention: ['Balanced fertilization', 'Field sanitation', 'Resistant varieties'], images: [] },
        ],
        harvestInfo: { daysToMaturity: 120, indicators: ['Golden yellow straw', 'Hard grains', '80% grain maturity'], harvestingMethod: 'Manual cutting or combine harvester', postHarvestHandling: ['Threshing within 24 hours', 'Drying to 14% moisture', 'Proper storage'], storageConditions: 'Cool, dry place with proper aeration', shelfLife: '12-18 months' },
        nutritionalValue: { calories: 130, protein: 2.7, carbohydrates: 28, fiber: 0.4, vitamins: ['B1', 'B3', 'B6'], minerals: ['Iron', 'Magnesium', 'Phosphorus'] },
        marketInfo: { demand: 'high', priceRange: { min: 1800, max: 4500, unit: 'per quintal' }, exportPotential: true, majorMarkets: ['India', 'China', 'Thailand', 'Vietnam'] },
        companionCrops: ['Azolla', 'Sesbania'],
        rotationCrops: ['Wheat', 'Legumes', 'Vegetables'],
        searchTags: ['paddy', 'rice', 'staple food', 'kharif crop', 'cereal'],
    },
    {
        name: 'Wheat',
        scientificName: 'Triticum aestivum',
        family: 'Poaceae',
        origin: 'Fertile Crescent',
        description: 'Wheat is one of the world\'s most important cereal crops, used for bread, pasta, and many other food products. It is India\'s primary rabi crop.',
        category: 'cereal',
        images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800'],
        varieties: [
            { name: 'HD-2967', characteristics: ['High yielding', 'Disease resistant'], yield: '50-55 quintals/acre', diseaseResistance: ['Rust resistant'], daysToMaturity: 140 },
            { name: 'PBW-343', characteristics: ['Good chapati quality'], yield: '45-50 quintals/acre', diseaseResistance: ['Moderate resistance'], daysToMaturity: 145 },
            { name: 'GW-322', characteristics: ['Drought tolerant', 'Bold grains'], yield: '40-45 quintals/acre', diseaseResistance: ['Yellow rust resistant'], daysToMaturity: 135 },
        ],
        plantingGuide: {
            season: 'Rabi', months: ['November', 'December'],
            soilType: ['Loam', 'Clay loam', 'Well-drained alluvial'],
            soilPH: { min: 6.0, max: 7.5 },
            temperature: { min: 10, max: 25, optimal: 15 },
            rainfall: { min: 300, max: 500 },
            spacing: '23cm row to row', seedDepth: '5-6 cm', germinationDays: 10,
        },
        careGuide: {
            watering: 'Critical irrigation at crown root initiation (21 days) and flowering (65 days)',
            fertilization: ['Apply NPK 120:60:40 kg/ha at sowing', 'Split nitrogen: 60kg at sowing, 60kg at tillering', 'Foliar spray of urea 2% at grain filling'],
            pruning: 'Not required',
            pestControl: ['Monitor for aphids from February', 'Use yellow sticky traps', 'Spray imidacloprid if infestation exceeds threshold'],
            diseasePrevention: ['Seed treatment with carbendazim + thiram', 'Timely sowing (Nov 1-15)', 'Grow resistant varieties'],
            weedManagement: '2-3 hand weedings or isoproturon herbicide @ 1 kg/ha',
        },
        pestsAndDiseases: [
            { name: 'Aphids', type: 'pest', symptoms: ['Yellowing leaves', 'Honeydew secretion', 'Sooty mold'], causes: ['High humidity', 'Dense planting', 'Late sowing'], organicRemedies: ['Neem spray 5ml/L', 'Ladybird beetles as biocontrol'], chemicalTreatments: ['Imidacloprid 17.8% SL @ 0.3ml/L', 'Dimethoate 30% EC @ 1.5ml/L'], prevention: ['Early sowing', 'Proper spacing', 'Avoid excess nitrogen'], images: [] },
            { name: 'Yellow Rust', type: 'disease', symptoms: ['Yellow stripes on leaves', 'Orange pustules', 'Reduced tillering'], causes: ['Puccinia striiformis fungus', 'Cool humid conditions'], organicRemedies: ['Sulphur dusting 20-25 kg/ha', 'Remove infected crop debris'], chemicalTreatments: ['Propiconazole 25% EC @ 0.1%', 'Mancozeb 75% WP @ 2g/L'], prevention: ['Resistant varieties (HD-2967)', 'Early sowing', 'Seed treatment'], images: [] },
        ],
        harvestInfo: { daysToMaturity: 140, indicators: ['Golden yellow color', 'Hard grains', 'Straw turns golden'], harvestingMethod: 'Combine harvester or manual', postHarvestHandling: ['Threshing within 48 hours', 'Cleaning and grading', 'Drying to 12% moisture'], storageConditions: 'Dry, ventilated godown with moisture <12%', shelfLife: '12-24 months' },
        nutritionalValue: { calories: 340, protein: 13, carbohydrates: 72, fiber: 12, vitamins: ['B1', 'B3', 'B6', 'E'], minerals: ['Iron', 'Zinc', 'Magnesium', 'Calcium'] },
        marketInfo: { demand: 'high', priceRange: { min: 2000, max: 2600, unit: 'per quintal' }, exportPotential: true, majorMarkets: ['India', 'USA', 'Russia', 'Canada', 'Pakistan'] },
        companionCrops: ['Chickpea', 'Mustard', 'Coriander'],
        rotationCrops: ['Rice', 'Sugarcane', 'Cotton', 'Soybean'],
        searchTags: ['wheat', 'bread', 'rabi crop', 'cereal', 'gahu', 'gehu'],
    },
    {
        name: 'Cotton',
        scientificName: 'Gossypium hirsutum',
        family: 'Malvaceae',
        origin: 'Mexico',
        description: 'Cotton is a major cash crop and fiber crop in India. It thrives in warm climates and is the backbone of India\'s textile industry.',
        category: 'fiber',
        images: ['https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=800'],
        varieties: [
            { name: 'BT Cotton', characteristics: ['Bollworm resistant', 'High yield'], yield: '15-20 quintals/acre', diseaseResistance: ['Bollworm resistant'], daysToMaturity: 170 },
            { name: 'Suraj', characteristics: ['Long staple', 'Fine fiber'], yield: '12-15 quintals/acre', diseaseResistance: ['Moderate'], daysToMaturity: 180 },
        ],
        plantingGuide: {
            season: 'Kharif', months: ['May', 'June'],
            soilType: ['Black cotton soil', 'Loamy soil', 'Well-drained red soil'],
            soilPH: { min: 6.5, max: 7.5 },
            temperature: { min: 25, max: 35, optimal: 30 },
            rainfall: { min: 700, max: 1200 },
            spacing: '90cm x 60cm', seedDepth: '3-4 cm', germinationDays: 8,
        },
        careGuide: {
            watering: 'Every 10-15 days; critical during flowering and boll formation',
            fertilization: ['Apply NPK 100:50:50 kg/ha at sowing', 'Top dress with urea at 30 and 60 days', 'Apply sulphur 20kg/ha for fiber quality'],
            pruning: 'Topping at 8-10 nodes to control excessive vegetative growth',
            pestControl: ['Install pheromone traps @ 15/ha for bollworm', 'Use yellow sticky traps for whitefly', 'Weekly scouting from boll formation'],
            diseasePrevention: ['Use certified disease-free seeds', 'Crop rotation with legumes', 'Avoid waterlogging'],
            weedManagement: '2-3 inter-cultivations; use pendimethalin pre-emergence',
        },
        pestsAndDiseases: [
            { name: 'Whitefly', type: 'pest', symptoms: ['Yellowing leaves', 'Curling leaves', 'Sooty mold', 'Cotton leaf curl virus'], causes: ['Hot dry weather', 'Continuous cotton cultivation'], organicRemedies: ['Yellow sticky traps 10/ha', 'Neem oil 5ml/L spray'], chemicalTreatments: ['Imidacloprid 17.8% SL @ 0.3ml/L', 'Thiamethoxam 25% WG @ 0.3g/L'], prevention: ['Remove volunteer cotton plants', 'Avoid late sowing', 'Grow trap crops'], images: [] },
            { name: 'Pink Bollworm', type: 'pest', symptoms: ['Damaged bolls', 'Premature boll opening', 'Pink larvae inside bolls'], causes: ['Pectinophora gossypiella moth'], organicRemedies: ['Pheromone traps @ 15/ha', 'Release Trichogramma parasitoids'], chemicalTreatments: ['Spinosad 45% SC @ 0.2ml/L', 'Chlorpyrifos 20% EC @ 2ml/L'], prevention: ['Early sowing', 'BT cotton varieties', 'Deep ploughing after harvest'], images: [] },
        ],
        harvestInfo: { daysToMaturity: 170, indicators: ['Bolls open naturally', 'Fiber fluffy and white', '50% boll opening'], harvestingMethod: 'Manual picking (3-4 pickings)', postHarvestHandling: ['Remove dried leaves', 'Sun dry for 2-3 hours', 'Store in dry jute bags'], storageConditions: 'Dry, well-ventilated godown', shelfLife: '6-12 months (lint)' },
        nutritionalValue: { calories: 0, protein: 0, carbohydrates: 0, fiber: 0, vitamins: [], minerals: [] },
        marketInfo: { demand: 'high', priceRange: { min: 5500, max: 7500, unit: 'per quintal' }, exportPotential: true, majorMarkets: ['India', 'China', 'Bangladesh', 'Pakistan'] },
        companionCrops: ['Moong bean', 'Cowpea'],
        rotationCrops: ['Wheat', 'Gram', 'Groundnut'],
        searchTags: ['cotton', 'kapas', 'kharif crop', 'cash crop', 'fiber'],
    },
    {
        name: 'Soybean',
        scientificName: 'Glycine max',
        family: 'Fabaceae',
        origin: 'China',
        description: 'Soybean is an important oilseed and protein-rich legume crop. It is widely grown in Madhya Pradesh, Maharashtra and Rajasthan as a kharif crop.',
        category: 'oilseed',
        images: ['https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?w=800'],
        varieties: [
            { name: 'JS-335', characteristics: ['High yielding', 'Drought tolerant'], yield: '20-25 quintals/acre', diseaseResistance: ['Mosaic resistant'], daysToMaturity: 95 },
            { name: 'NRC-7', characteristics: ['Bold seeds', 'High protein'], yield: '18-22 quintals/acre', diseaseResistance: ['Yellow mosaic resistant'], daysToMaturity: 100 },
        ],
        plantingGuide: {
            season: 'Kharif', months: ['June', 'July'],
            soilType: ['Well-drained black soil', 'Loamy soil'],
            soilPH: { min: 6.0, max: 7.0 },
            temperature: { min: 20, max: 30, optimal: 25 },
            rainfall: { min: 600, max: 1000 },
            spacing: '45cm x 5cm', seedDepth: '3-4 cm', germinationDays: 6,
        },
        careGuide: {
            watering: 'Sensitive to waterlogging; irrigate at flowering and pod filling stages',
            fertilization: ['Apply NPK 20:80:40 kg/ha', 'Seed treatment with Rhizobium culture', 'Apply sulphur 20 kg/ha'],
            pruning: 'Not required',
            pestControl: ['Monitor for girdle beetle', 'Use light traps for moth pests', 'Spray neem-based pesticides'],
            diseasePrevention: ['Seed treatment with thiram + carbendazim', 'Maintain field drainage', 'Crop rotation with cereals'],
            weedManagement: 'Pendimethalin pre-emergence; 1-2 hand weedings at 20-30 days',
        },
        pestsAndDiseases: [
            { name: 'Girdle Beetle', type: 'pest', symptoms: ['Girdling of stem', 'Wilting of branches', 'Plant breakage'], causes: ['Oberia brevis beetle larvae'], organicRemedies: ['Remove and destroy infested stems', 'Light traps for adults'], chemicalTreatments: ['Monocrotophos 0.05%', 'Endosulfan 35% EC @ 1.5ml/L'], prevention: ['Early planting', 'Clean cultivation', 'Crop rotation'], images: [] },
            { name: 'Yellow Mosaic Virus', type: 'disease', symptoms: ['Yellow mosaic patches on leaves', 'Stunted growth', 'Reduced pod set'], causes: ['Whitefly transmitted virus'], organicRemedies: ['Remove and destroy infected plants', 'Control whitefly vector'], chemicalTreatments: ['Thiamethoxam for vector control', 'No direct chemical cure'], prevention: ['Resistant varieties (NRC-7)', 'Control whitefly early', 'Rogue out infected plants'], images: [] },
        ],
        harvestInfo: { daysToMaturity: 95, indicators: ['Pods turn brown', 'Leaves drop', '85% pods ripe'], harvestingMethod: 'Combine harvester or manual cutting', postHarvestHandling: ['Threshing', 'Cleaning', 'Drying to 12% moisture'], storageConditions: 'Cool, dry storage with moisture <13%', shelfLife: '12 months' },
        nutritionalValue: { calories: 446, protein: 36, carbohydrates: 30, fiber: 9, vitamins: ['K', 'B1', 'B2', 'B9'], minerals: ['Iron', 'Calcium', 'Magnesium', 'Zinc'] },
        marketInfo: { demand: 'high', priceRange: { min: 3800, max: 5200, unit: 'per quintal' }, exportPotential: true, majorMarkets: ['India', 'China', 'USA', 'EU'] },
        companionCrops: ['Maize', 'Sorghum'],
        rotationCrops: ['Wheat', 'Gram', 'Mustard'],
        searchTags: ['soybean', 'soya', 'oilseed', 'kharif', 'protein crop'],
    },
    {
        name: 'Sugarcane',
        scientificName: 'Saccharum officinarum',
        family: 'Poaceae',
        origin: 'Papua New Guinea',
        description: 'Sugarcane is a major cash crop in India, primarily grown for sugar production. It is a long-duration crop requiring tropical climate with abundant water.',
        category: 'cash_crop',
        images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800'],
        varieties: [
            { name: 'Co-86032', characteristics: ['High sugar recovery', 'Early maturing'], yield: '350-400 quintals/acre', diseaseResistance: ['Smut resistant'], daysToMaturity: 330 },
            { name: 'CoC-671', characteristics: ['High tillering', 'Drought tolerant'], yield: '300-350 quintals/acre', diseaseResistance: ['Red rot resistant'], daysToMaturity: 360 },
        ],
        plantingGuide: {
            season: 'Kharif', months: ['February', 'March', 'October', 'November'],
            soilType: ['Deep loamy soil', 'Clay loam', 'Alluvial soil'],
            soilPH: { min: 6.5, max: 7.5 },
            temperature: { min: 20, max: 38, optimal: 30 },
            rainfall: { min: 1500, max: 2500 },
            spacing: '90cm between rows', seedDepth: '5-8 cm', germinationDays: 15,
        },
        careGuide: {
            watering: 'Regular irrigation every 7-10 days; critical at tillering and grand growth phase',
            fertilization: ['Apply NPK 250:100:120 kg/ha', 'Press mud compost 10 tons/ha', 'Top dress nitrogen in 3 splits'],
            pruning: 'Detrashing (removing dried leaves) at 4-6 months',
            pestControl: ['Release Trichogramma for top borer', 'Use light traps for pyrilla', 'Inspect root zone for white grub'],
            diseasePrevention: ['Use healthy disease-free setts', 'Hot water treatment at 50°C for 2 hours', 'Avoid monoculture'],
            weedManagement: '2-3 earthing-up operations; use atrazine pre-emergence',
        },
        pestsAndDiseases: [
            { name: 'Top Shoot Borer', type: 'pest', symptoms: ['Dead hearts in young crop', 'Shothole appearance', 'Withered top shoots'], causes: ['Scirpophaga excerptalis larvae'], organicRemedies: ['Trichogramma release 50,000/ha', 'Neem cake @ 500kg/ha'], chemicalTreatments: ['Endosulfan 35% EC', 'Carbofuran 3G @ 33kg/ha'], prevention: ['Timely planting', 'Avoid ratoon crops', 'Field sanitation'], images: [] },
            { name: 'Red Rot', type: 'disease', symptoms: ['Red staining inside stalk', 'Withering of leaves', 'Alcoholic smell'], causes: ['Colletotrichum falcatum fungus'], organicRemedies: ['Hot water seed treatment', 'Destroy infected stools'], chemicalTreatments: ['Carbendazim 0.1% sett treatment'], prevention: ['Resistant varieties', 'Healthy setts', 'Good drainage'], images: [] },
        ],
        harvestInfo: { daysToMaturity: 360, indicators: ['Internodes become compact', 'Sugar content >10%', 'Brix reading 18-20'], harvestingMethod: 'Manual cutting at ground level', postHarvestHandling: ['Crush within 24 hours', 'Remove dry leaves', 'Weigh and transport to mill'], storageConditions: 'Process within 24-48 hours of harvest', shelfLife: '24-48 hours only' },
        nutritionalValue: { calories: 269, protein: 0, carbohydrates: 73, fiber: 0, vitamins: ['B1', 'B2', 'B6'], minerals: ['Calcium', 'Iron', 'Potassium'] },
        marketInfo: { demand: 'high', priceRange: { min: 290, max: 360, unit: 'per quintal (FRP)' }, exportPotential: true, majorMarkets: ['India', 'Brazil', 'Thailand'] },
        companionCrops: ['Onion', 'Potato', 'Garlic'],
        rotationCrops: ['Wheat', 'Rice', 'Legumes'],
        searchTags: ['sugarcane', 'ganna', 'cash crop', 'sugar', 'kharif'],
    },
    {
        name: 'Maize',
        scientificName: 'Zea mays',
        family: 'Poaceae',
        origin: 'Mexico',
        description: 'Maize (corn) is a versatile crop used for food, feed, and industrial purposes. It is the third most important cereal crop in India after rice and wheat.',
        category: 'cereal',
        images: ['https://images.unsplash.com/photo-1601593346740-925612772716?w=800'],
        varieties: [
            { name: 'Hybrid-DHM-117', characteristics: ['High yield', 'Drought tolerant'], yield: '35-40 quintals/acre', diseaseResistance: ['Turcicum blight resistant'], daysToMaturity: 90 },
            { name: 'NK-6240', characteristics: ['Bold grain', 'Early maturity'], yield: '30-35 quintals/acre', diseaseResistance: ['Moderate'], daysToMaturity: 85 },
        ],
        plantingGuide: {
            season: 'Kharif', months: ['June', 'July'],
            soilType: ['Well-drained loamy soil', 'Sandy loam'],
            soilPH: { min: 6.0, max: 7.5 },
            temperature: { min: 18, max: 32, optimal: 25 },
            rainfall: { min: 600, max: 1100 },
            spacing: '60cm x 25cm', seedDepth: '4-5 cm', germinationDays: 7,
        },
        careGuide: {
            watering: 'Critical irrigation at knee height, tasseling, and silking stages',
            fertilization: ['Apply NPK 150:75:40 kg/ha', 'Top dress with urea at knee height and tasseling', 'Zinc sulphate 25 kg/ha if deficient'],
            pruning: 'Detasseling in seed production fields',
            pestControl: ['Monitor for fall armyworm from seedling stage', 'Use pheromone traps', 'Spray neem oil early'],
            diseasePrevention: ['Seed treatment with thiram', 'Crop rotation', 'Maintain proper plant density'],
            weedManagement: 'Atrazine 1.5 kg/ha pre-emergence; 1-2 hand weedings at 15-30 days',
        },
        pestsAndDiseases: [
            { name: 'Fall Armyworm', type: 'pest', symptoms: ['Ragged leaf feeding', 'Frass (excrement) in leaf whorls', 'Stem tunneling'], causes: ['Spodoptera frugiperda moth'], organicRemedies: ['Neem oil 5ml/L', 'Bacillus thuringiensis spray', 'Release natural enemies'], chemicalTreatments: ['Emamectin benzoate 5% SG @ 0.4g/L', 'Chlorantraniliprole 18.5% SC @ 0.4ml/L'], prevention: ['Early planting', 'Regular field scouting', 'Use pheromone traps @ 10/ha'], images: [] },
            { name: 'Turcicum Blight', type: 'disease', symptoms: ['Long elliptical lesions on leaves', 'Gray-green water-soaked lesions', 'Entire leaf drying'], causes: ['Exserohilum turcicum fungus'], organicRemedies: ['Remove and destroy infected leaves', 'Crop rotation with non-host'], chemicalTreatments: ['Mancozeb 75% WP @ 2g/L', 'Propiconazole 25% EC @ 1ml/L'], prevention: ['Resistant hybrids', 'Balanced fertilization', 'Avoid dense planting'], images: [] },
        ],
        harvestInfo: { daysToMaturity: 90, indicators: ['Silk turns brown', 'Husk turns yellowish', 'Grain dents (dent stage)'], harvestingMethod: 'Manual or mechanized picking', postHarvestHandling: ['Dehusking', 'Drying to 12-14% moisture', 'Shelling'], storageConditions: 'Dry, well-ventilated storage with moisture <14%', shelfLife: '6-12 months' },
        nutritionalValue: { calories: 365, protein: 9.4, carbohydrates: 74, fiber: 7.3, vitamins: ['B1', 'B3', 'B5', 'E'], minerals: ['Phosphorus', 'Magnesium', 'Zinc', 'Iron'] },
        marketInfo: { demand: 'high', priceRange: { min: 1800, max: 2400, unit: 'per quintal' }, exportPotential: true, majorMarkets: ['India', 'USA', 'China', 'Brazil'] },
        companionCrops: ['Soybean', 'Cowpea', 'Beans'],
        rotationCrops: ['Soybean', 'Wheat', 'Gram'],
        searchTags: ['maize', 'corn', 'makka', 'cereal', 'kharif crop'],
    },
    {
        name: 'Groundnut',
        scientificName: 'Arachis hypogaea',
        family: 'Fabaceae',
        origin: 'South America',
        description: 'Groundnut (peanut) is a major oilseed crop in India. It is a self-fertilizing legume that fixes atmospheric nitrogen, improving soil fertility.',
        category: 'oilseed',
        images: ['https://images.unsplash.com/photo-1568625365131-079e026a927d?w=800'],
        varieties: [
            { name: 'GG-20', characteristics: ['High oil content', 'Bold seeds'], yield: '15-18 quintals/acre', diseaseResistance: ['Tikka resistant'], daysToMaturity: 110 },
            { name: 'TAG-24', characteristics: ['Early maturing', 'Drought tolerant'], yield: '12-15 quintals/acre', diseaseResistance: ['Moderate'], daysToMaturity: 95 },
        ],
        plantingGuide: {
            season: 'Kharif', months: ['June', 'July'],
            soilType: ['Sandy loam', 'Well-drained red soil', 'Loamy soil'],
            soilPH: { min: 6.0, max: 7.0 },
            temperature: { min: 25, max: 35, optimal: 30 },
            rainfall: { min: 500, max: 1000 },
            spacing: '30cm x 10cm', seedDepth: '4-5 cm', germinationDays: 7,
        },
        careGuide: {
            watering: 'Critical at pegging, pod development, and seed filling stages; avoid waterlogging',
            fertilization: ['Apply NPK 20:60:40 kg/ha', 'Apply gypsum 200 kg/ha at pegging for pod development', 'Seed inoculation with Rhizobium'],
            pruning: 'Not required',
            pestControl: ['Monitor for thrips and jassids from early stage', 'Use yellow sticky traps', 'Earthing-up to encourage pod formation'],
            diseasePrevention: ['Seed treatment with thiram + carbendazim', 'Maintain field drainage', 'Crop rotation with cereals'],
            weedManagement: 'Pendimethalin pre-emergence; 2 hand weedings at 15 and 30 DAS',
        },
        pestsAndDiseases: [
            { name: 'Tikka Disease', type: 'disease', symptoms: ['Small circular spots on leaves', 'Dark brown centers with yellow halo', 'Premature defoliation'], causes: ['Cercospora arachidicola fungus'], organicRemedies: ['Remove infected leaves', 'Neem leaf extract spray'], chemicalTreatments: ['Mancozeb 75% WP @ 2.5g/L', 'Carbendazim 50% WP @ 1g/L'], prevention: ['Resistant varieties', 'Seed treatment', 'Timely fungicide spray'], images: [] },
            { name: 'White Grub', type: 'pest', symptoms: ['Sudden wilting', 'Damaged root system', 'Grubs in soil near roots'], causes: ['Holotrichia beetles larvae in soil'], organicRemedies: ['Deep summer ploughing', 'Apply neem cake @ 200 kg/ha', 'Collect and destroy adult beetles at light traps'], chemicalTreatments: ['Chlorpyrifos 20% EC @ 2ml/L as soil drench', 'Phorate 10G @ 25kg/ha'], prevention: ['Summer deep ploughing', 'Crop rotation', 'Avoid excessive organic matter'], images: [] },
        ],
        harvestInfo: { daysToMaturity: 110, indicators: ['Plants show yellowing', 'Pod inner surface has dark patches', 'Shell network visible on pods'], harvestingMethod: 'Manual digging or pod stripper', postHarvestHandling: ['Windrow drying 3-5 days', 'Threshing/stripping', 'Drying to 10% moisture'], storageConditions: 'Dry, well-ventilated godown; aflatoxin monitoring required', shelfLife: '6-12 months' },
        nutritionalValue: { calories: 567, protein: 26, carbohydrates: 16, fiber: 8.5, vitamins: ['B3', 'B1', 'E', 'B6', 'B9'], minerals: ['Manganese', 'Magnesium', 'Phosphorus', 'Copper'] },
        marketInfo: { demand: 'high', priceRange: { min: 4500, max: 6500, unit: 'per quintal' }, exportPotential: true, majorMarkets: ['India', 'China', 'USA', 'EU', 'Middle East'] },
        companionCrops: ['Castor', 'Jowar', 'Maize'],
        rotationCrops: ['Wheat', 'Jowar', 'Cotton'],
        searchTags: ['groundnut', 'peanut', 'moongphali', 'oilseed', 'kharif crop'],
    },
    {
        name: 'Tomato',
        scientificName: 'Solanum lycopersicum',
        family: 'Solanaceae',
        origin: 'South America',
        description: 'Tomato is one of the most widely grown vegetable crops in India. It is a warm-season crop grown across the country for fresh consumption and processing.',
        category: 'vegetable',
        images: ['https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=800'],
        varieties: [
            { name: 'Hybrid Arka Vikas', characteristics: ['High yield', 'Firm fruits'], yield: '250-300 quintals/acre', diseaseResistance: ['Fusarium resistant'], daysToMaturity: 75 },
            { name: 'PKM-1', characteristics: ['Small fruits', 'Good keeping quality'], yield: '200-250 quintals/acre', diseaseResistance: ['Blight tolerant'], daysToMaturity: 70 },
        ],
        plantingGuide: {
            season: 'Rabi', months: ['September', 'October', 'November'],
            soilType: ['Well-drained loamy soil', 'Sandy loam', 'Red soil'],
            soilPH: { min: 6.0, max: 7.0 },
            temperature: { min: 15, max: 30, optimal: 22 },
            rainfall: { min: 400, max: 800 },
            spacing: '60cm x 45cm', seedDepth: '1-2 cm (nursery)', germinationDays: 7,
        },
        careGuide: {
            watering: 'Drip irrigation preferred; water every 4-5 days; avoid drought stress at flowering',
            fertilization: ['Apply FYM 20 tons/ha', 'NPK 150:75:75 kg/ha', 'Calcium nitrate spray at flowering', 'Micronutrients foliar spray'],
            pruning: 'Stake and train plants; remove suckers for hybrid varieties',
            pestControl: ['Pheromone traps for fruit borer', 'Yellow sticky traps for whitefly', 'Regular monitoring for TYLCV symptoms'],
            diseasePrevention: ['Grafted seedlings on resistant rootstock', 'Seed treatment', 'Crop rotation minimum 2-3 years'],
            weedManagement: 'Mulching with black polyethylene film; 2-3 hand weedings',
        },
        pestsAndDiseases: [
            { name: 'Tomato Fruit Borer', type: 'pest', symptoms: ['Holes in fruits', 'Frass near holes', 'Caterpillar inside fruit'], causes: ['Helicoverpa armigera larvae'], organicRemedies: ['Pheromone traps 10/ha', 'NPV spray', 'Hand pick and destroy larvae'], chemicalTreatments: ['Spinosad 45% SC @ 0.2ml/L', 'Emamectin benzoate 5% SG @ 0.4g/L'], prevention: ['Early sowing', 'Use pheromone traps', 'Remove damaged fruits'], images: [] },
            { name: 'Early Blight', type: 'disease', symptoms: ['Dark brown spots with concentric rings', 'Yellow halo around spots', 'Leaf drop'], causes: ['Alternaria solani fungus'], organicRemedies: ['Bordeaux mixture (1%)', 'Remove infected leaves'], chemicalTreatments: ['Mancozeb 75% WP @ 2g/L', 'Iprodione 50% WP @ 2g/L'], prevention: ['Crop rotation', 'Avoid overhead irrigation', 'Resistant varieties'], images: [] },
        ],
        harvestInfo: { daysToMaturity: 75, indicators: ['Fruits turn red/pink', 'Firm but give slightly to pressure', 'Calyx still fresh'], harvestingMethod: 'Hand harvesting every 3-4 days', postHarvestHandling: ['Grading by size and color', 'Cool at 12-13°C', 'Packaging in ventilated crates'], storageConditions: 'Cool dry place 12-14°C; avoid direct sunlight', shelfLife: '7-14 days (fresh)' },
        nutritionalValue: { calories: 18, protein: 0.9, carbohydrates: 3.9, fiber: 1.2, vitamins: ['C', 'K', 'B9', 'A'], minerals: ['Potassium', 'Phosphorus'] },
        marketInfo: { demand: 'high', priceRange: { min: 500, max: 3000, unit: 'per quintal' }, exportPotential: false, majorMarkets: ['India (domestic)'] },
        companionCrops: ['Basil', 'Marigold', 'Carrot'],
        rotationCrops: ['Legumes', 'Cereals', 'Cucurbits'],
        searchTags: ['tomato', 'tamatar', 'vegetable', 'rabi crop', 'solanaceae'],
    },
    {
        name: 'Onion',
        scientificName: 'Allium cepa',
        family: 'Amaryllidaceae',
        origin: 'Central Asia',
        description: 'Onion is a major vegetable and spice crop in India. Maharashtra is the largest producer. It is grown in both kharif and rabi seasons.',
        category: 'vegetable',
        images: ['https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=800'],
        varieties: [
            { name: 'Bhima Kiran', characteristics: ['Red skin', 'High storage capacity'], yield: '200-250 quintals/acre', diseaseResistance: ['Purple blotch tolerant'], daysToMaturity: 110 },
            { name: 'Nasik Red', characteristics: ['Deep red skin', 'Good keeping quality'], yield: '180-220 quintals/acre', diseaseResistance: ['Moderate'], daysToMaturity: 120 },
        ],
        plantingGuide: {
            season: 'Rabi', months: ['October', 'November'],
            soilType: ['Well-drained loamy soil', 'Sandy loam'],
            soilPH: { min: 6.0, max: 7.5 },
            temperature: { min: 13, max: 25, optimal: 20 },
            rainfall: { min: 600, max: 1000 },
            spacing: '15cm x 10cm', seedDepth: '1-2 cm (nursery)', germinationDays: 10,
        },
        careGuide: {
            watering: 'Light frequent irrigation every 7-10 days; stop 15 days before harvest',
            fertilization: ['Apply NPK 100:50:50 kg/ha', 'Top dress with urea in 2 splits', 'Sulphur 20 kg/ha for bulb quality'],
            pruning: 'Not required; remove flower stalks if bolting occurs',
            pestControl: ['Thrips control critical from transplanting', 'Use blue sticky traps', 'Monitor for purple blotch symptoms'],
            diseasePrevention: ['Seed treatment with thiram', 'Avoid waterlogging', 'Proper crop rotation (3 years gap)'],
            weedManagement: 'Pendimethalin pre-emergence; hand weeding at 30 and 45 DAS',
        },
        pestsAndDiseases: [
            { name: 'Thrips', type: 'pest', symptoms: ['Silver streaks on leaves', 'Curling and distortion of leaves', 'White patches on bulbs'], causes: ['Thrips tabaci; favored by dry weather'], organicRemedies: ['Blue sticky traps 10/ha', 'Neem oil 5ml/L', 'Garlic-chilli extract spray'], chemicalTreatments: ['Fipronil 5% SC @ 1.5ml/L', 'Imidacloprid 17.8% SL @ 0.3ml/L'], prevention: ['Monitor from transplanting', 'Avoid excessive nitrogen', 'Intercropping with coriander'], images: [] },
            { name: 'Purple Blotch', type: 'disease', symptoms: ['Small white lesions with purple center', 'Lesion enlarges and girdles leaf', 'Leaf tip dieback'], causes: ['Alternaria porri fungus; favored by high humidity'], organicRemedies: ['Copper oxychloride spray', 'Remove infected leaves'], chemicalTreatments: ['Mancozeb 75% WP @ 2.5g/L', 'Iprodione 50% WP @ 2g/L'], prevention: ['Crop rotation', 'Avoid dense planting', 'Reduce leaf wetness period'], images: [] },
        ],
        harvestInfo: { daysToMaturity: 110, indicators: ['50% neck fall', 'Leaves turn yellow-green', 'Bulbs well formed'], harvestingMethod: 'Manual lifting after 1-2 days field drying', postHarvestHandling: ['Cure in shade for 10-15 days', 'Remove dry tops', 'Grading by size'], storageConditions: 'Bamboo/wire mesh platform storage in ventilated shed', shelfLife: '4-6 months (after curing)' },
        nutritionalValue: { calories: 40, protein: 1.1, carbohydrates: 9.3, fiber: 1.7, vitamins: ['C', 'B6', 'B9'], minerals: ['Potassium', 'Phosphorus', 'Calcium'] },
        marketInfo: { demand: 'high', priceRange: { min: 800, max: 5000, unit: 'per quintal' }, exportPotential: true, majorMarkets: ['India', 'Malaysia', 'Sri Lanka', 'Bangladesh', 'Nepal'] },
        companionCrops: ['Carrot', 'Beets', 'Lettuce'],
        rotationCrops: ['Legumes', 'Cereals', 'Cucurbits'],
        searchTags: ['onion', 'kanda', 'pyaz', 'vegetable', 'rabi crop'],
    },
    {
        name: 'Chickpea',
        scientificName: 'Cicer arietinum',
        family: 'Fabaceae',
        origin: 'Middle East',
        description: 'Chickpea (gram) is the largest produced pulse crop in India. It is a drought-tolerant, nitrogen-fixing legume grown mainly in Madhya Pradesh, Rajasthan and Maharashtra.',
        category: 'pulse',
        images: ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800'],
        varieties: [
            { name: 'JG-11', characteristics: ['Short duration', 'Wilt resistant'], yield: '15-18 quintals/acre', diseaseResistance: ['Wilt resistant'], daysToMaturity: 95 },
            { name: 'Vikas', characteristics: ['Bold seeds', 'High protein'], yield: '12-16 quintals/acre', diseaseResistance: ['Moderate'], daysToMaturity: 115 },
        ],
        plantingGuide: {
            season: 'Rabi', months: ['October', 'November'],
            soilType: ['Sandy loam', 'Loamy soil', 'Black cotton soil (medium)'],
            soilPH: { min: 6.0, max: 7.5 },
            temperature: { min: 10, max: 25, optimal: 15 },
            rainfall: { min: 400, max: 800 },
            spacing: '30cm x 10cm', seedDepth: '5-8 cm', germinationDays: 8,
        },
        careGuide: {
            watering: 'Rainfed crop; supplemental irrigation at pre-flowering and pod filling if available',
            fertilization: ['Apply NPK 20:40:20 kg/ha at sowing', 'Seed inoculation with Rhizobium culture', 'No nitrogen top-dressing needed (N-fixing legume)'],
            pruning: 'Not required',
            pestControl: ['Monitor for pod borer (critical pest)', 'Install pheromone traps @ 5/ha', 'Spray Bt at egg hatching stage'],
            diseasePrevention: ['Seed treatment with thiram + bavistin', 'Crop rotation (avoid repeating gram)'],
            weedManagement: 'Pendimethalin pre-emergence; 1-2 hand weedings',
        },
        pestsAndDiseases: [
            { name: 'Pod Borer', type: 'pest', symptoms: ['Holes in pods', 'Larva inside pods feeding on seeds', 'Dry and shriveled pods'], causes: ['Helicoverpa armigera larvae; major pest of chickpea'], organicRemedies: ['NPV-H spray 250 LE/ha', 'Pheromone traps 5/ha', 'Neem oil 5ml/L spray'], chemicalTreatments: ['Emamectin benzoate 5% SG @ 0.4g/L', 'Chlorantraniliprole 18.5% SC @ 0.3ml/L'], prevention: ['Monitor egg count (>1 egg/plant is threshold)', 'Intercrop with safflower', 'Early sowing before November 15'], images: [] },
            { name: 'Fusarium Wilt', type: 'disease', symptoms: ['Sudden wilting', 'Yellowing starting from lower leaves', 'Brown discoloration inside stem'], causes: ['Fusarium oxysporum f.sp. ciceris fungus in soil'], organicRemedies: ['Trichoderma viride seed treatment 4g/kg', 'Apply bio-pesticides in soil'], chemicalTreatments: ['Carbendazim + thiram seed treatment (1:2 @ 3g/kg seed)', 'Soil drenching with carbendazim 0.1%'], prevention: ['Resistant varieties (JG-11)', 'Long crop rotation', 'Deep summer ploughing'], images: [] },
        ],
        harvestInfo: { daysToMaturity: 95, indicators: ['Plant turns yellow-brown', '90% pods dry', 'Seeds hard on pressing'], harvestingMethod: 'Manual uprooting or cutting; then threshing', postHarvestHandling: ['Sun dry threshed grain', 'Winnowing', 'Drying to 10-12% moisture'], storageConditions: 'Cool, dry storage with moisture <12%; use aluminium phosphide for long storage', shelfLife: '12-18 months' },
        nutritionalValue: { calories: 364, protein: 19, carbohydrates: 61, fiber: 17, vitamins: ['B1', 'B2', 'B3', 'B6', 'B9'], minerals: ['Iron', 'Phosphorus', 'Calcium', 'Zinc'] },
        marketInfo: { demand: 'high', priceRange: { min: 4500, max: 6500, unit: 'per quintal' }, exportPotential: true, majorMarkets: ['India', 'Pakistan', 'Bangladesh', 'Middle East'] },
        companionCrops: ['Wheat', 'Mustard', 'Safflower'],
        rotationCrops: ['Wheat', 'Cotton', 'Sorghum'],
        searchTags: ['chickpea', 'gram', 'chana', 'chick pea', 'pulse', 'rabi crop', 'daal'],
    },
];
// ─── Model candidate chain (same as aiService.ts — try in order until one works) ─
const TEXT_MODEL_CANDIDATES = process.env.GEMINI_MODEL
    ? [process.env.GEMINI_MODEL, 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash-latest', 'gemini-1.5-pro-latest']
    : ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash-latest', 'gemini-1.5-pro-latest'];
// ─── AI Search via Gemini (server-side proxy — API key not exposed to browser) ─
const aiSearchCrop = async (req, res) => {
    const { cropName, language = 'en' } = req.body;
    if (!cropName || typeof cropName !== 'string' || cropName.trim().length === 0) {
        throw (0, errorHandler_1.createError)('cropName is required', 400);
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw (0, errorHandler_1.createError)('AI service is not configured on this server', 503);
    }
    const langLabel = language === 'mr' ? 'Marathi' : language === 'hi' ? 'Hindi' : 'English';
    const normalizedName = cropName.trim();
    const prompt = `Provide a detailed agricultural guide for the crop "${normalizedName}" in the "${langLabel}" language.
Respond STRICTLY with a raw JSON object (no markdown wrapping, no backticks). Start directly with { and end with }. Match this TypeScript structure exactly. Provide accurate, highly informative farming details for Indian agriculture:
{
  "name": "string",
  "scientificName": "string",
  "description": "string (2-3 sentences)",
  "category": "string (one of: cereal, vegetable, fruit, pulse, oilseed, spice, fiber, fodder, cash_crop)",
  "soilType": "string",
  "soilPH": "string (e.g. 6.0 - 7.5)",
  "sowingDepth": "string",
  "spacing": "string",
  "waterFrequency": "string",
  "sunlight": "string",
  "temperature": "string",
  "germinationTime": "string",
  "harvestTime": "string",
  "fertilizers": { "organic": ["string", "string"], "chemical": ["string", "string"], "npk": "string" },
  "commonPests": [
    { "name": "string", "description": "string", "symptoms": ["string", "string"], "organicControl": "string", "chemicalControl": "string" }
  ],
  "stages": [
    { "name": "string", "duration": "string", "description": "string", "care": ["string"] }
  ],
  "suitableStates": ["string", "string", "string"],
  "bestSeason": "string",
  "waterRequirement": "string",
  "marketDemand": "string (High / Medium / Low)",
  "nutritionalValue": { "calories": 0, "protein": 0, "carbohydrates": 0, "fiber": 0 },
  "yieldPerAcre": "string (e.g. 20-25 quintals/acre)"
}
Ensure commonPests has exactly 2 entries and stages has 4-5 distinct phases. All string values (not keys) must be in ${langLabel}.`;
    // Try each model candidate until one succeeds
    let lastError = null;
    for (const modelName of TEXT_MODEL_CANDIDATES) {
        try {
            const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            let text = result.response.text();
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            // Extract first valid JSON block
            const startIdx = text.indexOf('{');
            const endIdx = text.lastIndexOf('}');
            if (startIdx !== -1 && endIdx !== -1) {
                text = text.substring(startIdx, endIdx + 1);
            }
            const cropData = JSON.parse(text);
            cropData._id = normalizedName.replace(/\s+/g, '-').toLowerCase() + '-ai';
            console.log(`[CropEncyclopedia] AI search succeeded with model: ${modelName}`);
            res.status(200).json({ success: true, data: { crop: cropData, source: 'ai', model: modelName } });
            return;
        }
        catch (err) {
            lastError = err;
            const errMsg = err instanceof Error ? err.message : String(err);
            // Only skip to next model if it's a model-not-found / 404 error
            if (errMsg.includes('not found') || errMsg.includes('404') || errMsg.includes('not supported')) {
                console.warn(`[CropEncyclopedia] Model "${modelName}" not available, trying next...`);
                continue;
            }
            // For other errors (parse, rate-limit), stop retrying
            console.error(`[CropEncyclopedia] AI search failed with model "${modelName}":`, errMsg);
            break;
        }
    }
    console.error('[CropEncyclopedia] All model candidates exhausted:', lastError);
    throw (0, errorHandler_1.createError)('AI crop search failed. Please try again.', 502);
};
exports.aiSearchCrop = aiSearchCrop;
// ─── Get all crops ─────────────────────────────────────────────────────────────
const getAllCrops = async (req, res) => {
    const tenantId = req.tenantId;
    const { search, category, page = 1, limit = 20 } = req.query;
    const existingCount = await CropEncyclopedia_1.default.countDocuments({ tenantId });
    if (existingCount === 0) {
        const cropsWithTenant = sampleCrops.map((crop) => ({ ...crop, tenantId, isActive: true }));
        await CropEncyclopedia_1.default.insertMany(cropsWithTenant);
    }
    const filter = { tenantId, isActive: true };
    if (category)
        filter.category = category;
    if (search)
        filter.$text = { $search: search };
    const skip = (Number(page) - 1) * Number(limit);
    const [crops, total, categories] = await Promise.all([
        CropEncyclopedia_1.default.find(filter)
            .select('name scientificName category images description varieties.name plantingGuide.season harvestInfo.daysToMaturity marketInfo')
            .skip(skip)
            .limit(Number(limit))
            .sort({ name: 1 }),
        CropEncyclopedia_1.default.countDocuments(filter),
        CropEncyclopedia_1.default.distinct('category', { tenantId, isActive: true }),
    ]);
    res.status(200).json({
        success: true,
        data: { crops, categories, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } },
    });
};
exports.getAllCrops = getAllCrops;
// ─── Get single crop ───────────────────────────────────────────────────────────
const getCropById = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const crop = await CropEncyclopedia_1.default.findOne({ _id: id, tenantId });
    if (!crop)
        throw (0, errorHandler_1.createError)('Crop not found', 404);
    crop.viewCount += 1;
    await crop.save();
    res.status(200).json({ success: true, data: { crop } });
};
exports.getCropById = getCropById;
// ─── Search crops ──────────────────────────────────────────────────────────────
const searchCrops = async (req, res) => {
    const tenantId = req.tenantId;
    const { q } = req.query;
    if (!q)
        throw (0, errorHandler_1.createError)('Search query is required', 400);
    const crops = await CropEncyclopedia_1.default.find({ tenantId, isActive: true, $text: { $search: q } }, { score: { $meta: 'textScore' } })
        .select('name scientificName category images description')
        .sort({ score: { $meta: 'textScore' } })
        .limit(10);
    res.status(200).json({ success: true, data: { crops } });
};
exports.searchCrops = searchCrops;
// ─── Get crop by name ──────────────────────────────────────────────────────────
const getCropByName = async (req, res) => {
    const tenantId = req.tenantId;
    const { name } = req.params;
    const crop = await CropEncyclopedia_1.default.findOne({ tenantId, name: new RegExp(name, 'i'), isActive: true });
    if (!crop)
        throw (0, errorHandler_1.createError)('Crop not found', 404);
    res.status(200).json({ success: true, data: { crop } });
};
exports.getCropByName = getCropByName;
// ─── Get pests and diseases ────────────────────────────────────────────────────
const getPestsAndDiseases = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const crop = await CropEncyclopedia_1.default.findOne({ _id: id, tenantId }, { pestsAndDiseases: 1, name: 1 });
    if (!crop)
        throw (0, errorHandler_1.createError)('Crop not found', 404);
    res.status(200).json({ success: true, data: { cropName: crop.name, pestsAndDiseases: crop.pestsAndDiseases } });
};
exports.getPestsAndDiseases = getPestsAndDiseases;
// ─── Get AI advice for crop ────────────────────────────────────────────────────
const getCropAdvice = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { question } = req.body;
    const crop = await CropEncyclopedia_1.default.findOne({ _id: id, tenantId });
    if (!crop)
        throw (0, errorHandler_1.createError)('Crop not found', 404);
    const advice = {
        crop: crop.name,
        question: question || 'General cultivation advice',
        answer: `Based on ${crop.name} cultivation best practices: ${crop.plantingGuide.soilType.join(', ')} soils with pH ${crop.plantingGuide.soilPH.min}-${crop.plantingGuide.soilPH.max} are ideal. ${crop.careGuide.watering}`,
        recommendations: [
            ...crop.careGuide.fertilization.slice(0, 2),
            ...crop.careGuide.pestControl.slice(0, 2),
        ],
    };
    res.status(200).json({ success: true, data: { advice } });
};
exports.getCropAdvice = getCropAdvice;
//# sourceMappingURL=cropEncyclopediaController.js.map