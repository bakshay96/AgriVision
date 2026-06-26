import { Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Order from '../models/Order';
import Inventory from '../models/Inventory';
import Notification from '../models/Notification';
import Feedback from '../models/Feedback';
import Negotiation from '../models/Negotiation';
import { AuthRequest } from '../middleware/auth';

// ─── Helper ──────────────────────────────────────────────────────────────────
const sendError = (res: Response, status: number, message: string, err?: unknown) => {
  console.error(`[AdminController] ❌ ${message}`, err);
  return res.status(status).json({ success: false, message, error: err instanceof Error ? err.message : undefined });
};

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
export const getAdminDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Single aggregation with $facet for efficiency
    const [result] = await User.aggregate([
      {
        $facet: {
          // Total counts by role
          usersByRole: [
            { $group: { _id: '$role', count: { $sum: 1 } } },
          ],
          // New users this month
          newThisMonth: [
            { $match: { createdAt: { $gte: startOfMonth } } },
            { $count: 'count' },
          ],
          // Monthly signups over last 6 months (by role)
          monthlySignups: [
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' },
                  role: '$role',
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
          ],
          // Active vs inactive
          activeCount: [{ $match: { isActive: true } }, { $count: 'count' }],
          inactiveCount: [{ $match: { isActive: false } }, { $count: 'count' }],
          // State distribution (top 10)
          byState: [
            { $match: { state: { $exists: true, $nin: [null, ''] } } },
            { $group: { _id: '$state', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ],
        },
      },
    ]);

    // Order aggregations
    const [orderResult] = await Order.aggregate([
      {
        $facet: {
          totalOrders: [{ $count: 'count' }],
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          totalRevenue: [
            { $match: { paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
          ],
          monthlyRevenue: [
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
              $group: {
                _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                revenue: { $sum: '$totalAmount' },
                count: { $sum: 1 },
              },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
          ],
          newOrdersThisMonth: [
            { $match: { createdAt: { $gte: startOfMonth } } },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const [inventoryResult] = await Inventory.aggregate([
      {
        $facet: {
          totalListings: [{ $match: { isActive: true } }, { $count: 'count' }],
          featuredListings: [{ $match: { isActive: true, isFeatured: true } }, { $count: 'count' }],
        },
      },
    ]);

    const feedbackCount = await Feedback.countDocuments();
    const notificationCount = await Notification.countDocuments();

    // Build user role map
    const usersByRole: Record<string, number> = {};
    (result.usersByRole || []).forEach((r: { _id: string; count: number }) => {
      usersByRole[r._id] = r.count;
    });

    res.json({
      success: true,
      data: {
        users: {
          total: Object.values(usersByRole).reduce((a: number, b: number) => a + b, 0),
          farmers: usersByRole['FARMER'] || 0,
          buyers: usersByRole['BUYER'] || 0,
          admins: usersByRole['ADMIN'] || 0,
          active: result.activeCount?.[0]?.count || 0,
          inactive: result.inactiveCount?.[0]?.count || 0,
          newThisMonth: result.newThisMonth?.[0]?.count || 0,
          byState: result.byState || [],
          monthlySignups: result.monthlySignups || [],
        },
        orders: {
          total: orderResult.totalOrders?.[0]?.count || 0,
          newThisMonth: orderResult.newOrdersThisMonth?.[0]?.count || 0,
          byStatus: orderResult.byStatus || [],
          totalRevenue: orderResult.totalRevenue?.[0]?.total || 0,
          monthlyRevenue: orderResult.monthlyRevenue || [],
        },
        inventory: {
          totalListings: inventoryResult.totalListings?.[0]?.count || 0,
          featuredListings: inventoryResult.featuredListings?.[0]?.count || 0,
        },
        platform: {
          feedbackCount,
          notificationCount,
        },
      },
    });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch dashboard stats', err);
  }
};

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (req.query.role) filter.role = (req.query.role as string).toUpperCase();
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.state) filter.state = { $regex: req.query.state as string, $options: 'i' };
    if (req.query.search) {
      const regex = { $regex: req.query.search as string, $options: 'i' };
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const sortField = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch users', err);
  }
};

// ─── GET /api/admin/users/:id ─────────────────────────────────────────────────
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const user = await User.findById(id).select('-password').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Fetch related stats
    const [orderCount, inventoryCount, notifCount] = await Promise.all([
      Order.countDocuments({ $or: [{ buyerId: id }, { farmerId: id }] }),
      Inventory.countDocuments({ farmerId: id, isActive: true }),
      Notification.countDocuments({ userId: id }),
    ]);

    res.json({ success: true, data: { ...user, stats: { orderCount, inventoryCount, notifCount } } });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch user', err);
  }
};

// ─── PUT /api/admin/users/:id ─────────────────────────────────────────────────
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const allowedFields = [
      'name', 'email', 'role', 'isActive', 'phoneNumber',
      'state', 'district', 'farmName', 'farmSizeAcres', 'preferredLanguage',
    ];
    const updateData: Record<string, unknown> = {};
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) updateData[f] = req.body[f];
    });

    if (updateData.role && !['FARMER', 'BUYER', 'ADMIN'].includes(updateData.role as string)) {
      return res.status(400).json({ success: false, message: 'Invalid role value' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, message: 'User updated successfully', data: user });
  } catch (err) {
    sendError(res, 500, 'Failed to update user', err);
  }
};

