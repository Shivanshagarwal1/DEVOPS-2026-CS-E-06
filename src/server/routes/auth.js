const r = require('express').Router();
const c = require('../controllers/authController');
const auth = require('../middleware/auth');
const ah = require('../utils/ah');
r.post('/register', ah(c.register));
r.post('/login', ah(c.login));
r.get('/me', auth, ah(c.me));
r.put('/me', auth, ah(c.updateProfile));
module.exports = r;
