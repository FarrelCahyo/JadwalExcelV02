import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Copy,
  Check,
  Sparkles,
  Calendar as CalendarIcon,
  Bell,
  Heart,
} from 'lucide-react';
import {
  NurseDaySummary,
  ParsedScheduleBook,
  SlotAssignment,
  SwapOverride,
  TimePrioritySource,
} from '../../types/schedule';
import { getNurseDayView } from '../../utils/excelParser';
import {
  BunnyNurseAvatar,
  CuteRibbonBow,
  DreamyMoonIcon,
  MatchaSleepyCloudIcon,
  SparkleStarIcon,
  StethoscopeHeartIcon,
  StrawberryMilkBottleIcon,
  SunnyCloudIcon,
} from '../kawaii/UsagiMascots';

interface TabHariIniAfizProps {
  book: ParsedScheduleBook;
  selectedDate: string;
  onSelectDate: (dateISO: string) => void;
  selectedNurse: string;
  onSelectNurse?: (nurse: string) => void;
  swaps?: SwapOverride[];
  isPeekMode?: boolean;
  onGoToPeekTab?: () => void;
}

const MONTH_SHORT_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

function formatFullDateID(dateISO: string, dayNameID: string): string {
  const parts = dateISO.split('-');
  if (parts.length !== 3) return dateISO;
  const yyyy = parts[0];
  const mm = parseInt(parts[1], 10) - 1;
  const dd = parseInt(parts[2], 10);
  return `${dayNameID}, ${dd} ${MONTH_SHORT_ID[mm] || ''} ${yyyy}`;
}

function getPriorityLabel(source: TimePrioritySource, rawNote: string): {
  title: string;
  badgeClass: string;
} {
  switch (source) {
    case 'PRIO_1_DATE_CELL':
      return {
        title: `Catatan Tanggal: "${rawNote}"`,
        badgeClass: 'bg-[#FFE2EE] text-[#9F1239] border-[#F9A8D4]',
      };
    case 'PRIO_2_DAY_COL':
      return {
        title: `Kolom Hari: "${rawNote}"`,
        badgeClass: 'bg-[#FFF3C4] text-[#92400E] border-[#FDE68A]',
      };
    case 'PRIO_3_SHIFT_INDUK':
    default:
      return {
        title: `Shift ${rawNote}`,
        badgeClass: 'bg-[#F3E8FF] text-[#6B21A8] border-[#E9D5FF]',
      };
  }
}

function parseDoctorBadges(rawDoctor: string): { mainName: string; badges: string[] } {
  const badges: string[] = [];
  let working = rawDoctor.trim();

  const tokenPatterns = [
    /\((C\+D|D\+C|C|D|9-17)\)/gi,
    /\b(C\+D|D\+C|9-17|sore|siang|Dahlia)\b/gi,
  ];

  for (const pat of tokenPatterns) {
    const matches = working.match(pat);
    if (matches) {
      for (const m of matches) {
        const cleanBadge = m.replace(/[()]/g, '').trim();
        if (!badges.includes(cleanBadge)) badges.push(cleanBadge);
      }
      working = working.replace(pat, '').trim();
    }
  }

  const trailingCD = working.match(/\s+([CD])$/);
  if (trailingCD) {
    badges.push(`Gedung ${trailingCD[1]}`);
    working = working.slice(0, working.length - trailingCD[0].length).trim();
  }

  return {
    mainName: working.replace(/\s+/g, ' ').trim() || rawDoctor,
    badges,
  };
}

