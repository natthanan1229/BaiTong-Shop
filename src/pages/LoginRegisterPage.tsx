import React, { useState } from 'react';
import { 
  Store, 
  ShieldCheck, 
  User as UserIcon, 
  LogIn, 
  UserPlus, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Key, 
  Mail, 
  Phone, 
  Copy, 
  Sparkles,
  Info
} from 'lucide-react';
import { RegisteredUser, AuthSession } from '../types';
import { store } from '../services/store';
import { validateFullName, validatePhone, validateEmail, generateUserId } from '../utils/validation';
import confetti from 'canvas-confetti';

interface LoginRegisterPageProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export const LoginRegisterPage: React.FC<LoginRegisterPageProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'admin' | 'user-login' | 'user-register'>('user-login');

  // Admin Login state
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  // User Login state
  const [userLoginEmail, setUserLoginEmail] = useState('');
  const [userLoginId, setUserLoginId] = useState('');
  const [userLoginError, setUserLoginError] = useState('');

  // User Register state
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regGeneratedId, setRegGeneratedId] = useState(generateUserId());
  const [regErrors, setRegErrors] = useState<{ [key: string]: string }>({});
  const [registeredUserSuccess, setRegisteredUserSuccess] = useState<RegisteredUser | null>(null);
  const [copiedId, setCopiedId] = useState(false);

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
  const handleUserLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setUserLoginError('');

    if (!userLoginEmail.trim() || !userLoginId.trim()) {
      setUserLoginError('กรุณากรอกทั้งอีเมลและรหัสผู้ใช้งานให้ครบถ้วน');
      return;
    }

    const user = store.findUser(userLoginEmail, userLoginId);
    if (!user) {
      setUserLoginError('ไม่พบข้อมูลผู้ใช้งานที่ตรงกับอีเมลและรหัสผู้ใช้งานนี้ กรุณาตรวจสอบหรือลงทะเบียนใหม่');
      return;
    }

    const session: AuthSession = {
      role: 'user',
      user: user
    };
    store.setAuthSession(session);
    onLoginSuccess(session);
  };

  // Handle User Register
  const handleUserRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    // 1. Validate Name
    const nameCheck = validateFullName(regFullName);
    if (!nameCheck.isValid) {
      errors.fullName = nameCheck.message || 'ชื่อ-นามสกุลไม่ถูกต้อง';
    }

    // 2. Validate Phone (10 digits only, no dashes or symbols)
    const phoneCheck = validatePhone(regPhone);
    if (!phoneCheck.isValid) {
      errors.phone = phoneCheck.message || 'เบอร์โทรศัพท์ไม่ถูกต้อง';
    }

    // 3. Validate Email
    const emailCheck = validateEmail(regEmail);
    if (!emailCheck.isValid) {
      errors.email = emailCheck.message || 'อีเมลไม่ถูกต้อง';
    }

    if (Object.keys(errors).length > 0) {
      setRegErrors(errors);
      return;
    }

    try {
      const newUser = store.registerUser({
        userId: regGeneratedId,
        fullName: regFullName.trim(),
        phone: regPhone.trim(),
        email: regEmail.trim(),
      });

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      setRegisteredUserSuccess(newUser);
      setRegErrors({});
    } catch (err: unknown) {
      const error = err as Error;
      setRegErrors({ general: error.message || 'เกิดข้อผิดพลาดในการลงทะเบียน' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleProceedWithRegisteredUser = () => {
    if (registeredUserSuccess) {
      const session: AuthSession = {
        role: 'user',
        user: registeredUserSuccess
      };
      store.setAuthSession(session);
      onLoginSuccess(session);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#b2dfdb]/30 via-slate-50 to-[#d0f8ce]/30 flex flex-col justify-between py-6 px-4">
      <div className="max-w-4xl w-full mx-auto">
        {/* Banner Card */}
        <div className="bg-white rounded-2xl shadow-md border border-[#b2dfdb] overflow-hidden mb-6">
          <div className="relative h-48 sm:h-64 md:h-72 w-full overflow-hidden bg-[#8d6e63]">
            <img 
              src="/images/login/banner.png" 
              alt="BaiTong Stationery Shop Banner" 
              className="w-full h-full object-cover object-center brightness-95 hover:scale-[1.01] transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400"><rect fill="%238d6e63" width="1200" height="400"/><text fill="%23ffffff" font-family="sans-serif" font-size="32" x="50%" y="50%" text-anchor="middle">ร้านอุปกรณ์เครื่องเขียน BaiTong Shop</text></svg>';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#8d6e63]/90 backdrop-blur-md rounded-full text-xs font-medium w-fit mb-2 border border-white/20">
                <Store className="w-3.5 h-3.5 text-[#d0f8ce]" />
                <span>ร้านอุปกรณ์เครื่องเขียนที่เป็นทางการและครบวงจร</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow">
                BaiTong Shop (ร้านใบตองเครื่องเขียน)
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 mt-1 drop-shadow">
                ระบบจัดการคลังสินค้า ซื้อ-ขาย สรุปยอดรายได้ และงบกำไรขาดทุน
              </p>
            </div>
          </div>

          {/* Quick tab switcher */}
          <div className="flex border-b border-slate-200 bg-slate-50">
            <button
              onClick={() => { setActiveTab('user-login'); setRegisteredUserSuccess(null); }}
              className={`flex-1 py-3 px-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition ${
                activeTab === 'user-login'
                  ? 'border-[#8d6e63] text-[#8d6e63] bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>ผู้ใช้งานเข้าสู่ระบบ (User Login)</span>
            </button>

            <button
              onClick={() => { setActiveTab('user-register'); setRegisteredUserSuccess(null); }}
              className={`flex-1 py-3 px-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition ${
                activeTab === 'user-register'
                  ? 'border-[#00796b] text-[#00796b] bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>ลงทะเบียนผู้ใช้งานใหม่ (Register)</span>
            </button>

            <button
              onClick={() => { setActiveTab('admin'); setRegisteredUserSuccess(null); }}
              className={`flex-1 py-3 px-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition ${
                activeTab === 'admin'
                  ? 'border-[#8d6e63] text-[#8d6e63] bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#8d6e63]" />
              <span>แอดมินหลังบ้าน (ADMIN)</span>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {/* ---------------- 1. USER LOGIN TAB ---------------- */}
            {activeTab === 'user-login' && (
              <div className="max-w-md mx-auto">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-[#b2dfdb] text-[#00796b] rounded-full flex items-center justify-center mx-auto mb-2 shadow-xs">
                    <LogIn className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">เข้าสู่ระบบผู้ใช้งานทั่วไป</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    บังคับเข้าใช้งานด้วยอีเมลและรหัสผู้ใช้งานที่ระบบออกให้
                  </p>
                </div>

                {userLoginError && (
                  <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
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
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        value={userLoginEmail}
                        onChange={(e) => setUserLoginEmail(e.target.value)}
                        placeholder="example@email.com"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#b2dfdb] focus:border-[#00796b] outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      รหัสผู้ใช้งาน (User ID) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={userLoginId}
                        onChange={(e) => setUserLoginId(e.target.value.toUpperCase())}
                        placeholder="เช่น BT-12345"
                        className="w-full pl-9 pr-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#b2dfdb] focus:border-[#00796b] outline-none"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      * รหัสผู้ใช้งานได้จากการลงทะเบียน เช่น BT-10229
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-[#8d6e63] hover:bg-[#5d4037] text-white font-semibold text-sm rounded-lg shadow-sm transition flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>เข้าสู่ระบบ</span>
                  </button>
                </form>

                <div className="mt-6 pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
                  ยังไม่มีรหัสผู้ใช้งาน?{' '}
                  <button
                    onClick={() => setActiveTab('user-register')}
                    className="text-[#00796b] font-semibold hover:underline"
                  >
                    ลงทะเบียนเข้าใช้งานที่นี่
                  </button>
                </div>
              </div>
            )}

            {/* ---------------- 2. USER REGISTER TAB ---------------- */}
            {activeTab === 'user-register' && (
              <div className="max-w-md mx-auto">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-[#d0f8ce] text-[#2e7d32] rounded-full flex items-center justify-center mx-auto mb-2 shadow-xs">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">ลงทะเบียนผู้ใช้งานใหม่</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    กรอกข้อมูลครบถ้วน รหัสผู้ใช้งานจะประมวลผลให้อัตโนมัติ
                  </p>
                </div>

                {registeredUserSuccess ? (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-5 text-center space-y-4">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-emerald-800 text-base">ลงทะเบียนสำเร็จเรียบร้อย!</h3>
                      <p className="text-xs text-emerald-700 mt-1">
                        ยินดีต้อนรับ คุณ{registeredUserSuccess.fullName}
                      </p>
                    </div>

                    <div className="p-4 bg-white rounded-lg border border-emerald-200 text-left space-y-2">
                      <div className="text-xs text-slate-500">รหัสผู้ใช้งานประจำตัวของคุณ (ใช้สำหรับเข้าสู่ระบบ):</div>
                      <div className="flex items-center justify-between gap-2 p-2 bg-[#d0f8ce]/60 rounded-md font-mono font-bold text-base text-[#2e7d32]">
                        <span>{registeredUserSuccess.userId}</span>
                        <button
                          onClick={() => copyToClipboard(registeredUserSuccess.userId)}
                          className="px-2 py-1 bg-white hover:bg-slate-50 text-xs rounded border border-emerald-300 flex items-center gap-1 font-sans text-slate-700"
                        >
                          {copiedId ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        • อีเมล: <span className="font-semibold">{registeredUserSuccess.email}</span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        • เบอร์โทร: <span className="font-semibold">{registeredUserSuccess.phone}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleProceedWithRegisteredUser}
                      className="w-full py-2.5 px-4 bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-semibold text-sm rounded-lg shadow-sm transition flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>เข้าสู่ระบบทันทีด้วยบัญชีนี้</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleUserRegister} className="space-y-4">
                    {regErrors.general && (
                      <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{regErrors.general}</span>
                      </div>
                    )}

                    {/* 1. Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        1. ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={regFullName}
                          onChange={(e) => {
                            setRegFullName(e.target.value);
                            if (regErrors.fullName) setRegErrors({ ...regErrors, fullName: '' });
                          }}
                          placeholder="ชื่อ และ นามสกุลจริง (เช่น ณัฐนันท์ สมบูรณ์)"
                          className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 outline-none ${
                            regErrors.fullName 
                              ? 'border-rose-400 focus:ring-rose-200' 
                              : 'border-slate-300 focus:ring-[#b2dfdb] focus:border-[#00796b]'
                          }`}
                          required
                        />
                      </div>
                      {regErrors.fullName ? (
                        <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>{regErrors.fullName}</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          * ตรวจสอบห้ามพิมพ์มั่ว ต้องเป็นชื่อ-นามสกุลจริงตามหลักพจนานุกรม
                        </p>
                      )}
                    </div>

                    {/* 2. Phone */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        2. เบอร์โทรศัพท์ <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          maxLength={10}
                          value={regPhone}
                          onChange={(e) => {
                            // Only allow numbers
                            const val = e.target.value.replace(/[^\d]/g, '');
                            setRegPhone(val);
                            if (regErrors.phone) setRegErrors({ ...regErrors, phone: '' });
                          }}
                          placeholder="เบอร์โทร 10 หลัก (เช่น 0812345678)"
                          className={`w-full pl-9 pr-3 py-2 text-sm font-mono border rounded-lg focus:ring-2 outline-none ${
                            regErrors.phone 
                              ? 'border-rose-400 focus:ring-rose-200' 
                              : 'border-slate-300 focus:ring-[#b2dfdb] focus:border-[#00796b]'
                          }`}
                          required
                        />
                      </div>
                      {regErrors.phone ? (
                        <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>{regErrors.phone}</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          * ฟิกไว้ที่ 10 ตัวอักษรเท่านั้น ห้ามมีขีด (-) หรืออักขระพิเศษใดๆ ทั้งสิ้น
                        </p>
                      )}
                    </div>

                    {/* 3. Email */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        3. อีเมล (Email) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => {
                            setRegEmail(e.target.value);
                            if (regErrors.email) setRegErrors({ ...regErrors, email: '' });
                          }}
                          placeholder="name@domain.com"
                          className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 outline-none ${
                            regErrors.email 
                              ? 'border-rose-400 focus:ring-rose-200' 
                              : 'border-slate-300 focus:ring-[#b2dfdb] focus:border-[#00796b]'
                          }`}
                          required
                        />
                      </div>
                      {regErrors.email ? (
                        <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>{regErrors.email}</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          * ตรวจสอบองค์ประกอบอีเมลให้ครบถ้วน (@, โดเมน, นามสกุล)
                        </p>
                      )}
                    </div>

                    {/* 4. Auto-generated User ID preview */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          4. รหัสผู้ใช้งาน (ประมวลผลให้อัตโนมัติ)
                        </label>
                        <button
                          type="button"
                          onClick={() => setRegGeneratedId(generateUserId())}
                          className="text-[11px] text-[#00796b] hover:text-[#004d40] flex items-center gap-1 font-medium"
                          title="สุ่มรหัสใหม่"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>สุ่มใหม่</span>
                        </button>
                      </div>
                      <div className="p-2.5 bg-[#e0f2f1]/80 border border-[#b2dfdb] rounded-lg flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-[#00796b]">
                          {regGeneratedId}
                        </span>
                        <span className="text-[11px] text-emerald-700 bg-[#d0f8ce] px-2 py-0.5 rounded-full font-medium">
                          ระบบประมวลให้อัตโนมัติ
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-semibold text-sm rounded-lg shadow-sm transition flex items-center justify-center gap-2 mt-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>ยืนยันการลงทะเบียน</span>
                    </button>
                  </form>
                )}

                <div className="mt-6 pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
                  มีรหัสผู้ใช้งานแล้ว?{' '}
                  <button
                    onClick={() => setActiveTab('user-login')}
                    className="text-[#00796b] font-semibold hover:underline"
                  >
                    เข้าสู่ระบบที่นี่
                  </button>
                </div>
              </div>
            )}

            {/* ---------------- 3. ADMIN LOGIN TAB ---------------- */}
            {activeTab === 'admin' && (
              <div className="max-w-md mx-auto">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-[#8d6e63]/20 text-[#8d6e63] rounded-full flex items-center justify-center mx-auto mb-2 shadow-xs">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">ระบบหลังบ้าน (ADMIN Backend)</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    สำหรับผู้ดูแลระบบเท่านั้น มีสิทธิ์จัดการเพิ่ม-ลบ-แก้ไขสินค้า และสูตรคำนวณ
                  </p>
                </div>

                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-semibold">ข้อกำหนดการเข้าใช้งานแอดมิน:</span>
                    <br />
                    ผู้ใช้: <code className="bg-white px-1.5 py-0.2 rounded font-mono font-bold">ADMIN</code> | 
                    รหัสผ่าน: <code className="bg-white px-1.5 py-0.2 rounded font-mono font-bold">1229</code>
                  </div>
                </div>

                {adminError && (
                  <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
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
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="ADMIN"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#8d6e63]/40 focus:border-[#8d6e63] outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      รหัสผ่านแอดมิน (Password)
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="1229"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#8d6e63]/40 focus:border-[#8d6e63] outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 px-4 bg-[#8d6e63] hover:bg-[#5d4037] text-white font-semibold text-sm rounded-lg shadow-sm transition flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>เข้าสู่ระบบแอดมิน</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleFillAdminDemo}
                      className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
                      title="กรอกข้อมูล ADMIN อัตโนมัติ"
                    >
                      เติมข้อมูลทดสอบ
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500">
          BaiTong Stationery Shop &copy; 2026 | รองรับการทำงานทั้งระบบหน้าบ้านและหลังบ้าน อ้างอิงโครงสร้างไฟล์ Excel
        </div>
      </div>
    </div>
  );
};
