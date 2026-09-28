/* Shared transaction list view used by Transactions, Expenses and Income pages */
function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
function debounce(fn, ms){ let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

async function buildTxnView(user, view, opts) {
  const { endpoint, fixedType } = opts;
  const state = { page: 1, limit: 10 };
  let categories = [];
  try { categories = (await api('/categories')).data; } catch (_) {}

  const catOptions = (type) => categories
    .filter(c => !type || c.type === type || c.type === 'both')
    .map(c => '<option value="' + escapeHtml(c.name) + '">' + escapeHtml(c.icon + ' ' + c.name) + '</option>').join('');

  view.innerHTML =
    '<div class="card pad" style="margin-bottom:16px">' +
      '<div class="row" style="justify-content:space-between">' +
        '<div class="row">' +
          '<input id="fSearch" placeholder="🔍 Search title…" style="width:190px">' +
          (fixedType ? '' : '<select id="fType"><option value="">All types</option><option value="income">Income</option><option value="expense">Expense</option></select>') +
          '<select id="fCategory"><option value="">All categories</option>' + categories.map(c => '<option>' + escapeHtml(c.name) + '</option>').join('') + '</select>' +
          '<select id="fPay"><option value="">All methods</option>' + PAYMENT_METHODS.map(p => '<option>' + p + '</option>').join('') + '</select>' +
        '</div>' +
        '<button class="btn primary" id="addBtn">+ Add ' + (fixedType ? cap(fixedType) : 'Transaction') + '</button>' +
      '</div>' +
      '<div class="row" style="margin-top:12px">' +
        '<label class="muted">From <input type="date" id="fStart"></label>' +
        '<label class="muted">To <input type="date" id="fEnd"></label>' +
        '<label class="muted">Min <input type="number" min="0" id="fMin" style="width:90px"></label>' +
        '<label class="muted">Max <input type="number" min="0" id="fMax" style="width:90px"></label>' +
        '<select id="fSort"><option value="date|desc">Newest first</option><option value="date|asc">Oldest first</option><option value="amount|desc">Amount: high→low</option><option value="amount|asc">Amount: low→high</option></select>' +
        '<button class="btn sm" id="clearBtn">Clear</button>' +
      '</div>' +
    '</div>' +
    '<div class="card"><div id="tableArea"><div class="spinner"></div></div></div>' +
    '<div class="row" id="pager" style="justify-content:space-between;margin-top:14px"></div>';

  const $ = (id) => document.getElementById(id);
  const getParams = () => {
    const [sortBy, order] = ($('fSort').value || 'date|desc').split('|');
    return {
      page: state.page, limit: state.limit, sortBy, order,
      search: $('fSearch').value.trim(),
      type: fixedType || ($('fType') ? $('fType').value : ''),
      category: $('fCategory').value, paymentMethod: $('fPay').value,
      startDate: $('fStart').value, endDate: $('fEnd').value,
      minAmount: $('fMin').value, maxAmount: $('fMax').value
    };
  };

  async function load() {
    $('tableArea').innerHTML = '<div class="spinner"></div>';
    let resp;
    try { resp = await api(endpoint, { params: getParams() }); }
    catch (e) { $('tableArea').innerHTML = errorState(e.message); return; }
    const rows = resp.data, pg = resp.pagination;
    if (!rows.length) {
      $('tableArea').innerHTML = emptyState('No ' + (fixedType || 'transaction') + 's found. Try adjusting filters or add one.');
      $('pager').innerHTML = ''; return;
    }
    $('tableArea').innerHTML =
      '<div class="table-wrap"><table><thead><tr><th>Date</th><th>Title</th><th>Category</th>' +
      (fixedType ? '' : '<th>Type</th>') + '<th>Method</th><th style="text-align:right">Amount</th><th></th></tr></thead><tbody>' +
      rows.map(t =>
        '<tr><td>' + fmtDate(t.date) + '</td><td><strong>' + escapeHtml(t.title) + '</strong>' +
        (t.description ? '<br><span class="muted" style="font-size:12px">' + escapeHtml(t.description) + '</span>' : '') + '</td>' +
        '<td>' + escapeHtml(t.category) + '</td>' +
        (fixedType ? '' : '<td><span class="badge ' + t.type + '">' + t.type + '</span></td>') +
        '<td class="muted">' + escapeHtml(t.paymentMethod) + '</td>' +
        '<td style="text-align:right" class="' + (t.type === 'income' ? 'pos' : 'neg') + '"><strong>' + (t.type === 'income' ? '+' : '−') + fmt(t.amount) + '</strong></td>' +
        '<td style="text-align:right;white-space:nowrap"><button class="icon-btn" data-edit="' + t._id + '">✏️</button><button class="icon-btn" data-del="' + t._id + '">🗑️</button></td></tr>'
      ).join('') + '</tbody></table></div>';

    $('pager').innerHTML =
      '<span class="muted">Page ' + pg.page + ' of ' + pg.pages + ' · ' + pg.total + ' records</span>' +
      '<span class="row"><button class="btn sm" id="prev"' + (pg.page <= 1 ? ' disabled' : '') + '>← Prev</button>' +
      '<button class="btn sm" id="next"' + (pg.page >= pg.pages ? ' disabled' : '') + '>Next →</button></span>';
    const prev = $('prev'), next = $('next');
    if (prev) prev.onclick = () => { state.page--; load(); };
    if (next) next.onclick = () => { state.page++; load(); };

    view.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => {
      const t = rows.find(r => r._id === b.dataset.edit); openForm(t);
    });
    view.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
      const t = rows.find(r => r._id === b.dataset.del);
      if (!(await confirmDialog('Delete "' + t.title + '"? This cannot be undone.'))) return;
      try { await api(endpoint + '/' + t._id, { method: 'DELETE' }); toast('Transaction deleted'); load(); }
      catch (e) { toast(e.message, 'error'); }
    });
  }

  function openForm(existing) {
    const t = existing || {};
    const type = fixedType || t.type || 'expense';
    const body =
      '<div class="field"><label>Title</label><input name="title" value="' + escapeHtml(t.title || '') + '" required></div>' +
      '<div class="form-grid">' +
        '<div class="field"><label>Amount</label><input name="amount" type="number" min="0.01" step="0.01" value="' + (t.amount || '') + '" required></div>' +
        '<div class="field"><label>Date</label><input name="date" type="date" value="' + inputDate(t.date) + '"></div>' +
      '</div>' +
      (fixedType ? '<input type="hidden" name="type" value="' + fixedType + '">' :
        '<div class="field"><label>Type</label><select name="type" id="mType"><option value="expense"' + (type === 'expense' ? ' selected' : '') + '>Expense</option><option value="income"' + (type === 'income' ? ' selected' : '') + '>Income</option></select></div>') +
      '<div class="form-grid">' +
        '<div class="field"><label>Category</label><select name="category" id="mCat">' + catOptions(fixedType || type) + '</select></div>' +
        '<div class="field"><label>Payment Method</label><select name="paymentMethod">' + selectOptions(PAYMENT_METHODS, t.paymentMethod || 'Cash') + '</select></div>' +
      '</div>' +
      '<div class="field"><label>Description (optional)</label><input name="description" value="' + escapeHtml(t.description || '') + '"></div>';

    openModal((existing ? 'Edit' : 'Add') + ' ' + cap(fixedType || 'transaction'), body, {
      submitText: existing ? 'Update' : 'Create',
      onSubmit: async (data, { close, setError }) => {
        data.amount = parseFloat(data.amount);
        if (!data.title.trim()) return setError('Title is required');
        if (!(data.amount > 0)) return setError('Amount must be greater than 0');
        if (!data.category) return setError('Please choose a category');
        if (existing) { await api(endpoint + '/' + existing._id, { method: 'PUT', body: data }); toast('Transaction updated'); }
        else { await api(endpoint, { method: 'POST', body: data }); toast(cap(fixedType || 'Transaction') + ' added'); }
        close(); state.page = 1; load();
      }
    });
    const mType = document.getElementById('mType');
    if (mType) mType.onchange = () => { document.getElementById('mCat').innerHTML = catOptions(mType.value); };
    if (existing) { const cat = document.getElementById('mCat'); if (cat) cat.value = t.category; }
  }

  $('addBtn').onclick = () => openForm(null);
  const reload = () => { state.page = 1; load(); };
  $('fSearch').oninput = debounce(reload, 350);
  ['fCategory', 'fPay', 'fStart', 'fEnd', 'fSort'].forEach(id => $(id).onchange = reload);
  ['fMin', 'fMax'].forEach(id => $(id).oninput = debounce(reload, 400));
  if ($('fType')) $('fType').onchange = reload;
  $('clearBtn').onclick = () => {
    ['fSearch', 'fCategory', 'fPay', 'fStart', 'fEnd', 'fMin', 'fMax'].forEach(id => $(id).value = '');
    if ($('fType')) $('fType').value = '';
    $('fSort').value = 'date|desc'; reload();
  };
  load();
}
