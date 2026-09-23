const jwt = require('jsonwebtoken');
exports.sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });
exports.verify = (t) => jwt.verify(t, process.env.JWT_SECRET);
