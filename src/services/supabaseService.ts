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
        return data.map((row: any) => {
          const receivedQty = Number(row.In_Price_Cost) || 0;
          const soldQty = Number(row.In_Price_Self) || 0;
          // Requirement 1: In_Price_Cost - In_Price_Self = In_Qty
          const stockQty = Math.max(0, receivedQty - soldQty);

          return {
            id: String(row.In_ID || row.In_Bar),
            barcode: row.In_Bar,
            name: row.In_Menu,
            unit: row.In_Unit || 'อัน',
            costPrice: Number(row.In_Count_Cost_IN) || Math.round((Number(row.In_PriceSum) || 15) * 0.7) || 10,
            sellPrice: Number(row.In_PriceSum) || 0,
            receivedQty: receivedQty,
            soldQty: soldQty,
            stockQty: stockQty,
            status: row.In_Status || (stockQty < 12 ? 'สั่งซื้อ' : 'ปกติ'),
          };
        });
      }
      return null;
    } catch (err) {
      console.warn('Supabase fetchInventory failed:', err);
      return null;
    }
  }

  async saveInventoryItem(product: Product): Promise<boolean> {
    try {
      const received = product.receivedQty !== undefined ? product.receivedQty : (product.stockQty + (product.soldQty || 0));
      const sold = product.soldQty || 0;
      // Requirement 1: In_Price_Cost - In_Price_Self = In_Qty
      const stock = Math.max(0, received - sold);

      const row: any = {
        In_Bar: product.barcode,
        In_Menu: product.name,
        In_Unit: product.unit,
        In_Price_Cost: received,     // In_Price_Cost = ยอดรับเข้าสะสม (เชื่อมจากหน้ารายการซื้อ)
        In_Price_Self: sold,         // In_Price_Self = ยอดขายออกสะสม (เชื่อมจากหน้าขาย POS)
        In_Qty: String(stock),       // In_Qty = In_Price_Cost - In_Price_Self
        In_PriceSum: product.sellPrice,
        In_Sum_Cost: String(received * (product.costPrice || 10)),
        In_Sum_Self: String(sold * (product.sellPrice || 15)),
        In_SumSelf: String(stock * (product.sellPrice || 15)),
        In_Status: product.status || (stock < 12 ? 'สั่งซื้อ' : 'ปกติ'),
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

  async saveEmployee(user: RegisteredUser): Promise<{ success: boolean; error?: string }> {
    try {
      const row: EmployeeRow = {
        Em_ID: user.userId,
        Em_User: user.fullName || user.userId,
        Em_Name: user.fullName,
        EM_Tell: user.phone,
        EM_Email: user.email,
        EM_date: (user.registeredAt || new Date().toISOString()).slice(0, 10),
        Em_Status: user.status || 'active',
      };

      const { error } = await supabase
        .from('Employee_TB')
        .upsert(row, { onConflict: 'Em_ID' });

      if (error) {
        console.warn('Supabase saveEmployee warning:', error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.warn('Supabase saveEmployee failed:', err);
      return { success: false, error: err?.message || 'Connection error' };
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

  // ================= 5. หน้ารายได้ค่าใช้จ่าย (Summary_Expans_TB: วิเคราะห์จาก Inventory_TB & บันทึกค่าใช้จ่ายอื่น) =================
  async saveOtherExpense(expense: ExpenseRecord): Promise<boolean> {
    try {
      const row = {
        Ex_List: expense.title || 'ค่าใช้จ่ายอื่นๆ',
        Ex_Other: Math.round(expense.amount || 0),
        Ex_Date: expense.date || new Date().toISOString().slice(0, 10),
      };

      const { error } = await supabase
        .from('Summary_Expans_TB')
        .insert(row);

      if (error) {
        console.warn('Supabase saveOtherExpense error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase saveOtherExpense failed:', err);
      return false;
    }
  }

  async saveDailySummaryExpense(row: {
    date: string;
    description: string;
    income: number;
    purchaseCost: number;
    otherCost: number;
    profit: number;
  }): Promise<boolean> {
    try {
      const payload = {
        Ex_List: row.description || `สรุปรายการประจำวัน (${row.date})`,
        Ex_Income: Math.round(row.income || 0),
        Ex_Purch: Math.round(row.purchaseCost || 0),
        Ex_Other: Math.round(row.otherCost || 0),
        Ex_Pro_Loss: Math.round(row.profit || 0),
        Ex_Date: row.date,
      };

      const { error } = await supabase
        .from('Summary_Expans_TB')
        .insert(payload);

      if (error) {
        console.warn('Supabase saveDailySummaryExpense error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase saveDailySummaryExpense failed:', err);
      return false;
    }
  }

  async syncExpenseFromInventory(products: Product[], purchases: PurchaseRecord[]): Promise<boolean> {
    try {
      // Analyze expenses based on purchases and inventory stock cost
      const totalInventoryCost = products.reduce((sum, p) => sum + (p.stockQty * p.costPrice), 0);
      const totalPurchased = purchases.reduce((sum, p) => sum + p.netTotal, 0);
      const amount = Math.round(totalPurchased > 0 ? totalPurchased : totalInventoryCost);

      const expenseRecordWithDate: any = {
        Ex_Purch: amount,
        Ex_List: `วิเคราะห์ค่าใช้จ่ายยอดซื้อสินค้าคลัง: สินค้า ${products.length} รายการ`,
        Ex_Date: new Date().toISOString().slice(0, 10),
      };

      const res1 = await supabase
        .from('Summary_Expans_TB')
        .insert(expenseRecordWithDate);

      if (res1.error && res1.error.message && res1.error.message.includes('Ex_Date')) {
        // Fallback if Ex_Date column does not exist in schema
        const expenseRecordNoDate: any = {
          Ex_Purch: amount,
          Ex_List: `วิเคราะห์ค่าใช้จ่ายยอดซื้อสินค้าคลัง: สินค้า ${products.length} รายการ`,
        };
        const res2 = await supabase
          .from('Summary_Expans_TB')
          .insert(expenseRecordNoDate);
        return !res2.error;
      }

      if (res1.error) {
        console.warn('Supabase syncExpenseFromInventory warning:', res1.error.message);
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
        return data.map((r: any) => {
          const otherAmt = Number(r.Ex_Other) || 0;
          const purchAmt = Number(r.Ex_Purch) || 0;
          const isOther = otherAmt > 0 || (r.Ex_List && !r.Ex_List.includes('ยอดซื้อ'));
          return {
            id: String(r.Ex_ID || 'EXP-' + Date.now()),
            title: r.Ex_List || (isOther ? 'ค่าใช้จ่ายอื่นๆ' : 'ค่าใช้จ่ายซื้อสินค้า'),
            amount: isOther ? otherAmt : purchAmt,
            category: isOther ? 'ค่าใช้จ่ายอื่นๆ' : 'ซื้อสินค้าเข้าร้าน',
            date: r.Ex_Date || new Date().toISOString().slice(0, 10),
            createdByName: isOther ? 'บันทึกเอง (Manual Entry)' : 'ระบบประมวลผลอัตโนมัติ (Inventory_TB Analysis)',
          };
        });
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

  async deleteSummarySaleItem(receiptNumber: string, barcode: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('Summary_Self_TB')
        .delete()
        .eq('In_Receipt', receiptNumber)
        .eq('In_Bar', barcode);

      if (error) {
        console.warn('Supabase deleteSummarySaleItem warning:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase deleteSummarySaleItem failed:', err);
      return false;
    }
  }

  async deleteSummarySaleReceipt(receiptNumber: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('Summary_Self_TB')
        .delete()
        .eq('In_Receipt', receiptNumber);

      if (error) {
        console.warn('Supabase deleteSummarySaleReceipt warning:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase deleteSummarySaleReceipt failed:', err);
      return false;
    }
  }

  // ================= 7. ระบบ Realtime สำหรับอัปเดตข้อมูลทุกเครื่องพร้อมกัน =================
  subscribeToChanges(onUpdate: (table: string) => void): () => void {
    try {
      const channel = supabase
        .channel('db-realtime-all')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          (payload) => {
            if (payload && payload.table) {
              onUpdate(payload.table);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Realtime subscription notice:', err);
      return () => {};
    }
  }
}

export const supabaseService = new SupabaseService();
