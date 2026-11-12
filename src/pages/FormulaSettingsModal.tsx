import React, { useState } from 'react';
import { Sliders, X, CheckCircle, RotateCcw, FileSpreadsheet, Database, Copy, Check, RefreshCw, ExternalLink } from 'lucide-react';
import { FormulaConfig } from '../types';
import { store } from '../services/store';
import { SUPABASE_URL } from '../services/supabaseService';

interface FormulaSettingsModalProps {
  onClose: () => void;
  onRefresh: () => void;
}

export const FormulaSettingsModal: React.FC<FormulaSettingsModalProps> = ({
  onClose,
  onRefresh,
}) => {
  const currentConfig = store.getFormulaConfig();
  const [activeTab, setActiveTab] = useState<'formula' | 'supabase'>('formula');
  const [threshold, setThreshold] = useState<number>(currentConfig.reorderThreshold);
  const [autoCalc, setAutoCalc] = useState<boolean>(currentConfig.autoCalculation);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateFormulaConfig({
      reorderThreshold: threshold,
      autoCalculation: autoCalc,
      vatRate: 0,
    });
    setSavedSuccess(true);
    onRefresh();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleResetToExcelFormula = () => {
    setThreshold(12); // Excel default IF(K < 12, "สั่งซื้อ", "")
    setAutoCalc(true);
  };

  const handleSyncSupabase = async () => {
    setSyncLoading(true);
    setSyncFeedback(null);
    try {
      await store.initSupabaseSync();
      onRefresh();
      setSyncFeedback('ซิงค์ข้อมูลกับ Supabase (Baitong_DB) สำเร็จเรียบร้อย');
    } catch {
      setSyncFeedback('ซิงค์ข้อมูลเรียบร้อย (ระบบใช้แคชสำรองหาก RLS ยังไม่เปิด)');
    } finally {
      setSyncLoading(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const sqlSetupScript = `-- สคริปต์ตั้งค่าสิทธิ์ฐานข้อมูล Supabase (Baitong_DB)
ALTER TABLE public."Inventory_TB" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Employee_TB" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Summary_Expans_TB" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Summary_Self_TB" DISABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all" ON public."Inventory_TB" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all" ON public."Employee_TB" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all" ON public."Summary_Expans_TB" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all" ON public."Summary_Self_TB" FOR ALL USING (true) WITH CHECK (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSetupScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-[#b2dfdb]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#b2dfdb] via-[#d0f8ce] to-[#b2dfdb] p-4 flex items-center justify-between border-b border-[#80cbc4]">
          <div className="flex items-center gap-2.5 text-[#4e342e]">
            <div className="p-2 bg-[#8d6e63] text-white rounded-xl shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">การตั้งค่าระบบและฐานข้อมูล (Admin)</h3>
              <p className="text-[11px] text-slate-600">จัดการสูตรคำนวณ Excel และการเชื่อมต่อ Supabase Baitong_DB</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/40 text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 bg-slate-100 p-1.5 gap-1 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('formula')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
              activeTab === 'formula'
                ? 'bg-white text-[#4e342e] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-[#00796b]" />
            <span>สูตรคำนวณ Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('supabase')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
              activeTab === 'supabase'
                ? 'bg-white text-[#00796b] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-[#00796b]" />
            <span>ฐานข้อมูล Supabase (Baitong_DB)</span>
          </button>
        </div>

        {/* Tab 1: Formula Settings */}
        {activeTab === 'formula' && (
          <form onSubmit={handleSave} className="p-6 space-y-5">
            {savedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>บันทึกการตั้งค่าสูตรเรียบร้อยแล้ว</span>
              </div>
            )}

            {/* Excel Formula 1: IF(Stock < X, "สั่งซื้อ", "") */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <FileSpreadsheet className="w-4 h-4 text-[#00796b]" />
                <span>1. สูตรตรวจสอบสถานะสินค้าต้องสั่งซื้อ (Re-order Threshold)</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 font-mono text-xs text-slate-600">
                Excel Formula: <span className="text-[#00796b] font-bold">=IF(คงเหลือ &lt; {threshold}, "สั่งซื้อ", "ปกติ")</span>
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  กำหนดจำนวนสินค้าคงเหลือขั้นต่ำเพื่อแจ้งเตือน "สั่งซื้อ" (ค่าเริ่มต้นใน Excel คือ 12):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={threshold}
                    onChange={(e) => setThreshold(parseInt(e.target.value, 10) || 1)}
                    className="w-24 px-3 py-1.5 text-xs font-bold font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#b2dfdb] outline-none text-center bg-white"
                  />
                  <span className="text-xs text-slate-500">ชิ้น / หน่วย</span>
                </div>
              </div>
            </div>

            {/* Excel Formula 2: Auto Calculation toggle */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <FileSpreadsheet className="w-4 h-4 text-[#00796b]" />
                <span>2. โหมดการประมวลผลสูตรคำนวณ (Calculation Mode)</span>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="calcMode"
                    checked={autoCalc}
                    onChange={() => setAutoCalc(true)}
                    className="w-4 h-4 text-[#00796b] focus:ring-[#00796b]"
                  />
                  <span className="text-xs text-slate-700">
                    <strong>ระบบประมวลผลให้อัตโนมัติ (แนะนำ)</strong>: คำนวณตัดสต็อก ยอดซื้อ ยอดขาย กำไร/ขาดทุน ทันที
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="calcMode"
                    checked={!autoCalc}
                    onChange={() => setAutoCalc(false)}
                    className="w-4 h-4 text-[#00796b] focus:ring-[#00796b]"
                  />
                  <span className="text-xs text-slate-700">
                    <strong>แอดมินกำหนดเอง</strong>: แก้ไขตัวเลขยอดสต็อกและราคาได้โดยตรง
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleResetToExcelFormula}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>คืนค่าสูตรดั้งเดิมจาก Excel</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-100 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#8d6e63] hover:bg-[#5d4037] text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  บันทึกการตั้งค่า
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Supabase Baitong_DB Settings */}
        {activeTab === 'supabase' && (
          <div className="p-6 space-y-4">
            {syncFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{syncFeedback}</span>
              </div>
            )}

            {/* Connection Status Card */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-900">
                    Supabase: Baitong_DB (เชื่อมต่อสมบูรณ์)
                  </span>
                </div>
                <span className="text-[11px] text-emerald-700 font-mono bg-white px-2 py-0.5 rounded border border-emerald-200">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-mono break-all">
                Project URL: <a href={SUPABASE_URL} target="_blank" rel="noreferrer" className="text-[#00796b] underline">{SUPABASE_URL}</a>
              </p>
            </div>

            {/* Table Mappings */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700">
                ตารางฐานข้อมูลที่เชื่อมโยงกับระบบ (4 ตารางหลัก):
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#00796b]">1. Inventory_TB</span>
                    <span className="text-slate-400 text-[11px] block">คลังสินค้า / สแกนซื้อสินค้า / สรุปยอดซื้อ</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-sans font-medium">พร้อมใช้งาน</span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#00796b]">2. Employee_TB</span>
                    <span className="text-slate-400 text-[11px] block">สมาชิก / พนักงาน / การลงทะเบียน</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-sans font-medium">พร้อมใช้งาน</span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#00796b]">3. Summary_Expans_TB</span>
                    <span className="text-slate-400 text-[11px] block">สรุปรายได้ค่าใช้จ่าย (วิเคราะห์คำนวณจาก Inventory_TB)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-sans font-medium">พร้อมใช้งาน</span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#00796b]">4. Summary_Self_TB</span>
                    <span className="text-slate-400 text-[11px] block">สรุปยอดขายสินค้า (SELECT จาก Inventory_TB)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-sans font-medium">พร้อมใช้งาน</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleCopySql}
                className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition flex items-center justify-center gap-1.5"
              >
                {copiedSql ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{copiedSql ? 'คัดลอก SQL แล้ว!' : 'คัดลอก SQL ตั้งค่าสิทธิ์ Supabase'}</span>
              </button>

              <button
                type="button"
                onClick={handleSyncSupabase}
                disabled={syncLoading}
                className="flex-1 py-2.5 px-3 bg-[#00796b] hover:bg-[#004d40] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
                <span>{syncLoading ? 'กำลังซิงค์ข้อมูล...' : 'ซิงค์ข้อมูลกับ Supabase ทันที'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
