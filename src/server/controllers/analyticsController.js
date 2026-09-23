const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const { resolvePeriod } = require('../utils/period');
const oid = (id) => new mongoose.Types.ObjectId(id);
function range(req) { return resolvePeriod(req.query.period, req.query.startDate, req.query.endDate); }

exports.summary = async (req, res) => {
  const { start, end } = range(req);
  const uid = oid(req.userId);
  const match = { userId: uid, date: { $gte: start, $lte: end } };
  const agg = await Transaction.aggregate([
    { $match: match },
    { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
  ]);
  let income = 0, expense = 0, incomeCount = 0, expenseCount = 0;
  agg.forEach(a => { if (a._id === 'income') { income = a.total; incomeCount = a.count; } else { expense = a.total; expenseCount = a.count; } });
  const balance = income - expense;
  const savings = balance > 0 ? balance : 0;
  const savingsRate = income > 0 ? Math.round((balance / income) * 1000) / 10 : 0;
  const [maxE] = await Transaction.find({ userId: uid, type: 'expense', date: { $gte: start, $lte: end } }).sort('-amount').limit(1);
  const [minE] = await Transaction.find({ userId: uid, type: 'expense', date: { $gte: start, $lte: end } }).sort('amount').limit(1);
  const days = Math.max(1, Math.round((end - start) / 86400000) + 1);
  const months = Math.max(1, days / 30);
  const cats = await Transaction.aggregate([
    { $match: { userId: uid, type: 'expense', date: { $gte: start, $lte: end } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } }
  ]);
  res.json({
    totalIncome: income, totalExpense: expense, balance, savings, savingsRate,
    transactionCount: incomeCount + expenseCount, incomeCount, expenseCount,
    avgDailyExpense: Math.round((expense / days) * 100) / 100,
    avgMonthlyExpense: Math.round((expense / months) * 100) / 100,
    largestExpense: maxE ? maxE.amount : 0,
    smallestExpense: minE ? minE.amount : 0,
    incomeToExpenseRatio: expense > 0 ? Math.round((income / expense) * 100) / 100 : 0,
    topCategory: cats[0] ? { name: cats[0]._id, total: cats[0].total } : null,
    lowestCategory: cats.length ? { name: cats[cats.length - 1]._id, total: cats[cats.length - 1].total } : null,
    range: { start, end }
  });
};

exports.categories = async (req, res) => {
  const { start, end } = range(req);
  const data = await Transaction.aggregate([
    { $match: { userId: oid(req.userId), type: 'expense', date: { $gte: start, $lte: end } } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } }
  ]);
  res.json({ data: data.map(d => ({ category: d._id, total: d.total, count: d.count })) });
};

exports.monthly = async (req, res) => {
  const { start, end } = range(req);
  const data = await Transaction.aggregate([
    { $match: { userId: oid(req.userId), date: { $gte: start, $lte: end } } },
    { $group: { _id: { y: { $year: '$date' }, m: { $month: '$date' }, t: '$type' }, total: { $sum: '$amount' } } },
    { $sort: { '_id.y': 1, '_id.m': 1 } }
  ]);
  const map = {};
  data.forEach(d => {
    const k = d._id.y + '-' + String(d._id.m).padStart(2, '0');
    map[k] = map[k] || { month: k, income: 0, expense: 0 };
    map[k][d._id.t] = d.total;
  });
  res.json({ data: Object.values(map) });
};

exports.trends = async (req, res) => {
  const { start, end } = range(req);
  const data = await Transaction.aggregate([
    { $match: { userId: oid(req.userId), type: 'expense', date: { $gte: start, $lte: end } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, total: { $sum: '$amount' } } },
    { $sort: { _id: 1 } }
  ]);
  res.json({ data: data.map(d => ({ date: d._id, total: d.total })) });
};

exports.incomeVsExpenses = (req, res) => exports.monthly(req, res);
