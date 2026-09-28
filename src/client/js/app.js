/* Shared UI shell, helpers, auth guard, toast, modal, formatting */
const NAV = [
  ['dashboard', 'Dashboard', '📊'], ['transactions', 'Transactions', '💳'],
  ['expenses', 'Expenses', '🧾'], ['income', 'Income', '💵'],
  ['analytics', 'Analytics', '📈'], ['budgets', 'Budgets', '🎯'],
  ['reports', 'Reports', '📄'], ['categories', 'Categories', '🏷️'],
  ['profile', 'Profile', '👤'], ['settings', 'Settings', '⚙️']
];
const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'];
const PERIODS = [['week', 'This Week'], ['month', 'This Month'], ['last-month', 'Last Month'],
  ['3m', 'Last 3 Months'], ['6m', 'Last 6 Months'], ['year', 'This Year'], ['custom', 'Custom Range']];

function escapeHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function fmt(n) { const c = localStorage.getItem('currency') || '₹'; return c + ' ' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 }); }
function fmtDate(d) {
  if (!d) return ''; const dt = new Date(d); if (isNaN(dt)) return '';
  const D = String(dt.getDate()).padStart(2, '0'), M = String(dt.getMonth() + 1).padStart(2, '0'), Y = dt.getFullYear();
  const f = localStorage.getItem('dateFormat') || 'DD/MM/YYYY';
  if (f === 'MM/DD/YYYY') return M + '/' + D + '/' + Y;
  if (f === 'YYYY-MM-DD') return Y + '-' + M + '-' + D;
  return D + '/' + M + '/' + Y;
}
function inputDate(d) { const dt = d ? new Date(d) : new Date(); return dt.toISOString().slice(0, 10); }
function applyTheme() { document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'light'); }
function logout() { localStorage.removeItem('token'); localStorage.removeItem('currency'); location.href = 'login.html'; }

function toast(msg, type = 'success') {
  let box = document.getElementById('toasts');
  if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.id = 'toasts'; document.body.appendChild(box); }
  const t = document.createElement('div'); t.className = 'toast ' + type; t.textContent = msg; box.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 250); }, 2800);
}

function emptyState(msg, emoji = '📭') { return '<div class="empty"><span class="emoji">' + emoji + '</span>' + escapeHtml(msg) + '</div>'; }
function errorState(msg) { return '<div class="card pad">' + emptyState(msg || 'Something went wrong', '⚠️') + '</div>'; }
function spinnerCard() { return '<div class="card pad"><div class="spinner"></div></div>'; }

async function guard() {
  if (!localStorage.getItem('token')) { location.href = 'login.html'; return null; }
  try { const { user } = await api('/auth/me'); if (user.currency) localStorage.setItem('currency', user.currency); return user; }
  catch (e) { return null; }
}

function renderShell(active, user) {
  const app = document.getElementById('app');
  app.innerHTML =
    '<aside class="sidebar" id="sidebar">' +
      '<div class="brand"><span class="logo">₹</span> Expenso</div>' +
      '<nav class="nav">' + NAV.map(n => '<a href="' + n[0] + '.html" class="' + (n[0] === active ? 'active' : '') + '"><span class="ic">' + n[2] + '</span>' + n[1] + '</a>').join('') + '</nav>' +
      '<div class="side-foot"><a href="#" id="logoutLink"><span class="ic">🚪</span> Logout</a></div>' +
    '</aside>' +
    '<div class="main">' +
      '<header class="topbar"><button class="hamburger" id="hb">☰</button>' +
        '<h1>' + (NAV.find(n => n[0] === active) || [, ''])[1] + '</h1><div class="spacer"></div>' +
        '<div class="muted" style="font-weight:600">' + escapeHtml(user.name) + '</div></header>' +
      '<main class="view" id="view"></main>' +
    '</div><div class="overlay" id="ov"></div>';
  const sb = document.getElementById('sidebar'), ov = document.getElementById('ov');
  document.getElementById('hb').onclick = () => { sb.classList.toggle('open'); ov.classList.toggle('show'); };
  ov.onclick = () => { sb.classList.remove('open'); ov.classList.remove('show'); };
  document.getElementById('logoutLink').onclick = (e) => { e.preventDefault(); logout(); };
}

async function initPage(active, build) {
  applyTheme();
  const user = await guard();
  if (!user) return;
  renderShell(active, user);
  const view = document.getElementById('view');
  try { await build(user, view); }
  catch (e) { view.innerHTML = errorState(e.message); }
}

function openModal(title, bodyHtml, { submitText = 'Save', onSubmit } = {}) {
  closeModal();
  const back = document.createElement('div'); back.className = 'modal-back'; back.id = 'modalBack';
  back.innerHTML = '<div class="modal"><form id="modalForm"><div class="m-head"><h3>' + escapeHtml(title) +
    '</h3><button type="button" class="icon-btn" id="mClose">✕</button></div><div class="m-body">' + bodyHtml +
    '<div class="err-text" id="mErr"></div></div><div class="m-foot"><button type="button" class="btn" id="mCancel">Cancel</button>' +
    '<button type="submit" class="btn primary" id="mSubmit">' + escapeHtml(submitText) + '</button></div></form></div>';
  document.body.appendChild(back);
  back.querySelector('#mClose').onclick = closeModal;
  back.querySelector('#mCancel').onclick = closeModal;
  back.onclick = (e) => { if (e.target === back) closeModal(); };
  back.querySelector('#modalForm').onsubmit = async (e) => {
    e.preventDefault();
    const data = {}; new FormData(e.target).forEach((v, k) => data[k] = v);
    const errEl = back.querySelector('#mErr'); errEl.textContent = '';
    const btn = back.querySelector('#mSubmit'); btn.disabled = true;
    try { await onSubmit(data, { close: closeModal, setError: m => errEl.textContent = m }); }
    catch (err) { errEl.textContent = err.message; }
    finally { btn.disabled = false; }
  };
  return back;
}
function closeModal() { const m = document.getElementById('modalBack'); if (m) m.remove(); }

function confirmDialog(message, { danger = true, confirmText = 'Delete' } = {}) {
  return new Promise(resolve => {
    const back = document.createElement('div'); back.className = 'modal-back';
    back.innerHTML = '<div class="modal" style="max-width:380px"><div class="m-body"><h3 style="margin-bottom:8px">Are you sure?</h3>' +
      '<p class="muted">' + escapeHtml(message) + '</p></div><div class="m-foot"><button class="btn" id="cNo">Cancel</button>' +
      '<button class="btn ' + (danger ? 'danger' : 'primary') + '" id="cYes">' + escapeHtml(confirmText) + '</button></div></div>';
    document.body.appendChild(back);
    const done = v => { back.remove(); resolve(v); };
    back.querySelector('#cNo').onclick = () => done(false);
    back.querySelector('#cYes').onclick = () => done(true);
    back.onclick = e => { if (e.target === back) done(false); };
  });
}

function selectOptions(list, selected) {
  return list.map(o => { const v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; return '<option value="' + escapeHtml(v) + '"' + (String(v) === String(selected) ? ' selected' : '') + '>' + escapeHtml(l) + '</option>'; }).join('');
}
