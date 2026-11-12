import { createClient } from '@supabase/supabase-js';
import { Product, RegisteredUser, PurchaseRecord, SaleRecord, ExpenseRecord } from '../types';

export const SUPABASE_URL = 'https://xpyltldpeqsqijsbhdpf.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_RJQasgP4Z2sSsNGMDEqGFQ_-KI6l1lq';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Types strictly mapping to Supabase Baitong_DB tables
export interface InventoryRow {
  In_ID?: string | number;
  In_Bar: string;
  In_Menu: string;
  In_Unit: string;
  In_Qty: number;
  In_Price_Cost: number;
  In_PriceSum: number;
  In_Sum_Cost: number;
  In_Status: string;
  In_Date?: string;
  In_Count_IN?: number;
}

export interface EmployeeRow {
  Em_ID: string;
  Em_Name: string;
  EM_Tell: string;
  EM_Email: string;
  EM_date: string;
  Em_Status: string;
  Em_User?: string;
}

export interface SummaryExpenseRow {
  Ex_ID?: string | number;
  Ex_Purch: number;
  Ex_List: string;
  Ex_Date?: string;
}

export interface SummarySaleRow {
  S_ID?: string | number;
  S_Date: string;
  In_Bar: string;
  In_Menu: string;
  In_Qty: number;
  S_Sum: number;
  In_Receipt: string;
}

export class SupabaseService {
  // ================= 1. หน้าคลังสินค้า (Inventory_TB) =================
  async fetchInventory(): Promise<Product[] | null> {
    try {
      const { data, error } = await supabase
        .from('Inventory_TB')
        .select('*');

      if (error) {
        console.warn('Supabase fetchInventory warning:', error.message);
        return null;
      }

      if (data && data.length > 0) {
        return data.map((row: any) => ({
          id: String(row.In_ID || row.In_Bar),
          barcode: row.In_Bar,
          name: row.In_Menu,
          unit: row.In_Unit || 'อัน',
          costPrice: Number(row.In_Price_Cost) || 0,
          sellPrice: Number(row.In_PriceSum) || 0,
          stockQty: Number(row.In_Qty) || 0,
          status: row.In_Status || (Number(row.In_Qty) < 12 ? 'สั่งซื้อ' : 'ปกติ'),
        }));
      }
      return null;
    } catch (err) {
      console.warn('Supabase fetchInventory failed:', err);
      return null;
    }
  }

