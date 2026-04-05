import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getOrderStats,
  sendMessage,
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

export default router;
