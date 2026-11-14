// Property-based test untuk ketahanan pemuatan terhadap data rusak (store.js).
// Dijalankan via Vitest dengan fast-check (minimum 100 iterasi).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { loadTasks, STORAGE_KEY } from '../src/store.js';

// localStorage tiruan (in-memory) agar round-trip dan penanganan data rusak
// diuji tanpa bergantung pada peramban nyata. Diinstal pada globalThis sehingga
// store.js (yang mengakses globalThis.localStorage) memakainya.
function createMemoryStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
    clear() {
      map.clear();
    },
  };
}

let originalLocalStorage;

beforeEach(() => {
  originalLocalStorage = globalThis.localStorage;
  globalThis.localStorage = createMemoryStorage();
});

afterEach(() => {
  globalThis.localStorage = originalLocalStorage;
});

// Generator string sembarang yang BUKAN serialisasi Task_List valid. Mencakup:
// - JSON tidak valid (string sembarang yang gagal di-parse),
// - tipe salah (angka, boolean, null, objek non-array),
// - bentuk Task tidak lengkap/salah tipe (array berisi objek yang kekurangan
//   field atau memakai tipe yang keliru untuk id/text/completed).
// Setiap kandidat dilewatkan filter untuk memastikan ia benar-benar BUKAN
// serialisasi Task_List valid (array objek dengan id:string, text:string,
// completed:boolean).
function isValidSerializedTaskList(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return false;
  }
  if (!Array.isArray(parsed)) return false;
  return parsed.every(
    (v) =>
      typeof v === 'object' &&
      v !== null &&
      typeof v.id === 'string' &&
      typeof v.text === 'string' &&
      typeof v.completed === 'boolean',
  );
}

// Bentuk-bentuk Task yang RUSAK (kekurangan field atau salah tipe).
const corruptTaskArb = fc.oneof(
  // Objek kosong / kekurangan field.
  fc.record({}),
  fc.record({ id: fc.string() }),
  fc.record({ text: fc.string() }),
  fc.record({ completed: fc.boolean() }),
  fc.record({ id: fc.string(), text: fc.string() }),
  // Salah tipe pada field.
  fc.record({
    id: fc.integer(),
    text: fc.string(),
    completed: fc.boolean(),
  }),
  fc.record({
    id: fc.string(),
    text: fc.integer(),
    completed: fc.boolean(),
  }),
  fc.record({
    id: fc.string(),
    text: fc.string(),
    completed: fc.string(),
  }),
  // Elemen non-objek di dalam array.
  fc.integer(),
  fc.boolean(),
  fc.constant(null),
  fc.string(),
);

const corruptRawArb = fc
  .oneof(
    // JSON tidak valid: string sembarang (sebagian besar gagal di-parse).
    fc.string(),
    // Tipe salah pada level teratas (bukan array) sebagai JSON valid.
    fc.integer().map((n) => JSON.stringify(n)),
    fc.boolean().map((b) => JSON.stringify(b)),
    fc.constant('null'),
    fc.object().map((o) => JSON.stringify(o)),
    // Array berisi elemen Task yang rusak/salah bentuk.
    fc.array(corruptTaskArb, { minLength: 1, maxLength: 10 }).map((a) => JSON.stringify(a)),
  )
  // Pastikan kandidat benar-benar BUKAN serialisasi Task_List valid.
  .filter((raw) => !isValidSerializedTaskList(raw));

describe('Property-based: loadTasks robust terhadap data rusak', () => {
  // Feature: todolist-app, Property 13: Pemuatan robust terhadap data rusak
  it('mengembalikan daftar kosong dengan corrupted:true tanpa melempar untuk data rusak (Req 6.4)', () => {
    fc.assert(
      fc.property(corruptRawArb, (raw) => {
        // Prasyarat generator: kandidat bukan serialisasi Task_List valid.
        expect(isValidSerializedTaskList(raw)).toBe(false);

        // Simpan string rusak pada STORAGE_KEY.
        globalThis.localStorage.setItem(STORAGE_KEY, raw);

        // loadTasks tidak boleh melempar.
        let result;
        expect(() => {
          result = loadTasks();
        }).not.toThrow();

        // Hasil: daftar kosong dengan corrupted:true.
        expect(result.corrupted).toBe(true);
        expect(result.tasks).toEqual([]);

        // Data lama tidak dihapus (non-destruktif).
        expect(globalThis.localStorage.getItem(STORAGE_KEY)).toBe(raw);
      }),
      { numRuns: 100 },
    );
  });
});
