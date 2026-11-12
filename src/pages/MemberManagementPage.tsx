import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Phone, 
  Mail, 
  Key, 
  Calendar, 
  Download, 
  Printer, 
  X, 
  Check, 
  Copy, 
  ShieldCheck, 
  RefreshCw,
  UserCheck,
  UserX,
  FileSpreadsheet,
  Database
} from 'lucide-react';
import { RegisteredUser, AuthSession } from '../types';
import { store } from '../services/store';
import { validateFullName, validatePhone, validateEmail, generateUserId } from '../utils/validation';
import { ImageSlot } from '../components/ImageSlot';

interface MemberManagementPageProps {
  session: AuthSession;
  onRefresh?: () => void;
}

export const MemberManagementPage: React.FC<MemberManagementPageProps> = ({
  session,
  onRefresh,
}) => {
  const isAdmin = session.role === 'admin';

  const [users, setUsers] = useState<RegisteredUser[]>(() => store.getUsers());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<RegisteredUser | null>(null);
  const [formUserId, setFormUserId] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'suspended'>('active');
  const [formNote, setFormNote] = useState('');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  
  // Notification banner
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refreshUserList = () => {
    const list = store.getUsers();
    setUsers(list);
    if (onRefresh) onRefresh();
  };

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Filtered members list
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = 
        u.fullName.toLowerCase().includes(q) ||
        u.userId.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (u.note && u.note.toLowerCase().includes(q));
      
      const matchStatus = filterStatus === 'all' || (u.status || 'active') === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [users, searchTerm, filterStatus]);

  // Handle open add modal
  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormUserId(generateUserId());
    setFormFullName('');
    setFormPhone('');
    setFormEmail('');
    setFormStatus('active');
    setFormNote('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEditModal = (user: RegisteredUser) => {
    setEditingUser(user);
    setFormUserId(user.userId);
    setFormFullName(user.fullName);
    setFormPhone(user.phone);
    setFormEmail(user.email);
    setFormStatus(user.status || 'active');
    setFormNote(user.note || '');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Handle submit add/edit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    // Validate Full Name
    const nameCheck = validateFullName(formFullName);
    if (!nameCheck.isValid) {
      errors.fullName = nameCheck.message || 'ชื่อ-นามสกุลไม่ถูกต้อง';
    }

    // Validate Phone (10 digits only)
    const phoneCheck = validatePhone(formPhone);
    if (!phoneCheck.isValid) {
      errors.phone = phoneCheck.message || 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้น';
    }

    // Validate Email
    const emailCheck = validateEmail(formEmail);
    if (!emailCheck.isValid) {
      errors.email = emailCheck.message || 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    // Validate User ID
    if (!formUserId.trim()) {
      errors.userId = 'กรุณาระบุรหัสผู้ใช้งาน';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      if (editingUser) {
        // Update user
        store.updateUser({
          userId: formUserId.trim().toUpperCase(),
          fullName: formFullName.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim(),
          registeredAt: editingUser.registeredAt,
          status: formStatus,
          note: formNote.trim(),
        });
        showFeedback(`แก้ไขข้อมูลสมาชิก "${formFullName}" สำเร็จเรียบร้อย`);
      } else {
        // Add new user
        store.addUser({
          userId: formUserId.trim().toUpperCase(),
          fullName: formFullName.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim(),
          status: formStatus,
          note: formNote.trim(),
        });
        showFeedback(`เพิ่มสมาชิกใหม่ "${formFullName}" (รหัส: ${formUserId}) สำเร็จเรียบร้อย`);
      }

      setIsModalOpen(false);
      refreshUserList();
    } catch (err: unknown) {
      const error = err as Error;
      setFormErrors({ general: error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
  };

  // Handle delete user
  const handleDeleteUser = (user: RegisteredUser) => {
    const confirmDelete = window.confirm(
      `คุณแน่ใจหรือไม่ว่าต้องการลบสมาชิก:\n"${user.fullName}" (รหัส: ${user.userId})?\n\nการลบนี้จะไม่สามารถกู้คืนได้`
    );
    if (!confirmDelete) return;

    try {
      store.deleteUser(user.userId);
      showFeedback(`ลบสมาชิก "${user.fullName}" ออกจากระบบเรียบร้อยแล้ว`, 'success');
      refreshUserList();
    } catch (err: unknown) {
      const error = err as Error;
      showFeedback(error.message || 'เกิดข้อผิดพลาดในการลบสมาชิก', 'error');
    }
  };

  // Toggle user status active/suspended
  const handleToggleStatus = (user: RegisteredUser) => {
    const newStatus = (user.status || 'active') === 'active' ? 'suspended' : 'active';
    store.updateUser({
      ...user,
      status: newStatus
    });
    showFeedback(`เปลี่ยนสถานะสมาชิก ${user.fullName} เป็น "${newStatus === 'active' ? 'ปกติ' : 'ระงับการใช้งาน'}"`);
    refreshUserList();
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ลำดับ', 'รหัสผู้ใช้งาน', 'ชื่อ-นามสกุล', 'เบอร์โทรศัพท์', 'อีเมล', 'วันที่ลงทะเบียน', 'สถานะ', 'หมายเหตุ'];
    const rows = users.map((u, i) => [
      i + 1,
      u.userId,
      `"${u.fullName}"`,
      `"${u.phone}"`,
      `"${u.email}"`,
      `"${new Date(u.registeredAt).toLocaleDateString('th-TH')}"`,
      u.status === 'suspended' ? 'ระงับชั่วคราว' : 'ปกติ',
      `"${u.note || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `รายชื่อสมาชิก_BaiTongShop_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showFeedback('ส่งออกไฟล์ข้อมูลสมาชิก (.CSV) สำเร็จ');
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isAdmin) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-rose-200 text-center max-w-lg mx-auto shadow-sm my-12">
        <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">เฉพาะผู้ดูแลระบบ (ADMIN) เท่านั้น</h2>
        <p className="text-xs text-slate-500 mt-1">
          คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาเข้าสู่ระบบด้วยบัญชีแอดมินหลังบ้าน
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Formal Header Banner */}
      <ImageSlot
        pageTitle="ระบบจัดการสมาชิก (Member Management)"
        folderPath="public/images/members/"
        defaultImagePath="/images/members/formal_banner.jpg"
        altText="ภาพหัวข้อระบบจัดการสมาชิก"
      />

      {/* Title & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#8d6e63] text-white rounded-xl shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-800">
                ระบบจัดการสมาชิกและผู้ใช้งาน (Member Management)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#8d6e63]/15 text-[#5d4037] border border-[#8d6e63]/30">
                ADMIN หลังบ้าน
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#b2dfdb]/40 text-[#00796b] border border-[#b2dfdb]">
                <Database className="w-3 h-3" />
                ฐานข้อมูล: Employee_TB
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              แอดมินสามารถจัดการ เพิ่ม แก้ไข เปลี่ยนรหัสผู้ใช้งาน และลบข้อมูลสมาชิกได้ทั้งหมด
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>ส่งออก Excel/CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>พิมพ์รายชื่อ</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#00796b] hover:bg-[#004d40] text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ เพิ่มสมาชิกใหม่</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {feedbackMessage && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs transition-all ${
          feedbackMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' 
            : 'bg-rose-50 text-rose-800 border border-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">สมาชิกทั้งหมด</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{users.length} คน</div>
            <div className="text-[11px] text-slate-400 mt-0.5">ลงทะเบียนในระบบร้านใบตอง</div>
          </div>
          <div className="p-3 bg-[#b2dfdb]/40 text-[#00796b] rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">สถานะปกติ (Active)</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              {users.filter(u => (u.status || 'active') === 'active').length} คน
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5">สามารถเข้าสู่ระบบและใช้งานได้</div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">ระงับชั่วคราว (Suspended)</div>
            <div className="text-2xl font-bold text-amber-700 mt-1">
              {users.filter(u => u.status === 'suspended').length} คน
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">ถูกระงับสิทธิ์การใช้งานชั่วคราว</div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <UserX className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อ-นามสกุล, รหัสผู้ใช้งาน, อีเมล, หรือเบอร์โทรศัพท์..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#b2dfdb] focus:border-[#00796b] outline-none bg-white"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 font-medium">สถานะ:</span>
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
              filterStatus === 'all'
                ? 'bg-[#00796b] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
              filterStatus === 'active'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ปกติ ({users.filter(u => (u.status || 'active') === 'active').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('suspended')}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
              filterStatus === 'suspended'
                ? 'bg-amber-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ระงับ ({users.filter(u => u.status === 'suspended').length})
          </button>
        </div>
      </div>

      {/* Members Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="font-bold text-slate-800 text-xs sm:text-sm">
            รายชื่อสมาชิกในระบบ ({filteredUsers.length} รายการ)
          </div>
          <div className="text-[11px] text-slate-500">
            คลิกปุ่ม "แก้ไข" หรือ "ลบ" ทางด้านขวาของแต่ละแถวเพื่อจัดการ
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#b2dfdb]/30 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-12 text-center">ลำดับ</th>
                <th className="py-3 px-3 w-32">รหัสผู้ใช้งาน</th>
                <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3 px-3 w-32">เบอร์โทรศัพท์</th>
                <th className="py-3 px-4">อีเมล (Email)</th>
                <th className="py-3 px-3 w-28 text-center">วันที่ลงทะเบียน</th>
                <th className="py-3 px-3 w-24 text-center">สถานะ</th>
                <th className="py-3 px-3 w-36 text-center">จัดการข้อมูล</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-10 h-10 text-slate-300 mb-2" />
                      <span className="font-medium text-slate-500">ไม่พบข้อมูลสมาชิกตามเงื่อนไข</span>
                      <span className="text-[11px] text-slate-400 mt-1">
                        ลองเปลี่ยนคำค้นหา หรือกดปุ่ม "+ เพิ่มสมาชิกใหม่" ด้านบน
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const isSuspended = user.status === 'suspended';
                  return (
                    <tr 
                      key={user.userId} 
                      className={`hover:bg-slate-50 transition-colors ${
                        isSuspended ? 'bg-amber-50/40 text-slate-500' : ''
                      }`}
                    >
                      {/* No. */}
                      <td className="py-3 px-3 text-center text-slate-500 font-mono">
                        {idx + 1}
                      </td>

                      {/* User ID */}
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => handleCopyId(user.userId)}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg font-mono font-bold text-xs bg-[#b2dfdb]/40 text-[#00796b] hover:bg-[#b2dfdb]/70 transition"
                          title="คลิกเพื่อคัดลอกรหัส"
                        >
                          <span>{user.userId}</span>
                          {copiedId === user.userId ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-2.5 h-2.5 text-slate-400" />
                          )}
                        </button>
                      </td>

                      {/* Full Name */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 text-xs">
                          {user.fullName}
                        </div>
                        {user.note && (
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {user.note}
                          </div>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-3 font-mono text-slate-700">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{user.phone}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[180px]">{user.email}</span>
                        </div>
                      </td>

                      {/* Registered Date */}
                      <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">
                        {new Date(user.registeredAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition ${
                            isSuspended
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          }`}
                          title="คลิกเพื่อสลับสถานะ"
                        >
                          {isSuspended ? (
                            <>
                              <UserX className="w-3 h-3" />
                              <span>ระงับ</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3" />
                              <span>ปกติ</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(user)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="แก้ไขข้อมูลสมาชิกนี้"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="ลบสมาชิกนี้ออกจากระบบ"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* ================= MODAL: ADD / EDIT MEMBER ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-[#8d6e63] text-white rounded-xl shadow-xs">
                {editingUser ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {editingUser ? 'แก้ไขข้อมูลสมาชิก' : 'เพิ่มสมาชิกใหม่ในระบบ'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingUser ? `รหัสสมาชิก: ${editingUser.userId}` : 'กรอกข้อมูลสมาชิกใหม่เพื่อเพิ่มเข้าระบบ'}
                </p>
              </div>
            </div>

            {formErrors.general && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formErrors.general}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* User ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสผู้ใช้งาน (User ID) <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={formUserId}
                      onChange={(e) => setFormUserId(e.target.value.toUpperCase())}
                      placeholder="เช่น BT-10229"
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#b2dfdb] focus:border-[#00796b] outline-none bg-white"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormUserId(generateUserId())}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl border border-slate-200 transition flex items-center gap-1"
                    title="สุ่มรหัสผู้ใช้งานอัตโนมัติ"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>สุ่มรหัส</span>
                  </button>
                </div>
                {formErrors.userId && (
                  <p className="text-[11px] text-rose-600 mt-1">{formErrors.userId}</p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อ - นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="เช่น สมชาย ใจดี"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#b2dfdb] focus:border-[#00796b] outline-none bg-white"
                  required
                />
                {formErrors.fullName && (
                  <p className="text-[11px] text-rose-600 mt-1">{formErrors.fullName}</p>
                )}
                <p className="text-[10px] text-slate-400 mt-0.5">
                  * ตรวจสอบความถูกต้องตามพจนานุกรม ห้ามใส่ตัวอักษรมั่ว
                </p>
              </div>

              {/* Phone & Email Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เบอร์โทรศัพท์ (10 หลัก) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      maxLength={10}
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="เช่น 0812345678"
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#b2dfdb] focus:border-[#00796b] outline-none bg-white"
                      required
                    />
                  </div>
                  {formErrors.phone && (
                    <p className="text-[11px] text-rose-600 mt-1">{formErrors.phone}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    อีเมล (Email) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="example@email.com"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#b2dfdb] focus:border-[#00796b] outline-none bg-white"
                      required
                    />
                  </div>
                  {formErrors.email && (
                    <p className="text-[11px] text-rose-600 mt-1">{formErrors.email}</p>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  สถานะการเข้าใช้งาน
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormStatus('active')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border transition ${
                      formStatus === 'active'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ปกติ (Active)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormStatus('suspended')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border transition ${
                      formStatus === 'suspended'
                        ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <UserX className="w-3.5 h-3.5 text-amber-600" />
                    <span>ระงับการใช้งาน</span>
                  </button>
                </div>
              </div>

              {/* Note / Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมายเหตุ / แผนกงาน (Optional)
                </label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="เช่น แผนกจัดซื้อ, สมาชิก VIP, แคชเชียร์ประจำร้าน"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#b2dfdb] focus:border-[#00796b] outline-none bg-white"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-[#00796b] hover:bg-[#004d40] text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  {editingUser ? 'บันทึกการแก้ไข' : 'ยืนยันเพิ่มสมาชิก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
