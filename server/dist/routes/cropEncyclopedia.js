"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const cropEncyclopediaController_1 = require("../controllers/cropEncyclopediaController");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.protect);
// ── Server-side AI search proxy (keeps Gemini key out of browser) ──────────────
router.post('/ai-search', cropEncyclopediaController_1.aiSearchCrop);
// ── Standard CRUD ───────────────────────────────────────────────────────────────
router.get('/', cropEncyclopediaController_1.getAllCrops);
router.get('/search', cropEncyclopediaController_1.searchCrops);
router.get('/name/:name', cropEncyclopediaController_1.getCropByName);
router.get('/:id', cropEncyclopediaController_1.getCropById);
router.get('/:id/pests-diseases', cropEncyclopediaController_1.getPestsAndDiseases);
router.post('/:id/advice', cropEncyclopediaController_1.getCropAdvice);
exports.default = router;
//# sourceMappingURL=cropEncyclopedia.js.map