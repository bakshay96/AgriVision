import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  getAllCrops,
  getCropById,
  searchCrops,
  getCropByName,
  getPestsAndDiseases,
  getCropAdvice,
} from '../controllers/cropEncyclopediaController';

const router = Router();

// All routes require authentication
router.use(protect);

// Get all crops
router.get('/', getAllCrops);

// Search crops
router.get('/search', searchCrops);

// Get crop by name
router.get('/name/:name', getCropByName);

// Get single crop details
router.get('/:id', getCropById);

// Get pests and diseases
router.get('/:id/pests-diseases', getPestsAndDiseases);

// Get AI advice
router.post('/:id/advice', getCropAdvice);

export default router;
