"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const cropEncyclopediaController_1 = require("../controllers/cropEncyclopediaController");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.protect);
// Get all crops
router.get('/', cropEncyclopediaController_1.getAllCrops);
// Search crops
router.get('/search', cropEncyclopediaController_1.searchCrops);
// Get crop by name
router.get('/name/:name', cropEncyclopediaController_1.getCropByName);
// Get single crop details
router.get('/:id', cropEncyclopediaController_1.getCropById);
// Get pests and diseases
router.get('/:id/pests-diseases', cropEncyclopediaController_1.getPestsAndDiseases);
// Get AI advice
router.post('/:id/advice', cropEncyclopediaController_1.getCropAdvice);
exports.default = router;
//# sourceMappingURL=cropEncyclopedia.js.map