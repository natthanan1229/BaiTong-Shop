export interface Product {
  id: string;               // In_ID
  barcode: string;          // In_Bar
  name: string;             // In_Menu
  unit: string;             // In_Unit
  costPrice: number;        // In_Count_Cost_IN (ราคาต้นทุน)
  receivedQty?: number;     // In_Price_Cost (ยอดรับเข้าสะสม เชื่อมหน้ารายการซื้อ)
  receivedTotal?: number;   // In_Sum_Cost (รวมต้นทุนรับเข้า = In_Price_Cost * In_Count_Cost_IN)
  sellPrice: number;        // In_Count_Self / In_PriceSum (ราคาขาย)
  soldQty?: number;         // In_Price_Self (ยอดขายออกสะสม เชื่อมหน้าขาย POS)
  soldTotal?: number;       // In_Sum_Self (รวมยอดขาย = In_Price_Self * In_Count_Self)
  lastSaleDate?: string | null;  // In_Date_Self (วันที่ขายล่าสุด)
  stockQty: number;         // In_Qty (In_Price_Cost - In_Price_Self)
  stockTotal?: number;      // In_SumSelf (รวมมูลค่าคงเหลือ = In_Qty * In_PriceSum)
  lastReceipt?: string | null;   // In_Receipt (เลขที่ใบเสร็จล่าสุด)
  status?: string;          // In_Status (สั่งซื้อ / ปกติ)
  imageUrl?: string;        // รูปภาพสินค้า
  category?: string;
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
