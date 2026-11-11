# Sheyla (`UsagiBerry UI`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build **Sheyla**, a mobile-first static client-side web application (`UsagiBerry UI` — Kawaii Bunny Nurse & Dreamy Strawberry Milk Wonderland) that parses uploaded clinic `.xlsx` schedule files (`internis dkk`) and displays Afiz's daily doctors, effective arrival time (3-tier priority), overtime (`2 Slot`) status, clinic tasks, doctor directory, leave/swap simulator, and monthly PICs.

**Architecture:** A Vite + React + TypeScript + Tailwind CSS Single-Page Application with a deterministic client-side `.xlsx` parser (`jszip` for XML border & cell extraction + `xlsx` fallback) and `localStorage` persistence for multi-file schedule merging and slot swap simulations. Custom modular SVG kawaii illustrations (`BunnyNurseAvatar`, `SunnyCloudIcon`, `DreamyMoonIcon`, `StrawberryMilkBottle`, `CloudCard`) deliver the `UsagiBerry UI` aesthetic.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS, `jszip`, `xlsx` (SheetJS), `lucide-react`, `vitest` (for unit testing the Excel parser against the 3 reference `.xlsx` files).

**Spec:** `docs/superpowers/specs/2026-11-11-Sheyla-design.md` (and `prd_jadwal_shift_internis_strawberrymilk.md`)

## Global Constraints

- **100% Upload-Driven:** The app starts in an upload-first state (persisted in `localStorage` once uploaded); the 3 `.xlsx` files in the repo root are used only by automated tests to verify parser accuracy.
- **3-Tier Effective Time Priority:** Priority 1 = Date cell time note (`jam 8`, `Rina A jam 8`); Priority 2 = Day column (`B..G`) time note (`masuk jam 12`, `msk j.8`, `masuk ajm 13`, `masuk 10`); Priority 3 = Column `A` parent shift (`Jam 7`, `Jam 8`, `j 9`, `J.10`, `14.00`, `07.14`, `14.21`).
- **Overtime Detection (`🍓✨ LEMBUR 2 Slot`):** Any nurse assigned to `>= 2` individual slots on the same date (excluding Row 100 `semua asisten`) is marked `LEMBUR` with Slot 1 (Morning) and Slot 2 (Afternoon/Overtime) displayed side-by-side.
- **Color & Typography Tokens (`UsagiBerry UI`):** `--bg-milk: #FFF5F8`, `--bg-card: #FFFFFF`, `--bg-frosting: #FFE2EE`, `--berry-primary: #FF4D79`, `--sun-yellow: #FFF3C4 / #B45309`, `--moon-lavender: #F3E8FF / #7E22CE`, `--lembur-pink: #FFD6E4 / #E11D48`, `--matcha-mint: #DCFCE7 / #15803D`, `--berry-dark: #4A1525`; fonts `Quicksand` (Bold 700) and `Plus Jakarta Sans`.

## Review Focus

- **Typo & Spacing Variations in Excel Nurse Names & Time Notes:** Cells like `Adelin a`, `Siti ANifah`, `masuk ajm 13`, `masuk 10`, and `Rina A jam 8` must normalize cleanly to the canonical nurse name (`Adelina`, `Siti Anifah`, `Rina A`) and extract the right time (`13.00`, `10.00`, `08.00`).
- **Shared Row 100 (`semua asisten`) Exclusion from Overtime:** Row 100 (`EVALUASI BPJS dan Print resume / PIKET 5R1P` assigned to `semua asisten`) must be tagged `isAllAssistants: true` so it does not inflate every nurse's daily slot count into false overtime.
- **Separate-Row Priority 1 Time Notes Inside a Slot Block:** On `2026-11-25 (Wed)`, `Y7` has `Afiz` and `Y8` (same bordered block `7..8`) has `jam 8`. The parser must attach `jam 8` (Priority 1) to `Afiz` on `2026-11-25` so effective time is `08.00 WIB` instead of `07.00 WIB`.
- **Multi-File Upload Merging with Overlapping Dates:** Uploading `NOVEMBER MG 1 2026.xlsx` (`01–08 Nov`) followed by `NOVEMBER 2026.xlsx` (`08–30 Nov`) must merge into a unified `01–30 Nov 2026` schedule without duplicating slots on `08 Nov`.
- **Case-Insensitive Sheet Discovery & Invalid File Handling:** Uploading an `.xlsx` file where `internis dkk` has leading/trailing spaces or different casing must still resolve, and uploading a file without a valid schedule sheet must show a friendly `UsagiBerry UI` error message instead of crashing.

