import { Router } from 'express';
import {
  getInventory,
  getMyInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
  getInventoryWithOrders,
} from '../controllers/inventoryController';
import { protect } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant';

const router = Router();

// Public marketplace route (no auth required for browsing)
router.get('/', getInventory);

// Protected routes - MUST be defined BEFORE /:id to avoid route collision
router.use(protect, tenantIsolation);
router.get('/my/listings', getMyInventory);
router.get('/:id/details', getInventoryWithOrders);
router.post('/', createInventory);
router.put('/:id', updateInventory);
router.delete('/:id', deleteInventory);

// Public route - defined LAST to avoid matching /my/listings or /:id/details
router.get('/:id', getInventoryById);

export default router;
