// Property-based test untuk Property 3 (penolakan teks kosong/whitespace dan
// kurang dari 3 karakter). Dijalankan via Vitest dengan fast-check
// (minimum 100 iterasi). Dipisah ke file sendiri mengikuti konvensi repo yang
// memecah test domain ke beberapa berkas.
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { addTask, MIN_TEXT_LENGTH, MAX_TEXT_LENGTH } from '../src/task.js';

// Karakter non-spasi (tidak termasuk whitespace apa pun) agar panjang hasil
// trim sama dengan panjang inti yang dibangkitkan. Dibangun dari rentang ASCII
// tercetak '!'..'~' (0x21–0x7E) yang tidak memuat whitespace.
const nonWhitespaceChar = fc
  .integer({ min: 0x21, max: 0x7e })
  .map((code) => String.fromCharCode(code));

// Generator Task_List acak: dibangun melalui addTask berturut-turut dengan teks
// valid (3–50 char setelah trim) sehingga invarian Task selalu terjaga.
const validInnerText = fc
  .array(nonWhitespaceChar, { minLength: MIN_TEXT_LENGTH, maxLength: MAX_TEXT_LENGTH })
  .map((chars) => chars.join(''))
  .filter((s) => s.trim().length >= MIN_TEXT_LENGTH && s.trim().length <= MAX_TEXT_LENGTH);

const taskListArb = fc
  .array(validInnerText, { minLength: 0, maxLength: 20 })
  .map((texts) =>
    texts.reduce((list, text) => {
      const result = addTask(list, text);
      return result.ok ? result.taskList : list;
    }, []),
  );

// Generator teks kosong/whitespace-only: nol hingga beberapa karakter spasi,
// tab, newline, atau carriage return (termasuk string kosong). Hasil trim = ''.
const emptyOrWhitespaceArb = fc.stringMatching(/^[ \t\n\r]*$/, {
  minLength: 0,
  maxLength: 8,
});

// Generator teks yang setelah trim memiliki panjang 1–2 karakter (kurang dari
// MIN_TEXT_LENGTH). Inti berupa 1–2 karakter non-spasi, boleh dibungkus spasi
// di tepi agar trim mengembalikannya ke panjang 1–2.
const whitespace = fc.stringMatching(/^[ \t\n\r]*$/, { minLength: 0, maxLength: 5 });

const rawTooShortTextArb = fc
  .tuple(
    whitespace,
    fc
      .array(nonWhitespaceChar, { minLength: 1, maxLength: MIN_TEXT_LENGTH - 1 })
      .map((chars) => chars.join('')),
    whitespace,
  )
  .map(([lead, core, trail]) => `${lead}${core}${trail}`)
  // Jaminan eksplisit: hasil trim benar-benar 1–2 karakter.
  .filter((s) => {
    const len = s.trim().length;
    return len >= 1 && len < MIN_TEXT_LENGTH;
  });

describe('Property-based: addTask menolak teks kosong/whitespace dan kurang dari 3 karakter', () => {
  // Feature: todolist-app, Property 3: Teks kosong/whitespace dan kurang dari 3 karakter ditolak
  it('menolak teks kosong/whitespace (reason empty) dan 1–2 karakter (reason too_short) tanpa mengubah Task_List (Req 1.4)', () => {
    fc.assert(
      fc.property(
        taskListArb,
        emptyOrWhitespaceArb,
        rawTooShortTextArb,
        (taskList, emptyText, tooShortText) => {
          // Prasyarat generator.
          expect(emptyText.trim()).toHaveLength(0);
          const shortLen = tooShortText.trim().length;
          expect(shortLen).toBeGreaterThanOrEqual(1);
          expect(shortLen).toBeLessThan(MIN_TEXT_LENGTH);

          // Snapshot untuk memverifikasi Task_List tidak termutasi.
          const before = structuredClone(taskList);

          // Kasus kosong/whitespace → reason 'empty', Task_List tidak berubah.
          const emptyResult = addTask(taskList, emptyText);
          expect(emptyResult.ok).toBe(false);
          expect(emptyResult.reason).toBe('empty');
          expect(emptyResult).not.toHaveProperty('taskList');
          expect(taskList).toEqual(before);
          expect(taskList).toHaveLength(before.length);

          // Kasus 1–2 karakter (setelah trim) → reason 'too_short', tidak berubah.
          const shortResult = addTask(taskList, tooShortText);
          expect(shortResult.ok).toBe(false);
          expect(shortResult.reason).toBe('too_short');
          expect(shortResult).not.toHaveProperty('taskList');
          expect(taskList).toEqual(before);
          expect(taskList).toHaveLength(before.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});
