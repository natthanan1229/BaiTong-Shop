import React, { useState } from 'react';
import { 
  FileText, 
  Calendar, 
  Download, 
  Printer, 
  Search, 
  DollarSign, 
  Boxes, 
  Receipt,
  Database,
  Trash2,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { PurchaseRecord, AuthSession } from '../types';
import { ImageSlot } from '../components/ImageSlot';
import { supabaseService } from '../services/supabaseService';
import { store } from '../services/store';

interface PurchaseSummaryPageProps {
  purchases: PurchaseRecord[];
  session?: AuthSession;
  isAdmin?: boolean;
  onRefresh?: () => void;
}

export const PurchaseSummaryPage: React.FC<PurchaseSummaryPageProps> = ({ 
  purchases,
  session,
  isAdmin: propIsAdmin,
  onRefresh
}) => {
  const isAdmin = propIsAdmin ?? (session?.role === 'admin');

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleManualRefresh = async () => {
    setIsSyncing(true);
    await store.triggerImmediateSync();
    if (onRefresh) onRefresh();
    setIsSyncing(false);
  };

  // Flatten items for table display matching Excel Total Purchase Sheet & Supabase Summary_Purch_TB / Inventory_TB
  const allRows: Array<{
    purchaseId: string;
    date: string;
    time: string;
    barcode: string;
    name: string;
    qty: number;
    unit: string;
    unitPrice: number;
    total: number;
    buyer: string;
  }> = [];

  if (purchases && purchases.length > 0) {
    purchases.forEach(p => {
      p.items.forEach(item => {
        allRows.push({
          purchaseId: p.id,
          date: p.date,
          time: p.time,
          barcode: item.barcode,
          name: item.name,
          qty: item.quantity,
          unit: item.unit,
          unitPrice: item.price,
          total: item.total,
          buyer: p.createdByName,
        });
      });
    });
  } else {
    // Seamless fallback to Inventory_TB when countCostIn > 0
    const currentProducts = store.getProducts().filter(p => p.countCostIn && p.countCostIn > 0);
    currentProducts.forEach(prod => {
      const qty = prod.countCostIn || 0;
      const price = prod.costPrice || 0;
      allRows.push({
        purchaseId: 'PO-INV-' + prod.barcode,
        date: new Date().toISOString().slice(0, 10),
        time: '10:00:00',
        barcode: prod.barcode,
        name: prod.name,
        qty: qty,
        unit: prod.unit || 'ชิ้น',
        unitPrice: price,
        total: prod.sumCost ?? (qty * price),
        buyer: 'ADMIN',
      });
    });
  }

  // Filter rows
  const filteredRows = allRows.filter(row => {
    if (selectedDate && row.date !== selectedDate) return false;
    if (searchTerm) {
      const match = row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    row.barcode.toLowerCase().includes(searchTerm.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  const totalSpent = filteredRows.reduce((sum, r) => sum + r.total, 0);
  const totalItemsCount = filteredRows.reduce((sum, r) => sum + r.qty, 0);

  const handleDeleteRow = async (row: typeof allRows[0]) => {
    if (!isAdmin) {
      alert('เฉพาะผู้ดูแลระบบ (ADMIN) เท่านั้นที่สามารถลบรายการซื้อสินค้าได้');
      return;
    }

    const confirmMsg = `คุณแน่ใจหรือไม่ว่าต้องการลบรายการซื้อสินค้านี้?\n\n` +
      `• รายการสินค้า: ${row.name}\n` +
      `• Barcode: ${row.barcode}\n` +
      `• จำนวน: ${row.qty} ${row.unit}\n` +
      `• ยอดรวม: ฿${row.total.toLocaleString()}\n` +
      `• เลขที่ใบสั่งซื้อ: ${row.purchaseId}\n\n` +
      `* ข้อมูลจะถูกลบออกจากระบบสรุปยอดซื้อ และจำนวนสินค้า ${row.qty} ชิ้นจะถูกปรับลดยอดรับเข้าออกจากคลังสินค้าอัตโนมัติ`;

    if (!window.confirm(confirmMsg)) return;

    setIsDeleting(true);
    try {
      const res = await store.deletePurchaseItem(row.purchaseId, row.barcode, row.qty, true);
      if (res.success) {
        setFeedback({ text: res.message, type: 'success' });
        if (onRefresh) onRefresh();
      } else {
        setFeedback({ text: res.message, type: 'error' });
      }
    } catch (err: any) {
      setFeedback({ text: err?.message || 'เกิดข้อผิดพลาดในการลบรายการ', type: 'error' });
    } finally {
      setIsDeleting(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const exportCsv = () => {
    const headers = ['Date', 'Barcode', 'Name', "Q'ty", 'Unit', 'ราคาต่อหน่วย', 'ยอดรวม', 'แคชเชียร์', 'ยอดรวมสุทธิ'];
    const rows = filteredRows.map(r => [
      r.date,
      r.barcode,
      `"${r.name}"`,
      r.qty,
      r.unit,
      r.unitPrice,
      r.total,
      `"${store.resolveUserName(r.buyer)}"`,
      totalSpent
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Purchase_Summary_${selectedDate || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Image Slot for Purchase Summary */}
      <ImageSlot
        pageTitle="3. ระบบสรุปยอดซื้อสินค้า (Total Purchase Summary)"
        folderPath="public/images/purchase-summary/"
        defaultImagePath="/images/purchase-summary/formal_banner.jpg"
        altText="ภาพหัวข้อสรุปยอดซื้อสินค้า"
      />

      {/* Live Operational Status Banner for ADMIN & Users */}
      <div className="bg-gradient-to-r from-blue-50 via-teal-50 to-emerald-50 p-3 rounded-xl border border-blue-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-blue-900">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
          </span>
          <span className="font-semibold">สถานะการทำงาน:</span>
          <span>ระบบสรุปยอดซื้อเชื่อมต่อฐานข้อมูล BsitongProject (ตาราง Summary_Purch_TB & Inventory_TB)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-blue-700 bg-white/80 px-2.5 py-0.5 rounded-full border border-blue-200">
            แสดงข้อมูลทั้งหมด {allRows.length} รายการ (ซิงค์อัตโนมัติทุกเครื่อง)
          </span>
          <button
            onClick={handleManualRefresh}
            disabled={isSyncing}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-800 text-[11px] font-semibold rounded-lg border border-blue-300 shadow-2xs transition active:scale-95 disabled:opacity-50"
            title="กดเพื่อดึงข้อมูลล่าสุดจากฐานข้อมูล BsitongProject ทันที"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'กำลังดึงข้อมูล...' : 'อัปเดตข้อมูลด่วน'}</span>
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-800">3. ระบบสรุปยอดซื้อสินค้า (Total Purchase)</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#b2dfdb]/40 text-[#00796b] border border-[#b2dfdb]">
                <Database className="w-3 h-3" />
                Inventory_TB (SELECT In_Date, In_Bar, In_Menu, In_Qty, In_Price_Cost, In_Sum_Cost)
              </span>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                  โหมด ADMIN: สามารถลบรายการสินค้าและปรับลดยอดรับเข้าคลังได้
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              สรุปรายการซื้อสินค้าของแต่ละวัน ระบุชื่อสินค้า จำนวน ราคาสินค้า และคำนวณราคาสุทธิ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ส่งออก CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์รายงาน</span>
          </button>
        </div>
      </div>

      {/* Feedback Notification */}
      {feedback && (
        <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-xs transition-all animate-in fade-in ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
            : 'bg-rose-50 text-rose-800 border-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-100 text-blue-700">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500">ยอดรวมสุทธิ (Net Total)</div>
            <div className="text-xl font-bold font-mono text-blue-700">
              ฿{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-lg bg-teal-100 text-[#00796b]">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500">จำนวนสินค้ารวมที่ซื้อ</div>
            <div className="text-xl font-bold font-mono text-slate-800">
              {totalItemsCount.toLocaleString()} ชิ้น
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-100 text-emerald-700">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500">จำนวนใบสั่งซื้อ</div>
            <div className="text-xl font-bold font-mono text-slate-800">
              {purchases.length} รายการ
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Date Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>เลือกดูตามวัน:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white px-2 py-0.5 rounded border border-slate-300 text-xs outline-none"
            />
          </div>

          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="px-2.5 py-1 text-xs text-blue-600 hover:underline font-medium"
            >
              แสดงทุกวัน
            </button>
          )}
        </div>

        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อสินค้า / รหัส..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
          />
        </div>
      </div>

      {/* Table matching Excel Sheet 4 Total Purchase */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#b2dfdb]/50 text-slate-800 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
                <th className="py-2.5 px-3 w-28">Date (วันที่)</th>
                <th className="py-2.5 px-3 w-24">Barcode</th>
                <th className="py-2.5 px-4">Name (ชื่อสินค้า)</th>
                <th className="py-2.5 px-3 text-center w-24">Q'ty (จำนวน)</th>
                <th className="py-2.5 px-3 text-center w-20">Unit (หน่วย)</th>
                <th className="py-2.5 px-3 text-right w-28">ราคาต่อหน่วย</th>
                <th className="py-2.5 px-3 text-right w-28">ยอดรวม</th>
                <th className="py-2.5 px-3 text-center w-32">แคชเชียร์</th>
                {isAdmin && (
                  <th className="py-2.5 px-3 text-center w-24 text-rose-700 font-bold">
                    จัดการ (ADMIN)
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 10 : 9} className="py-12 text-center text-slate-400">
                    ไม่พบรายการซื้อสินค้าตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr key={`${row.purchaseId}-${row.barcode}-${idx}`} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {row.date || <span className="text-[10px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded">Empty</span>}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                      {row.barcode || <span className="text-[10px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded">Empty</span>}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">
                      {row.name || <span className="text-[10px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded">Empty</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-700">{row.qty}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">
                      {row.unit || <span className="text-[10px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded">Empty</span>}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">฿{row.unitPrice}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                      ฿{row.total.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-700">
                      {row.buyer ? (
                        <div>
                          <div className="font-medium text-slate-800">
                            {store.resolveUserName(row.buyer)}
                          </div>
                          {store.resolveUserDetails(row.buyer).userId && store.resolveUserDetails(row.buyer).userId !== store.resolveUserName(row.buyer) && (
                            <div className="text-[10px] font-mono text-slate-400">
                              {store.resolveUserDetails(row.buyer).userId}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded">Empty</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row)}
                          disabled={isDeleting}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 transition shadow-2xs hover:shadow-xs active:scale-95 disabled:opacity-50"
                          title={`ลบรายการ "${row.name}" ออกจากสรุปยอดซื้อ (ปรับลดยอดรับเข้าคลัง)`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>ลบ</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
            {filteredRows.length > 0 && (
              <tfoot className="bg-[#d0f8ce]/60 font-bold text-slate-800 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-right">
                    ยอดรวมสุทธิ (Grand Total):
                  </td>
                  <td className="py-3 px-3 text-center text-slate-900 font-mono">
                    {totalItemsCount}
                  </td>
                  <td colSpan={2}></td>
                  <td className="py-3 px-3 text-right text-blue-800 font-mono text-sm">
                    ฿{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                  {isAdmin && <td></td>}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
