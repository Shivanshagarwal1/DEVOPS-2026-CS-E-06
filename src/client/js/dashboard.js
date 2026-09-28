const PALETTE = ['#4f46e5', '#16a34a', '#e11d48', '#f59e0b', '#0ea5e9', '#a855f7', '#14b8a6', '#f97316', '#64748b', '#ec4899'];

initPage('dashboard', async (user, view) => {
  view.innerHTML = spinnerCard();
  const period = localStorage.getItem('period') || 'month';
  const now = new Date();
  const [sum, prev, recent, cats, monthly, budgets] = await Promise.all([
    api('/analytics/summary', { params: { period } }),
    api('/analytics/summary', { params: { period: 'last-month' } }),
    api('/transactions', { params: { limit: 5, sortBy: 'date', order: 'desc' } }),
    api('/analytics/categories', { params: { period } }),
    api('/analytics/monthly', { params: { period: '6m' } }),
    api('/budgets', { params: { month: now.getMonth() + 1, year: now.getFullYear() } })
  ]);

  const delta = (cur, old) => {
    if (!old) return '';
    const d = Math.round(((cur - old) / old) * 100);
    return '<div class="delta ' + (d >= 0 ? 'pos' : 'neg') + '">' + (d >= 0 ? '▲ ' : '▼ ') + Math.abs(d) + '% vs last month</div>';
  };

  view.innerHTML =
    '<div class="grid g-4" style="margin-bottom:16px">' +
      statCard('Total Balance', fmt(sum.balance), 'b', '💼', (sum.balance >= 0 ? 'pos' : 'neg')) +
      statCard('Income', fmt(sum.totalIncome), 'i', '⬆️', 'pos', delta(sum.totalIncome, prev.totalIncome)) +
      statCard('Expenses', fmt(sum.totalExpense), 'e', '⬇️', 'neg', delta(sum.totalExpense, prev.totalExpense)) +
      statCard('Savings', fmt(sum.savings), 's', '🏦', 'pos', '<div class="delta muted">Rate ' + sum.savingsRate + '%</div>') +
    '</div>' +
    '<div class="grid g-2" style="margin-bottom:16px">' +
      '<div class="card pad"><div class="section-head"><h2>Spending by Category</h2></div>' + (cats.data.length ? '<div class="chart-box"><canvas id="donut"></canvas></div>' : emptyState('No expenses this period')) + '</div>' +
      '<div class="card pad"><div class="section-head"><h2>Income vs Expenses (6 months)</h2></div>' + (monthly.data.length ? '<div class="chart-box"><canvas id="bars"></canvas></div>' : emptyState('No data yet')) + '</div>' +
    '</div>' +
    '<div class="grid g-2">' +
      '<div class="card pad"><div class="section-head"><h2>Recent Transactions</h2><a class="btn sm" href="transactions.html">View all</a></div>' + recentTable(recent.data) + '</div>' +
      '<div>' +
        '<div class="card pad" style="margin-bottom:16px"><div class="section-head"><h2>Budget Overview</h2><a class="btn sm" href="budgets.html">Manage</a></div>' + budgetList(budgets.data) + '</div>' +
        '<div class="card pad"><div class="section-head"><h2>Insights</h2></div>' + insights(sum) + '</div>' +
      '</div>' +
    '</div>';

  if (cats.data.length) new Chart(document.getElementById('donut'), {
    type: 'doughnut',
    data: { labels: cats.data.map(c => c.category), datasets: [{ data: cats.data.map(c => c.total), backgroundColor: PALETTE, borderWidth: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'right', labels: { boxWidth: 12 } } } }
  });
  if (monthly.data.length) new Chart(document.getElementById('bars'), {
    type: 'bar',
    data: { labels: monthly.data.map(m => m.month), datasets: [
      { label: 'Income', data: monthly.data.map(m => m.income), backgroundColor: '#16a34a', borderRadius: 5 },
      { label: 'Expense', data: monthly.data.map(m => m.expense), backgroundColor: '#e11d48', borderRadius: 5 }
    ] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }
  });
});

function statCard(label, value, chip, icon, cls, extra = '') {
  return '<div class="card stat"><div class="row" style="justify-content:space-between"><span class="label">' + label + '</span><span class="chip ' + chip + '">' + icon + '</span></div>' +
    '<div class="value ' + (cls || '') + '">' + value + '</div>' + extra + '</div>';
}
function recentTable(rows) {
  if (!rows.length) return emptyState('No transactions yet. Add your first one!');
  return '<div class="table-wrap"><table><tbody>' + rows.map(t =>
    '<tr><td><strong>' + escapeHtml(t.title) + '</strong><br><span class="muted" style="font-size:12px">' + escapeHtml(t.category) + ' · ' + fmtDate(t.date) + '</span></td>' +
    '<td style="text-align:right" class="' + (t.type === 'income' ? 'pos' : 'neg') + '"><strong>' + (t.type === 'income' ? '+' : '−') + fmt(t.amount) + '</strong></td></tr>'
  ).join('') + '</tbody></table></div>';
}
function budgetList(rows) {
  if (!rows.length) return emptyState('No budgets set for this month');
  return rows.slice(0, 5).map(b =>
    '<div style="margin-bottom:12px"><div class="row" style="justify-content:space-between"><span>' + escapeHtml(b.category) + '</span>' +
    '<span class="muted">' + fmt(b.spent) + ' / ' + fmt(b.amount) + '</span></div>' +
    '<div class="progress ' + b.status + '" style="margin-top:6px"><i style="width:' + Math.min(100, b.percentage) + '%"></i></div></div>'
  ).join('');
}
function insights(s) {
  const li = [];
  if (s.topCategory) li.push('🔥 Highest spend: <strong>' + escapeHtml(s.topCategory.name) + '</strong> (' + fmt(s.topCategory.total) + ')');
  li.push('📅 Avg daily expense: <strong>' + fmt(s.avgDailyExpense) + '</strong>');
  li.push('💹 Savings rate: <strong>' + s.savingsRate + '%</strong>');
  li.push('🧾 Transactions: <strong>' + s.transactionCount + '</strong>');
  if (s.largestExpense) li.push('💸 Largest expense: <strong>' + fmt(s.largestExpense) + '</strong>');
  return '<ul class="insights" style="list-style:none;padding:0;margin:0">' + li.map(x => '<li>' + x + '</li>').join('') + '</ul>';
}
