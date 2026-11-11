import React, { useState } from 'react';
import { 
  DollarSign, 
  Barcode, 
  Plus, 
  Trash2, 
  Receipt, 
  CheckCircle, 
  AlertCircle, 
  Printer, 
  X,
  Store,
  CreditCard,
  Volume2
} from 'lucide-react';
import { Product, CartItem, SaleRecord, AuthSession } from '../types';
import { store } from '../services/store';
import { playBeep } from '../utils/audio';
import { bahtText } from '../utils/bahtText';
import { ImageSlot } from '../components/ImageSlot';

interface SalesPosPageProps {
  session: AuthSession;
  products: Product[];
  onRefresh: () => void;
  onNavigate: (page: string) => void;
}

export const SalesPosPage: React.FC<SalesPosPageProps> = ({
  session,
  products,
  onRefresh,
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cashReceived, setCashReceived] = useState<number | ''>('');
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Completed receipt modal state
  const [completedSale, setCompletedSale] = useState<SaleRecord | null>(null);

  const netTotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const numericCash = typeof cashReceived === 'number' ? cashReceived : 0;
  const change = numericCash > 0 ? numericCash - netTotal : 0;
  const thaiBaht = bahtText(netTotal);

  // Add / scan item
  const handleScanBarcode = (barcodeToScan?: string) => {
    const code = (barcodeToScan || barcodeInput).trim().toUpperCase();
    if (!code) return;

    const product = products.find(p => p.barcode.toUpperCase() === code);
    if (!product) {
      playBeep('error');
      setScanMessage({ text: `ไม่พบสินค้ารหัส "${code}" ในระบบ`, type: 'error' });
      return;
    }

    // Check available stock
    const existingInCart = cartItems.find(item => item.barcode === product.barcode);
    const currentQtyInCart = existingInCart ? existingInCart.quantity : 0;
    if (product.stockQty <= currentQtyInCart) {
      playBeep('error');
      setScanMessage({ 
        text: `สินค้า "${product.name}" คงเหลือในคลังเพียง ${product.stockQty} ${product.unit} (ไม่พอขาย)`, 
        type: 'error' 
      });
      return;
    }

    playBeep('success');
    setScanMessage({ text: `เพิ่มสินค้า: ${product.name} (฿${product.sellPrice})`, type: 'success' });

    setCartItems(prev => {
      const idx = prev.findIndex(item => item.barcode === product.barcode);
      if (idx !== -1) {
        const copy = [...prev];
        const newQty = copy[idx].quantity + 1;
        copy[idx] = {
          ...copy[idx],
          quantity: newQty,
          total: newQty * copy[idx].price
        };
        return copy;
      } else {
        return [
          ...prev,
          {
            barcode: product.barcode,
            name: product.name,
            unit: product.unit,
            price: product.sellPrice, // selling at retail price
            quantity: 1,
            total: product.sellPrice,
            stockAvailable: product.stockQty
          }
        ];
      }
    });

    setBarcodeInput('');
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
    const product = products.find(p => p.barcode === barcode);
    if (product && newQty > product.stockQty) {
      alert(`สินค้าในคลังมีเพียง ${product.stockQty} ${product.unit}`);
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

  const removeItem = (barcode: string) => {
    setCartItems(prev => prev.filter(item => item.barcode !== barcode));
  };

  // Fast cash buttons
  const setExactCash = () => {
    setCashReceived(netTotal);
  };
  const setCashAmount = (amount: number) => {
    setCashReceived(amount);
  };

  // Complete Sale
  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    if (numericCash < netTotal) {
      alert(`จำนวนเงินที่รับมา (฿${numericCash}) น้อยกว่าราคาสุทธิ (฿${netTotal}) ขาดอีก ฿${(netTotal - numericCash).toFixed(2)} บาท`);
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8);

    const saleRecord = store.addSale({
      date: dateStr,
      time: timeStr,
      items: cartItems,
      netTotal,
      cashReceived: numericCash,
      change,
      bahtText: thaiBaht,
      createdByName: session.role === 'admin' ? 'ADMIN' : (session.user?.fullName || 'แคชเชียร์'),
      createdByRole: session.role || 'user',
    });

    playBeep('cash');
    setCompletedSale(saleRecord);
    setCartItems([]);
    setCashReceived('');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Image Slot for POS */}
      <ImageSlot
        pageTitle="4. ระบบขายสินค้า (Sales POS System)"
        folderPath="public/images/pos/"
        defaultImagePath="/images/pos/header.png"
        altText="ภาพหัวข้อระบบขายสินค้า"
      />

      {/* POS Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">4. ระบบขายสินค้า (POS Cashier)</h1>
            <p className="text-xs text-slate-500">
              สแกนบาร์โค้ดขายสินค้าออก แสดงรายการสินค้าระบุจำนวนและราคา คำนวณราคาสุทธิ และคำนวณเงินทอน
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-400">สถานะแคชเชียร์</div>
          <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>พร้อมขาย ({session.role === 'admin' ? 'ADMIN' : session.user?.fullName})</span>
          </div>
        </div>
      </div>

      {/* POS Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Barcode input + Scanned Cart Table (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Scanner Box */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Barcode className="w-4 h-4 text-[#8d6e63]" />
                <span>สแกนบาร์โค้ดสินค้า (Barcode Scanner)</span>
              </label>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-emerald-600" />
                มีเสียงบี๊บแจ้งเตือน
              </span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="สแกนบาร์โค้ด หรือพิมพ์รหัส เช่น ST001 แล้วกด Enter..."
                  className="w-full pl-3 pr-10 py-2.5 text-sm font-mono font-bold border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-amber-500 outline-none"
                  autoFocus
                />
                <Barcode className="w-5 h-5 text-slate-400 absolute right-3 top-3" />
              </div>
              <button
                type="button"
                onClick={() => handleScanBarcode()}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่ม</span>
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

            {/* Quick Stationery Picker Buttons */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="text-[11px] text-slate-500 font-semibold mb-2">
                สินค้าด่วน / คลิกเพื่อขาย (จากตาราง Excel):
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                {products.slice(0, 18).map(p => {
                  const isOutOfStock = p.stockQty <= 0;
                  return (
                    <button
                      key={p.barcode}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => handleScanBarcode(p.barcode)}
                      className={`p-2 rounded-lg text-left border transition text-xs flex flex-col justify-between ${
                        isOutOfStock 
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-white hover:bg-[#b2dfdb]/40 border-slate-200 hover:border-[#00796b]'
                      }`}
                    >
                      <div className="font-semibold text-slate-800 line-clamp-1">{p.name}</div>
                      <div className="flex items-center justify-between mt-1 text-[11px]">
                        <span className="font-mono font-bold text-amber-700">฿{p.sellPrice}</span>
                        <span className={`text-[10px] ${p.stockQty < 5 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                          คงเหลือ: {p.stockQty}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cart Table matching Excel Sheet 5 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-700">
                รายการสินค้าในตะกร้า ({cartItems.length} รายการ)
              </span>
              {cartItems.length > 0 && (
                <button
                  onClick={() => setCartItems([])}
                  className="text-xs text-rose-600 hover:underline"
                >
                  ยกเลิกตะกร้า
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#b2dfdb]/40 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2 text-center w-10">ลำดับ</th>
                    <th className="py-2 px-2">Barcode</th>
                    <th className="py-2 px-3">รายการสินค้า</th>
                    <th className="py-2 px-2 text-center w-16">หน่วยละ</th>
                    <th className="py-2 px-2 text-center w-24">จำนวน</th>
                    <th className="py-2 px-2 text-right w-20">รวม</th>
                    <th className="py-2 px-1 text-center w-10">ลบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {cartItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        ยังไม่มีสินค้าในบิลขาย สแกนบาร์โค้ดหรือคลิกสินค้าด้านบน
                      </td>
                    </tr>
                  ) : (
                    cartItems.map((item, idx) => (
                      <tr key={item.barcode} className="hover:bg-slate-50">
                        <td className="py-2 px-2 text-center text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-2 font-mono font-bold text-slate-700">{item.barcode}</td>
                        <td className="py-2 px-3 font-medium text-slate-800">{item.name}</td>
                        <td className="py-2 px-2 text-center font-mono text-slate-600">฿{item.price}</td>
                        <td className="py-2 px-2 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateItemQty(item.barcode, item.quantity - 1)}
                              className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateItemQty(item.barcode, item.quantity + 1)}
                              className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-amber-700">
                          ฿{item.total.toLocaleString()}
                        </td>
                        <td className="py-2 px-1 text-center">
                          <button
                            onClick={() => removeItem(item.barcode)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
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
          </div>
        </div>

        {/* Right Column: Checkout & Payment Calculation Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border-2 border-[#b2dfdb] shadow-md p-6 space-y-5">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#8d6e63]" />
                <span>สรุปยอดเงินและชำระเงิน</span>
              </h2>
              <span className="text-xs bg-[#d0f8ce] text-[#2e7d32] font-semibold px-2 py-0.5 rounded-full">
                POS
              </span>
            </div>

            {/* Total Display */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 text-center">
              <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">
                ยอดรวมสุทธิที่ต้องชำระ (Net Total)
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-amber-600">
                ฿{netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>

              {/* Requirement: Thai Baht Text translation matching Excel =BAHTTEXT(K23) */}
              <div className="mt-2 text-xs font-medium text-slate-700 bg-white/80 py-1.5 px-3 rounded-md border border-amber-200/60">
                ({thaiBaht})
              </div>
            </div>

            {/* Cash Received Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                จำนวนเงินที่รับมา (Cash Received) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">฿</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2.5 text-lg font-mono font-bold border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-[#b2dfdb] focus:border-[#00796b] outline-none"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={setExactCash}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border"
                >
                  พอดี (฿{netTotal})
                </button>
                {[20, 50, 100, 500, 1000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashAmount(amt)}
                    className="px-2 py-1 bg-slate-100 hover:bg-[#d0f8ce] text-slate-700 text-xs font-mono font-semibold rounded-md border"
                  >
                    ฿{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Change Display */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              numericCash > 0 && change >= 0
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : numericCash > 0 && change < 0
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <div>
                <div className="text-xs font-bold">
                  {change < 0 ? 'ยังขาดอีก' : 'เงินทอน (Change)'}:
                </div>
                <div className="text-xs text-slate-500">
                  {change >= 0 ? `(${bahtText(Math.abs(change))})` : 'กรุณารับเงินเพิ่ม'}
                </div>
              </div>
              <div className="text-2xl font-bold font-mono">
                ฿{Math.abs(change).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Submit Payment Button */}
            <button
              type="button"
              disabled={cartItems.length === 0 || numericCash < netTotal}
              onClick={handleCheckout}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 ${
                cartItems.length === 0 || numericCash < netTotal
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-[#8d6e63] hover:bg-[#5d4037] text-white active:scale-[0.99]'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>ชำระเงินและตัดสต็อก (Print Receipt)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-300">
            {/* Printable Receipt */}
            <div id="receipt-print" className="p-6 text-slate-800 space-y-4 font-mono text-xs">
              <div className="text-center border-b border-dashed border-slate-300 pb-3">
                <div className="w-10 h-10 bg-[#8d6e63] text-white rounded-full flex items-center justify-center mx-auto mb-1">
                  <Store className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 font-sans">ใบตอง ช็อป (BaiTong Shop)</h3>
                <p className="text-[11px] text-slate-500 font-sans">ร้านอุปกรณ์เครื่องเขียนและสำนักงาน</p>
                <div className="text-[10px] text-slate-400 mt-1">เลขที่ใบเสร็จ: {completedSale.receiptNumber}</div>
                <div className="text-[10px] text-slate-400">วันที่: {completedSale.date} เวลา: {completedSale.time}</div>
                <div className="text-[10px] text-slate-400">แคชเชียร์: {completedSale.createdByName}</div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
                {completedSale.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[11px]">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">{it.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {it.quantity} {it.unit} x ฿{it.price}
                      </div>
                    </div>
                    <div className="font-bold text-slate-900">฿{it.total}</div>
                  </div>
                ))}
              </div>

              {/* Total & Change */}
              <div className="space-y-1 text-xs border-b border-dashed border-slate-300 pb-3">
                <div className="flex justify-between font-bold text-sm text-slate-900">
                  <span>ยอดสุทธิ (Total):</span>
                  <span>฿{completedSale.netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="text-[10px] text-slate-500 text-right">
                  ({completedSale.bahtText})
                </div>
                <div className="flex justify-between text-slate-600 pt-1">
                  <span>รับเงิน (Cash):</span>
                  <span>฿{completedSale.cashReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>เงินทอน (Change):</span>
                  <span>฿{completedSale.change.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 font-sans pt-1">
                ขอบคุณที่ใช้บริการ BaiTong Shop
                <br />
                ยินดีต้อนรับทุกท่านเสมอ
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์ใบเสร็จ</span>
              </button>
              <button
                type="button"
                onClick={() => setCompletedSale(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-100 transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
