import { Product, PurchaseRecord, SaleRecord, ExpenseRecord, RegisteredUser, AuthSession, FormulaConfig } from '../types';
import { INITIAL_PRODUCTS, INITIAL_FORMULA_CONFIG } from '../data/initialProducts';
import { supabaseService, supabase } from './supabaseService';

export { supabase };

const STORAGE_KEYS = {
  PRODUCTS: 'baitong_products_v1',
  PURCHASES: 'baitong_purchases_v1',
  SALES: 'baitong_sales_v1',
  EXPENSES: 'baitong_expenses_v1',
  USERS: 'baitong_users_v1',
  AUTH: 'baitong_auth_session_v1',
  CONFIG: 'baitong_formula_config_v1',
};

class StoreService {
  private isInitialized = false;

  // Initialize and sync with Supabase tables on load
  async syncWithSupabase(): Promise<void> {
    try {
      // 1. Fetch Inventory_TB from Supabase
      const remoteProducts = await supabaseService.fetchInventory();
      if (remoteProducts && remoteProducts.length > 0) {
        this.saveProducts(remoteProducts);
      } else if (!this.isInitialized) {
        // If Supabase table is empty, seed initial 30 products into Supabase
        const current = this.getProducts();
        for (const p of current) {
          await supabaseService.saveInventoryItem(p);
        }
      }

      // 2. Fetch Employee_TB from Supabase
      const remoteEmployees = await supabaseService.fetchEmployees();
      if (remoteEmployees && remoteEmployees.length > 0) {
        this.saveUsers(remoteEmployees);
      } else if (!this.isInitialized) {
        const currentUsers = this.getUsers();
        for (const u of currentUsers) {
          await supabaseService.saveEmployee(u);
        }
      }

      // 3. Fetch Summary_Expans_TB from Supabase
      const remoteExpenses = await supabaseService.fetchSummaryExpenses();
      if (remoteExpenses !== null) {
        this.saveExpenses(remoteExpenses);
      }

      // 4. Real-time Subscription to Inventory_TB (Cross-device instant sync)
      supabase
        .channel('public:Inventory_TB_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'Inventory_TB' }, async () => {
          const fresh = await supabaseService.fetchInventory();
          if (fresh && fresh.length > 0) {
            this.saveProducts(fresh);
            window.dispatchEvent(new CustomEvent('inventory-updated'));
          }
        })
        .subscribe();

      this.isInitialized = true;
    } catch (err) {
      console.warn('Supabase sync note:', err);
    }
  }

  async initSupabaseSync(): Promise<void> {
    return this.syncWithSupabase();
  }

  // ------------------ PRODUCTS (Inventory_TB) ------------------
  getProducts(): Product[] {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!data) {
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
    const cost = product.costPrice || 0;
    const sell = product.sellPrice || 0;
    const countIn = product.countCostIn !== undefined ? product.countCostIn : (product.receivedQty !== undefined ? product.receivedQty : null);
    const sumCost = countIn !== null ? countIn * cost : null;
    const countSold = product.countSelf ?? null;
    const sumSold = countSold !== null ? countSold * sell : null;
    const stock = countIn !== null ? Math.max(0, countIn - (countSold || 0)) : null;
    const priceSum = cost;
    const sumStock = stock !== null ? stock * priceSum : null;

    const newProduct: Product = {
      ...product,
      id: newId,
      costPrice: cost,
      sellPrice: sell,
      countCostIn: countIn,
      sumCost: sumCost,
      countSelf: countSold,
      sumSelfCost: sumSold,
      stockQty: stock,
      priceSum: priceSum,
      sumStock: sumStock,
      status: stock !== null ? (stock < config.reorderThreshold ? 'สั่งซื้อ' : 'ปกติ') : null,
      receivedQty: countIn,
      receivedTotal: sumCost,
      soldQty: countSold,
      soldTotal: sumSold,
      stockTotal: sumStock,
    };
    const updated = [newProduct, ...products];
    this.saveProducts(updated);

    // Sync to Supabase Inventory_TB
    supabaseService.saveInventoryItem(newProduct).catch(() => {});

    return newProduct;
  }

  updateProduct(updatedProduct: Product): void {
    const products = this.getProducts();
    const config = this.getFormulaConfig();
    const idx = products.findIndex(p => p.id === updatedProduct.id || p.barcode === updatedProduct.barcode);
    if (idx !== -1) {
      const cost = updatedProduct.costPrice || 0;
      const sell = updatedProduct.sellPrice || 0;
      const countIn = updatedProduct.countCostIn !== undefined ? updatedProduct.countCostIn : (updatedProduct.receivedQty ?? null);
      const sumCost = countIn !== null ? countIn * cost : null;
      const countSold = updatedProduct.countSelf !== undefined ? updatedProduct.countSelf : (updatedProduct.soldQty ?? null);
      const sumSold = countSold !== null ? countSold * sell : null;
      const stock = countIn !== null ? Math.max(0, countIn - (countSold || 0)) : null;
      const priceSum = cost;
      const sumStock = stock !== null ? stock * priceSum : null;

      const finalProduct: Product = {
        ...updatedProduct,
        costPrice: cost,
        sellPrice: sell,
        countCostIn: countIn,
        sumCost: sumCost,
        countSelf: countSold,
        sumSelfCost: sumSold,
        stockQty: stock,
        priceSum: priceSum,
        sumStock: sumStock,
        status: stock !== null ? (stock < config.reorderThreshold ? 'สั่งซื้อ' : 'ปกติ') : null,
        receivedQty: countIn,
        receivedTotal: sumCost,
        soldQty: countSold,
        soldTotal: sumSold,
        stockTotal: sumStock,
      };
      products[idx] = finalProduct;
      this.saveProducts(products);

      // Sync to Supabase Inventory_TB
      supabaseService.saveInventoryItem(finalProduct).catch(() => {});
    }
  }

  deleteProduct(idOrBarcode: string): void {
    const target = this.getProducts().find(p => p.id === idOrBarcode || p.barcode === idOrBarcode);
    const products = this.getProducts().filter(p => p.id !== idOrBarcode && p.barcode !== idOrBarcode);
    this.saveProducts(products);

    if (target) {
      // Sync delete to Supabase Inventory_TB
      supabaseService.deleteInventoryItem(target.barcode).catch(() => {});
    }
  }

  resetProductsToDefault(): void {
    this.saveProducts(INITIAL_PRODUCTS);
    INITIAL_PRODUCTS.forEach(p => supabaseService.saveInventoryItem(p).catch(() => {}));
  }

  async syncAllInventoryToSupabase(): Promise<{ total: number; successCount: number; errors: string[] }> {
    const products = this.getProducts();
    let successCount = 0;
    const errors: string[] = [];
    for (const p of products) {
      const ok = await supabaseService.saveInventoryItem(p);
      if (ok) {
        successCount++;
      } else {
        errors.push(`${p.name} (${p.barcode})`);
      }
    }
    return { total: products.length, successCount, errors };
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

    // Update Inventory Stock (Rule 1 & 2: In_Count_Cost_IN & In_Sum_Cost)
    const products = this.getProducts();
    const config = this.getFormulaConfig();
    purchase.items.forEach(item => {
      const prod = products.find(p => p.barcode === item.barcode);
      if (prod) {
        const cost = prod.costPrice || 0;
        const countIn = (prod.countCostIn || 0) + item.quantity;
        const countSold = prod.countSelf || 0;
        prod.countCostIn = countIn;
        prod.sumCost = countIn * cost;
        prod.stockQty = Math.max(0, countIn - countSold);
        prod.priceSum = cost;
        prod.sumStock = prod.stockQty * cost;
        prod.status = prod.stockQty < config.reorderThreshold ? 'สั่งซื้อ' : 'ปกติ';

        prod.receivedQty = countIn;
        prod.receivedTotal = prod.sumCost;
        prod.stockTotal = prod.sumStock;

        // Sync each modified item to Supabase Inventory_TB
        supabaseService.saveInventoryItem(prod).catch(() => {});
      }
    });
    this.saveProducts(products);

    // Sync to Supabase Summary_Expans_TB (วิเคราะห์ค่าใช้จ่ายจาก Inventory_TB และยอดซื้อ)
    supabaseService.syncExpenseFromInventory(products, updated).catch(() => {});

    return newRecord;
  }

  savePurchases(purchases: PurchaseRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  }

  async deletePurchaseItem(
    purchaseId: string,
    barcode: string,
    qty: number,
    deductStock: boolean = true
  ): Promise<{ success: boolean; message: string }> {
    const purchases = this.getPurchases();
    const purchaseIndex = purchases.findIndex(p => p.id === purchaseId);
    if (purchaseIndex === -1) {
      return { success: false, message: 'ไม่พบรายการใบสั่งซื้อที่ระบุ' };
    }

    const purchase = purchases[purchaseIndex];
    const itemIndex = purchase.items.findIndex(it => it.barcode === barcode);
    if (itemIndex === -1) {
      return { success: false, message: 'ไม่พบรายการสินค้านี้ในใบสั่งซื้อ' };
    }

    const item = purchase.items[itemIndex];
    const actualQty = qty || item.quantity;
    const itemName = item.name;

    // 1. Deduct Inventory Stock (ปรับลดยอดรับเข้าออกจากคลังสินค้า: In_Count_Cost_IN)
    if (deductStock) {
      const products = this.getProducts();
      const config = this.getFormulaConfig();
      const prod = products.find(p => p.barcode === barcode);
      if (prod) {
        const cost = prod.costPrice || 0;
        const currentIn = prod.countCostIn || 0;
        const countIn = Math.max(0, currentIn - actualQty);
        const countSold = prod.countSelf || 0;

        if (countIn <= 0) {
          prod.countCostIn = null;
          prod.sumCost = null;
          prod.stockQty = null;
          prod.sumStock = null;
          prod.status = null;
          prod.receivedQty = null;
          prod.receivedTotal = null;
          prod.stockTotal = null;
        } else {
          prod.countCostIn = countIn;
          prod.sumCost = countIn * cost;
          prod.stockQty = Math.max(0, countIn - countSold);
          prod.priceSum = cost;
          prod.sumStock = prod.stockQty * cost;
          prod.status = prod.stockQty < config.reorderThreshold ? 'สั่งซื้อ' : 'ปกติ';
          prod.receivedQty = countIn;
          prod.receivedTotal = prod.sumCost;
          prod.stockTotal = prod.sumStock;
        }

        this.saveProducts(products);
        supabaseService.saveInventoryItem(prod).catch(() => {});
      }
    }

    // 2. Remove or update purchase items
    if (purchase.items.length <= 1) {
      purchases.splice(purchaseIndex, 1);
    } else {
      purchase.items.splice(itemIndex, 1);
      purchase.netTotal = purchase.items.reduce((s, it) => s + it.total, 0);
    }
    this.savePurchases(purchases);

    // 3. Sync to Supabase Summary_Expans_TB
    const currentProducts = this.getProducts();
    supabaseService.syncExpenseFromInventory(currentProducts, purchases).catch(() => {});

    return {
      success: true,
      message: `ลบรายการ "${itemName}" สำเร็จ (ปรับลดยอดรับเข้าคลัง ${actualQty} ชิ้นเรียบร้อย)`
    };
  }

  async deletePurchaseRecord(
    purchaseId: string,
    deductStock: boolean = true
  ): Promise<{ success: boolean; message: string }> {
    const purchases = this.getPurchases();
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) {
      return { success: false, message: 'ไม่พบเลขที่ใบสั่งซื้อนี้' };
    }

    if (deductStock) {
      const products = this.getProducts();
      const config = this.getFormulaConfig();
      purchase.items.forEach(item => {
        const prod = products.find(p => p.barcode === item.barcode);
        if (prod) {
          const cost = prod.costPrice || 0;
          const currentIn = prod.countCostIn || 0;
          const countIn = Math.max(0, currentIn - item.quantity);
          const countSold = prod.countSelf || 0;

          if (countIn <= 0) {
            prod.countCostIn = null;
            prod.sumCost = null;
            prod.stockQty = null;
            prod.sumStock = null;
            prod.status = null;
            prod.receivedQty = null;
            prod.receivedTotal = null;
            prod.stockTotal = null;
          } else {
            prod.countCostIn = countIn;
            prod.sumCost = countIn * cost;
            prod.stockQty = Math.max(0, countIn - countSold);
            prod.priceSum = cost;
            prod.sumStock = prod.stockQty * cost;
            prod.status = prod.stockQty < config.reorderThreshold ? 'สั่งซื้อ' : 'ปกติ';
            prod.receivedQty = countIn;
            prod.receivedTotal = prod.sumCost;
            prod.stockTotal = prod.sumStock;
          }

          supabaseService.saveInventoryItem(prod).catch(() => {});
        }
      });
      this.saveProducts(products);
    }

    const updated = purchases.filter(p => p.id !== purchaseId);
    this.savePurchases(updated);

    const currentProducts = this.getProducts();
    supabaseService.syncExpenseFromInventory(currentProducts, updated).catch(() => {});

    return {
      success: true,
      message: `ลบใบสั่งซื้อ "${purchaseId}" สำเร็จเรียบร้อย`
    };
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

    // Deduct Inventory Stock (Rule 3 & 4: In_Count_Self & In_Sum_Self)
    const products = this.getProducts();
    const config = this.getFormulaConfig();
    sale.items.forEach(item => {
      const prod = products.find(p => p.barcode === item.barcode);
      if (prod) {
        const cost = prod.costPrice || 0;
        const sell = prod.sellPrice || 0;
        const countSold = (prod.countSelf || 0) + item.quantity;
        prod.countSelf = countSold;
        prod.sumSelfCost = countSold * sell;
        prod.lastSaleDate = sale.date;
        prod.lastReceipt = receiptNumber;

        // Rule 5: In_Qty คือ จำนวนที่อ้างอิงมาจาก In_Count_Cost_IN (หักลดเมื่อขาย)
        if (prod.countCostIn !== null && prod.countCostIn !== undefined) {
          prod.stockQty = Math.max(0, prod.countCostIn - countSold);
          prod.priceSum = cost;
          prod.sumStock = prod.stockQty * cost;
          prod.status = prod.stockQty < config.reorderThreshold ? 'สั่งซื้อ' : 'ปกติ';
        } else {
          prod.stockQty = null;
          prod.priceSum = cost;
          prod.sumStock = null;
          prod.status = null;
        }

        prod.soldQty = countSold;
        prod.soldTotal = prod.sumSelfCost;
        prod.stockTotal = prod.sumStock;

        // Sync item update to Supabase Inventory_TB
        supabaseService.saveInventoryItem(prod).catch(() => {});
      }
    });
    this.saveProducts(products);

    // Sync to Supabase Summary_Self_TB (บันทึกยอดขายสินค้าโดยวิเคราะห์จาก Inventory_TB)
    supabaseService.recordSaleToSummarySelf(newRecord).catch(() => {});

    return newRecord;
  }

  saveSales(sales: SaleRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }

  async deleteSaleItem(
    receiptNumber: string,
    barcode: string,
    qty: number,
    restoreStock: boolean = true
  ): Promise<{ success: boolean; message: string }> {
    const sales = this.getSales();
    const saleIndex = sales.findIndex(s => s.receiptNumber === receiptNumber);
    if (saleIndex === -1) {
      return { success: false, message: 'ไม่พบรายการขายตามเลขที่ใบเสร็จที่ระบุ' };
    }

    const sale = sales[saleIndex];
    const itemIndex = sale.items.findIndex(it => it.barcode === barcode);
    if (itemIndex === -1) {
      return { success: false, message: 'ไม่พบรายการสินค้านี้ในใบเสร็จ' };
    }

    const item = sale.items[itemIndex];
    const actualQty = qty || item.quantity;
    const itemName = item.name;

    // 1. Restore Inventory Stock in store and Supabase Inventory_TB
    if (restoreStock) {
      const products = this.getProducts();
      const config = this.getFormulaConfig();
      const prod = products.find(p => p.barcode === barcode);
      if (prod) {
        const cost = prod.costPrice || 0;
        const sell = prod.sellPrice || 0;
        const currentSold = prod.countSelf || 0;
        const countSold = Math.max(0, currentSold - actualQty);

        if (countSold <= 0) {
          prod.countSelf = null;
          prod.sumSelfCost = null;
          prod.lastSaleDate = null;
          prod.lastReceipt = null;
          prod.soldQty = null;
          prod.soldTotal = null;
        } else {
          prod.countSelf = countSold;
          prod.sumSelfCost = countSold * sell;
          prod.soldQty = countSold;
          prod.soldTotal = prod.sumSelfCost;
        }

        if (prod.countCostIn !== null && prod.countCostIn !== undefined) {
          prod.stockQty = Math.max(0, prod.countCostIn - (countSold || 0));
          prod.priceSum = cost;
          prod.sumStock = prod.stockQty * cost;
          prod.status = prod.stockQty < config.reorderThreshold ? 'สั่งซื้อ' : 'ปกติ';
        } else {
          prod.stockQty = null;
          prod.priceSum = cost;
          prod.sumStock = null;
          prod.status = null;
        }
        prod.stockTotal = prod.sumStock;

        this.saveProducts(products);
        supabaseService.saveInventoryItem(prod).catch(() => {});
      }
    }

    // 2. Remove item from sale record
    if (sale.items.length <= 1) {
      sales.splice(saleIndex, 1);
    } else {
      sale.items.splice(itemIndex, 1);
      sale.netTotal = sale.items.reduce((s, it) => s + it.total, 0);
      sale.change = Math.max(0, (sale.cashReceived || 0) - sale.netTotal);
    }
    this.saveSales(sales);

    // 3. Delete from Supabase Summary_Self_TB
    try {
      await supabaseService.deleteSummarySaleItem(receiptNumber, barcode);
    } catch (err) {
      console.warn('Supabase deleteSummarySaleItem note:', err);
    }

    return {
      success: true,
      message: `ลบรายการ "${itemName}" สำเร็จ (คืนสต็อกเข้าคลัง ${actualQty} ชิ้นเรียบร้อย)`
    };
  }

  async deleteSaleReceipt(
    receiptNumber: string,
    restoreStock: boolean = true
  ): Promise<{ success: boolean; message: string }> {
    const sales = this.getSales();
    const sale = sales.find(s => s.receiptNumber === receiptNumber);
    if (!sale) {
      return { success: false, message: 'ไม่พบเลขที่ใบเสร็จนี้' };
    }

    // Restore stock for all items
    if (restoreStock) {
      const products = this.getProducts();
      const config = this.getFormulaConfig();
      sale.items.forEach(item => {
        const prod = products.find(p => p.barcode === item.barcode);
        if (prod) {
          const cost = prod.costPrice || 0;
          const sell = prod.sellPrice || 0;
          const currentSold = prod.countSelf || 0;
          const countSold = Math.max(0, currentSold - item.quantity);

          if (countSold <= 0) {
            prod.countSelf = null;
            prod.sumSelfCost = null;
            prod.lastSaleDate = null;
            prod.lastReceipt = null;
            prod.soldQty = null;
            prod.soldTotal = null;
          } else {
            prod.countSelf = countSold;
            prod.sumSelfCost = countSold * sell;
            prod.soldQty = countSold;
            prod.soldTotal = prod.sumSelfCost;
          }

          if (prod.countCostIn !== null && prod.countCostIn !== undefined) {
            prod.stockQty = Math.max(0, prod.countCostIn - (countSold || 0));
            prod.priceSum = cost;
            prod.sumStock = prod.stockQty * cost;
            prod.status = prod.stockQty < config.reorderThreshold ? 'สั่งซื้อ' : 'ปกติ';
          } else {
            prod.stockQty = null;
            prod.priceSum = cost;
            prod.sumStock = null;
            prod.status = null;
          }
          prod.stockTotal = prod.sumStock;

          supabaseService.saveInventoryItem(prod).catch(() => {});
        }
      });
      this.saveProducts(products);
    }

    const updated = sales.filter(s => s.receiptNumber !== receiptNumber);
    this.saveSales(updated);

    // Sync delete to Supabase Summary_Self_TB
    try {
      await supabaseService.deleteSummarySaleReceipt(receiptNumber);
    } catch (err) {
      console.warn('Supabase deleteSummarySaleReceipt note:', err);
    }

    return {
      success: true,
      message: `ลบบิลขาย "${receiptNumber}" สำเร็จเรียบร้อย`
    };
  }

  // ------------------ EXPENSES (Summary_Expans_TB) ------------------
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

    // Sync to Supabase Summary_Expans_TB (Ex_Other)
    supabaseService.saveOtherExpense(newRecord).catch(() => {});

    return newRecord;
  }

  async setOtherExpenseForDate(date: string, amount: number | null, title?: string): Promise<ExpenseRecord | null> {
    let expenses = this.getExpenses();

    if (amount === null || amount === undefined || isNaN(amount) || amount <= 0) {
      // Clear other expense for this date
      expenses = expenses.filter(e => !(e.date === date && (e.category === 'ค่าใช้จ่ายอื่นๆ' || e.title.includes('ค่าใช้จ่ายอื่น') || e.title.includes('บันทึกเอง'))));
      this.saveExpenses(expenses);
      supabaseService.clearOtherExpenseForDate(date).catch(() => {});
      return null;
    }

    const existingIdx = expenses.findIndex(e => e.date === date && (e.category === 'ค่าใช้จ่ายอื่นๆ' || e.title.includes('ค่าใช้จ่ายอื่น') || e.title.includes('บันทึกเอง')));
    let record: ExpenseRecord;

    if (existingIdx !== -1) {
      expenses[existingIdx] = {
        ...expenses[existingIdx],
        amount,
        title: title || expenses[existingIdx].title,
      };
      record = expenses[existingIdx];
    } else {
      record = {
        id: 'EXP-' + Date.now(),
        date,
        title: title || `ค่าใช้จ่ายอื่นๆ (${date})`,
        category: 'ค่าใช้จ่ายอื่นๆ',
        amount,
        createdByName: 'บันทึกเอง (Manual Entry)',
      };
      expenses.unshift(record);
    }

    this.saveExpenses(expenses);
    // Sync to Supabase Summary_Expans_TB
    supabaseService.saveOtherExpense(record).catch(() => {});
    return record;
  }

  saveExpenses(expenses: ExpenseRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }

  deleteExpense(id: string): void {
    const expenses = this.getExpenses().filter(e => e.id !== id);
    this.saveExpenses(expenses);
    supabaseService.deleteExpenseById(id).catch(() => {});
  }

  // ------------------ USERS / EMPLOYEES (Employee_TB) ------------------
  getUsers(): RegisteredUser[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!data) {
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

  async registerUser(userData: Omit<RegisteredUser, 'registeredAt'>): Promise<{ user: RegisteredUser; supabaseSynced: boolean; supabaseError?: string }> {
    const users = this.getUsers();
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

    // Sync to Supabase Employee_TB
    const res = await supabaseService.saveEmployee(newUser);

    return {
      user: newUser,
      supabaseSynced: res.success,
      supabaseError: res.error,
    };
  }

  async addUser(userData: Omit<RegisteredUser, 'registeredAt'> & { registeredAt?: string }): Promise<{ user: RegisteredUser; supabaseSynced: boolean; supabaseError?: string }> {
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

    // Sync to Supabase Employee_TB
    const res = await supabaseService.saveEmployee(newUser);

    return {
      user: newUser,
      supabaseSynced: res.success,
      supabaseError: res.error,
    };
  }

  async updateUser(updatedUser: RegisteredUser): Promise<{ success: boolean; supabaseSynced: boolean; supabaseError?: string }> {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.userId.toUpperCase() === updatedUser.userId.toUpperCase());
    if (idx !== -1) {
      users[idx] = {
        ...users[idx],
        ...updatedUser,
      };
      this.saveUsers(users);

      // Sync to Supabase Employee_TB
      const res = await supabaseService.saveEmployee(updatedUser);
      return { success: true, supabaseSynced: res.success, supabaseError: res.error };
    } else {
      throw new Error(`ไม่พบสมาชิกที่มีรหัสผู้ใช้งาน ${updatedUser.userId}`);
    }
  }

  async syncAllEmployeesToSupabase(): Promise<{ total: number; successCount: number; errors: string[] }> {
    const users = this.getUsers();
    let successCount = 0;
    const errors: string[] = [];
    for (const u of users) {
      const res = await supabaseService.saveEmployee(u);
      if (res.success) {
        successCount++;
      } else if (res.error) {
        errors.push(`${u.fullName}: ${res.error}`);
      }
    }
    return { total: users.length, successCount, errors };
  }

  deleteUser(userId: string): void {
    const users = this.getUsers().filter(u => u.userId.toUpperCase() !== userId.toUpperCase());
    this.saveUsers(users);

    // Sync delete to Supabase Employee_TB
    supabaseService.deleteEmployee(userId).catch(() => {});
  }

  findUser(email: string, userId: string): RegisteredUser | null {
    const users = this.getUsers();
    const user = users.find(u => 
      u.email.toLowerCase().trim() === email.toLowerCase().trim() && 
      u.userId.toUpperCase().trim() === userId.toUpperCase().trim()
    );
    return user || null;
  }

  async findUserAsync(email: string, userId: string): Promise<RegisteredUser | null> {
    const local = this.findUser(email, userId);
    if (local) return local;

    // Cross-device cloud check directly from Supabase Employee_TB
    try {
      const { data, error } = await supabase
        .from('Employee_TB')
        .select('*')
        .ilike('EM_Email', email.trim())
        .eq('Em_ID', userId.trim().toUpperCase())
        .limit(1);

      if (!error && data && data.length > 0) {
        const r = data[0];
        const cloudUser: RegisteredUser = {
          userId: r.Em_ID,
          fullName: r.Em_Name,
          phone: r.EM_Tell,
          email: r.EM_Email,
          status: r.Em_Status === 'suspended' ? 'suspended' : 'active',
          registeredAt: r.EM_date || new Date().toISOString(),
          note: r.Em_User || '',
        };
        const users = this.getUsers();
        if (!users.some(u => u.userId.toUpperCase() === cloudUser.userId.toUpperCase())) {
          this.saveUsers([...users, cloudUser]);
        }
        return cloudUser;
      }
    } catch (err) {
      console.warn('findUserAsync cloud lookup note:', err);
    }

    return null;
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
    const products = this.getProducts();
    this.saveProducts(this.applyFormulas(products, config));
  }

  private applyFormulas(products: Product[], config: FormulaConfig): Product[] {
    return products.map(p => {
      const cost = p.costPrice || 0;
      const countIn = p.countCostIn !== undefined ? p.countCostIn : (p.receivedQty !== undefined ? p.receivedQty : null);
      const countSold = p.countSelf !== undefined ? p.countSelf : (p.soldQty && p.soldQty > 0 ? p.soldQty : null);
      const stock = countIn !== null ? Math.max(0, countIn - (countSold || 0)) : null;
      const priceSum = p.priceSum !== undefined && p.priceSum !== null ? p.priceSum : cost;
      const sumStock = stock !== null ? stock * priceSum : null;

      return {
        ...p,
        countCostIn: countIn,
        sumCost: countIn !== null ? countIn * cost : null,
        countSelf: countSold,
        sumSelfCost: countSold !== null ? countSold * (p.sellPrice || 0) : null,
        stockQty: stock,
        priceSum: priceSum,
        sumStock: sumStock,
        status: stock !== null ? (stock < config.reorderThreshold ? 'สั่งซื้อ' : 'ปกติ') : null,
        receivedQty: countIn,
        receivedTotal: countIn !== null ? countIn * cost : null,
        soldQty: countSold,
        soldTotal: countSold !== null ? countSold * (p.sellPrice || 0) : null,
        stockTotal: sumStock,
      };
    });
  }
}

export const store = new StoreService();
