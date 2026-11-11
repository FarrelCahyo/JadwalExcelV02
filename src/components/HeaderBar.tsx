import React, { useRef } from 'react';
import { Upload, Heart } from 'lucide-react';
import { BunnyMood, BunnyNurseAvatar, StrawberryMilkBottleIcon } from './kawaii/UsagiMascots';
import { ParsedScheduleBook } from '../types/schedule';

interface HeaderBarProps {
  book: ParsedScheduleBook;
  selectedNurse: string;
  onSelectNurse: (nurse: string) => void;
  currentMood: BunnyMood;
  onQuickUpload: (files: FileList) => Promise<void>;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  book,
  selectedNurse,
  onSelectNurse,
  currentMood,
  onQuickUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isAfiz = selectedNurse.toLowerCase() === 'afiz';

  return (
    <header className="sticky top-0 z-30 bg-[#FFE2EE]/95 backdrop-blur-md border-b border-[#FBCFE8]">
      <div className="max-w-xl mx-auto px-3 py-1.5 flex items-center justify-between gap-2">
        {/* Brand + Dainty Mascot */}
        <div className="flex items-center gap-2 min-w-0">
          <BunnyNurseAvatar mood={currentMood} size={34} isCrown={isAfiz} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-sm text-[#4A1525] truncate">
                Sheyla
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-white/90 border border-[#FBCFE8] px-1.5 py-0.2 text-[9px] font-bold text-[#FF4D79]">
                <StrawberryMilkBottleIcon size={11} />
                <span className="truncate max-w-[95px]">{book.monthLabel}</span>
              </span>
            </div>
            <p className="text-[10px] font-medium text-[#7A2841] truncate flex items-center gap-1">
              <span>Asisten Pribadi Dinas Afiz</span>
              <Heart className="w-2.5 h-2.5 fill-[#FF4D79] text-[#FF4D79] inline" />
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isAfiz && (
            <button
              type="button"
              onClick={() => onSelectNurse('Afiz')}
              className="inline-flex items-center gap-1 rounded-full bg-[#FF4D79] text-white font-display font-bold text-[11px] px-2.5 py-1 shadow-xs hover:bg-[#E63966] transition cursor-pointer"
            >
              <span>👑 Afiz</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onQuickUpload(e.target.files);
                e.target.value = '';
              }
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1 rounded-full bg-white hover:bg-[#FFF5F8] text-[#4A1525] border border-[#FBCFE8] font-display font-bold text-[11px] px-2.5 py-1 transition cursor-pointer"
            title="Upload atau Tambah File Excel Jadwal"
          >
            <Upload className="w-3 h-3 text-[#FF4D79]" />
            <span>Upload</span>
          </button>
        </div>
      </div>
    </header>
  );
};
