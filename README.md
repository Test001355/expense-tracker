# Personal Expense Tracker Web App with Slip-Based Input

ระบบบันทึกรายรับ–รายจ่ายส่วนบุคคล พร้อมอัปโหลดสลิปเพื่อช่วยบันทึกข้อมูลค่าใช้จ่าย
พัฒนาตาม SRS "Personal Expense Tracker Web App with Slip-Based Input" (เวอร์ชันง่าย)

## เทคโนโลยีที่ใช้

- **Frontend:** HTML, CSS, JavaScript (Vanilla — ไม่ใช้ framework)
- **Data Storage:** Browser `localStorage` (ไม่ต้องตั้งค่า backend/database)
- **Chart:** [Chart.js](https://www.chartjs.org/) (โหลดผ่าน CDN)
- **Deployment:** แนะนำ Netlify หรือ Vercel (ดูหัวข้อ "การ Deploy" ด้านล่าง)

## โครงสร้างโปรเจกต์

```
expense-tracker/
├── index.html            # Dashboard: สรุปยอด + กราฟรายจ่ายตามหมวดหมู่
├── transactions.html     # รายการทั้งหมด + ค้นหา/กรอง
├── add.html              # เพิ่มรายการแบบกรอกเอง
├── upload-slip.html      # อัปโหลดสลิป + กรอกข้อมูลจากสลิป
├── detail.html           # ดู/แก้ไข/ลบรายการ (?id=...)
├── css/
│   └── style.css         # สไตล์ทั้งหมด (ธีม "สมุดบัญชี")
├── js/
│   ├── utils.js           # ฟังก์ชันช่วยทั่วไป (format วันที่/เงิน, toast, อ่านไฟล์รูป)
│   ├── storage.js         # Data service: CRUD รายการ + หมวดหมู่ ผ่าน localStorage
│   ├── categorySuggest.js # Logic แนะนำหมวดหมู่แบบ rule-based (FR-08)
│   ├── navbar.js           # Component เมนูนำทาง ใช้ร่วมกันทุกหน้า
│   ├── dashboard.js        # Logic เฉพาะหน้า Dashboard
│   ├── transactionsList.js # Logic เฉพาะหน้ารายการทั้งหมด + ส่งออก CSV
│   ├── add.js               # Logic เฉพาะหน้าเพิ่มรายการ
│   ├── uploadSlip.js        # Logic เฉพาะหน้าอัปโหลดสลิป + OCR อ่านจำนวนเงิน (Tesseract.js)
│   └── detail.js            # Logic เฉพาะหน้ารายละเอียด/แก้ไข
└── README.md
```

โค้ดแบ่งเป็น **pages** (ไฟล์ .html), **services** (`storage.js`, `categorySuggest.js`) และ
**components/utilities** (`navbar.js`, `utils.js`) แยกหน้าที่กันชัดเจนตาม NFR-07

งบประมาณรายเดือนถูกเก็บผ่านฟังก์ชันใน `storage.js` (`getBudget`, `setBudget`,
`getCurrentMonthExpense`) และแสดงผล/รับ input ใน `dashboard.js` — ไม่มีหน้าใหม่แยกต่างหาก

## วิธีติดตั้งและรันโปรเจกต์

โปรเจกต์นี้เป็น static site ล้วน ๆ (ไม่มี build step, ไม่ต้อง `npm install`) เปิดได้ 2 วิธี:

**วิธีที่ 1 — VS Code + Live Server (แนะนำ)**
1. เปิดโฟลเดอร์ `expense-tracker` ใน VS Code
2. ติดตั้ง extension **Live Server** (โดย Ritwick Dey)
3. คลิกขวาที่ `index.html` → **Open with Live Server**
4. เบราว์เซอร์จะเปิดที่ `http://127.0.0.1:5500` โดยอัตโนมัติ

**วิธีที่ 2 — เปิดไฟล์ตรง ๆ**
เปิด `index.html` ด้วยเบราว์เซอร์ได้เลย (บางเบราว์เซอร์อาจ warning เรื่อง local file
แต่ฟีเจอร์หลักยังทำงานได้ปกติ เพราะไม่มีการเรียก API ภายนอก)

> ⚠️ ข้อมูลถูกเก็บใน `localStorage` ของเบราว์เซอร์แต่ละเครื่อง/แต่ละโปรไฟล์ ถ้าเปิดจากเบราว์เซอร์
> หรือเครื่องอื่น จะไม่เห็นข้อมูลเดิม และถ้าล้าง browser data ข้อมูลจะหายไปด้วย

## การ Deploy (FR-12)

1. Push โค้ดขึ้น GitHub Repository
2. เข้า [Netlify](https://www.netlify.com/) หรือ [Vercel](https://vercel.com/) → New Site/Project → เชื่อมกับ repo
3. ตั้งค่า Build command: ว่างไว้ (ไม่มี build step) / Publish directory: `.` (root)
4. Deploy แล้วจะได้ URL สาธารณะให้ใช้งานจริงและใส่ในรายงานส่งอาจารย์

## ฟีเจอร์ที่ทำแล้ว (MVP checklist)

- [x] FR-01 เพิ่มรายการรายรับ–รายจ่ายแบบกรอกเอง (`add.html`)
- [x] FR-02 อัปโหลดรูปภาพสลิป (`upload-slip.html`)
- [x] FR-03 บันทึกข้อมูลจากสลิปโดยกรอกเอง
- [x] FR-04 แก้ไขรายการ (`detail.html`)
- [x] FR-05 ลบรายการ พร้อม confirm dialog
- [x] FR-06 แสดงรายการทั้งหมดแบบตาราง (`transactions.html`)
- [x] FR-07 ค้นหา + กรองตามประเภท/หมวดหมู่/ช่วงวันที่
- [x] FR-08 แนะนำหมวดหมู่แบบ rule-based จากคำสำคัญ (`categorySuggest.js`)
- [x] FR-09 Dashboard สรุปรายรับ/รายจ่าย/ยอดคงเหลือ
- [x] FR-10 กราฟสรุปรายจ่ายตามหมวดหมู่ (Doughnut chart)
- [x] FR-11 จัดเก็บข้อมูลธุรกรรมและรูปภาพสลิป (localStorage, เก็บรูปเป็น base64)
- [ ] FR-12 Deploy ระบบ — **ต้อง deploy เองตามขั้นตอนด้านบนก่อนส่งงาน**
- [x] *(Optional, SRS ข้อ 5.2)* OCR อ่านจำนวนเงิน**และวันที่**จากรูปสลิปอัตโนมัติ ด้วย [Tesseract.js](https://github.com/naptha/tesseract.js)
  (อ่านทั้งภาษาอังกฤษและภาษาไทย แปลงวันที่แบบไทย พ.ศ. เช่น "23 ก.ย. 2569" เป็น ค.ศ. ให้อัตโนมัติ
  รันในเบราว์เซอร์ล้วน ๆ ไม่ต้องมี server แยก ต้องมีอินเทอร์เน็ตตอนใช้งานครั้งแรกเพื่อโหลดไลบรารี)
  — ช่อง "จำนวนเงิน" และ "วันที่" ยังแก้ไขได้เสมอ เพราะ OCR ไม่รับประกันความแม่นยำ 100% (ดูหัวข้อ "สิ่งที่ไม่อยู่ในขอบเขต")
- [x] *(Optional, SRS ข้อ 5.2/17)* Export รายงานเป็น CSV — ปุ่ม "ส่งออก CSV" ในหน้ารายการทั้งหมด
  ส่งออกเฉพาะรายการที่กรอง/ค้นหาอยู่ ณ ขณะนั้น
- [x] *(Optional, SRS ข้อ 5.2/17)* ตั้งงบประมาณรายเดือน + แจ้งเตือนเมื่อใช้เกินงบ — แสดงเป็น progress bar ใน Dashboard

## สิ่งที่ไม่อยู่ในขอบเขต (ตาม SRS)

- ไม่เชื่อมต่อกับระบบธนาคารจริง / ไม่ตรวจสอบความถูกต้องของสลิป
- ไม่มี OCR อ่านข้อความจากสลิปอัตโนมัติ (ผู้ใช้กรอกเอง)
- ไม่มีระบบ Login/สมาชิก (เป็น optional ตาม SRS ข้อ 7.2)
- ไม่รองรับผู้ใช้งานจำนวนมาก (ข้อมูลเก็บใน localStorage ของแต่ละเบราว์เซอร์)

## แนวทางต่อยอด (Optional Advanced Features)

ถ้าทำ MVP เสร็จเร็ว สามารถเพิ่มได้ตาม SRS ข้อ 17 เช่น Export CSV, ตั้งงบประมาณรายเดือน,
Dark mode, หรือเชื่อม LINE สำหรับส่งสลิป

## การใช้ AI Tools ในการพัฒนา

> ⚠️ **นักศึกษาต้องเขียนสรุปนี้ใหม่เป็นของตัวเอง** ตามที่ SRS ข้อ 20 กำหนด — ห้ามคัดลอกไปส่งตรง ๆ
> เพราะอาจารย์ต้องการให้นักศึกษาอธิบายได้ว่า "ใช้ AI ช่วยตรงไหน" และ "อธิบายโค้ดหลักได้ด้วยตนเอง"

ตัวอย่างหัวข้อที่ควรสรุป:
- ใช้ AI ช่วยออกแบบโครงสร้างโปรเจกต์และ data model (`storage.js`) อย่างไร
- ใช้ AI ช่วยเขียนฟังก์ชัน CRUD และ logic แนะนำหมวดหมู่ (`categorySuggest.js`) อย่างไร
- ใช้ AI ช่วยออกแบบหน้าตา UI/UX และทำ responsive design อย่างไร
- ส่วนไหนที่ปรับแก้เองหลังจาก AI generate ให้ / เหตุผลที่ปรับ
- สรุปสั้น ๆ ว่าโค้ดแต่ละไฟล์ทำหน้าที่อะไร (ใช้หัวข้อ "โครงสร้างโปรเจกต์" ด้านบนเป็นจุดเริ่มต้น)

## หมายเหตุสำหรับผู้พัฒนา

- หมวดหมู่เริ่มต้นถูก seed ไว้ใน `storage.js` (`DEFAULT_CATEGORIES`) ตาม SRS ข้อ 11
- กฎการแนะนำหมวดหมู่อยู่ใน `categorySuggest.js` (`CATEGORY_KEYWORD_RULES`) ตาม SRS ข้อ 12
  เพิ่มคำสำคัญหรือหมวดหมู่ใหม่ได้โดยแก้ไฟล์นี้ไฟล์เดียว
- ถ้าต้องการล้างข้อมูลทดสอบทั้งหมด เปิด Developer Console แล้วรัน `localStorage.clear()`
  แล้วรีเฟรชหน้า
