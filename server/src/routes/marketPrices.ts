import { Router } from 'express';
import { protect } from '../middleware/auth';
import { getMarketPrices, getPriceTrends, getNearbyMarkets } from '../controllers/marketPriceController';

const router = Router();

// All routes require authentication
router.use(protect);

// Get market prices with filters
router.get('/', getMarketPrices);

// Get price trends for a crop
router.get('/trends/:cropName', getPriceTrends);

// Get nearby markets
router.get('/nearby', getNearbyMarkets);

export default router;
