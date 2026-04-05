"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderStats = exports.sendMessage = exports.updateOrderStatus = exports.createOrder = exports.getOrderById = exports.getOrders = void 0;
const Order_1 = __importDefault(require("../models/Order"));
const Inventory_1 = __importDefault(require("../models/Inventory"));
const errorHandler_1 = require("../middleware/errorHandler");
const socketService_1 = require("../services/socketService");
// GET /api/orders
const getOrders = async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const tenantId = req.tenantId;
    const userId = req.user._id;
    const role = req.user.role;
    console.log('[OrderController] 🔍 getOrders called:', {
        tenantId,
        userId,
        userObjectId: userId.toString(),
        role,
        status: status || 'all'
    });
    // Build filter - orders are cross-tenant in B2B marketplace
    const filter = { isActive: true };
    if (status)
        filter.status = status;
    // Farmers see orders for their inventory; Buyers see their purchases
    if (role === 'FARMER') {
        filter.farmerId = userId;
    }
    else if (role === 'BUYER') {
        filter.buyerId = userId;
    }
    console.log('[OrderController] 🔍 Filter:', JSON.stringify(filter, null, 2));
    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
        Order_1.default.find(filter)
            .populate('buyerId', 'name email phoneNumber')
            .populate('farmerId', 'name email farmName farmLocation phoneNumber')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        Order_1.default.countDocuments(filter),
    ]);
    console.log('[OrderController] 🔍 Found orders:', total, 'for user:', userId.toString(), 'role:', role);
    // Log sample order if found for debugging
    if (orders.length > 0) {
        console.log('[OrderController] 🔍 Sample order:', {
            orderId: orders[0]._id,
            orderNumber: orders[0].orderNumber,
            farmerId: orders[0].farmerId?._id || orders[0].farmerId,
            buyerId: orders[0].buyerId?._id || orders[0].buyerId,
            status: orders[0].status
        });
    }
    res.status(200).json({
        success: true,
        data: { orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
};
exports.getOrders = getOrders;
// GET /api/orders/:id
const getOrderById = async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    // Find order - cross-tenant B2B orders (removed tenantId filter)
    const orderDoc = await Order_1.default.findOne({
        _id: req.params.id,
        isActive: true,
        $or: [{ farmerId: userId }, { buyerId: userId }]
    })
        .populate('buyerId', 'name email phoneNumber farmName farmLocation')
        .populate('farmerId', 'name email phoneNumber farmName farmLocation');
    if (!orderDoc)
        throw (0, errorHandler_1.createError)('Order not found or unauthorized', 404);
    // Convert to plain object BEFORE looping to avoid Mongoose internal property issues
    const order = orderDoc.toObject();
    const enrichedItems = [];
    for (const item of order.items) {
        const inventory = await Inventory_1.default.findById(item.inventoryId).select('cropName variety quantity unit pricePerUnit status images location certifications');
        enrichedItems.push({
            ...item,
            currentInventoryStatus: inventory ? {
                availableQuantity: inventory.quantity,
                currentStatus: inventory.status,
                isActive: inventory.isActive,
                lastUpdated: inventory.updatedAt,
            } : null,
        });
    }
    const orderWithDetails = {
        ...order,
        items: enrichedItems,
        viewerRole: userRole, // Add viewer role for frontend
        isFarmer: order.farmerId._id.toString() === userId.toString(),
        isBuyer: order.buyerId._id.toString() === userId.toString(),
    };
    console.log('[OrderController] 📦 Fetched order details:', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        viewerRole: userRole,
        isFarmer: orderWithDetails.isFarmer,
        isBuyer: orderWithDetails.isBuyer
    });
    res.status(200).json({ success: true, data: { order: orderWithDetails } });
};
exports.getOrderById = getOrderById;
// POST /api/orders  (Buyers place orders)
const createOrder = async (req, res) => {
    const { items, shippingAddress, notes, deliveryDate } = req.body;
    const buyerId = req.user._id;
    const buyerName = req.user.name;
    console.log('[OrderController] 📦 createOrder called by buyer:', {
        buyerId: buyerId.toString(),
        buyerName,
        itemsCount: items?.length || 0
    });
    if (!items?.length)
        throw (0, errorHandler_1.createError)('Order must have at least one item', 400);
    // Verify inventory availability and calculate total
    let totalAmount = 0;
    const enrichedItems = [];
    let farmerId = null;
    for (const item of items) {
        const inventory = await Inventory_1.default.findById(item.inventoryId);
        if (!inventory || !inventory.isActive) {
            throw (0, errorHandler_1.createError)(`Inventory item ${item.inventoryId} not found`, 404);
        }
        console.log('[OrderController] 📦 Processing inventory item:', {
            inventoryId: inventory._id.toString(),
            cropName: inventory.cropName,
            farmerId: inventory.farmerId.toString()
        });
        // Prevent farmers from buying their own crops
        if (inventory.farmerId.toString() === buyerId.toString()) {
            throw (0, errorHandler_1.createError)('You cannot purchase your own crops', 403);
        }
        if (inventory.quantity < item.quantity) {
            throw (0, errorHandler_1.createError)(`Insufficient stock for ${inventory.cropName}`, 400);
        }
        const lineTotal = item.quantity * inventory.pricePerUnit;
        totalAmount += lineTotal;
        enrichedItems.push({
            inventoryId: inventory._id,
            cropName: inventory.cropName,
            variety: inventory.variety,
            quantity: item.quantity,
            unit: inventory.unit,
            pricePerUnit: inventory.pricePerUnit,
            totalPrice: lineTotal,
        });
        // Store farmerId from first item (all items should be from same farmer)
        if (!farmerId) {
            farmerId = inventory.farmerId;
        }
        // Deduct inventory
        inventory.quantity -= item.quantity;
        inventory.totalOrders += 1;
        await inventory.save();
    }
    console.log('[OrderController] 📦 Order will be assigned to farmer:', farmerId?.toString());
    const order = await Order_1.default.create({
        tenantId: req.tenantId,
        buyerId,
        farmerId,
        items: enrichedItems,
        totalAmount,
        shippingAddress,
        notes,
        deliveryDate,
    });
    console.log('[OrderController] ✅ Order created:', {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        buyerId: buyerId.toString(),
        farmerId: farmerId?.toString(),
        totalAmount,
        itemCount: enrichedItems.length,
        status: order.status
    });
    // Real-time notification to farmer via Socket.io
    (0, socketService_1.emitNewOrder)(farmerId.toString(), {
        orderId: order._id,
        orderNumber: order.orderNumber,
        buyerName: buyerName,
        totalAmount: order.totalAmount,
        itemCount: enrichedItems.length,
        status: 'pending',
        message: `New order #${order.orderNumber} received from ${buyerName}`,
    });
    res.status(201).json({ success: true, message: 'Order placed successfully', data: { order } });
};
exports.createOrder = createOrder;
// PATCH /api/orders/:id/status  (Farmers and Buyers can update)
const updateOrderStatus = async (req, res) => {
    const { status, trackingNumber } = req.body;
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    const userId = req.user._id;
    const userRole = req.user.role;
    console.log('[OrderController] 🔄 updateOrderStatus called:', {
        orderId: req.params.id,
        userId: userId.toString(),
        userRole,
        newStatus: status
    });
    if (!validStatuses.includes(status)) {
        throw (0, errorHandler_1.createError)(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }
    // Find order - allow both farmer and buyer to access (cross-tenant B2B orders)
    // Note: Removed tenantId filter to allow cross-tenant order updates
    const order = await Order_1.default.findOne({
        _id: req.params.id,
        isActive: true,
        $or: [{ farmerId: userId }, { buyerId: userId }]
    });
    if (!order) {
        console.log('[OrderController] ❌ Order not found. Searched for:', {
            orderId: req.params.id,
            userId: userId.toString(),
            role: userRole
        });
        throw (0, errorHandler_1.createError)('Order not found or unauthorized', 404);
    }
    console.log('[OrderController] ✅ Found order:', {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        farmerId: order.farmerId.toString(),
        buyerId: order.buyerId.toString(),
        currentStatus: order.status
    });
    const oldStatus = order.status;
    const isFarmer = order.farmerId.toString() === userId.toString();
    const isBuyer = order.buyerId.toString() === userId.toString();
    // Verify ownership - only farmer or buyer of this order can update
    if (!isFarmer && !isBuyer) {
        throw (0, errorHandler_1.createError)('Unauthorized to update this order', 403);
    }
    const statusPermissions = {
        farmer: {
            pending: ['confirmed', 'cancelled'],
            confirmed: [],
            processing: [],
            shipped: [],
            delivered: [],
            cancelled: []
        },
        buyer: {
            pending: ['cancelled'],
            confirmed: ['processing', 'cancelled'],
            processing: ['shipped', 'cancelled'],
            shipped: ['delivered'],
            delivered: [],
            cancelled: []
        }
    };
    const roleKey = userRole.toLowerCase();
    const allowedActions = statusPermissions[roleKey][oldStatus] || [];
    if (!allowedActions.includes(status)) {
        // Provide helpful error messages based on role and current status
        if (userRole === 'FARMER' && oldStatus !== 'pending') {
            throw (0, errorHandler_1.createError)(`Farmers can only confirm or cancel pending orders. Current status: ${oldStatus}`, 403);
        }
        if (userRole === 'BUYER') {
            if (oldStatus === 'pending') {
                throw (0, errorHandler_1.createError)('Please wait for the farmer to confirm this order before making changes', 403);
            }
            if (oldStatus === 'delivered') {
                throw (0, errorHandler_1.createError)('This order has already been delivered', 400);
            }
        }
        throw (0, errorHandler_1.createError)(`Cannot change status from ${oldStatus} to ${status}. Allowed transitions: ${allowedActions.join(', ') || 'none'}`, 403);
    }
    // If cancelling order, restore inventory
    if (status === 'cancelled' && oldStatus !== 'cancelled') {
        for (const item of order.items) {
            const inventory = await Inventory_1.default.findById(item.inventoryId);
            if (inventory) {
                // Restore quantity
                inventory.quantity += item.quantity;
                // Decrement total orders
                inventory.totalOrders = Math.max(0, inventory.totalOrders - 1);
                await inventory.save();
            }
        }
    }
    order.status = status;
    if (trackingNumber)
        order.trackingNumber = trackingNumber;
    if (status !== oldStatus) {
        const rolePrefix = userRole === 'FARMER' ? 'Farmer' : 'Buyer';
        order.messageHistory.push({
            senderId: req.user._id,
            message: `${rolePrefix}: Status changed from ${oldStatus} to ${status}${trackingNumber ? ` (Tracking: ${trackingNumber})` : ''}.`,
            timestamp: new Date()
        });
    }
    await order.save();
    console.log('[OrderController] ✅ Order status updated:', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        oldStatus,
        newStatus: status,
        updatedBy: userRole,
        userId
    });
    // Emit real-time notification to BOTH farmer and buyer about status changes
    const farmerIdStr = order.farmerId.toString();
    const buyerIdStr = order.buyerId.toString();
    const statusUpdateData = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status,
        oldStatus,
        updatedBy: userRole,
        updatedByName: req.user.name,
        message: `Order #${order.orderNumber} status changed from ${oldStatus} to ${status}`,
    };
    // Notify the other party
    (0, socketService_1.emitOrderStatusUpdate)(isFarmer ? buyerIdStr : farmerIdStr, statusUpdateData);
    // Also notify the updater for confirmation
    (0, socketService_1.emitOrderStatusUpdate)(isFarmer ? farmerIdStr : buyerIdStr, statusUpdateData);
    res.status(200).json({ success: true, message: 'Order status updated', data: { order } });
};
exports.updateOrderStatus = updateOrderStatus;
// POST /api/orders/:id/messages
const sendMessage = async (req, res) => {
    const { message } = req.body;
    // Find order - cross-tenant B2B orders (removed tenantId filter)
    const order = await Order_1.default.findOne({
        _id: req.params.id,
        isActive: true,
        $or: [{ farmerId: req.user._id }, { buyerId: req.user._id }]
    });
    if (!order)
        throw (0, errorHandler_1.createError)('Order not found or unauthorized', 404);
    const newMessage = {
        senderId: req.user._id,
        message,
        timestamp: new Date()
    };
    order.messageHistory.push(newMessage);
    await order.save();
    // Determine recipient (the other party in the order)
    const recipientId = req.user._id.toString() === order.farmerId.toString()
        ? order.buyerId.toString()
        : order.farmerId.toString();
    // Real-time broadcast
    const { emitNewMessage } = require('../services/socketService');
    emitNewMessage(recipientId, {
        orderId: order._id,
        message: newMessage.message,
        senderId: newMessage.senderId,
        timestamp: newMessage.timestamp
    });
    res.status(201).json({ success: true, message: 'Message sent', data: { message: newMessage } });
};
exports.sendMessage = sendMessage;
// GET /api/orders/stats/summary
const getOrderStats = async (req, res) => {
    const tenantId = req.tenantId;
    const userId = req.user._id;
    const role = req.user.role;
    const matchFilter = { tenantId, isActive: true };
    if (role === 'FARMER')
        matchFilter.farmerId = userId;
    if (role === 'BUYER')
        matchFilter.buyerId = userId;
    const stats = await Order_1.default.aggregate([
        { $match: matchFilter },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalRevenue: { $sum: '$totalAmount' },
            },
        },
    ]);
    res.status(200).json({ success: true, data: { stats } });
};
exports.getOrderStats = getOrderStats;
//# sourceMappingURL=orderController.js.map