---

### Task 1: Project Scaffolding, Types & Deterministic Excel Parser Engine (`internis dkk`)

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/index.css`
- Create: `src/types/schedule.ts`
- Create: `src/utils/excelParser.ts`
- Test: `src/utils/__tests__/excelParser.test.ts`

**Interfaces:**
- Produces in `src/types/schedule.ts`:
  ```ts
  export type TimePrioritySource = 'PRIO_1_DATE_CELL' | 'PRIO_2_DAY_COL' | 'PRIO_3_SHIFT_INDUK';
  export type ShiftPeriod = 'PAGI' | 'SORE';
  export type DailyStatus = 'REGULER_PAGI' | 'REGULER_SORE' | 'LEMBUR_2_SLOT' | 'CUTI_LP' | 'LIBUR_OFF';

  export interface SlotAssignment {
    slotId: string;
    blockRows: [number, number];
    shiftIndukRaw: string;
    effectiveTime: string;          // e.g. "08.00"
    effectiveTimeMinutes: number;   // e.g. 480 for sorting
    prioritySource: TimePrioritySource;
    priorityRawNote: string;        // e.g. "jam 8" or "msk j.9" or "Jam 7"
    period: ShiftPeriod;            // PAGI (< 11:00) | SORE (>= 11:00)
    nurseName: string;              // Canonical nurse name e.g. "Afiz"
    dateNote?: string;              // Pre-task note in date cell e.g. "MCU", "dr.Neni dl", "TLJ dl"
    doctors: string[];              // Highlighted doctors in this slot
    tasks: string[];                // Companion clinic tasks in this slot
    isAllAssistants?: boolean;
    swappedFrom?: string;           // Populated when swap simulation is active
  }

  export interface LeaveEntry {
    nurseName: string;
    rawText: string;                // e.g. "Afiz cuti", "Endang LP"
    type: 'CUTI' | 'LP' | 'LAINNYA';
  }

  export interface DaySchedule {
    dateISO: string;                // "2026-11-11"
    dayOfWeek: number;              // 0=Sun, 1=Mon ... 6=Sat
    dayNameID: string;              // "Rabu"
    isSunday: boolean;
    assignments: SlotAssignment[];
    sharedTasks: string[];          // From "semua asisten" row
    leaves: LeaveEntry[];
  }

  export interface MonthlyPICItem {
    category: string;               // e.g. "Laporan Bulanan", "Stock Opname", "Inventaris/K3", "Ceklist Suhu"
    internisPic: string;
    dahliaPic?: string;
  }

  export interface ParsedScheduleBook {
    sourceFiles: string[];
    monthLabel: string;
    dates: Record<string, DaySchedule>; // Keyed by dateISO "YYYY-MM-DD"
    allNurses: string[];
    allDoctors: string[];
    monthlyPICs: MonthlyPICItem[];
    casePresentationNote: string;
    handoverNote: string;
    headOfUnit: string;
  }
  ```
- Produces in `src/utils/excelParser.ts`:
  - `parseInternisExcelBuffer(buffer: ArrayBuffer, fileName: string): Promise<ParsedScheduleBook>`
  - `mergeScheduleBooks(books: ParsedScheduleBook[]): ParsedScheduleBook`
  - `getNurseDayView(book: ParsedScheduleBook, dateISO: string, nurseName: string, swaps?: SwapOverride[]): NurseDaySummary`

- [ ] **Step 1: Scaffold Vite + React + TypeScript + Tailwind + Vitest project and write failing parser tests in `src/utils/__tests__/excelParser.test.ts`**

Write tests loading `NOVEMBER MG 1 2026.xlsx` and `NOVEMBER 2026.xlsx` from disk and asserting:
1. Merging both files yields full November dates (`2026-11-01` to `2026-11-30`).
2. `2026-11-02`: Afiz has 1 slot, effectiveTime `"12.00"`, `PRIO_2_DAY_COL`, doctors include `dr.Tan Hengky C+D`, `dr.Rheza Sp.OT`, `dr.Marsella`.
3. `2026-11-11`: Afiz has 1 slot, effectiveTime `"09.00"`, `PRIO_2_DAY_COL` (`msk j.9`), doctor `dr.Dadang Sp.OT 9-17`, tasks include `TTV EMR internis BEDAH` and `piket stock bedah`.
4. Overtime dates (`2026-11-13`, `2026-11-19`, `2026-11-23`, `2026-11-25`, `2026-11-30`): Afiz status is `'LEMBUR_2_SLOT'` with 2 sorted slots.
5. `2026-11-25`: Afiz Slot 1 has effectiveTime `"08.00"` with `PRIO_1_DATE_CELL` (from `Y8 = "jam 8"`) and doctor `dr. Indra(C+D)`, Slot 2 has effectiveTime `"13.00"` with `PRIO_2_DAY_COL` and doctor `Prof.Zainal`.
6. `2026-11-28`: Afiz status is `'CUTI_LP'` (`Afiz cuti`).
7. Name normalization maps `Adelin a` -> `Adelina`, `Siti ANifah` -> `Siti Anifah`, and parses typo `masuk ajm 13` -> `"13.00"`.

- [ ] **Step 2: Run Vitest to verify tests fail**

Run: `npx vitest run src/utils/__tests__/excelParser.test.ts`
Expected: FAIL (`excelParser` not implemented).

- [ ] **Step 3: Implement `src/types/schedule.ts` and `src/utils/excelParser.ts`**

Use `jszip` to inspect `xl/workbook.xml`, `xl/sharedStrings.xml`, `xl/styles.xml`, and the `internis dkk` worksheet XML directly from the `ArrayBuffer` (with fallback to `xlsx` cell reading), segmenting rows `4..100` by Column B/A borders, applying the 3-tier time priority regexes, extracting doctors (`dr.`, `Prof.`, `drg.`, `drr.`) vs tasks, parsing rows `101..121` for leaves/LP and PIC Bulanan, and merging multiple uploaded files by `dateISO`.

- [ ] **Step 4: Run Vitest to verify all parser tests pass**

Run: `npx vitest run src/utils/__tests__/excelParser.test.ts`
Expected: PASS (100% match with PRD Section 2.2).

---

### Task 2: `UsagiBerry UI` Design System, Kawaii SVG Mascot Components & State Storage

**Files:**
- Modify: `src/index.css`
- Create: `src/components/kawaii/UsagiMascots.tsx`
- Create: `src/hooks/useScheduleStore.ts`

**Interfaces:**
- Produces in `src/components/kawaii/UsagiMascots.tsx`:
  - `BunnyNurseAvatar({ mood, size, isCrown, className }: { mood: 'happy' | 'sunny' | 'moon' | 'lembur' | 'sleepy'; size?: number; isCrown?: boolean; className?: string })`
  - `SunnyCloudBadge({ time }: { time?: string })`
  - `DreamyMoonBadge({ time }: { time?: string })`
  - `StrawberryMilkBottle({ double?: boolean, className?: string })`
  - `RibbonBanner({ children, variant }: { children: React.ReactNode; variant?: 'pink' | 'lembur' | 'sun' | 'moon' | 'matcha' })`
- Produces in `src/hooks/useScheduleStore.ts`:
  - `useScheduleStore()` returning `{ book, selectedDate, setSelectedDate, selectedNurse, setSelectedNurse, activeTab, setActiveTab, swaps, addSwap, removeSwap, clearSwaps, uploadFiles, clearSchedule, isLoading, error }` persisted in `localStorage` under keys `Sheyla_book_v1` and `Sheyla_swaps_v1`.

- [ ] **Step 1: Implement `UsagiBerry UI` CSS variables, Google Fonts (`Quicksand` & `Plus Jakarta Sans`), polka-dot strawberry sky background, and cloud scalloped borders in `src/index.css`**

- [ ] **Step 2: Implement `src/components/kawaii/UsagiMascots.tsx` and `src/hooks/useScheduleStore.ts`**

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: Exit code 0 with no type errors.

---

### Task 3: Upload Welcome Screen, Header & Tab 1 (`🐰🍓 Hari Ini Afiz` — Hero Doctor Spotlight, Overtime Dual-Slot & Calendar)

**Files:**
- Create: `src/components/UploadWelcomeScreen.tsx`
- Create: `src/components/HeaderBar.tsx`
- Create: `src/components/tabs/TabHariIniAfiz.tsx`

**Interfaces:**
- Consumes `useScheduleStore` and `UsagiMascots`.
- `TabHariIniAfiz` renders:
  1. **Horizontal Cloud Date Strip** with quick filters (`Hari Ini`, `Besok`, `🍓✨ Filter Hari Lembur (2 Slot)`), showing status icons (`☀️`, `🌙`, `🍓✨`, `🍵`) on every date pill.
  2. **Hero Doctor Spotlight Card** with ribbon topper, effective entry time badge + priority source explanation pill (`Prioritas 1: Catatan Sel Tanggal`, `Prioritas 2: Kolom Hari`, `Prioritas 3: Shift Induk`), large doctor cards with location badges (`C+D`, `9-17`, etc.), **Double Berry Milk Overtime Banner & Side-by-Side Slot 1 Pagi + Slot 2 Sore** when `LEMBUR_2_SLOT`, or **Matcha Cloud Sleeping Bunny** when `CUTI_LP` / `LIBUR_OFF`.
  3. **Secondary Section Below Fold:** Operational clinic tasks checklist (`TTV EMR`, `5R1P`, `piket stock/BHP`) + automatic Tuesday/Wednesday `12.00` Case Presentation reminder banner, full-month visual calendar for the selected nurse, WhatsApp daily summary copy button, and **🐰 Deretan Perawat Kelinci Lainnya** chip selector.

- [ ] **Step 1: Implement `UploadWelcomeScreen.tsx`, `HeaderBar.tsx`, and `TabHariIniAfiz.tsx`**

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: Exit code 0.

---

### Task 4: Secondary Tabs (`🩺☁️ Cek Dokter Lain`, `🌙🍵 Cek Cuti & Simulasi Tukar`, `🥛📂 Upload Excel & PIC Bulanan`) & App Shell

**Files:**
- Create: `src/components/tabs/TabCekDokter.tsx`
- Create: `src/components/tabs/TabCutiTukar.tsx`
- Create: `src/components/tabs/TabUploadPic.tsx`
- Create: `src/App.tsx`
- Create: `src/__tests__/appFlow.test.tsx`

**Interfaces:**
- `TabCekDokter`: Instant search bar across all doctors practicing on `selectedDate`, grouping each doctor with their assigned `🐰 Bunny Nurse`, effective arrival time, location badge, and companion tasks.
- `TabCutiTukar`: Displays nurses on `CUTI` / `LP` / `Off` on `selectedDate`, plus an interactive **Simulasi Tukar Slot** form (pick slot of `selectedNurse` and swap with another nurse on `selectedDate`, preview updated status, and copy WhatsApp swap request text).
- `TabUploadPic`: Drag-and-drop multi-file `.xlsx` uploader (merge or replace), CSV/Excel schedule export for Afiz, **PIC Bulanan Internis & Dahlia** cards, and Tuesday/Wednesday case presentation reminder card.

- [ ] **Step 1: Write an integration test in `src/__tests__/appFlow.test.tsx` verifying that uploading `NOVEMBER 2026.xlsx` populates `useScheduleStore` and accurately computes doctor directory, leave list, and swap simulation**

- [ ] **Step 2: Implement `TabCekDokter.tsx`, `TabCutiTukar.tsx`, `TabUploadPic.tsx`, and `App.tsx` with floating cloud bottom navigation bar**

- [ ] **Step 3: Run full test suite and production build**

Run: `npx vitest run && npm run build`
Expected: All tests PASS and Vite production bundle builds cleanly in `dist/`.

