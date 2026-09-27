/* storage.js — data access layer (localStorage).
 * All reading/writing of transactions & categories goes through this file,
 * so if the project later moves to a real backend/database, only this
 * file needs to change — pages call the same function names.
 */

const STORAGE_KEYS = {
  TRANSACTIONS: 'ext_transactions',
  CATEGORIES: 'ext_categories',
  BUDGET: 'ext_budget',
};

const DEFAULT_CATEGORIES = [
  { id: 'cat-food', name: 'อาหารและเครื่องดื่ม', type: 'expense' },
  { id: 'cat-transport', name: 'เดินทาง', type: 'expense' },
  { id: 'cat-education', name: 'การเรียน', type: 'expense' },
  { id: 'cat-shopping', name: 'ช้อปปิ้ง', type: 'expense' },
  { id: 'cat-bills', name: 'บิลและค่าสาธารณูปโภค', type: 'expense' },
  { id: 'cat-health', name: 'สุขภาพ', type: 'expense' },
  { id: 'cat-entertainment', name: 'ความบันเทิง', type: 'expense' },
  { id: 'cat-income', name: 'รายรับ', type: 'income' },
  { id: 'cat-other', name: 'อื่น ๆ', type: 'both' },
];

/** Seed default categories the first time the app runs. */
function initStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
  }
}

/* ---------- Categories ---------- */

function getCategories() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES)) || DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

/** Categories usable for a given transaction type ('income' | 'expense'). */
function getCategoriesForType(type) {
  return getCategories().filter((c) => c.type === type || c.type === 'both');
}

/* ---------- Transactions ---------- */

function getTransactions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || [];
  } catch {
    return [];
  }
}

function saveTransactions(list) {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(list));
}

function getTransactionById(id) {
  return getTransactions().find((t) => t.id === id) || null;
}

/** Add a new transaction. Returns the created record (with id + created_at filled in). */
function addTransaction(data) {
  const record = {
    id: generateId(),
    type: data.type,
    amount: Number(data.amount),
    category: data.category,
    transaction_date: data.transaction_date,
    description: data.description || '',
    merchant: data.merchant || '',
    payment_method: data.payment_method || '',
    slip_image_url: data.slip_image_url || '',
    created_at: new Date().toISOString(),
  };
  const list = getTransactions();
  list.push(record);
  saveTransactions(list);
  return record;
}

/** Update an existing transaction by id. Returns true if a record was found and updated. */
function updateTransaction(id, data) {
  const list = getTransactions();
  const idx = list.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  list[idx] = { ...list[idx], ...data, amount: Number(data.amount) };
  saveTransactions(list);
  return true;
}

/** Delete a transaction by id. Returns true if a record was found and removed. */
function deleteTransaction(id) {
  const list = getTransactions();
  const next = list.filter((t) => t.id !== id);
  saveTransactions(next);
  return next.length !== list.length;
}

/** Search + filter helper shared by the transaction list page. */
function queryTransactions({ keyword = '', type = '', category = '', from = '', to = '' } = {}) {
  const kw = keyword.trim().toLowerCase();
  return getTransactions()
    .filter((t) => {
      if (type && t.type !== type) return false;
      if (category && t.category !== category) return false;
      if (from && t.transaction_date < from) return false;
      if (to && t.transaction_date > to) return false;
      if (kw) {
        const haystack = `${t.description} ${t.merchant} ${t.category}`.toLowerCase();
        if (!haystack.includes(kw)) return false;
      }
      return true;
    })
    .sort((a, b) => (a.transaction_date < b.transaction_date ? 1 : -1));
}

/** Totals used by the dashboard: income, expense, balance. */
function getSummary(list = getTransactions()) {
  const income = list.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expense = list.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  return { income, expense, balance: income - expense };
}

/** Expense totals grouped by category, for the summary chart. */
function getExpenseByCategory(list = getTransactions()) {
  const totals = {};
  list
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      totals[t.category] = (totals[t.category] || 0) + Number(t.amount);
    });
  return totals;
}

/* ---------- Monthly budget (optional feature, SRS ข้อ 5.2) ---------- */

function getBudget() {
  const raw = localStorage.getItem(STORAGE_KEYS.BUDGET);
  return raw ? Number(raw) : 0;
}

function setBudget(amount) {
  localStorage.setItem(STORAGE_KEYS.BUDGET, String(Number(amount) || 0));
}

/** YYYY-MM for the current month, used to scope the budget to "this month". */
function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Total expenses recorded so far in the current month. */
function getCurrentMonthExpense() {
  const ym = currentYearMonth();
  return getTransactions()
    .filter((t) => t.type === 'expense' && t.transaction_date.startsWith(ym))
    .reduce((sum, t) => sum + Number(t.amount), 0);
}

initStorage();
