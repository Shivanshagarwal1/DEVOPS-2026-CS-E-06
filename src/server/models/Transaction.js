const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0.01 },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true, trim: true },
  date: { type: Date, default: Date.now },
  paymentMethod: { type: String, enum: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'], default: 'Cash' },
  description: { type: String, default: '' },
  tags: { type: [String], default: [] }
}, { timestamps: true });
schema.index({ userId: 1, date: -1 });
schema.index({ userId: 1, type: 1 });
module.exports = mongoose.model('Transaction', schema);
