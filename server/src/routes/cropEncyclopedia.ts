import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  getAllCrops,
  getCropById,
  searchCrops,
  getCropByName,
  getPestsAndDiseases,
  getCropAdvice,
  aiSearchCrop,
} from '../controllers/cropEncyclopediaController';

const router = Router();

// All routes require authentication
router.use(protect);

// ── Server-side AI search proxy (keeps Gemini key out of browser) ──────────────
router.post('/ai-search', aiSearchCrop);

// ── Standard CRUD ───────────────────────────────────────────────────────────────
router.get('/', getAllCrops);
router.get('/search', searchCrops);
router.get('/name/:name', getCropByName);
router.get('/:id', getCropById);
router.get('/:id/pests-diseases', getPestsAndDiseases);
router.post('/:id/advice', getCropAdvice);

export default router;