  async saveInventoryItem(product: Product): Promise<boolean> {
    try {
      const row: InventoryRow = {
        In_Bar: product.barcode,
        In_Menu: product.name,
        In_Unit: product.unit,
        In_Qty: product.stockQty,
        In_Price_Cost: product.costPrice,
        In_PriceSum: product.sellPrice,
        In_Sum_Cost: product.stockQty * product.costPrice,
        In_Status: product.status || (product.stockQty < 12 ? 'สั่งซื้อ' : 'ปกติ'),
      };

      const { error } = await supabase
        .from('Inventory_TB')
        .upsert(row, { onConflict: 'In_Bar' });

      if (error) {
        console.warn('Supabase saveInventoryItem warning:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase saveInventoryItem failed:', err);
      return false;
    }
  }

  async deleteInventoryItem(barcode: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('Inventory_TB')
        .delete()
        .eq('In_Bar', barcode);

      if (error) {
        console.warn('Supabase deleteInventoryItem warning:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase deleteInventoryItem failed:', err);
      return false;
    }
  }

  // ================= 2. หน้าซื้อสินค้า (Purchasing: SELECT In_Bar, In_Menu, In_Price) =================
  async selectPurchasingProducts(): Promise<{ barcode: string; name: string; price: number }[] | null> {
    try {
      // User requirement: หน้าซื้อสินค้า จะใช้กับฐานข้อมูลเดิมแต่เรียกใช้คำสั่ง SELECT เพื่อแสดงเฉพาะ In_Bar, In_Menu, In_Price
      const { data, error } = await supabase
        .from('Inventory_TB')
        .select('In_Bar, In_Menu, In_PriceSum, In_Price_Cost');

      if (error) {
        console.warn('Supabase selectPurchasingProducts warning:', error.message);
        return null;
      }

      if (data && data.length > 0) {
        return data.map((r: any) => ({
          barcode: r.In_Bar,
          name: r.In_Menu,
          price: Number(r.In_Price_Cost) || Number(r.In_PriceSum) || 0,
        }));
      }
      return null;
    } catch (err) {
      console.warn('Supabase selectPurchasingProducts failed:', err);
      return null;
    }
  }

  // ================= 3. หน้าสรุปยอดซื้อสินค้า (Purchase Summary: SELECT In_Date, In_Bar, In_Menu, In_Qty, In_Count_IN, In_Price_Cost, In_Sum_Cost) =================
  async selectPurchaseSummaryRecords(): Promise<any[] | null> {
    try {
      const { data, error } = await supabase
        .from('Inventory_TB')
        .select('In_Bar, In_Menu, In_Qty, In_Price_Cost, In_Sum_Cost, In_Status');

      if (error) {
        console.warn('Supabase selectPurchaseSummaryRecords warning:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('Supabase selectPurchaseSummaryRecords failed:', err);
      return null;
    }
  }

  // ================= 4. หน้าสมัครสมาชิก / สมาชิก (Employee_TB) =================
  async fetchEmployees(): Promise<RegisteredUser[] | null> {
    try {
      const { data, error } = await supabase
        .from('Employee_TB')
        .select('Em_ID, Em_Name, EM_Tell, EM_Email, Em_Status, EM_date, Em_User');

      if (error) {
        console.warn('Supabase fetchEmployees warning:', error.message);
        return null;
      }

      if (data && data.length > 0) {
        return data.map((r: any) => ({
          userId: r.Em_ID,
          fullName: r.Em_Name,
          phone: r.EM_Tell,
          email: r.EM_Email,
          status: r.Em_Status === 'suspended' ? 'suspended' : 'active',
          registeredAt: r.EM_date || new Date().toISOString(),
          note: r.Em_User || '',
        }));
      }
      return null;
    } catch (err) {
      console.warn('Supabase fetchEmployees failed:', err);
      return null;
    }
  }

  async saveEmployee(user: RegisteredUser): Promise<boolean> {
    try {
      const row: EmployeeRow = {
        Em_ID: user.userId,
        Em_Name: user.fullName,
        EM_Tell: user.phone,
        EM_Email: user.email,
        EM_date: user.registeredAt || new Date().toISOString(),
        Em_Status: user.status || 'active',
        Em_User: user.userId,
      };

      const { error } = await supabase
        .from('Employee_TB')
        .upsert(row, { onConflict: 'Em_ID' });

      if (error) {
        console.warn('Supabase saveEmployee warning:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase saveEmployee failed:', err);
      return false;
    }
  }

  async deleteEmployee(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('Employee_TB')
        .delete()
        .eq('Em_ID', userId);

      if (error) {
        console.warn('Supabase deleteEmployee warning:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase deleteEmployee failed:', err);
      return false;
    }
  }

  // ================= 5. หน้ารายได้ค่าใช้จ่าย (Summary_Expans_TB: วิเคราะห์จาก Inventory_TB) =================
  async syncExpenseFromInventory(products: Product[], purchases: PurchaseRecord[]): Promise<boolean> {
    try {
      // Analyze expenses based on purchases and inventory stock cost
      const totalInventoryCost = products.reduce((sum, p) => sum + (p.stockQty * p.costPrice), 0);
      const totalPurchased = purchases.reduce((sum, p) => sum + p.netTotal, 0);

      const expenseRecord: SummaryExpenseRow = {
        Ex_Purch: totalPurchased > 0 ? totalPurchased : totalInventoryCost,
        Ex_List: `วิเคราะห์ค่าใช้จ่ายยอดซื้อสินค้าคลัง: สินค้า ${products.length} รายการ`,
        Ex_Date: new Date().toISOString().slice(0, 10),
      };

      const { error } = await supabase
        .from('Summary_Expans_TB')
        .insert(expenseRecord);

      if (error) {
        console.warn('Supabase syncExpenseFromInventory warning:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase syncExpenseFromInventory failed:', err);
      return false;
    }
  }

  async fetchSummaryExpenses(): Promise<ExpenseRecord[] | null> {
    try {
      const { data, error } = await supabase
        .from('Summary_Expans_TB')
        .select('*');

      if (error) {
        console.warn('Supabase fetchSummaryExpenses warning:', error.message);
        return null;
      }

      if (data && data.length > 0) {
        return data.map((r: any) => ({
          id: String(r.Ex_ID || 'EXP-' + Date.now()),
          title: r.Ex_List || 'ค่าใช้จ่ายซื้อสินค้า',
          amount: Number(r.Ex_Purch) || 0,
          category: 'ซื้อสินค้าเข้าร้าน',
          date: r.Ex_Date || new Date().toISOString().slice(0, 10),
          createdByName: 'ระบบประมวลผลอัตโนมัติ (Inventory_TB Analysis)',
        }));
      }
      return null;
    } catch (err) {
      console.warn('Supabase fetchSummaryExpenses failed:', err);
      return null;
    }
  }

  // ================= 6. หน้าสรุปยอดขายสินค้า (Summary_Self_TB: วิเคราะห์จาก Inventory_TB) =================
  async recordSaleToSummarySelf(sale: SaleRecord): Promise<boolean> {
    try {
      // User requirement: หน้าสรุปยอดขายสินค้า จะใช้กับฐานข้อมูลที่ชื่อว่า Summary_Self_TB
      // ซึ่งระบบจะต้องทำการใช้คำสั่ง SELECT ในการเรียกดูของจากตาราง Inventory_TB มาวิเคราะห์ใส่ในตาราง
      const rows: SummarySaleRow[] = sale.items.map(item => ({
        S_Date: sale.date,
        In_Bar: item.barcode,
        In_Menu: item.name,
        In_Qty: item.quantity,
        S_Sum: item.total,
        In_Receipt: sale.receiptNumber,
      }));

      const { error } = await supabase
        .from('Summary_Self_TB')
        .insert(rows);

      if (error) {
        console.warn('Supabase recordSaleToSummarySelf warning:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase recordSaleToSummarySelf failed:', err);
      return false;
    }
  }

  async fetchSummarySales(): Promise<SummarySaleRow[] | null> {
    try {
      const { data, error } = await supabase
        .from('Summary_Self_TB')
        .select('*');

      if (error) {
        console.warn('Supabase fetchSummarySales warning:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('Supabase fetchSummarySales failed:', err);
      return null;
    }
  }
}

export const supabaseService = new SupabaseService();
