import http from 'k6/http';
import { check, sleep } from 'k6';

// -------------------------------------------------------------
// STAGES: Zero Load (15s) -> Rapid Surge to 35 VUs -> High Load (30s) -> Zero Load (15s)
// -------------------------------------------------------------
export const options = {
  stages: [
    { duration: '15s', target: 0 },   // 1. Zero load baseline
    { duration: '5s',  target: 35 },  // 2. Surge up to 35 concurrent users
    { duration: '30s', target: 35 },  // 3. Sustained heavy traffic
    { duration: '5s',  target: 0 },   // 4. Ramp down to zero
    { duration: '15s', target: 0 },   // 5. Cooldown baseline (verify recovery)
  ],
};

const BASE_URL = 'http://localhost:5000';

export default function () {
  // Rapid requests across endpoints
  http.get(`${BASE_URL}/api/health`);
  http.get(`${BASE_URL}/`);

  // Valid login
  http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: 'demo@expense.app', password: 'demo1234' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  // Invalid login (to test 401 monitoring in Grafana)
  http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: 'fake@expense.app', password: 'wrong' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  sleep(0.1);
}
