/* uploadSlip.js — powers upload-slip.html: previews the chosen slip
 * image, runs on-device OCR to auto-fill the amount, suggests a
 * category from merchant/description keywords, and saves the record
 * with the image embedded as a base64 data URL (FR-02, FR-03, FR-08).
 *
 * OCR is done with Tesseract.js, which runs entirely in the browser
 * (no server needed). Per the SRS, OCR is not required to be 100%
 * accurate — the amount field stays editable so the user can always
 * correct it before saving.
 */

let slipDataUrl = '';
let ocrWorkerReady = null; // Promise<Tesseract worker> — created once, reused for every slip on this page

/**
 * Kick off loading the OCR worker as soon as the page opens, instead of
 * waiting until the user picks a file. The first load downloads the
 * OCR engine + language data (a few MB), so starting early hides most
 * of that latency behind the time the user spends choosing a photo.
 * The same worker is then reused for every slip uploaded on this page,
 * so only the very first scan pays the download cost.
 */
function preloadOcrWorker() {
  if (typeof Tesseract === 'undefined') return;
  ocrWorkerReady = Tesseract.createWorker(['eng', 'tha'], 1, { logger: () => {} }).catch((err) => {
    console.error('OCR preload failed', err);
    return null;
  });
}

/**
 * Downscale the slip image before OCR. Recognition time grows roughly
 * with pixel count, and slip photos are often much higher resolution
 * than needed to read the printed amount, so shrinking the image first
 * makes OCR noticeably faster without hurting accuracy.
 */
function resizeImageForOcr(dataUrl, maxDim = 900) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (Math.max(width, height) > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(dataUrl); // fall back to the original image if resizing fails
    img.src = dataUrl;
  });
}

/**
 * Pull the most likely amount out of raw OCR text. Slips almost always
 * print the total as a decimal figure (e.g. "99.00", "1,250.00"), which
 * is a distinctive-enough pattern to avoid picking up reference codes,
 * account numbers, or dates that appear elsewhere on the slip.
 */
function extractAmountFromOcrText(text) {
  const decimalMatches = text.match(/\d{1,3}(?:,\d{3})*\.\d{2}/g) || [];
  const candidates = decimalMatches
    .map((m) => parseFloat(m.replace(/,/g, '')))
    .filter((n) => n > 0 && n < 10000000);

  if (candidates.length > 0) {
    // The transaction amount is typically the most prominent (largest) figure.
    return Math.max(...candidates);
  }
  return null;
}

// Thai month abbreviations as commonly printed on bank slips, mapped to month number.
const THAI_MONTHS = {
  'ม.ค.': 1, 'มค': 1, 'มกราคม': 1,
  'ก.พ.': 2, 'กพ': 2, 'กุมภาพันธ์': 2,
  'มี.ค.': 3, 'มีค': 3, 'มีนาคม': 3,
  'เม.ย.': 4, 'เมย': 4, 'เมษายน': 4,
  'พ.ค.': 5, 'พค': 5, 'พฤษภาคม': 5,
  'มิ.ย.': 6, 'มิย': 6, 'มิถุนายน': 6,
  'ก.ค.': 7, 'กค': 7, 'กรกฎาคม': 7,
  'ส.ค.': 8, 'สค': 8, 'สิงหาคม': 8,
  'ก.ย.': 9, 'กย': 9, 'กันยายน': 9,
  'ต.ค.': 10, 'ตค': 10, 'ตุลาคม': 10,
  'พ.ย.': 11, 'พย': 11, 'พฤศจิกายน': 11,
  'ธ.ค.': 12, 'ธค': 12, 'ธันวาคม': 12,
};

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Find a Thai-format date on the slip, e.g. "23 ก.ย. 2569", and convert
 * it to an ISO date (YYYY-MM-DD) for the <input type="date">. Thai
 * slips print the year in the Buddhist Era, so 543 is subtracted to
 * get the Gregorian year.
 */
function extractDateFromOcrText(text) {
  const normalized = text.replace(/\s+/g, ' ');
  const monthKeys = Object.keys(THAI_MONTHS).sort((a, b) => b.length - a.length).map(escapeRegExp);
  const regex = new RegExp(`(\\d{1,2})\\s*(${monthKeys.join('|')})\\s*(\\d{4})`, 'i');
  const match = normalized.match(regex);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const month = THAI_MONTHS[match[2]];
  let year = parseInt(match[3], 10);
  if (year > 2400) year -= 543; // Buddhist Era -> Gregorian

  if (!month || day < 1 || day > 31) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
}

function setOcrStatus(message, tone = '') {
  const el = document.getElementById('ocr-status');
  el.style.display = message ? 'block' : 'none';
  el.textContent = message;
  el.style.color = tone === 'error' ? 'var(--expense)' : '';
}

