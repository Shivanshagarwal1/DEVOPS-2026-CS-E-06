const S_CURRENCIES = [['₹', '₹ Indian Rupee (INR)'], ['$', '$ US Dollar (USD)'], ['€', '€ Euro (EUR)'], ['£', '£ British Pound (GBP)'], ['¥', '¥ Japanese Yen (JPY)']];
const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];

initPage('settings', async (user) => {
  const view = document.getElementById('view');
  const get = (k, d) => localStorage.getItem(k) || d;

  view.innerHTML =
    '<div class="card pad" style="max-width:620px">' +
      '<div class="section-head"><h2>Preferences</h2></div>' +
      '<form id="sForm">' +
        '<div class="form-grid">' +
          '<div class="field"><label>Currency</label><select name="currency">' + selectOptions(S_CURRENCIES, user.currency) + '</select></div>' +
          '<div class="field"><label>Date format</label><select name="dateFormat">' + selectOptions(DATE_FORMATS, get('dateFormat', 'DD/MM/YYYY')) + '</select></div>' +
        '</div>' +
        '<div class="form-grid">' +
          '<div class="field"><label>Default dashboard period</label><select name="period">' + selectOptions(PERIODS.filter(p => p[0] !== 'custom'), get('period', 'month')) + '</select></div>' +
          '<div class="field"><label>Theme</label><select name="theme" id="themeSel">' + selectOptions([['light', 'Light'], ['dark', 'Dark']], get('theme', 'light')) + '</select></div>' +
        '</div>' +
        '<div class="err-text" id="sErr"></div>' +
        '<button class="btn primary" type="submit">Save settings</button>' +
      '</form>' +
    '</div>';

  // live theme preview
  document.getElementById('themeSel').onchange = (e) => document.documentElement.setAttribute('data-theme', e.target.value);

  document.getElementById('sForm').onsubmit = async (e) => {
    e.preventDefault();
    const data = {}; new FormData(e.target).forEach((v, k) => data[k] = v);
    const err = document.getElementById('sErr'); err.textContent = '';
    localStorage.setItem('dateFormat', data.dateFormat);
    localStorage.setItem('period', data.period);
    localStorage.setItem('theme', data.theme);
    applyTheme();
    try {
      const { user: updated } = await api('/auth/me', { method: 'PUT', body: { currency: data.currency } });
      localStorage.setItem('currency', updated.currency);
      toast('Settings saved');
    } catch (ex) { err.textContent = ex.message; toast(ex.message, 'error'); }
  };
});
