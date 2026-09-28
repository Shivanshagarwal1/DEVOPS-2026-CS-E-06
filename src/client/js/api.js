// Thin fetch() wrapper around the REST API
const API_BASE = '/api';
function authToken() { return localStorage.getItem('token'); }

async function api(path, { method = 'GET', body, params } = {}) {
  let url = API_BASE + path;
  if (params) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') q.append(k, v); });
    const s = q.toString();
    if (s) url += '?' + s;
  }
  const headers = { 'Content-Type': 'application/json' };
  const t = authToken();
  if (t) headers.Authorization = 'Bearer ' + t;

  let res;
  try {
    res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch (e) {
    throw new Error('Network error — please make sure the server is running');
  }
  let data = {};
  try { data = await res.json(); } catch (_) {}

  if (res.status === 401 && !/\/auth\/(login|register)/.test(path)) {
    localStorage.removeItem('token');
    if (!location.pathname.endsWith('login.html')) location.href = 'login.html';
  }
  if (!res.ok) throw new Error(data.message || ('Request failed (' + res.status + ')'));
  return data;
}
