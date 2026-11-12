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
  Database
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
    const headers = ['ลำดับ', 'รหัส', 'รายการ', 'หน่วยนับ', 'รับ_จำนวน', 'รับ_ราคา', 'รับ_รวม', 'ขาย_จำนวน', 'ขาย_ราคา', 'ขาย_รวม', 'คงเหลือ_จำนวน', 'คงเหลือ_ราคา', 'คงเหลือ_รวม', 'สถานะสินค้า'];
    const rows = products.map((p, idx) => [
      idx + 1,
      p.barcode,
      `"${p.name}"`,
      p.unit,
      p.receivedQty || 0,
      p.costPrice,
      (p.receivedQty || 0) * p.costPrice,
      p.soldQty || 0,
      p.sellPrice,
      (p.soldQty || 0) * p.sellPrice,
      p.stockQty,
      p.sellPrice,
      p.stockQty * p.sellPrice,
      p.status
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Inventory_Stock_${new Date().toISOString().slice(0, 10)}.csv`);
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
              </div>
              <p className="text-xs text-slate-500">
                บันทึกรับสินค้าจากยอดซื้อและบันทึกจ่ายจากยอดขาย ยอดคงเหลือไม่ตั้งเป็นศูนย์อัตโนมัติ และสามารถลบสินค้าได้
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
              {/* Row 1 Headers matching Excel Sheet 2 */}
              <tr className="bg-[#b2dfdb]/60 text-[#4e342e] border-b border-[#b2dfdb] font-semibold text-center">
                <th rowSpan={2} className="py-2.5 px-2 border-r border-slate-200 w-12">ลำดับ</th>
                <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-200 w-20">รหัส</th>
                <th rowSpan={2} className="py-2.5 px-4 border-r border-slate-200 text-left min-w-[160px]">รายการ</th>
                <th rowSpan={2} className="py-2.5 px-2 border-r border-slate-200 w-16">หน่วยนับ</th>
                <th colSpan={3} className="py-1.5 px-3 border-r border-slate-200 bg-[#e0f2f1] text-[#004d40]">รับสินค้า</th>
                <th colSpan={3} className="py-1.5 px-3 border-r border-slate-200 bg-[#fff3e0] text-[#e65100]">ขายสินค้า</th>
                <th colSpan={3} className="py-1.5 px-3 border-r border-slate-200 bg-[#d0f8ce]/60 text-[#1b5e20]">คงเหลือ</th>
                <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-200 w-24">สถานะสินค้า</th>
                <th rowSpan={2} className="py-2.5 px-2 w-20">จัดการ</th>
              </tr>
              {/* Row 2 Subheaders matching Excel Sheet 2 */}
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-center font-medium">
                <th className="py-1.5 px-2 border-r border-slate-200 bg-[#e0f2f1]/80">จำนวน</th>
                <th className="py-1.5 px-2 border-r border-slate-200 bg-[#e0f2f1]/80">ราคา</th>
                <th className="py-1.5 px-2 border-r border-slate-200 bg-[#e0f2f1]/80">รวม</th>
                <th className="py-1.5 px-2 border-r border-slate-200 bg-[#fff3e0]/80">จำนวน</th>
                <th className="py-1.5 px-2 border-r border-slate-200 bg-[#fff3e0]/80">ราคา</th>
                <th className="py-1.5 px-2 border-r border-slate-200 bg-[#fff3e0]/80">รวม</th>
                <th className="py-1.5 px-2 border-r border-slate-200 bg-[#d0f8ce]/80 font-bold">จำนวน</th>
                <th className="py-1.5 px-2 border-r border-slate-200 bg-[#d0f8ce]/80">ราคา</th>
                <th className="py-1.5 px-2 border-r border-slate-200 bg-[#d0f8ce]/80 font-bold">รวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-slate-400">
                    ไม่พบข้อมูลสินค้าที่ค้นหา
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p, idx) => {
                  const receivedQty = p.receivedQty || 0;
                  const receivedTotal = receivedQty * p.costPrice;
                  const soldQty = p.soldQty || 0;
                  const soldTotal = soldQty * p.sellPrice;
                  const stockTotal = p.stockQty * p.sellPrice;
                  const isLow = p.status === 'สั่งซื้อ';

                  return (
                    <tr 
                      key={p.id} 
                      className={`hover:bg-slate-50 transition-colors ${
                        isLow ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="py-2 px-2 text-center border-r border-slate-200 text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-200 font-mono font-bold text-slate-700">
                        {p.barcode}
                      </td>
                      <td className="py-2 px-4 border-r border-slate-200 font-medium text-slate-800">
                        {p.name}
                      </td>
                      <td className="py-2 px-2 text-center border-r border-slate-200 text-slate-600">
                        {p.unit}
                      </td>

                      {/* รับสินค้า */}
                      <td className="py-2 px-2 text-right border-r border-slate-200 text-slate-700">
                        {receivedQty}
                      </td>
                      <td className="py-2 px-2 text-right border-r border-slate-200 text-slate-600">
                        ฿{p.costPrice}
                      </td>
                      <td className="py-2 px-2 text-right border-r border-slate-200 font-mono text-slate-700">
                        ฿{receivedTotal.toLocaleString()}
                      </td>

                      {/* ขายสินค้า */}
                      <td className="py-2 px-2 text-right border-r border-slate-200 text-slate-700">
                        {soldQty}
                      </td>
                      <td className="py-2 px-2 text-right border-r border-slate-200 text-slate-600">
                        ฿{p.sellPrice}
                      </td>
                      <td className="py-2 px-2 text-right border-r border-slate-200 font-mono text-slate-700">
                        ฿{soldTotal.toLocaleString()}
                      </td>

                      {/* คงเหลือ */}
                      <td className={`py-2 px-2 text-right border-r border-slate-200 font-bold ${
                        p.stockQty === 0 ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-700'
                      }`}>
                        {p.stockQty}
                      </td>
                      <td className="py-2 px-2 text-right border-r border-slate-200 text-slate-600">
                        ฿{p.sellPrice}
                      </td>
                      <td className="py-2 px-2 text-right border-r border-slate-200 font-mono font-bold text-slate-800">
                        ฿{stockTotal.toLocaleString()}
                      </td>

                      {/* สถานะสินค้า */}
                      <td className="py-2 px-2 text-center border-r border-slate-200">
                        {isLow ? (
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
