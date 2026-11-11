import JSZip from 'jszip';
import {
  DailyStatus,
  DaySchedule,
  LeaveEntry,
  MonthlyPICItem,
  NurseDaySummary,
  ParsedScheduleBook,
  ShiftPeriod,
  SlotAssignment,
  SwapOverride,
  TimePrioritySource,
} from '../types/schedule';

const DAY_NAMES_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAY_COL_MAP: Record<number, string> = {
  1: 'B', // Senin
  2: 'C', // Selasa
  3: 'D', // Rabu
  4: 'E', // Kamis
  5: 'F', // Jumat
  6: 'G', // Sabtu
};

const CANONICAL_NURSES: Record<string, string> = {
  'afiz': 'Afiz',
  'lulut': 'Lulut',
  'nabila': 'Nabila',
  'firda': 'Firda',
  'endang': 'Endang',
  'dewi s': 'Dewi S',
  'dewi l': 'Dewi L',
  'suci p': 'Suci P',
  'suci n': 'Suci N',
  'ovylia': 'Ovylia',
  'adung': 'Adung',
  'adelina': 'Adelina',
  'adelin a': 'Adelina',
  'adel': 'Adelina',
  'novisa': 'Novisa',
  'novica': 'Novisa',
  'mirada': 'Mirada',
  'naela': 'Naela',
  'nurul u': 'Nurul U',
  'dwi ulfa': 'Dwi Ulfa',
  'latifah': 'Latifah',
  'rina a': 'Rina A',
  'dian sl': 'Dian SL',
  'dian a': 'Dian A',
  'mega': 'Mega',
  'lita': 'Lita',
  'siti anifah': 'Siti Anifah',
  'kristi': 'Kristi',
  'indri': 'Indri',
  'desi': 'Desi',
  'armelia': 'Armelia',
  'endhah': 'Endhah',
  'ina': 'Ina',
  'rizki p': 'Rizki P',
  'arista': 'Arista',
  'wahyuni': 'Wahyuni',
  'zumrotus': 'Zumrotus',
  'supaati': 'Supaati',
  'nike': 'Nike',
  'indita': 'Indita',
  'dika': 'Dika',
  'jihan n': 'Jihan N',
  'maya': 'Maya',
  'risma': 'Risma',
  'rika': 'Rika',
  'russana': 'Russana',
  'yetty': 'Yetty',
  'melly': 'Melly',
  'winda': 'Winda',
  'ria': 'Ria',
  'maria': 'Maria',
};

