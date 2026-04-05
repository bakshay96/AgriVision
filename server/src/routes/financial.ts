import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  getFinancialSummary,
  getFinancialRecords,
  createFinancialRecord,
  updateFinancialRecord,
  deleteFinancialRecord,
  getBudgets,
  createBudget,
} from '../controllers/financialController';

const router = Router();

// All routes require authentication
router.use(protect);

// Financial summary
router.get('/summary', getFinancialSummary);

// Financial records
router.get('/records', getFinancialRecords);
router.post('/records', createFinancialRecord);
router.put('/records/:id', updateFinancialRecord);
router.delete('/records/:id', deleteFinancialRecord);

// Budgets
router.get('/budgets', getBudgets);
router.post('/budgets', createBudget);

export default router;
