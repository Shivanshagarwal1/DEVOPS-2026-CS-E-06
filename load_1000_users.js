import http from 'k6/http';
import { check, sleep } from 'k6';

// -------------------------------------------------------------------
// 1,000 Concurrent Virtual Users (VUs) Stress Test Configuration
// -------------------------------------------------------------------
export const options = {
  stages: [
    { duration: '10s', target: 200 },  // Ramp-up to 200 users
    { duration: '15s', target: 1000 }, // Ramp-up to 1,000 users
    { duration: '30s', target: 1000 }, // Peak load: hold at 1,000 users
    { duration: '15s', target: 0 },    // Ramp-down to 0 users
  ],
  thresholds: {
    // Keep tracking failures without aborting the test early
    http_req_failed: ['rate<0.5'],
  },
};

const BASE_URL = 'http://localhost:5000';

export default function () {
  // Realistic high-traffic distribution:
  // 80% fast API health/metrics queries, 15% frontend page, 5% auth
  const rand = Math.random();

  if (rand < 0.8) {
    // High-frequency health check
    const res = http.get(`${BASE_URL}/api/health`);
    check(res, { 'status is 200': (r) => r.status === 200 });
  } else if (rand < 0.95) {
    // Frontend landing page
    const res = http.get(`${BASE_URL}/`);
    check(res, { 'status is 200': (r) => r.status === 200 });
  } else {
    // Login attempt
    const payload = JSON.stringify({
      email: 'demo@expense.app',
      password: 'demo1234',
    });
    const headers = { 'Content-Type': 'application/json' };
    const res = http.post(`${BASE_URL}/api/auth/login`, payload, { headers });
    check(res, { 'status is 200': (r) => r.status === 200 });
  }

  // Pacing: 0.3s pause per user iteration to keep continuous flow
  sleep(0.3);
}
