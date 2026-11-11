export interface Product {
  id: string;
  barcode: string;
  name: string;
  unit: string;
  costPrice: number;      // ราคารับซื้อ
  sellPrice: number;      // ราคาขาย
  stockQty: number;       // คงเหลือ (ไม่ตั้งเป็นค่าอัตโนมัติ)
  receivedQty?: number;   // ยอดรับรวม
  soldQty?: number;       // ยอดขายรวม
  status?: string;        // สั่งซื้อ / ปกติ
  imageUrl?: string;      // รูปภาพสินค้า
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
