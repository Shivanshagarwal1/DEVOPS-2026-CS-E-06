require('dotenv').config();
const connectDB = require('../config/db');
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Budget = require('../models/Budget');
const { DEFAULT_CATEGORIES } = require('../controllers/authController');

const EMAIL = 'demo@expense.app';
const PASSWORD = 'demo1234';
const rand = (min, max) => Math.round((min + Math.random() * (max - min)) / 10) * 10;
const day = (y, m, d) => new Date(y, m, d, 12, 0, 0);

// [title, category, min, max, paymentMethod, timesPerMonth]
const EXPENSES = [
  ['House Rent', 'Rent', 15000, 15000, 'Bank Transfer', 1],
  ['Groceries', 'Groceries', 1200, 3500, 'UPI', 3],
  ['Electricity Bill', 'Utilities', 700, 2200, 'UPI', 1],
  ['Fuel', 'Transport', 800, 2500, 'Card', 2],
  ['Netflix', 'Entertainment', 199, 649, 'Card', 1],
  ['Restaurant', 'Food', 350, 1800, 'Card', 2],
  ['Shopping', 'Shopping', 900, 5000, 'Card', 1],
  ['Mobile Recharge', 'Utilities', 199, 599, 'UPI', 1],
  ['Pharmacy', 'Health', 200, 1500, 'Cash', 1]
];

async function run() {
  await connectDB(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/expense_analytics');
  await User.deleteMany({ email: EMAIL });
  const user = await User.create({ name: 'Demo User', email: EMAIL, password: PASSWORD });
  const uid = user._id;
  await Promise.all([
    Transaction.deleteMany({ userId: uid }),
    Category.deleteMany({ userId: uid }),
    Budget.deleteMany({ userId: uid })
  ]);
  await Category.insertMany(DEFAULT_CATEGORIES.map(c => ({ ...c, userId: uid })));

  const now = new Date();
  const txns = [];
  for (let back = 5; back >= 0; back--) {
    const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const y = d.getFullYear(), m = d.getMonth();
    txns.push({ userId: uid, title: 'Monthly Salary', amount: 60000, type: 'income', category: 'Salary', date: day(y, m, 1), paymentMethod: 'Bank Transfer' });
    if (back % 2 === 0) txns.push({ userId: uid, title: 'Freelance Project', amount: rand(8000, 18000), type: 'income', category: 'Freelance', date: day(y, m, 12), paymentMethod: 'UPI' });
    EXPENSES.forEach(([title, cat, mn, mx, pm, times]) => {
      for (let i = 0; i < times; i++) {
        txns.push({ userId: uid, title, amount: rand(mn, mx), type: 'expense', category: cat, date: day(y, m, 2 + Math.floor(Math.random() * 25)), paymentMethod: pm });
      }
    });
  }
  await Transaction.insertMany(txns);

  const M = now.getMonth() + 1, Y = now.getFullYear();
  await Budget.insertMany([
    { userId: uid, category: 'Rent', amount: 16000, month: M, year: Y },
    { userId: uid, category: 'Groceries', amount: 9000, month: M, year: Y },
    { userId: uid, category: 'Food', amount: 5000, month: M, year: Y },
    { userId: uid, category: 'Entertainment', amount: 2000, month: M, year: Y },
    { userId: uid, category: 'Transport', amount: 6000, month: M, year: Y }
  ]);

  console.log('Seed complete. ' + txns.length + ' transactions created.');
  console.log('Login -> email: ' + EMAIL + '  password: ' + PASSWORD);
  await mongoose.connection.close();
  process.exit(0);
}
run().catch(e => { console.error('Seed failed:', e); process.exit(1); });
