import React, { useState } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Plus, 
  Trash2, 
  Download, 
  Printer, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  AlertCircle,
  X
} from 'lucide-react';
import { SaleRecord, PurchaseRecord, ExpenseRecord } from '../types';
import { store } from '../services/store';
import { ImageSlot } from '../components/ImageSlot';

interface IncomeExpensePageProps {
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
  expenses: ExpenseRecord[];
  onRefresh: () => void;
}

export const IncomeExpensePage: React.FC<IncomeExpensePageProps> = ({
  sales,
  purchases,
  expenses,
  onRefresh,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // YYYY-MM
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // Form for adding other expense
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState('ค่าใช้จ่ายทั่วไป');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));

  // Collect all unique dates across sales, purchases, and expenses
  const datesSet = new Set<string>();
  sales.forEach(s => datesSet.add(s.date));
  purchases.forEach(p => datesSet.add(p.date));
  expenses.forEach(e => datesSet.add(e.date));

  // If no records yet, add today
  const todayStr = new Date().toISOString().slice(0, 10);
  datesSet.add(todayStr);

  const sortedDates = Array.from(datesSet).sort().reverse();

  // Filter by month if selected
  const displayDates = selectedMonth
    ? sortedDates.filter(d => d.startsWith(selectedMonth))
    : sortedDates;

  // Build daily rows matching Excel Sheet 7
  const dailyRows = displayDates.map(date => {
    // 1. รายได้ (Income = Sales on this date)
    const income = sales
      .filter(s => s.date === date)
      .reduce((sum, s) => sum + s.netTotal, 0);

    // 2. ค่าใช้จ่าย (Purchases on this date)
    const purchaseCost = purchases
      .filter(p => p.date === date)
      .reduce((sum, p) => sum + p.netTotal, 0);

    // 3. ค่าใช้จ่ายอื่น (Other Expenses on this date)
    const otherCost = expenses
      .filter(e => e.date === date)
      .reduce((sum, e) => sum + e.amount, 0);

    // 4. กำไร / ขาดทุน = รายได้ - ค่าใช้จ่าย - ค่าใช้จ่ายอื่น
    const profit = income - purchaseCost - otherCost;

    return {
      date,
      description: `สรุปรายการประจำวัน (${date})`,
      income,
      purchaseCost,
      otherCost,
      profit
    };
  });

  const totalIncome = dailyRows.reduce((sum, r) => sum + r.income, 0);
  const totalPurchaseCost = dailyRows.reduce((sum, r) => sum + r.purchaseCost, 0);
  const totalOtherCost = dailyRows.reduce((sum, r) => sum + r.otherCost, 0);
  const totalExpenses = totalPurchaseCost + totalOtherCost;
  const netProfit = totalIncome - totalExpenses;

  const handleAddOtherExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || expAmount <= 0) {
      alert('กรุณากรอกรายการและจำนวนเงินที่ถูกต้อง');
      return;
    }

    store.addExpense({
      date: expDate,
      title: expTitle.trim(),
      category: expCategory,
      amount: expAmount,
      createdByName: 'แอดมิน/ผู้ใช้งาน',
    });

    setIsAddExpenseOpen(false);
    setExpTitle('');
    setExpAmount(0);
    onRefresh();
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('ยืนยันการลบค่าใช้จ่ายนี้?')) {
      store.deleteExpense(id);
      onRefresh();
    }
  };

  const exportCsv = () => {
    const headers = ['ว/ด/ป', 'รายการ', 'รายได้ (ขาย)', 'ค่าใช้จ่าย (ซื้อ)', 'ค่าใช้จ่ายอื่น', 'กำไร/ขาดทุน'];
    const rows = dailyRows.map(r => [
      r.date,
      `"${r.description}"`,
      r.income,
      r.purchaseCost,
      r.otherCost,
      r.profit
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Income_Expenses_${selectedMonth || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Image Slot for Income and Expense */}
      <ImageSlot
        pageTitle="6. สรุปยอดรายได้ค่าใช้จ่าย (Daily Income & Expenses)"
        folderPath="public/images/income-expense/"
        defaultImagePath="/images/income-expense/header.jpeg"
        altText="ภาพหัวข้อรายได้ค่าใช้จ่าย"
      />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">6. สรุปยอดรายได้ค่าใช้จ่าย (Income & Expenses)</h1>
            <p className="text-xs text-slate-500">
              สรุปราคาสุทธิของแต่ละวันและสรุปราคาขายสุทธิของแต่ละวัน ออกเป็นกำไรขาดทุน
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8d6e63] hover:bg-[#5d4037] text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ บันทึกค่าใช้จ่ายอื่น</span>
          </button>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ส่งออก CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">รายได้รวม (ยอดขาย)</div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
            ฿{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">ค่าใช้จ่ายซื้อสินค้าเข้า</div>
          <div className="text-xl font-bold font-mono text-blue-700 mt-1">
            ฿{totalPurchaseCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">ค่าใช้จ่ายอื่น</div>
          <div className="text-xl font-bold font-mono text-amber-700 mt-1">
            ฿{totalOtherCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs ${
          netProfit >= 0 ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50 border-rose-300'
        }`}>
          <div className="text-xs font-medium text-slate-700 flex items-center justify-between">
            <span>กำไร / ขาดทุน สุทธิ:</span>
            {netProfit >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-700" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-700" />
            )}
          </div>
          <div className={`text-xl font-bold font-mono mt-1 ${
            netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            {netProfit >= 0 ? '+' : ''}฿{netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Daily Table matching Excel Sheet 7: lncome and Expenses */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="font-bold text-xs sm:text-sm text-slate-800">
            ตารางสรุปรายได้และค่าใช้จ่ายประจำวัน (ว/ด/ป)
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">กรองตามเดือน:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white outline-none"
            />
            {selectedMonth && (
              <button
                onClick={() => setSelectedMonth('')}
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                ดูทั้งหมด
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#b2dfdb]/50 text-slate-800 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 w-32">ว/ด/ป (Date)</th>
                <th className="py-2.5 px-4">รายการ (Description)</th>
                <th className="py-2.5 px-4 text-right w-36 text-emerald-800">รายได้ (Income)</th>
                <th className="py-2.5 px-4 text-right w-36 text-blue-800">ค่าใช้จ่าย (Purchases)</th>
                <th className="py-2.5 px-4 text-right w-36 text-amber-800">ค่าใช้จ่ายอื่น (Others)</th>
                <th className="py-2.5 px-4 text-right w-36">กำไร / ขาดทุน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {dailyRows.map((row) => (
                <tr key={row.date} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{row.date}</td>
                  <td className="py-2.5 px-4 text-slate-700 font-medium">{row.description}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                    ฿{row.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-blue-700">
                    ฿{row.purchaseCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-amber-700">
                    ฿{row.otherCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`py-2.5 px-4 text-right font-mono font-bold ${
                    row.profit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {row.profit >= 0 ? '+' : ''}฿{row.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#d0f8ce]/60 font-bold text-slate-800 border-t-2 border-slate-300">
              <tr>
                <td colSpan={2} className="py-3 px-4 text-right">ยอดรวมสุทธิ:</td>
                <td className="py-3 px-4 text-right font-mono text-emerald-800 text-sm">
                  ฿{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-right font-mono text-blue-800 text-sm">
                  ฿{totalPurchaseCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-right font-mono text-amber-800 text-sm">
                  ฿{totalOtherCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className={`py-3 px-4 text-right font-mono text-sm ${
                  netProfit >= 0 ? 'text-emerald-800 font-extrabold' : 'text-rose-800 font-extrabold'
                }`}>
                  {netProfit >= 0 ? '+' : ''}฿{netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Other Expenses List */}
      {expenses.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
          <h3 className="font-bold text-slate-800 text-xs sm:text-sm mb-3">
            รายการบันทึกค่าใช้จ่ายอื่นย่อย ({expenses.length} รายการ)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="py-2 px-3">วันที่</th>
                  <th className="py-2 px-3">รายการค่าใช้จ่าย</th>
                  <th className="py-2 px-3">หมวดหมู่</th>
                  <th className="py-2 px-3 text-right">จำนวนเงิน</th>
                  <th className="py-2 px-2 text-center">ลบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono">{e.date}</td>
                    <td className="py-2 px-3 font-medium text-slate-800">{e.title}</td>
                    <td className="py-2 px-3 text-slate-500">{e.category}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-amber-700">฿{e.amount}</td>
                    <td className="py-2 px-2 text-center">
                      <button
                        onClick={() => handleDeleteExpense(e.id)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for adding other expense */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-[#b2dfdb]">
            <div className="bg-gradient-to-r from-[#b2dfdb] to-[#d0f8ce] p-4 flex items-center justify-between border-b border-[#80cbc4]">
              <div className="flex items-center gap-2 text-[#4e342e]">
                <Plus className="w-5 h-5 text-[#8d6e63]" />
                <h3 className="font-bold text-base">บันทึกค่าใช้จ่ายอื่น</h3>
              </div>
              <button 
                onClick={() => setIsAddExpenseOpen(false)}
                className="p-1 rounded-full hover:bg-white/40 text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddOtherExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันที่เกิดค่าใช้จ่าย
                </label>
                <input
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#b2dfdb] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อรายการค่าใช้จ่าย <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="เช่น ค่าไฟร้าน, ค่าส่งพัสดุ, ค่าถุงพลาสติก"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#b2dfdb] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมวดหมู่ค่าใช้จ่าย
                </label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#b2dfdb] outline-none"
                >
                  <option value="ค่าสาธารณูปโภค (น้ำ/ไฟ)">ค่าสาธารณูปโภค (น้ำ/ไฟ)</option>
                  <option value="ค่าขนส่งและเดินทาง">ค่าขนส่งและเดินทาง</option>
                  <option value="ค่าบรรจุภัณฑ์และถุง">ค่าบรรจุภัณฑ์และถุง</option>
                  <option value="ค่าเช่าพื้นที่">ค่าเช่าพื้นที่</option>
                  <option value="ค่าใช้จ่ายทั่วไป">ค่าใช้จ่ายทั่วไป</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  จำนวนเงิน (บาท) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={expAmount}
                  onChange={(e) => setExpAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#b2dfdb] outline-none"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-100 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#8d6e63] hover:bg-[#5d4037] text-white rounded-lg text-xs font-semibold shadow-xs transition"
                >
                  บันทึกรายการ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
