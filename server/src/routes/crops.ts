import { Router } from 'express';
import multer from 'multer';
import {
  getCrops,
  getCropById,
  createCrop,
  updateCrop,
  deleteCrop,
  getCropStats,
  uploadCropImage,
} from '../controllers/cropController';
import { protect } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant';

const router = Router();
router.use(protect, tenantIsolation);

// Multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.get('/stats/summary', getCropStats);
router.route('/').get(getCrops).post(createCrop);
router.route('/:id').get(getCropById).put(updateCrop).delete(deleteCrop);
router.post('/:id/images', upload.single('image'), uploadCropImage);

export default router;
