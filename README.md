# 🏪 ใบตอง ช็อป (BaiTong Shop) - ระบบบริหารจัดการร้านอุปกรณ์เครื่องเขียน

ระบบเว็บแอปพลิเคชันบริหารจัดการร้านอุปกรณ์เครื่องเขียนแบบครบวงจร (Stationery & Office Supplies Store Management Web Application) พัฒนาตามโครงสร้างและสูตรการคำนวณจากไฟล์ **ร้านอุปกรณ์เครื่องเขียน.xlsx** เชื่อมต่อฐานข้อมูลคลาวด์ **Supabase (`Baitong_DB`)** และรองรับการจัดการสิทธิ์ผู้ใช้งานระดับผู้ดูแลระบบ (Admin)

---

## 🚀 คุณสมบัติและโมดูลการทำงานของระบบ

### 1. ระบบยืนยันตัวตนและจัดการสมาชิก (Authentication & Member Management)
- **ระบบสมาชิก (User Registration / Login)**:
  - สุ่มสร้างรหัสสมาชิกอัตโนมัติ (เช่น `BT-10229`)
  - ตรวจสอบรูปแบบชื่อ-นามสกุล, เบอร์โทรศัพท์ 10 หลัก และอีเมล
  - บันทึกข้อมูลสมาชิกเข้าสู่ฐานข้อมูล **Supabase (`Employee_TB`)** โดยตรง
- **ระบบแอดมินหลังบ้าน (Admin System)**:
  - เข้าสู่ระบบด้วยบัญชีผู้ดูแล: บัญชี `ADMIN` / รหัสผ่าน `1229`
  - **หน้าจัดการสมาชิก (Member Management Page)**: เพิ่ม, แก้ไข, เปลี่ยนรหัส, เปลี่ยนสถานะ (ปกติ/ระงับ) และลบสมาชิก
  - ปุ่ม **`⚡ ซิงค์เข้า Supabase (Employee_TB)`** เพื่อส่งข้อมูลสมาชิกทั้งหมดขึ้นฐานข้อมูลแบบ Batch

### 2. โมดูลหลัก 7 ระบบ (ตามโครงสร้าง Excel ร้านอุปกรณ์เครื่องเขียน)
1. **คลังสินค้า (Inventory Management)**: ตรวจสอบและจัดการสต็อกสินค้า 30 รายการ, แจ้งเตือนสินค้าใกล้หมด (Restock Alert), เชื่อมโยงกับตาราง `Inventory_TB`
2. **ระบบซื้อสินค้า (Purchasing System)**: สแกนบาร์โค้ดรับสินค้าเข้าสต็อก คำนวณยอดซื้อสุทธิ
3. **สรุปยอดซื้อสินค้า (Purchase Summary)**: รายงานประวัติการสั่งซื้อเข้าคลัง คำนวณต้นทุนรวม (`In_Sum_Cost`)
4. **จุดขายหน้าร้าน (POS - Point of Sale)**: สแกนบาร์โค้ด/เลือกสินค้าเพื่อขาย คำนวณส่วนลดตามระดับสมาชิก, คำนวณภาษีมูลค่าเพิ่ม VAT 7%, ทอนเงิน, พิมพ์ใบเสร็จรับเงิน
5. **สรุปยอดขายสินค้า (Sales Summary)**: วิเคราะห์ยอดขายสินค้าแต่ละชนิด บันทึกเข้าตาราง `Summary_Self_TB`
6. **รายได้-ค่าใช้จ่าย (Income & Expenses)**: วิเคราะห์ต้นทุนและค่าใช้จ่ายจาก `Inventory_TB` สรุปเข้าตาราง `Summary_Expans_TB`
7. **งบกำไรขาดทุน (Profit & Loss Statement)**: สรุปผลประกอบการทางธุรกิจ อัตรากำไรสุทธิ และรายงานทางการเงิน

---

## 🗄️ โครงสร้างฐานข้อมูล Supabase (`Baitong_DB`)

ระบบเชื่อมโยงกับฐานข้อมูล Supabase (`https://xpyltldpeqsqijsbhdpf.supabase.co`) ครบทั้ง 4 ตาราง:

| ตาราง (Table) | คอลัมน์ (Columns) | รายละเอียด |
|---|---|---|
| `Employee_TB` | `Em_ID`, `Em_User`, `Em_Name`, `EM_Tell`, `EM_Email`, `Em_Status`, `EM_date` | ข้อมูลสมาชิกและพนักงาน |
| `Inventory_TB` | `In_ID`, `In_Bar`, `In_Menu`, `In_Unit`, `In_Qty`, `In_Price_Cost`, `In_PriceSum`, `In_Sum_Cost`, `In_Status` | ข้อมูลสินค้าและสต็อกคลัง |
| `Summary_Expans_TB` | `Ex_ID`, `Ex_Purch`, `Ex_List`, `Ex_Date` | บันทึกสรุปรายการค่าใช้จ่าย |
| `Summary_Self_TB` | `S_ID`, `S_Date`, `In_Bar`, `In_Menu`, `In_Qty`, `S_Sum`, `In_Receipt` | บันทึกสรุปยอดการขายสินค้า |

### 🔐 การตั้งค่าสิทธิ์ความปลอดภัย (Row Level Security - RLS)
หากตารางใน Supabase เปิด RLS ไว้ ให้รันคำสั่งในเมนู **SQL Editor** เพื่อเปิดสิทธิ์การบันทึกข้อมูล:
```sql
ALTER TABLE "Employee_TB" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Inventory_TB" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Summary_Expans_TB" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Summary_Self_TB" DISABLE ROW LEVEL SECURITY;
```

---

## 💻 เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide Icons, Canvas Confetti
- **Backend / Database**: Supabase (PostgreSQL REST API)
- **Deployment**: Vercel, GitHub

---

## 📦 วิธีการติดตั้งและรันบนเครื่อง Local

1. โคลนคลังโค้ด:
```bash
git clone https://github.com/natthanan1229/BaiTong-Shop.git
cd BaiTong-Shop
```

2. ติดตั้ง Dependencies:
```bash
npm install
```

3. รันเซิร์ฟเวอร์สำหรับการพัฒนา (Development):
```bash
npm run dev
```

4. บิลด์สำหรับการนำขึ้น Production:
```bash
npm run build
npm run preview
```

---

## 👤 ข้อมูลการเข้าสู่ระบบเริ่มต้น
- **ผู้ดูแลระบบ (Admin)**: รหัสผ่านเข้าสู่ระบบหลังบ้าน `1229` (ชื่อผู้ใช้ `ADMIN`)
- **ผู้ใช้งานทั่วไป (User)**: สามารถลงทะเบียนใหม่ผ่านหน้าเว็บ หรือใช้รหัสที่ระบบสร้างให้ เช่น `BT-10229`
