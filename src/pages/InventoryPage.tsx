import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  AlertTriangle, 
  CheckCircle, 
  Download, 
  RotateCcw, 
  SlidersHorizontal, 
  X, 
  Database,
  Zap,
  RefreshCw,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { Product, AuthSession } from '../types';
import { store } from '../services/store';
import { ImageSlot } from '../components/ImageSlot';

interface InventoryPageProps {
  session: AuthSession;
  products: Product[];
  onRefresh: () => void;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
  session,
  products,
  onRefresh,
}) => {
  const isAdmin = session.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'reorder' | 'normal'>('all');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [formBarcode, setFormBarcode] = useState('');
  const [formName, setFormName] = useState('');
  const [formUnit, setFormUnit] = useState('อัน');
  const [formCostPrice, setFormCostPrice] = useState<number>(0);
  const [formSellPrice, setFormSellPrice] = useState<number>(0);
  const [formStockQty, setFormStockQty] = useState<number>(0);
  const [formCategory, setFormCategory] = useState('อุปกรณ์ทั่วไป');
  const [formError, setFormError] = useState('');

  // Supabase sync state
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showRlsHelp, setShowRlsHelp] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Helper for rendering empty/blank columns as "Empty"
  const renderEmpty = (val: any, prefix: string = '') => {
    if (val === null || val === undefined || val === '' || String(val).trim() === '') {
      return (
        <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-slate-100 rounded border border-slate-200">
          Empty
        </span>
      );
    }
    return `${prefix}${val}`;
  };

  React.useEffect(() => {
    const handleUpdate = () => onRefresh();
    window.addEventListener('inventory-updated', handleUpdate);
    return () => window.removeEventListener('inventory-updated', handleUpdate);
  }, [onRefresh]);

  const handleSyncToSupabase = async () => {
    setIsSyncingSupabase(true);
    setSyncFeedback(null);
    try {
      const res = await store.syncAllInventoryToSupabase();
      if (res.successCount === res.total && res.total > 0) {
        setSyncFeedback({
          text: `ส่งข้อมูลสินค้าทั้งหมด ${res.successCount}/${res.total} รายการ เข้าตาราง Inventory_TB บน Supabase เรียบร้อยแล้ว!`,
          type: 'success'
        });
        setShowRlsHelp(false);
      } else if (res.successCount > 0) {
        setSyncFeedback({
          text: `ซิงค์สำเร็จ ${res.successCount}/${res.total} รายการ (พบข้อผิดพลาดบางส่วน)`,
          type: 'error'
        });
      } else {
        setSyncFeedback({
          text: `ไม่สามารถส่งข้อมูลได้: ติดระบบความปลอดภัย RLS ของ Supabase บนตาราง Inventory_TB`,
          type: 'error'
        });
        setShowRlsHelp(true);
      }
    } catch (err: any) {
      setSyncFeedback({
        text: `เกิดข้อผิดพลาดในการซิงค์: ${err.message}`,
        type: 'error'
      });
      setShowRlsHelp(true);
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  const handleCopyRlsSql = () => {
    const sql = `ALTER TABLE "Employee_TB" DISABLE ROW LEVEL SECURITY;\nALTER TABLE "Inventory_TB" DISABLE ROW LEVEL SECURITY;\nALTER TABLE "Summary_Expans_TB" DISABLE ROW LEVEL SECURITY;\nALTER TABLE "Summary_Self_TB" DISABLE ROW LEVEL SECURITY;`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    // Suggest next barcode ST0xx
    const maxSt = products.reduce((max, p) => {
      const match = p.barcode.match(/^ST(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        return Math.max(max, num);
      }
      return max;
    }, 0);
    const nextBarcode = `ST${(maxSt + 1).toString().padStart(3, '0')}`;

    setFormBarcode(nextBarcode);
    setFormName('');
    setFormUnit('อัน');
    setFormCostPrice(10);
    setFormSellPrice(15);
    setFormStockQty(0);
    setFormCategory('อุปกรณ์ทั่วไป');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormBarcode(p.barcode);
    setFormName(p.name);
    setFormUnit(p.unit);
    setFormCostPrice(p.costPrice);
    setFormSellPrice(p.sellPrice);
    setFormStockQty(p.stockQty);
    setFormCategory(p.category || 'อุปกรณ์ทั่วไป');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formBarcode.trim()) {
      setFormError('กรุณากรอกรหัสสินค้า / บาร์โค้ด');
      return;
    }
    if (!formName.trim()) {
      setFormError('กรุณากรอกชื่อรายการสินค้า');
      return;
    }

    if (editingProduct) {
      // Update
      store.updateProduct({
        ...editingProduct,
        barcode: formBarcode.trim().toUpperCase(),
        name: formName.trim(),
        unit: formUnit.trim(),
        costPrice: Number(formCostPrice) || 0,
        sellPrice: Number(formSellPrice) || 0,
        stockQty: Number(formStockQty) || 0,
        category: formCategory,
      });
    } else {
      // Check duplicate barcode
      if (products.some(p => p.barcode.toUpperCase() === formBarcode.trim().toUpperCase())) {
        setFormError(`รหัสสินค้า "${formBarcode}" มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`);
        return;
      }
      // Add
      store.addProduct({
        barcode: formBarcode.trim().toUpperCase(),
        name: formName.trim(),
        unit: formUnit.trim(),
        costPrice: Number(formCostPrice) || 0,
        sellPrice: Number(formSellPrice) || 0,
        stockQty: Number(formStockQty) || 0,
        receivedQty: Number(formStockQty) || 0,
        soldQty: 0,
        category: formCategory,
      });
    }

    setIsModalOpen(false);
    onRefresh();
  };

  const handleDeleteProduct = (p: Product) => {
    if (window.confirm(`ยืนยันการลบสินค้า "${p.name}" (รหัส: ${p.barcode}) หรือไม่?`)) {
      store.deleteProduct(p.id);
      onRefresh();
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลคลังสินค้าให้กลับไปเป็นค่าเริ่มต้นตามไฟล์ Excel (30 รายการ) หรือไม่?')) {
      store.resetProductsToDefault();
      onRefresh();
    }
  };

  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        p.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchSearch) return false;

    if (filterStatus === 'reorder') return p.status === 'สั่งซื้อ';
    if (filterStatus === 'normal') return p.status !== 'สั่งซื้อ';
    return true;
  });

  const exportCsv = () => {
    const headers = [
      'In_ID (ลำดับ)',
      'In_Bar (รหัส)',
      'In_Menu (รายการ)',
      'In_Unit (หน่วยนับ)',
      'In_Price_Cost (รับ_จำนวน)',
      'In_Count_Cost_IN (รับ_ราคา)',
      'In_Sum_Cost (รับ_รวม)',
      'In_Price_Self (ขาย_จำนวน)',
      'In_Count_Self (ขาย_ราคา)',
      'In_Sum_Self (ขาย_รวม)',
      'In_Date_Self (ว/ด/ป ขายล่าสุด)',
      'In_Qty (คงเหลือ_จำนวน)',
      'In_PriceSum (คงเหลือ_ราคา)',
      'In_SumSelf (คงเหลือ_รวม)',
      'In_Receipt (เลขที่ใบเสร็จ)',
      'In_Status (สถานะสินค้า)'
    ];
    const rows = products.map((p, idx) => [
      p.id || idx + 1,
      p.barcode || 'Empty',
      `"${p.name || 'Empty'}"`,
      p.unit || 'Empty',
      p.receivedQty !== undefined ? p.receivedQty : 'Empty',
      p.costPrice !== undefined ? p.costPrice : 'Empty',
      p.receivedTotal !== undefined ? p.receivedTotal : (p.receivedQty || 0) * (p.costPrice || 0),
      p.soldQty !== undefined ? p.soldQty : 'Empty',
      p.sellPrice !== undefined ? p.sellPrice : 'Empty',
      p.soldTotal !== undefined ? p.soldTotal : (p.soldQty || 0) * (p.sellPrice || 0),
      p.lastSaleDate || 'Empty',
      p.stockQty !== undefined ? p.stockQty : 'Empty',
      p.sellPrice !== undefined ? p.sellPrice : 'Empty',
      p.stockTotal !== undefined ? p.stockTotal : (p.stockQty || 0) * (p.sellPrice || 0),
      p.lastReceipt || 'Empty',
      p.status || 'Empty'
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Inventory_TB_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Requirement: Image Slot for this page */}
      <ImageSlot
        pageTitle="1. ระบบคลังสินค้า (Inventory Management)"
        folderPath="public/images/inventory/"
        defaultImagePath="/images/inventory/formal_banner.jpg"
        altText="ภาพหัวข้อระบบคลังสินค้า"
      />

      {/* Page Title & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#b2dfdb] text-[#00796b] rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-800">1. ระบบคลังสินค้า (Inventory Management)</h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#b2dfdb]/40 text-[#00796b] border border-[#b2dfdb]">
                  <Database className="w-3 h-3" />
                  ฐานข้อมูล: Inventory_TB
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#e0f2f1] text-[#004d40] border border-[#80cbc4]">
                  In_Price_Cost - In_Price_Self = In_Qty
                </span>
              </div>
              <p className="text-xs text-slate-500">
                สูตรคำนวณ: In_Price_Cost (ยอดรับเข้าสะสม) - In_Price_Self (ยอดขายออกสะสม) = In_Qty (คงเหลือในสต็อก)
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <button
              onClick={handleSyncToSupabase}
              disabled={isSyncingSupabase}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
              title="ส่งข้อมูลสินค้าทั้งหมด 30 รายการเข้าตาราง Inventory_TB บน Supabase"
            >
              {isSyncingSupabase ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-200" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>{isSyncingSupabase ? 'กำลังส่งข้อมูล...' : '⚡ ซิงค์เข้า Supabase (Inventory_TB)'}</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#8d6e63] hover:bg-[#5d4037] text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มสินค้าใหม่ (Admin)</span>
            </button>
          )}

          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition"
            title="ส่งออกเป็นไฟล์ CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ส่งออก CSV</span>
          </button>

          {isAdmin && (
            <button
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-medium transition"
              title="รีเซ็ตสินค้า 30 รายการเดิมจาก Excel"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ตตาม Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync Feedback Alert */}
      {syncFeedback && (
        <div className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs transition-all ${
          syncFeedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' 
            : 'bg-rose-50 text-rose-800 border border-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {syncFeedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{syncFeedback.text}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setSyncFeedback(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Supabase RLS Help if blocked */}
      {showRlsHelp && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-xs text-amber-900">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              วิธีปลดล็อกสิทธิ์บันทึกตาราง Inventory_TB ใน Supabase
            </span>
            <button onClick={() => setShowRlsHelp(false)} className="text-amber-500 hover:text-amber-800">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-amber-800">
            เปิด <strong>SQL Editor</strong> ใน Supabase แล้ววางคำสั่งนี้แล้วกด <strong>RUN</strong>:
          </p>
          <div className="relative">
            <pre className="text-[10px] bg-slate-900 text-emerald-300 p-2 rounded-lg font-mono overflow-x-auto leading-tight">
{`ALTER TABLE "Employee_TB" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Inventory_TB" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Summary_Expans_TB" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Summary_Self_TB" DISABLE ROW LEVEL SECURITY;`}
            </pre>
            <button
              type="button"
              onClick={handleCopyRlsSql}
              className="absolute right-2 top-2 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold rounded flex items-center gap-1 shadow-sm"
            >
              {copiedSql ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSql ? 'คัดลอกแล้ว!' : 'คัดลอก SQL'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาด้วยรหัสสินค้า (เช่น ST001) หรือชื่อสินค้า..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#b2dfdb] outline-none"
          />
        </div>

        <div className="flex items-center gap-1 text-xs">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 mr-1" />
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              filterStatus === 'all' ? 'bg-[#8d6e63] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({products.length})
          </button>
          <button
            onClick={() => setFilterStatus('reorder')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              filterStatus === 'reorder' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            ต้องสั่งซื้อ ({products.filter(p => p.status === 'สั่งซื้อ').length})
          </button>
          <button
            onClick={() => setFilterStatus('normal')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              filterStatus === 'normal' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            สต็อกปกติ ({products.filter(p => p.status !== 'สั่งซื้อ').length})
          </button>
        </div>
      </div>

      {/* Inventory Table matching Excel structure */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              {/* Row 1 Headers matching Excel Sheet 2 & Supabase Inventory_TB */}
              <tr className="bg-[#b2dfdb]/60 text-[#4e342e] border-b border-[#b2dfdb] font-semibold text-center">
                <th rowSpan={2} className="py-2.5 px-2 border-r border-slate-200 w-12" title="In_ID">ลำดับ</th>
                <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-200 w-20" title="In_Bar">รหัส</th>
                <th rowSpan={2} className="py-2.5 px-4 border-r border-slate-200 text-left min-w-[140px]" title="In_Menu">รายการ</th>
                <th rowSpan={2} className="py-2.5 px-2 border-r border-slate-200 w-16" title="In_Unit">หน่วยนับ</th>
                <th colSpan={3} className="py-1.5 px-3 border-r border-slate-200 bg-[#e0f2f1] text-[#004d40]">
                  รับสินค้า (In_Price_Cost)
                </th>
                <th colSpan={3} className="py-1.5 px-3 border-r border-slate-200 bg-[#fff3e0] text-[#e65100]">
                  ขายสินค้า (In_Price_Self)
                </th>
                <th colSpan={3} className="py-1.5 px-3 border-r border-slate-200 bg-[#d0f8ce]/60 text-[#1b5e20]">
                  คงเหลือ (In_Qty)
                </th>
                <th rowSpan={2} className="py-2.5 px-2.5 border-r border-slate-200 w-24 text-slate-700 font-semibold" title="In_Date_Self">
                  ว/ด/ป ขาย
                </th>
                <th rowSpan={2} className="py-2.5 px-2.5 border-r border-slate-200 w-28 text-slate-700 font-semibold" title="In_Receipt">
                  เลขที่ใบเสร็จ
                </th>
                <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-200 w-20" title="In_Status">สถานะ</th>
                <th rowSpan={2} className="py-2.5 px-2 w-16">จัดการ</th>
              </tr>
              {/* Row 2 Subheaders matching Excel Sheet 2 & Supabase Inventory_TB */}
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-center font-medium">
                <th className="py-1.5 px-2 border-r border-slate-200 bg-[#e0f2f1]/80 font-bold" title="In_Price_Cost">จำนวน</th>
                <th className="py-1.5 px-2 border-r border-slate-200 bg-[#e0f2f1]/80" title="In_Count_Cost_IN">ราคา</th>
                <th className="py-1.5 px-2 border-r border-slate-200 bg-[#e0f2f1]/80" title="In_Sum_Cost">รวม</th>
                <th className="py-1.5 px-2 border-r border-slate-200 bg-[#fff3e0]/80 font-bold" title="In_Price_Self">จำนวน</th>
                <th className="py-1.5 px-2 border-r border-slate-200 bg-[#fff3e0]/80" title="In_Count_Self">ราคา</th>
                <th className="py-1.5 px-2 border-r border-slate-200 bg-[#fff3e0]/80" title="In_Sum_Self">รวม</th>
                <th className="py-1.5 px-2 border-r border-slate-200 bg-[#d0f8ce]/80 font-bold" title="In_Qty = In_Price_Cost - In_Price_Self">จำนวน</th>
                <th className="py-1.5 px-2 border-r border-slate-200 bg-[#d0f8ce]/80" title="In_PriceSum">ราคา</th>
                <th className="py-1.5 px-2 border-r border-slate-200 bg-[#d0f8ce]/80 font-bold" title="In_SumSelf">รวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-8 text-center text-slate-400">
                    ไม่พบข้อมูลสินค้าที่ค้นหา
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p, idx) => {
                  const receivedQty = p.receivedQty !== undefined ? p.receivedQty : (p.stockQty + (p.soldQty || 0));
                  const receivedTotal = p.receivedTotal !== undefined ? p.receivedTotal : (receivedQty * (p.costPrice || 0));
                  const soldQty = p.soldQty !== undefined ? p.soldQty : 0;
                  const soldTotal = p.soldTotal !== undefined ? p.soldTotal : (soldQty * (p.sellPrice || 0));
                  const stockTotal = p.stockTotal !== undefined ? p.stockTotal : (p.stockQty * (p.sellPrice || 0));
                  const isLow = p.status === 'สั่งซื้อ';

                  return (
                    <tr 
                      key={p.id} 
                      className={`hover:bg-slate-50 transition-colors ${
                        isLow ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="py-2 px-2 text-center border-r border-slate-200 text-slate-500 font-mono">
                        {renderEmpty(p.id || idx + 1)}
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-200 font-mono font-bold text-slate-700">
                        {renderEmpty(p.barcode)}
                      </td>
                      <td className="py-2 px-4 border-r border-slate-200 font-medium text-slate-800">
                        {renderEmpty(p.name)}
                      </td>
                      <td className="py-2 px-2 text-center border-r border-slate-200 text-slate-600">
                        {renderEmpty(p.unit)}
                      </td>

                      {/* รับสินค้า (In_Price_Cost, In_Count_Cost_IN, In_Sum_Cost) */}
                      <td className="py-2 px-2 text-right border-r border-slate-200 text-slate-700 font-medium">
                        {renderEmpty(receivedQty)}
                      </td>
                      <td className="py-2 px-2 text-right border-r border-slate-200 text-slate-600">
                        {renderEmpty(p.costPrice, '฿')}
                      </td>
                      <td className="py-2 px-2 text-right border-r border-slate-200 font-mono text-slate-700">
                        {renderEmpty(receivedTotal ? receivedTotal.toLocaleString() : (receivedTotal === 0 ? '0' : null), '฿')}
                      </td>

                      {/* ขายสินค้า (In_Price_Self, In_Count_Self, In_Sum_Self) */}
                      <td className="py-2 px-2 text-right border-r border-slate-200 text-slate-700 font-medium">
                        {renderEmpty(soldQty)}
                      </td>
                      <td className="py-2 px-2 text-right border-r border-slate-200 text-slate-600">
                        {renderEmpty(p.sellPrice, '฿')}
                      </td>
                      <td className="py-2 px-2 text-right border-r border-slate-200 font-mono text-slate-700">
                        {renderEmpty(soldTotal ? soldTotal.toLocaleString() : (soldTotal === 0 ? '0' : null), '฿')}
                      </td>

                      {/* คงเหลือ (In_Qty, In_PriceSum, In_SumSelf) */}
                      <td className={`py-2 px-2 text-right border-r border-slate-200 font-bold ${
                        p.stockQty === 0 ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-700'
                      }`}>
                        {renderEmpty(p.stockQty)}
                      </td>
                      <td className="py-2 px-2 text-right border-r border-slate-200 text-slate-600">
                        {renderEmpty(p.sellPrice, '฿')}
                      </td>
                      <td className="py-2 px-2 text-right border-r border-slate-200 font-mono font-bold text-slate-800">
                        {renderEmpty(stockTotal ? stockTotal.toLocaleString() : (stockTotal === 0 ? '0' : null), '฿')}
                      </td>

                      {/* วันที่ขายล่าสุด (In_Date_Self) */}
                      <td className="py-2 px-2 text-center border-r border-slate-200 text-slate-600 font-mono">
                        {renderEmpty(p.lastSaleDate)}
                      </td>

                      {/* เลขที่ใบเสร็จล่าสุด (In_Receipt) */}
                      <td className="py-2 px-2 text-center border-r border-slate-200 font-mono text-slate-700">
                        {renderEmpty(p.lastReceipt)}
                      </td>

                      {/* สถานะสินค้า (In_Status) */}
                      <td className="py-2 px-2 text-center border-r border-slate-200">
                        {!p.status ? renderEmpty(null) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold text-[11px]">
                            <AlertTriangle className="w-3 h-3" />
                            สั่งซื้อ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                            <CheckCircle className="w-3 h-3" />
                            ปกติ
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isAdmin && (
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1 hover:bg-slate-200 text-slate-600 rounded transition"
                              title="แก้ไขสินค้า"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1 hover:bg-rose-100 text-rose-600 rounded transition"
                            title="ลบสินค้า"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add / Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-[#b2dfdb]">
            <div className="bg-gradient-to-r from-[#b2dfdb] via-[#d0f8ce] to-[#b2dfdb] p-4 flex items-center justify-between border-b border-[#80cbc4]">
              <div className="flex items-center gap-2 text-[#4e342e]">
                <Package className="w-5 h-5 text-[#8d6e63]" />
                <h3 className="font-bold text-base">
                  {editingProduct ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่ลงคลัง'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/40 text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รหัสสินค้า / บาร์โค้ด <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value.toUpperCase())}
                    placeholder="เช่น ST031"
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#b2dfdb] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    หน่วยนับ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="เช่น ด้าม, เล่ม, รีม, อัน, กล่อง"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#b2dfdb] outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อรายการสินค้า <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="เช่น ปากกาเจลลบได้ 0.5มม."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#b2dfdb] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ราคารับซื้อ (ต้นทุน)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#b2dfdb] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ราคาขายปลีก
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formSellPrice}
                    onChange={(e) => setFormSellPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#b2dfdb] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ยอดคงเหลือเริ่มต้น
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formStockQty}
                    onChange={(e) => setFormStockQty(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#b2dfdb] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมวดหมู่สินค้า
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#b2dfdb] outline-none"
                >
                  <option value="ปากกาและดินสอ">ปากกาและดินสอ</option>
                  <option value="สมุดและกระดาษ">สมุดและกระดาษ</option>
                  <option value="อุปกรณ์ลบและแก้ไข">อุปกรณ์ลบและแก้ไข</option>
                  <option value="อุปกรณ์วัด">อุปกรณ์วัด</option>
                  <option value="อุปกรณ์ตัด">อุปกรณ์ตัด</option>
                  <option value="กาวและเทป">กาวและเทป</option>
                  <option value="อุปกรณ์ศิลปะ">อุปกรณ์ศิลปะ</option>
                  <option value="แฟ้มและจัดเก็บ">แฟ้มและจัดเก็บ</option>
                  <option value="อุปกรณ์สำนักงาน">อุปกรณ์สำนักงาน</option>
                  <option value="อุปกรณ์ทั่วไป">อุปกรณ์ทั่วไป</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-100 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#8d6e63] hover:bg-[#5d4037] text-white rounded-lg text-xs font-semibold shadow-xs transition"
                >
                  {editingProduct ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
