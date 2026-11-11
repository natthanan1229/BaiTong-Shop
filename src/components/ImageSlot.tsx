import React, { useState } from 'react';
import { Image as ImageIcon, Upload, Folder, CheckCircle } from 'lucide-react';

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
    <div className="mb-6 bg-white rounded-xl shadow-sm border border-[#b2dfdb] overflow-hidden transition-all">
      <div className="p-4 bg-gradient-to-r from-[#b2dfdb]/40 via-[#d0f8ce]/30 to-transparent flex flex-wrap items-center justify-between gap-3 border-b border-[#b2dfdb]/60">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#8d6e63] text-white rounded-lg shadow-sm">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-[#4e342e] text-sm md:text-base">
              ช่องใส่รูปภาพประจำหน้า: {pageTitle}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Folder className="w-3.5 h-3.5 text-[#8d6e63]" />
              โฟลเดอร์จัดเก็บ: <code className="bg-[#b2dfdb]/30 text-[#00796b] px-1.5 py-0.5 rounded font-mono text-xs">{folderPath}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8d6e63] hover:bg-[#5d4037] text-white text-xs font-medium rounded-lg shadow-sm transition-colors">
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
            onClick={() => setShowFolderInfo(!showFolderInfo)}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 text-xs border border-slate-200 rounded-lg transition-colors"
          >
            {showFolderInfo ? 'ซ่อนข้อมูลโฟลเดอร์' : 'ดูข้อมูลโฟลเดอร์'}
          </button>
        </div>
      </div>

      {showFolderInfo && (
        <div className="p-3 bg-[#e0f2f1]/60 border-b border-[#b2dfdb]/40 text-xs text-slate-700 space-y-1">
          <p className="font-medium text-[#00796b]">📂 รายละเอียดตำแหน่งโฟลเดอร์สำหรับหน้านี้:</p>
          <p>• โฟลเดอร์ทางกายภาพในโปรเจกต์: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{folderPath}</code></p>
          <p>• ภาพเริ่มต้นจากไฟล์ Excel: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{defaultImagePath}</code></p>
          <p className="text-slate-500">สามารถนำไฟล์รูปภาพมาวางในโฟลเดอร์นี้เพื่อแสดงผล หรือใช้ปุ่มอัปโหลดด้านบน</p>
        </div>
      )}

      {/* Image Banner Display Area */}
      <div className="relative bg-gradient-to-b from-slate-100 to-slate-50 min-h-[140px] max-h-[220px] flex items-center justify-center overflow-hidden group">
        <img
          src={currentImage}
          alt={altText}
          className="w-full h-full object-cover max-h-[220px] transition-transform duration-300 group-hover:scale-[1.01]"
          onError={(e) => {
            // Fallback placeholder if image not found
            (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="200" viewBox="0 0 800 200"><rect fill="%23b2dfdb" width="800" height="200"/><text fill="%238d6e63" font-family="sans-serif" font-size="20" x="50%" y="50%" text-anchor="middle">ช่องว่างสำหรับรูปภาพ (' + encodeURIComponent(folderPath) + ')</text></svg>';
          }}
        />
        {isUploaded && (
          <div className="absolute top-2 right-2 bg-emerald-600/90 text-white px-2 py-1 rounded text-xs flex items-center gap-1 shadow">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>อัปโหลดรูปภาพใหม่เรียบร้อย</span>
          </div>
        )}
      </div>
    </div>
  );
};
