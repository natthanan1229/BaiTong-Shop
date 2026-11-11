import React from 'react';
import { 
  Package, 
  ShoppingCart, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  ArrowRight,
  AlertTriangle,
  Boxes,
  BadgePercent,
  Calendar
} from 'lucide-react';
import { Product, PurchaseRecord, SaleRecord, AuthSession } from '../types';

interface ProgrammeMenuProps {
  session: AuthSession;
  products: Product[];
  purchases: PurchaseRecord[];
  sales: SaleRecord[];
  onNavigate: (page: string) => void;
}

export const ProgrammeMenu: React.FC<ProgrammeMenuProps> = ({
  session,
  products,
  purchases,
  sales,
  onNavigate,
}) => {
  const isAdmin = session.role === 'admin';
  const todayStr = new Date().toISOString().slice(0, 10);

  // Calculate quick metrics
  const lowStockCount = products.filter(p => p.status === 'สั่งซื้อ' || p.stockQty < 12).length;
  const todaySales = sales
    .filter(s => s.date === todayStr)
    .reduce((sum, s) => sum + s.netTotal, 0);
  const todayPurchases = purchases
    .filter(p => p.date === todayStr)
    .reduce((sum, p) => sum + p.netTotal, 0);
  const todayProfit = todaySales - todayPurchases;

  const menuItems = [
    {
      id: 'inventory',
      number: '1',
      title: 'ระบบคลังสินค้า',
      subTitle: 'Inventory Management',
      desc: 'บันทึกรับสินค้าจากยอดซื้อและบันทึกจ่ายจากยอดขาย รวมยอดคงเหลือของสินค้า (ไม่ตั้งค่าอัตโนมัติเป็นศูนย์) และลบสินค้าได้',
      icon: Package,
      badge: `${products.length} รายการ`,
      badgeColor: 'bg-teal-100 text-teal-800',
      color: 'from-[#b2dfdb]/40 to-white',
      borderColor: 'border-[#b2dfdb]',
      iconBg: 'bg-[#00796b] text-white',
    },
    {
      id: 'purchasing',
      number: '2',
      title: 'ระบบซื้อสินค้า',
      subTitle: 'Purchasing System',
      desc: 'สแกนบาร์โค้ดรับสินค้าเข้า แสดงผลเป็นรายการสินค้าระบุจำนวนและราคา พร้อมคำนวณราคาสุทธิให้อัตโนมัติ',
      icon: ShoppingCart,
      badge: 'สแกนบาร์โค้ดรับเข้า',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      color: 'from-[#d0f8ce]/40 to-white',
      borderColor: 'border-[#d0f8ce]',
      iconBg: 'bg-[#2e7d32] text-white',
    },
    {
      id: 'purchase-summary',
      number: '3',
      title: 'ระบบสรุปยอดซื้อสินค้า',
      subTitle: 'Total Purchase',
      desc: 'สรุปรายการซื้อสินค้าของแต่ละวัน ระบุชื่อสินค้า จำนวนสินค้า ราคาสินค้า และคำนวณราคาสุทธิ',
      icon: FileText,
      badge: `${purchases.length} บันทึก`,
      badgeColor: 'bg-blue-100 text-blue-800',
      color: 'from-blue-50 to-white',
      borderColor: 'border-blue-200',
      iconBg: 'bg-blue-700 text-white',
    },
    {
      id: 'pos',
      number: '4',
      title: 'ระบบขายสินค้า',
      subTitle: 'Sales POS System',
      desc: 'สแกนบาร์โค้ดขายสินค้าออก แสดงรายการสินค้าระบุจำนวนและราคา คำนวณราคาสุทธิ และคำนวณเงินทอนตามเงินที่รับมา',
      icon: DollarSign,
      badge: 'POS หน้าแคชเชียร์',
      badgeColor: 'bg-amber-100 text-amber-800',
      color: 'from-amber-50 to-white',
      borderColor: 'border-amber-200',
      iconBg: 'bg-amber-700 text-white',
    },
    {
      id: 'sales-summary',
      number: '5',
      title: 'ระบบสรุปยอดขายสินค้า',
      subTitle: 'Total Sales',
      desc: 'สรุปรายการขายสินค้าของแต่ละวัน ระบุชื่อสินค้า จำนวนสินค้า ราคาสินค้า และคำนวณราคาสุทธิ',
      icon: TrendingUp,
      badge: `${sales.length} บิลขาย`,
      badgeColor: 'bg-purple-100 text-purple-800',
      color: 'from-purple-50 to-white',
      borderColor: 'border-purple-200',
      iconBg: 'bg-purple-700 text-white',
    },
    {
      id: 'income-expense',
      number: '6',
      title: 'สรุปยอดรายได้ค่าใช้จ่าย',
      subTitle: 'Income & Expenses',
      desc: 'สรุปราคาสุทธิของแต่ละวันและสรุปราคาขายสุทธิของแต่ละวัน ออกเป็นผลกำไร/ขาดทุน พร้อมบันทึกค่าใช้จ่ายอื่น',
      icon: BarChart3,
      badge: 'รายวัน (ว/ด/ป)',
      badgeColor: 'bg-indigo-100 text-indigo-800',
      color: 'from-indigo-50 to-white',
      borderColor: 'border-indigo-200',
      iconBg: 'bg-indigo-700 text-white',
    },
    {
      id: 'profit-loss',
      number: '7',
      title: 'งบกำไรขาดทุน',
      subTitle: 'Monthly Expense Summary',
      desc: 'สรุปยอดขายและยอดซื้อแต่ละเดือนออกเป็นงบกำไรขาดทุน แสดงภาพรวมรายเดือนอย่างชัดเจน',
      icon: BadgePercent,
      badge: 'รายเดือน',
      badgeColor: 'bg-rose-100 text-rose-800',
      color: 'from-rose-50 to-white',
      borderColor: 'border-rose-200',
      iconBg: 'bg-[#8d6e63] text-white',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#b2dfdb] via-[#d0f8ce] to-[#b2dfdb]/70 rounded-2xl p-6 shadow-sm border border-[#80cbc4]/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 rounded-full text-xs font-semibold text-[#4e342e] mb-2 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-[#8d6e63]" />
            <span>วันที่ปัจจุบัน: {todayStr}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#4e342e]">
            ยินดีต้อนรับสู่ระบบ BaiTong Shop
          </h1>
          <p className="text-xs sm:text-sm text-slate-700 mt-1">
            {isAdmin ? (
              <span className="font-medium text-[#5d4037]">
                คุณเข้าสู่ระบบในฐานะ <strong className="underline">ผู้ดูแลระบบหลังบ้าน (ADMIN)</strong> สามารถเพิ่ม ลบ แก้ไข อัปเดตสินค้า และกำหนดสูตรคำนวณได้
              </span>
            ) : (
              <span className="font-medium text-emerald-800">
                คุณเข้าสู่ระบบในฐานะ <strong className="underline">ผู้ใช้งาน (User: {session.user?.fullName} | ID: {session.user?.userId})</strong>
              </span>
            )}
          </p>
        </div>

        {lowStockCount > 0 && (
          <button
            onClick={() => onNavigate('inventory')}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-sm text-xs font-semibold transition"
          >
            <AlertTriangle className="w-4 h-4 animate-bounce" />
            <span>มีสินค้าต้องสั่งซื้อ {lowStockCount} รายการ</span>
          </button>
        )}
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-teal-100 text-[#00796b]">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">สินค้าในคลัง</div>
            <div className="text-lg font-bold text-slate-800">{products.length} รายการ</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">สินค้าใกล้หมด (ต่ำกว่า 12)</div>
            <div className="text-lg font-bold text-amber-600">{lowStockCount} รายการ</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">ยอดขายวันนี้</div>
            <div className="text-lg font-bold text-emerald-600">฿{todaySales.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${todayProfit >= 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">กำไรสุทธิวันนี้</div>
            <div className={`text-lg font-bold ${todayProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
              ฿{todayProfit.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 7 Core Menu Modules Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              รายการเมนูหลักของระบบ (7 โมดูล)
            </h2>
            <p className="text-xs text-slate-500">
              โครงสร้างเมนูอ้างอิงตรงตามตารางและแผ่นงานในไฟล์ Excel
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`group cursor-pointer rounded-2xl p-5 border ${item.borderColor} bg-gradient-to-br ${item.color} shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center shadow-xs`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-white/80 text-slate-700 border border-slate-200">
                        ข้อที่ {item.number}
                      </span>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-800 text-base group-hover:text-[#00796b] transition-colors">
                    {item.title}
                  </h3>
                  <div className="text-[11px] font-medium text-slate-400 mb-2 font-mono">
                    {item.subTitle}
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#8d6e63] group-hover:text-[#5d4037]">
                  <span>เปิดหน้าระบบ</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
