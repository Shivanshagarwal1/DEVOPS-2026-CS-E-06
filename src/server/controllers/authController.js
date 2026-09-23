const User = require('../models/User');
const Category = require('../models/Category');
const { sign } = require('../utils/token');

const DEFAULT_CATEGORIES = [
  { name: 'Salary', type: 'income', icon: '💵' },
  { name: 'Freelance', type: 'income', icon: '🧾' },
  { name: 'Investments', type: 'income', icon: '📈' },
  { name: 'Food', type: 'expense', icon: '🍔' },
  { name: 'Rent', type: 'expense', icon: '🏠' },
  { name: 'Groceries', type: 'expense', icon: '🛒' },
  { name: 'Transport', type: 'expense', icon: '⛽' },
  { name: 'Utilities', type: 'expense', icon: '💡' },
  { name: 'Entertainment', type: 'expense', icon: '🎬' },
  { name: 'Shopping', type: 'expense', icon: '🛍️' },
  { name: 'Health', type: 'expense', icon: '🩺' }
];
exports.DEFAULT_CATEGORIES = DEFAULT_CATEGORIES;

function clean(u) { return { id: u._id, name: u.name, email: u.email, currency: u.currency, createdAt: u.createdAt }; }
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Please provide a valid email' });
  if (String(password).length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ message: 'Email already registered' });
  const user = await User.create({ name, email, password });
  await Category.insertMany(DEFAULT_CATEGORIES.map(c => ({ ...c, userId: user._id }))).catch(() => {});
  res.status(201).json({ token: sign(user._id), user: clean(user) });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: 'Invalid credentials' });
  res.json({ token: sign(user._id), user: clean(user) });
};

exports.me = async (req, res) => res.json({ user: clean(req.user) });

exports.updateProfile = async (req, res) => {
  const { name, currency } = req.body;
  if (name !== undefined) { if (!name.trim()) return res.status(400).json({ message: 'Name cannot be empty' }); req.user.name = name.trim(); }
  if (currency !== undefined) req.user.currency = currency;
  await req.user.save();
  res.json({ user: clean(req.user) });
};
