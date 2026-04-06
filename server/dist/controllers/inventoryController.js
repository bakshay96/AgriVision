"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInventoryWithOrders = exports.deleteInventory = exports.updateInventory = exports.createInventory = exports.getInventoryById = exports.getMyInventory = exports.getInventory = void 0;
const Inventory_1 = __importDefault(require("../models/Inventory"));
const errorHandler_1 = require("../middleware/errorHandler");
const s3Service_1 = require("../services/s3Service");
// Helper to process image URLs in messages to presigned URLs
const processMessageUrls = async (message) => {
    const urlPattern = /\[(Image|Video|File):\s*([^\]\s]+)(?::([^\]]+))?\]/g;
    const matches = [...message.matchAll(urlPattern)];
    if (matches.length === 0)
        return message;
    let processedMessage = message;
    for (const match of matches) {
        const [fullMatch, type, url, name] = match;
        try {
            const presignedUrl = await (0, s3Service_1.getViewUrl)(url);
            if (type === 'File' && name) {
                processedMessage = processedMessage.replace(fullMatch, `[File: ${presignedUrl}:${name}]`);
            }
            else {
                processedMessage = processedMessage.replace(fullMatch, `[${type}: ${presignedUrl}]`);
            }
        }
        catch (error) {
            console.error('[InventoryController] Error processing URL:', error);
        }
    }
    return processedMessage;
};
// GET /api/inventory  (Public — for marketplace)
const getInventory = async (req, res) => {
    const { search, cropName, status, minPrice, maxPrice, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const filter = { isActive: true, status: { $ne: 'out_of_stock' } };
    if (search) {
        filter.$text = { $search: search };
    }
    if (cropName)
        filter.cropName = { $regex: cropName, $options: 'i' };
    if (status)
        filter.status = status;
    if (minPrice || maxPrice) {
        filter.pricePerUnit = {
            ...(minPrice ? { $gte: Number(minPrice) } : {}),
            ...(maxPrice ? { $lte: Number(maxPrice) } : {}),
        };
    }
    const skip = (Number(page) - 1) * Number(limit);
    const sortKey = sort.startsWith('-') ? sort.slice(1) : sort;
    const sortDir = sort.startsWith('-') ? -1 : 1;
    const sortOrder = { [sortKey]: sortDir };
    const [itemsDocs, total] = await Promise.all([
        Inventory_1.default.find(filter)
            .populate('farmerId', 'name farmName farmLocation')
            .sort(sortOrder)
            .skip(skip)
            .limit(Number(limit)),
        Inventory_1.default.countDocuments(filter),
    ]);
    // Generate signed URLs for each image
    const items = await Promise.all(itemsDocs.map(async (doc) => {
        const item = doc.toObject();
        if (item.images && item.images.length > 0) {
            item.images = await Promise.all(item.images.map(async (url) => {
                if (!url || !url.includes('amazonaws.com'))
                    return url;
                try {
                    const key = (0, s3Service_1.extractKeyFromUrl)(url);
                    return key ? await (0, s3Service_1.getPresignedUrl)(key, 3600) : url;
                }
                catch (err) {
                    console.warn(`[InventoryController] ⚠️ Failed to sign URL: ${url}`, err);
                    return url;
                }
            }));
        }
        return item;
    }));
    res.status(200).json({
        success: true,
        data: { items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
};
exports.getInventory = getInventory;
// GET /api/inventory/my  (Farmer's own inventory)
const getMyInventory = async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = { farmerId: req.user._id, tenantId: req.tenantId, isActive: true };
    const [itemsDocs, total] = await Promise.all([
        Inventory_1.default.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
        Inventory_1.default.countDocuments(filter),
    ]);
    // Generate signed URLs for each image
    const items = await Promise.all(itemsDocs.map(async (doc) => {
        const item = doc.toObject();
        if (item.images && item.images.length > 0) {
            item.images = await Promise.all(item.images.map(async (url) => {
                if (!url || !url.includes('amazonaws.com'))
                    return url;
                try {
                    const key = (0, s3Service_1.extractKeyFromUrl)(url);
                    return key ? await (0, s3Service_1.getPresignedUrl)(key, 3600) : url;
                }
                catch (err) {
                    console.warn(`[InventoryController] ⚠️ Failed to sign URL: ${url}`, err);
                    return url;
                }
            }));
        }
        return item;
    }));
    console.log('[InventoryController] getMyInventory - Returning', items.length, 'items');
    res.status(200).json({
        success: true,
        data: { items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
};
exports.getMyInventory = getMyInventory;
// GET /api/inventory/:id
const getInventoryById = async (req, res) => {
    const item = await Inventory_1.default.findOne({ _id: req.params.id, isActive: true }).populate('farmerId', 'name farmName farmLocation phoneNumber');
    if (!item)
        throw (0, errorHandler_1.createError)('Inventory item not found', 404);
    res.status(200).json({ success: true, data: { item } });
};
exports.getInventoryById = getInventoryById;
// POST /api/inventory  (Farmer creates listing)
const createInventory = async (req, res) => {
    console.log('[InventoryController] Creating inventory with data:', {
        cropName: req.body.cropName,
        imagesCount: req.body.images?.length || 0,
        images: req.body.images,
    });
    const item = await Inventory_1.default.create({
        ...req.body,
        tenantId: req.tenantId,
        farmerId: req.user._id,
    });
    console.log('[InventoryController] Created inventory item with ID:', item._id);
    res.status(201).json({ success: true, message: 'Inventory listing created', data: { item } });
};
exports.createInventory = createInventory;
// PUT /api/inventory/:id
const updateInventory = async (req, res) => {
    const item = await Inventory_1.default.findOne({
        _id: req.params.id,
        farmerId: req.user._id,
        tenantId: req.tenantId,
    });
    if (!item)
        throw (0, errorHandler_1.createError)('Inventory item not found or unauthorized', 404);
    Object.assign(item, req.body);
    await item.save();
    res.status(200).json({ success: true, message: 'Inventory updated', data: { item } });
};
exports.updateInventory = updateInventory;
// DELETE /api/inventory/:id (soft delete)
const deleteInventory = async (req, res) => {
    const item = await Inventory_1.default.findOne({
        _id: req.params.id,
        farmerId: req.user._id,
        tenantId: req.tenantId,
    });
    if (!item)
        throw (0, errorHandler_1.createError)('Inventory item not found or unauthorized', 404);
    // Check for active orders (pending, confirmed, processing, shipped)
    const Order = require('../models/Order').default;
    const activeOrders = await Order.find({
        'items.inventoryId': item._id,
        status: { $in: ['pending', 'confirmed', 'processing', 'shipped'] },
        isActive: true,
    }).select('_id orderNumber status buyerId');
    if (activeOrders.length > 0) {
        throw (0, errorHandler_1.createError)(`Cannot delete inventory with ${activeOrders.length} active order(s). Complete or cancel orders first.`, 400);
    }
    // Soft delete
    item.isActive = false;
    await item.save();
    res.status(200).json({ success: true, message: 'Inventory listing removed' });
};
exports.deleteInventory = deleteInventory;
// GET /api/inventory/:id/details - Get inventory with order details
const getInventoryWithOrders = async (req, res) => {
    console.log('[InventoryController] getInventoryWithOrders called for:', req.params.id);
    console.log('[InventoryController] User:', {
        userId: req.user._id.toString(),
        role: req.user.role
    });
    const doc = await Inventory_1.default.findOne({
        _id: req.params.id,
        farmerId: req.user._id,
    });
    if (!doc) {
        console.log('[InventoryController] ❌ Inventory not found or unauthorized');
        throw (0, errorHandler_1.createError)('Inventory item not found or unauthorized', 404);
    }
    const item = doc.toObject();
    console.log('[InventoryController] Found inventory:', {
        id: item._id.toString(),
        cropName: item.cropName,
        totalOrders: item.totalOrders
    });
    if (item.images && item.images.length > 0) {
        item.images = await Promise.all(item.images.map(async (url) => {
            if (!url || !url.includes('amazonaws.com'))
                return url;
            try {
                const key = (0, s3Service_1.extractKeyFromUrl)(url);
                return key ? await (0, s3Service_1.getPresignedUrl)(key, 3600) : url;
            }
            catch (err) {
                console.warn(`[InventoryController] ⚠️ Failed to sign URL: ${url}`, err);
                return url;
            }
        }));
    }
    // Get all orders for this inventory item
    const Order = require('../models/Order').default;
    const inventoryObjectId = item._id;
    console.log('[InventoryController] Searching for orders with inventoryId:', inventoryObjectId.toString());
    const orders = await Order.find({
        'items.inventoryId': inventoryObjectId,
        isActive: true,
    })
        .populate('buyerId', 'name email phoneNumber')
        .sort('-createdAt')
        .limit(50)
        .lean();
    console.log('[InventoryController] Found', orders.length, 'orders for inventory:', item._id.toString());
    // Debug: log each order's status and buyer
    if (orders.length > 0) {
        orders.forEach((o, idx) => {
            console.log(`[InventoryController] Order ${idx + 1}:`, {
                orderNumber: o.orderNumber,
                status: o.status,
                buyerId: o.buyerId?._id || o.buyerId,
                buyerName: o.buyerId?.name,
                itemCount: o.items?.length
            });
        });
    }
    // Calculate order statistics
    const stats = {
        totalOrders: orders.length,
        activeOrders: orders.filter((o) => ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status)).length,
        completedOrders: orders.filter((o) => o.status === 'delivered').length,
        cancelledOrders: orders.filter((o) => o.status === 'cancelled').length,
        totalQuantitySold: orders
            .filter((o) => o.status !== 'cancelled')
            .reduce((sum, o) => {
            const orderItem = o.items.find((i) => i.inventoryId?.toString() === item._id.toString());
            return sum + (orderItem ? orderItem.quantity : 0);
        }, 0),
    };
    console.log('[InventoryController] Order stats:', stats);
    // Process message URLs in orders
    const processedOrders = await Promise.all(orders.map(async (order) => {
        if (order.messageHistory && order.messageHistory.length > 0) {
            order.messageHistory = await Promise.all(order.messageHistory.map(async (msg) => ({
                ...msg,
                message: await processMessageUrls(msg.message),
            })));
        }
        return order;
    }));
    res.status(200).json({
        success: true,
        data: {
            inventory: item,
            orders: processedOrders,
            stats,
        },
    });
};
exports.getInventoryWithOrders = getInventoryWithOrders;
//# sourceMappingURL=inventoryController.js.map