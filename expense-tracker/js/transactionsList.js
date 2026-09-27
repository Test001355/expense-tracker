/* transactionsList.js — powers transactions.html: table rendering,
 * live search box, and type/category/date-range filters (FR-06, FR-07).
 */

function populateCategoryFilter() {
  const select = document.getElementById('f-category');
  getCategories().forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.name;
    opt.textContent = c.name;
    select.appendChild(opt);
  });
}

function currentFilters() {
  return {
    keyword: document.getElementById('f-keyword').value,
    type: document.getElementById('f-type').value,
    category: document.getElementById('f-category').value,
    from: document.getElementById('f-from').value,
    to: document.getElementById('f-to').value,
  };
}

function renderTable() {
  const rows = queryTransactions(currentFilters());
  const body = document.getElementById('tx-body');
  const emptyEl = document.getElementById('tx-empty');

  if (rows.length === 0) {
    body.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }
  emptyEl.style.display = 'none';

  body.innerHTML = rows
    .map(
      (t) => `
    <tr onclick="window.location.href='detail.html?id=${t.id}'">
      <td data-label="วันที่">${formatDate(t.transaction_date)}</td>
      <td data-label="ประเภท"><span class="tag">${t.type === 'income' ? 'รายรับ' : 'รายจ่าย'}</span></td>
      <td data-label="หมวดหมู่"><span class="tag">${t.category}</span></td>
      <td data-label="รายละเอียด">${t.description || t.merchant || '-'}</td>
      <td data-label="จำนวนเงิน" class="num amount--${t.type}">${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}</td>
    </tr>`
    )
    .join('');
}

function exportVisibleToCSV() {
  const rows = queryTransactions(currentFilters());
  if (rows.length === 0) {
    showToast('ไม่มีรายการให้ส่งออกตามเงื่อนไขที่เลือก', 'error');
    return;
  }
  const headers = ['วันที่', 'ประเภท', 'หมวดหมู่', 'ร้านค้า/ผู้รับเงิน', 'รายละเอียด', 'วิธีการชำระเงิน', 'จำนวนเงิน (บาท)'];
  const data = rows.map((t) => [
    t.transaction_date,
    t.type === 'income' ? 'รายรับ' : 'รายจ่าย',
    t.category,
    t.merchant,
    t.description,
    t.payment_method,
    t.amount,
  ]);
  downloadCSV(`transactions-${todayISO()}.csv`, headers, data);
  showToast(`ส่งออก ${rows.length} รายการเรียบร้อย`, 'success');
}

document.addEventListener('DOMContentLoaded', () => {
  populateCategoryFilter();
  renderTable();
  ['f-keyword', 'f-type', 'f-category', 'f-from', 'f-to'].forEach((id) => {
    document.getElementById(id).addEventListener('input', renderTable);
  });
  document.getElementById('export-csv-btn').addEventListener('click', exportVisibleToCSV);
});
