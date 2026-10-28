import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 10 }, // Ramp-up to 10 virtual users
    { duration: '20s', target: 20 }, // Stay at 20 users
    { duration: '10s', target: 0 },  // Ramp-down to 0 users
  ],
};

export default function () {
  const BASE_URL = 'http://localhost:5000';

  // 1. Health check endpoint
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  });

  // 2. Home page
  const homeRes = http.get(`${BASE_URL}/`);
  check(homeRes, {
    'home status is 200': (r) => r.status === 200,
  });

  // 3. Login POST test (good login)
  const loginPayload = JSON.stringify({
    email: 'demo@expense.app',
    password: 'demo1234',
  });
  const loginHeaders = { 'Content-Type': 'application/json' };
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, { headers: loginHeaders });
  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
  });

  // 4. Invalid Login POST test (tests 401 monitoring metric)
  const badLoginPayload = JSON.stringify({
    email: 'bad@expense.app',
    password: 'wrong',
  });
  const badLoginRes = http.post(`${BASE_URL}/api/auth/login`, badLoginPayload, { headers: loginHeaders });
  check(badLoginRes, {
    'bad login status is 401': (r) => r.status === 401,
  });

  sleep(0.5);
}
