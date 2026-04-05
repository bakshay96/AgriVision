"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventoryController_1 = require("../controllers/inventoryController");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const router = (0, express_1.Router)();
// Public marketplace route (no auth required for browsing)
router.get('/', inventoryController_1.getInventory);
// Protected routes - MUST be defined BEFORE /:id to avoid route collision
router.use(auth_1.protect, tenant_1.tenantIsolation);
router.get('/my/listings', inventoryController_1.getMyInventory);
router.get('/:id/details', inventoryController_1.getInventoryWithOrders);
router.post('/', inventoryController_1.createInventory);
router.put('/:id', inventoryController_1.updateInventory);
router.delete('/:id', inventoryController_1.deleteInventory);
// Public route - defined LAST to avoid matching /my/listings or /:id/details
router.get('/:id', inventoryController_1.getInventoryById);
exports.default = router;
//# sourceMappingURL=inventory.js.map