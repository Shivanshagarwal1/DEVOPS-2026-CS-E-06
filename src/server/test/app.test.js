const test = require('node:test');
const assert = require('node:assert');
const { sign, verify } = require('../utils/token');
const { resolvePeriod } = require('../utils/period');

test('Token utility signs and verifies tokens correctly', () => {
  const userId = '507f1f77bcf86cd799439011';
  const token = sign(userId);
  assert.ok(typeof token === 'string' && token.length > 0, 'Token must be a non-empty string');

  const decoded = verify(token);
  assert.strictEqual(decoded.id, userId, 'Decoded token ID must match input ID');
});

test('Period utility resolves monthly and yearly date ranges', () => {
  const monthPeriod = resolvePeriod('month');
  assert.ok(monthPeriod.start instanceof Date, 'Start must be a Date');
  assert.ok(monthPeriod.end instanceof Date, 'End must be a Date');
  assert.ok(monthPeriod.start <= monthPeriod.end, 'Start date must be before or equal to end date');

  const yearPeriod = resolvePeriod('year');
  assert.strictEqual(yearPeriod.start.getMonth(), 0, 'Year start must be January');
});
