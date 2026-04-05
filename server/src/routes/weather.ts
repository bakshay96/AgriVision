import { Router } from 'express';
import { protect } from '../middleware/auth';
import { getWeather, updateLocation, getCropRecommendations } from '../controllers/weatherController';

const router = Router();

// All routes require authentication
router.use(protect);

// Get weather data
router.get('/', getWeather);

// Update location
router.put('/location', updateLocation);

// Get crop recommendations
router.get('/recommendations', getCropRecommendations);

export default router;
