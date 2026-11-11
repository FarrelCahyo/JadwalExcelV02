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

export interface SwapOverride {
  id: string;
  dateISO: string;
  slotId: string;
  fromNurse: string;
  toNurse: string;
  targetSlotId?: string;          // Optional reciprocal slot of toNurse
  note?: string;
  createdAt: string;
}

export interface NurseDaySummary {
  dateISO: string;
  dayNameID: string;
  isSunday: boolean;
  nurseName: string;
  status: DailyStatus;
  slots: SlotAssignment[];
  leaveEntry?: LeaveEntry;
  sharedTasks: string[];
  isCasePresentationDay: boolean;
}