// ─── DELETE /api/admin/users/:id ──────────────────────────────────────────────
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    // Prevent self-deletion
    if (req.user?._id.toString() === id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    const hardDelete = req.query.hard === 'true';
    if (hardDelete) {
      await User.findByIdAndDelete(id);
    } else {
      // Soft delete — deactivate
      await User.findByIdAndUpdate(id, { isActive: false });
    }

    res.json({ success: true, message: hardDelete ? 'User permanently deleted' : 'User deactivated' });
  } catch (err) {
    sendError(res, 500, 'Failed to delete user', err);
  }
};

// ─── GET /api/admin/activity ──────────────────────────────────────────────────
export const getUserActivityStats = async (req: AuthRequest, res: Response) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [recentLogins, neverLoggedIn, stateActivity] = await Promise.all([
      User.find({ lastLogin: { $gte: thirtyDaysAgo } })
        .select('name email role lastLogin state isActive')
        .sort({ lastLogin: -1 })
        .limit(50)
        .lean(),
      User.countDocuments({ lastLogin: { $exists: false } }),
      User.aggregate([
        { $match: { state: { $exists: true, $ne: '' } } },
        { $group: { _id: '$state', total: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } },
        { $sort: { total: -1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: { recentLogins, neverLoggedIn, stateActivity },
    });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch activity stats', err);
  }
};

// ─── POST /api/admin/notifications ───────────────────────────────────────────
export const broadcastNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { message, type = 'SYSTEM', targetRole, userIds } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const validTypes = ['ORDER_STATUS_UPDATE', 'LOW_STOCK', 'NEW_ORDER', 'AI_ANALYSIS_COMPLETE', 'SYSTEM'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid notification type' });
    }

    let targetUsers: { _id: mongoose.Types.ObjectId; tenantId: string }[] = [];

    if (Array.isArray(userIds) && userIds.length > 0) {
      targetUsers = await User.find({ _id: { $in: userIds }, isActive: true }).select('_id tenantId');
    } else if (targetRole && ['FARMER', 'BUYER'].includes(targetRole.toUpperCase())) {
      targetUsers = await User.find({ role: targetRole.toUpperCase(), isActive: true }).select('_id tenantId');
    } else {
      // Broadcast to all active users
      targetUsers = await User.find({ isActive: true }).select('_id tenantId');
    }

    if (targetUsers.length === 0) {
      return res.status(400).json({ success: false, message: 'No target users found' });
    }

    const docs = targetUsers.map((u) => ({
      tenantId: u.tenantId,
      userId: u._id,
      type,
      message: message.trim(),
      isRead: false,
    }));

    await Notification.insertMany(docs, { ordered: false });

    res.json({
      success: true,
      message: `Notification sent to ${docs.length} user(s)`,
      data: { sentCount: docs.length },
    });
  } catch (err) {
    sendError(res, 500, 'Failed to broadcast notification', err);
  }
};

