"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitNegotiationUpdate = exports.emitNewMessage = exports.emitCropAlert = exports.emitAIAnalysisComplete = exports.emitOrderConfirmation = exports.emitOrderStatusUpdate = exports.emitNewOrder = exports.getIO = exports.initSocketService = void 0;
const socket_io_1 = require("socket.io");
let io = null;
// Room naming convention: `tenant:{tenantId}` and `user:{userId}`
const initSocketService = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: [
                process.env.CLIENT_URL || '',
                'http://localhost:3000',
                'http://localhost:5173',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:5173',
                "*"
            ].filter(Boolean),
            methods: ['GET', 'POST'],
            credentials: true,
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });
    io.on('connection', (socket) => {
        console.log(`[Socket.io] Client connected: ${socket.id}`);
        // Join tenant room for broadcast isolation
        socket.on('join_tenant', (tenantId) => {
            socket.join(`tenant:${tenantId}`);
            console.log(`[Socket.io] Socket ${socket.id} joined tenant:${tenantId}`);
        });
        // Join personal user room
        socket.on('join_user', (userId) => {
            socket.join(`user:${userId}`);
            console.log(`[Socket.io] Socket ${socket.id} joined user:${userId}`);
        });
        // Leave rooms on disconnect
        socket.on('disconnect', (reason) => {
            console.log(`[Socket.io] Client disconnected: ${socket.id} — ${reason}`);
        });
        // Acknowledge connection
        socket.emit('connected', { message: 'AgriVision socket connected', socketId: socket.id });
    });
    return io;
};
exports.initSocketService = initSocketService;
const getIO = () => {
    if (!io)
        throw new Error('Socket.io not initialized. Call initSocketService first.');
    return io;
};
exports.getIO = getIO;
// ─────────────────────────────────────────────────────────────────────────────
// Emit helper functions
// ─────────────────────────────────────────────────────────────────────────────
/** Notify a specific farmer about a new order (emits to user room) */
const emitNewOrder = (farmerId, orderData) => {
    // Emit to farmer's personal room
    (0, exports.getIO)().to(`user:${farmerId}`).emit('new_order', {
        type: 'NEW_ORDER',
        payload: orderData,
        timestamp: new Date().toISOString(),
    });
    console.log(`[Socket] Emitted new_order to farmer user:${farmerId}`, orderData);
};
exports.emitNewOrder = emitNewOrder;
/** Notify both farmer and buyer about order status change */
const emitOrderStatusUpdate = (recipientId, orderData) => {
    (0, exports.getIO)().to(`user:${recipientId}`).emit('order_status_update', {
        type: 'ORDER_STATUS_UPDATE',
        payload: orderData,
        timestamp: new Date().toISOString(),
    });
    console.log(`[Socket] Emitted order_status_update to user:${recipientId}`, orderData);
};
exports.emitOrderStatusUpdate = emitOrderStatusUpdate;
/** Notify both parties about order confirmation */
const emitOrderConfirmation = (farmerId, buyerId, orderData) => {
    const payload = {
        type: 'ORDER_CONFIRMATION',
        payload: orderData,
        timestamp: new Date().toISOString(),
    };
    (0, exports.getIO)().to(`user:${farmerId}`).emit('order_status_update', payload);
    (0, exports.getIO)().to(`user:${buyerId}`).emit('order_status_update', payload);
    console.log(`[Socket] Emitted order confirmation to farmer:${farmerId} and buyer:${buyerId}`);
};
exports.emitOrderConfirmation = emitOrderConfirmation;
/** Broadcast an AI analysis result to the farmer */
const emitAIAnalysisComplete = (userId, analysisData) => {
    (0, exports.getIO)().to(`user:${userId}`).emit('ai_analysis_complete', {
        type: 'AI_ANALYSIS_COMPLETE',
        payload: analysisData,
        timestamp: new Date().toISOString(),
    });
};
exports.emitAIAnalysisComplete = emitAIAnalysisComplete;
/** Broadcast a crop health alert to a tenant */
const emitCropAlert = (tenantId, alertData) => {
    (0, exports.getIO)().to(`tenant:${tenantId}`).emit('crop_alert', {
        type: 'CROP_ALERT',
        payload: alertData,
        timestamp: new Date().toISOString(),
    });
};
exports.emitCropAlert = emitCropAlert;
/** Notify a specific user of a new chat message */
const emitNewMessage = (userId, messageData) => {
    (0, exports.getIO)().to(`user:${userId}`).emit('new_message', {
        type: 'NEW_MESSAGE',
        payload: messageData,
        timestamp: new Date().toISOString(),
    });
};
exports.emitNewMessage = emitNewMessage;
/** Notify both negotiation parties about an update (new message, counter, accept, reject) */
const emitNegotiationUpdate = (buyerId, farmerId, negotiationData) => {
    const payload = {
        type: 'NEGOTIATION_UPDATE',
        payload: negotiationData,
        timestamp: new Date().toISOString(),
    };
    (0, exports.getIO)().to(`user:${buyerId}`).emit('negotiation_update', payload);
    (0, exports.getIO)().to(`user:${farmerId}`).emit('negotiation_update', payload);
    console.log(`[Socket] Emitted negotiation_update to buyer:${buyerId} and farmer:${farmerId}`);
};
exports.emitNegotiationUpdate = emitNegotiationUpdate;
//# sourceMappingURL=socketService.js.map