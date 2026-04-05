import { Server as HTTPServer } from 'http';
import { Server as SocketServer } from 'socket.io';
export declare const initSocketService: (httpServer: HTTPServer) => SocketServer;
export declare const getIO: () => SocketServer;
/** Notify a specific farmer about a new order (emits to user room) */
export declare const emitNewOrder: (farmerId: string, orderData: Record<string, unknown>) => void;
/** Notify both farmer and buyer about order status change */
export declare const emitOrderStatusUpdate: (recipientId: string, orderData: Record<string, unknown>) => void;
/** Notify both parties about order confirmation */
export declare const emitOrderConfirmation: (farmerId: string, buyerId: string, orderData: Record<string, unknown>) => void;
/** Broadcast an AI analysis result to the farmer */
export declare const emitAIAnalysisComplete: (userId: string, analysisData: Record<string, unknown>) => void;
/** Broadcast a crop health alert to a tenant */
export declare const emitCropAlert: (tenantId: string, alertData: Record<string, unknown>) => void;
/** Notify a specific user of a new chat message */
export declare const emitNewMessage: (userId: string, messageData: Record<string, unknown>) => void;
//# sourceMappingURL=socketService.d.ts.map