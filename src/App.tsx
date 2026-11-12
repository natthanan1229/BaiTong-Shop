import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { AuthSession, Product, PurchaseRecord, SaleRecord, ExpenseRecord } from './types';
import { store } from './services/store';
import { supabaseService } from './services/supabaseService';
import { Header } from './components/Header';
import { LoginRegisterPage } from './pages/LoginRegisterPage';
import { ProgrammeMenu } from './pages/ProgrammeMenu';
import { InventoryPage } from './pages/InventoryPage';
import { PurchasingPage } from './pages/PurchasingPage';
import { PurchaseSummaryPage } from './pages/PurchaseSummaryPage';
import { SalesPosPage } from './pages/SalesPosPage';
import { SalesSummaryPage } from './pages/SalesSummaryPage';
import { IncomeExpensePage } from './pages/IncomeExpensePage';
import { ProfitLossPage } from './pages/ProfitLossPage';
import { FormulaSettingsModal } from './pages/FormulaSettingsModal';
import { MemberManagementPage } from './pages/MemberManagementPage';

export const App: React.FC = () => {
  const [session, setSession] = useState<AuthSession>(() => store.getAuthSession());
  const [currentPage, setCurrentPage] = useState<string>('programme');
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const refreshData = () => {
    setProducts(store.getProducts());
    setPurchases(store.getPurchases());
    setSales(store.getSales());
    setExpenses(store.getExpenses());
  };

  useEffect(() => {
    // 1. Initial cloud sync from Supabase
    store.syncWithSupabase().then(() => {
      refreshData();
    });
    refreshData();

    // 2. Realtime listener: triggers whenever any device updates Supabase tables
    const unsubscribe = supabaseService.subscribeToChanges((table) => {
      console.log('Realtime table update received from Supabase:', table);
      store.syncWithSupabase().then(() => {
        refreshData();
      });
    });

    // 3. Periodic cloud sync every 8 seconds (ensures cross-device consistency)
    const interval = setInterval(() => {
      store.syncWithSupabase().then(() => {
        refreshData();
      });
    }, 8000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [session]);

  const handleLoginSuccess = (newSession: AuthSession) => {
    setSession(newSession);
    setCurrentPage('programme');
    refreshData();
  };

  const handleLogout = () => {
    if (window.confirm('คุณต้องการออกจากระบบหรือไม่?')) {
      store.logout();
      setSession({ role: null });
      setCurrentPage('programme');
    }
  };

  // If not logged in, show Login & Registration Page with Banner
  if (!session.role) {
    return <LoginRegisterPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <Header
          session={session}
          currentPage={currentPage}
          onNavigate={(page) => setCurrentPage(page)}
          onLogout={handleLogout}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <main className="max-w-7xl mx-auto px-4 py-6">
          {currentPage === 'programme' && (
            <ProgrammeMenu
              session={session}
              products={products}
              purchases={purchases}
              sales={sales}
              onNavigate={(page) => setCurrentPage(page)}
            />
          )}

          {currentPage === 'inventory' && (
            <InventoryPage
              session={session}
              products={products}
              onRefresh={refreshData}
            />
          )}

          {currentPage === 'purchasing' && (
            <PurchasingPage
              session={session}
              products={products}
              onRefresh={refreshData}
              onNavigate={(page) => setCurrentPage(page)}
            />
          )}

          {currentPage === 'purchase-summary' && (
            <PurchaseSummaryPage
              purchases={purchases}
            />
          )}

          {currentPage === 'pos' && (
            <SalesPosPage
              session={session}
              products={products}
              onRefresh={refreshData}
              onNavigate={(page) => setCurrentPage(page)}
            />
          )}

          {currentPage === 'sales-summary' && (
            <SalesSummaryPage
              sales={sales}
            />
          )}

          {currentPage === 'income-expense' && (
            session.role === 'admin' ? (
              <IncomeExpensePage
                sales={sales}
                purchases={purchases}
                expenses={expenses}
                onRefresh={refreshData}
              />
            ) : (
              <div className="p-8 bg-white rounded-2xl border border-rose-200 text-center max-w-lg mx-auto shadow-sm my-12 animate-in fade-in">
                <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-slate-800">เฉพาะผู้ดูแลระบบ (ADMIN) เท่านั้น</h2>
                <p className="text-xs text-slate-500 mt-1">
                  ผู้ใช้งานทั่วไปไม่มีสิทธิ์เข้าถึงหน้ารายได้-ค่าใช้จ่าย กรุณาเข้าสู่ระบบด้วยบัญชีแอดมิน
                </p>
                <button
                  onClick={() => setCurrentPage('programme')}
                  className="mt-4 px-4 py-2 bg-[#00796b] hover:bg-[#004d40] text-white text-xs font-semibold rounded-xl transition"
                >
                  กลับสู่หน้าหลัก
                </button>
              </div>
            )
          )}

          {currentPage === 'profit-loss' && (
            session.role === 'admin' ? (
              <ProfitLossPage
                sales={sales}
                purchases={purchases}
                expenses={expenses}
              />
            ) : (
              <div className="p-8 bg-white rounded-2xl border border-rose-200 text-center max-w-lg mx-auto shadow-sm my-12 animate-in fade-in">
                <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-slate-800">เฉพาะผู้ดูแลระบบ (ADMIN) เท่านั้น</h2>
                <p className="text-xs text-slate-500 mt-1">
                  ผู้ใช้งานทั่วไปไม่มีสิทธิ์เข้าถึงหน้างบกำไรขาดทุน กรุณาเข้าสู่ระบบด้วยบัญชีแอดมิน
                </p>
                <button
                  onClick={() => setCurrentPage('programme')}
                  className="mt-4 px-4 py-2 bg-[#00796b] hover:bg-[#004d40] text-white text-xs font-semibold rounded-xl transition"
                >
                  กลับสู่หน้าหลัก
                </button>
              </div>
            )
          )}

          {currentPage === 'members' && (
            <MemberManagementPage
              session={session}
              onRefresh={refreshData}
            />
          )}
        </main>
      </div>

      {/* Settings Modal (for Admin) */}
      {isSettingsOpen && (
        <FormulaSettingsModal
          onClose={() => setIsSettingsOpen(false)}
          onRefresh={refreshData}
        />
      )}

      {/* Global Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">BaiTong Shop</span>
            <span className="text-slate-300">|</span>
            <span>ระบบร้านอุปกรณ์เครื่องเขียน</span>
          </div>
          <div className="text-[11px] text-slate-400">
            โครงสร้างตารางและสูตรอ้างอิงจากไฟล์ Excel: ร้านอุปกรณ์เครื่องเขียน.xlsx
          </div>
        </div>
      </footer>
    </div>
  );
};
export default App;
