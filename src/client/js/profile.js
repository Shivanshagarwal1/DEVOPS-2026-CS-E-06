const CURRENCIES = [['₹', '₹ Indian Rupee'], ['$', '$ US Dollar'], ['€', '€ Euro'], ['£', '£ British Pound'], ['¥', '¥ Yen']];

initPage('profile', async (user) => {
  const view = document.getElementById('view');
  function render(u) {
    view.innerHTML =
      '<div class="grid g-2">' +
        '<div class="card pad"><div class="section-head"><h2>Account</h2></div>' +
          '<div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">' +
            '<div style="width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff;display:grid;place-items:center;font-size:26px;font-weight:800">' + escapeHtml((u.name || '?')[0].toUpperCase()) + '</div>' +
            '<div><h3>' + escapeHtml(u.name) + '</h3><div class="muted">' + escapeHtml(u.email) + '</div></div>' +
          '</div>' +
          '<div class="muted" style="font-size:13px">Account currency</div><div style="font-weight:700;margin-bottom:10px">' + escapeHtml(u.currency) + '</div>' +
          '<div class="muted" style="font-size:13px">Member since</div><div style="font-weight:700">' + fmtDate(u.createdAt) + '</div>' +
        '</div>' +
        '<div class="card pad"><div class="section-head"><h2>Edit Profile</h2></div>' +
          '<form id="pForm">' +
            '<div class="field"><label>Full name</label><input name="name" value="' + escapeHtml(u.name) + '" required></div>' +
            '<div class="field"><label>Email</label><input value="' + escapeHtml(u.email) + '" disabled></div>' +
            '<div class="field"><label>Currency</label><select name="currency">' + selectOptions(CURRENCIES, u.currency) + '</select></div>' +
            '<div class="err-text" id="pErr"></div>' +
            '<div class="row"><button class="btn primary" type="submit">Save changes</button><button class="btn danger" type="button" id="logoutBtn">Logout</button></div>' +
          '</form>' +
        '</div>' +
      '</div>';

    document.getElementById('logoutBtn').onclick = logout;
    document.getElementById('pForm').onsubmit = async (e) => {
      e.preventDefault();
      const data = {}; new FormData(e.target).forEach((v, k) => data[k] = v);
      const err = document.getElementById('pErr'); err.textContent = '';
      if (!data.name.trim()) { err.textContent = 'Name cannot be empty'; return; }
      try {
        const { user: updated } = await api('/auth/me', { method: 'PUT', body: data });
        localStorage.setItem('currency', updated.currency);
        toast('Profile updated');
        render(updated);
        const nameEl = document.querySelector('.topbar .muted'); if (nameEl) nameEl.textContent = updated.name;
      } catch (ex) { err.textContent = ex.message; toast(ex.message, 'error'); }
    };
  }
  render(user);
});
