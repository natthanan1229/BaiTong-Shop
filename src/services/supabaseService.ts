import { createClient } from '@supabase/supabase-js';
import { Product, RegisteredUser, PurchaseRecord, SaleRecord, ExpenseRecord, CartItem } from '../types';

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
        .select('*')
        .order('In_ID', { ascending: true });

      if (error) {
        console.warn('Supabase fetchInventory warning:', error.message);
        return null;
      }

      if (data && data.length > 0) {
        return data.map((row: any) => {
          // Rule 1: In_Count_Cost_IN เป็นค่าว่างจนกว่าจะมีการซื้อเข้ามา
          const countIn = row.In_Count_Cost_IN !== null && row.In_Count_Cost_IN !== undefined 
            ? Number(row.In_Count_Cost_IN) 
            : null;
          // Rule 2: In_Price_Cost คือราคาต้นทุนต่อหน่วย
          const cost = Number(row.In_Price_Cost) || 0;
          const sumCost = countIn !== null 
            ? (row.In_Sum_Cost !== null && row.In_Sum_Cost !== undefined ? Number(row.In_Sum_Cost) : countIn * cost)
            : null;

          // Rule 3: In_Count_Self เป็นค่าว่างจนกว่าจะมีการขาย
          const countSold = row.In_Count_Self !== null && row.In_Count_Self !== undefined 
            ? Number(row.In_Count_Self) 
            : null;
          // Rule 4: In_Price_Self คือราคาขายต่อหน่วย
          const sell = Number(row.In_Price_Self) || 0;
          const sumSold = countSold !== null 
            ? (row.In_Sum_Self !== null && row.In_Sum_Self !== undefined ? Number(row.In_Sum_Self) : countSold * sell)
            : null;

          // Rule 5: In_Qty คือ จำนวนที่อ้างอิงมาจาก In_Count_Cost_IN (หักลบยอดขาย In_Count_Self)
          const stockQty = countIn !== null 
            ? (row.In_Qty !== null && row.In_Qty !== undefined ? Number(row.In_Qty) : Math.max(0, countIn - (countSold || 0)))
            : null;

          // Rule 6: In_PriceSum แสดงข้อมูลอ้างอิงจาก In_Price_Cost
          const priceSum = row.In_PriceSum !== null && row.In_PriceSum !== undefined 
            ? Number(row.In_PriceSum) 
            : cost;

          // Rule 7: In_SumSelf คือ ผลรวมจาก In_Qty * In_PriceSum
          const sumStock = stockQty !== null 
            ? (row.In_SumSelf !== null && row.In_SumSelf !== undefined ? Number(row.In_SumSelf) : stockQty * priceSum)
            : null;

          const status = stockQty !== null 
            ? (row.In_Status || (stockQty < 12 ? 'สั่งซื้อ' : 'ปกติ')) 
            : null;

          return {
            id: String(row.In_ID || row.In_Bar),
            barcode: row.In_Bar || '',
            name: row.In_Menu || '',
            unit: row.In_Unit || '',
            costPrice: cost,
            sellPrice: sell,
            countCostIn: countIn,
            sumCost: sumCost,
            countSelf: countSold,
            sumSelfCost: sumSold,
            lastSaleDate: row.In_Date_Self || null,
            stockQty: stockQty,
            priceSum: priceSum,
            sumStock: sumStock,
            lastReceipt: row.In_Receipt || null,
            status: status,

            // Compatibility fields
            receivedQty: countIn,
            receivedTotal: sumCost,
            soldQty: countSold,
            soldTotal: sumSold,
            stockTotal: sumStock,
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
      const cost = product.costPrice || 0;
      const sell = product.sellPrice || 0;

      // Rule 1 & 2: In_Count_Cost_IN & In_Sum_Cost
      const countIn = product.countCostIn !== undefined 
        ? product.countCostIn 
        : (product.receivedQty !== undefined ? product.receivedQty : null);
      const sumCost = countIn !== null ? (product.sumCost ?? countIn * cost) : null;

      // Rule 3 & 4: In_Count_Self & In_Sum_Self
      const countSold = product.countSelf !== undefined 
        ? product.countSelf 
        : (product.soldQty !== undefined && product.soldQty !== null && product.soldQty > 0 ? product.soldQty : null);
      const sumSold = countSold !== null ? (product.sumSelfCost ?? countSold * sell) : null;

      // Rule 5: In_Qty คือ จำนวนที่อ้างอิงมาจาก In_Count_Cost_IN (หักลบยอดขายถ้ามี)
      const stock = countIn !== null 
        ? (product.stockQty !== undefined && product.stockQty !== null 
            ? product.stockQty 
            : Math.max(0, countIn - (countSold || 0)))
        : null;

      // Rule 6: In_PriceSum แสดงข้อมูลอ้างอิงจาก In_Price_Cost
      const priceSum = product.priceSum !== undefined && product.priceSum !== null ? product.priceSum : cost;

      // Rule 7: In_SumSelf คือ ผลรวมจาก In_Qty * In_PriceSum
      const sumStock = stock !== null ? (product.sumStock ?? stock * priceSum) : null;

      const idNum = parseInt(product.id, 10) || (product.barcode ? parseInt(product.barcode.replace(/\D/g, ''), 10) : 1);

      const row: any = {
        In_ID: idNum,
        In_Bar: product.barcode,
        In_Menu: product.name,
        In_Unit: product.unit || '',
        In_Count_Cost_IN: countIn,                                 // ว่างจนกว่าจะมีการซื้อเข้ามา
        In_Price_Cost: cost,                                       // ราคาต้นทุนต่อหน่วย
        In_Sum_Cost: sumCost,                                      // In_Count_Cost_IN * In_Price_Cost
        In_Count_Self: countSold,                                  // ว่างจนกว่าจะมีการขาย
        In_Price_Self: sell,                                       // ราคาขายต่อหน่วย
        In_Sum_Self: sumSold,                                      // In_Count_Self * In_Price_Self
        In_Date_Self: countSold !== null ? (product.lastSaleDate || null) : null,
        In_Qty: stock,                                             // อ้างอิง In_Count_Cost_IN (หักลดเมื่อขาย)
        In_PriceSum: priceSum,                                     // อ้างอิง In_Price_Cost
        In_SumSelf: sumStock,                                      // In_Qty * In_PriceSum
        In_Receipt: countSold !== null ? (product.lastReceipt || null) : null,
        In_Status: stock !== null ? (product.status || (stock < 12 ? 'สั่งซื้อ' : 'ปกติ')) : null,
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

  // ================= 3. หน้าสรุปยอดซื้อสินค้า (Summary_Purch_TB: SELECT In_Date, In_Bar, In_Menu, In_Qty, In_Price_Cost, In_Sum_Cost) =================
  async recordPurchaseToSummaryPurch(purchase: PurchaseRecord): Promise<boolean> {
    try {
      const rows = purchase.items.map(item => ({
        P_Date: purchase.date || new Date().toISOString().slice(0, 10),
        P_Time: purchase.time || new Date().toTimeString().slice(0, 8),
        In_Receipt: purchase.id,
        In_Bar: item.barcode,
        In_Menu: item.name,
        In_Unit: item.unit || 'ชิ้น',
        In_Qty: item.quantity,
        In_Price_Cost: Math.round(item.price || 0),
        P_Sum: Math.round(item.total || (item.quantity * item.price)),
        P_Buyer: purchase.createdByName || 'ADMIN',
      }));

      const { error } = await supabase
        .from('Summary_Purch_TB')
        .insert(rows);

      if (error) {
        console.warn('Supabase recordPurchaseToSummaryPurch warning:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase recordPurchaseToSummaryPurch failed:', err);
      return false;
    }
  }

  async fetchSummaryPurchases(): Promise<PurchaseRecord[] | null> {
    try {
      const { data, error } = await supabase
        .from('Summary_Purch_TB')
        .select('*')
        .order('P_ID', { ascending: false });

      if (error) {
        console.warn('Supabase fetchSummaryPurchases warning:', error.message);
        return null;
      }

      if (data && data.length > 0) {
        const map = new Map<string, {
          purchaseId: string;
          date: string;
          time: string;
          buyer: string;
          items: CartItem[];
          netTotal: number;
        }>();

        data.forEach((r: any) => {
          const receipt = r.In_Receipt || ('PO-' + (r.P_Date || 'unknown') + '-' + r.P_ID);
          const qty = Number(r.In_Qty) || 1;
          const cost = Number(r.In_Price_Cost) || 0;
          const sum = Number(r.P_Sum) || (qty * cost);

          const item: CartItem = {
            barcode: r.In_Bar || '',
            name: r.In_Menu || '',
            unit: r.In_Unit || 'ชิ้น',
            price: cost,
            quantity: qty,
            total: sum,
          };

          if (!map.has(receipt)) {
            map.set(receipt, {
              purchaseId: receipt,
              date: r.P_Date || new Date().toISOString().slice(0, 10),
              time: r.P_Time || '00:00:00',
              buyer: r.P_Buyer || 'ADMIN',
              items: [item],
              netTotal: sum,
            });
          } else {
            const entry = map.get(receipt)!;
            entry.items.push(item);
            entry.netTotal += sum;
          }
        });

        const records: PurchaseRecord[] = Array.from(map.values()).map(entry => ({
          id: entry.purchaseId,
          date: entry.date,
          time: entry.time,
          items: entry.items,
          netTotal: entry.netTotal,
          createdByName: entry.buyer,
          createdByRole: entry.buyer === 'ADMIN' ? 'admin' : 'user',
        }));

        return records;
      }
      return [];
    } catch (err) {
      console.warn('Supabase fetchSummaryPurchases failed:', err);
      return null;
    }
  }

  async deleteSummaryPurchaseItem(receiptNumber: string, barcode: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('Summary_Purch_TB')
        .delete()
        .eq('In_Receipt', receiptNumber)
        .eq('In_Bar', barcode);

      if (error) {
        console.warn('Supabase deleteSummaryPurchaseItem warning:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase deleteSummaryPurchaseItem failed:', err);
      return false;
    }
  }

  async deleteSummaryPurchaseReceipt(receiptNumber: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('Summary_Purch_TB')
        .delete()
        .eq('In_Receipt', receiptNumber);

      if (error) {
        console.warn('Supabase deleteSummaryPurchaseReceipt warning:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase deleteSummaryPurchaseReceipt failed:', err);
      return false;
    }
  }

  async selectPurchaseSummaryRecords(): Promise<any[] | null> {
    try {
      const { data, error } = await supabase
        .from('Inventory_TB')
        .select('In_Bar, In_Menu, In_Qty, In_Price_Cost, In_Sum_Cost, In_Count_Cost_IN, In_Status')
        .not('In_Count_Cost_IN', 'is', null);

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
  async clearOtherExpenseForDate(date: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('Summary_Expans_TB')
        .delete()
        .eq('Ex_Date', date)
        .not('Ex_Other', 'is', null);

      if (error) {
        console.warn('Supabase clearOtherExpenseForDate warning:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase clearOtherExpenseForDate failed:', err);
      return false;
    }
  }

  async deleteExpenseById(id: string): Promise<boolean> {
    try {
      const numId = parseInt(id, 10);
      if (!isNaN(numId)) {
        await supabase
          .from('Summary_Expans_TB')
          .delete()
          .eq('Ex_ID', numId);
      }
      return true;
    } catch (err) {
      console.warn('Supabase deleteExpenseById failed:', err);
      return false;
    }
  }

  async saveOtherExpense(expense: ExpenseRecord): Promise<boolean> {
    try {
      if (expense.date) {
        // Clean up any existing other expense for this date first to avoid duplicates
        await supabase
          .from('Summary_Expans_TB')
          .delete()
          .eq('Ex_Date', expense.date)
          .not('Ex_Other', 'is', null);
      }

      if (!expense.amount || expense.amount <= 0) {
        return true;
      }

      const row = {
        Ex_List: expense.title || 'ค่าใช้จ่ายอื่นๆ',
        Ex_Other: Math.round(expense.amount),
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
        Ex_Other: row.otherCost > 0 ? Math.round(row.otherCost) : null,
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
      const totalInventoryCost = products.reduce((sum, p) => sum + ((p.stockQty || 0) * (p.costPrice || 0)), 0);
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
        .select('*')
        .not('Ex_Other', 'is', null);

      if (error) {
        console.warn('Supabase fetchSummaryExpenses warning:', error.message);
        return null;
      }

      if (data && data.length > 0) {
        const otherExpenseRows = data.filter((r: any) => {
          const otherAmt = Number(r.Ex_Other);
          return !isNaN(otherAmt) && otherAmt > 0;
        });

        return otherExpenseRows.map((r: any) => ({
          id: String(r.Ex_ID),
          title: r.Ex_List || 'ค่าใช้จ่ายอื่นๆ',
          amount: Number(r.Ex_Other) || 0,
          category: 'ค่าใช้จ่ายอื่นๆ',
          date: r.Ex_Date || new Date().toISOString().slice(0, 10),
          createdByName: 'บันทึกเอง (Manual Entry)',
        }));
      }
      return [];
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
      const rows = sale.items.map(item => ({
        S_Date: sale.date || new Date().toISOString().slice(0, 10),
        In_Bar: item.barcode,
        In_Menu: item.name,
        In_Qty: String(item.quantity),
        In_Price_Self: Math.round(item.price || 0),
        S_Sum: Math.round(item.total || (item.quantity * item.price)),
        In_Receipt: sale.receiptNumber,
        S_Cashier: sale.createdByName || 'ADMIN',
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

  async fetchSummarySales(): Promise<SaleRecord[] | null> {
    try {
      const { data, error } = await supabase
        .from('Summary_Self_TB')
        .select('*')
        .order('S_ID', { ascending: false });

      if (error) {
        console.warn('Supabase fetchSummarySales warning:', error.message);
        return null;
      }

      if (data && data.length > 0) {
        const map = new Map<string, {
          receiptNumber: string;
          date: string;
          time: string;
          cashier: string;
          items: CartItem[];
          netTotal: number;
        }>();

        data.forEach((r: any) => {
          const receipt = r.In_Receipt || ('RC-' + (r.S_Date || 'unknown') + '-' + r.S_ID);
          const qty = Number(r.In_Qty) || 1;
          const sum = Number(r.S_Sum) || 0;
          const price = Number(r.In_Price_Self) || (qty > 0 ? Math.round(sum / qty) : 0);
          const cashier = r.S_Cashier || 'ADMIN';

          const item: CartItem = {
            barcode: r.In_Bar || '',
            name: r.In_Menu || '',
            unit: 'ชิ้น',
            price: price,
            quantity: qty,
            total: sum,
          };

          if (!map.has(receipt)) {
            map.set(receipt, {
              receiptNumber: receipt,
              date: r.S_Date || new Date().toISOString().slice(0, 10),
              time: '12:00:00',
              cashier: cashier,
              items: [item],
              netTotal: sum,
            });
          } else {
            const entry = map.get(receipt)!;
            entry.items.push(item);
            entry.netTotal += sum;
            if (cashier && cashier !== 'ADMIN') {
              entry.cashier = cashier;
            }
          }
        });

        const records: SaleRecord[] = Array.from(map.values()).map(entry => ({
          id: 'SL-REMOTE-' + entry.receiptNumber,
          receiptNumber: entry.receiptNumber,
          date: entry.date,
          time: entry.time,
          items: entry.items,
          netTotal: entry.netTotal,
          cashReceived: entry.netTotal,
          change: 0,
          bahtText: '',
          createdByName: entry.cashier,
          createdByRole: entry.cashier === 'ADMIN' ? 'admin' : 'user',
        }));

        return records;
      }
      return [];
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
