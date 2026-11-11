import { Product, PurchaseRecord, SaleRecord, ExpenseRecord, RegisteredUser, AuthSession, FormulaConfig } from '../types';
import { INITIAL_PRODUCTS, INITIAL_FORMULA_CONFIG } from '../data/initialProducts';
import { createClient } from '@supabase/supabase-js';

const STORAGE_KEYS = {
  PRODUCTS: 'baitong_products_v1',
  PURCHASES: 'baitong_purchases_v1',
  SALES: 'baitong_sales_v1',
  EXPENSES: 'baitong_expenses_v1',
  USERS: 'baitong_users_v1',
  AUTH: 'baitong_auth_session_v1',
  CONFIG: 'baitong_formula_config_v1',
};

// Supabase client initialization with user credentials
const SUPABASE_URL = 'https://xpyltldpeqsqijsbhdpf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_RJQasgP4Z2sSsNGMDEqGFQ_-KI6l1lq';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class StoreService {
  // ------------------ PRODUCTS ------------------
  getProducts(): Product[] {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!data) {
      // Seed with initial products
      const initial = this.applyFormulas(INITIAL_PRODUCTS, this.getFormulaConfig());
      this.saveProducts(initial);
      return initial;
    }
    try {
      const parsed: Product[] = JSON.parse(data);
      return this.applyFormulas(parsed, this.getFormulaConfig());
    } catch {
      return INITIAL_PRODUCTS;
    }
  }

  saveProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }

  addProduct(product: Omit<Product, 'id'>): Product {
    const products = this.getProducts();
    const newId = (products.length > 0 ? Math.max(...products.map(p => parseInt(p.id) || 0)) + 1 : 1).toString();
    const config = this.getFormulaConfig();
    const newProduct: Product = {
      ...product,
      id: newId,
      receivedQty: product.receivedQty ?? product.stockQty,
      soldQty: product.soldQty ?? 0,
      status: product.stockQty < config.reorderThreshold ? 'สั่งซื้อ' : 'ปกติ'
    };
    const updated = [newProduct, ...products];
    this.saveProducts(updated);
    return newProduct;
  }

  updateProduct(updatedProduct: Product): void {
    const products = this.getProducts();
    const config = this.getFormulaConfig();
    const idx = products.findIndex(p => p.id === updatedProduct.id || p.barcode === updatedProduct.barcode);
    if (idx !== -1) {
      const stock = updatedProduct.stockQty;
      products[idx] = {
        ...updatedProduct,
        status: stock < config.reorderThreshold ? 'สั่งซื้อ' : 'ปกติ'
      };
      this.saveProducts(products);
    }
  }

  deleteProduct(idOrBarcode: string): void {
    const products = this.getProducts().filter(p => p.id !== idOrBarcode && p.barcode !== idOrBarcode);
    this.saveProducts(products);
  }

  resetProductsToDefault(): void {
    this.saveProducts(INITIAL_PRODUCTS);
  }

  // ------------------ PURCHASES ------------------
  getPurchases(): PurchaseRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  addPurchase(purchase: Omit<PurchaseRecord, 'id'>): PurchaseRecord {
    const purchases = this.getPurchases();
    const newRecord: PurchaseRecord = {
      ...purchase,
      id: 'PO-' + Date.now(),
    };
    const updated = [newRecord, ...purchases];
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(updated));

    // Update Inventory Stock (บันทึกรับสินค้าจากยอดซื้อสินค้า)
    const products = this.getProducts();
    purchase.items.forEach(item => {
      const prod = products.find(p => p.barcode === item.barcode);
      if (prod) {
        prod.stockQty = (prod.stockQty || 0) + item.quantity;
        prod.receivedQty = (prod.receivedQty || 0) + item.quantity;
      }
    });
    this.saveProducts(products);

    return newRecord;
  }

  // ------------------ SALES ------------------
  getSales(): SaleRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.SALES);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  addSale(sale: Omit<SaleRecord, 'id' | 'receiptNumber'>): SaleRecord {
    const sales = this.getSales();
    const receiptNumber = 'RC' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + (sales.length + 1).toString().padStart(4, '0');
    const newRecord: SaleRecord = {
      ...sale,
      id: 'SL-' + Date.now(),
      receiptNumber,
    };
    const updated = [newRecord, ...sales];
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(updated));

    // Deduct Inventory Stock (บันทึกจ่ายจากยอดขายสินค้า)
    const products = this.getProducts();
    sale.items.forEach(item => {
      const prod = products.find(p => p.barcode === item.barcode);
      if (prod) {
        prod.stockQty = Math.max(0, (prod.stockQty || 0) - item.quantity);
        prod.soldQty = (prod.soldQty || 0) + item.quantity;
      }
    });
    this.saveProducts(products);

    return newRecord;
  }

  // ------------------ EXPENSES ------------------
  getExpenses(): ExpenseRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  addExpense(expense: Omit<ExpenseRecord, 'id'>): ExpenseRecord {
    const expenses = this.getExpenses();
    const newRecord: ExpenseRecord = {
      ...expense,
      id: 'EXP-' + Date.now(),
    };
    const updated = [newRecord, ...expenses];
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updated));
    return newRecord;
  }

  deleteExpense(id: string): void {
    const expenses = this.getExpenses().filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }

  // ------------------ USERS ------------------
  getUsers(): RegisteredUser[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!data) {
      // Provide initial sample users if none exist
      const sampleUsers: RegisteredUser[] = [
        {
          userId: 'BT-10229',
          fullName: 'สมชาย ใจดี',
          phone: '0812345678',
          email: 'somchai@email.com',
          registeredAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          status: 'active',
          note: 'สมาชิกประจำร้าน แผนกจัดซื้อ',
        },
        {
          userId: 'BT-85943',
          fullName: 'ใจดี ใจดำ',
          phone: '0899887766',
          email: 'jaidee@email.com',
          registeredAt: new Date(Date.now() - 86400000 * 1).toISOString(),
          status: 'active',
          note: 'เจ้าหน้าที่คลังสินค้า',
        }
      ];
      this.saveUsers(sampleUsers);
      return sampleUsers;
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  saveUsers(users: RegisteredUser[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  registerUser(userData: Omit<RegisteredUser, 'registeredAt'>): RegisteredUser {
    const users = this.getUsers();
    // Check if email already registered
    const existing = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existing) {
      throw new Error(`อีเมล ${userData.email} ได้ลงทะเบียนไว้แล้วในระบบ รหัสผู้ใช้งานของคุณคือ: ${existing.userId}`);
    }
    const newUser: RegisteredUser = {
      ...userData,
      status: userData.status || 'active',
      registeredAt: new Date().toISOString(),
    };
    const updated = [newUser, ...users];
    this.saveUsers(updated);
    return newUser;
  }

  addUser(userData: Omit<RegisteredUser, 'registeredAt'> & { registeredAt?: string }): RegisteredUser {
    const users = this.getUsers();
    const existingId = users.find(u => u.userId.toUpperCase() === userData.userId.toUpperCase());
    if (existingId) {
      throw new Error(`รหัสผู้ใช้งาน ${userData.userId} มีอยู่ในระบบแล้ว`);
    }
    const existingEmail = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existingEmail) {
      throw new Error(`อีเมล ${userData.email} มีอยู่ในระบบแล้ว`);
    }

    const newUser: RegisteredUser = {
      ...userData,
      status: userData.status || 'active',
      registeredAt: userData.registeredAt || new Date().toISOString(),
    };
    const updated = [newUser, ...users];
    this.saveUsers(updated);
    return newUser;
  }

  updateUser(updatedUser: RegisteredUser): void {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.userId.toUpperCase() === updatedUser.userId.toUpperCase());
    if (idx !== -1) {
      users[idx] = {
        ...users[idx],
        ...updatedUser,
      };
      this.saveUsers(users);
    } else {
      throw new Error(`ไม่พบสมาชิกที่มีรหัสผู้ใช้งาน ${updatedUser.userId}`);
    }
  }

  deleteUser(userId: string): void {
    const users = this.getUsers().filter(u => u.userId.toUpperCase() !== userId.toUpperCase());
    this.saveUsers(users);
  }

  findUser(email: string, userId: string): RegisteredUser | null {
    const users = this.getUsers();
    const user = users.find(u => 
      u.email.toLowerCase().trim() === email.toLowerCase().trim() && 
      u.userId.toUpperCase().trim() === userId.toUpperCase().trim()
    );
    return user || null;
  }

  // ------------------ AUTH SESSION ------------------
  getAuthSession(): AuthSession {
    const data = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (!data) return { role: null };
    try {
      return JSON.parse(data);
    } catch {
      return { role: null };
    }
  }

  setAuthSession(session: AuthSession): void {
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(session));
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
  }

  // ------------------ FORMULA CONFIG ------------------
  getFormulaConfig(): FormulaConfig {
    const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!data) return INITIAL_FORMULA_CONFIG;
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_FORMULA_CONFIG;
    }
  }

  updateFormulaConfig(config: FormulaConfig): void {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    // Re-apply to products
    const products = this.getProducts();
    this.saveProducts(this.applyFormulas(products, config));
  }

  private applyFormulas(products: Product[], config: FormulaConfig): Product[] {
    return products.map(p => ({
      ...p,
      status: p.stockQty < config.reorderThreshold ? 'สั่งซื้อ' : 'ปกติ'
    }));
  }
}

export const store = new StoreService();
