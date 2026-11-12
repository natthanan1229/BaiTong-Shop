-- ==============================================================================
-- สคริปต์ตั้งค่าฐานข้อมูล Supabase สำหรับโปรเจกต์ BaiTong Shop (Baitong_DB)
-- นำโค้ดทั้งหมดนี้ไปวางใน: Supabase Console -> SQL Editor -> กด RUN เพื่อสร้างและเปิดสิทธิ์ทันที
-- ==============================================================================

-- 1. สร้างตารางคลังสินค้า (Inventory_TB)
CREATE TABLE IF NOT EXISTS public."Inventory_TB" (
    "In_ID" BIGSERIAL PRIMARY KEY,
    "In_Bar" TEXT NOT NULL UNIQUE,
    "In_Menu" TEXT NOT NULL,
    "In_Unit" TEXT DEFAULT 'อัน',
    "In_Qty" INTEGER DEFAULT 0,
    "In_Price_Cost" NUMERIC(10,2) DEFAULT 0,
    "In_PriceSum" NUMERIC(10,2) DEFAULT 0,
    "In_Sum_Cost" NUMERIC(10,2) DEFAULT 0,
    "In_Status" TEXT DEFAULT 'ปกติ',
    "In_Date" DATE DEFAULT CURRENT_DATE,
    "In_Count_IN" INTEGER DEFAULT 0,
    "In_Category" TEXT DEFAULT 'ทั่วไป',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. สร้างตารางพนักงาน / สมาชิก (Employee_TB)
CREATE TABLE IF NOT EXISTS public."Employee_TB" (
    "Em_ID" TEXT PRIMARY KEY,
    "Em_Name" TEXT NOT NULL,
    "EM_Tell" TEXT,
    "EM_Email" TEXT NOT NULL UNIQUE,
    "EM_date" TIMESTAMPTZ DEFAULT NOW(),
    "Em_Status" TEXT DEFAULT 'active',
    "Em_User" TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. สร้างตารางสรุปรายได้ค่าใช้จ่าย (Summary_Expans_TB)
CREATE TABLE IF NOT EXISTS public."Summary_Expans_TB" (
    "Ex_ID" BIGSERIAL PRIMARY KEY,
    "Ex_Purch" NUMERIC(10,2) DEFAULT 0,
    "Ex_List" TEXT,
    "Ex_Date" DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. สร้างตารางสรุปยอดขายสินค้า (Summary_Self_TB)
CREATE TABLE IF NOT EXISTS public."Summary_Self_TB" (
    "S_ID" BIGSERIAL PRIMARY KEY,
    "S_Date" DATE DEFAULT CURRENT_DATE,
    "In_Bar" TEXT,
    "In_Menu" TEXT,
    "In_Qty" INTEGER DEFAULT 1,
    "S_Sum" NUMERIC(10,2) DEFAULT 0,
    "In_Receipt" TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- จัดการสิทธิ์การเข้าถึง (Row Level Security - RLS) เพื่อให้ระบบหน้าเว็บสามารถอ่าน-เขียนได้ 100%
-- ==============================================================================
ALTER TABLE public."Inventory_TB" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Employee_TB" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Summary_Expans_TB" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Summary_Self_TB" DISABLE ROW LEVEL SECURITY;

-- เพิ่ม Public Policy เพื่อความปลอดภัยรองรับทุกสิทธิ์การใช้งาน
DROP POLICY IF EXISTS "Allow public all" ON public."Inventory_TB";
CREATE POLICY "Allow public all" ON public."Inventory_TB" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all" ON public."Employee_TB";
CREATE POLICY "Allow public all" ON public."Employee_TB" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all" ON public."Summary_Expans_TB";
CREATE POLICY "Allow public all" ON public."Summary_Expans_TB" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all" ON public."Summary_Self_TB";
CREATE POLICY "Allow public all" ON public."Summary_Self_TB" FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- ลงข้อมูลเริ่มต้น 30 รายการจากไฟล์ Excel: ร้านอุปกรณ์เครื่องเขียน.xlsx
-- ==============================================================================
INSERT INTO public."Inventory_TB" ("In_Bar", "In_Menu", "In_Unit", "In_Price_Cost", "In_PriceSum", "In_Qty", "In_Sum_Cost", "In_Status", "In_Category") VALUES
('ST001', 'ปากกาสีน้ำเงิน', 'ด้าม', 5, 10, 5, 25, 'สั่งซื้อ', 'ปากกาและดินสอ'),
('ST002', 'ปากกาสีแดง', 'ด้าม', 5, 10, 5, 25, 'สั่งซื้อ', 'ปากกาและดินสอ'),
('ST003', 'ปากกาสีดำ', 'ด้าม', 5, 10, 5, 25, 'สั่งซื้อ', 'ปากกาและดินสอ'),
('ST004', 'ดินสอ HB', 'แท่ง', 4, 8, 4, 16, 'สั่งซื้อ', 'ปากกาและดินสอ'),
('ST005', 'ดินสอ 2B', 'แท่ง', 5, 10, 5, 25, 'สั่งซื้อ', 'ปากกาและดินสอ'),
('ST006', 'ยางลบ', 'อัน', 3, 5, 3, 9, 'สั่งซื้อ', 'อุปกรณ์ลบและแก้ไข'),
('ST007', 'ไม้บรรทัด 15 ซม.', 'อัน', 5, 10, 5, 25, 'สั่งซื้อ', 'อุปกรณ์วัด'),
('ST008', 'ไม้บรรทัด 30 ซม.', 'อัน', 8, 15, 8, 64, 'สั่งซื้อ', 'อุปกรณ์วัด'),
('ST009', 'สมุดปกอ่อน', 'เล่ม', 12, 20, 12, 144, 'ปกติ', 'สมุดและกระดาษ'),
('ST010', 'สมุดปกแข็ง', 'เล่ม', 25, 35, 25, 625, 'ปกติ', 'สมุดและกระดาษ'),
('ST011', 'สมุดรายงาน', 'เล่ม', 15, 25, 15, 225, 'ปกติ', 'สมุดและกระดาษ'),
('ST012', 'กระดาษ A4', 'รีม', 90, 110, 90, 8100, 'ปกติ', 'สมุดและกระดาษ'),
('ST013', 'กระดาษสี', 'ห่อ', 25, 35, 25, 625, 'ปกติ', 'สมุดและกระดาษ'),
('ST014', 'แฟ้มใส', 'เล่ม', 5, 10, 5, 25, 'สั่งซื้อ', 'แฟ้มและจัดเก็บ'),
('ST015', 'แฟ้มสันกว้าง', 'เล่ม', 25, 35, 25, 625, 'ปกติ', 'แฟ้มและจัดเก็บ'),
('ST016', 'กาวแท่ง', 'อัน', 10, 15, 10, 100, 'สั่งซื้อ', 'กาวและเทป'),
('ST017', 'กาวน้ำ', 'อัน', 8, 12, 8, 64, 'สั่งซื้อ', 'กาวและเทป'),
('ST018', 'กรรไกร', 'อัน', 15, 25, 15, 225, 'ปกติ', 'อุปกรณ์ตัด'),
('ST019', 'คัตเตอร์', 'อัน', 10, 18, 10, 100, 'สั่งซื้อ', 'อุปกรณ์ตัด'),
('ST020', 'เทปลบคำผิด', 'อัน', 12, 20, 12, 144, 'ปกติ', 'อุปกรณ์ลบและแก้ไข'),
('ST021', 'เทปใส', 'อัน', 8, 15, 8, 64, 'สั่งซื้อ', 'กาวและเทป'),
('ST022', 'ปากกาเน้นข้อความ', 'ด้าม', 10, 18, 10, 100, 'สั่งซื้อ', 'ปากกาและดินสอ'),
('ST023', 'ปากกาเมจิก', 'ด้าม', 12, 20, 12, 144, 'ปกติ', 'ปากกาและดินสอ'),
('ST024', 'สีไม้ 12 สี', 'กล่อง', 25, 35, 25, 625, 'ปกติ', 'อุปกรณ์ศิลปะ'),
('ST025', 'สีเทียน 12 สี', 'กล่อง', 20, 30, 20, 400, 'ปกติ', 'อุปกรณ์ศิลปะ'),
('ST026', 'ดินสอกด', 'แท่ง', 15, 25, 15, 225, 'ปกติ', 'ปากกาและดินสอ'),
('ST027', 'ไส้ดินสอกด', 'อัน', 10, 18, 10, 100, 'สั่งซื้อ', 'ปากกาและดินสอ'),
('ST028', 'เครื่องเย็บกระดาษ', 'อัน', 30, 45, 30, 900, 'ปกติ', 'อุปกรณ์สำนักงาน'),
('ST029', 'ลวดเย็บกระดาษ', 'กล่อง', 8, 15, 8, 64, 'สั่งซื้อ', 'อุปกรณ์สำนักงาน'),
('ST030', 'คลิปหนีบกระดาษ', 'กล่อง', 10, 18, 10, 100, 'สั่งซื้อ', 'อุปกรณ์สำนักงาน')
ON CONFLICT ("In_Bar") DO UPDATE SET
    "In_Menu" = EXCLUDED."In_Menu",
    "In_Unit" = EXCLUDED."In_Unit",
    "In_Price_Cost" = EXCLUDED."In_Price_Cost",
    "In_PriceSum" = EXCLUDED."In_PriceSum",
    "In_Qty" = EXCLUDED."In_Qty",
    "In_Sum_Cost" = EXCLUDED."In_Sum_Cost",
    "In_Status" = EXCLUDED."In_Status",
    "In_Category" = EXCLUDED."In_Category";

-- สมาชิกตั้งต้น
INSERT INTO public."Employee_TB" ("Em_ID", "Em_Name", "EM_Tell", "EM_Email", "Em_Status", "Em_User") VALUES
('BT-10229', 'สมชาย ใจดี', '0812345678', 'somchai@email.com', 'active', 'BT-10229'),
('BT-85943', 'ใจดี ใจดำ', '0899887766', 'jaidee@email.com', 'active', 'BT-85943')
ON CONFLICT ("Em_ID") DO NOTHING;
