require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date() }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/income', require('./routes/income'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/analytics', require('./routes/analytics'));

// Serve the static vanilla-JS client
const clientDir = path.join(__dirname, '..', 'client');
app.use(express.static(clientDir));

app.use('/api', notFound);
app.get('*', (req, res) => res.status(404).sendFile(path.join(clientDir, '404.html')));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/expense_analytics';

if (require.main === module) {
  connectDB(URI)
    .then(() => app.listen(PORT, () => console.log('Server running on http://localhost:' + PORT)))
    .catch((e) => { console.error('Database connection failed:', e.message); process.exit(1); });
}
module.exports = app;
