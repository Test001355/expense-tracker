/* detail.js — powers detail.html: loads a transaction by ?id=, fills
 * the edit form, and handles save/delete (FR-04, FR-05).
 */

let currentId = null;

function fillCategoryOptions(type, selected) {
  const select = document.getElementById('category');
  select.innerHTML = getCategoriesForType(type)
    .map((c) => `<option value="${c.name}">${c.name}</option>`)
    .join('');
  if (selected) select.value = selected;
}

function currentType() {
  return document.querySelector('input[name="type"]:checked').value;
}

document.addEventListener('DOMContentLoaded', () => {
  currentId = getQueryParam('id');
  const record = currentId ? getTransactionById(currentId) : null;

  if (!record) {
    document.getElementById('not-found').style.display = 'block';
    return;
  }

  document.getElementById('detail-form').style.display = 'block';
  document.querySelector(`input[name="type"][value="${record.type}"]`).checked = true;
  fillCategoryOptions(record.type, record.category);
  document.getElementById('amount').value = record.amount;
  document.getElementById('date').value = record.transaction_date;
  document.getElementById('payment_method').value = record.payment_method || 'เงินสด';
  document.getElementById('merchant').value = record.merchant || '';
  document.getElementById('description').value = record.description || '';

  if (record.slip_image_url) {
    document.getElementById('slip-wrap').style.display = 'block';
    document.getElementById('slip-image').src = record.slip_image_url;
  }

  document.querySelectorAll('input[name="type"]').forEach((radio) => {
    radio.addEventListener('change', () => fillCategoryOptions(currentType()));
  });

  document.getElementById('detail-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = Number(document.getElementById('amount').value);
    if (!amount || amount <= 0) {
      showToast('กรุณากรอกจำนวนเงินให้ถูกต้อง', 'error');
      return;
    }
    updateTransaction(currentId, {
      type: currentType(),
      amount,
      transaction_date: document.getElementById('date').value,
      category: document.getElementById('category').value,
      payment_method: document.getElementById('payment_method').value,
      merchant: document.getElementById('merchant').value,
      description: document.getElementById('description').value,
      slip_image_url: record.slip_image_url || '',
    });
    showToast('บันทึกการแก้ไขเรียบร้อย', 'success');
    setTimeout(() => (window.location.href = 'transactions.html'), 500);
  });

  document.getElementById('delete-btn').addEventListener('click', () => {
    if (!confirm('ยืนยันการลบรายการนี้หรือไม่?')) return;
    deleteTransaction(currentId);
    showToast('ลบรายการเรียบร้อย', 'success');
    setTimeout(() => (window.location.href = 'transactions.html'), 400);
  });
});
