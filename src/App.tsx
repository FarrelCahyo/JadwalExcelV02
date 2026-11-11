import React, { useMemo } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { BerryTab, useScheduleStore } from './hooks/useScheduleStore';
import { getNurseDayView } from './utils/excelParser';
import { UploadWelcomeScreen } from './components/UploadWelcomeScreen';
import { HeaderBar } from './components/HeaderBar';
import { TabHariIniAfiz } from './components/tabs/TabHariIniAfiz';
import { TabCekDokter } from './components/tabs/TabCekDokter';
import { TabIntipPerawat } from './components/tabs/TabIntipPerawat';
import { TabUploadPic } from './components/tabs/TabUploadPic';
import { BunnyMood } from './components/kawaii/UsagiMascots';

export const App: React.FC = () => {
  const {
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
  } = useScheduleStore();

  const activeViewNurse = activeTab === 'INTIP_PERAWAT' ? selectedNurse : 'Afiz';

  const currentMood: BunnyMood = useMemo(() => {
    if (!book || !selectedDate) return 'happy';
    const sum = getNurseDayView(book, selectedDate, activeViewNurse, swaps);
    if (sum.status === 'LEMBUR_2_SLOT') return 'lembur';
    if (sum.status === 'REGULER_PAGI') return 'sunny';
    if (sum.status === 'REGULER_SORE') return 'moon';
    if (sum.status === 'CUTI_LP') return 'sleepy';
    return 'happy';
  }, [book, selectedDate, activeViewNurse, swaps]);

  if (!book) {
    return (
      <UploadWelcomeScreen
        onUploadFiles={(files) => uploadFiles(files, 'replace')}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  const navItems: Array<{ id: BerryTab; icon: string; label: string; badge?: number }> = [
    {
      id: 'HARI_INI',
      icon: '🐰🍓',
      label: 'Jadwal Afiz',
    },
    {
      id: 'CEK_DOKTER',
      icon: '🩺☁️',
      label: 'Cek Dokter',
    },
    {
      id: 'INTIP_PERAWAT',
      icon: '🐰🌸',
      label: 'Intip Perawat',
    },
    {
      id: 'UPLOAD_PIC',
      icon: '🥛📂',
      label: 'Upload & PIC',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <HeaderBar
        book={book}
        selectedNurse={activeViewNurse}
        onSelectNurse={() => {
          setActiveTab('HARI_INI');
        }}
        currentMood={currentMood}
        onQuickUpload={(files) => uploadFiles(files, 'merge')}
      />

      {/* Main Content Container (Sleek Mobile-Proportioned Max Width) */}
      <main className="flex-1 max-w-xl w-full mx-auto px-3 pt-2.5">
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-2xl bg-[#FFE4E6] border-2 border-[#FDA4AF] p-3.5 flex items-center justify-between gap-2 text-xs font-semibold text-[#9F1239]"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#E11D48]" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="p-1 hover:bg-[#FECDD3] rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {activeTab === 'HARI_INI' && (
          <TabHariIniAfiz
            book={book}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            selectedNurse="Afiz"
            onGoToPeekTab={() => setActiveTab('INTIP_PERAWAT')}
          />
        )}

        {activeTab === 'CEK_DOKTER' && (
          <TabCekDokter
            book={book}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            swaps={swaps}
            onInspectNurse={(nurse) => {
              if (nurse.toLowerCase() === 'afiz') {
                setActiveTab('HARI_INI');
              } else {
                setSelectedNurse(nurse);
                setActiveTab('INTIP_PERAWAT');
              }
            }}
          />
        )}

        {activeTab === 'INTIP_PERAWAT' && (
          <TabIntipPerawat
            book={book}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            peekedNurse={selectedNurse}
            onSelectPeekedNurse={setSelectedNurse}
          />
        )}

        {activeTab === 'UPLOAD_PIC' && (
          <TabUploadPic
            book={book}
            selectedNurse="Afiz"
            swaps={swaps}
            onUploadFiles={uploadFiles}
            onClearSchedule={clearSchedule}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* Sleek Compact Kawaii Cloud Bottom Navigation Bar */}
      <nav
        aria-label="Navigasi Utama Sheyla"
        className="fixed bottom-2.5 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-20px)] max-w-md bg-white/95 backdrop-blur-md border border-[#FBCFE8] rounded-2xl shadow-cloud px-1.5 py-1"
      >
        <div className="grid grid-cols-4 gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`relative rounded-xl py-1.5 px-1 flex flex-col items-center justify-center transition cursor-pointer ${
                  isActive
                    ? 'bg-[#FF4D79] text-white shadow-2xs'
                    : 'text-[#4A1525] hover:bg-[#FFF5F8]'
                }`}
              >
                <span className="text-xs leading-none">{item.icon}</span>
                <span className="font-display font-bold text-[10px] mt-0.5 truncate max-w-full">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default App;

