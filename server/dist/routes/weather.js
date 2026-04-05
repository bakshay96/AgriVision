"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const weatherController_1 = require("../controllers/weatherController");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.protect);
// Get weather data
router.get('/', weatherController_1.getWeather);
// Update location
router.put('/location', weatherController_1.updateLocation);
// Get crop recommendations
router.get('/recommendations', weatherController_1.getCropRecommendations);
exports.default = router;
//# sourceMappingURL=weather.js.map