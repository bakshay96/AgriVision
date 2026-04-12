import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getOrderStats,
  sendMessage,
  confirmDeal,
  updateProcurement,
  verifyPickup,
  markInTransit,
  markDelivered,
} from '../controllers/orderController';
import { protect } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant';

const router = Router();
router.use(protect, tenantIsolation);

router.get('/stats/summary', getOrderStats);
router.route('/').get(getOrders).post(createOrder);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);
router.post('/:id/messages', sendMessage);

// B2B Deal Management Routes
router.post('/:id/confirm-deal', confirmDeal);
router.post('/:id/procurement', updateProcurement);
router.post('/:id/verify-pickup', verifyPickup);
router.post('/:id/mark-in-transit', markInTransit);
router.post('/:id/mark-delivered', markDelivered);

export default router;
