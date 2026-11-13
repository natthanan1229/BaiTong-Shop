export interface Product {
  id: string;                     // In_ID
  barcode: string;                // In_Bar
  name: string;                   // In_Menu
  unit: string;                   // In_Unit

  // 1. รับสินค้า (In_Count_Cost_IN, In_Price_Cost, In_Sum_Cost)
  countCostIn?: number | null;    // In_Count_Cost_IN: จำนวนรับเข้า (ว่างถ้ายังไม่มีการซื้อเข้ามา)
  costPrice: number;              // In_Price_Cost: ราคาต่อหน่วยต้นทุน
  sumCost?: number | null;        // In_Sum_Cost: In_Count_Cost_IN * In_Price_Cost (ว่างถ้า In_Count_Cost_IN ว่าง)

  // 2. ขายสินค้า (In_Count_Self, In_Price_Self, In_Sum_Self)
  countSelf?: number | null;      // In_Count_Self: จำนวนขายออก (ว่างถ้ายังไม่มีการขาย)
  sellPrice: number;              // In_Price_Self: ราคาขายต่อหน่วย
  sumSelfCost?: number | null;    // In_Sum_Self: In_Count_Self * In_Price_Self (ว่างถ้า In_Count_Self ว่าง)
  lastSaleDate?: string | null;   // In_Date_Self: ว/ด/ป ขายล่าสุด (ว่างถ้ายังไม่มีการขาย)

  // 3. คงเหลือ (In_Qty, In_PriceSum, In_SumSelf)
  stockQty?: number | null;       // In_Qty: อ้างอิงจาก In_Count_Cost_IN (หักลดด้วย In_Count_Self เมื่อมีการขาย)
  priceSum?: number;              // In_PriceSum: แสดงข้อมูลอ้างอิงจาก In_Price_Cost
  sumStock?: number | null;       // In_SumSelf: In_Qty * In_PriceSum (ว่างถ้า In_Qty ว่าง)

  // 4. ข้อมูลกำกับ
  lastReceipt?: string | null;    // In_Receipt: เลขที่ใบเสร็จล่าสุด (ว่างถ้ายังไม่มีการขาย)
  status?: string | null;         // In_Status: ว่างถ้ายังไม่มียอดซื้อ หรือ 'สั่งซื้อ' / 'ปกติ'
  imageUrl?: string;              // รูปภาพสินค้า
  category?: string;

  // Compatibility fields for legacy references
  receivedQty?: number | null;
  receivedTotal?: number | null;
  soldQty?: number | null;
  soldTotal?: number | null;
  stockTotal?: number | null;
}

export interface CartItem {
  barcode: string;
  name: string;
  unit: string;
  price: number;
  quantity: number;
  total: number;
  stockAvailable?: number;
}

export interface PurchaseRecord {
  id: string;
  date: string;          // YYYY-MM-DD
  time: string;          // HH:mm:ss
  items: CartItem[];
  netTotal: number;
  createdByName: string;
  createdByRole: 'admin' | 'user';
  note?: string;
}

export interface SaleRecord {
  id: string;
  receiptNumber: string;
  date: string;          // YYYY-MM-DD
  time: string;          // HH:mm:ss
  items: CartItem[];
  netTotal: number;
  cashReceived: number;
  change: number;
  bahtText: string;
  createdByName: string;
  createdByRole: 'admin' | 'user';
}

export interface ExpenseRecord {
  id: string;
  date: string;          // YYYY-MM-DD
  title: string;
  category: string;
  amount: number;
  note?: string;
  createdByName: string;
}

export interface RegisteredUser {
  userId: string;        // e.g. BT-9824
  fullName: string;
  phone: string;         // 10 digits
  email: string;
  registeredAt: string;
  status?: 'active' | 'suspended';
  note?: string;
}

export interface AuthSession {
  role: 'admin' | 'user' | null;
  adminName?: string;
  user?: RegisteredUser;
}

export interface FormulaConfig {
  reorderThreshold: number;   // default 12 from Excel IF(K < 12, "สั่งซื้อ", "")
  autoCalculation: boolean;
  vatRate: number;            // percentage (0 or 7)
}