// ─── GET /api/admin/notifications ────────────────────────────────────────────
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 30);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.isRead !== undefined) filter.isRead = req.query.isRead === 'true';

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: notifications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch notifications', err);
  }
};

// ─── GET /api/admin/feedback ──────────────────────────────────────────────────
export const getAllFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.rating) filter.rating = parseInt(req.query.rating as string);

    const [feedback, total] = await Promise.all([
      Feedback.find(filter)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Feedback.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: feedback,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch feedback', err);
  }
};

// ─── DELETE /api/admin/feedback/:id ──────────────────────────────────────────
export const deleteFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid feedback ID' });
    }
    const deleted = await Feedback.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Feedback not found' });

    res.json({ success: true, message: 'Feedback deleted' });
  } catch (err) {
    sendError(res, 500, 'Failed to delete feedback', err);
  }
};

// ─── GET /api/admin/orders/analytics ─────────────────────────────────────────
export const getOrderAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [result] = await Order.aggregate([
      {
        $facet: {
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          byPaymentStatus: [{ $group: { _id: '$paymentStatus', count: { $sum: 1 } } }],
          monthlyRevenue: [
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
              $group: {
                _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                revenue: { $sum: '$totalAmount' },
                count: { $sum: 1 },
              },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
          ],
          topCrops: [
            { $unwind: '$items' },
            { $group: { _id: '$items.cropName', totalQuantity: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.totalPrice' } } },
            { $sort: { totalRevenue: -1 } },
            { $limit: 10 },
          ],
          recentOrders: [
            { $sort: { createdAt: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: 'users',
                localField: 'buyerId',
                foreignField: '_id',
                as: 'buyer',
                pipeline: [{ $project: { name: 1, email: 1 } }],
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'farmerId',
                foreignField: '_id',
                as: 'farmer',
                pipeline: [{ $project: { name: 1, email: 1 } }],
              },
            },
            { $project: { orderNumber: 1, totalAmount: 1, status: 1, paymentStatus: 1, createdAt: 1, buyer: { $arrayElemAt: ['$buyer', 0] }, farmer: { $arrayElemAt: ['$farmer', 0] } } },
          ],
        },
      },
    ]);

    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    res.json({
      success: true,
      data: {
        byStatus: result.byStatus || [],
        byPaymentStatus: result.byPaymentStatus || [],
        monthlyRevenue: result.monthlyRevenue || [],
        topCrops: result.topCrops || [],
        recentOrders: result.recentOrders || [],
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch order analytics', err);
  }
};

// ─── GET /api/admin/health ─────────────────────────────────────────────────────
export const getSystemHealth = async (req: AuthRequest, res: Response) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStateMap: Record<number, string> = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

    const [userCount, orderCount, inventoryCount, negotiationCount] = await Promise.all([
      User.estimatedDocumentCount(),
      Order.estimatedDocumentCount(),
      Inventory.estimatedDocumentCount(),
      Negotiation.estimatedDocumentCount(),
    ]);

    res.json({
      success: true,
      data: {
        status: 'healthy',
        database: {
          status: dbStateMap[dbState] || 'unknown',
          collections: { users: userCount, orders: orderCount, inventory: inventoryCount, negotiations: negotiationCount },
        },
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
      },
    });
  } catch (err) {
    sendError(res, 500, 'Health check failed', err);
  }
};
