import React, { useState } from 'react';
import { Upload, Folder, CheckCircle, Sparkles, Building2 } from 'lucide-react';

interface ImageSlotProps {
  pageTitle: string;
  folderPath: string;
  defaultImagePath: string;
  altText: string;
}

export const ImageSlot: React.FC<ImageSlotProps> = ({
  pageTitle,
  folderPath,
  defaultImagePath,
  altText
}) => {
  const [currentImage, setCurrentImage] = useState<string>(defaultImagePath);
  const [isUploaded, setIsUploaded] = useState(false);
  const [showFolderInfo, setShowFolderInfo] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setCurrentImage(url);
      setIsUploaded(true);
    }
  };

  return (
    <div className="mb-6 bg-white rounded-2xl shadow-sm border border-[#b2dfdb] overflow-hidden transition-all">
      {/* Top Controls Bar */}
      <div className="p-3.5 bg-gradient-to-r from-[#b2dfdb]/40 via-[#d0f8ce]/30 to-slate-50 flex flex-wrap items-center justify-between gap-3 border-b border-[#b2dfdb]/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#8d6e63] text-white rounded-xl shadow-xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-[#4e342e] text-xs sm:text-sm">
              ช่องใส่รูปภาพประจำหน้า: {pageTitle}
            </h3>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
              <Folder className="w-3 h-3 text-[#8d6e63]" />
              โฟลเดอร์จัดเก็บ: <code className="bg-[#b2dfdb]/40 text-[#00796b] px-1.5 py-0.5 rounded font-bold">{folderPath}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8d6e63] hover:bg-[#5d4037] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors active:scale-[0.98]">
            <Upload className="w-3.5 h-3.5" />
            <span>เปลี่ยน / อัปโหลดรูปภาพ</span>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange}
            />
          </label>
          <button
            type="button"
            onClick={() => setShowFolderInfo(!showFolderInfo)}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200 rounded-lg transition-colors"
          >
            {showFolderInfo ? 'ซ่อนข้อมูลโฟลเดอร์' : 'ดูข้อมูลโฟลเดอร์'}
          </button>
        </div>
      </div>

      {showFolderInfo && (
        <div className="p-3.5 bg-[#e0f2f1]/70 border-b border-[#b2dfdb]/50 text-xs text-slate-700 space-y-1">
          <p className="font-bold text-[#00796b]">📂 ตำแหน่งโฟลเดอร์จัดเก็บภาพประจำหน้านี้:</p>
          <p>• โฟลเดอร์ทางกายภาพในโปรเจกต์: <code className="font-mono bg-white px-2 py-0.5 rounded border border-slate-300 font-bold">{folderPath}</code></p>
          <p>• ภาพทางการเริ่มต้น: <code className="font-mono bg-white px-2 py-0.5 rounded border border-slate-300 font-bold">{defaultImagePath}</code></p>
          <p className="text-[11px] text-slate-500">สามารถนำรูปภาพสไตล์ร้านเครื่องเขียนทางการมาวางในโฟลเดอร์นี้เพื่อแสดงผลแทนได้ทันที</p>
        </div>
      )}

      {/* Formal Executive Banner Display with Dark Ambient Overlay & Typography */}
      <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-900 group">
        <img
          src={currentImage}
          alt={altText}
          className="w-full h-full object-cover object-center brightness-90 group-hover:scale-105 transition-transform duration-700 ease-out"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/login/formal_stationery_landscape.jpg';
          }}
        />

        {/* Executive Gradient Overlay: dark to transparent */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/60 to-transparent flex flex-col justify-end p-5 sm:p-7 text-white">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[11px] font-semibold text-[#d0f8ce] border border-white/20 w-fit mb-2 shadow-sm">
            <Sparkles className="w-3 h-3 text-[#b2dfdb]" />
            <span>BaiTong Official Stationery & Office Supplies</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-md">
            {pageTitle}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl font-light drop-shadow">
            ร้านใบตองอุปกรณ์เครื่องเขียน | ระบบบันทึกและจัดการระดับมาตรฐานทางการ
          </p>
        </div>

        {isUploaded && (
          <div className="absolute top-3 right-3 bg-emerald-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-md">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>อัปโหลดรูปภาพใหม่เรียบร้อย</span>
          </div>
        )}
      </div>
    </div>
  );
};
