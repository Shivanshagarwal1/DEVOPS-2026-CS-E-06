const { verify } = require('../utils/token');
const User = require('../models/User');
module.exports = async function (req, res, next) {
  try {
    const h = req.headers.authorization || '';
    const t = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!t) return res.status(401).json({ message: 'Not authenticated' });
    const dec = verify(t);
    const user = await User.findById(dec.id);
    if (!user) return res.status(401).json({ message: 'User no longer exists' });
    req.userId = user._id;
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
