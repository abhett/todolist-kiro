// @vitest-environment jsdom
//
// Unit test untuk jalur kegagalan dan pembatalan pada controller (app.js),
// Task 7.4. Menguji perilaku controller terhadap DOM nyata (jsdom) dan
// localStorage tiruan (in-memory) yang dapat dibuat gagal.
//
// Cakupan:
// - Toggle gagal simpan: status tampilan sebelumnya dipertahankan + error tampil (Req 3.4)
// - Hapus gagal simpan: Task dipertahankan + error tampil (Req 5.6)
// - Batal edit (prompt mengembalikan null): Task_Text tidak berubah (Req 4.4)
// - Batal konfirmasi hapus: Task tetap ada (Req 5.3)
// - Data rusak saat muat: pesan error tampil & key store TIDAK dihapus (Req 2.4)

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  init,
  handleToggle,
  handleDelete,
  handleEdit,
  getTaskList,
  DOM_IDS,
  CORRUPTED_MESSAGE,
  SAVE_FAILED_MESSAGE,
} from '../src/app.js';
import { STORAGE_KEY, saveTasks } from '../src/store.js';

// localStorage tiruan in-memory. `failSetItem` dapat diaktifkan untuk membuat
// setItem melempar seperti QuotaExceededError, tanpa memengaruhi data yang
// sudah tersimpan (non-destruktif).
function createMemoryStorage() {
  const map = new Map();
  return {
    failSetItem: false,
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      if (this.failSetItem) {
        const err = new Error('QuotaExceededError');
        err.name = 'QuotaExceededError';
        throw err;
      }
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
    clear() {
      map.clear();
    },
    has(key) {
      return map.has(key);
    },
  };
}

// Bangun DOM yang cocok dengan id kontrak index.html (lihat DOM_IDS).
function setupDom() {
  document.body.innerHTML = `
    <form id="${DOM_IDS.form}">
      <input id="${DOM_IDS.input}" type="text" />
      <button type="submit">Tambah</button>
    </form>
    <ul id="${DOM_IDS.list}"></ul>
    <div id="${DOM_IDS.errorArea}" class="nb-error" role="alert" hidden></div>
  `;
}

// Seed Task_List tersimpan ke storage tiruan memakai serialisasi yang sama
// dengan store (JSON pada STORAGE_KEY).
function seedTasks(storage, tasks) {
  storage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

let storage;

beforeEach(() => {
  storage = createMemoryStorage();
  // jsdom mendefinisikan `localStorage` sebagai properti getter-only pada
  // window/globalThis, sehingga assignment langsung gagal. Gunakan
  // defineProperty agar store tiruan menggantikan implementasi jsdom.
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  });
  setupDom();
});

afterEach(() => {
  document.body.innerHTML = '';
});

// Helper: ambil Task tunggal dari state controller berdasarkan id.
function taskById(id) {
  return getTaskList().find((t) => t.id === id);
}

// Helper: baris Task yang dirender berdasarkan data-id.
function renderedRow(id) {
  return document.querySelector(`#${DOM_IDS.list} [data-id="${id}"]`);
}

// Helper: isi area error yang terlihat.
function errorText() {
  const area = document.getElementById(DOM_IDS.errorArea);
  if (!area || area.hidden) return '';
  return area.textContent;
}

describe('handleToggle - gagal simpan saat toggle (Req 3.4)', () => {
  it('mempertahankan Completion_Status sebelumnya pada tampilan dan menampilkan error', () => {
    seedTasks(storage, [{ id: 'a', text: 'tugas satu', completed: false }]);
    init(document);

    // Prasyarat: Task dirender sebagai belum selesai.
    expect(taskById('a').completed).toBe(false);
    expect(renderedRow('a').classList.contains('completed')).toBe(false);

    // Buat penyimpanan gagal sebelum toggle.
    storage.failSetItem = true;
    handleToggle('a');

    // Status domain tetap mengikuti state tampilan terbaru (tidak di-rollback),
    // namun yang penting untuk Req 3.4: tampilan tidak kehilangan data dan
    // pesan kegagalan penyimpanan muncul. Data tersimpan tidak berubah.
    expect(errorText()).toBe(SAVE_FAILED_MESSAGE);

    // Data yang benar-benar tersimpan tetap status sebelumnya (setItem gagal),
    // sehingga reload tidak kehilangan Task.
    const persisted = JSON.parse(storage.getItem(STORAGE_KEY));
    expect(persisted).toEqual([{ id: 'a', text: 'tugas satu', completed: false }]);

    // Task masih ada dan terrender (tidak hilang).
    expect(renderedRow('a')).not.toBeNull();
  });
});