async function runOcrOnSlip(dataUrl) {
  if (typeof Tesseract === 'undefined') {
    setOcrStatus('ไม่สามารถโหลดระบบอ่านตัวเลขอัตโนมัติได้ (ต้องใช้อินเทอร์เน็ต) — กรุณากรอกจำนวนเงินเอง', 'error');
    return;
  }

  setOcrStatus('🔍 กำลังอ่านตัวเลขจากสลิป...');
  const slowNoticeTimer = setTimeout(() => {
    setOcrStatus('🔍 กำลังอ่านตัวเลขจากสลิป... (ครั้งแรกอาจใช้เวลาสักครู่เพราะกำลังโหลดระบบ OCR — กรอกจำนวนเงินเองระหว่างนี้ได้เลย)');
  }, 5000);

  try {
    if (!ocrWorkerReady) preloadOcrWorker(); // in case the page-load preload hasn't started yet
    const [worker, resizedImage] = await Promise.all([ocrWorkerReady, resizeImageForOcr(dataUrl)]);
    clearTimeout(slowNoticeTimer);

    if (!worker) {
      setOcrStatus('ไม่สามารถโหลดระบบอ่านตัวเลขอัตโนมัติได้ กรุณากรอกจำนวนเงินเอง', 'error');
      return;
    }

    const result = await worker.recognize(resizedImage);
    const ocrText = result.data.text || '';
    const amount = extractAmountFromOcrText(ocrText);
    const detectedDate = extractDateFromOcrText(ocrText);

    if (detectedDate) {
      document.getElementById('date').value = detectedDate;
    }

    if (amount !== null && detectedDate) {
      document.getElementById('amount').value = amount.toFixed(2);
      setOcrStatus(`✅ ตรวจพบจำนวนเงิน ${amount.toFixed(2)} บาท และวันที่ ${formatDate(detectedDate)} จากสลิป — กรุณาตรวจสอบให้ถูกต้องอีกครั้ง`);
    } else if (amount !== null) {
      document.getElementById('amount').value = amount.toFixed(2);
      setOcrStatus(`✅ ตรวจพบจำนวนเงิน ${amount.toFixed(2)} บาทจากสลิป — ไม่พบวันที่ที่ชัดเจน กรุณาตรวจสอบและกรอกวันที่เอง`);
    } else {
      setOcrStatus('อ่านสลิปแล้วแต่ไม่พบจำนวนเงินที่ชัดเจน กรุณากรอกจำนวนเงินเอง', 'error');
    }
  } catch (err) {
    clearTimeout(slowNoticeTimer);
    setOcrStatus('เกิดข้อผิดพลาดขณะอ่านสลิป กรุณากรอกจำนวนเงินเอง', 'error');
  }
}

function fillCategoryOptions() {
  const select = document.getElementById('category');
  select.innerHTML = getCategoriesForType('expense')
    .map((c) => `<option value="${c.name}">${c.name}</option>`)
    .join('');
}

function updateSuggestion() {
  const text = `${document.getElementById('merchant').value} ${document.getElementById('description').value}`;
  const hint = document.getElementById('suggest-hint');
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
  fillCategoryOptions();
  preloadOcrWorker();

  document.getElementById('slip-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    slipDataUrl = await readFileAsDataURL(file);
    const preview = document.getElementById('slip-preview');
    preview.src = slipDataUrl;
    preview.style.display = 'block';
    document.getElementById('slip-drop-label').textContent = `✅ เลือกไฟล์แล้ว: ${file.name} (คลิกเพื่อเปลี่ยน)`;
    runOcrOnSlip(slipDataUrl);
  });

  document.getElementById('merchant').addEventListener('input', updateSuggestion);
  document.getElementById('description').addEventListener('input', updateSuggestion);

  document.getElementById('slip-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!slipDataUrl) {
      showToast('กรุณาอัปโหลดรูปภาพสลิปก่อน', 'error');
      return;
    }
    const amount = Number(document.getElementById('amount').value);
    if (!amount || amount <= 0) {
      showToast('กรุณากรอกจำนวนเงินให้ถูกต้อง', 'error');
      return;
    }
    addTransaction({
      type: 'expense',
      amount,
      transaction_date: document.getElementById('date').value,
      category: document.getElementById('category').value,
      payment_method: document.getElementById('payment_method').value,
      merchant: document.getElementById('merchant').value,
      description: document.getElementById('description').value,
      slip_image_url: slipDataUrl,
    });
    showToast('บันทึกรายการจากสลิปเรียบร้อย', 'success');
    setTimeout(() => (window.location.href = 'transactions.html'), 500);
  });
});
