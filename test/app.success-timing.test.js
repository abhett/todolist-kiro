// @vitest-environment jsdom
//
// Unit test controller (Task 7.3): jalur sukses input dan timing.
// - Input dikosongkan setelah add sukses (Req 1.3).
// - Indikator visual (kelas .completed) diperbarui sinkron setelah toggle,
//   jauh di bawah batas 200 ms (Req 3.3).
// - Baris Task hilang sinkron setelah hapus (jalur konfirmasi), jauh di bawah
//   batas 500 ms (Req 5.4).
//
// Controller (app.js) berinteraksi dengan DOM melalui id pada index.html
// (#task-form, #task-input, #task-list, #nb-error-area) dan dengan Task_Store
// melalui localStorage (globalThis.localStorage). Kedua hal tersebut disiapkan
// di sini: DOM nyata via jsdom dan localStorage tiruan in-memory.
import { describe, it, expect, beforeEach } from 'vitest';
import {
  init,
  handleToggle,
  handleDelete,
  getTaskList,
  getElements,
} from '../src/app.js';
import { STORAGE_KEY } from '../src/store.js';

// localStorage tiruan in-memory: cukup untuk store.js (getItem/setItem) dan
// terisolasi antar-test. Dipasang ke globalThis agar store.js memakainya.
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

// Bangun DOM yang cocok dengan kontrak id index.html lalu jalankan init.
function setupDom() {
  document.body.innerHTML = `
    <form id="task-form">
      <input id="task-input" type="text" />
      <button type="submit">Tambah</button>
    </form>
    <ul id="task-list"></ul>
    <div id="nb-error-area" hidden></div>
  `;
}

// Submit form seperti pengguna menekan "Tambah" untuk memicu handleAdd.
function submitWith(text) {
  const input = document.getElementById('task-input');
  input.value = text;
  const form = document.getElementById('task-form');
  form.dispatchEvent(new window.Event('submit', { cancelable: true, bubbles: true }));
}

beforeEach(() => {
  // jsdom mendefinisikan localStorage sebagai properti getter-only, jadi
  // pasang tiruan in-memory via defineProperty agar store.js memakainya.
  Object.defineProperty(globalThis, 'localStorage', {
    value: createMemoryLocalStorage(),
    configurable: true,
    writable: true,
  });
  setupDom();
  init(document);
});

describe('Controller - jalur sukses input (Req 1.3)', () => {
  it('mengosongkan kolom input setelah add sukses', () => {
    const input = document.getElementById('task-input');
    submitWith('Beli susu');

    // Add sukses: Task masuk ke state dan input dikosongkan (Req 1.3).
    expect(getTaskList()).toHaveLength(1);
    expect(getTaskList()[0].text).toBe('Beli susu');
    expect(input.value).toBe('');
  });

  it('merender baris Task baru ke dalam #task-list setelah add sukses', () => {
    submitWith('Tugas pertama');

    const list = document.getElementById('task-list');
    const rows = list.querySelectorAll('li.task-item');
    expect(rows).toHaveLength(1);
    expect(rows[0].querySelector('.task-text').textContent).toBe('Tugas pertama');
  });
});

describe('Controller - indikator visual toggle sinkron (Req 3.3)', () => {
  it('menambah lalu menghapus kelas .completed secara sinkron di bawah 200 ms', () => {
    submitWith('Kerjakan laporan');
    const id = getTaskList()[0].id;
    const list = document.getElementById('task-list');

    const rowBefore = list.querySelector('li.task-item[data-id="' + id + '"]');
    expect(rowBefore.classList.contains('completed')).toBe(false);

    // Toggle → selesai: baris yang dirender ulang harus memiliki .completed,
    // dan pembaruan terjadi sinkron (jauh di bawah 200 ms).
    const startOn = performance.now();
    handleToggle(id);
    const elapsedOn = performance.now() - startOn;

    const rowOn = list.querySelector('li.task-item[data-id="' + id + '"]');
    expect(rowOn.classList.contains('completed')).toBe(true);
    expect(getTaskList()[0].completed).toBe(true);
    expect(elapsedOn).toBeLessThan(200);

    // Toggle lagi → belum selesai: kelas .completed hilang, tetap sinkron.
    const startOff = performance.now();
    handleToggle(id);
    const elapsedOff = performance.now() - startOff;

    const rowOff = list.querySelector('li.task-item[data-id="' + id + '"]');
    expect(rowOff.classList.contains('completed')).toBe(false);
    expect(getTaskList()[0].completed).toBe(false);
    expect(elapsedOff).toBeLessThan(200);
  });
});

describe('Controller - penghapusan sinkron jalur konfirmasi (Req 5.4)', () => {
  it('menghapus baris Task dari tampilan secara sinkron di bawah 500 ms saat konfirmasi disetujui', () => {
    submitWith('Tugas untuk dihapus');
    const id = getTaskList()[0].id;
    const list = document.getElementById('task-list');
    expect(list.querySelector('li.task-item[data-id="' + id + '"]')).not.toBeNull();

    const start = performance.now();
    handleDelete(id);

    // handleDelete memunculkan overlay konfirmasi; setujui via tombol konfirmasi.
    const confirmBtn = document.querySelector('.nb-confirm__confirm');
    expect(confirmBtn).not.toBeNull();
    confirmBtn.dispatchEvent(new window.Event('click', { bubbles: true }));
    const elapsed = performance.now() - start;

    // Baris hilang dari tampilan dan dari state, sinkron (jauh di bawah 500 ms).
    expect(list.querySelector('li.task-item[data-id="' + id + '"]')).toBeNull();
    expect(getTaskList().some((t) => t.id === id)).toBe(false);
    expect(elapsed).toBeLessThan(500);
  });

  it('menampilkan pesan daftar kosong setelah menghapus satu-satunya Task', () => {
    submitWith('Satu-satunya tugas');
    const id = getTaskList()[0].id;

    handleDelete(id);
    document.querySelector('.nb-confirm__confirm').dispatchEvent(
      new window.Event('click', { bubbles: true }),
    );

    const list = document.getElementById('task-list');
    expect(list.querySelectorAll('li.task-item')).toHaveLength(0);
    expect(list.querySelector('[data-empty="true"]')).not.toBeNull();
  });
});

describe('Controller - sanity setup', () => {
  it('me-resolve elemen DOM dan memulai dengan Task_Store kosong', () => {
    expect(getElements().list).toBe(document.getElementById('task-list'));
    expect(getTaskList()).toEqual([]);
    // Belum ada operasi simpan pada init dengan store kosong.
    expect(globalThis.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
