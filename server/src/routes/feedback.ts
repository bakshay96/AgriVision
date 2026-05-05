import { Router } from 'express';
import { createFeedback, getFeedbacks } from '../controllers/feedbackController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/', protect, createFeedback);
router.get('/', protect, getFeedbacks);

export default router;
