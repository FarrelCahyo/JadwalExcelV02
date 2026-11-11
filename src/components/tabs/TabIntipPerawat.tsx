import React, { useMemo, useState } from 'react';
import { Search, ChevronDown, ChevronUp, X, Star } from 'lucide-react';
import { NurseDaySummary, ParsedScheduleBook } from '../../types/schedule';
import { getNurseDayView } from '../../utils/excelParser';
import { BunnyNurseAvatar } from '../kawaii/UsagiMascots';
import { TabHariIniAfiz } from './TabHariIniAfiz';

interface TabIntipPerawatProps {
  book: ParsedScheduleBook;
  selectedDate: string;
  onSelectDate: (dateISO: string) => void;
  peekedNurse: string;
  onSelectPeekedNurse: (nurse: string) => void;
}

type NurseGroupFilter = 'ALL' | 'LEMBUR' | 'PAGI' | 'SORE' | 'OFF';

const STORAGE_KEY_RECENT_PEEK = 'Sheyla_recent_peek_nurses_v1';

export const TabIntipPerawat: React.FC<TabIntipPerawatProps> = ({
  book,
  selectedDate,
  onSelectDate,
  peekedNurse,
  onSelectPeekedNurse,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<NurseGroupFilter>('ALL');
  const [recentNurses, setRecentNurses] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECENT_PEEK);
      return saved ? (JSON.parse(saved) as string[]) : ['Lulut', 'Nabila', 'Firda', 'Endang', 'Dewi S'];
    } catch {
      return ['Lulut', 'Nabila', 'Firda', 'Endang', 'Dewi S'];
    }
  });

  const otherNurses = useMemo(
    () => book.allNurses.filter((n) => n.toLowerCase() !== 'afiz'),
    [book.allNurses]
  );

  const summariesByNurse = useMemo(() => {
    const map: Record<string, NurseDaySummary> = {};
    for (const n of otherNurses) {
      map[n] = getNurseDayView(book, selectedDate, n);
    }
    return map;
  }, [book, selectedDate, otherNurses]);

  const groupCounts = useMemo(() => {
    let lembur = 0;
    let pagi = 0;
    let sore = 0;
    let off = 0;
    for (const n of otherNurses) {
      const st = summariesByNurse[n]?.status;
      if (st === 'LEMBUR_2_SLOT') lembur++;
      else if (st === 'REGULER_PAGI') pagi++;
      else if (st === 'REGULER_SORE') sore++;
      else off++;
    }
    return { lembur, pagi, sore, off };
  }, [otherNurses, summariesByNurse]);

  const handlePickNurse = (nurse: string) => {
    onSelectPeekedNurse(nurse);
    setIsDrawerOpen(false);
    setSearchQuery('');
    setRecentNurses((prev) => {
      const next = [nurse, ...prev.filter((item) => item.toLowerCase() !== nurse.toLowerCase())].slice(0, 8);
      try {
        localStorage.setItem(STORAGE_KEY_RECENT_PEEK, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const quickStripNurses = useMemo(() => {
    const recentSet = new Set(recentNurses.map((r) => r.toLowerCase()));
    return [...otherNurses].sort((a, b) => {
      if (a.toLowerCase() === peekedNurse.toLowerCase()) return -1;
      if (b.toLowerCase() === peekedNurse.toLowerCase()) return 1;
      const aRec = recentSet.has(a.toLowerCase()) ? 1 : 0;
      const bRec = recentSet.has(b.toLowerCase()) ? 1 : 0;
      if (aRec !== bRec) return bRec - aRec;
      const aSlots = summariesByNurse[a]?.slots.length || 0;
      const bSlots = summariesByNurse[b]?.slots.length || 0;
      if (aSlots !== bSlots) return bSlots - aSlots;
      return a.localeCompare(b, 'id');
    });
  }, [otherNurses, peekedNurse, recentNurses, summariesByNurse]);

  const filteredDrawerNurses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return otherNurses.filter((n) => {
      const sum = summariesByNurse[n];
      if (groupFilter === 'LEMBUR' && sum?.status !== 'LEMBUR_2_SLOT') return false;
      if (groupFilter === 'PAGI' && sum?.status !== 'REGULER_PAGI') return false;
      if (groupFilter === 'SORE' && sum?.status !== 'REGULER_SORE') return false;
      if (groupFilter === 'OFF' && sum?.status !== 'CUTI_LP' && sum?.status !== 'LIBUR_OFF') {
        return false;
      }
      if (!q) return true;
      const inName = n.toLowerCase().includes(q);
      const inDoc = sum?.slots.some((s) => s.doctors.some((d) => d.toLowerCase().includes(q)));
      return inName || inDoc;
    });
  }, [otherNurses, summariesByNurse, groupFilter, searchQuery]);

  return (
    <div className="space-y-3">
      {/* SMART COMPACT BUNNY NURSE PICKER */}
      <section
        aria-label="Pemilih Rekan Perawat Kelinci"
        className="bg-white rounded-[20px] border border-[#FBCFE8] shadow-cloud p-3"
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <BunnyNurseAvatar mood="happy" size={30} />
            <div className="min-w-0">
              <h1 className="font-display text-xs sm:text-sm font-bold text-[#4A1525] truncate">
                🐰🌸 Intip Jadwal: <span className="text-[#FF4D79]">{peekedNurse}</span>
              </h1>
              <p className="text-[10px] text-[#7A2841] truncate">
                Geser nama di bawah atau tap Cari ({otherNurses.length} teman)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDrawerOpen((prev) => !prev)}
            className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-display font-bold text-[11px] transition cursor-pointer ${
              isDrawerOpen
                ? 'bg-[#4A1525] text-white border-[#4A1525]'
                : 'bg-[#FFE2EE] hover:bg-[#FF4D79] hover:text-white text-[#9F1239] border-[#F472B6]'
            }`}
          >
            <Search className="w-3 h-3" />
            <span>{isDrawerOpen ? 'Tutup' : `Cari (${otherNurses.length})`}</span>
            {isDrawerOpen ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>

        {/* 1-Line Horizontal Quick Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {quickStripNurses.map((nurse) => {
            const isSelected = nurse.toLowerCase() === peekedNurse.toLowerCase();
            const isRecent = recentNurses.some((r) => r.toLowerCase() === nurse.toLowerCase());
            const sum = summariesByNurse[nurse];

            let statusIcon = '🍵';
            let timeHint = sum?.leaveEntry ? sum.leaveEntry.type : 'Off';
            if (sum?.status === 'LEMBUR_2_SLOT') {
              statusIcon = '🍓';
              timeHint = `${sum.slots[0]?.effectiveTime.slice(0, 2)}+${sum.slots[1]?.effectiveTime.slice(0, 2)}`;
            } else if (sum?.status === 'REGULER_PAGI') {
              statusIcon = '☀️';
              timeHint = sum.slots[0]?.effectiveTime || 'Pagi';
            } else if (sum?.status === 'REGULER_SORE') {
              statusIcon = '🌙';
              timeHint = sum.slots[0]?.effectiveTime || 'Sore';
            }

            return (
              <button
                key={nurse}
                type="button"
                onClick={() => handlePickNurse(nurse)}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#FF4D79] text-white border-[#4A1525] shadow-2xs'
                    : 'bg-[#FFF5F8] hover:bg-[#FFE2EE] text-[#4A1525] border-[#FBCFE8]'
                }`}
              >
                <BunnyNurseAvatar
                  size={20}
                  mood={
                    sum?.status === 'LEMBUR_2_SLOT'
                      ? 'lembur'
                      : sum?.status === 'CUTI_LP'
                      ? 'sleepy'
                      : 'happy'
                  }
                />
                <div className="text-left">
                  <div className="flex items-center gap-0.5 font-display font-bold text-[11px] leading-none">
                    <span>{nurse}</span>
                    {isRecent && !isSelected && (
                      <Star className="w-2 h-2 fill-[#F59E0B] text-[#F59E0B]" />
                    )}
                  </div>
                  <div
                    className={`text-[9px] font-semibold tabular-nums mt-0.5 leading-none ${
                      isSelected ? 'text-white/90' : 'text-[#7A2841]'
                    }`}
                  >
                    {statusIcon} {timeHint}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* EXPANDABLE DRAWER */}
        {isDrawerOpen && (
          <div className="mt-2.5 pt-2.5 border-t border-[#FFE2EE] space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#FF4D79] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama teman atau dokter hari ini..."
                autoFocus
                className="w-full rounded-full bg-[#FFF5F8] border border-[#FBCFE8] focus:border-[#FF4D79] focus:bg-white pl-8 pr-8 py-1.5 text-xs font-medium text-[#4A1525] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A2841] hover:text-[#FF4D79] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setGroupFilter('ALL')}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-display font-bold border transition cursor-pointer ${
                  groupFilter === 'ALL'
                    ? 'bg-[#FF4D79] text-white border-[#FF4D79]'
                    : 'bg-[#FFF5F8] text-[#4A1525] border-[#FBCFE8]'
                }`}
              >
                Semua ({otherNurses.length})
              </button>
              <button
                type="button"
                onClick={() => setGroupFilter('LEMBUR')}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-display font-bold border transition cursor-pointer ${
                  groupFilter === 'LEMBUR'
                    ? 'bg-[#E11D48] text-white border-[#E11D48]'
                    : 'bg-[#FFD6E4]/70 text-[#9F1239] border-[#F9A8D4]'
                }`}
              >
                🍓 Lembur ({groupCounts.lembur})
              </button>
              <button
                type="button"
                onClick={() => setGroupFilter('PAGI')}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-display font-bold border transition cursor-pointer ${
                  groupFilter === 'PAGI'
                    ? 'bg-[#F59E0B] text-white border-[#F59E0B]'
                    : 'bg-[#FFF3C4] text-[#92400E] border-[#FDE68A]'
                }`}
              >
                ☀️ Pagi ({groupCounts.pagi})
              </button>
              <button
                type="button"
                onClick={() => setGroupFilter('SORE')}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-display font-bold border transition cursor-pointer ${
                  groupFilter === 'SORE'
                    ? 'bg-[#7E22CE] text-white border-[#7E22CE]'
                    : 'bg-[#F3E8FF] text-[#6B21A8] border-[#E9D5FF]'
                }`}
              >
                🌙 Sore ({groupCounts.sore})
              </button>
              <button
                type="button"
                onClick={() => setGroupFilter('OFF')}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-display font-bold border transition cursor-pointer ${
                  groupFilter === 'OFF'
                    ? 'bg-[#15803D] text-white border-[#15803D]'
                    : 'bg-[#DCFCE7] text-[#14532D] border-[#86EFAC]'
                }`}
              >
                🍵 Cuti/Off ({groupCounts.off})
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-56 overflow-y-auto pr-0.5">
              {filteredDrawerNurses.map((nurse) => {
                const sum = summariesByNurse[nurse];
                const isSelected = nurse.toLowerCase() === peekedNurse.toLowerCase();

                let badgeText = 'Off';
                let badgeBg = 'bg-[#FFF5F8] text-[#7A2841]';
                if (sum?.status === 'LEMBUR_2_SLOT') {
                  badgeText = `🍓 ${sum.slots[0]?.effectiveTime}+${sum.slots[1]?.effectiveTime}`;
                  badgeBg = 'bg-[#FFD6E4] text-[#9F1239]';
                } else if (sum?.status === 'REGULER_PAGI') {
                  badgeText = `☀️ ${sum.slots[0]?.effectiveTime}`;
                  badgeBg = 'bg-[#FFF3C4] text-[#92400E]';
                } else if (sum?.status === 'REGULER_SORE') {
                  badgeText = `🌙 ${sum.slots[0]?.effectiveTime}`;
                  badgeBg = 'bg-[#F3E8FF] text-[#6B21A8]';
                } else if (sum?.status === 'CUTI_LP') {
                  badgeText = `🍵 ${sum.leaveEntry?.rawText || 'Cuti'}`;
                  badgeBg = 'bg-[#DCFCE7] text-[#15803D]';
                }

                const previewDoc =
                  sum?.slots[0]?.doctors[0] || sum?.slots[0]?.tasks[0] || '';

                return (
                  <button
                    key={nurse}
                    type="button"
                    onClick={() => handlePickNurse(nurse)}
                    className={`rounded-xl border p-2 text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#FFE2EE] border-[#FF4D79]'
                        : 'bg-[#FFF9FB] hover:bg-[#FFE2EE]/50 border-[#FBCFE8]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <BunnyNurseAvatar
                        size={22}
                        mood={
                          sum?.status === 'LEMBUR_2_SLOT'
                            ? 'lembur'
                            : sum?.status === 'CUTI_LP'
                            ? 'sleepy'
                            : 'happy'
                        }
                      />
                      <div className="min-w-0">
                        <div className="font-display font-bold text-xs text-[#4A1525] truncate">
                          {nurse}
                        </div>
                        <span
                          className={`inline-block rounded-full px-1.5 py-0.2 text-[9px] font-bold ${badgeBg}`}
                        >
                          {badgeText}
                        </span>
                      </div>
                    </div>
                    {previewDoc && (
                      <div className="text-[9px] font-medium text-[#7A2841] truncate mt-1">
                        🩺 {previewDoc}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <TabHariIniAfiz
        book={book}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        selectedNurse={peekedNurse}
        isPeekMode
      />
    </div>
  );
};
