const PALETTE = ['#4f46e5', '#16a34a', '#e11d48', '#f59e0b', '#0ea5e9', '#a855f7', '#14b8a6', '#f97316', '#64748b', '#ec4899'];
let charts = [];
function destroyCharts() { charts.forEach(c => c.destroy()); charts = []; }

initPage('analytics', async (user, view) => {
  view.innerHTML =
    '<div class="card pad" style="margin-bottom:16px"><div class="row">' +
      '<label class="muted">Period</label><select id="period">' + selectOptions(PERIODS, localStorage.getItem('period') || 'month') + '</select>' +
      '<span id="customRange" class="row hidden"><input type="date" id="startDate"><span class="muted">to</span><input type="date" id="endDate"></span>' +
      '<button class="btn primary" id="apply">Apply</button>' +
    '</div></div>' +
    '<div id="content">' + spinnerCard() + '</div>';

  const $ = (id) => document.getElementById(id);
  const periodSel = $('period'), custom = $('customRange');
  const toggleCustom = () => custom.classList.toggle('hidden', periodSel.value !== 'custom');
  periodSel.onchange = toggleCustom; toggleCustom();
  $('apply').onclick = loadData;

  async function loadData() {
    destroyCharts();
    const content = $('content');
    content.innerHTML = spinnerCard();
    const params = { period: periodSel.value };
    if (periodSel.value === 'custom') { params.startDate = $('startDate').value; params.endDate = $('endDate').value; }
    let sum, cats, monthly, trends;
    try {
      [sum, cats, monthly, trends] = await Promise.all([
        api('/analytics/summary', { params }),
        api('/analytics/categories', { params }),
        api('/analytics/monthly', { params }),
        api('/analytics/trends', { params })
      ]);
    } catch (e) { content.innerHTML = errorState(e.message); return; }

    content.innerHTML =
      '<div class="grid g-4" style="margin-bottom:16px">' +
        mini('Income', fmt(sum.totalIncome), 'pos') + mini('Expenses', fmt(sum.totalExpense), 'neg') +
        mini('Net Balance', fmt(sum.balance), sum.balance >= 0 ? 'pos' : 'neg') + mini('Savings Rate', sum.savingsRate + '%', 'pos') +
      '</div>' +
      '<div class="grid g-2" style="margin-bottom:16px">' +
        chartCard('Expense Breakdown', 'donut', cats.data.length) +
        chartCard('Income vs Expenses', 'ivbar', monthly.data.length) +
      '</div>' +
      '<div class="grid g-2" style="margin-bottom:16px">' +
        chartCard('Spending Trend', 'trend', trends.data.length) +
        chartCard('Top Categories', 'catbar', cats.data.length) +
      '</div>' +
      '<div class="card pad"><div class="section-head"><h2>Statistics</h2></div>' + statsGrid(sum) + '</div>';

    if (cats.data.length) {
      charts.push(new Chart($('donut'), {
        type: 'doughnut',
        data: { labels: cats.data.map(c => c.category), datasets: [{ data: cats.data.map(c => c.total), backgroundColor: PALETTE, borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'right', labels: { boxWidth: 12 } } } }
      }));
      charts.push(new Chart($('catbar'), {
        type: 'bar',
        data: { labels: cats.data.map(c => c.category), datasets: [{ label: 'Spent', data: cats.data.map(c => c.total), backgroundColor: '#4f46e5', borderRadius: 5 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }
      }));
    }
    if (monthly.data.length) charts.push(new Chart($('ivbar'), {
      type: 'bar',
      data: { labels: monthly.data.map(m => m.month), datasets: [
        { label: 'Income', data: monthly.data.map(m => m.income), backgroundColor: '#16a34a', borderRadius: 5 },
        { label: 'Expense', data: monthly.data.map(m => m.expense), backgroundColor: '#e11d48', borderRadius: 5 }
      ] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }
    }));
    if (trends.data.length) charts.push(new Chart($('trend'), {
      type: 'line',
      data: { labels: trends.data.map(t => t.date), datasets: [{ label: 'Daily spend', data: trends.data.map(t => t.total), borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,.12)', fill: true, tension: .3, pointRadius: 2 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    }));
  }
  loadData();
});

function mini(label, value, cls) {
  return '<div class="card stat"><span class="label">' + label + '</span><div class="value ' + cls + '">' + value + '</div></div>';
}
function chartCard(title, id, has) {
  return '<div class="card pad"><div class="section-head"><h2>' + title + '</h2></div>' +
    (has ? '<div class="chart-box"><canvas id="' + id + '"></canvas></div>' : emptyState('No data available for this period')) + '</div>';
}
function statsGrid(s) {
  const rows = [
    ['Average daily spending', fmt(s.avgDailyExpense)],
    ['Average monthly spending', fmt(s.avgMonthlyExpense)],
    ['Largest expense', fmt(s.largestExpense)],
    ['Smallest expense', fmt(s.smallestExpense)],
    ['Highest spending category', s.topCategory ? s.topCategory.name : '—'],
    ['Lowest spending category', s.lowestCategory ? s.lowestCategory.name : '—'],
    ['Transaction count', s.transactionCount],
    ['Income-to-expense ratio', s.incomeToExpenseRatio],
    ['Savings rate', s.savingsRate + '%']
  ];
  return '<div class="grid g-3">' + rows.map(r =>
    '<div><div class="muted" style="font-size:13px">' + r[0] + '</div><div style="font-weight:700;font-size:17px;margin-top:2px">' + escapeHtml(String(r[1])) + '</div></div>'
  ).join('') + '</div>';
}
