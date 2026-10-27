const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'expense-analytics-jwt-secret-key-2026';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

exports.sign = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
exports.verify = (t) => jwt.verify(t, JWT_SECRET);
