import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  applySwapsToDayAssignments,
  formatSwapWhatsAppText,
  getNurseDayView,
  parseInternisExcelBuffer,
} from '../utils/excelParser';
import { SwapOverride } from '../types/schedule';

describe('Sheyla Secondary Flows (Doctor Directory, Cuti & Swap Simulation)', () => {
  it('accurately applies slot swap simulation between Afiz and another Bunny Nurse', async () => {
    const filePath = path.resolve(process.cwd(), 'NOVEMBER 2026.xlsx');
    const buf = fs.readFileSync(filePath);
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

    const book = await parseInternisExcelBuffer(ab, 'NOVEMBER 2026.xlsx');

    // Before swap on 2026-11-11: Afiz has dr. Dadang Sp.OT 9-17
    const beforeAfiz = getNurseDayView(book, '2026-11-11', 'Afiz');
    expect(beforeAfiz.slots).toHaveLength(1);
    const afizSlotId = beforeAfiz.slots[0].slotId;

    const swaps: SwapOverride[] = [
      {
        id: 'swap_test_1',
        dateISO: '2026-11-11',
        slotId: afizSlotId,
        fromNurse: 'Afiz',
        toNurse: 'Endang',
        note: 'Tukar slot Rabu',
        createdAt: '2026-11-11T08:00:00Z',
      },
    ];

    // After swap: Afiz has 0 slots on 2026-11-11, and Endang receives Afiz's slot with swappedFrom="Afiz"
    const afterAfiz = getNurseDayView(book, '2026-11-11', 'Afiz', swaps);
    expect(afterAfiz.slots).toHaveLength(0);
    expect(afterAfiz.status).toBe('LIBUR_OFF');

    const afterEndang = getNurseDayView(book, '2026-11-11', 'Endang', swaps);
    const swappedSlot = afterEndang.slots.find((s) => s.slotId === afizSlotId);
    expect(swappedSlot).toBeDefined();
    expect(swappedSlot?.swappedFrom).toBe('Afiz');
    expect(swappedSlot?.doctors.join(' ')).toContain('Dadang');

    // Verify applySwapsToDayAssignments keeps total slot count intact
    const allSwapped = applySwapsToDayAssignments(
      book.dates['2026-11-11'].assignments,
      '2026-11-11',
      swaps
    );
    expect(allSwapped).toHaveLength(book.dates['2026-11-11'].assignments.length);

    // Verify formatSwapWhatsAppText resolves the swap's own dateISO regardless of currently viewed date
    const waText = formatSwapWhatsAppText(book, swaps[0]);
    expect(waText).toContain('Rabu, 2026-11-11');
    expect(waText).toContain('09.00 WIB');
    expect(waText).toContain('Dadang');
  });
});

