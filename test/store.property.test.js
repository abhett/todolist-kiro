// Property-based tests untuk lapisan persistensi (store.js).
// Dijalankan via Vitest dengan fast-check (minimum 100 iterasi).
// Menggunakan localStorage tiruan (in-memory) pada globalThis sehingga round-trip
// diuji tanpa bergantung pada peramban nyata.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { saveTasks, loadTasks } from '../src/store.js';

// Implementasi localStorage tiruan (in-memory): hanya menyimpan string pada Map,
// meniru kontrak getItem/setItem/removeItem yang dipakai store.js.
function createMemoryLocalStorage() {
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

// Generator satu Task valid: id & text string, completed boolean.
const taskArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 30 }),
  text: fc.string({ minLength: 0, maxLength: 60 }),
  completed: fc.boolean(),
});

// Generator Task_List valid: array Task (termasuk kosong). Urutan dipertahankan
// apa adanya untuk memverifikasi round-trip menjaga urutan persis.
const taskListArb = fc.array(taskArb, { minLength: 0, maxLength: 50 });

describe('Property-based: round-trip persistensi (store.js)', () => {
  let originalLocalStorage;

  beforeEach(() => {
    originalLocalStorage = globalThis.localStorage;
    globalThis.localStorage = createMemoryLocalStorage();
  });

  afterEach(() => {
    globalThis.localStorage = originalLocalStorage;
  });

  // Feature: todolist-app, Property 12: Round-trip persistensi mempertahankan daftar dan urutan
  it('saveTasks lalu loadTasks menghasilkan Task_List setara termasuk urutan persis (Req 6.1, 6.2)', () => {
    fc.assert(
      fc.property(taskListArb, (list) => {
        // Mulai dari store bersih tiap iterasi agar hasil deterministik.
        globalThis.localStorage.clear();

        const saveResult = saveTasks(list);
        expect(saveResult.ok).toBe(true);

        const { tasks, corrupted } = loadTasks();

        // Data valid tidak dianggap rusak.
        expect(corrupted).toBe(false);

        // Task_List hasil muat setara dengan input, termasuk urutan persis.
        expect(tasks).toEqual(list);
        expect(tasks).toHaveLength(list.length);
        expect(tasks.map((task) => task.id)).toEqual(list.map((task) => task.id));
      }),
      { numRuns: 100 },
    );
  });
});
