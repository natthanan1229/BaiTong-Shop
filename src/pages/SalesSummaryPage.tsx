import React, { useState } from 'react';
import { 
  TrendingUp, 
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
  ShieldCheck
} from 'lucide-react';
import { SaleRecord, AuthSession } from '../types';
import { ImageSlot } from '../components/ImageSlot';
import { store } from '../services/store';

interface SalesSummaryPageProps {
  sales: SaleRecord[];
  session?: AuthSession;
  isAdmin?: boolean;
  onRefresh?: () => void;
}

export const SalesSummaryPage: React.FC<SalesSummaryPageProps> = ({ 
  sales,
  session,
  isAdmin: propIsAdmin,
  onRefresh
}) => {
  const isAdmin = propIsAdmin ?? (session?.role === 'admin');

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Flatten items for table display matching Excel Total Sales Sheet
  const allRows: Array<{
    receiptNumber: string;
    date: string;
    time: string;
    barcode: string;
    name: string;
    qty: number;
    unit: string;
    unitPrice: number;
    total: number;
    cashier: string;
  }> = [];

  sales.forEach(s => {
    s.items.forEach(item => {
      allRows.push({
        receiptNumber: s.receiptNumber,
        date: s.date,
        time: s.time,
        barcode: item.barcode,
        name: item.name,
        qty: item.quantity,
        unit: item.unit,
        unitPrice: item.price,
        total: item.total,
        cashier: s.createdByName,
      });
    });
  });

  // Filter rows
  const filteredRows = allRows.filter(row => {
    if (selectedDate && row.date !== selectedDate) return false;
    if (searchTerm) {
      const match = row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    row.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    row.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  const totalRevenue = filteredRows.reduce((sum, r) => sum + r.total, 0);
  const totalItemsCount = filteredRows.reduce((sum, r) => sum + r.qty, 0);

  const handleDeleteRow = async (row: typeof allRows[0]) => {
    if (!isAdmin) {
      alert('เฉพาะผู้ดูแลระบบ (ADMIN) เท่านั้นที่สามารถลบรายการสินค้าได้');
      return;
    }

    const confirmMsg = `คุณแน่ใจหรือไม่ว่าต้องการลบรายการขายนี้?\n\n` +
      `• รายการสินค้า: ${row.name}\n` +
      `• Barcode: ${row.barcode}\n` +
      `• จำนวน: ${row.qty} ชิ้น\n` +
      `• ยอดรวม: ฿${row.total.toLocaleString()}\n` +
      `• เลขที่ใบเสร็จ: ${row.receiptNumber}\n\n` +
      `* ข้อมูลจะถูกลบออกจากระบบสรุปยอดขาย และจำนวนสินค้า ${row.qty} ชิ้นจะถูกคืนเข้าคลังสินค้าอัตโนมัติ`;

    if (!window.confirm(confirmMsg)) return;

    setIsDeleting(true);
    try {
      const res = await store.deleteSaleItem(row.receiptNumber, row.barcode, row.qty, true);
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
    const headers = ['วันที่', 'เลขที่ใบเสร็จ', 'รหัสสินค้า', 'รายการสินค้า', 'จำนวน', 'หน่วยละ', 'รวม', 'ยอดรวมสุทธิ'];
    const rows = filteredRows.map(r => [
      r.date,
      r.receiptNumber,
      r.barcode,
      `"${r.name}"`,
      r.qty,
      r.unitPrice,
      r.total,
      totalRevenue
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Sales_Summary_${selectedDate || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Image Slot for Sales Summary */}
      <ImageSlot
        pageTitle="5. ระบบสรุปยอดขายสินค้า (Total Sales Summary)"
        folderPath="public/images/sales-summary/"
        defaultImagePath="/images/sales-summary/formal_banner.jpg"
        altText="ภาพหัวข้อสรุปยอดขายสินค้า"
      />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-800">5. ระบบสรุปยอดขายสินค้า (Total Sales)</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                <Database className="w-3 h-3" />
                Summary_Self_TB (SELECT เรียกดูของจาก Inventory_TB เพื่อวิเคราะห์)
              </span>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                  โหมด ADMIN: สามารถลบรายการสินค้าและคืนสต็อกเข้าคลังได้
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              สรุปรายการขายสินค้าของแต่ละวัน ระบุชื่อสินค้า จำนวนสินค้า ราคาสินค้า และคำนวณราคาสุทธิ
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
          <div className="p-3 rounded-lg bg-emerald-100 text-emerald-700">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500">ยอดขายรวมสุทธิ (Total Sales)</div>
            <div className="text-xl font-bold font-mono text-emerald-700">
              ฿{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-lg bg-purple-100 text-purple-700">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500">จำนวนชิ้นที่ขายได้</div>
            <div className="text-xl font-bold font-mono text-slate-800">
              {totalItemsCount.toLocaleString()} ชิ้น
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-lg bg-amber-100 text-amber-700">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500">จำนวนบิลขาย (Orders)</div>
            <div className="text-xl font-bold font-mono text-slate-800">
              {sales.length} บิล
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
              className="px-2.5 py-1 text-xs text-purple-600 hover:underline font-medium"
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
            placeholder="ค้นหาชื่อสินค้า / รหัส / เลขที่บิล..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none"
          />
        </div>
      </div>

      {/* Table matching Excel Sheet 6 Total Sales */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#d0f8ce]/60 text-slate-800 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
                <th className="py-2.5 px-3 w-28">วันที่ (Date)</th>
                <th className="py-2.5 px-3 w-32">เลขที่ใบเสร็จ</th>
                <th className="py-2.5 px-3 w-24">Barcode</th>
                <th className="py-2.5 px-4">รายการสินค้า</th>
                <th className="py-2.5 px-3 text-center w-20">จำนวน</th>
                <th className="py-2.5 px-3 text-right w-24">หน่วยละ</th>
                <th className="py-2.5 px-3 text-right w-28">รวม</th>
                <th className="py-2.5 px-3 text-center w-28">แคชเชียร์</th>
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
                    ไม่พบรายการขายสินค้าตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr key={`${row.receiptNumber}-${row.barcode}-${idx}`} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {row.date || <span className="text-[10px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded">Empty</span>}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                      {row.receiptNumber || <span className="text-[10px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded">Empty</span>}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                      {row.barcode || <span className="text-[10px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded">Empty</span>}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">
                      {row.name || <span className="text-[10px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded">Empty</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-700">{row.qty}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">฿{row.unitPrice}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                      ฿{row.total.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-500">
                      {row.cashier || <span className="text-[10px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded">Empty</span>}
                    </td>
                    {isAdmin && (
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row)}
                          disabled={isDeleting}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 transition shadow-2xs hover:shadow-xs active:scale-95 disabled:opacity-50"
                          title={`ลบรายการ "${row.name}" ออกจากสรุปยอดขาย (คืนสต็อกเข้าคลัง)`}
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
              <tfoot className="bg-[#b2dfdb]/50 font-bold text-slate-800 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={5} className="py-3 px-4 text-right">
                    ยอดรวมสุทธิ (Grand Total):
                  </td>
                  <td className="py-3 px-3 text-center text-slate-900 font-mono">
                    {totalItemsCount}
                  </td>
                  <td></td>
                  <td className="py-3 px-3 text-right text-emerald-800 font-mono text-sm">
                    ฿{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
