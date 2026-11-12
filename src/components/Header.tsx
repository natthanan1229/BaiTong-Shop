import React from 'react';
import { 
  Store, 
  Package, 
  ShoppingCart, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Sliders, 
  LogOut, 
  User as UserIcon, 
  ShieldCheck,
  Home,
  Users
} from 'lucide-react';
import { AuthSession } from '../types';

interface HeaderProps {
  session: AuthSession;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  currentPage,
  onNavigate,
  onLogout,
  onOpenSettings,
}) => {
  const isAdmin = session.role === 'admin';

  const navItems = [
    { id: 'programme', label: 'หน้าแรก', icon: Home },
    { id: 'inventory', label: '1. คลังสินค้า', icon: Package },
    { id: 'purchasing', label: '2. ซื้อสินค้า', icon: ShoppingCart },
    { id: 'purchase-summary', label: '3. สรุปยอดซื้อ', icon: FileText },
    { id: 'pos', label: '4. ขายสินค้า (POS)', icon: DollarSign },
    { id: 'sales-summary', label: '5. สรุปยอดขาย', icon: TrendingUp },
    ...(isAdmin ? [
      { id: 'income-expense', label: '6. รายได้-ค่าใช้จ่าย', icon: BarChart3 },
      { id: 'profit-loss', label: '7. งบกำไรขาดทุน', icon: TrendingUp },
      { id: 'members', label: '👥 จัดการสมาชิก', icon: Users }
    ] : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#b2dfdb] shadow-sm">
      {/* Top Banner Bar */}
      <div className="bg-gradient-to-r from-[#b2dfdb] via-[#d0f8ce] to-[#b2dfdb] px-4 py-2 border-b border-[#80cbc4]/40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm">
          <div className="flex items-center gap-2 text-[#4e342e]">
            <span className="font-semibold text-sm">BaiTong Shop</span>
            <span className="text-slate-400">|</span>
            <span className="hidden sm:inline">ระบบจัดการร้านอุปกรณ์เครื่องเขียน</span>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#8d6e63] text-white font-medium text-xs shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  ADMIN (ระบบหลังบ้าน)
                </span>
                <button
                  onClick={() => onNavigate('members')}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium text-xs transition border ${
                    currentPage === 'members'
                      ? 'bg-[#8d6e63] text-white border-[#8d6e63]'
                      : 'bg-white/90 hover:bg-white text-[#4e342e] border-[#8d6e63]/30'
                  }`}
                  title="จัดการสมาชิกและผู้ใช้งาน"
                >
                  <Users className="w-3 h-3 text-[#8d6e63]" />
                  <span>จัดการสมาชิก</span>
                </button>
                <button
                  onClick={onOpenSettings}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/90 hover:bg-white text-[#4e342e] font-medium text-xs transition border border-[#8d6e63]/30"
                  title="กำหนดสูตรคำนวณ Excel"
                >
                  <Sliders className="w-3 h-3 text-[#8d6e63]" />
                  <span>สูตรคำนวณ Excel</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-700 text-white font-medium text-xs shadow-xs">
                  <UserIcon className="w-3 h-3" />
                  {session.user?.fullName}
                </span>
                <span className="bg-white/80 text-[#00796b] px-2 py-0.5 rounded text-xs font-mono font-semibold border border-[#b2dfdb]">
                  ID: {session.user?.userId}
                </span>
              </div>
            )}

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-xs border border-rose-200 transition"
              title="ออกจากระบบ"
            >
              <LogOut className="w-3 h-3" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-2">
          <div 
            onClick={() => onNavigate('programme')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#8d6e63] group-hover:bg-[#5d4037] text-white flex items-center justify-center shadow-sm transition">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-base leading-tight">ใบตอง ช็อป</div>
              <div className="text-[11px] text-slate-500">BaiTong Stationery & Office</div>
            </div>
          </div>

          {/* Nav pills */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#8d6e63] text-white shadow-sm font-semibold'
                      : 'text-slate-700 hover:bg-[#b2dfdb]/40 hover:text-[#004d40]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile Navigation Scroll */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`whitespace-nowrap flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  isActive
                    ? 'bg-[#8d6e63] text-white font-semibold'
                    : 'text-slate-600 bg-slate-100 hover:bg-[#b2dfdb]/40'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
