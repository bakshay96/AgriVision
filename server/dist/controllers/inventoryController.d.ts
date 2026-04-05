import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getInventory: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getMyInventory: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getInventoryById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createInventory: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateInventory: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteInventory: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getInventoryWithOrders: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=inventoryController.d.ts.map