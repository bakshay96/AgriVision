"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const financialController_1 = require("../controllers/financialController");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.protect);
// Financial summary
router.get('/summary', financialController_1.getFinancialSummary);
// Financial records
router.get('/records', financialController_1.getFinancialRecords);
router.post('/records', financialController_1.createFinancialRecord);
router.put('/records/:id', financialController_1.updateFinancialRecord);
router.delete('/records/:id', financialController_1.deleteFinancialRecord);
// Budgets
router.get('/budgets', financialController_1.getBudgets);
router.post('/budgets', financialController_1.createBudget);
exports.default = router;
//# sourceMappingURL=financial.js.map