const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0.01 },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true }
}, { timestamps: true });
schema.index({ userId: 1, category: 1, month: 1, year: 1 }, { unique: true });
module.exports = mongoose.model('Budget', schema);
