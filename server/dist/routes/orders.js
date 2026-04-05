"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const router = (0, express_1.Router)();
router.use(auth_1.protect, tenant_1.tenantIsolation);
router.get('/stats/summary', orderController_1.getOrderStats);
router.route('/').get(orderController_1.getOrders).post(orderController_1.createOrder);
router.get('/:id', orderController_1.getOrderById);
router.patch('/:id/status', orderController_1.updateOrderStatus);
router.post('/:id/messages', orderController_1.sendMessage);
exports.default = router;
//# sourceMappingURL=orders.js.map