/* categorySuggest.js — simple rule-based category suggestion (FR-08).
 * Looks for known keywords inside merchant/description text and
 * suggests a matching expense category. This is intentionally simple
 * (no AI/OCR) per the project's "เวอร์ชันง่าย" scope.
 */

const CATEGORY_KEYWORD_RULES = [
  { keywords: ['7-eleven', '7-11', 'seven', 'lotus', 'big c', 'bigc', 'cafe', 'coffee', 'food', 'restaurant', 'ข้าว', 'กาแฟ'], category: 'อาหารและเครื่องดื่ม' },
  { keywords: ['grab', 'bolt', 'bus', 'taxi', 'fuel', 'gas', 'bts', 'mrt', 'วิน', 'รถ'], category: 'เดินทาง' },
  { keywords: ['book', 'course', 'tuition', 'stationery', 'หนังสือ', 'คอร์ส'], category: 'การเรียน' },
  { keywords: ['shopee', 'lazada', 'shopping', 'mall', 'ห้าง'], category: 'ช้อปปิ้ง' },
  { keywords: ['electric', 'water', 'internet', 'phone', 'ค่าไฟ', 'ค่าน้ำ', 'เน็ต'], category: 'บิลและค่าสาธารณูปโภค' },
  { keywords: ['hospital', 'clinic', 'medicine', 'โรงพยาบาล', 'คลินิก', 'ยา'], category: 'สุขภาพ' },
  { keywords: ['movie', 'game', 'music', 'หนัง', 'เกม'], category: 'ความบันเทิง' },
];

/**
 * Suggest an expense category name from free text (merchant + description).
 * Returns the category name string, or null if nothing matched.
 */
function suggestCategory(text) {
  if (!text) return null;
  const haystack = text.toLowerCase();
  for (const rule of CATEGORY_KEYWORD_RULES) {
    if (rule.keywords.some((kw) => haystack.includes(kw))) {
      return rule.category;
    }
  }
  return null;
}
