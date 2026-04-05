import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getOrders: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getOrderById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createOrder: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateOrderStatus: (req: AuthRequest, res: Response) => Promise<void>;
export declare const sendMessage: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getOrderStats: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=orderController.d.ts.map