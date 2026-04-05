import { Response } from 'express';
import { FinancialRecord, Budget } from '../models/FinancialRecord';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

// Get financial dashboard summary
export const getFinancialSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  const tenantId = req.tenantId!;
  const farmerId = req.user!._id;
  const { year = new Date().getFullYear() } = req.query;

  const startOfYear = new Date(Number(year), 0, 1);
  const endOfYear = new Date(Number(year), 11, 31);

  const [incomeAgg, expenseAgg, monthlyData] = await Promise.all([
    // Total income
    FinancialRecord.aggregate([
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
    FinancialRecord.aggregate([
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
    FinancialRecord.aggregate([
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
    const income = monthlyData.find(
      (d: any) => d._id.month === month && d._id.type === 'income'
    )?.total || 0;
    const expense = monthlyData.find(
      (d: any) => d._id.month === month && d._id.type === 'expense'
    )?.total || 0;
    return {
      month,
      monthName: new Date(2000, i, 1).toLocaleString('default', { month: 'short' }),
      income,
      expense,
      profit: income - expense,
    };
  });

  // Category breakdown
  const categoryBreakdown = await FinancialRecord.aggregate([
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
      categoryBreakdown: categoryBreakdown.map((c: any) => ({
        category: c._id.category,
        type: c._id.type,
        amount: c.total,
      })),
    },
  });
};

// Get all financial records
export const getFinancialRecords = async (req: AuthRequest, res: Response): Promise<void> => {
  const tenantId = req.tenantId!;
  const farmerId = req.user!._id;
  const { type, category, startDate, endDate, page = 1, limit = 20 } = req.query;

  const filter: Record<string, unknown> = { tenantId, farmerId };
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) (filter.date as any).$gte = new Date(startDate as string);
    if (endDate) (filter.date as any).$lte = new Date(endDate as string);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [records, total] = await Promise.all([
    FinancialRecord.find(filter)
      .populate('cropId', 'name')
      .populate('relatedOrderId', 'orderNumber')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit)),
    FinancialRecord.countDocuments(filter),
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

// Create financial record
export const createFinancialRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  const tenantId = req.tenantId!;
  const farmerId = req.user!._id;

  const record = await FinancialRecord.create({
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

// Update financial record
export const updateFinancialRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  const tenantId = req.tenantId!;
  const farmerId = req.user!._id;
  const { id } = req.params;

  const record = await FinancialRecord.findOneAndUpdate(
    { _id: id, tenantId, farmerId },
    req.body,
    { new: true }
  );

  if (!record) {
    throw createError('Financial record not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Financial record updated',
    data: { record },
  });
};

// Delete financial record
export const deleteFinancialRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  const tenantId = req.tenantId!;
  const farmerId = req.user!._id;
  const { id } = req.params;

  const record = await FinancialRecord.findOneAndDelete({ _id: id, tenantId, farmerId });

  if (!record) {
    throw createError('Financial record not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Financial record deleted',
  });
};

// Get budgets
export const getBudgets = async (req: AuthRequest, res: Response): Promise<void> => {
  const tenantId = req.tenantId!;
  const farmerId = req.user!._id;
  const { year = new Date().getFullYear() } = req.query;

  const budgets = await Budget.find({ tenantId, farmerId, year })
    .populate('cropId', 'name')
    .sort({ category: 1 });

  res.status(200).json({
    success: true,
    data: { budgets },
  });
};

// Create budget
export const createBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  const tenantId = req.tenantId!;
  const farmerId = req.user!._id;

  const budget = await Budget.create({
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
