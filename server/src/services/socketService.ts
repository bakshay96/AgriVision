import { Server as HTTPServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';

let io: SocketServer | null = null;

// Room naming convention: `tenant:{tenantId}` and `user:{userId}`
export const initSocketService = (httpServer: HTTPServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join tenant room for broadcast isolation
    socket.on('join_tenant', (tenantId: string) => {
      socket.join(`tenant:${tenantId}`);
      console.log(`[Socket.io] Socket ${socket.id} joined tenant:${tenantId}`);
    });

    // Join personal user room
    socket.on('join_user', (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`[Socket.io] Socket ${socket.id} joined user:${userId}`);
    });

    // Leave rooms on disconnect
    socket.on('disconnect', (reason: string) => {
      console.log(`[Socket.io] Client disconnected: ${socket.id} — ${reason}`);
    });

    // Acknowledge connection
    socket.emit('connected', { message: 'AgriVision socket connected', socketId: socket.id });
  });

  return io;
};

export const getIO = (): SocketServer => {
  if (!io) throw new Error('Socket.io not initialized. Call initSocketService first.');
  return io;
};

// ─────────────────────────────────────────────────────────────────────────────
// Emit helper functions
// ─────────────────────────────────────────────────────────────────────────────

/** Notify a specific farmer about a new order (emits to user room) */
export const emitNewOrder = (farmerId: string, orderData: Record<string, unknown>): void => {
  // Emit to farmer's personal room
  getIO().to(`user:${farmerId}`).emit('new_order', {
    type: 'NEW_ORDER',
    payload: orderData,
    timestamp: new Date().toISOString(),
  });
  console.log(`[Socket] Emitted new_order to farmer user:${farmerId}`, orderData);
};

/** Notify both farmer and buyer about order status change */
export const emitOrderStatusUpdate = (
  recipientId: string,
  orderData: Record<string, unknown>
): void => {
  getIO().to(`user:${recipientId}`).emit('order_status_update', {
    type: 'ORDER_STATUS_UPDATE',
    payload: orderData,
    timestamp: new Date().toISOString(),
  });
  console.log(`[Socket] Emitted order_status_update to user:${recipientId}`, orderData);
};

/** Notify both parties about order confirmation */
export const emitOrderConfirmation = (
  farmerId: string,
  buyerId: string,
  orderData: Record<string, unknown>
): void => {
  const payload = {
    type: 'ORDER_CONFIRMATION',
    payload: orderData,
    timestamp: new Date().toISOString(),
  };
  getIO().to(`user:${farmerId}`).emit('order_status_update', payload);
  getIO().to(`user:${buyerId}`).emit('order_status_update', payload);
  console.log(`[Socket] Emitted order confirmation to farmer:${farmerId} and buyer:${buyerId}`);
};

/** Broadcast an AI analysis result to the farmer */
export const emitAIAnalysisComplete = (
  userId: string,
  analysisData: Record<string, unknown>
): void => {
  getIO().to(`user:${userId}`).emit('ai_analysis_complete', {
    type: 'AI_ANALYSIS_COMPLETE',
    payload: analysisData,
    timestamp: new Date().toISOString(),
  });
};

/** Broadcast a crop health alert to a tenant */
export const emitCropAlert = (
  tenantId: string,
  alertData: Record<string, unknown>
): void => {
  getIO().to(`tenant:${tenantId}`).emit('crop_alert', {
    type: 'CROP_ALERT',
    payload: alertData,
    timestamp: new Date().toISOString(),
  });
};

/** Notify a specific user of a new chat message */
export const emitNewMessage = (
  userId: string,
  messageData: Record<string, unknown>
): void => {
  getIO().to(`user:${userId}`).emit('new_message', {
    type: 'NEW_MESSAGE',
    payload: messageData,
    timestamp: new Date().toISOString(),
  });
};
