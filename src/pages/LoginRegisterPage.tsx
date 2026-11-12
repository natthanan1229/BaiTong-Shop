import React, { useState } from 'react';
import { 
  Store, 
  ShieldCheck, 
  User as UserIcon, 
  LogIn, 
  AlertCircle, 
  Mail, 
  Info, 
  Building2, 
  Lock,
  Key
} from 'lucide-react';
import { AuthSession } from '../types';
import { store } from '../services/store';

interface LoginRegisterPageProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export const LoginRegisterPage: React.FC<LoginRegisterPageProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'admin' | 'user-login'>('user-login');

  // Admin Login state
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  // User Login state
  const [userLoginEmail, setUserLoginEmail] = useState('');
  const [userLoginId, setUserLoginId] = useState('');
  const [userLoginError, setUserLoginError] = useState('');

  // Background image URL: 2400x1600 formal stationery landscape photograph
  const bgImageUrl = '/images/login/formal_stationery_landscape.jpg';

  // Handle Admin Login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    if (adminUsername.trim() === 'ADMIN' && adminPassword === '1229') {
      const session: AuthSession = {
        role: 'admin',
        adminName: 'ADMIN (ผู้ดูแลระบบหลังบ้าน)'
      };
      store.setAuthSession(session);
      onLoginSuccess(session);
    } else {
      setAdminError('ชื่อผู้ใช้หรือรหัสผ่านแอดมินไม่ถูกต้อง (กำหนด: ADMIN / 1229)');
    }
  };

  const handleFillAdminDemo = () => {
    setAdminUsername('ADMIN');
    setAdminPassword('1229');
    setAdminError('');
  };

  // Handle User Login
  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserLoginError('');

    if (!userLoginEmail.trim() || !userLoginId.trim()) {
      setUserLoginError('กรุณากรอกทั้งอีเมลและรหัสผู้ใช้งานให้ครบถ้วน');
      return;
    }

    const user = await store.findUserAsync(userLoginEmail, userLoginId);
    if (!user) {
      setUserLoginError('ไม่พบข้อมูลผู้ใช้งานที่ตรงกับอีเมลและรหัสผู้ใช้งานนี้ กรุณาติดต่อแอดมินเพื่อเพิ่มผู้ใช้งาน');
      return;
    }

    const session: AuthSession = {
      role: 'user',
      user: user
    };
    store.setAuthSession(session);
    onLoginSuccess(session);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-x-hidden">
      {/* 1. Full-screen formal stationery background image */}
      <div 
        className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-all duration-700 -z-20 scale-100"
        style={{ backgroundImage: `url(${bgImageUrl})` }}
      />

      {/* 2. Sophisticated dark and warm ambient vignette overlay */}
      <div className="fixed inset-0 w-full h-full bg-gradient-to-t from-black/80 via-slate-950/50 to-slate-900/60 backdrop-blur-[2px] -z-10" />

      {/* 3. Floating Glassmorphism Center Container */}
      <div className="w-full max-w-xl my-auto animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Header */}
        <div className="text-center mb-5 text-white">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium mb-3 shadow-lg text-[#d0f8ce]">
            <Building2 className="w-4 h-4 text-[#b2dfdb]" />
            <span>BaiTong Official Stationery & Office Supplies</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-md text-white">
            ร้านใบตองอุปกรณ์เครื่องเขียน
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-md mx-auto drop-shadow font-light">
            ระบบบริหารจัดการคลังสินค้า ซื้อ-ขาย สรุปยอดรายได้ และงบกำไรขาดทุนทางการ
          </p>
        </div>

        {/* Main Card with Frosted Glass Styling */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden transition-all duration-200">
          {/* Tab Switcher - 2 Tabs (User Login & Admin) */}
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-100/80 p-1.5 gap-1 text-center">
            <button
              type="button"
              onClick={() => setActiveTab('user-login')}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'user-login'
                  ? 'bg-white text-[#4e342e] shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-[#00796b]" />
              <span>เข้าสู่ระบบ (User)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'admin'
                  ? 'bg-white text-[#8d6e63] shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#8d6e63]" />
              <span>แอดมิน (ADMIN)</span>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {/* ---------------- 1. USER LOGIN TAB ---------------- */}
            {activeTab === 'user-login' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-[#b2dfdb]/40 text-[#00796b] rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-sm border border-[#b2dfdb]">
                    <LogIn className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">เข้าสู่ระบบผู้ใช้งานทั่วไป</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    เข้าสู่ระบบด้วยอีเมลและรหัสผู้ใช้งานที่ระบบกำหนดให้
                  </p>
                </div>

                {userLoginError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{userLoginError}</span>
                  </div>
                )}

                <form onSubmit={handleUserLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      อีเมล (Email) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        value={userLoginEmail}
                        onChange={(e) => setUserLoginEmail(e.target.value)}
                        placeholder="example@email.com"
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#b2dfdb] focus:border-[#00796b] outline-none transition bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      รหัสผู้ใช้งาน (User ID) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={userLoginId}
                        onChange={(e) => setUserLoginId(e.target.value.toUpperCase())}
                        placeholder="เช่น BT-12345"
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#b2dfdb] focus:border-[#00796b] outline-none transition bg-white"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      * รหัสผู้ใช้งานได้จากการลงทะเบียน เช่น BT-10229
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-[#8d6e63] hover:bg-[#5d4037] text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>เข้าสู่ระบบ</span>
                  </button>
                </form>

                <div className="mt-6 pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
                  <div className="flex items-center justify-center gap-1.5 text-slate-600 font-medium">
                    <ShieldCheck className="w-4 h-4 text-[#8d6e63]" />
                    <span>การเพิ่มผู้ใช้งานใหม่ดำเนินการโดยผู้ดูแลระบบ (ADMIN) หลังบ้านเท่านั้น</span>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- 2. ADMIN LOGIN TAB ---------------- */}
            {activeTab === 'admin' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-[#8d6e63]/20 text-[#8d6e63] rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-sm border border-[#8d6e63]/30">
                    <ShieldCheck className="w-6 h-6 text-[#8d6e63]" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">ระบบหลังบ้าน (ADMIN Backend)</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    เฉพาะผู้ดูแลระบบเพื่อจัดการเพิ่ม ลบ แก้ไขสินค้า และกำหนดสูตรคำนวณ
                  </p>
                </div>

                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-semibold">ข้อกำหนดการเข้าใช้งานระบบแอดมิน:</span>
                    <br />
                    ผู้ใช้: <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-slate-800">ADMIN</code> | 
                    รหัสผ่าน: <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-slate-800">1229</code>
                  </div>
                </div>

                {adminError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{adminError}</span>
                  </div>
                )}

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ชื่อผู้ใช้แอดมิน (Username)
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="ADMIN"
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#8d6e63]/40 focus:border-[#8d6e63] outline-none transition bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      รหัสผ่านแอดมิน (Password)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="1229"
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#8d6e63]/40 focus:border-[#8d6e63] outline-none transition bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      className="flex-1 py-3 px-4 bg-[#8d6e63] hover:bg-[#5d4037] text-white font-semibold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 active:scale-[0.99]"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>เข้าสู่ระบบแอดมิน</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleFillAdminDemo}
                      className="py-3 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition border border-slate-200"
                      title="กรอกข้อมูล ADMIN อัตโนมัติ"
                    >
                      เติม ADMIN/1229
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Dignified Footer */}
        <div className="text-center text-xs text-white/70 mt-4 drop-shadow">
          BaiTong Stationery Shop &copy; 2026 | ระบบจัดการมาตรฐานทางการสำหรับร้านอุปกรณ์เครื่องเขียน
        </div>
      </div>
    </div>
  );
};
