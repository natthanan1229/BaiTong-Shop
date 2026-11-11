import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Search, 
  Printer, 
  Download, 
  Plus, 
  ExternalLink, 
  X, 
  Check, 
  Copy,
  Tag,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Product } from '../types';

interface ProductQRCodeSectionProps {
  products: Product[];
  onScanItem: (barcode: string) => void;
}

export const ProductQRCodeSection: React.FC<ProductQRCodeSectionProps> = ({
  products,
  onScanItem,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [copiedBarcode, setCopiedBarcode] = useState<string | null>(null);
  const [isSectionOpen, setIsSectionOpen] = useState(true);
  const [isPrintAllModalOpen, setIsPrintAllModalOpen] = useState(false);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchTerm, selectedCategory]);

  // Generate QR codes for all products in batch
  useEffect(() => {
    let isMounted = true;
    const generateAllQrs = async () => {
      const newUrls: Record<string, string> = {};
      for (const p of products) {
        try {
          // Use barcode as QR payload so scanners read e.g. "ST001"
          const url = await QRCode.toDataURL(p.barcode, {
            width: 160,
            margin: 1,
            color: {
              dark: '#1e293b',
              light: '#ffffff'
            },
            errorCorrectionLevel: 'M'
          });
          newUrls[p.barcode] = url;
        } catch (err) {
          console.error('Failed to generate QR for', p.barcode, err);
        }
      }
      if (isMounted) {
        setQrCodeUrls(newUrls);
      }
    };

    generateAllQrs();
    return () => {
      isMounted = false;
    };
  }, [products]);

  const handleCopyBarcode = (barcode: string) => {
    navigator.clipboard.writeText(barcode);
    setCopiedBarcode(barcode);
    setTimeout(() => setCopiedBarcode(null), 1800);
  };

  const handleDownloadSingleQr = (product: Product) => {
    const dataUrl = qrCodeUrls[product.barcode];
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `QRCode_${product.barcode}_${product.name.replace(/[^a-zA-Z0-9\u0E00-\u0E7F]/g, '_')}.png`;
    link.click();
  };

  const handlePrintSingle = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl border border-[#b2dfdb] shadow-xs overflow-hidden transition-all">
      {/* Header bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-[#b2dfdb]/40 via-[#d0f8ce]/30 to-slate-50 flex flex-wrap items-center justify-between gap-3 border-b border-[#b2dfdb]/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#00796b] text-white rounded-xl shadow-xs">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-800 text-sm sm:text-base">
                คลัง QR Code ประจำสินค้าแต่ละชนิด ({products.length} รายการ)
              </h2>
              <span className="px-2 py-0.5 bg-[#00796b]/10 text-[#00796b] text-[11px] font-semibold rounded-full border border-[#00796b]/20">
                สแกนรับเข้าได้ทันที
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              สร้าง QR Code สำหรับสินค้าแต่ละรายการอัตโนมัติ สามารถกดสแกนรับเข้า หรือพิมพ์ป้ายราคาสินค้าได้ทันที
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPrintAllModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-2xs transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>พิมพ์ป้าย QR Code ทั้งหมด</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSectionOpen(!isSectionOpen)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#8d6e63] hover:bg-[#5d4037] text-white text-xs font-medium rounded-lg shadow-2xs transition"
          >
            {isSectionOpen ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>ซ่อนคลัง QR</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>แสดงคลัง QR</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isSectionOpen && (
        <div className="p-4 sm:p-5">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อสินค้า หรือรหัสบาร์โค้ด เช่น ST001, สมุด, ปากกา..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#b2dfdb] focus:border-[#00796b] outline-none bg-white"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {categories.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                    selectedCategory === 'all'
                      ? 'bg-[#00796b] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ทั้งหมด ({products.length})
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                      selectedCategory === cat
                        ? 'bg-[#00796b] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product QR Codes Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              ไม่พบรายการสินค้าที่ตรงกับคำค้นหา "{searchTerm}"
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
              {filteredProducts.map(p => {
                const qrUrl = qrCodeUrls[p.barcode];
                return (
                  <div
                    key={p.barcode}
                    className="group bg-slate-50/80 hover:bg-white rounded-xl p-3 border border-slate-200 hover:border-[#00796b]/50 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    {/* Top Row: Barcode pill & Category */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <button
                        type="button"
                        onClick={() => handleCopyBarcode(p.barcode)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-200/80 hover:bg-slate-300 text-slate-800 transition"
                        title="คลิกเพื่อคัดลอกรหัส"
                      >
                        <span>{p.barcode}</span>
                        {copiedBarcode === p.barcode ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-2.5 h-2.5 text-slate-400" />
                        )}
                      </button>

                      {p.category && (
                        <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {p.category}
                        </span>
                      )}
                    </div>

                    {/* Middle: QR Code display */}
                    <div className="flex items-center justify-center py-1">
                      <div 
                        onClick={() => setSelectedProductForModal(p)}
                        className="cursor-pointer relative p-2 bg-white rounded-xl border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform"
                        title="คลิกเพื่อดู QR Code ขนาดใหญ่"
                      >
                        {qrUrl ? (
                          <img
                            src={qrUrl}
                            alt={`QR Code ${p.barcode}`}
                            className="w-24 h-24 object-contain"
                          />
                        ) : (
                          <div className="w-24 h-24 flex items-center justify-center text-slate-300">
                            <QrCode className="w-8 h-8 animate-pulse" />
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 p-0.5 bg-slate-800/70 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>

                    {/* Product info */}
                    <div className="mt-2 text-center">
                      <h3 className="font-semibold text-slate-800 text-xs line-clamp-1" title={p.name}>
                        {p.name}
                      </h3>
                      <div className="flex items-center justify-center gap-2 mt-1 text-[11px] text-slate-600 font-mono">
                        <span className="text-emerald-700 font-bold">ทุน ฿{p.costPrice.toLocaleString()}</span>
                        <span>|</span>
                        <span className="text-slate-500">ขาย ฿{p.sellPrice.toLocaleString()}</span>
                        <span>({p.unit})</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-3 grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-200/70">
                      <button
                        type="button"
                        onClick={() => onScanItem(p.barcode)}
                        className="py-1 px-2 bg-[#00796b] hover:bg-[#004d40] text-white text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1 shadow-2xs"
                        title="สแกนรับสินค้านี้เข้าคลังทันที"
                      >
                        <Plus className="w-3 h-3" />
                        <span>สแกนรับเข้า</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedProductForModal(p)}
                        className="py-1 px-2 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-medium rounded-lg border border-slate-300 transition flex items-center justify-center gap-1"
                        title="ดู QR Code ขยายใหญ่และพิมพ์ป้าย"
                      >
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                        <span>ดูป้าย QR</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: SINGLE PRODUCT QR CODE ================= */}
      {selectedProductForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center relative">
            <button
              type="button"
              onClick={() => setSelectedProductForModal(null)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#d0f8ce] text-[#2e7d32] text-xs font-semibold rounded-full mb-3">
              <Tag className="w-3.5 h-3.5" />
              <span>ป้าย QR Code สินค้าทางการ BaiTong Shop</span>
            </div>

            <h3 className="text-base font-bold text-slate-800">
              {selectedProductForModal.name}
            </h3>
            <p className="font-mono text-sm font-bold text-[#00796b] mt-0.5">
              รหัสบาร์โค้ด: {selectedProductForModal.barcode}
            </p>

            {/* Big QR Code */}
            <div className="my-5 p-4 bg-white rounded-2xl border-2 border-dashed border-[#b2dfdb] inline-block shadow-sm">
              {qrCodeUrls[selectedProductForModal.barcode] ? (
                <img
                  src={qrCodeUrls[selectedProductForModal.barcode]}
                  alt={`QR Code ${selectedProductForModal.barcode}`}
                  className="w-48 h-48 mx-auto object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-300">
                  <QrCode className="w-12 h-12 animate-pulse" />
                </div>
              )}
              <div className="text-[11px] font-mono text-slate-500 mt-2">
                สแกนด้วยกล้องมือถือหรือเครื่องสแกนบาร์โค้ด
              </div>
            </div>

            {/* Price details */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs grid grid-cols-3 gap-2 mb-4 font-mono">
              <div>
                <div className="text-slate-400 text-[10px]">ราคาทุน</div>
                <div className="font-bold text-emerald-700">฿{selectedProductForModal.costPrice}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px]">ราคาขาย</div>
                <div className="font-bold text-slate-800">฿{selectedProductForModal.sellPrice}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px]">หน่วยนับ</div>
                <div className="font-bold text-slate-800">{selectedProductForModal.unit}</div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  onScanItem(selectedProductForModal.barcode);
                  setSelectedProductForModal(null);
                }}
                className="w-full py-2.5 bg-[#00796b] hover:bg-[#004d40] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>สแกนรับรายการนี้เข้าคลัง (+1)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadSingleQr(selectedProductForModal)}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลด PNG</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintSingle}
                  className="py-2 px-3 bg-[#8d6e63] hover:bg-[#5d4037] text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์ป้าย QR</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: PRINT ALL PRODUCT QR CODES ================= */}
      {isPrintAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#00796b]" />
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                    พิมพ์แผ่นป้าย QR Code สินค้าทั้งหมด ({products.length} รายการ)
                  </h3>
                  <p className="text-xs text-slate-500">
                    สำหรับติดชั้นวางสินค้า หรือทำแฟ้มบาร์โค้ดสแกนรับสินค้าเข้าคลัง
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintSingle}
                  className="px-4 py-2 bg-[#00796b] hover:bg-[#004d40] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>สั่งพิมพ์ (Print)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintAllModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 print:p-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
                {products.map(p => {
                  const qr = qrCodeUrls[p.barcode];
                  return (
                    <div
                      key={p.barcode}
                      className="p-3 bg-white border border-slate-300 rounded-xl text-center flex flex-col items-center justify-between"
                    >
                      <div className="text-[11px] font-bold text-slate-800 line-clamp-1 mb-1">
                        {p.name}
                      </div>
                      <div className="bg-white p-1 border border-slate-200 rounded-lg">
                        {qr && <img src={qr} alt={p.barcode} className="w-24 h-24 object-contain" />}
                      </div>
                      <div className="mt-1 text-xs font-mono font-bold text-slate-700">
                        {p.barcode}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        ฿{p.costPrice} / {p.unit}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
