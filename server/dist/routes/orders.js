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
// B2B Deal Management Routes
router.post('/:id/confirm-deal', orderController_1.confirmDeal);
router.post('/:id/procurement', orderController_1.updateProcurement);
router.post('/:id/verify-pickup', orderController_1.verifyPickup);
router.post('/:id/mark-in-transit', orderController_1.markInTransit);
router.post('/:id/mark-delivered', orderController_1.markDelivered);
exports.default = router;
//# sourceMappingURL=orders.js.map