import React, { useRef, useState } from 'react';
import { Upload, AlertCircle, Heart } from 'lucide-react';
import {
  BunnyNurseAvatar,
  CuteRibbonBow,
  DreamyMoonIcon,
  StrawberryMilkBottleIcon,
  SunnyCloudIcon,
} from './kawaii/UsagiMascots';

interface UploadWelcomeScreenProps {
  onUploadFiles: (files: FileList | File[]) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const UploadWelcomeScreen: React.FC<UploadWelcomeScreenProps> = ({
  onUploadFiles,
  isLoading,
  error,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await onUploadFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-3.5 py-6">
      <div className="w-full max-w-sm relative">
        <div className="flex justify-center -mb-3.5 relative z-20">
          <CuteRibbonBow className="scale-75 drop-shadow-2xs" />
        </div>

        <div className="bg-white rounded-[24px] border-2 border-[#FBCFE8] shadow-cloud-lg p-4 sm:p-5 relative overflow-hidden">
          <div className="bg-[#FFE2EE] rounded-[18px] p-3.5 text-center border border-[#FBCFE8]">
            <div className="flex items-center justify-center gap-2 mb-2">
              <SunnyCloudIcon size={28} className="animate-float-cloud" />
              <BunnyNurseAvatar mood="happy" size={56} isCrown className="animate-ear-wiggle" />
              <DreamyMoonIcon size={28} className="animate-float-cloud" />
            </div>

            <h1 className="font-display text-lg font-bold text-[#4A1525] tracking-tight">
              Sheyla <span className="text-[#FF4D79]">Afiz</span>
            </h1>
            <p className="mt-0.5 text-[11px] font-medium text-[#7A2841] flex items-center justify-center gap-1">
              <span>Aplikasi Jadwal Dinas Pribadi Afiz</span>
              <Heart className="w-3 h-3 fill-[#FF4D79] text-[#FF4D79]" />
            </p>
          </div>

          <div className="grid grid-cols-3 gap-1.5 my-3 text-center">
            <div className="bg-[#FFF5F8] border border-[#FBCFE8] rounded-xl p-1.5">
              <div className="font-display font-bold text-[10px] text-[#FF4D79]">1 Detik Cek</div>
              <div className="text-[9px] text-[#4A1525] font-medium">Dokter Hari Ini</div>
            </div>
            <div className="bg-[#FFD6E4]/60 border border-[#F9A8D4] rounded-xl p-1.5">
              <div className="font-display font-bold text-[10px] text-[#E11D48]">Cek Lembur</div>
              <div className="text-[9px] text-[#4A1525] font-medium">2 Slot Pagi/Sore</div>
            </div>
            <div className="bg-[#FFF3C4]/70 border border-[#FDE68A] rounded-xl p-1.5">
              <div className="font-display font-bold text-[10px] text-[#B45309]">Jam Akurat</div>
              <div className="text-[9px] text-[#4A1525] font-medium">3-Tier Otomatis</div>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-3 rounded-xl bg-[#FFE4E6] border border-[#FDA4AF] p-2.5 flex items-start gap-2 text-[#9F1239] text-[11px] font-medium"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#E11D48]" />
              <div>{error}</div>
            </div>
          )}

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center transition-all duration-200 ${
              isDragging
                ? 'border-[#FF4D79] bg-[#FFE2EE]/70'
                : 'border-[#F472B6] bg-[#FFF5F8] hover:bg-[#FFE2EE]/45 hover:border-[#FF4D79]'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onUploadFiles(e.target.files);
                }
              }}
            />

            <div className="flex justify-center mb-2">
              <div className="w-11 h-11 rounded-xl bg-white border border-[#FBCFE8] flex items-center justify-center">
                <StrawberryMilkBottleIcon double size={30} />
              </div>
            </div>

            <h2 className="font-display text-sm font-bold text-[#4A1525]">
              {isLoading ? 'Meracik Jadwal Afiz...' : 'Upload File Excel Jadwal (.xlsx)'}
            </h2>
            <p className="text-[11px] text-[#7A2841] mt-0.5 leading-snug">
              Pilih 1 file atau beberapa file sekaligus (otomatis tersimpan di HP).
            </p>

            <button
              type="button"
              disabled={isLoading}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#FF4D79] hover:bg-[#E63966] active:scale-95 text-white font-display font-bold text-xs px-4 py-2 shadow-sm transition cursor-pointer disabled:opacity-60"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Memproses...' : 'Pilih File Excel'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
