import React, { useMemo, useState } from 'react';
import { Search, Clock, Crown, X } from 'lucide-react';
import { ParsedScheduleBook, SwapOverride } from '../../types/schedule';
import { applySwapsToDayAssignments } from '../../utils/excelParser';
import {
  BunnyNurseAvatar,
  DreamyMoonIcon,
  StethoscopeHeartIcon,
  SunnyCloudIcon,
} from '../kawaii/UsagiMascots';

interface TabCekDokterProps {
  book: ParsedScheduleBook;
  selectedDate: string;
  onSelectDate: (dateISO: string) => void;
  swaps: SwapOverride[];
  onInspectNurse: (nurseName: string) => void;
}

export const TabCekDokter: React.FC<TabCekDokterProps> = ({
  book,
  selectedDate,
  onSelectDate,
  swaps,
  onInspectNurse,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'PAGI' | 'SORE'>('ALL');

  const sortedDates = useMemo(
    () => Object.keys(book.dates).sort().filter((d) => !book.dates[d].isSunday),
    [book.dates]
  );

  const daySchedule = book.dates[selectedDate];

  const effectiveSlots = useMemo(() => {
    if (!daySchedule) return [];
    return applySwapsToDayAssignments(daySchedule.assignments, selectedDate, swaps).sort(
      (a, b) => a.effectiveTimeMinutes - b.effectiveTimeMinutes
    );
  }, [daySchedule, selectedDate, swaps]);

  const filteredSlots = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return effectiveSlots.filter((slot) => {
      if (periodFilter !== 'ALL' && slot.period !== periodFilter) return false;
      if (!q) return true;
      const inDoc = slot.doctors.some((d) => d.toLowerCase().includes(q));
      const inNurse = slot.nurseName.toLowerCase().includes(q);
      const inTask = slot.tasks.some((t) => t.toLowerCase().includes(q));
      return inDoc || inNurse || inTask;
    });
  }, [effectiveSlots, periodFilter, searchQuery]);

  return (
    <div className="space-y-3 pb-6">
      {/* Compact Search & Filter Cloud Card */}
      <section className="bg-white rounded-[20px] border border-[#FBCFE8] shadow-cloud p-3.5">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="min-w-0">
            <h1 className="font-display text-sm sm:text-base font-bold text-[#4A1525]">
              🩺☁️ Direktori Dokter Harian
            </h1>
            <p className="text-[11px] text-[#7A2841] truncate">
              Cek siapa yang mendampingi dokter pada{' '}
              <span className="font-bold text-[#FF4D79]">
                {daySchedule?.dayNameID}, {selectedDate}
              </span>
            </p>
          </div>

          <select
            aria-label="Pilih Tanggal Direktori"
            value={selectedDate}
            onChange={(e) => onSelectDate(e.target.value)}
            className="shrink-0 rounded-full bg-[#FFF5F8] border border-[#FBCFE8] px-2.5 py-1 font-display font-bold text-[11px] text-[#4A1525] focus:outline-none focus:border-[#FF4D79]"
          >
            {sortedDates.map((d) => (
              <option key={d} value={d}>
                {book.dates[d].dayNameID.slice(0, 3)}, {d.slice(5)}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#FF4D79] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari dokter, asisten, atau tugas..."
            className="w-full rounded-full bg-[#FFF5F8] border border-[#FBCFE8] focus:border-[#FF4D79] focus:bg-white pl-8 pr-8 py-1.5 text-xs font-medium text-[#4A1525] placeholder:text-[#8A4B5C]/70 focus:outline-none transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A2841] hover:text-[#FF4D79] cursor-pointer"
              aria-label="Bersihkan pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Shift Period Filter Pills */}
        <div className="flex items-center justify-between gap-2 mt-2.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPeriodFilter('ALL')}
              className={`rounded-full px-2.5 py-1 text-[11px] font-display font-bold border transition cursor-pointer ${
                periodFilter === 'ALL'
                  ? 'bg-[#FF4D79] text-white border-[#FF4D79]'
                  : 'bg-[#FFF5F8] text-[#4A1525] border-[#FBCFE8]'
              }`}
            >
              Semua ({effectiveSlots.length})
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('PAGI')}
              className={`rounded-full px-2.5 py-1 text-[11px] font-display font-bold border transition cursor-pointer ${
                periodFilter === 'PAGI'
                  ? 'bg-[#FFF3C4] text-[#92400E] border-[#F59E0B]'
                  : 'bg-[#FFF5F8] text-[#4A1525] border-[#FBCFE8]'
              }`}
            >
              ☀️ Pagi
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('SORE')}
              className={`rounded-full px-2.5 py-1 text-[11px] font-display font-bold border transition cursor-pointer ${
                periodFilter === 'SORE'
                  ? 'bg-[#F3E8FF] text-[#6B21A8] border-[#A855F7]'
                  : 'bg-[#FFF5F8] text-[#4A1525] border-[#FBCFE8]'
              }`}
            >
              🌙 Sore
            </button>
          </div>

          <span className="text-[10px] font-semibold text-[#7A2841]">
            {filteredSlots.length} slot
          </span>
        </div>
      </section>

      {/* Doctor & Nurse Assignment Cards */}
      {filteredSlots.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-[#FBCFE8] p-6 text-center shadow-cloud">
          <BunnyNurseAvatar mood="sleepy" size={48} className="mx-auto mb-1.5" />
          <div className="font-display font-bold text-xs text-[#4A1525]">
            Tidak ditemukan hasil untuk &ldquo;{searchQuery}&rdquo;
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {filteredSlots.map((slot) => {
            const isAfiz = slot.nurseName.toLowerCase() === 'afiz';
            const isMorning = slot.period === 'PAGI';

            return (
              <div
                key={slot.slotId}
                className={`rounded-[18px] border p-3 bg-white shadow-cloud flex flex-col justify-between ${
                  isAfiz
                    ? 'border-[#FF4D79] ring-1 ring-[#FFE2EE]'
                    : 'border-[#FBCFE8]'
                }`}
              >
                <div>
                  {/* Top Bar: Time + Assigned Bunny Nurse Chip */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#FFE2EE]">
                    <div className="flex items-center gap-1.5">
                      {isMorning ? <SunnyCloudIcon size={22} /> : <DreamyMoonIcon size={22} />}
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#FF4D79] text-white px-2 py-0.5 text-[11px] font-display font-bold tabular-nums">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{slot.effectiveTime}</span>
                      </span>
                      <span className="text-[10px] font-medium text-[#7A2841] truncate max-w-[90px]">
                        ({slot.priorityRawNote})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onInspectNurse(slot.nurseName)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-display font-bold transition cursor-pointer ${
                        isAfiz
                          ? 'bg-[#FFE2EE] text-[#9F1239] border-[#FF4D79]'
                          : 'bg-[#FFF5F8] hover:bg-[#FFE2EE] text-[#4A1525] border-[#FBCFE8]'
                      }`}
                    >
                      <BunnyNurseAvatar
                        size={18}
                        isCrown={isAfiz}
                        mood={isMorning ? 'sunny' : 'moon'}
                      />
                      <span>{slot.nurseName}</span>
                      {isAfiz && <Crown className="w-3 h-3 text-[#FF4D79]" />}
                    </button>
                  </div>

                  {/* Doctors List */}
                  <div className="mt-2 space-y-1.5">
                    {slot.doctors.length > 0 ? (
                      slot.doctors.map((doc, i) => (
                        <div
                          key={i}
                          className="rounded-xl bg-[#FFF9FB] border border-[#FBCFE8] px-2.5 py-1.5 flex items-center gap-2"
                        >
                          <StethoscopeHeartIcon size={20} />
                          <span className="font-display font-bold text-xs text-[#4A1525]">
                            {doc}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl bg-[#FFF9FB] border border-[#FBCFE8] px-2.5 py-1.5 text-[11px] font-semibold text-[#7A2841]">
                        Slot Operasional / Koordinator Klinik
                      </div>
                    )}
                  </div>
                </div>

                {/* Companion Tasks */}
                {(slot.tasks.length > 0 || slot.dateNote) && (
                  <div className="mt-2 pt-2 border-t border-[#FFE2EE] flex flex-wrap gap-1">
                    {slot.dateNote && (
                      <span className="rounded-md bg-[#FFE4E6] text-[#9F1239] px-1.5 py-0.5 text-[10px] font-bold">
                        📌 {slot.dateNote}
                      </span>
                    )}
                    {slot.tasks.map((t, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-[#FFF5F8] border border-[#FBCFE8] text-[#4A1525] px-1.5 py-0.5 text-[10px] font-medium"
                      >
                        • {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
