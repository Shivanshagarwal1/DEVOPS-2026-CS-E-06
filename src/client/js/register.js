applyTheme();
if (localStorage.getItem('token')) location.replace('dashboard.html');
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target, err = document.getElementById('err'), btn = document.getElementById('submitBtn');
  err.textContent = '';
  const name = f.name.value.trim(), email = f.email.value.trim(), password = f.password.value;
  if (!name || !email || !password) { err.textContent = 'All fields are required'; return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.textContent = 'Please enter a valid email'; return; }
  if (password.length < 6) { err.textContent = 'Password must be at least 6 characters'; return; }
  btn.disabled = true; btn.textContent = 'Creating…';
  try {
    const { token, user } = await api('/auth/register', { method: 'POST', body: { name, email, password } });
    localStorage.setItem('token', token);
    localStorage.setItem('currency', user.currency || '₹');
    location.href = 'dashboard.html';
  } catch (ex) {
    err.textContent = ex.message; toast(ex.message, 'error');
    btn.disabled = false; btn.textContent = 'Create account';
  }
});
