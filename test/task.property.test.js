// Property-based tests untuk logika domain Task_List (task.js).
// Dijalankan via Vitest dengan fast-check (minimum 100 iterasi).
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  addTask,
  toggleTask,
  editTask,
  deleteTask,
  MIN_TEXT_LENGTH,
  MAX_TEXT_LENGTH,
} from '../src/task.js';

// Generator Task_List acak: membangun daftar melalui addTask berturut-turut
// sehingga invarian (id unik, bentuk Task) selalu terjaga.
const validInnerText = fc
  .string({ minLength: MIN_TEXT_LENGTH, maxLength: MAX_TEXT_LENGTH })
  // Pastikan hasil trim memiliki panjang 3–50 (sesuai batas valid Task_Text).
  .map((s) => s.trim())
  .filter((s) => s.length >= MIN_TEXT_LENGTH && s.length <= MAX_TEXT_LENGTH);

const taskListArb = fc
  .array(validInnerText, { minLength: 0, maxLength: 20 })
  .map((texts) =>
    texts.reduce((list, text) => {
      const result = addTask(list, text);
      return result.ok ? result.taskList : list;
    }, []),
  );

// Generator Task_Text mentah valid: inti dengan panjang trim 3–50 karakter,
// boleh dibungkus spasi di tepi (spasi, tab, newline).
const whitespace = fc.stringMatching(/^[ \t\n\r]*$/, { minLength: 0, maxLength: 5 });

// Generator satu karakter non-whitespace (fast-check v4 menghapus fc.char()).
// Dipakai untuk membangun inti teks yang panjangnya tidak berkurang saat di-trim.
const nonWhitespaceChar = fc
  .string({ minLength: 1, maxLength: 1 })
  .filter((c) => c.length === 1 && c.trim().length === 1);

const rawValidTextArb = fc
  .tuple(whitespace, validInnerText, whitespace)
  .map(([lead, core, trail]) => `${lead}${core}${trail}`);

// Generator Task_Text mentah yang hasil trim-nya MELEBIHI batas: inti non-spasi
// dengan panjang > MAX_TEXT_LENGTH, boleh dibungkus spasi di tepi. Inti dibangun
// dari karakter non-whitespace sehingga trim tidak mengurangi panjang inti.
const tooLongInnerText = fc
  // Bangun string sembarang yang cukup panjang lalu jamin inti non-spasi dengan
  // panjang > MAX_TEXT_LENGTH dengan menambahkan 'a' secukupnya di depan.
  .string({ minLength: 0, maxLength: 50 })
  .map((s) => `${'a'.repeat(MAX_TEXT_LENGTH + 1)}${s}`)
  // Jaminan eksplisit: panjang hasil trim benar-benar melebihi batas.
  .filter((s) => s.trim().length > MAX_TEXT_LENGTH);

const rawTooLongTextArb = fc
  .tuple(whitespace, tooLongInnerText, whitespace)
  .map(([lead, core, trail]) => `${lead}${core}${trail}`);

