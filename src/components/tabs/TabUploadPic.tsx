import React, { useRef, useState } from 'react';
import {
  Upload,
  Download,
  Trash2,
  FileSpreadsheet,
  Award,
  Bell,
  Heart,
} from 'lucide-react';
import { ParsedScheduleBook, SwapOverride } from '../../types/schedule';
import { getNurseDayView } from '../../utils/excelParser';
import {
  BunnyNurseAvatar,
  StrawberryMilkBottleIcon,
} from '../kawaii/UsagiMascots';

interface TabUploadPicProps {
  book: ParsedScheduleBook;
  selectedNurse: string;
  swaps: SwapOverride[];
  onUploadFiles: (files: FileList | File[], mode: 'merge' | 'replace') => Promise<void>;
  onClearSchedule: () => void;
  isLoading: boolean;
}

export const TabUploadPic: React.FC<TabUploadPicProps> = ({
  book,
  selectedNurse,
  swaps,
  onUploadFiles,
  onClearSchedule,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadMode, setUploadMode] = useState<'merge' | 'replace'>('merge');

  const handleExportCSV = () => {
    const sortedDates = Object.keys(book.dates).sort();
    const rows: string[][] = [
      [
        'Tanggal',
        'Hari',
        'Nama Perawat',
        'Status Harian',
        'Jam Masuk Slot 1',
        'Sumber Jam Slot 1',
        'Dokter Slot 1',
        'Tugas Slot 1',
        'Jam Masuk Slot 2 (Lembur)',
        'Dokter Slot 2 (Lembur)',
        'Tugas Slot 2 (Lembur)',
      ],
    ];

    for (const dISO of sortedDates) {
      const view = getNurseDayView(book, dISO, selectedNurse, swaps);
      const s1 = view.slots[0];
      const s2 = view.slots[1];
      rows.push([
        dISO,
        view.dayNameID,
        selectedNurse,
        view.status,
        s1?.effectiveTime || (view.leaveEntry ? view.leaveEntry.rawText : '-'),
        s1?.priorityRawNote || '-',
        s1?.doctors.join(' | ') || '-',
        s1?.tasks.join(' | ') || '-',
        s2?.effectiveTime || '-',
        s2?.doctors.join(' | ') || '-',
        s2?.tasks.join(' | ') || '-',
      ]);
    }

    const csvContent =
      '\uFEFF' +
      rows
        .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rekap_Sheyla_${selectedNurse}_${book.monthLabel.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3 pb-6">
      {/* SECTION 1: UPLOAD EXCEL BARU / GABUNGKAN FILE */}
      <section className="bg-white rounded-[20px] border border-[#FBCFE8] shadow-cloud p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <StrawberryMilkBottleIcon double size={30} />
            <div>
              <h1 className="font-display text-sm sm:text-base font-bold text-[#4A1525]">
                🥛📂 Upload Excel Jadwal
              </h1>
              <p className="text-[11px] text-[#7A2841]">
                Tambah jadwal minggu baru atau ganti file bulan berikutnya
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1 rounded-full bg-[#FFF3C4] hover:bg-[#FDE68A] text-[#78350F] border border-[#F59E0B]/40 font-display font-bold text-[11px] px-2.5 py-1 transition cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Rekap CSV</span>
            </button>

            <button
              type="button"
              onClick={onClearSchedule}
              className="inline-flex items-center gap-1 rounded-full bg-[#FFE4E6] hover:bg-[#FECDD3] text-[#9F1239] font-display font-bold text-[11px] px-2.5 py-1 transition cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Hapus</span>
            </button>
          </div>
        </div>

        {/* Mode Selection: Merge vs Replace */}
        <div className="flex items-center gap-1.5 mb-3">
          <button
            type="button"
            onClick={() => setUploadMode('merge')}
            className={`flex-1 rounded-full px-3 py-1 text-[11px] font-display font-bold border transition cursor-pointer ${
              uploadMode === 'merge'
                ? 'bg-[#FF4D79] text-white border-[#FF4D79]'
                : 'bg-[#FFF5F8] text-[#4A1525] border-[#FBCFE8]'
            }`}
          >
            ➕ Gabungkan File (Merge)
          </button>
          <button
            type="button"
            onClick={() => setUploadMode('replace')}
            className={`flex-1 rounded-full px-3 py-1 text-[11px] font-display font-bold border transition cursor-pointer ${
              uploadMode === 'replace'
                ? 'bg-[#FF4D79] text-white border-[#FF4D79]'
                : 'bg-[#FFF5F8] text-[#4A1525] border-[#FBCFE8]'
            }`}
          >
            🔄 Ganti Baru (Replace)
          </button>
        </div>

        {/* Upload Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-2xl border-2 border-dashed border-[#F472B6] bg-[#FFF5F8] hover:bg-[#FFE2EE]/50 p-4 text-center transition"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onUploadFiles(e.target.files, uploadMode);
                e.target.value = '';
              }
            }}
          />
          <Upload className="w-6 h-6 text-[#FF4D79] mx-auto mb-1" />
          <div className="font-display font-bold text-xs sm:text-sm text-[#4A1525]">
            {isLoading
              ? 'Sedang Memproses File Excel...'
              : 'Tap untuk Pilih File Excel (.xlsx)'}
          </div>
          <p className="text-[10px] text-[#7A2841] mt-0.5">
            Bisa pilih 1 atau beberapa file sekaligus
          </p>
        </div>

        {/* Active Source Files Pill List */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold text-[#7A2841]">File Aktif:</span>
          {book.sourceFiles.map((sf, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-[#FFE2EE] border border-[#FBCFE8] px-2.5 py-0.5 text-[10px] font-bold text-[#4A1525]"
            >
              <FileSpreadsheet className="w-3 h-3 text-[#FF4D79]" />
              <span>{sf}</span>
            </span>
          ))}
        </div>
      </section>

      {/* SECTION 2: DAFTAR PIC BULANAN INTERNIS & DAHLIA */}
      <section className="bg-white rounded-[20px] border border-[#FBCFE8] shadow-cloud p-3.5">
        <div className="flex items-center gap-2 mb-2.5">
          <Award className="w-4 h-4 text-[#FF4D79]" />
          <h2 className="font-display text-sm font-bold text-[#4A1525]">
            🎀 Daftar PIC Bulanan Internis &amp; Dahlia
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {book.monthlyPICs.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl bg-[#FFF9FB] border border-[#FBCFE8] p-2.5 flex items-center gap-2.5"
            >
              <BunnyNurseAvatar size={28} mood="happy" />
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#FF4D79]">
                  {item.category}
                </div>
                <div className="font-display font-bold text-xs text-[#4A1525] truncate">
                  🏥 Internis: <span className="text-[#9F1239]">{item.internisPic}</span>
                </div>
                {item.dahliaPic && (
                  <div className="font-display font-bold text-[11px] text-[#6B21A8] truncate">
                    🌸 Dahlia: {item.dahliaPic}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2.5 rounded-xl bg-[#FFF3C4]/80 border border-[#FDE68A] px-3 py-2 flex items-center gap-2">
          <Bell className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
          <div className="text-[11px] text-[#78350F] font-medium">
            <span className="font-display font-bold">Pengingat Mingguan:</span> {book.casePresentationNote}
          </div>
        </div>

        <div className="mt-2.5 rounded-xl bg-[#FFF5F8] border border-[#FBCFE8] px-3 py-2 flex items-center justify-center gap-1.5 text-[11px] font-display font-bold text-[#FF4D79]">
          <Heart className="w-3.5 h-3.5 fill-[#FF4D79]" />
          <span>Dibuat khusus dengan penuh sayang untuk Afiz</span>
          <Heart className="w-3.5 h-3.5 fill-[#FF4D79]" />
        </div>
      </section>
    </div>
  );
};
