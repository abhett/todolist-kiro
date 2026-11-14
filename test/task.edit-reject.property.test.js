// Property-based test untuk penolakan edit tidak valid (Task 2.9, Property 10).
// Dijalankan via Vitest dengan fast-check (minimum 100 iterasi).
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { addTask } from '../src/task.js';

// Batas panjang Task_Text hasil trim sesuai spec (Req 1.1, 4.1, 4.2).
const MIN_TEXT_LENGTH = 3;
const MAX_TEXT_LENGTH = 50;

// Generator teks inti valid: panjang trim 3–50 karakter dan tidak kosong
// setelah trim. Dipakai untuk membangun Task_List awal yang sah.
const validInnerText = fc
  .string({ minLength: MIN_TEXT_LENGTH, maxLength: MAX_TEXT_LENGTH })
  .map((s) => s.trim())
  .filter((s) => s.length >= MIN_TEXT_LENGTH && s.length <= MAX_TEXT_LENGTH);

// Generator Task_List acak (termasuk kosong) yang dibangun melalui addTask
// berturut-turut sehingga invarian (id unik, bentuk Task) selalu terjaga.
const taskListArb = fc
  .array(validInnerText, { minLength: 1, maxLength: 20 })
  .map((texts) =>
    texts.reduce((list, text) => {
      const result = addTask(list, text);
      return result.ok ? result.taskList : list;
    }, []),
  )
  .filter((list) => list.length >= 1);

// Generator whitespace murni (termasuk string kosong): spasi, tab, newline.
const whitespaceOnly = fc.stringMatching(/^[ \t\n\r]*$/, {
  minLength: 0,
  maxLength: 8,
});

// Generator teks yang setelah trim berpanjang 1–2 karakter (terlalu pendek).
const tooShortText = fc
  .tuple(
    fc.stringMatching(/^[ \t\n\r]*$/, { minLength: 0, maxLength: 4 }),
    fc
      .string({ minLength: 1, maxLength: 2 })
      .map((s) => s.replace(/\s/g, 'a'))
      .filter((s) => s.length >= 1 && s.length <= 2),
    fc.stringMatching(/^[ \t\n\r]*$/, { minLength: 0, maxLength: 4 }),
  )
  .map(([lead, core, trail]) => `${lead}${core}${trail}`)
  .filter((s) => {
    const t = s.trim();
    return t.length >= 1 && t.length <= 2;
  });

// Generator teks yang setelah trim berpanjang > 50 karakter (terlalu panjang).
const tooLongText = fc
  .string({ minLength: MAX_TEXT_LENGTH + 1, maxLength: 200 })
  .map((s) => (s.trim().length > MAX_TEXT_LENGTH ? s : s + 'x'.repeat(MAX_TEXT_LENGTH + 1)))
  .filter((s) => s.trim().length > MAX_TEXT_LENGTH);

// Gabungan seluruh kategori teks tidak valid untuk edit.
const invalidRawTextArb = fc.oneof(whitespaceOnly, tooShortText, tooLongText);

describe('Property-based: editTask menolak edit tidak valid', () => {
  // Feature: todolist-app, Property 10: Edit tidak valid ditolak tanpa mengubah Task
  it('menolak edit tidak valid dan membiarkan Task tidak berubah (Req 4.2)', async () => {
    const { editTask } = await import('../src/task.js');
    fc.assert(
      fc.property(
        taskListArb,
        fc.nat(),
        invalidRawTextArb,
        (taskList, index, rawText) => {
          // Pilih sebuah Task yang ada di dalam daftar.
          const target = taskList[index % taskList.length];
          const before = { ...target };

          const result = editTask(taskList, target.id, rawText);

          // Edit tidak valid harus ditolak.
          expect(result.ok).toBe(false);

          // Task_List masukan tidak boleh berubah (termasuk teks Task target).
          const after = taskList.find((t) => t.id === before.id);
          expect(after).toBeDefined();
          expect(after.text).toBe(before.text);
          expect(after.completed).toBe(before.completed);
          expect(after.id).toBe(before.id);
        },
      ),
      { numRuns: 100 },
    );
  });
});
