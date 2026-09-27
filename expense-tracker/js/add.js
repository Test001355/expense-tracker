/* add.js — powers add.html: keeps the category list in sync with the
 * chosen type, offers a live rule-based category suggestion, and
 * saves the new transaction (FR-01, FR-08).
 */

function fillCategoryOptions(type) {
  const select = document.getElementById('category');
  const previous = select.value;
  select.innerHTML = getCategoriesForType(type)
    .map((c) => `<option value="${c.name}">${c.name}</option>`)
    .join('');
  if ([...select.options].some((o) => o.value === previous)) select.value = previous;
}

function currentType() {
  return document.querySelector('input[name="type"]:checked').value;
}

function updateSuggestion() {
  const text = `${document.getElementById('merchant').value} ${document.getElementById('description').value}`;
  const hint = document.getElementById('suggest-hint');
  if (currentType() !== 'expense') {
    hint.style.display = 'none';
    return;
  }
  const suggestion = suggestCategory(text);
  if (!suggestion) {
    hint.style.display = 'none';
    return;
  }
  hint.style.display = 'block';
  hint.innerHTML = `ระบบแนะนำหมวดหมู่: <strong>${suggestion}</strong> — <button type="button" id="apply-suggestion">ใช้หมวดหมู่นี้</button>`;
  document.getElementById('apply-suggestion').onclick = () => {
    document.getElementById('category').value = suggestion;
  };
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('date').value = todayISO();
  fillCategoryOptions(currentType());

  document.querySelectorAll('input[name="type"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      fillCategoryOptions(currentType());
      updateSuggestion();
    });
  });

  document.getElementById('merchant').addEventListener('input', updateSuggestion);
  document.getElementById('description').addEventListener('input', updateSuggestion);

  document.getElementById('add-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = Number(document.getElementById('amount').value);
    if (!amount || amount <= 0) {
      showToast('กรุณากรอกจำนวนเงินให้ถูกต้อง', 'error');
      return;
    }
    addTransaction({
      type: currentType(),
      amount,
      transaction_date: document.getElementById('date').value,
      category: document.getElementById('category').value,
      payment_method: document.getElementById('payment_method').value,
      merchant: document.getElementById('merchant').value,
      description: document.getElementById('description').value,
    });
    showToast('บันทึกรายการเรียบร้อย', 'success');
    setTimeout(() => (window.location.href = 'transactions.html'), 500);
  });
});
