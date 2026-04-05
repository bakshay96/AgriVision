import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getFinancialSummary: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getFinancialRecords: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createFinancialRecord: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateFinancialRecord: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteFinancialRecord: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getBudgets: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createBudget: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=financialController.d.ts.map