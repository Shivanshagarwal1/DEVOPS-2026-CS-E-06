initPage('budgets', async (user, view) => {
  const now = new Date();
  const state = { month: now.getMonth() + 1, year: now.getFullYear() };
  let categories = [];
  try { categories = (await api('/categories')).data.filter(c => c.type !== 'income'); } catch (_) {}

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  view.innerHTML =
    '<div class="card pad" style="margin-bottom:16px"><div class="row" style="justify-content:space-between">' +
      '<div class="row"><select id="mSel">' + MONTHS.map((m, i) => '<option value="' + (i + 1) + '"' + (i + 1 === state.month ? ' selected' : '') + '>' + m + '</option>').join('') + '</select>' +
      '<select id="ySel">' + years.map(y => '<option' + (y === state.year ? ' selected' : '') + '>' + y + '</option>').join('') + '</select></div>' +
      '<button class="btn primary" id="addBtn">+ Add Budget</button>' +
    '</div></div><div id="list">' + spinnerCard() + '</div>';

  const $ = (id) => document.getElementById(id);
  $('mSel').onchange = () => { state.month = +$('mSel').value; load(); };
  $('ySel').onchange = () => { state.year = +$('ySel').value; load(); };
  $('addBtn').onclick = () => openForm(null);

  async function load() {
    $('list').innerHTML = spinnerCard();
    let data;
    try { data = (await api('/budgets', { params: { month: state.month, year: state.year } })).data; }
    catch (e) { $('list').innerHTML = errorState(e.message); return; }
    if (!data.length) { $('list').innerHTML = '<div class="card pad">' + emptyState('No budgets for ' + MONTHS[state.month - 1] + ' ' + state.year + '. Create one to start tracking.', '🎯') + '</div>'; return; }

    $('list').innerHTML = '<div class="grid g-2">' + data.map(b => {
      const warn = b.status === 'over' ? '<span class="badge expense">⚠ Over budget</span>' :
        b.status === 'warning' ? '<span class="badge" style="background:rgba(245,158,11,.15);color:#b45309">⚠ 80% used</span>' :
        '<span class="badge income">On track</span>';
      return '<div class="card pad"><div class="row" style="justify-content:space-between"><h3>' + escapeHtml(b.category) + '</h3>' + warn + '</div>' +
        '<div class="row" style="justify-content:space-between;margin:10px 0 6px"><span class="muted">Spent ' + fmt(b.spent) + '</span><span class="muted">Budget ' + fmt(b.amount) + '</span></div>' +
        '<div class="progress ' + b.status + '"><i style="width:' + Math.min(100, b.percentage) + '%"></i></div>' +
        '<div class="row" style="justify-content:space-between;margin-top:8px"><strong class="' + (b.remaining < 0 ? 'neg' : 'pos') + '">' + (b.remaining < 0 ? 'Over by ' + fmt(-b.remaining) : fmt(b.remaining) + ' left') + '</strong>' +
        '<span class="muted">' + b.percentage + '%</span></div>' +
        '<div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn sm" data-edit="' + b._id + '">Edit</button><button class="btn sm danger" data-del="' + b._id + '">Delete</button></div></div>';
    }).join('') + '</div>';

    view.querySelectorAll('[data-edit]').forEach(btn => btn.onclick = () => openForm(data.find(b => b._id === btn.dataset.edit)));
    view.querySelectorAll('[data-del]').forEach(btn => btn.onclick = async () => {
      const b = data.find(x => x._id === btn.dataset.del);
      if (!(await confirmDialog('Delete the "' + b.category + '" budget?'))) return;
      try { await api('/budgets/' + b._id, { method: 'DELETE' }); toast('Budget deleted'); load(); }
      catch (e) { toast(e.message, 'error'); }
    });
  }

  function openForm(existing) {
    const b = existing || {};
    const catOpts = categories.map(c => '<option value="' + escapeHtml(c.name) + '"' + (c.name === b.category ? ' selected' : '') + '>' + escapeHtml(c.icon + ' ' + c.name) + '</option>').join('');
    const body =
      '<div class="field"><label>Category</label><select name="category" required>' + (catOpts || '<option value="">No categories</option>') + '</select></div>' +
      '<div class="field"><label>Monthly Budget Amount</label><input name="amount" type="number" min="0.01" step="0.01" value="' + (b.amount || '') + '" required></div>' +
      '<div class="form-grid">' +
        '<div class="field"><label>Month</label><select name="month">' + MONTHS.map((m, i) => '<option value="' + (i + 1) + '"' + ((b.month || state.month) === i + 1 ? ' selected' : '') + '>' + m + '</option>').join('') + '</select></div>' +
        '<div class="field"><label>Year</label><select name="year">' + years.map(y => '<option' + ((b.year || state.year) === y ? ' selected' : '') + '>' + y + '</option>').join('') + '</select></div>' +
      '</div>';
    openModal((existing ? 'Edit' : 'Add') + ' Budget', body, {
      submitText: existing ? 'Update' : 'Create',
      onSubmit: async (data, { close, setError }) => {
        data.amount = parseFloat(data.amount); data.month = +data.month; data.year = +data.year;
        if (!data.category) return setError('Please choose a category');
        if (!(data.amount > 0)) return setError('Amount must be greater than 0');
        if (existing) { await api('/budgets/' + existing._id, { method: 'PUT', body: data }); toast('Budget updated'); }
        else { await api('/budgets', { method: 'POST', body: data }); toast('Budget created'); }
        state.month = data.month; state.year = data.year;
        $('mSel').value = state.month; $('ySel').value = state.year;
        close(); load();
      }
    });
  }
  load();
});
