const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

async function withSpent(budget, userId) {
  const start = new Date(budget.year, budget.month - 1, 1);
  const end = new Date(budget.year, budget.month, 0, 23, 59, 59, 999);
  const agg = await Transaction.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), type: 'expense', category: budget.category, date: { $gte: start, $lte: end } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const spent = agg[0] ? agg[0].total : 0;
  const remaining = budget.amount - spent;
  const percentage = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
  let status = 'ok';
  if (percentage >= 100) status = 'over';
  else if (percentage >= 80) status = 'warning';
  return { ...budget.toObject(), spent, remaining, percentage, status };
}

exports.list = async (req, res) => {
  const f = { userId: req.userId };
  if (req.query.month) f.month = +req.query.month;
  if (req.query.year) f.year = +req.query.year;
  const budgets = await Budget.find(f).sort('category');
  const data = await Promise.all(budgets.map(b => withSpent(b, req.userId)));
  res.json({ data });
};

exports.create = async (req, res) => {
  const { category, amount, month, year } = req.body;
  if (!category) return res.status(400).json({ message: 'Category is required' });
  if (amount == null || isNaN(amount) || +amount <= 0) return res.status(400).json({ message: 'Amount must be a positive number' });
  if (!month || month < 1 || month > 12) return res.status(400).json({ message: 'A valid month (1-12) is required' });
  if (!year) return res.status(400).json({ message: 'Year is required' });
  try {
    const b = await Budget.create({ userId: req.userId, category, amount: +amount, month: +month, year: +year });
    res.status(201).json({ data: await withSpent(b, req.userId) });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'A budget for this category/month already exists' });
    throw e;
  }
};

exports.update = async (req, res) => {
  const b = await Budget.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, req.body, { new: true, runValidators: true });
  if (!b) return res.status(404).json({ message: 'Budget not found' });
  res.json({ data: await withSpent(b, req.userId) });
};

exports.remove = async (req, res) => {
  const b = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!b) return res.status(404).json({ message: 'Budget not found' });
  res.json({ message: 'Budget deleted' });
};
