const REPORT_TYPES = [
  ['monthly-expense', 'Monthly Expense Report'],
  ['monthly-income', 'Monthly Income Report'],
  ['income-expense', 'Income vs Expense Report'],
  ['category', 'Category Report'],
  ['payment', 'Payment Method Report'],
  ['budget', 'Budget Report']
];
let reportChart = null;

initPage('reports', async (user, view) => {
  view.innerHTML =
    '<div class="card pad" style="margin-bottom:16px"><div class="row">' +
      '<label class="muted">Report</label><select id="rType">' + selectOptions(REPORT_TYPES) + '</select>' +
      '<label class="muted">Period</label><select id="period">' + selectOptions(PERIODS, '6m') + '</select>' +
      '<span id="customRange" class="row hidden"><input type="date" id="startDate"><span class="muted">to</span><input type="date" id="endDate"></span>' +
      '<button class="btn primary" id="gen">Generate</button>' +
      '<button class="btn" id="csv" disabled>⬇ Export CSV</button>' +
    '</div></div><div id="out">' + emptyState('Choose a report and click Generate', '📄') + '</div>';

  const $ = (id) => document.getElementById(id);
  let current = null;
  const period = $('period'), custom = $('customRange');
  period.onchange = () => custom.classList.toggle('hidden', period.value !== 'custom');
  $('gen').onclick = generate;
  $('csv').onclick = () => { if (current) downloadCSV(current.name + '.csv', current.headers, current.rows); };

  function params() {
    const p = { period: period.value };
    if (period.value === 'custom') { p.startDate = $('startDate').value; p.endDate = $('endDate').value; }
    return p;
  }

  async function generate() {
    const type = $('rType').value;
    const out = $('out'); out.innerHTML = spinnerCard();
    if (reportChart) { reportChart.destroy(); reportChart = null; }
    try {
      const summary = await api('/analytics/summary', { params: params() });
      const range = summary.range;
      let headers = [], rows = [], chart = null;

      if (type === 'category') {
        const d = (await api('/analytics/categories', { params: params() })).data;
        headers = ['Category', 'Total Spent', 'Transactions', '% of Total'];
        const tot = d.reduce((s, x) => s + x.total, 0) || 1;
        rows = d.map(x => [x.category, x.total, x.count, ((x.total / tot) * 100).toFixed(1) + '%']);
        chart = { type: 'doughnut', labels: d.map(x => x.category), values: d.map(x => x.total) };
      } else if (type === 'payment') {
        const txns = (await api('/transactions', { params: { startDate: range.start, endDate: range.end, type: 'expense', limit: 500 } })).data;
        const map = {};
        txns.forEach(t => { map[t.paymentMethod] = (map[t.paymentMethod] || 0) + t.amount; });
        headers = ['Payment Method', 'Total Spent', 'Transactions'];
        const counts = {};
        txns.forEach(t => counts[t.paymentMethod] = (counts[t.paymentMethod] || 0) + 1);
        rows = Object.keys(map).map(k => [k, map[k], counts[k]]);
        chart = { type: 'doughnut', labels: Object.keys(map), values: Object.values(map) };
      } else if (type === 'budget') {
        const end = new Date(range.end);
        const d = (await api('/budgets', { params: { month: end.getMonth() + 1, year: end.getFullYear() } })).data;
        headers = ['Category', 'Budget', 'Spent', 'Remaining', 'Used %', 'Status'];
        rows = d.map(b => [b.category, b.amount, b.spent, b.remaining, b.percentage + '%', b.status]);
      } else {
        const d = (await api('/analytics/monthly', { params: params() })).data;
        if (type === 'monthly-expense') { headers = ['Month', 'Expenses']; rows = d.map(m => [m.month, m.expense]); chart = { type: 'bar', labels: d.map(m => m.month), values: d.map(m => m.expense) }; }
        else if (type === 'monthly-income') { headers = ['Month', 'Income']; rows = d.map(m => [m.month, m.income]); chart = { type: 'bar', labels: d.map(m => m.month), values: d.map(m => m.income) }; }
        else { headers = ['Month', 'Income', 'Expense', 'Net']; rows = d.map(m => [m.month, m.income, m.expense, m.income - m.expense]); chart = { type: 'grouped', labels: d.map(m => m.month), income: d.map(m => m.income), expense: d.map(m => m.expense) }; }
      }

      current = { name: type, headers, rows };
      $('csv').disabled = rows.length === 0;
      const label = REPORT_TYPES.find(r => r[0] === type)[1];

      if (!rows.length) { out.innerHTML = '<div class="card pad">' + emptyState('No data for this report/period') + '</div>'; return; }

      const moneyCols = headers.map(h => /total|spent|budget|remaining|income|expense|net/i.test(h));
      out.innerHTML =
        (chart ? '<div class="card pad" style="margin-bottom:16px"><div class="section-head"><h2>' + label + '</h2></div><div class="chart-box"><canvas id="rChart"></canvas></div></div>' : '') +
        '<div class="card"><div class="section-head pad" style="padding-bottom:0"><h2>' + label + '</h2></div><div class="table-wrap"><table><thead><tr>' +
        headers.map(h => '<th>' + h + '</th>').join('') + '</tr></thead><tbody>' +
        rows.map(r => '<tr>' + r.map((c, i) => '<td>' + (moneyCols[i] && typeof c === 'number' ? fmt(c) : escapeHtml(String(c))) + '</td>').join('') + '</tr>').join('') +
        '</tbody></table></div></div>';

      if (chart) {
        const ctx = document.getElementById('rChart');
        if (chart.type === 'grouped') reportChart = new Chart(ctx, { type: 'bar', data: { labels: chart.labels, datasets: [{ label: 'Income', data: chart.income, backgroundColor: '#16a34a', borderRadius: 5 }, { label: 'Expense', data: chart.expense, backgroundColor: '#e11d48', borderRadius: 5 }] }, options: { responsive: true, maintainAspectRatio: false } });
        else if (chart.type === 'doughnut') reportChart = new Chart(ctx, { type: 'doughnut', data: { labels: chart.labels, datasets: [{ data: chart.values, backgroundColor: PALETTE, borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'right' } } } });
        else reportChart = new Chart(ctx, { type: 'bar', data: { labels: chart.labels, datasets: [{ label: label, data: chart.values, backgroundColor: '#4f46e5', borderRadius: 5 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
      }
    } catch (e) { out.innerHTML = errorState(e.message); }
  }
});

const PALETTE = ['#4f46e5', '#16a34a', '#e11d48', '#f59e0b', '#0ea5e9', '#a855f7', '#14b8a6', '#f97316', '#64748b', '#ec4899'];
function downloadCSV(filename, headers, rows) {
  const esc = v => { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const csv = [headers.join(',')].concat(rows.map(r => r.map(esc).join(','))).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  URL.revokeObjectURL(a.href);
}
