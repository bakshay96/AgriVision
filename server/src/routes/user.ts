import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getSelectedCrops,
  addSelectedCrop,
  removeSelectedCrop,
  updateSelectedCrops,
  getUserNotifications,
  markAllUserNotificationsRead,
  markUserNotificationRead
} from '../controllers/userController';
import { protect } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(protect);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Selected crops routes
router.get('/crops', getSelectedCrops);
router.post('/crops', addSelectedCrop);
router.put('/crops', updateSelectedCrops);
router.delete('/crops/:cropName', removeSelectedCrop);

// Notification routes
router.get('/notifications', getUserNotifications);
router.put('/notifications/read', markAllUserNotificationsRead);
router.put('/notifications/:id/read', markUserNotificationRead);

export default router;
