-- ==============================================================================
-- สคริปต์ปลดล็อกสิทธิ์ความปลอดภัย RLS (Row Level Security) สำหรับ Supabase
-- ใช้สำหรับ: โปรเจกต์ BaiTong Shop (ฐานข้อมูล Baitong_DB)
-- วิธีใช้: คัดลอกโค้ดทั้งหมดนี้ไปวางใน Supabase -> เมนู SQL Editor (>_) -> กด RUN
-- ==============================================================================

-- 1. ปลดล็อกระบบ RLS ให้สามารถบันทึกข้อมูล (INSERT/UPDATE/SELECT) ได้จากหน้าเว็บ
ALTER TABLE "Employee_TB" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Inventory_TB" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Summary_Expans_TB" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Summary_Self_TB" DISABLE ROW LEVEL SECURITY;

-- 2. สร้าง Policy อนุญาตให้สิทธิ์ public/anon ใช้งานได้ครบ 100%
DROP POLICY IF EXISTS "Allow public all" ON "Employee_TB";
CREATE POLICY "Allow public all" ON "Employee_TB" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all" ON "Inventory_TB";
CREATE POLICY "Allow public all" ON "Inventory_TB" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all" ON "Summary_Expans_TB";
CREATE POLICY "Allow public all" ON "Summary_Expans_TB" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all" ON "Summary_Self_TB";
CREATE POLICY "Allow public all" ON "Summary_Self_TB" FOR ALL USING (true) WITH CHECK (true);

-- 3. เพิ่มคอลัมน์ Ex_Date ในตาราง Summary_Expans_TB (หากยังไม่มี)
ALTER TABLE "Summary_Expans_TB" ADD COLUMN IF NOT EXISTS "Ex_Date" VARCHAR DEFAULT CURRENT_DATE::text;
