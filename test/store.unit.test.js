// Unit/example tests untuk lapisan persistensi (Task 4.4).
// Fokus: store kosong saat muat (Req 6.3) dan kegagalan simpan karena kuota
// terlampaui (Req 6.5). Menggunakan localStorage tiruan (in-memory) pada
// globalThis agar deterministik dan tidak bergantung pada peramban nyata.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadTasks, saveTasks, STORAGE_KEY } from '../src/store.js';

// localStorage tiruan sederhana berbasis Map, cukup untuk getItem/setItem/
// removeItem. Setiap instance terisolasi per test.
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

const originalLocalStorage = globalThis.localStorage;

afterEach(() => {
  // Pulihkan localStorage asli (bila ada) agar tidak membocorkan state antar file.
  if (originalLocalStorage === undefined) {
    delete globalThis.localStorage;
  } else {
    globalThis.localStorage = originalLocalStorage;
  }
});

describe('loadTasks pada store kosong (Req 6.3)', () => {
  beforeEach(() => {
    globalThis.localStorage = createMemoryLocalStorage();
  });

  it('mengembalikan daftar kosong dengan corrupted=false saat tidak ada data tersimpan', () => {
    const result = loadTasks();
    expect(result).toEqual({ tasks: [], corrupted: false });
  });

  it('mengembalikan daftar kosong dengan corrupted=false setelah key dikosongkan', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    globalThis.localStorage.removeItem(STORAGE_KEY);
    const result = loadTasks();
    expect(result).toEqual({ tasks: [], corrupted: false });
  });
});

describe('saveTasks saat kuota terlampaui (Req 6.5)', () => {
  it('mengembalikan { ok: false } tanpa melempar ketika setItem melempar QuotaExceededError', () => {
    const quotaError = new Error('quota exceeded');
    quotaError.name = 'QuotaExceededError';

    const store = createMemoryLocalStorage();
    store.setItem = () => {
      throw quotaError;
    };
    globalThis.localStorage = store;

    const taskList = [{ id: 'a', text: 'tugas pertama', completed: false }];

    let result;
    expect(() => {
      result = saveTasks(taskList);
    }).not.toThrow();
    expect(result).toEqual({ ok: false });
  });

  it('menyimpan dengan { ok: true } saat setItem berhasil', () => {
    globalThis.localStorage = createMemoryLocalStorage();
    const taskList = [{ id: 'a', text: 'tugas pertama', completed: false }];
    expect(saveTasks(taskList)).toEqual({ ok: true });
    expect(globalThis.localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(taskList));
  });
});