describe('Property-based: addTask', () => {
  // Feature: todolist-app, Property 1: Penambahan task valid menumbuhkan daftar dengan teks ter-trim
  it('penambahan task valid menumbuhkan daftar dengan teks ter-trim (Req 1.1)', () => {
    fc.assert(
      fc.property(taskListArb, rawValidTextArb, (taskList, rawText) => {
        const result = addTask(taskList, rawText);

        // Penambahan valid harus berhasil.
        expect(result.ok).toBe(true);

        // Panjang bertambah tepat satu.
        expect(result.taskList).toHaveLength(taskList.length + 1);

        // Task terakhir memiliki text = hasil trim input dan completed=false.
        const lastTask = result.taskList[result.taskList.length - 1];
        expect(lastTask.text).toBe(rawText.trim());
        expect(lastTask.completed).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: todolist-app, Property 2: Setiap id pada Task_List unik
  it('setiap id pada Task_List yang dihasilkan unik (Req 1.2)', () => {
    fc.assert(
      fc.property(fc.array(rawValidTextArb, { minLength: 0, maxLength: 50 }), (texts) => {
        // Bangun Task_List dari daftar kosong melalui penambahan valid berturut-turut.
        const taskList = texts.reduce((list, text) => {
          const result = addTask(list, text);
          // Seluruh teks valid, maka setiap penambahan harus berhasil.
          expect(result.ok).toBe(true);
          return result.taskList;
        }, []);

        // Seluruh nilai id harus berbeda satu sama lain (tidak ada duplikasi).
        const ids = taskList.map((task) => task.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: todolist-app, Property 4: Teks melebihi batas ditolak
  it('menolak teks yang hasil trim-nya melebihi batas dengan reason too_long tanpa mengubah Task_List (Req 1.5)', () => {
    fc.assert(
      fc.property(taskListArb, rawTooLongTextArb, (taskList, rawText) => {
        // Prasyarat generator: hasil trim benar-benar melebihi MAX_TEXT_LENGTH.
        expect(rawText.trim().length).toBeGreaterThan(MAX_TEXT_LENGTH);

        // Snapshot untuk memverifikasi Task_List tidak termutasi.
        const before = structuredClone(taskList);

        const result = addTask(taskList, rawText);

        // Penambahan harus ditolak dengan reason 'too_long'.
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('too_long');

        // Penolakan tidak boleh menyertakan Task_List baru.
        expect(result).not.toHaveProperty('taskList');

        // Task_List asli tetap tidak berubah (termasuk panjang dan isi).
        expect(taskList).toEqual(before);
        expect(taskList).toHaveLength(before.length);
      }),
      { numRuns: 100 },
    );
  });
});

describe('Property-based: toggleTask', () => {
  // Feature: todolist-app, Property 8: Toggle bersifat involusi
  it('toggle sekali membalik completed; dua kali mengembalikan ke semula, id & text tetap (Req 3.1, 3.2)', () => {
    fc.assert(
      fc.property(
        // Hanya pakai Task_List tak-kosong agar selalu ada id yang dapat di-toggle,
        // lalu pilih indeks Task yang ada secara acak.
        taskListArb
          .filter((list) => list.length >= 1)
          .chain((list) =>
            fc.record({
              list: fc.constant(list),
              index: fc.integer({ min: 0, max: list.length - 1 }),
            }),
          ),
        ({ list, index }) => {
          const target = list[index];
          const id = target.id;

          const once = toggleTask(list, id);
          const toggledTask = once.find((task) => task.id === id);

          // Satu kali toggle membalik completed Task tersebut.
          expect(toggledTask.completed).toBe(!target.completed);
          // id dan text tidak berubah.
          expect(toggledTask.id).toBe(target.id);
          expect(toggledTask.text).toBe(target.text);

          const twice = toggleTask(once, id);
          const restoredTask = twice.find((task) => task.id === id);

          // Dua kali toggle mengembalikan completed ke nilai semula.
          expect(restoredTask.completed).toBe(target.completed);
          // id dan text tetap tidak berubah setelah dua toggle.
          expect(restoredTask.id).toBe(target.id);
          expect(restoredTask.text).toBe(target.text);

          // Task lain tidak terpengaruh (panjang & urutan id dipertahankan).
          expect(twice.map((task) => task.id)).toEqual(list.map((task) => task.id));
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Karakter non-whitespace (huruf, angka, simbol umum) sehingga trim tidak
// mengurangi panjang inti teks edit.
const editNonWhitespaceChar = fc.constantFrom(
  ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{};:,.<>?'.split(''),
);

// Generator teks inti valid untuk edit: panjang hasil trim 3–50 karakter.
// Inti dibangun dari karakter non-whitespace agar trim tidak mengubah panjangnya,
// sesuai batas valid 3–50 karakter setelah pemangkasan (Req 4.1).
const editValidInnerText = fc
  .array(editNonWhitespaceChar, { minLength: 3, maxLength: 50 })
  .map((chars) => chars.join(''))
  .filter((s) => s.trim().length >= 3 && s.trim().length <= 50);

// Generator Task_Text mentah valid untuk edit: inti 3–50 char (setelah trim),
// boleh dibungkus spasi di tepi (spasi, tab, newline) sebagai edge case.
const rawEditValidTextArb = fc
  .tuple(whitespace, editValidInnerText, whitespace)
  .map(([lead, core, trail]) => `${lead}${core}${trail}`);

describe('Property-based: editTask', () => {
  // Feature: todolist-app, Property 9: Edit memperbarui teks serta mempertahankan id dan status
  it('edit memperbarui text ke hasil trim sambil mempertahankan id dan completed (Req 4.1, 4.3)', () => {
    fc.assert(
      fc.property(
        // Hanya pakai Task_List tak-kosong agar selalu ada id yang dapat diedit,
        // lalu pilih indeks Task yang ada secara acak beserta teks mentah valid.
        taskListArb
          .filter((list) => list.length >= 1)
          .chain((list) =>
            fc.record({
              list: fc.constant(list),
              index: fc.integer({ min: 0, max: list.length - 1 }),
              rawText: rawEditValidTextArb,
            }),
          ),
        ({ list, index, rawText }) => {
          const target = list[index];
          const id = target.id;

          const result = editTask(list, id, rawText);

          // Edit dengan teks valid harus berhasil.
          expect(result.ok).toBe(true);

          const editedTask = result.taskList.find((task) => task.id === id);

          // text diperbarui ke hasil pemangkasan input.
          expect(editedTask.text).toBe(rawText.trim());
          // id dipertahankan tanpa perubahan.
          expect(editedTask.id).toBe(target.id);
          // completed (Completion_Status) dipertahankan tanpa perubahan.
          expect(editedTask.completed).toBe(target.completed);

          // Task lain tidak terpengaruh: panjang, urutan id, dan isinya tetap.
          expect(result.taskList).toHaveLength(list.length);
          expect(result.taskList.map((task) => task.id)).toEqual(list.map((task) => task.id));
          result.taskList.forEach((task, i) => {
            if (task.id !== id) {
              expect(task.text).toBe(list[i].text);
              expect(task.completed).toBe(list[i].completed);
            }
          });
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('Property-based: deleteTask', () => {
  // Feature: todolist-app, Property 11: Delete menghapus Task yang tepat
  it('delete menghapus Task ber-id tersebut; panjang berkurang satu, Task lain tetap dalam urutan semula (Req 5.2)', () => {
    fc.assert(
      fc.property(
        // Hanya pakai Task_List tak-kosong agar selalu ada id yang dapat dihapus,
        // lalu pilih indeks Task yang ada secara acak.
        taskListArb
          .filter((list) => list.length >= 1)
          .chain((list) =>
            fc.record({
              list: fc.constant(list),
              index: fc.integer({ min: 0, max: list.length - 1 }),
            }),
          ),
        ({ list, index }) => {
          const target = list[index];
          const id = target.id;

          const result = deleteTask(list, id);

          // Daftar hasil tidak lagi memuat Task ber-id tersebut.
          expect(result.some((task) => task.id === id)).toBe(false);

          // Panjang berkurang tepat satu.
          expect(result).toHaveLength(list.length - 1);

          // Seluruh Task lain tetap ada dalam urutan semula (identitas objek
          // dan urutan dipertahankan setelah menghapus id target).
          const expected = list.filter((task) => task.id !== id);
          expect(result).toEqual(expected);
          expect(result.map((task) => task.id)).toEqual(expected.map((task) => task.id));

          // Operasi tidak memutasi daftar masukan: Task target masih ada di input.
          expect(list.some((task) => task.id === id)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
