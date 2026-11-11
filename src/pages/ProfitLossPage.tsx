import React from 'react';
import { 
  BadgePercent, 
  Calendar, 
  Download, 
  Printer, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  PieChart
} from 'lucide-react';
import { SaleRecord, PurchaseRecord, ExpenseRecord } from '../types';
import { ImageSlot } from '../components/ImageSlot';

interface ProfitLossPageProps {
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
  expenses: ExpenseRecord[];
}

export const ProfitLossPage: React.FC<ProfitLossPageProps> = ({
  sales,
  purchases,
  expenses,
}) => {
  // Collect all unique year-months (YYYY-MM)
  const monthSet = new Set<string>();
  sales.forEach(s => monthSet.add(s.date.slice(0, 7)));
  purchases.forEach(p => monthSet.add(p.date.slice(0, 7)));
  expenses.forEach(e => monthSet.add(e.date.slice(0, 7)));

  // If empty, add current month
  const currentYm = new Date().toISOString().slice(0, 7);
  monthSet.add(currentYm);

  // Month Thai Name formatter
  const formatMonthThai = (ym: string) => {
    const [year, month] = ym.split('-');
    const monthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const mIdx = parseInt(month, 10) - 1;
    const thaiYear = parseInt(year, 10) + 543;
    return `${monthNames[mIdx] || month} ${thaiYear} (${ym})`;
  };

  const sortedMonths = Array.from(monthSet).sort().reverse();

  // Aggregate monthly rows matching Excel Sheet 8: Monthly Expense Summary
  const monthlyRows = sortedMonths.map(ym => {
    const monthlyIncome = sales
      .filter(s => s.date.startsWith(ym))
      .reduce((sum, s) => sum + s.netTotal, 0);

    const monthlyPurchases = purchases
      .filter(p => p.date.startsWith(ym))
      .reduce((sum, p) => sum + p.netTotal, 0);

    const monthlyOthers = expenses
      .filter(e => e.date.startsWith(ym))
      .reduce((sum, e) => sum + e.amount, 0);

    const monthlyExpenses = monthlyPurchases + monthlyOthers;
    const profit = monthlyIncome - monthlyExpenses;

    const profitMargin = monthlyIncome > 0 ? (profit / monthlyIncome) * 100 : 0;

    return {
      ym,
      monthLabel: formatMonthThai(ym),
      income: monthlyIncome,
      expenses: monthlyExpenses,
      purchases: monthlyPurchases,
      others: monthlyOthers,
      profit,
      profitMargin
    };
  });

  const totalAllIncome = monthlyRows.reduce((sum, r) => sum + r.income, 0);
  const totalAllExpenses = monthlyRows.reduce((sum, r) => sum + r.expenses, 0);
  const totalAllProfit = totalAllIncome - totalAllExpenses;
  const overallMargin = totalAllIncome > 0 ? (totalAllProfit / totalAllIncome) * 100 : 0;

  const exportCsv = () => {
    const headers = ['เดือน', 'รายได้', 'ค่าใช้จ่าย', 'กำไร/ขาดทุน', 'อัตรากำไร (%)'];
    const rows = monthlyRows.map(r => [
      `"${r.monthLabel}"`,
      r.income,
      r.expenses,
      r.profit,
      r.profitMargin.toFixed(2)
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Monthly_Profit_Loss_${currentYm}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Image Slot for Profit & Loss */}
      <ImageSlot
        pageTitle="7. งบกำไรขาดทุน (Monthly Expense Summary)"
        folderPath="public/images/profit-loss/"
        defaultImagePath="/images/profit-loss/formal_banner.jpg"
        altText="ภาพหัวข้องบกำไรขาดทุน"
      />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-100 text-[#8d6e63] rounded-lg">
            <BadgePercent className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">7. งบกำไรขาดทุน (Profit & Loss Statement)</h1>
            <p className="text-xs text-slate-500">
              สรุปยอดขายและยอดซื้อแต่ละเดือนออกเป็นงบกำไรขาดทุน ตามโครงสร้างชีต Monthly Expense Summary
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
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์รายงาน</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">รายได้สะสมทั้งหมด (ยอดขาย)</div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
            ฿{totalAllIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">ค่าใช้จ่ายสะสมทั้งหมด</div>
          <div className="text-xl font-bold font-mono text-rose-700 mt-1">
            ฿{totalAllExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs ${
          totalAllProfit >= 0 ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50 border-rose-300'
        }`}>
          <div className="text-xs font-medium text-slate-700 flex items-center justify-between">
            <span>กำไรสุทธิรวม:</span>
            {totalAllProfit >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-700" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-700" />
            )}
          </div>
          <div className={`text-xl font-bold font-mono mt-1 ${
            totalAllProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            {totalAllProfit >= 0 ? '+' : ''}฿{totalAllProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">อัตรากำไรเฉลี่ย (Margin)</div>
          <div className={`text-xl font-bold font-mono mt-1 ${
            overallMargin >= 0 ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            {overallMargin.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Visual Comparison Bars */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h3 className="font-bold text-xs sm:text-sm text-slate-800 mb-4 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-[#8d6e63]" />
          <span>แผนภูมิเปรียบเทียบ รายได้ vs ค่าใช้จ่าย แต่ละเดือน</span>
        </h3>

        <div className="space-y-4">
          {monthlyRows.map(row => {
            const maxVal = Math.max(row.income, row.expenses, 1);
            const incomePct = (row.income / maxVal) * 100;
            const expensePct = (row.expenses / maxVal) * 100;

            return (
              <div key={row.ym} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800">{row.monthLabel}</span>
                  <span className={`font-mono ${row.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    กำไรสุทธิ: {row.profit >= 0 ? '+' : ''}฿{row.profit.toLocaleString()}
                  </span>
                </div>

                {/* Income bar */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                    <span>รายได้: ฿{row.income.toLocaleString()}</span>
                    <span>{incomePct.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${incomePct}%` }}
                    ></div>
                  </div>
                </div>

                {/* Expense bar */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                    <span>ค่าใช้จ่าย: ฿{row.expenses.toLocaleString()}</span>
                    <span>{expensePct.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-rose-500 h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${expensePct}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Table matching Excel Sheet 8 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs sm:text-sm text-slate-800">
          ตารางงบกำไรขาดทุนรายเดือน (Monthly Expense Summary)
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#b2dfdb]/50 text-slate-800 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 text-center w-12">ลำดับ</th>
                <th className="py-2.5 px-4 w-44">เดือน (Month)</th>
                <th className="py-2.5 px-4 text-right w-40 text-emerald-800">รายได้ (Income)</th>
                <th className="py-2.5 px-4 text-right w-40 text-rose-800">ค่าใช้จ่าย (Expenses)</th>
                <th className="py-2.5 px-4 text-right w-40">กำไร / ขาดทุน</th>
                <th className="py-2.5 px-4 text-center w-28">อัตรากำไร (Margin)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {monthlyRows.map((row, idx) => (
                <tr key={row.ym} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-center text-slate-500">{idx + 1}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800">{row.monthLabel}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                    ฿{row.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-rose-700">
                    ฿{row.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`py-2.5 px-4 text-right font-mono font-bold ${
                    row.profit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {row.profit >= 0 ? '+' : ''}฿{row.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      row.profit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {row.profitMargin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#d0f8ce]/60 font-bold text-slate-800 border-t-2 border-slate-300">
              <tr>
                <td colSpan={2} className="py-3 px-4 text-right">ยอดรวมสะสมทั้งหมด:</td>
                <td className="py-3 px-4 text-right font-mono text-emerald-800 text-sm">
                  ฿{totalAllIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-right font-mono text-rose-800 text-sm">
                  ฿{totalAllExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className={`py-3 px-4 text-right font-mono text-sm ${
                  totalAllProfit >= 0 ? 'text-emerald-800 font-extrabold' : 'text-rose-800 font-extrabold'
                }`}>
                  {totalAllProfit >= 0 ? '+' : ''}฿{totalAllProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-center font-mono text-sm">
                  {overallMargin.toFixed(1)}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
