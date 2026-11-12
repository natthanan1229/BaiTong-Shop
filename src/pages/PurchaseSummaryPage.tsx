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
  Database
} from 'lucide-react';
import { PurchaseRecord } from '../types';
import { ImageSlot } from '../components/ImageSlot';
import { supabaseService } from '../services/supabaseService';

interface PurchaseSummaryPageProps {
  purchases: PurchaseRecord[];
}

export const PurchaseSummaryPage: React.FC<PurchaseSummaryPageProps> = ({ purchases }) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Flatten items for table display matching Excel Total Purchase Sheet
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

  const exportCsv = () => {
    const headers = ['Date', 'Name', "Q'ty", 'Unit', 'ราคาต่อหน่วย', 'ยอดรวม', 'ยอดรวมสุทธิ'];
    const rows = filteredRows.map(r => [
      r.date,
      `"${r.name}"`,
      r.qty,
      r.unit,
      r.unitPrice,
      r.total,
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

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-800">3. ระบบสรุปยอดซื้อสินค้า (Total Purchase)</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#b2dfdb]/40 text-[#00796b] border border-[#b2dfdb]">
                <Database className="w-3 h-3" />
                Inventory_TB (SELECT In_Date, In_Bar, In_Menu, In_Qty, In_Price_Cost, In_Sum_Cost)
              </span>
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
                <th className="py-2.5 px-3 text-center w-28">ผู้บันทึก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    ไม่พบรายการซื้อสินค้าตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr key={`${row.purchaseId}-${idx}`} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{row.date}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{row.barcode}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">{row.name}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-700">{row.qty}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{row.unit}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">฿{row.unitPrice}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                      ฿{row.total.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-500">{row.buyer}</td>
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
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