export function normalizeNurseName(raw: string): string {
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  const lower = cleaned.toLowerCase();
  if (CANONICAL_NURSES[lower]) {
    return CANONICAL_NURSES[lower];
  }
  // Title case fallback
  return cleaned
    .split(' ')
    .map((w) => (w.length <= 2 && w === w.toUpperCase() ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ');
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function formatHourString(rawNum: string): { formatted: string; minutes: number } {
  const normalized = rawNum.replace(':', '.').trim();
  const parts = normalized.split('.');
  const h = parseInt(parts[0], 10);
  const m = parts[1] ? parseInt(parts[1].padEnd(2, '0').slice(0, 2), 10) : 0;
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return {
    formatted: `${hh}.${mm}`,
    minutes: h * 60 + m,
  };
}

function parseShiftIndukTime(rawInduk: string): { formatted: string; minutes: number; displayNote: string } {
  const clean = rawInduk.trim();
  if (!clean) {
    return { formatted: '07.00', minutes: 420, displayNote: 'Jam 7' };
  }
  if (clean === '07.14') {
    return { formatted: '07.00', minutes: 420, displayNote: '07.00–14.00 (07.14)' };
  }
  if (clean === '14.21') {
    return { formatted: '14.00', minutes: 840, displayNote: '14.00–21.00 (14.21)' };
  }
  const match = clean.match(/(\d{1,2}(?:[.:]\d{2})?)/);
  if (match) {
    const parsed = formatHourString(match[1]);
    return { ...parsed, displayNote: clean };
  }
  return { formatted: '07.00', minutes: 420, displayNote: clean };
}

function extractTimeNote(text: string): { time: string; minutes: number; rawMatch: string; remaining: string } | null {
  // Matches patterns like: "masuk jam 12", "msk j.8", "masuk ajm 13", "masuk 10", "jam 8", "j.7", "jam7"
  const regex = /\b(?:(?:masuk|msk)\s*(?:jam|ajm|j\.?)?\s*(\d{1,2}(?:[.:]\d{2})?)|(?:jam|ajm|j\.?)\s*(\d{1,2}(?:[.:]\d{2})?))\b/i;
  const m = text.match(regex);
  if (!m) return null;
  const numStr = m[1] || m[2];
  const numVal = parseFloat(numStr.replace(':', '.'));
  if (isNaN(numVal) || numVal < 5 || numVal > 23) return null;

  const { formatted, minutes } = formatHourString(numStr);
  const remaining = text.replace(m[0], '').replace(/^[\s,/+-]+|[\s,/+-]+$/g, '').trim();
  return {
    time: formatted,
    minutes,
    rawMatch: m[0].trim(),
    remaining,
  };
}

function parseDayColumnBlock(cells: string[]): {
  doctors: string[];
  tasks: string[];
  prio2Time?: { time: string; minutes: number; rawNote: string };
} {
  const doctors: string[] = [];
  const tasks: string[] = [];
  let prio2Time: { time: string; minutes: number; rawNote: string } | undefined;

  for (const rawCell of cells) {
    // Normalize doctor typo like "dr,Tan Hengky" or "drr.Niken"
    const normalizedCell = rawCell
      .replace(/\bdrr\./gi, 'dr.')
      .replace(/\bdr,/gi, 'dr. ');

    // Split by 2+ spaces or newlines
    const chunks = normalizedCell
      .split(/\s{2,}|\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    for (let chunk of chunks) {
      const timeHit = extractTimeNote(chunk);
      if (timeHit) {
        if (!prio2Time) {
          prio2Time = {
            time: timeHit.time,
            minutes: timeHit.minutes,
            rawNote: timeHit.rawMatch,
          };
        }
        chunk = timeHit.remaining;
        if (!chunk) continue;
      }

      // Check if chunk contains doctor name(s)
      if (/(?:^|\s)(?:drg?\.?|prof\.?)\s*[a-zA-Z]/i.test(chunk)) {
        // Handle cases like "dr.Marsella, gizi" or "dr.Ardian C+D / 5R1P"
        if (chunk.includes('/ 5R1P')) {
          const [docPart, taskPart] = chunk.split('/').map((s) => s.trim());
          doctors.push(docPart);
          if (taskPart) tasks.push(taskPart);
        } else if (/,\s*(?:gizi|TTV)/i.test(chunk)) {
          const idx = chunk.lastIndexOf(',');
          const docPart = chunk.slice(0, idx).trim();
          const taskPart = chunk.slice(idx + 1).trim();
          doctors.push(docPart);
          if (taskPart) tasks.push(taskPart);
        } else {
          doctors.push(chunk.replace(/\s+/g, ' ').trim());
        }
      } else {
        tasks.push(chunk.replace(/\s+/g, ' ').trim());
      }
    }
  }

  return {
    doctors: Array.from(new Set(doctors)),
    tasks: Array.from(new Set(tasks)),
    prio2Time,
  };
}

function parseDateColumnBlock(cells: string[]): {
  nurses: Array<{
    nurseName: string;
    inlineTime?: { time: string; minutes: number; rawNote: string };
    inlineNote?: string;
    isAllAssistants?: boolean;
  }>;
  blockTimeNote?: { time: string; minutes: number; rawNote: string };
  dateNotes: string[];
  extraDoctors: string[];
} {
  const nurses: Array<{
    nurseName: string;
    inlineTime?: { time: string; minutes: number; rawNote: string };
    inlineNote?: string;
    isAllAssistants?: boolean;
  }> = [];
  let blockTimeNote: { time: string; minutes: number; rawNote: string } | undefined;
  const dateNotes: string[] = [];
  const extraDoctors: string[] = [];

  for (const rawCell of cells) {
    const trimmed = rawCell.replace(/\s+/g, ' ').trim();
    if (!trimmed) continue;

    // 1. Check "semua asisten"
    if (/semua\s+asisten/i.test(trimmed)) {
      nurses.push({
        nurseName: 'Semua Asisten',
        isAllAssistants: true,
      });
      continue;
    }

    // 2. Check if cell is purely a time note (e.g., "jam 8", "j.7", "msk jam 8", "masuk j.9")
    const timeHit = extractTimeNote(trimmed);
    if (timeHit && !timeHit.remaining) {
      blockTimeNote = {
        time: timeHit.time,
        minutes: timeHit.minutes,
        rawNote: timeHit.rawMatch,
      };
      continue;
    }

    // 3. Check if cell is a pre-task note like "MCU", "TLJ dl", "dr.Neni dl", "Latihan"
    if (
      /^(?:MCU|TLJ\s*dl|Latihan|On\s*call)$/i.test(trimmed) ||
      /\bdl$/i.test(trimmed)
    ) {
      dateNotes.push(trimmed);
      continue;
    }

    // 4. Check if cell is an extra doctor note in the date column (e.g., "dr.Budi", "dr.Alifiati")
    if (/^(?:drg?\.?|prof\.?)\s*[a-zA-Z]/i.test(trimmed)) {
      extraDoctors.push(trimmed);
      continue;
    }

    // 5. Otherwise, it's a nurse cell (possibly with inline time like "Rina A jam 8" or note "Latifah latihan lomba")
    let working = trimmed;
    let inlineTime: { time: string; minutes: number; rawNote: string } | undefined;
    let inlineNote: string | undefined;

    if (timeHit && timeHit.remaining) {
      inlineTime = {
        time: timeHit.time,
        minutes: timeHit.minutes,
        rawNote: timeHit.rawMatch,
      };
      working = timeHit.remaining;
    }

    if (/latihan\s+lomba/i.test(working)) {
      inlineNote = 'latihan lomba';
      working = working.replace(/latihan\s+lomba/i, '').trim();
    }

    if (working) {
      nurses.push({
        nurseName: normalizeNurseName(working),
        inlineTime,
        inlineNote,
      });
    }
  }

  return { nurses, blockTimeNote, dateNotes, extraDoctors };
}

function excelSerialToISO(serialStr: string): { dateISO: string; dayOfWeek: number; dayNameID: string } | null {
  const clean = serialStr.trim();

  // 1. Numeric Excel date serial (e.g. 46334)
  if (/^\d{5}$/.test(clean)) {
    const num = parseInt(clean, 10);
    if (num >= 40000 && num <= 60000) {
      const utcMs = Date.UTC(1899, 11, 30) + num * 86400 * 1000;
      const dt = new Date(utcMs);
      const yyyy = dt.getUTCFullYear();
      const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(dt.getUTCDate()).padStart(2, '0');
      const dayOfWeek = dt.getUTCDay();
      return {
        dateISO: `${yyyy}-${mm}-${dd}`,
        dayOfWeek,
        dayNameID: DAY_NAMES_ID[dayOfWeek],
      };
    }
  }

  // 2. ISO date string "YYYY-MM-DD" or "DD/MM/YYYY" / "DD-MM-YYYY"
  const isoMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const yyyy = parseInt(isoMatch[1], 10);
    const mm = parseInt(isoMatch[2], 10);
    const dd = parseInt(isoMatch[3], 10);
    const dt = new Date(Date.UTC(yyyy, mm - 1, dd));
    const dayOfWeek = dt.getUTCDay();
    return {
      dateISO: `${String(yyyy)}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`,
      dayOfWeek,
      dayNameID: DAY_NAMES_ID[dayOfWeek],
    };
  }

  const dmyMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const dd = parseInt(dmyMatch[1], 10);
    const mm = parseInt(dmyMatch[2], 10);
    const yyyy = parseInt(dmyMatch[3], 10);
    const dt = new Date(Date.UTC(yyyy, mm - 1, dd));
    const dayOfWeek = dt.getUTCDay();
    return {
      dateISO: `${String(yyyy)}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`,
      dayOfWeek,
      dayNameID: DAY_NAMES_ID[dayOfWeek],
    };
  }

  return null;
}

export async function parseInternisExcelBuffer(
  buffer: ArrayBuffer,
  fileName: string
): Promise<ParsedScheduleBook> {
  const zip = await JSZip.loadAsync(buffer);

  const wbXmlFile = zip.file('xl/workbook.xml');
  if (!wbXmlFile) {
    throw new Error(`File "${fileName}" bukan file Excel (.xlsx) yang valid.`);
  }
  const wbXml = await wbXmlFile.async('string');

  // Map sheet names & r:id
  const sheetEntries: Array<{ name: string; rId: string; index: number }> = [];
  const sheetRegex = /<sheet\b([^>]*)\/?>/g;
  let match: RegExpExecArray | null;
  let idxCounter = 1;
  while ((match = sheetRegex.exec(wbXml)) !== null) {
    const attrs = match[1];
    const nameMatch = attrs.match(/\bname="([^"]+)"/);
    const rIdMatch = attrs.match(/\br:id="([^"]+)"/);
    if (nameMatch) {
      sheetEntries.push({
        name: decodeXmlEntities(nameMatch[1]),
        rId: rIdMatch ? rIdMatch[1] : `rId${idxCounter}`,
        index: idxCounter,
      });
      idxCounter++;
    }
  }

  // Find target sheet ("internis dkk" or similar)
  const targetSheet =
    sheetEntries.find((s) => s.name.toLowerCase().includes('internis')) ||
    sheetEntries[0];

  if (!targetSheet) {
    throw new Error(`Tidak ditemukan sheet jadwal di dalam file "${fileName}".`);
  }

  // Resolve worksheet XML path via _rels/workbook.xml.rels if available
  let sheetPath = `xl/worksheets/sheet${targetSheet.index}.xml`;
  const relsFile = zip.file('xl/_rels/workbook.xml.rels');
  if (relsFile) {
    const relsXml = await relsFile.async('string');
    const relRegex = /<Relationship\b([^>]*)\/?>/g;
    while ((match = relRegex.exec(relsXml)) !== null) {
      const attrs = match[1];
      const idM = attrs.match(/\bId="([^"]+)"/);
      const targetM = attrs.match(/\bTarget="([^"]+)"/);
      if (idM && targetM && idM[1] === targetSheet.rId) {
        const t = targetM[1].replace(/^\//, '');
        sheetPath = t.startsWith('xl/') ? t : `xl/${t}`;
      }
    }
  }

  // Load sharedStrings.xml
  const sharedStrings: string[] = [];
  const ssFile = zip.file('xl/sharedStrings.xml');
  if (ssFile) {
    const ssXml = await ssFile.async('string');
    const siRegex = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
    while ((match = siRegex.exec(ssXml)) !== null) {
      const siContent = match[1];
      const tRegex = /<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/g;
      let tMatch: RegExpExecArray | null;
      let combined = '';
      while ((tMatch = tRegex.exec(siContent)) !== null) {
        combined += decodeXmlEntities(tMatch[1]);
      }
      sharedStrings.push(combined);
    }
  }

  // Load styles.xml for cell borders
  const borders: Array<[string | null, string | null]> = [];
  const xfsBorderMap: Array<[string | null, string | null]> = [];
  const stylesFile = zip.file('xl/styles.xml');
  if (stylesFile) {
    const stylesXml = await stylesFile.async('string');
    const bordersBlockMatch = stylesXml.match(/<borders\b[^>]*>([\s\S]*?)<\/borders>/);
    if (bordersBlockMatch) {
      const borderRegex = /<border\b[^>]*>([\s\S]*?)<\/border>|<border\b[^>]*\/>/g;
      while ((match = borderRegex.exec(bordersBlockMatch[1])) !== null) {
        const inner = match[1] || '';
        const topM = inner.match(/<top\b[^>]*\bstyle="([^"]+)"/);
        const botM = inner.match(/<bottom\b[^>]*\bstyle="([^"]+)"/);
        borders.push([topM ? topM[1] : null, botM ? botM[1] : null]);
      }
    }
    const cellXfsMatch = stylesXml.match(/<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/);
    if (cellXfsMatch) {
      const xfRegex = /<xf\b([^/>]*)(?:\/>|>[\s\S]*?<\/xf>)/g;
      while ((match = xfRegex.exec(cellXfsMatch[1])) !== null) {
        const attrs = match[1];
        const bIdM = attrs.match(/\bborderId="(\d+)"/);
        const bId = bIdM ? parseInt(bIdM[1], 10) : 0;
        xfsBorderMap.push(borders[bId] || [null, null]);
      }
    }
  }

  // Load worksheet XML
  const wsFile = zip.file(sheetPath);
  if (!wsFile) {
    throw new Error(`Worksheet "${sheetPath}" tidak ditemukan di dalam file "${fileName}".`);
  }
  const wsXml = await wsFile.async('string');

  const grid: Record<string, string> = {};
  const bdrGrid: Record<string, [string | null, string | null]> = {};
  const rowCols: Record<number, string[]> = {};

  const cellRegex = /<c\b([^/>]*)(?:\/>|>([\s\S]*?)<\/c>)/g;
  while ((match = cellRegex.exec(wsXml)) !== null) {
    const attrs = match[1];
    const inner = match[2] || '';
    const refM = attrs.match(/\br="([A-Z]+)(\d+)"/);
    if (!refM) continue;
    const col = refM[1];
    const row = parseInt(refM[2], 10);
    const key = `${row}:${col}`;

    const sM = attrs.match(/\bs="(\d+)"/);
    const sIdx = sM ? parseInt(sM[1], 10) : 0;
    bdrGrid[key] = xfsBorderMap[sIdx] || [null, null];

    const tM = attrs.match(/\bt="([^"]+)"/);
    const cellType = tM ? tM[1] : '';

    let val = '';
    if (cellType === 'inlineStr') {
      const tInM = inner.match(/<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/);
      if (tInM) val = decodeXmlEntities(tInM[1]);
    } else {
      const vM = inner.match(/<v>([\s\S]*?)<\/v>/);
      if (vM) {
        const rawV = vM[1];
        if (cellType === 's') {
          const ssIdx = parseInt(rawV, 10);
          val = sharedStrings[ssIdx] ?? '';
        } else {
          val = decodeXmlEntities(rawV);
        }
      }
    }

    const trimmed = val.trim();
    if (trimmed) {
      grid[key] = trimmed;
      if (!rowCols[row]) rowCols[row] = [];
      rowCols[row].push(col);
    }
  }

  const monthLabel = grid['2:A'] || grid['1:A'] || fileName.replace(/\.xlsx?$/i, '');

  // Segment rows 4..100 into slot blocks using Column B & Column A borders
  const blocks: Array<[number, number]> = [];
  let currStart = 4;
  for (let r = 4; r <= 100; r++) {
    const [topB, botB] = bdrGrid[`${r}:B`] || [null, null];
    const [topA] = bdrGrid[`${r}:A`] || [null, null];
    if (r > currStart && (topB || topA)) {
      blocks.push([currStart, r - 1]);
      currStart = r;
    }
    if (botB) {
      blocks.push([currStart, r]);
      currStart = r + 1;
    }
  }
  if (currStart <= 100) {
    blocks.push([currStart, 100]);
  }

  // Fallback for borderless Excel files: if only 1 giant block was formed, split by rows that have Column A shift headers or individual row assignments
  if (blocks.length <= 1) {
    blocks.length = 0;
    for (let r = 4; r <= 100; r++) {
      blocks.push([r, r]);
    }
  }

  // Map Shift Induk (Column A) across rows 4..100
  const shiftIndukByRow: Record<number, string> = {};
  let currentInduk = 'Jam 7';
  for (let r = 4; r <= 100; r++) {
    if (grid[`${r}:A`]) {
      currentInduk = grid[`${r}:A`];
    }
    shiftIndukByRow[r] = currentInduk;
  }

  // Discover Date Columns in Row 3 (Columns H..AZ)
  const dateColumns: Array<{
    col: string;
    dateISO: string;
    dayOfWeek: number;
    dayNameID: string;
  }> = [];

  for (const col of rowCols[3] || []) {
    if (['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(col)) continue;
    const rawDate = grid[`3:${col}`];
    if (!rawDate) continue;
    const parsedDate = excelSerialToISO(rawDate);
    if (parsedDate) {
      dateColumns.push({ col, ...parsedDate });
    }
  }

  if (dateColumns.length === 0) {
    throw new Error(
      `File "${fileName}" tidak memiliki kolom tanggal jadwal yang valid pada baris 3 (pastikan file memiliki sheet "internis dkk" resmi).`
    );
  }

  const dates: Record<string, DaySchedule> = {};
  const nurseSet = new Set<string>(['Afiz']);
  const doctorSet = new Set<string>();

  for (const dColInfo of dateColumns) {
    const { col, dateISO, dayOfWeek, dayNameID } = dColInfo;
    const isSunday = dayOfWeek === 0;
    const dayTemplateCol = DAY_COL_MAP[dayOfWeek];

    const assignments: SlotAssignment[] = [];
    const sharedTasks: string[] = [];

    if (!isSunday && dayTemplateCol) {
      blocks.forEach(([bStart, bEnd], blockIdx) => {
        const dateCells: string[] = [];
        const dayCells: string[] = [];
        for (let r = bStart; r <= bEnd; r++) {
          if (grid[`${r}:${col}`]) dateCells.push(grid[`${r}:${col}`]);
          if (grid[`${r}:${dayTemplateCol}`]) dayCells.push(grid[`${r}:${dayTemplateCol}`]);
        }

        if (dateCells.length === 0) return;

        const dateParsed = parseDateColumnBlock(dateCells);
        if (dateParsed.nurses.length === 0) return;

        const dayParsed = parseDayColumnBlock(dayCells);
        const shiftIndukRaw = shiftIndukByRow[bStart] || 'Jam 7';
        const prio3 = parseShiftIndukTime(shiftIndukRaw);

        const combinedDoctors = [...dayParsed.doctors, ...dateParsed.extraDoctors];
        combinedDoctors.forEach((d) => doctorSet.add(d));

        for (const nEntry of dateParsed.nurses) {
          if (nEntry.isAllAssistants) {
            sharedTasks.push(...dayParsed.tasks, ...combinedDoctors);
            continue;
          }

          nurseSet.add(nEntry.nurseName);

          // 3-Tier Effective Time Priority Resolution
          let effectiveTime = prio3.formatted;
          let effectiveTimeMinutes = prio3.minutes;
          let prioritySource: TimePrioritySource = 'PRIO_3_SHIFT_INDUK';
          let priorityRawNote = prio3.displayNote;

          if (nEntry.inlineTime) {
            effectiveTime = nEntry.inlineTime.time;
            effectiveTimeMinutes = nEntry.inlineTime.minutes;
            prioritySource = 'PRIO_1_DATE_CELL';
            priorityRawNote = nEntry.inlineTime.rawNote;
          } else if (dateParsed.blockTimeNote) {
            effectiveTime = dateParsed.blockTimeNote.time;
            effectiveTimeMinutes = dateParsed.blockTimeNote.minutes;
            prioritySource = 'PRIO_1_DATE_CELL';
            priorityRawNote = dateParsed.blockTimeNote.rawNote;
          } else if (dayParsed.prio2Time) {
            effectiveTime = dayParsed.prio2Time.time;
            effectiveTimeMinutes = dayParsed.prio2Time.minutes;
            prioritySource = 'PRIO_2_DAY_COL';
            priorityRawNote = dayParsed.prio2Time.rawNote;
          }

          const period: ShiftPeriod = effectiveTimeMinutes < 11 * 60 ? 'PAGI' : 'SORE';
          const dateNoteParts = [...dateParsed.dateNotes];
          if (nEntry.inlineNote) dateNoteParts.push(nEntry.inlineNote);

          assignments.push({
            slotId: `${dateISO}_B${blockIdx + 1}_${bStart}-${bEnd}_${nEntry.nurseName}`,
            blockRows: [bStart, bEnd],
            shiftIndukRaw,
            effectiveTime,
            effectiveTimeMinutes,
            prioritySource,
            priorityRawNote,
            period,
            nurseName: nEntry.nurseName,
            dateNote: dateNoteParts.length > 0 ? dateNoteParts.join(', ') : undefined,
            doctors: combinedDoctors,
            tasks: dayParsed.tasks,
          });
        }
      });
    }

    // Extract Leave / Cuti / LP entries from Rows 101..105
    const leaves: LeaveEntry[] = [];
    for (let r = 101; r <= 105; r++) {
      const cellText = grid[`${r}:${col}`];
      if (!cellText) continue;
      // Ignore general notes like "NB: @ASISTEN..." or "Semarang, ..."
      if (/^(?:NB:|Semarang|PENCEGAHAN|plus\s+cluster|Lembur|PELATIHAN)/i.test(cellText)) continue;

      const m = cellText.match(/^(.+?)\s+(cuti(?:\s+\w+)?|lp)\b/i);
      if (m) {
        const nName = normalizeNurseName(m[1]);
        const kind = m[2].toUpperCase().startsWith('CUTI') ? 'CUTI' : 'LP';
        nurseSet.add(nName);
        leaves.push({
          nurseName: nName,
          rawText: cellText,
          type: kind,
        });
      }
    }

    dates[dateISO] = {
      dateISO,
      dayOfWeek,
      dayNameID,
      isSunday,
      assignments,
      sharedTasks: Array.from(new Set(sharedTasks)),
      leaves,
    };
  }

  // Extract Monthly PICs & Footer Notes (Rows 102..122)
  const monthlyPICs: MonthlyPICItem[] = [];
  for (let r = 108; r <= 122; r++) {
    const bVal = grid[`${r}:B`] || '';
    const dVal = grid[`${r}:D`] || '';
    if (bVal.includes(':')) {
      const [catRaw, picRaw] = bVal.split(':').map((s) => s.trim());
      let dahliaPic: string | undefined;
      if (dVal.includes(':')) {
        dahliaPic = dVal.split(':')[1]?.trim();
      }
      if (catRaw && picRaw) {
        monthlyPICs.push({
          category: catRaw,
          internisPic: picRaw,
          dahliaPic,
        });
      }
    }
  }

  const casePresentationNote =
    grid['108:B'] && grid['108:C']
      ? `${grid['108:B']}: ${grid['108:C']}`
      : 'Selasa dan Rabu: Presentasi kasus siap jam 12.00 WIB';

  const handoverNote =
    grid['102:B'] ||
    'Setiap asisten bertanggung jawab dalam handover alkes dan obat-obatan di cluster pada setiap shiftnya.';

  const headOfUnit =
    grid['109:F'] && grid['110:F']
      ? `${grid['109:F']} (${grid['110:F']})`
      : 'Ns. M. Remy Sevrina, S.Kep (Kepala Unit General & Clinic Spesialis)';

  // Ensure Afiz is always first in allNurses
  const sortedNurses = Array.from(nurseSet).sort((a, b) => {
    if (a === 'Afiz') return -1;
    if (b === 'Afiz') return 1;
    return a.localeCompare(b, 'id');
  });

  return {
    sourceFiles: [fileName],
    monthLabel,
    dates,
    allNurses: sortedNurses,
    allDoctors: Array.from(doctorSet).sort((a, b) => a.localeCompare(b, 'id')),
    monthlyPICs,
    casePresentationNote,
    handoverNote,
    headOfUnit,
  };
}

export function mergeScheduleBooks(books: ParsedScheduleBook[]): ParsedScheduleBook {
  if (books.length === 0) {
    throw new Error('Tidak ada data jadwal untuk digabungkan.');
  }
  if (books.length === 1) return books[0];

  const mergedDates: Record<string, DaySchedule> = {};
  const sourceFiles: string[] = [];
  const nurseSet = new Set<string>(['Afiz']);
  const doctorSet = new Set<string>();
  let monthlyPICs: MonthlyPICItem[] = [];
  let monthLabel = books[books.length - 1].monthLabel;
  let casePresentationNote = books[books.length - 1].casePresentationNote;
  let handoverNote = books[books.length - 1].handoverNote;
  let headOfUnit = books[books.length - 1].headOfUnit;

  for (const b of books) {
    for (const sf of b.sourceFiles) {
      if (!sourceFiles.includes(sf)) sourceFiles.push(sf);
    }
    b.allNurses.forEach((n) => nurseSet.add(n));
    b.allDoctors.forEach((d) => doctorSet.add(d));
    if (b.monthlyPICs.length > 0) {
      monthlyPICs = b.monthlyPICs;
    }
    for (const [dateISO, daySched] of Object.entries(b.dates)) {
      const existing = mergedDates[dateISO];
      // Prefer the schedule entry that has actual assignments/leaves if an overlapping Sunday/boundary date was empty
      if (
        !existing ||
        daySched.assignments.length >= existing.assignments.length
      ) {
        mergedDates[dateISO] = daySched;
      }
    }
  }

  const sortedNurses = Array.from(nurseSet).sort((a, b) => {
    if (a === 'Afiz') return -1;
    if (b === 'Afiz') return 1;
    return a.localeCompare(b, 'id');
  });

  return {
    sourceFiles,
    monthLabel,
    dates: mergedDates,
    allNurses: sortedNurses,
    allDoctors: Array.from(doctorSet).sort((a, b) => a.localeCompare(b, 'id')),
    monthlyPICs,
    casePresentationNote,
    handoverNote,
    headOfUnit,
  };
}

export function applySwapsToDayAssignments(
  assignments: SlotAssignment[],
  dateISO: string,
  swaps: SwapOverride[] = []
): SlotAssignment[] {
  const daySwaps = swaps.filter((s) => s.dateISO === dateISO);
  if (daySwaps.length === 0) return assignments;

  return assignments.map((slot) => {
    let updated = { ...slot };
    for (const sw of daySwaps) {
      if (updated.slotId === sw.slotId && updated.nurseName === sw.fromNurse) {
        updated = {
          ...updated,
          nurseName: sw.toNurse,
          swappedFrom: sw.fromNurse,
        };
      } else if (sw.targetSlotId && updated.slotId === sw.targetSlotId && updated.nurseName === sw.toNurse) {
        updated = {
          ...updated,
          nurseName: sw.fromNurse,
          swappedFrom: sw.toNurse,
        };
      }
    }
    return updated;
  });
}

export function getNurseDayView(
  book: ParsedScheduleBook,
  dateISO: string,
  nurseName: string,
  swaps: SwapOverride[] = []
): NurseDaySummary {
  const day = book.dates[dateISO];
  if (!day) {
    return {
      dateISO,
      dayNameID: '',
      isSunday: false,
      nurseName,
      status: 'LIBUR_OFF',
      slots: [],
      sharedTasks: [],
      isCasePresentationDay: false,
    };
  }

  const effectiveAssignments = applySwapsToDayAssignments(day.assignments, dateISO, swaps);
  const nurseSlots = effectiveAssignments
    .filter((a) => a.nurseName.toLowerCase() === nurseName.toLowerCase() && !a.isAllAssistants)
    .sort((a, b) => a.effectiveTimeMinutes - b.effectiveTimeMinutes);

  const leaveEntry = day.leaves.find(
    (l) => l.nurseName.toLowerCase() === nurseName.toLowerCase()
  );

  let status: DailyStatus = 'LIBUR_OFF';
  if (nurseSlots.length >= 2) {
    status = 'LEMBUR_2_SLOT';
  } else if (nurseSlots.length === 1) {
    status = nurseSlots[0].period === 'PAGI' ? 'REGULER_PAGI' : 'REGULER_SORE';
  } else if (leaveEntry) {
    status = 'CUTI_LP';
  }

  const isCasePresentationDay = day.dayOfWeek === 2 || day.dayOfWeek === 3; // Selasa atau Rabu

  return {
    dateISO,
    dayNameID: day.dayNameID,
    isSunday: day.isSunday,
    nurseName,
    status,
    slots: nurseSlots,
    leaveEntry,
    sharedTasks: day.sharedTasks,
    isCasePresentationDay,
  };
}

export function formatSwapWhatsAppText(book: ParsedScheduleBook, sw: SwapOverride): string {
  const swDay = book.dates[sw.dateISO];
  const slotObj = swDay?.assignments.find((a) => a.slotId === sw.slotId);
  const docList = slotObj?.doctors.join(', ') || 'Tugas Operasional Klinik';
  const timeStr = slotObj?.effectiveTime || '-';

  return [
    `🐰🍓 *PENGAJUAN / SIMULASI TUKAR SLOT Sheyla*`,
    `📅 Tanggal: *${swDay?.dayNameID || ''}, ${sw.dateISO}*`,
    `🔄 Asisten Awal: *${sw.fromNurse}*`,
    `🤝 Digantikan Oleh: *${sw.toNurse}*`,
    `🕒 Jam Masuk Slot: *${timeStr} WIB*`,
    `🩺 Dokter / Tugas: *${docList}*`,
    sw.note ? `📝 Catatan: ${sw.note}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

