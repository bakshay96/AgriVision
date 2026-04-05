"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBudget = exports.getBudgets = exports.deleteFinancialRecord = exports.updateFinancialRecord = exports.createFinancialRecord = exports.getFinancialRecords = exports.getFinancialSummary = void 0;
const FinancialRecord_1 = require("../models/FinancialRecord");
const errorHandler_1 = require("../middleware/errorHandler");
// Get financial dashboard summary
const getFinancialSummary = async (req, res) => {
    const tenantId = req.tenantId;
    const farmerId = req.user._id;
    const { year = new Date().getFullYear() } = req.query;
    const startOfYear = new Date(Number(year), 0, 1);
    const endOfYear = new Date(Number(year), 11, 31);
    const [incomeAgg, expenseAgg, monthlyData] = await Promise.all([
        // Total income
        FinancialRecord_1.FinancialRecord.aggregate([
            {
                $match: {
                    tenantId,
                    farmerId,
                    type: 'income',
                    date: { $gte: startOfYear, $lte: endOfYear },
                },
            },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        // Total expenses
        FinancialRecord_1.FinancialRecord.aggregate([
            {
                $match: {
                    tenantId,
                    farmerId,
                    type: 'expense',
                    date: { $gte: startOfYear, $lte: endOfYear },
                },
            },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        // Monthly breakdown
        FinancialRecord_1.FinancialRecord.aggregate([
            {
                $match: {
                    tenantId,
                    farmerId,
                    date: { $gte: startOfYear, $lte: endOfYear },
                },
            },
            {
                $group: {
                    _id: {
                        month: { $month: '$date' },
                        type: '$type',
                    },
                    total: { $sum: '$amount' },
                },
            },
            { $sort: { '_id.month': 1 } },
        ]),
    ]);
    const totalIncome = incomeAgg[0]?.total || 0;
    const totalExpense = expenseAgg[0]?.total || 0;
    // Format monthly data
    const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const income = monthlyData.find((d) => d._id.month === month && d._id.type === 'income')?.total || 0;
        const expense = monthlyData.find((d) => d._id.month === month && d._id.type === 'expense')?.total || 0;
        return {
            month,
            monthName: new Date(2000, i, 1).toLocaleString('default', { month: 'short' }),
            income,
            expense,
            profit: income - expense,
        };
    });
    // Category breakdown
    const categoryBreakdown = await FinancialRecord_1.FinancialRecord.aggregate([
        {
            $match: {
                tenantId,
                farmerId,
                date: { $gte: startOfYear, $lte: endOfYear },
            },
        },
        {
            $group: {
                _id: { category: '$category', type: '$type' },
                total: { $sum: '$amount' },
            },
        },
        { $sort: { total: -1 } },
    ]);
    res.status(200).json({
        success: true,
        data: {
            summary: {
                totalIncome,
                totalExpense,
                netProfit: totalIncome - totalExpense,
                profitMargin: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1) : 0,
            },
            monthlyBreakdown,
            categoryBreakdown: categoryBreakdown.map((c) => ({
                category: c._id.category,
                type: c._id.type,
                amount: c.total,
            })),
        },
    });
};
exports.getFinancialSummary = getFinancialSummary;
// Get all financial records
const getFinancialRecords = async (req, res) => {
    const tenantId = req.tenantId;
    const farmerId = req.user._id;
    const { type, category, startDate, endDate, page = 1, limit = 20 } = req.query;
    const filter = { tenantId, farmerId };
    if (type)
        filter.type = type;
    if (category)
        filter.category = category;
    if (startDate || endDate) {
        filter.date = {};
        if (startDate)
            filter.date.$gte = new Date(startDate);
        if (endDate)
            filter.date.$lte = new Date(endDate);
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [records, total] = await Promise.all([
        FinancialRecord_1.FinancialRecord.find(filter)
            .populate('cropId', 'name')
            .populate('relatedOrderId', 'orderNumber')
            .sort({ date: -1 })
            .skip(skip)
            .limit(Number(limit)),
        FinancialRecord_1.FinancialRecord.countDocuments(filter),
    ]);
    res.status(200).json({
        success: true,
        data: {
            records,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / Number(limit)),
            },
        },
    });
};
exports.getFinancialRecords = getFinancialRecords;
// Create financial record
const createFinancialRecord = async (req, res) => {
    const tenantId = req.tenantId;
    const farmerId = req.user._id;
    const record = await FinancialRecord_1.FinancialRecord.create({
        ...req.body,
        tenantId,
        farmerId,
    });
    res.status(201).json({
        success: true,
        message: 'Financial record created',
        data: { record },
    });
};
exports.createFinancialRecord = createFinancialRecord;
// Update financial record
const updateFinancialRecord = async (req, res) => {
    const tenantId = req.tenantId;
    const farmerId = req.user._id;
    const { id } = req.params;
    const record = await FinancialRecord_1.FinancialRecord.findOneAndUpdate({ _id: id, tenantId, farmerId }, req.body, { new: true });
    if (!record) {
        throw (0, errorHandler_1.createError)('Financial record not found', 404);
    }
    res.status(200).json({
        success: true,
        message: 'Financial record updated',
        data: { record },
    });
};
exports.updateFinancialRecord = updateFinancialRecord;
// Delete financial record
const deleteFinancialRecord = async (req, res) => {
    const tenantId = req.tenantId;
    const farmerId = req.user._id;
    const { id } = req.params;
    const record = await FinancialRecord_1.FinancialRecord.findOneAndDelete({ _id: id, tenantId, farmerId });
    if (!record) {
        throw (0, errorHandler_1.createError)('Financial record not found', 404);
    }
    res.status(200).json({
        success: true,
        message: 'Financial record deleted',
    });
};
exports.deleteFinancialRecord = deleteFinancialRecord;
// Get budgets
const getBudgets = async (req, res) => {
    const tenantId = req.tenantId;
    const farmerId = req.user._id;
    const { year = new Date().getFullYear() } = req.query;
    const budgets = await FinancialRecord_1.Budget.find({ tenantId, farmerId, year })
        .populate('cropId', 'name')
        .sort({ category: 1 });
    res.status(200).json({
        success: true,
        data: { budgets },
    });
};
exports.getBudgets = getBudgets;
// Create budget
const createBudget = async (req, res) => {
    const tenantId = req.tenantId;
    const farmerId = req.user._id;
    const budget = await FinancialRecord_1.Budget.create({
        ...req.body,
        tenantId,
        farmerId,
    });
    res.status(201).json({
        success: true,
        message: 'Budget created',
        data: { budget },
    });
};
exports.createBudget = createBudget;
//# sourceMappingURL=financialController.js.map