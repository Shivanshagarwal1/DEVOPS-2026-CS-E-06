applyTheme();
if (localStorage.getItem('token')) location.replace('dashboard.html');
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target, err = document.getElementById('err'), btn = document.getElementById('submitBtn');
  err.textContent = '';
  const email = f.email.value.trim(), password = f.password.value;
  if (!email || !password) { err.textContent = 'Please enter your email and password'; return; }
  btn.disabled = true; btn.textContent = 'Signing in…';
  try {
    const { token, user } = await api('/auth/login', { method: 'POST', body: { email, password } });
    localStorage.setItem('token', token);
    localStorage.setItem('currency', user.currency || '₹');
    location.href = 'dashboard.html';
  } catch (ex) {
    err.textContent = ex.message; toast(ex.message, 'error');
    btn.disabled = false; btn.textContent = 'Sign in';
  }
});
