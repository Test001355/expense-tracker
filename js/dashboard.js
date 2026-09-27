/* dashboard.js — populates the summary totals, category chart,
 * and recent-transactions list on index.html (FR-09, FR-10).
 */

const CHART_COLORS = ['#2F6F5E', '#A6472C', '#C48A2E', '#4F6D8C', '#8A5A8F', '#6E7A4A', '#B58A6A', '#5B5D54'];

function renderSummary() {
  const { income, expense, balance } = getSummary();
  document.getElementById('sum-income').textContent = formatCurrency(income);
  document.getElementById('sum-expense').textContent = formatCurrency(expense);
  document.getElementById('sum-balance').textContent = formatCurrency(balance);
}

function renderCategoryChart() {
  const totals = getExpenseByCategory();
  const labels = Object.keys(totals);
  const data = Object.values(totals);
  const canvas = document.getElementById('category-chart');
  const emptyEl = document.getElementById('chart-empty');

  if (labels.length === 0) {
    canvas.style.display = 'none';
    emptyEl.style.display = 'block';
    return;
  }

  new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]) }],
    },
    options: {
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 12 }, boxWidth: 12, padding: 12 } },
      },
    },
  });
}

function renderRecentTransactions() {
  const body = document.getElementById('recent-body');
  const emptyEl = document.getElementById('recent-empty');
  const recent = getTransactions()
    .sort((a, b) => (a.transaction_date < b.transaction_date ? 1 : -1))
    .slice(0, 6);

  if (recent.length === 0) {
    emptyEl.style.display = 'block';
    return;
  }

  body.innerHTML = recent
    .map(
      (t) => `
    <tr onclick="window.location.href='detail.html?id=${t.id}'">
      <td>${formatDate(t.transaction_date)}</td>
      <td><span class="tag">${t.category}</span></td>
      <td>${t.description || t.merchant || '-'}</td>
      <td class="num amount--${t.type}">${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}</td>
    </tr>`
    )
    .join('');
}

function renderBudget() {
  const budget = getBudget();
  const input = document.getElementById('budget-input');
  const display = document.getElementById('budget-display');
  const fill = document.getElementById('budget-bar-fill');
  const statusText = document.getElementById('budget-status-text');

  if (document.activeElement !== input) input.value = budget || '';

  if (!budget) {
    display.style.display = 'none';
    return;
  }

  const spent = getCurrentMonthExpense();
  const percent = Math.min(100, Math.round((spent / budget) * 100));

  display.style.display = 'block';
  fill.style.width = percent + '%';
  fill.className = 'budget-bar-fill';
  statusText.className = 'budget-status-text';

  if (spent > budget) {
    fill.classList.add('budget-bar-fill--over');
    statusText.classList.add('budget-status-text--over');
    statusText.textContent = `⚠️ ใช้จ่ายเกินงบแล้ว: ${formatCurrency(spent)} จากงบ ${formatCurrency(budget)} (เกินมา ${formatCurrency(spent - budget)})`;
  } else if (percent >= 80) {
    fill.classList.add('budget-bar-fill--warning');
    statusText.textContent = `ใช้ไปแล้ว ${formatCurrency(spent)} จากงบ ${formatCurrency(budget)} (${percent}%) — ใกล้เต็มงบแล้ว`;
  } else {
    statusText.textContent = `ใช้ไปแล้ว ${formatCurrency(spent)} จากงบ ${formatCurrency(budget)} (${percent}%)`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderSummary();
  renderCategoryChart();
  renderRecentTransactions();
  renderBudget();

  document.getElementById('save-budget-btn').addEventListener('click', () => {
    const value = Number(document.getElementById('budget-input').value);
    if (!value || value <= 0) {
      showToast('กรุณากรอกจำนวนงบประมาณให้ถูกต้อง', 'error');
      return;
    }
    setBudget(value);
    renderBudget();
    showToast('บันทึกงบประมาณเรียบร้อย', 'success');
  });
});
