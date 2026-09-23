const Transaction = require('../models/Transaction');

function buildFilter(req) {
  const f = { userId: req.userId };
  const q = req.query;
  if (q.type) f.type = q.type;
  if (q.category) f.category = q.category;
  if (q.paymentMethod) f.paymentMethod = q.paymentMethod;
  if (q.search) f.title = { $regex: q.search, $options: 'i' };
  if (q.startDate || q.endDate) {
    f.date = {};
    if (q.startDate) f.date.$gte = new Date(q.startDate);
    if (q.endDate) { const e = new Date(q.endDate); e.setHours(23, 59, 59, 999); f.date.$lte = e; }
  }
  if (q.minAmount || q.maxAmount) {
    f.amount = {};
    if (q.minAmount) f.amount.$gte = +q.minAmount;
    if (q.maxAmount) f.amount.$lte = +q.maxAmount;
  }
  return f;
}

function validate(b) {
  if (!b.title || !String(b.title).trim()) return 'Title is required';
  if (b.amount == null || isNaN(b.amount) || +b.amount <= 0) return 'Amount must be a positive number';
  if (!['income', 'expense'].includes(b.type)) return 'Type must be income or expense';
  if (!b.category || !String(b.category).trim()) return 'Category is required';
  if (b.paymentMethod && !['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'].includes(b.paymentMethod)) return 'Invalid payment method';
  return null;
}

exports.list = async (req, res) => {
  const f = buildFilter(req);
  const page = Math.max(1, +req.query.page || 1);
  const limit = Math.min(200, Math.max(1, +req.query.limit || 10));
  const sortField = ['date', 'amount', 'title', 'category', 'createdAt'].includes(req.query.sortBy) ? req.query.sortBy : 'date';
  const sortDir = req.query.order === 'asc' ? 1 : -1;
  const [items, total] = await Promise.all([
    Transaction.find(f).sort({ [sortField]: sortDir }).skip((page - 1) * limit).limit(limit),
    Transaction.countDocuments(f)
  ]);
  res.json({ data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
};

exports.getOne = async (req, res) => {
  const t = await Transaction.findOne({ _id: req.params.id, userId: req.userId });
  if (!t) return res.status(404).json({ message: 'Transaction not found' });
  res.json({ data: t });
};

exports.create = async (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(400).json({ message: err });
  const t = await Transaction.create({
    userId: req.userId, title: req.body.title, amount: +req.body.amount, type: req.body.type,
    category: req.body.category, date: req.body.date || Date.now(), paymentMethod: req.body.paymentMethod || 'Cash',
    description: req.body.description || '', tags: req.body.tags || []
  });
  res.status(201).json({ data: t });
};

exports.update = async (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(400).json({ message: err });
  const t = await Transaction.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, req.body, { new: true, runValidators: true });
  if (!t) return res.status(404).json({ message: 'Transaction not found' });
  res.json({ data: t });
};

exports.remove = async (req, res) => {
  const t = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!t) return res.status(404).json({ message: 'Transaction not found' });
  res.json({ message: 'Transaction deleted' });
};

// Type-scoped wrappers reused by /expenses and /income routes
exports.listExpenses = (req, res) => { req.query.type = 'expense'; return exports.list(req, res); };
exports.listIncome = (req, res) => { req.query.type = 'income'; return exports.list(req, res); };
exports.createExpense = (req, res) => { req.body.type = 'expense'; return exports.create(req, res); };
exports.createIncome = (req, res) => { req.body.type = 'income'; return exports.create(req, res); };
