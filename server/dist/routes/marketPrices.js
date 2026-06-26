"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const marketPriceController_1 = require("../controllers/marketPriceController");
const router = (0, express_1.Router)();
router.use(auth_1.protect);
// Get market prices with filters
router.get('/', marketPriceController_1.getMarketPrices);
// Get districts + talukas (markets) for a state — called in isolation to avoid full re-render
router.get('/districts', marketPriceController_1.getDistrictsForState);
// Get price trends for a crop
router.get('/trends/:cropName', marketPriceController_1.getPriceTrends);
// Get nearby markets
router.get('/nearby', marketPriceController_1.getNearbyMarkets);
exports.default = router;
//# sourceMappingURL=marketPrices.js.map