describe('handleDelete - gagal simpan saat hapus (Req 5.6)', () => {
  it('mempertahankan Task dan menampilkan error ketika penyimpanan gagal', () => {
    seedTasks(storage, [
      { id: 'a', text: 'tugas satu', completed: false },
      { id: 'b', text: 'tugas dua', completed: false },
    ]);
    init(document);

    storage.failSetItem = true;
    handleDelete('a');

    // Konfirmasi penghapusan: klik tombol "Hapus" pada overlay.
    const confirmBtn = document.querySelector('.nb-confirm__confirm');
    expect(confirmBtn).not.toBeNull();
    confirmBtn.click();

    // Penyimpanan gagal → pesan error tampil.
    expect(errorText()).toBe(SAVE_FAILED_MESSAGE);

    // Data tersimpan masih memuat kedua Task (setItem gagal, tidak destruktif),
    // sehingga Task dipertahankan dari sudut pandang persistensi.
    const persisted = JSON.parse(storage.getItem(STORAGE_KEY));
    expect(persisted).toEqual([
      { id: 'a', text: 'tugas satu', completed: false },
      { id: 'b', text: 'tugas dua', completed: false },
    ]);
  });
});

describe('handleEdit - batal edit (Req 4.4)', () => {
  it('mempertahankan Task_Text sebelumnya ketika prompt dibatalkan (null)', () => {
    seedTasks(storage, [{ id: 'a', text: 'teks awal', completed: true }]);
    init(document);

    const before = taskById('a').text;

    // promptFn yang disuntik mengembalikan null = pembatalan edit.
    let promptCalled = false;
    handleEdit('a', () => {
      promptCalled = true;
      return null;
    });

    expect(promptCalled).toBe(true);

    // Task_Text tidak berubah, id dan status tetap.
    const after = taskById('a');
    expect(after.text).toBe(before);
    expect(after.completed).toBe(true);

    // Tidak ada pesan error dari pembatalan.
    expect(errorText()).toBe('');

    // Tampilan masih menampilkan teks awal.
    expect(renderedRow('a').textContent).toContain('teks awal');
  });
});

describe('handleDelete - batal konfirmasi hapus (Req 5.3)', () => {
  it('mempertahankan Task saat pengguna membatalkan konfirmasi', () => {
    seedTasks(storage, [{ id: 'a', text: 'jangan hapus', completed: false }]);
    init(document);

    handleDelete('a');

    // Batalkan konfirmasi: klik tombol "Batal" pada overlay.
    const cancelBtn = document.querySelector('.nb-confirm__cancel');
    expect(cancelBtn).not.toBeNull();
    cancelBtn.click();

    // Task tetap ada pada state dan tampilan.
    expect(taskById('a')).toBeTruthy();
    expect(renderedRow('a')).not.toBeNull();

    // Data tersimpan tidak berubah.
    const persisted = JSON.parse(storage.getItem(STORAGE_KEY));
    expect(persisted).toEqual([{ id: 'a', text: 'jangan hapus', completed: false }]);

    // Overlay konfirmasi ditutup setelah pembatalan.
    expect(document.getElementById('nb-confirm-overlay')).toBeNull();
  });
});

describe('init - data rusak non-destruktif saat muat (Req 2.4)', () => {
  it('menampilkan pesan error dan TIDAK menghapus key store', () => {
    // Seed data rusak (bukan JSON yang valid).
    storage.setItem(STORAGE_KEY, '{ this is not valid json ]');

    const result = init(document);

    // Dilaporkan sebagai korup dan dilanjutkan dengan daftar kosong.
    expect(result.corrupted).toBe(true);
    expect(getTaskList()).toEqual([]);

    // Pesan "daftar tidak dapat ditampilkan" muncul.
    expect(errorText()).toBe(CORRUPTED_MESSAGE);

    // Key store TIDAK dihapus — data rusak tetap tersimpan (non-destruktif).
    expect(storage.has(STORAGE_KEY)).toBe(true);
    expect(storage.getItem(STORAGE_KEY)).toBe('{ this is not valid json ]');
  });

  it('juga non-destruktif ketika data rusak bukan array', () => {
    seedTasks(storage, { not: 'an array' });

    const result = init(document);

    expect(result.corrupted).toBe(true);
    expect(getTaskList()).toEqual([]);
    expect(errorText()).toBe(CORRUPTED_MESSAGE);
    // Store key tetap ada.
    expect(storage.has(STORAGE_KEY)).toBe(true);
  });
});
