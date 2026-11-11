import React, { useState } from 'react';
import { Sliders, X, CheckCircle, RotateCcw, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { FormulaConfig } from '../types';
import { store } from '../services/store';

interface FormulaSettingsModalProps {
  onClose: () => void;
  onRefresh: () => void;
}

export const FormulaSettingsModal: React.FC<FormulaSettingsModalProps> = ({
  onClose,
  onRefresh,
}) => {
  const currentConfig = store.getFormulaConfig();
  const [threshold, setThreshold] = useState<number>(currentConfig.reorderThreshold);
  const [autoCalc, setAutoCalc] = useState<boolean>(currentConfig.autoCalculation);
  const [savedSuccess, setSavedSuccess] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#b2dfdb]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#b2dfdb] via-[#d0f8ce] to-[#b2dfdb] p-4 flex items-center justify-between border-b border-[#80cbc4]">
          <div className="flex items-center gap-2 text-[#4e342e]">
            <Sliders className="w-5 h-5 text-[#8d6e63]" />
            <div>
              <h3 className="font-bold text-base">กำหนดสูตรคำนวณและเกณฑ์คลังสินค้า (Admin)</h3>
              <p className="text-[11px] text-slate-600">อ้างอิงสูตรจากไฟล์ Excel: ร้านอุปกรณ์เครื่องเขียน.xlsx</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/40 text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>บันทึกการตั้งค่าสูตรเรียบร้อยแล้ว</span>
            </div>
          )}

          {/* Excel Formula 1: IF(Stock < X, "สั่งซื้อ", "") */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <FileSpreadsheet className="w-4 h-4 text-[#00796b]" />
              <span>1. สูตรตรวจสอบสถานะสินค้าต้องสั่งซื้อ (Re-order Threshold)</span>
            </div>
            <div className="p-2 bg-white rounded border border-slate-200 font-mono text-xs text-slate-600">
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
                  className="w-24 px-3 py-1.5 text-xs font-bold font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#b2dfdb] outline-none text-center"
                />
                <span className="text-xs text-slate-500">ชิ้น / หน่วย</span>
              </div>
            </div>
          </div>

          {/* Excel Formula 2: Auto Calculation toggle */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
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
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-100 transition"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#8d6e63] hover:bg-[#5d4037] text-white rounded-lg text-xs font-semibold shadow-xs transition"
              >
                บันทึกการตั้งค่า
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
