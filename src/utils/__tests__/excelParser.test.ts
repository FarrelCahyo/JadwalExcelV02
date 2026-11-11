import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import JSZip from 'jszip';
import {
  parseInternisExcelBuffer,
  mergeScheduleBooks,
  getNurseDayView,
  normalizeNurseName,
} from '../excelParser';

function readExcelArrayBuffer(filename: string): ArrayBuffer {
  const filePath = path.resolve(process.cwd(), filename);
  const buf = fs.readFileSync(filePath);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

describe('Sheyla Excel Parser Engine (internis dkk)', () => {
  it('normalizes nurse name typos from Excel accurately', () => {
    expect(normalizeNurseName('Adelin a')).toBe('Adelina');
    expect(normalizeNurseName('Siti ANifah')).toBe('Siti Anifah');
    expect(normalizeNurseName('Afiz')).toBe('Afiz');
  });

  it('parses and merges NOVEMBER MG 1 2026.xlsx and NOVEMBER 2026.xlsx matching PRD Section 2.2', async () => {
    const bufMg1 = readExcelArrayBuffer('NOVEMBER MG 1 2026.xlsx');
    const bufFull = readExcelArrayBuffer('NOVEMBER 2026.xlsx');

    const bookMg1 = await parseInternisExcelBuffer(bufMg1, 'NOVEMBER MG 1 2026.xlsx');
    const bookFull = await parseInternisExcelBuffer(bufFull, 'NOVEMBER 2026.xlsx');
    const merged = mergeScheduleBooks([bookMg1, bookFull]);

    // Check full date coverage
    expect(Object.keys(merged.dates)).toContain('2026-11-02');
    expect(Object.keys(merged.dates)).toContain('2026-11-11');
    expect(Object.keys(merged.dates)).toContain('2026-11-30');

    // 1. 02 Nov (Sen) -> Reguler Sore 12.00 (Prio 2: masuk jam 12)
    const nov02 = getNurseDayView(merged, '2026-11-02', 'Afiz');
    expect(nov02.status).toBe('REGULER_SORE');
    expect(nov02.slots).toHaveLength(1);
    expect(nov02.slots[0].effectiveTime).toBe('12.00');
    expect(nov02.slots[0].prioritySource).toBe('PRIO_2_DAY_COL');
    expect(nov02.slots[0].doctors.join(' ')).toContain('Tan Hengky');
    expect(nov02.slots[0].doctors.join(' ')).toContain('Rheza');
    expect(nov02.slots[0].doctors.join(' ')).toContain('Marsella');

    // 2. 07 Nov (Sab) -> Reguler Pagi 07.00 (Prio 2: msk jam 7)
    const nov07 = getNurseDayView(merged, '2026-11-07', 'Afiz');
    expect(nov07.status).toBe('REGULER_PAGI');
    expect(nov07.slots[0].effectiveTime).toBe('07.00');
    expect(nov07.slots[0].prioritySource).toBe('PRIO_2_DAY_COL');
    expect(nov07.slots[0].doctors.join(' ')).toContain('Lie Michele');

    // 3. 10 Nov (Sel) -> Reguler Sore 14.00 (Prio 3: Shift Induk 14.00)
    const nov10 = getNurseDayView(merged, '2026-11-10', 'Afiz');
    expect(nov10.status).toBe('REGULER_SORE');
    expect(nov10.slots[0].effectiveTime).toBe('14.00');
    expect(nov10.slots[0].prioritySource).toBe('PRIO_3_SHIFT_INDUK');
    expect(nov10.slots[0].doctors.join(' ')).toContain('Agus');
    expect(nov10.slots[0].doctors.join(' ')).toContain('Antonius');
    expect(nov10.slots[0].doctors.join(' ')).toContain('Wahyu');

    // 4. 11 Nov (Rab) -> Reguler Pagi 09.00 (Prio 2: msk j.9), dr. Dadang Sp.OT 9-17
    const nov11 = getNurseDayView(merged, '2026-11-11', 'Afiz');
    expect(nov11.status).toBe('REGULER_PAGI');
    expect(nov11.slots[0].effectiveTime).toBe('09.00');
    expect(nov11.slots[0].prioritySource).toBe('PRIO_2_DAY_COL');
    expect(nov11.slots[0].doctors.join(' ')).toContain('Dadang');
    expect(nov11.slots[0].tasks.join(' ')).toContain('piket stock bedah');

    // 5. All 5 Overtime Dates in November for Afiz: 13, 19, 23, 25, 30 Nov
    const overtimeDates = ['2026-11-13', '2026-11-19', '2026-11-23', '2026-11-25', '2026-11-30'];
    for (const d of overtimeDates) {
      const view = getNurseDayView(merged, d, 'Afiz');
      expect(view.status, `Expected ${d} to be LEMBUR_2_SLOT`).toBe('LEMBUR_2_SLOT');
      expect(view.slots).toHaveLength(2);
    }

    // 6. 25 Nov (Rab) -> Slot 1 Prio 1 ("jam 8" in Y8 -> 08.00, dr. Indra), Slot 2 Prio 2 ("masuk jam 13" -> 13.00, Prof. Zainal)
    const nov25 = getNurseDayView(merged, '2026-11-25', 'Afiz');
    expect(nov25.slots[0].effectiveTime).toBe('08.00');
    expect(nov25.slots[0].prioritySource).toBe('PRIO_1_DATE_CELL');
    expect(nov25.slots[0].doctors.join(' ')).toContain('Indra');
    expect(nov25.slots[1].effectiveTime).toBe('13.00');
    expect(nov25.slots[1].prioritySource).toBe('PRIO_2_DAY_COL');
    expect(nov25.slots[1].doctors.join(' ')).toContain('Zainal');

    // 7. 28 Nov (Sab) -> CUTI_LP ("Afiz cuti")
    const nov28 = getNurseDayView(merged, '2026-11-28', 'Afiz');
    expect(nov28.status).toBe('CUTI_LP');
    expect(nov28.leaveEntry?.rawText.toLowerCase()).toContain('afiz cuti');

    // 8. Monthly PIC extraction
    expect(merged.monthlyPICs.length).toBeGreaterThanOrEqual(4);

    // 9. Review Focus: Shared Row 100 ("semua asisten") does not count as individual overtime slot
    expect(nov11.sharedTasks.join(' ')).toContain('EVALUASI BPJS');
  });

  it('parses OKTOBER AKHIR 2026.xlsx and handles invalid buffers gracefully', async () => {
    const bufOkt = readExcelArrayBuffer('OKTOBER AKHIR 2026.xlsx');
    const bookOkt = await parseInternisExcelBuffer(bufOkt, 'OKTOBER AKHIR 2026.xlsx');
    expect(Object.keys(bookOkt.dates).length).toBeGreaterThan(10);
    expect(bookOkt.allNurses).toContain('Afiz');

    // Invalid buffer throws clear Indonesian error
    const badBuf = new TextEncoder().encode('not-a-zip').buffer;
    await expect(parseInternisExcelBuffer(badBuf, 'rusak.xlsx')).rejects.toThrow();

    // Valid xlsx without schedule dates in Row 3 throws descriptive Indonesian error
    const zip = new JSZip();
    zip.file(
      'xl/workbook.xml',
      '<?xml version="1.0"?><workbook><sheets><sheet name="SheetKosong" sheetId="1" r:id="rId1"/></sheets></workbook>'
    );
    zip.file(
      'xl/worksheets/sheet1.xml',
      '<?xml version="1.0"?><worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Halo</t></is></c></row></sheetData></worksheet>'
    );
    const emptyXlsxBuf = await zip.generateAsync({ type: 'arraybuffer' });
    await expect(parseInternisExcelBuffer(emptyXlsxBuf, 'kosong.xlsx')).rejects.toThrow(
      /kolom tanggal jadwal/i
    );

    // Borderless xlsx with string-formatted date in Row 3 ("2026-11-11") still parses cleanly
    const borderlessZip = new JSZip();
    borderlessZip.file(
      'xl/workbook.xml',
      '<?xml version="1.0"?><workbook><sheets><sheet name="internis dkk" sheetId="1" r:id="rId1"/></sheets></workbook>'
    );
    borderlessZip.file(
      'xl/worksheets/sheet1.xml',
      '<?xml version="1.0"?><worksheet><sheetData>' +
        '<row r="3"><c r="A3" t="inlineStr"><is><t>JAM</t></is></c><c r="D3" t="inlineStr"><is><t>RABU</t></is></c><c r="H3" t="inlineStr"><is><t>2026-11-11</t></is></c></row>' +
        '<row r="4"><c r="A4" t="inlineStr"><is><t>j 9</t></is></c><c r="D4" t="inlineStr"><is><t>dr. Dadang Sp.OT 9-17</t></is></c><c r="H4" t="inlineStr"><is><t>Afiz</t></is></c></row>' +
        '</sheetData></worksheet>'
    );
    const borderlessBuf = await borderlessZip.generateAsync({ type: 'arraybuffer' });
    const borderlessBook = await parseInternisExcelBuffer(borderlessBuf, 'tanpa_border.xlsx');
    const borderlessView = getNurseDayView(borderlessBook, '2026-11-11', 'Afiz');
    expect(borderlessView.status).toBe('REGULER_PAGI');
    expect(borderlessView.slots[0].doctors[0]).toContain('Dadang');
  });
});

