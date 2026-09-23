const Category = require('../models/Category');

exports.list = async (req, res) => {
  const f = { userId: req.userId };
  if (req.query.type) f.type = { $in: [req.query.type, 'both'] };
  const items = await Category.find(f).sort('type name');
  res.json({ data: items });
};

exports.create = async (req, res) => {
  const { name, type, icon, description } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ message: 'Category name is required' });
  if (type && !['income', 'expense', 'both'].includes(type)) return res.status(400).json({ message: 'Invalid category type' });
  try {
    const c = await Category.create({ userId: req.userId, name: name.trim(), type: type || 'expense', icon: icon || '💰', description: description || '' });
    res.status(201).json({ data: c });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'Category already exists' });
    throw e;
  }
};

exports.update = async (req, res) => {
  const c = await Category.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, req.body, { new: true, runValidators: true });
  if (!c) return res.status(404).json({ message: 'Category not found' });
  res.json({ data: c });
};

exports.remove = async (req, res) => {
  const c = await Category.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!c) return res.status(404).json({ message: 'Category not found' });
  res.json({ message: 'Category deleted' });
};
