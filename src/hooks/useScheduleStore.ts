import { useState, useEffect, useCallback } from 'react';
import { ParsedScheduleBook, SwapOverride } from '../types/schedule';
import { mergeScheduleBooks, parseInternisExcelBuffer } from '../utils/excelParser';

export type BerryTab = 'HARI_INI' | 'CEK_DOKTER' | 'INTIP_PERAWAT' | 'UPLOAD_PIC';

const STORAGE_KEY_BOOK = 'Sheyla_book_v1';
const STORAGE_KEY_SWAPS = 'Sheyla_swaps_v1';
const STORAGE_KEY_NURSE = 'Sheyla_selected_nurse_v1';

function pickInitialDate(book: ParsedScheduleBook | null): string {
  if (!book) return '';
  const allDates = Object.keys(book.dates).sort();
  if (allDates.length === 0) return '';

  // Try today's local date (YYYY-MM-DD)
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const todayISO = `${yyyy}-${mm}-${dd}`;

  if (book.dates[todayISO] && !book.dates[todayISO].isSunday) {
    return todayISO;
  }

  // Otherwise pick the first non-Sunday date where Afiz has slots, or first non-Sunday date
  const firstAfizActive = allDates.find(
    (d) =>
      !book.dates[d].isSunday &&
      book.dates[d].assignments.some((a) => a.nurseName.toLowerCase() === 'afiz')
  );
  if (firstAfizActive) return firstAfizActive;

  const firstWorking = allDates.find((d) => !book.dates[d].isSunday);
  return firstWorking || allDates[0];
}

export function useScheduleStore() {
  const [book, setBook] = useState<ParsedScheduleBook | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BOOK);
      return saved ? (JSON.parse(saved) as ParsedScheduleBook) : null;
    } catch {
      return null;
    }
  });

  const [swaps, setSwaps] = useState<SwapOverride[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SWAPS);
      return saved ? (JSON.parse(saved) as SwapOverride[]) : [];
    } catch {
      return [];
    }
  });

  const [selectedNurse, setSelectedNurseState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NURSE);
      return saved && saved.toLowerCase() !== 'afiz' ? saved : 'Lulut';
    } catch {
      return 'Lulut';
    }
  });

  const [selectedDate, setSelectedDate] = useState<string>(() => pickInitialDate(book));
  const [activeTab, setActiveTab] = useState<BerryTab>('HARI_INI');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (book && (!selectedDate || !book.dates[selectedDate])) {
      setSelectedDate(pickInitialDate(book));
    }
  }, [book, selectedDate]);

  const setSelectedNurse = useCallback((nurse: string) => {
    setSelectedNurseState(nurse);
    try {
      localStorage.setItem(STORAGE_KEY_NURSE, nurse);
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const uploadFiles = useCallback(
    async (files: FileList | File[], mode: 'merge' | 'replace' = 'merge') => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      setIsLoading(true);
      setError(null);
      try {
        const parsedBooks: ParsedScheduleBook[] = [];
        for (const file of fileArray) {
          const buf = await file.arrayBuffer();
          const parsed = await parseInternisExcelBuffer(buf, file.name);
          parsedBooks.push(parsed);
        }

        const booksToCombine =
          mode === 'merge' && book ? [book, ...parsedBooks] : parsedBooks;
        const combined = mergeScheduleBooks(booksToCombine);

        setBook(combined);
        const nextDate = pickInitialDate(combined);
        setSelectedDate(nextDate);
        setActiveTab('HARI_INI');

        try {
          localStorage.setItem(STORAGE_KEY_BOOK, JSON.stringify(combined));
        } catch {
          // Ignore storage quota errors
        }
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Gagal membaca file Excel. Pastikan file berformat .xlsx resmi klinik.';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [book]
  );

  const addSwap = useCallback(
    (swap: Omit<SwapOverride, 'id' | 'createdAt'>) => {
      const newSwap: SwapOverride = {
        ...swap,
        id: `swap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
      };
      setSwaps((prev) => {
        const updated = [...prev, newSwap];
        try {
          localStorage.setItem(STORAGE_KEY_SWAPS, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    },
    []
  );

  const removeSwap = useCallback((swapId: string) => {
    setSwaps((prev) => {
      const updated = prev.filter((s) => s.id !== swapId);
      try {
        localStorage.setItem(STORAGE_KEY_SWAPS, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const clearSwaps = useCallback(() => {
    setSwaps([]);
    try {
      localStorage.removeItem(STORAGE_KEY_SWAPS);
    } catch {
      // ignore
    }
  }, []);

  const clearSchedule = useCallback(() => {
    setBook(null);
    setSwaps([]);
    setSelectedDate('');
    setError(null);
    try {
      localStorage.removeItem(STORAGE_KEY_BOOK);
      localStorage.removeItem(STORAGE_KEY_SWAPS);
    } catch {
      // ignore
    }
  }, []);

  return {
    book,
    selectedDate,
    setSelectedDate,
    selectedNurse,
    setSelectedNurse,
    activeTab,
    setActiveTab,
    swaps,
    addSwap,
    removeSwap,
    clearSwaps,
    uploadFiles,
    clearSchedule,
    isLoading,
    error,
    setError,
  };
}

