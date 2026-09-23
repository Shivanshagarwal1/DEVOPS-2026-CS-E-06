exports.notFound = (req, res) => res.status(404).json({ message: 'Route not found' });
exports.errorHandler = (err, req, res, next) => { // eslint-disable-line
  const code = err.statusCode || 500;
  if (code >= 500) console.error(err);
  res.status(code).json({ message: code >= 500 ? 'Server error' : err.message });
};
