import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import {
  getAdminDashboardStats,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changeUserPassword,
  getUserActivityStats,
  broadcastNotification,
  getNotifications,
  getAllFeedback,
  deleteFeedback,
  replyToFeedback,
  getOrderAnalytics,
  getSystemHealth,
} from '../controllers/adminController';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(protect, authorize('ADMIN'));

// ─── Dashboard & Analytics ────────────────────────────────────────────────────
router.get('/stats', getAdminDashboardStats);
router.get('/health', getSystemHealth);
router.get('/activity', getUserActivityStats);

// ─── User Management ──────────────────────────────────────────────────────────
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.put('/users/:id/password', changeUserPassword);
router.delete('/users/:id', deleteUser);

// ─── Notifications ────────────────────────────────────────────────────────────
router.post('/notifications', broadcastNotification);
router.get('/notifications', getNotifications);

// ─── Feedback ─────────────────────────────────────────────────────────────────
router.get('/feedback', getAllFeedback);
router.post('/feedback/:id/reply', replyToFeedback);
router.delete('/feedback/:id', deleteFeedback);

// ─── Orders ───────────────────────────────────────────────────────────────────
router.get('/orders/analytics', getOrderAnalytics);

export default router;
