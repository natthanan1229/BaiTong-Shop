import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Barcode, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  PackagePlus,
  Volume2
} from 'lucide-react';
import { Product, CartItem, AuthSession } from '../types';
import { store } from '../services/store';
import { playBeep } from '../utils/audio';
import { ImageSlot } from '../components/ImageSlot';
import { supabaseService } from '../services/supabaseService';
import { Database } from 'lucide-react';

interface PurchasingPageProps {
  session: AuthSession;
  products: Product[];
  onRefresh: () => void;
  onNavigate: (page: string) => void;
}

export const PurchasingPage: React.FC<PurchasingPageProps> = ({
  session,
  products,
  onRefresh,
  onNavigate,
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [inputQty, setInputQty] = useState<number>(1);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSuccessSaved, setIsSuccessSaved] = useState(false);
  const [supabaseItems, setSupabaseItems] = useState<{ barcode: string; name: string; price: number }[]>([]);

  React.useEffect(() => {
    supabaseService.selectPurchasingProducts().then(items => {
      if (items && items.length > 0) setSupabaseItems(items);
    });
  }, []);

  // Scan or add item
  const handleScanBarcode = (barcodeToScan?: string) => {
    const code = (barcodeToScan || barcodeInput).trim().toUpperCase();
    if (!code) return;

    const product = products.find(p => p.barcode.toUpperCase() === code);
    if (!product) {
      playBeep('error');
      setScanMessage({ text: `ไม่พบสินค้ารหัส "${code}" ในระบบ`, type: 'error' });
      return;
    }

    playBeep('success');
    setScanMessage({ text: `สแกนสำเร็จ: ${product.name} (${product.barcode})`, type: 'success' });

    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => item.barcode === product.barcode);
      const qtyToAdd = inputQty > 0 ? inputQty : 1;
      if (existingIdx !== -1) {
        const copy = [...prev];
        const newQty = copy[existingIdx].quantity + qtyToAdd;
        copy[existingIdx] = {
          ...copy[existingIdx],
          quantity: newQty,
          total: newQty * copy[existingIdx].price
        };
        return copy;
      } else {
        return [
          ...prev,
          {
            barcode: product.barcode,
            name: product.name,
            unit: product.unit,
            price: product.costPrice, // buying at cost price
            quantity: qtyToAdd,
            total: qtyToAdd * product.costPrice
          }
        ];
      }
    });

    setBarcodeInput('');
    setInputQty(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleScanBarcode();
    }
  };

  const updateItemQty = (barcode: string, newQty: number) => {
    if (newQty <= 0) {
      removeItem(barcode);
      return;
    }
    setCartItems(prev => prev.map(item => {
      if (item.barcode === barcode) {
        return {
          ...item,
          quantity: newQty,
          total: newQty * item.price
        };
      }
      return item;
    }));
  };

  const updateItemPrice = (barcode: string, newPrice: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.barcode === barcode) {
        return {
          ...item,
          price: newPrice,
          total: item.quantity * newPrice
        };
      }
      return item;
    }));
  };

  const removeItem = (barcode: string) => {
    setCartItems(prev => prev.filter(item => item.barcode !== barcode));
  };

  const netTotal = cartItems.reduce((sum, item) => sum + item.total, 0);

  const handleSavePurchase = () => {
    if (cartItems.length === 0) return;

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8);

    store.addPurchase({
      date: dateStr,
      time: timeStr,
      items: cartItems,
      netTotal,
      createdByName: session.role === 'admin' ? 'ADMIN' : (session.user?.fullName || 'ผู้ใช้งาน'),
      createdByRole: session.role || 'user',
    });

    playBeep('cash');
    setIsSuccessSaved(true);
    setCartItems([]);
    onRefresh();
    setTimeout(() => setIsSuccessSaved(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Image Slot for Purchasing Page */}
      <ImageSlot
        pageTitle="2. ระบบซื้อสินค้า (Purchasing System)"
        folderPath="public/images/purchasing/"
        defaultImagePath="/images/purchasing/formal_banner.jpg"
        altText="ภาพหัวข้อระบบซื้อสินค้า"
      />

      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#d0f8ce] text-[#2e7d32] rounded-lg">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-800">2. ระบบซื้อสินค้า (Purchasing System)</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#b2dfdb]/40 text-[#00796b] border border-[#b2dfdb]">
                <Database className="w-3 h-3" />
                Inventory_TB (SELECT In_Bar, In_Menu, In_Price)
              </span>
            </div>
            <p className="text-xs text-slate-500">
              สแกนบาร์โค้ดรับสินค้าเข้า แสดงผลรายการสินค้าระบุจำนวนและราคา พร้อมคำนวณราคาสุทธิ
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('purchase-summary')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
        >
          <span>ดูประวัติสรุปยอดซื้อสินค้า</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {isSuccessSaved && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="font-bold text-sm">บันทึกรับสินค้าเข้าคลังสำเร็จ!</div>
              <div>ยอดสินค้าถูกเพิ่มเข้าสู่ระบบคลังสินค้า และบันทึกลงในสรุปยอดซื้อเรียบร้อยแล้ว</div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('purchase-summary')}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-medium transition"
          >
            ไปดูหน้าสรุปยอดซื้อ
          </button>
        </div>
      )}

      {/* Barcode Scanner Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Barcode className="w-4 h-4 text-[#00796b]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            ช่องสแกนบาร์โค้ดรับสินค้าเข้า (Barcode Scanner)
          </h2>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-emerald-600" />
            (มีเสียงบี๊บแจ้งเตือนเมื่อสแกน)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="สแกนบาร์โค้ด หรือพิมพ์รหัส เช่น ST001 แล้วกด Enter..."
              className="w-full pl-3 pr-10 py-2.5 text-sm font-mono font-bold border-2 border-[#b2dfdb] rounded-lg focus:ring-2 focus:ring-[#80cbc4] focus:border-[#00796b] outline-none"
              autoFocus
            />
            <Barcode className="w-5 h-5 text-slate-400 absolute right-3 top-3" />
          </div>

          <div className="w-24">
            <input
              type="number"
              min="1"
              value={inputQty}
              onChange={(e) => setInputQty(parseInt(e.target.value, 10) || 1)}
              placeholder="จำนวน"
              className="w-full px-3 py-2.5 text-sm border-2 border-slate-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-[#b2dfdb] outline-none"
              title="จำนวนรับเข้า"
            />
          </div>

          <button
            onClick={() => handleScanBarcode()}
            className="px-5 py-2.5 bg-[#00796b] hover:bg-[#004d40] text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มรายการ</span>
          </button>
        </div>

        {scanMessage && (
          <div className={`mt-2 text-xs flex items-center gap-1.5 ${
            scanMessage.type === 'success' ? 'text-emerald-700' : 'text-rose-600'
          }`}>
            {scanMessage.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            <span>{scanMessage.text}</span>
          </div>
        )}

        {/* Quick Demo Barcodes for Testing */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="text-[11px] text-slate-500 font-semibold mb-2">
            คลิกเพื่อทดสอบสแกนสินค้าตัวอย่าง (จากไฟล์ Excel):
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {products.slice(0, 15).map(p => (
              <button
                key={p.barcode}
                type="button"
                onClick={() => handleScanBarcode(p.barcode)}
                className="px-2 py-1 bg-slate-100 hover:bg-[#b2dfdb]/50 text-slate-700 text-xs font-mono rounded border border-slate-200 transition"
              >
                {p.barcode}: {p.name} (฿{p.costPrice})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scanned Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="font-bold text-slate-800 text-xs sm:text-sm">
            รายการสินค้าที่สแกนรับเข้า ({cartItems.length} รายการ)
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={() => setCartItems([])}
              className="text-xs text-rose-600 hover:underline"
            >
              ล้างรายการทั้งหมด
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#d0f8ce]/50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">ลำดับ</th>
                <th className="py-2.5 px-3 w-24">Barcode</th>
                <th className="py-2.5 px-4">ชื่อสินค้า</th>
                <th className="py-2.5 px-2 w-16 text-center">หน่วยนับ</th>
                <th className="py-2.5 px-3 w-28 text-right">ราคาต้นทุน (บาท)</th>
                <th className="py-2.5 px-3 w-28 text-center">จำนวน (Q'ty)</th>
                <th className="py-2.5 px-3 w-28 text-right">รวมเป็นเงิน</th>
                <th className="py-2.5 px-2 w-16 text-center">ลบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {cartItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Barcode className="w-8 h-8 text-slate-300 mb-2" />
                      <span>ยังไม่มีรายการสินค้า สแกนบาร์โค้ดหรือคลิกปุ่มบาร์โค้ดด้านบนเพื่อรับเข้า</span>
                    </div>
                  </td>
                </tr>
              ) : (
                cartItems.map((item, idx) => (
                  <tr key={item.barcode} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{item.barcode}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">{item.name}</td>
                    <td className="py-2.5 px-2 text-center text-slate-600">{item.unit}</td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={item.price}
                        onChange={(e) => updateItemPrice(item.barcode, parseFloat(e.target.value) || 0)}
                        className="w-20 px-1.5 py-0.5 text-right border border-slate-300 rounded text-xs"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateItemQty(item.barcode, item.quantity - 1)}
                          className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItemQty(item.barcode, parseInt(e.target.value, 10) || 1)}
                          className="w-12 text-center py-0.5 border border-slate-300 rounded text-xs font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => updateItemQty(item.barcode, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#00796b]">
                      ฿{item.total.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        onClick={() => removeItem(item.barcode)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                        title="ลบรายการ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        {cartItems.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-slate-50 via-[#d0f8ce]/30 to-[#b2dfdb]/40 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-600">
              จำนวนทั้งหมด: <strong className="font-bold text-slate-800">{cartItems.reduce((s, i) => s + i.quantity, 0)}</strong> ชิ้น 
              ({cartItems.length} รายการสินค้า)
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-xs text-slate-500">คำนวณราคาสุทธิ:</div>
                <div className="text-xl font-bold text-[#00796b] font-mono">
                  ฿{netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>

              <button
                onClick={handleSavePurchase}
                className="px-6 py-2.5 bg-[#2e7d32] hover:bg-[#1b5e20] text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
              >
                <PackagePlus className="w-4 h-4" />
                <span>บันทึกรับสินค้าเข้าคลัง</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
