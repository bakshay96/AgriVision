import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  getMarketPrices,
  getPriceTrends,
  getNearbyMarkets,
  getDistrictsForState,
} from '../controllers/marketPriceController';

const router = Router();

router.use(protect);

// Get market prices with filters
router.get('/', getMarketPrices);

// Get districts + talukas (markets) for a state — called in isolation to avoid full re-render
router.get('/districts', getDistrictsForState);

// Get price trends for a crop
router.get('/trends/:cropName', getPriceTrends);

// Get nearby markets
router.get('/nearby', getNearbyMarkets);

export default router;