const DoctorSpotlightPill: React.FC<{ doctorRaw: string; accent: 'sun' | 'moon' | 'pink' }> = ({
  doctorRaw,
  accent,
}) => {
  const { mainName, badges } = parseDoctorBadges(doctorRaw);
  const borderClass =
    accent === 'sun'
      ? 'border-[#FDE68A] bg-white'
      : accent === 'moon'
      ? 'border-[#E9D5FF] bg-white'
      : 'border-[#FBCFE8] bg-white';

  return (
    <div
      className={`rounded-xl border ${borderClass} px-2.5 py-2 flex items-center justify-between gap-2 shadow-2xs`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <StethoscopeHeartIcon size={24} />
        <div className="min-w-0 flex flex-wrap items-center gap-1.5">
          <span className="font-display font-bold text-[14px] text-[#4A1525] leading-snug">
            {mainName}
          </span>
          {badges.map((b, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded-full bg-[#FFE2EE] border border-[#FBCFE8] px-1.5 py-0.2 text-[10px] font-bold text-[#9F1239]"
            >
              {b}
            </span>
          ))}
        </div>
      </div>
      <SparkleStarIcon size={14} className="opacity-80 shrink-0" />
    </div>
  );
};

const SlotDetailPanel: React.FC<{
  slot: SlotAssignment;
  slotIndex?: number;
  isOvertimeCard?: boolean;
}> = ({ slot, slotIndex, isOvertimeCard = false }) => {
  const isMorning = slot.period === 'PAGI';
  const prioInfo = getPriorityLabel(slot.prioritySource, slot.priorityRawNote);

  return (
    <div
      className={`rounded-2xl border p-3 flex flex-col justify-between ${
        isMorning
          ? 'bg-[#FFFDF5] border-[#FDE68A]'
          : 'bg-[#FAF5FF] border-[#E9D5FF]'
      }`}
    >
      <div>
        {/* Slot Top Row: Shift Period Icon + Effective Arrival Time */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#FBCFE8]/50">
          <div className="flex items-center gap-1.5 min-w-0">
            {isMorning ? <SunnyCloudIcon size={26} /> : <DreamyMoonIcon size={26} />}
            <div className="min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                {isOvertimeCard && slotIndex !== undefined ? (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.2 text-[10px] font-display font-bold ${
                      slotIndex === 0
                        ? 'bg-[#FFF3C4] text-[#92400E] border border-[#FDE68A]'
                        : 'bg-[#FFD6E4] text-[#9F1239] border border-[#F9A8D4]'
                    }`}
                  >
                    {slotIndex === 0 ? '☀️ Slot 1 (Pagi)' : '🌙 Slot 2 (Lembur)'}
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.2 text-[10px] font-display font-bold ${
                      isMorning
                        ? 'bg-[#FFF3C4] text-[#92400E] border border-[#FDE68A]'
                        : 'bg-[#F3E8FF] text-[#6B21A8] border border-[#E9D5FF]'
                    }`}
                  >
                    {isMorning ? '☀️ Shift Pagi' : '🌙 Shift Siang / Sore'}
                  </span>
                )}
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.2 text-[9px] font-semibold ${prioInfo.badgeClass}`}
                >
                  {prioInfo.title}
                </span>
              </div>
            </div>
          </div>

          {/* Compact Effective Time Pill */}
          <div className="shrink-0">
            <div className="inline-flex items-center gap-1 rounded-xl bg-[#FF4D79] text-white px-2.5 py-1 shadow-2xs">
              <Clock className="w-3 h-3" />
              <span className="font-display font-bold text-sm tabular-nums">
                {slot.effectiveTime}
              </span>
            </div>
          </div>
        </div>

        {slot.dateNote && (
          <div className="mt-2">
            <span className="inline-flex items-center gap-1 rounded-lg bg-[#FFE4E6] text-[#9F1239] border border-[#FDA4AF] px-2 py-0.5 text-[10px] font-bold">
              📌 Catatan: {slot.dateNote}
            </span>
          </div>
        )}

        {/* HERO DOCTOR SPOTLIGHT LIST */}
        <div className="mt-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A2841] mb-1.5">
            🩺 Dokter yang Dipegang ({slot.doctors.length || 0}):
          </div>

          {slot.doctors.length > 0 ? (
            <div className="space-y-1.5">
              {slot.doctors.map((doc, idx) => (
                <DoctorSpotlightPill
                  key={idx}
                  doctorRaw={doc}
                  accent={isMorning ? 'sun' : 'moon'}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-[#FBCFE8] bg-white px-3 py-2 text-xs font-semibold text-[#4A1525]">
              Tugas Koordinator / Operasional Klinik
            </div>
          )}
        </div>
      </div>

      {/* Inline Companion Tasks Preview inside Slot Card */}
      {slot.tasks.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-[#FBCFE8]/50">
          <div className="text-[10px] font-bold text-[#7A2841] mb-1">
            📋 Tugas Pendamping:
          </div>
          <div className="flex flex-wrap gap-1">
            {slot.tasks.map((t, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-lg bg-white border border-[#FBCFE8] px-2 py-0.5 text-[11px] font-semibold text-[#4A1525]"
              >
                • {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const TabHariIniAfiz: React.FC<TabHariIniAfizProps> = ({
  book,
  selectedDate,
  onSelectDate,
  selectedNurse,
  swaps = [],
  isPeekMode = false,
  onGoToPeekTab,
}) => {
  const [onlyOvertimeFilter, setOnlyOvertimeFilter] = useState(false);
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  const [copiedWA, setCopiedWA] = useState(false);

  const sortedDates = useMemo(() => Object.keys(book.dates).sort(), [book.dates]);

  const nurseAllDays = useMemo(() => {
    const map: Record<string, NurseDaySummary> = {};
    for (const d of sortedDates) {
      map[d] = getNurseDayView(book, d, selectedNurse, swaps);
    }
    return map;
  }, [book, sortedDates, selectedNurse, swaps]);

  const overtimeDates = useMemo(
    () => sortedDates.filter((d) => nurseAllDays[d]?.status === 'LEMBUR_2_SLOT'),
    [sortedDates, nurseAllDays]
  );

  const visibleStripDates = useMemo(() => {
    if (onlyOvertimeFilter) return overtimeDates;
    return sortedDates.filter((d) => !book.dates[d].isSunday);
  }, [onlyOvertimeFilter, overtimeDates, sortedDates, book.dates]);

  const currentSummary: NurseDaySummary = useMemo(
    () => getNurseDayView(book, selectedDate, selectedNurse, swaps),
    [book, selectedDate, selectedNurse, swaps]
  );

  const stats = useMemo(() => {
    let pagi = 0;
    let sore = 0;
    let lembur = 0;
    let cuti = 0;
    for (const d of sortedDates) {
      if (book.dates[d].isSunday) continue;
      const st = nurseAllDays[d]?.status;
      if (st === 'LEMBUR_2_SLOT') lembur++;
      else if (st === 'REGULER_PAGI') pagi++;
      else if (st === 'REGULER_SORE') sore++;
      else if (st === 'CUTI_LP') cuti++;
    }
    return { pagi, sore, lembur, cuti, totalMasuk: pagi + sore + lembur };
  }, [sortedDates, book.dates, nurseAllDays]);

  const handleJumpTodayOrTomorrow = (offsetDays: number) => {
    const now = new Date();
    now.setDate(now.getDate() + offsetDays);
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const targetISO = `${yyyy}-${mm}-${dd}`;
    if (book.dates[targetISO]) {
      setOnlyOvertimeFilter(false);
      onSelectDate(targetISO);
      return;
    }
    const idx = sortedDates.indexOf(selectedDate);
    if (idx !== -1) {
      const nextIdx = Math.min(Math.max(0, idx + offsetDays), sortedDates.length - 1);
      onSelectDate(sortedDates[nextIdx]);
    }
  };

  const toggleTaskCheck = (taskKey: string) => {
    setCheckedTasks((prev) => ({ ...prev, [taskKey]: !prev[taskKey] }));
  };

  const handleCopyWhatsApp = () => {
    const dateLabel = formatFullDateID(currentSummary.dateISO, currentSummary.dayNameID);
    const lines: string[] = [
      `🐰🍓 *JADWAL DINAS ${selectedNurse.toUpperCase()}*`,
      `📅 *${dateLabel}*`,
    ];

    if (currentSummary.status === 'LEMBUR_2_SLOT') {
      lines.push(`🍓✨ *STATUS: LEMBUR (2 SLOT Pagi & Sore)*`);
      currentSummary.slots.forEach((s, i) => {
        lines.push(
          `\n*Slot ${i + 1} (${s.period === 'PAGI' ? '☀️ Pagi' : '🌙 Sore'}) — Masuk ${s.effectiveTime} WIB*`
        );
        lines.push(`🩺 Dokter: ${s.doctors.join(', ') || '-'}`);
        if (s.tasks.length > 0) lines.push(`📋 Tugas: ${s.tasks.join(', ')}`);
      });
    } else if (currentSummary.slots.length === 1) {
      const s = currentSummary.slots[0];
      lines.push(
        `${s.period === 'PAGI' ? '☀️' : '🌙'} *Masuk Jam: ${s.effectiveTime} WIB* (${s.priorityRawNote})`
      );
      lines.push(`🩺 *Dokter:* ${s.doctors.join(', ') || '-'}`);
      if (s.tasks.length > 0) lines.push(`📋 *Tugas:* ${s.tasks.join(', ')}`);
    } else if (currentSummary.status === 'CUTI_LP') {
      lines.push(`☁️🍵 *STATUS: SEDANG CUTI / LP* (${currentSummary.leaveEntry?.rawText || 'Cuti'})`);
    } else {
      lines.push(`☁️🍵 *STATUS: LIBUR / TIDAK TERPLOT*`);
    }

    navigator.clipboard?.writeText(lines.join('\n'));
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2200);
  };

  const allSlotTasks = useMemo(() => {
    const items: Array<{ key: string; label: string; badge: string }> = [];
    currentSummary.slots.forEach((s, sIdx) => {
      if (s.dateNote) {
        items.push({
          key: `${currentSummary.dateISO}_note_${sIdx}`,
          label: `Catatan: ${s.dateNote}`,
          badge: 'Tanggal',
        });
      }
      s.tasks.forEach((t, tIdx) => {
        items.push({
          key: `${currentSummary.dateISO}_s${sIdx}_t${tIdx}`,
          label: t,
          badge: currentSummary.slots.length > 1 ? `Slot ${sIdx + 1}` : s.effectiveTime,
        });
      });
    });
    currentSummary.sharedTasks.forEach((st, idx) => {
      items.push({
        key: `${currentSummary.dateISO}_shared_${idx}`,
        label: st,
        badge: 'Bersama',
      });
    });
    return items;
  }, [currentSummary]);

  const bunnyMood =
    currentSummary.status === 'LEMBUR_2_SLOT'
      ? 'lembur'
      : currentSummary.status === 'REGULER_PAGI'
      ? 'sunny'
      : currentSummary.status === 'REGULER_SORE'
      ? 'moon'
      : 'sleepy';

  const isAfiz = selectedNurse.toLowerCase() === 'afiz';

  return (
    <div className="space-y-3 pb-6">
      {/* =====================================================================
          BAGIAN 1: PEMILIH TANGGAL RINGKAS (COMPACT DATE STRIP)
         ===================================================================== */}
      <section aria-label="Pemilih Tanggal Cepat" className="bg-white rounded-[20px] border border-[#FBCFE8] shadow-cloud p-2.5">
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleJumpTodayOrTomorrow(0)}
              className="rounded-full bg-[#FFE2EE] hover:bg-[#FF4D79] hover:text-white text-[#4A1525] font-display font-bold text-[11px] px-2.5 py-1 transition cursor-pointer"
            >
              📍 Hari Ini
            </button>
            <button
              type="button"
              onClick={() => handleJumpTodayOrTomorrow(1)}
              className="rounded-full bg-[#FFF5F8] hover:bg-[#FFE2EE] text-[#4A1525] border border-[#FBCFE8] font-display font-bold text-[11px] px-2.5 py-1 transition cursor-pointer"
            >
              Besok →
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              const nextVal = !onlyOvertimeFilter;
              setOnlyOvertimeFilter(nextVal);
              if (nextVal && overtimeDates.length > 0 && !overtimeDates.includes(selectedDate)) {
                onSelectDate(overtimeDates[0]);
              }
            }}
            className={`inline-flex items-center gap-1 rounded-full font-display font-bold text-[11px] px-2.5 py-1 border transition cursor-pointer ${
              onlyOvertimeFilter
                ? 'bg-[#E11D48] text-white border-[#E11D48]'
                : 'bg-[#FFD6E4]/70 hover:bg-[#FFD6E4] text-[#9F1239] border-[#F9A8D4]'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>🍓 Lembur ({overtimeDates.length})</span>
          </button>
        </div>

        {/* Compact Horizontal Scrollable Date Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {visibleStripDates.map((dISO) => {
            const sum = nurseAllDays[dISO];
            const isSelected = dISO === selectedDate;
            const ddNum = parseInt(dISO.split('-')[2], 10);
            const dayShort = (sum?.dayNameID || '').slice(0, 3);

            let statusBadge = '🍵';
            let pillStyle = 'bg-[#FFF5F8] border-[#FBCFE8] text-[#4A1525]';
            if (sum?.status === 'LEMBUR_2_SLOT') {
              statusBadge = '🍓✨';
              pillStyle = 'bg-[#FFD6E4]/85 border-[#F472B6] text-[#9F1239]';
            } else if (sum?.status === 'REGULER_PAGI') {
              statusBadge = '☀️';
              pillStyle = 'bg-[#FFF3C4]/80 border-[#FDE68A] text-[#78350F]';
            } else if (sum?.status === 'REGULER_SORE') {
              statusBadge = '🌙';
              pillStyle = 'bg-[#F3E8FF]/85 border-[#E9D5FF] text-[#581C87]';
            } else if (sum?.status === 'CUTI_LP') {
              statusBadge = '☁️🍵';
              pillStyle = 'bg-[#DCFCE7] border-[#86EFAC] text-[#14532D]';
            }

            if (isSelected) {
              pillStyle =
                'bg-[#FF4D79] border-[#4A1525] text-white shadow-xs scale-[1.02]';
            }

            return (
              <button
                key={dISO}
                type="button"
                onClick={() => onSelectDate(dISO)}
                className={`shrink-0 rounded-xl border px-2 py-1.5 flex flex-col items-center min-w-[46px] transition cursor-pointer ${pillStyle}`}
              >
                <span className="text-[9px] font-bold uppercase opacity-85 leading-none">{dayShort}</span>
                <span className="font-display font-bold text-sm leading-tight tabular-nums mt-0.5">
                  {ddNum}
                </span>
                <span className="text-[10px] leading-none mt-0.5">{statusBadge}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          BAGIAN 2: KARTU UTAMA DOKTER HARI INI (COMPACT MOBILE PROPORTIONS)
         ===================================================================== */}
      <section aria-label="Kartu Utama Dokter Hari Ini" className="relative pt-1.5">
        <div className="flex justify-center -mb-3.5 relative z-20">
          <CuteRibbonBow className="scale-75 drop-shadow-2xs" />
        </div>

        <div
          className={`rounded-[22px] border-2 p-3.5 relative overflow-hidden transition-all ${
            currentSummary.status === 'LEMBUR_2_SLOT'
              ? 'bg-white border-[#FF4D79] shadow-lembur'
              : 'bg-white border-[#FBCFE8] shadow-cloud'
          }`}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#FFE2EE]">
            <div className="flex items-center gap-2 min-w-0">
              <BunnyNurseAvatar
                mood={bunnyMood}
                size={44}
                isCrown={isAfiz}
                className="animate-ear-wiggle"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="font-display text-base font-bold text-[#4A1525] truncate">
                    {isAfiz ? 'Jadwal Dinas Afiz' : `Jadwal ${selectedNurse}`}
                  </h1>
                  {isAfiz && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-[#FFE2EE] border border-[#FBCFE8] px-2 py-0.2 text-[9px] font-bold text-[#FF4D79]">
                      <Heart className="w-2.5 h-2.5 fill-[#FF4D79]" /> My Nurse
                    </span>
                  )}
                </div>
                <p className="font-display font-bold text-xs text-[#FF4D79]">
                  📅 {formatFullDateID(currentSummary.dateISO, currentSummary.dayNameID)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#FFF5F8] hover:bg-[#FFE2EE] text-[#4A1525] border border-[#FBCFE8] font-display font-bold text-[11px] px-2.5 py-1.5 transition cursor-pointer"
            >
              {copiedWA ? (
                <>
                  <Check className="w-3 h-3 text-[#15803D]" />
                  <span className="text-[#15803D]">Disalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-[#FF4D79]" />
                  <span>Salin WA</span>
                </>
              )}
            </button>
          </div>

          {/* CASE A: 🍓✨ LEMBUR! (2 SLOT DI HARI YANG SAMA) */}
          {currentSummary.status === 'LEMBUR_2_SLOT' && (
            <div className="mt-2.5 space-y-2.5">
              <div className="rounded-2xl bg-gradient-to-r from-[#FFD6E4] via-[#FFE2EE] to-[#FFF3C4] border border-dashed border-[#E11D48] px-3 py-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <StrawberryMilkBottleIcon double size={32} />
                  <div className="min-w-0">
                    <div className="font-display font-bold text-xs text-[#9F1239]">
                      🍓✨ HARI INI {selectedNurse.toUpperCase()} LEMBUR (2 SLOT)!
                    </div>
                    <p className="text-[10px] font-medium text-[#4A1525] truncate">
                      {isAfiz
                        ? 'Semangat ya sayang, hari ini pegang 2 slot pagi & sore!'
                        : 'Terplot di 2 slot berbeda pada hari yang sama'}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-[#E11D48] text-white font-display font-bold text-[10px] px-2.5 py-1 tabular-nums">
                  {currentSummary.slots[0]?.effectiveTime} &amp; {currentSummary.slots[1]?.effectiveTime}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentSummary.slots.map((slot, idx) => (
                  <SlotDetailPanel
                    key={slot.slotId}
                    slot={slot}
                    slotIndex={idx}
                    isOvertimeCard
                  />
                ))}
              </div>
            </div>
          )}

          {/* CASE B: ☀️/🌙 DINAS REGULER (1 SLOT) */}
          {(currentSummary.status === 'REGULER_PAGI' ||
            currentSummary.status === 'REGULER_SORE') &&
            currentSummary.slots[0] && (
              <div className="mt-2.5">
                <SlotDetailPanel slot={currentSummary.slots[0]} />
              </div>
            )}

          {/* CASE C: ☁️🍵 SEDANG CUTI / LP / LIBUR */}
          {(currentSummary.status === 'CUTI_LP' || currentSummary.status === 'LIBUR_OFF') && (
            <div className="mt-2.5 rounded-2xl bg-[#DCFCE7]/80 border border-[#86EFAC] p-4 text-center">
              <div className="flex justify-center items-center gap-2 mb-1.5">
                <MatchaSleepyCloudIcon size={38} />
                <BunnyNurseAvatar mood="sleepy" size={48} isCrown={isAfiz} />
              </div>
              <h2 className="font-display text-sm font-bold text-[#14532D]">
                {currentSummary.status === 'CUTI_LP'
                  ? `☁️🍵 ${selectedNurse} Sedang Cuti / LP Hari Ini!`
                  : `☁️🍵 ${selectedNurse} Libur / Off Hari Ini`}
              </h2>
              <p className="text-xs font-medium text-[#166534] mt-0.5">
                {currentSummary.leaveEntry
                  ? `Keterangan: "${currentSummary.leaveEntry.rawText}" — Selamat istirahat penuh ya!`
                  : currentSummary.isSunday
                  ? 'Hari Minggu libur — selamat rebahan dan istirahat!'
                  : 'Tidak ada plot dokter pada tanggal ini.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Pengingat Presentasi Kasus Selasa & Rabu */}
      {currentSummary.isCasePresentationDay && (
        <div className="rounded-2xl bg-[#FFF3C4] border border-[#FDE68A] px-3 py-2 flex items-center gap-2.5">
          <Bell className="w-4 h-4 text-[#B45309] shrink-0" />
          <div className="text-xs text-[#78350F]">
            <span className="font-display font-bold">Hari {currentSummary.dayNameID}:</span>{' '}
            <span>Presentasi kasus siap jam 12.00 WIB</span>
          </div>
        </div>
      )}

      {/* Rincian Tugas Operasional Klinik */}
      {allSlotTasks.length > 0 && (
        <section
          aria-label="Rincian Tugas Operasional Klinik"
          className="bg-white rounded-[20px] border border-[#FBCFE8] shadow-cloud p-3.5"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <h2 className="font-display text-sm font-bold text-[#4A1525]">
              🎀 Checklist Tugas Pendamping
            </h2>
            <span className="rounded-full bg-[#FFE2EE] px-2 py-0.5 font-display font-bold text-[10px] text-[#9F1239]">
              {allSlotTasks.filter((t) => checkedTasks[t.key]).length}/{allSlotTasks.length} Selesai
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {allSlotTasks.map((item) => {
              const isDone = !!checkedTasks[item.key];
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggleTaskCheck(item.key)}
                  className={`w-full text-left rounded-xl border px-2.5 py-2 flex items-center justify-between gap-2 transition cursor-pointer ${
                    isDone
                      ? 'bg-[#DCFCE7]/50 border-[#86EFAC] text-[#14532D]'
                      : 'bg-[#FFF9FB] hover:bg-[#FFE2EE]/40 border-[#FBCFE8] text-[#4A1525]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#FF4D79] shrink-0" />
                    )}
                    <span
                      className={`text-xs font-semibold truncate ${
                        isDone ? 'line-through opacity-75' : ''
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  <span className="shrink-0 rounded-full bg-white border border-[#FBCFE8] px-2 py-0.2 text-[9px] font-bold text-[#7A2841]">
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Kalender Bulanan Visual (Compact 7-Col Mobile Grid) */}
      <section
        aria-label="Kalender Bulanan Visual"
        className="bg-white rounded-[20px] border border-[#FBCFE8] shadow-cloud p-3.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-[#FF4D79]" />
            <h2 className="font-display text-sm font-bold text-[#4A1525]">
              Peta Dinas {selectedNurse}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1 text-[10px] font-display font-bold">
            <span className="rounded-full bg-[#FFD6E4] text-[#9F1239] px-2 py-0.5">
              🍓 {stats.lembur}x
            </span>
            <span className="rounded-full bg-[#FFF3C4] text-[#92400E] px-2 py-0.5">
              ☀️ {stats.pagi}x
            </span>
            <span className="rounded-full bg-[#F3E8FF] text-[#6B21A8] px-2 py-0.5">
              🌙 {stats.sore}x
            </span>
            <span className="rounded-full bg-[#DCFCE7] text-[#15803D] px-2 py-0.5">
              🍵 {stats.cuti}x
            </span>
          </div>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5">
          {sortedDates.map((dISO) => {
            const sum = nurseAllDays[dISO];
            if (!sum) return null;
            const ddNum = parseInt(dISO.split('-')[2], 10);
            const isSelected = dISO === selectedDate;

            let cardBg = 'bg-[#FFF9FB] border-[#FBCFE8]';
            let statusLabel = 'Off';
            if (sum.isSunday) {
              cardBg = 'bg-[#FFF0F5]/40 border-[#FBCFE8]/40 opacity-60';
              statusLabel = 'Mgg';
            } else if (sum.status === 'LEMBUR_2_SLOT') {
              cardBg = 'bg-[#FFD6E4] border-[#F472B6]';
              statusLabel = `🍓2x`;
            } else if (sum.status === 'REGULER_PAGI') {
              cardBg = 'bg-[#FFF3C4]/85 border-[#FDE68A]';
              statusLabel = `☀️${sum.slots[0]?.effectiveTime.slice(0, 2)}`;
            } else if (sum.status === 'REGULER_SORE') {
              cardBg = 'bg-[#F3E8FF]/90 border-[#E9D5FF]';
              statusLabel = `🌙${sum.slots[0]?.effectiveTime.slice(0, 2)}`;
            } else if (sum.status === 'CUTI_LP') {
              cardBg = 'bg-[#DCFCE7] border-[#86EFAC]';
              statusLabel = `🍵Cuti`;
            }

            return (
              <button
                key={dISO}
                type="button"
                onClick={() => onSelectDate(dISO)}
                className={`rounded-xl border p-1.5 text-center transition cursor-pointer ${cardBg} ${
                  isSelected ? 'ring-2 ring-[#FF4D79] scale-[1.03]' : ''
                }`}
              >
                <div className="text-[9px] font-bold text-[#7A2841] leading-none">
                  {sum.dayNameID.slice(0, 3)}
                </div>
                <div className="font-display font-bold text-xs text-[#4A1525] tabular-nums mt-0.5">
                  {ddNum}
                </div>
                <div className="text-[9px] font-bold text-[#4A1525] truncate leading-tight">
                  {statusLabel}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Shortcut manis ke Menu 3 (Intip Perawat Lain) khusus di Tab 1 Utama Afiz */}
      {!isPeekMode && onGoToPeekTab && (
        <section
          aria-label="Pintasan Intip Perawat Lain"
          className="bg-white rounded-[20px] border border-[#FBCFE8] shadow-cloud p-3 flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2 min-w-0">
            <BunnyNurseAvatar size={32} mood="happy" />
            <div className="min-w-0">
              <div className="font-display font-bold text-xs text-[#4A1525]">
                🐰 Mau intip jadwal teman perawat lain?
              </div>
              <p className="text-[10px] text-[#7A2841] truncate">
                Lihat jadwal {book.allNurses.length - 1} rekan asisten &amp; siapa yang cuti hari ini
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onGoToPeekTab}
            className="shrink-0 rounded-full bg-[#FFE2EE] hover:bg-[#FF4D79] hover:text-white text-[#9F1239] border border-[#F9A8D4] font-display font-bold text-[11px] px-3 py-1.5 transition cursor-pointer"
          >
            Intip →
          </button>
        </section>
      )}
    </div>
  );
};
