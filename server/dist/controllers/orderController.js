"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markDelivered = exports.markInTransit = exports.verifyPickup = exports.updateProcurement = exports.confirmDeal = exports.getOrderStats = exports.sendMessage = exports.updateOrderStatus = exports.createOrder = exports.getOrderById = exports.getOrders = void 0;
const Order_1 = __importDefault(require("../models/Order"));
const Inventory_1 = __importDefault(require("../models/Inventory"));
const errorHandler_1 = require("../middleware/errorHandler");
const socketService_1 = require("../services/socketService");
const s3Service_1 = require("../services/s3Service");
// Helper to process image URLs in messages to presigned URLs
const processMessageUrls = async (message) => {
    // Match [Image: url], [Video: url], [File: url:name] patterns
    const urlPattern = /\[(Image|Video|File):\s*([^\]\s]+)(?::([^\]]+))?\]/g;
    const matches = [...message.matchAll(urlPattern)];
    if (matches.length === 0)
        return message;
    let processedMessage = message;
    for (const match of matches) {
        const [fullMatch, type, url, name] = match;
        try {
            // Generate presigned URL
            const presignedUrl = await (0, s3Service_1.getViewUrl)(url);
            // Replace the URL in the message
            if (type === 'File' && name) {
                processedMessage = processedMessage.replace(fullMatch, `[File: ${presignedUrl}:${name}]`);
            }
            else {
                processedMessage = processedMessage.replace(fullMatch, `[${type}: ${presignedUrl}]`);
            }
        }
        catch (error) {
            console.error('[OrderController] Error processing URL:', error);
            // Keep original URL if presigning fails
        }
    }
    return processedMessage;
};
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
    // Process message URLs to generate presigned URLs for images
    const processedOrders = await Promise.all(orders.map(async (order) => {
        if (order.messageHistory && order.messageHistory.length > 0) {
            order.messageHistory = await Promise.all(order.messageHistory.map(async (msg) => ({
                ...msg,
                message: await processMessageUrls(msg.message),
            })));
        }
        return order;
    }));
    // Log sample order if found for debugging
    if (processedOrders.length > 0) {
        console.log('[OrderController] 🔍 Sample order:', {
            orderId: processedOrders[0]._id,
            orderNumber: processedOrders[0].orderNumber,
            farmerId: processedOrders[0].farmerId?._id || processedOrders[0].farmerId,
            buyerId: processedOrders[0].buyerId?._id || processedOrders[0].buyerId,
            status: processedOrders[0].status
        });
    }
    res.status(200).json({
        success: true,
        data: { orders: processedOrders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
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
        verification: {
            requestedQuantity: enrichedItems[0]?.quantity || 0,
            quantityUnit: enrichedItems[0]?.unit || 'quintal',
        },
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
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled',
        // B2B statuses
        'negotiating', 'deal_confirmed', 'ready_for_pickup', 'picked_up', 'in_transit'];
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
            pending: ['deal_confirmed', 'confirmed', 'cancelled'],
            negotiating: ['deal_confirmed', 'cancelled'],
            deal_confirmed: ['ready_for_pickup', 'cancelled'],
            confirmed: ['processing', 'cancelled'],
            processing: [],
            shipped: [],
            ready_for_pickup: [],
            picked_up: [],
            in_transit: [],
            delivered: [],
            cancelled: []
        },
        buyer: {
            pending: ['cancelled'],
            negotiating: ['deal_confirmed', 'cancelled'],
            deal_confirmed: ['ready_for_pickup', 'cancelled'],
            ready_for_pickup: ['picked_up', 'cancelled'],
            picked_up: ['in_transit', 'cancelled'],
            in_transit: ['delivered'],
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
        throw (0, errorHandler_1.createError)(`Cannot change status from ${oldStatus} to ${status}. Allowed: ${allowedActions.join(', ') || 'none'}`, 403);
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
    const senderId = req.user._id;
    const senderName = req.user.name;
    const senderRole = req.user.role;
    console.log('[OrderController] 💬 sendMessage called:', {
        orderId: req.params.id,
        senderId: senderId.toString(),
        senderName,
        senderRole
    });
    // Find order - cross-tenant B2B orders (removed tenantId filter)
    const order = await Order_1.default.findOne({
        _id: req.params.id,
        isActive: true,
        $or: [{ farmerId: senderId }, { buyerId: senderId }]
    })
        .populate('buyerId', 'name')
        .populate('farmerId', 'name');
    if (!order)
        throw (0, errorHandler_1.createError)('Order not found or unauthorized', 404);
    const newMessage = {
        senderId,
        senderName,
        senderRole,
        message,
        timestamp: new Date()
    };
    order.messageHistory.push(newMessage);
    await order.save();
    // Determine recipient (the other party in the order)
    const isFarmer = order.farmerId._id.toString() === senderId.toString();
    const recipientId = isFarmer
        ? order.buyerId._id.toString()
        : order.farmerId._id.toString();
    const recipientName = isFarmer
        ? order.buyerId.name
        : order.farmerId.name;
    const messageData = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        message: newMessage.message,
        senderId: senderId.toString(),
        senderName,
        senderRole,
        timestamp: newMessage.timestamp.toISOString(),
    };
    // Real-time broadcast to recipient
    const { emitNewMessage } = require('../services/socketService');
    emitNewMessage(recipientId, messageData);
    // Also emit to sender for confirmation (so all open tabs sync)
    emitNewMessage(senderId.toString(), messageData);
    console.log('[OrderController] ✅ Message sent:', {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        from: senderName,
        to: recipientName,
        message: message.substring(0, 50) + (message.length > 50 ? '...' : '')
    });
    res.status(201).json({
        success: true,
        message: 'Message sent',
        data: {
            message: newMessage,
            orderNumber: order.orderNumber
        }
    });
};
exports.sendMessage = sendMessage;
// GET /api/orders/stats/summary
const getOrderStats = async (req, res) => {
    const userId = req.user._id;
    const role = req.user.role;
    // Build filter - cross-tenant B2B orders
    const matchFilter = { isActive: true };
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
// ─── B2B Deal Confirmation ────────────────────────────────────────────────────────────────
const confirmDeal = async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;
    const order = await Order_1.default.findOne({
        _id: id,
        isActive: true,
        $or: [{ farmerId: userId }, { buyerId: userId }]
    });
    if (!order)
        throw (0, errorHandler_1.createError)('Order not found or unauthorized', 404);
    const isFarmer = order.farmerId.toString() === userId.toString();
    if (!isFarmer && userRole !== 'BUYER') {
        throw (0, errorHandler_1.createError)('Only the buyer or farmer can confirm this deal', 403);
    }
    // Update deal confirmation status
    if (isFarmer) {
        order.dealConfirmation.farmerConfirmedAt = new Date();
        order.dealConfirmation.farmerNotes = notes;
    }
    else {
        order.dealConfirmation.buyerConfirmedAt = new Date();
        order.dealConfirmation.buyerNotes = notes;
    }
    // Determine new confirmation status
    if (order.dealConfirmation.buyerConfirmedAt && order.dealConfirmation.farmerConfirmedAt) {
        order.dealConfirmation.status = 'both_confirmed';
        order.status = 'ready_for_pickup';
    }
    else if (order.dealConfirmation.buyerConfirmedAt) {
        order.dealConfirmation.status = 'buyer_confirmed';
    }
    else if (order.dealConfirmation.farmerConfirmedAt) {
        order.dealConfirmation.status = 'farmer_confirmed';
    }
    // Add to message history
    order.messageHistory.push({
        senderId: userId,
        message: `${userRole}: Deal confirmed${notes ? ` - ${notes}` : ''}`,
        timestamp: new Date()
    });
    await order.save();
    // Emit update
    const otherPartyId = isFarmer ? order.buyerId.toString() : order.farmerId.toString();
    (0, socketService_1.emitOrderStatusUpdate)(otherPartyId, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        dealConfirmation: order.dealConfirmation,
        message: `Deal confirmed by ${userRole}`,
    });
    res.status(200).json({
        success: true,
        message: 'Deal confirmed successfully',
        data: { order }
    });
};
exports.confirmDeal = confirmDeal;
// ─── Update Procurement Details ───────────────────────────────────────────────────────────
const updateProcurement = async (req, res) => {
    const { id } = req.params;
    const { arrangedBy, transporterName, transporterContact, vehicleNumber, pickupScheduledAt } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;
    const order = await Order_1.default.findOne({
        _id: id,
        isActive: true,
        $or: [{ farmerId: userId }, { buyerId: userId }]
    });
    if (!order)
        throw (0, errorHandler_1.createError)('Order not found or unauthorized', 404);
    // Update procurement details
    if (arrangedBy)
        order.procurement.arrangedBy = arrangedBy;
    if (transporterName)
        order.procurement.transporterName = transporterName;
    if (transporterContact)
        order.procurement.transporterContact = transporterContact;
    if (vehicleNumber)
        order.procurement.vehicleNumber = vehicleNumber;
    if (pickupScheduledAt)
        order.procurement.pickupScheduledAt = new Date(pickupScheduledAt);
    // Add to message history
    order.messageHistory.push({
        senderId: userId,
        message: `${userRole}: Procurement details updated - Pickup scheduled`,
        timestamp: new Date()
    });
    await order.save();
    res.status(200).json({
        success: true,
        message: 'Procurement details updated',
        data: { order }
    });
};
exports.updateProcurement = updateProcurement;
// ─── Verify Weight/Quantity at Pickup ─────────────────────────────────────────────────────
const verifyPickup = async (req, res) => {
    const { id } = req.params;
    const { actualQuantity, qualityGrade, qualityCheckPassed, verificationNotes } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;
    const order = await Order_1.default.findOne({
        _id: id,
        isActive: true,
        $or: [{ farmerId: userId }, { buyerId: userId }]
    });
    if (!order)
        throw (0, errorHandler_1.createError)('Order not found or unauthorized', 404);
    // Only buyer can verify pickup (as they're arranging transport)
    if (userRole !== 'BUYER') {
        throw (0, errorHandler_1.createError)('Only the buyer can verify pickup details', 403);
    }
    // Update verification details
    order.verification.actualQuantity = actualQuantity;
    order.verification.qualityGrade = qualityGrade;
    order.verification.qualityCheckPassed = qualityCheckPassed;
    order.verification.verificationNotes = verificationNotes;
    order.verification.verifiedAt = new Date();
    order.verification.verifiedBy = userId;
    // Update order status
    order.status = 'picked_up';
    order.procurement.actualPickupAt = new Date();
    // Recalculate total if quantity changed
    const requestedQty = order.verification?.requestedQuantity || order.items[0]?.quantity || 0;
    if (actualQuantity && actualQuantity !== requestedQty) {
        const newTotal = actualQuantity * (order.agreedPricePerUnit || order.items[0].pricePerUnit);
        order.totalAmount = newTotal;
        order.items[0].totalPrice = newTotal;
        order.items[0].quantity = actualQuantity;
    }
    // Add to message history
    const quantityUnit = order.verification?.quantityUnit || order.items[0]?.unit || 'quintal';
    order.messageHistory.push({
        senderId: userId,
        message: `${userRole}: Pickup verified - Actual quantity: ${actualQuantity} ${quantityUnit}, Quality: ${qualityGrade}`,
        timestamp: new Date()
    });
    await order.save();
    // Notify farmer
    (0, socketService_1.emitOrderStatusUpdate)(order.farmerId.toString(), {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        message: `Pickup verified by buyer`,
    });
    res.status(200).json({
        success: true,
        message: 'Pickup verified successfully',
        data: { order }
    });
};
exports.verifyPickup = verifyPickup;
// ─── Mark In Transit ──────────────────────────────────────────────────────────────────────
const markInTransit = async (req, res) => {
    const { id } = req.params;
    const { trackingNumber, estimatedDeliveryDate } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;
    const order = await Order_1.default.findOne({
        _id: id,
        isActive: true,
        buyerId: userId
    });
    if (!order)
        throw (0, errorHandler_1.createError)('Order not found or unauthorized', 404);
    if (order.status !== 'picked_up') {
        throw (0, errorHandler_1.createError)('Order must be picked up before marking as in transit', 400);
    }
    order.status = 'in_transit';
    if (trackingNumber)
        order.trackingNumber = trackingNumber;
    if (estimatedDeliveryDate)
        order.delivery.estimatedDeliveryDate = new Date(estimatedDeliveryDate);
    order.messageHistory.push({
        senderId: userId,
        message: `${userRole}: Order marked as In Transit${trackingNumber ? ` - Tracking: ${trackingNumber}` : ''}`,
        timestamp: new Date()
    });
    await order.save();
    // Notify farmer
    (0, socketService_1.emitOrderStatusUpdate)(order.farmerId.toString(), {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        message: `Order is now in transit`,
    });
    res.status(200).json({
        success: true,
        message: 'Order marked as in transit',
        data: { order }
    });
};
exports.markInTransit = markInTransit;
// ─── Mark Delivered ───────────────────────────────────────────────────────────────────────
const markDelivered = async (req, res) => {
    const { id } = req.params;
    const { deliveryNotes } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;
    const order = await Order_1.default.findOne({
        _id: id,
        isActive: true,
        buyerId: userId
    });
    if (!order)
        throw (0, errorHandler_1.createError)('Order not found or unauthorized', 404);
    if (order.status !== 'in_transit' && order.status !== 'picked_up') {
        throw (0, errorHandler_1.createError)('Order must be in transit before marking as delivered', 400);
    }
    order.status = 'delivered';
    order.delivery.actualDeliveryDate = new Date();
    if (deliveryNotes)
        order.delivery.deliveryNotes = deliveryNotes;
    order.messageHistory.push({
        senderId: userId,
        message: `${userRole}: Order marked as Delivered${deliveryNotes ? ` - ${deliveryNotes}` : ''}`,
        timestamp: new Date()
    });
    await order.save();
    // Update inventory total orders
    for (const item of order.items) {
        const inventory = await Inventory_1.default.findById(item.inventoryId);
        if (inventory) {
            inventory.totalOrders += 1;
            await inventory.save();
        }
    }
    // Notify farmer
    (0, socketService_1.emitOrderStatusUpdate)(order.farmerId.toString(), {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        message: `Order delivered successfully`,
    });
    res.status(200).json({
        success: true,
        message: 'Order marked as delivered',
        data: { order }
    });
};
exports.markDelivered = markDelivered;
//# sourceMappingURL=orderController.js.map