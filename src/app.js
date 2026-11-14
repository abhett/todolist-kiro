// App Controller (app.js)
// Entry point. Memegang Task_List sebagai satu sumber kebenaran (single source
// of truth) dan mengoordinasikan task.js, store.js, dan view.js.
//
// Task 7.1 (file ini): inisialisasi dan pemuatan state saat aplikasi dimuat.
// Wiring aksi pengguna (add/toggle/edit/delete) ditambahkan pada Task 7.2 —
// struktur di bawah sengaja menyimpan state di modul dan menyediakan referensi
// elemen DOM serta handler render agar Task 7.2 dapat memasang handler tanpa
// mengubah alur inisialisasi.

import { addTask, toggleTask, editTask, deleteTask } from './task.js';
import { loadTasks, saveTasks } from './store.js';
import { renderTaskList, showError, confirmDelete } from './view.js';

// Pesan saat data Task_Store rusak/tidak dapat diuraikan (Req 2.4, 6.4).
export const CORRUPTED_MESSAGE =
  'Daftar tugas tidak dapat ditampilkan.';

// Pemetaan reason hasil validasi domain ke pesan spesifik untuk pengguna
// (Req 1.4, 1.5, 4.2). Lihat bagian "Error Handling" pada design.md.
export const VALIDATION_MESSAGES = {
  empty: 'Teks tugas tidak boleh kosong.',
  too_short: 'Teks tugas minimal 3 karakter.',
  too_long: 'Teks tugas melebihi batas 50 karakter.',
};

// Pesan umum saat penyimpanan ke Task_Store gagal setelah sebuah operasi
// (Req 3.4, 5.6, 6.5). State tampilan diperlakukan sebagai sumber kebenaran.
export const SAVE_FAILED_MESSAGE = 'Perubahan belum tersimpan.';

// Id elemen DOM sesuai kontrak di index.html.
export const DOM_IDS = {
  form: 'task-form',
  input: 'task-input',
  list: 'task-list',
  errorArea: 'nb-error-area',
};

// Satu sumber kebenaran untuk state controller. Operasi domain selalu
// menghasilkan Task_List baru (immutable update); state ini diganti, bukan
// dimutasi in-place. Disimpan di level modul agar handler Task 7.2 dapat
// membaca/memperbaruinya.
let taskList = [];

// Referensi elemen DOM yang di-resolve saat init. Dipakai bersama oleh render
// dan (nanti) handler aksi pengguna.
let elements = {
  form: null,
  input: null,
  list: null,
  errorArea: null,
};

/**
 * Mengembalikan Task_List saat ini (single source of truth). Disediakan agar
 * handler Task 7.2 dan pengujian dapat membaca state tanpa mengakses variabel
 * modul secara langsung.
 *
 * @returns {Array<{ id: string, text: string, completed: boolean }>}
 */
export function getTaskList() {
  return taskList;
}

/**
 * Mengganti Task_List saat ini dengan daftar baru. Operasi domain menghasilkan
 * daftar baru; fungsi ini menetapkannya sebagai state terbaru (immutable
 * update, bukan mutasi in-place). Disediakan untuk dipakai handler Task 7.2.
 *
 * @param {Array<{ id: string, text: string, completed: boolean }>} newList
 * @returns {void}
 */
export function setTaskList(newList) {
  taskList = Array.isArray(newList) ? newList : [];
}

/**
 * Me-resolve elemen DOM berdasarkan id pada {@link DOM_IDS} dari `doc` lalu
 * menyimpannya untuk dipakai render dan handler. Dipisah agar Task 7.2 dapat
 * memasang event listener pada elemen yang sama.
 *
 * @param {Document} [doc] Document sumber (default: `document` global).
 * @returns {typeof elements}
 */
export function resolveElements(doc = document) {
  elements = {
    form: doc.getElementById(DOM_IDS.form),
    input: doc.getElementById(DOM_IDS.input),
    list: doc.getElementById(DOM_IDS.list),
    errorArea: doc.getElementById(DOM_IDS.errorArea),
  };
  return elements;
}

/**
 * Mengembalikan elemen DOM yang sudah di-resolve. Disediakan untuk handler
 * Task 7.2 dan pengujian.
 *
 * @returns {typeof elements}
 */
export function getElements() {
  return elements;
}

/**
 * Merender Task_List saat ini ke kontainer `#task-list`. Handler aksi default
 * (onToggle/onEdit/onDelete) berasal dari {@link getHandlers}; argumen
 * `handlers` dapat menimpanya bila diperlukan (mis. pengujian).
 *
 * @param {{ onToggle?: (id: string) => void, onEdit?: (id: string) => void, onDelete?: (id: string) => void }} [handlers]
 * @returns {void}
 */
export function render(handlers = getHandlers()) {
  renderTaskList(elements.list, taskList, handlers);
}

/**
 * Menyimpan Task_List ke Task_Store lalu memperbarui tampilan dari state
 * terbaru. Alur bersama untuk seluruh mutasi (add/toggle/edit/delete):
 * state di-set lebih dulu, lalu disimpan. Bila `saveTasks` mengembalikan
 * `{ ok: false }`, state tampilan dipertahankan sebagai sumber kebenaran dan
 * pesan {@link SAVE_FAILED_MESSAGE} ditampilkan tanpa me-rollback perubahan
 * (Req 3.4, 5.6, 6.1, 6.5). Selalu me-render sinkron sehingga pembaruan visual
 * jauh di bawah batas waktu toggle (200 ms, Req 3.3) dan hapus (500 ms, Req 5.4).
 *
 * @param {Array<{ id: string, text: string, completed: boolean }>} newList
 * @returns {{ ok: boolean }}
 */
function commit(newList) {
  setTaskList(newList);
  const result = saveTasks(getTaskList());
  render();
  if (!result.ok) {
    showError(SAVE_FAILED_MESSAGE);
  }
  return result;
}

/**
 * Menambahkan Task baru dari nilai kolom input (dipicu submit form).
 * Pada sukses: kosongkan input dan bersihkan pesan error (Req 1.3). Pada gagal
 * validasi: pertahankan isi input dan tampilkan pesan spesifik sesuai `reason`
 * (Req 1.4, 1.5).
 *
 * @returns {void}
 */
export function handleAdd() {
  const input = elements.input;
  const rawText = input ? input.value : '';

  const result = addTask(getTaskList(), rawText);
  if (!result.ok) {
    // Pertahankan isi input, tampilkan pesan spesifik (Req 1.4, 1.5).
    showError(VALIDATION_MESSAGES[result.reason] ?? VALIDATION_MESSAGES.empty);
    return;
  }

  commit(result.taskList);
  // Add berhasil: kosongkan input dan bersihkan pesan error (Req 1.3).
  if (input) {
    input.value = '';
  }
  showError('');
}

/**
 * Membalik Completion_Status sebuah Task lalu menyimpan dan me-render ulang
 * (Req 3.1, 3.2, 3.3). Bila penyimpanan gagal, state tampilan dipertahankan
 * dan error ditampilkan via {@link commit} (Req 3.4).
 *
 * @param {string} id Pengenal Task yang di-toggle.
 * @returns {void}
 */
export function handleToggle(id) {
  commit(toggleTask(getTaskList(), id));
}

/**
 * Mengedit Task_Text sebuah Task. Teks baru diminta melalui prompt peramban;
 * membatalkan prompt (mengembalikan `null`) membiarkan Task tanpa perubahan
 * (Req 4.4). Teks baru divalidasi via domain `editTask`: bila tidak valid,
 * Task dipertahankan dan pesan spesifik ditampilkan (Req 4.2); bila valid,
 * teks diperbarui (dengan trim) sementara id dan status dipertahankan lalu
 * disimpan dan di-render (Req 4.1).
 *
 * @param {string} id Pengenal Task yang diedit.
 * @param {(message: string, defaultValue: string) => (string | null)} [promptFn]
 *   Fungsi prompt yang dapat disuntik untuk pengujian (default: `window.prompt`).
 * @returns {void}
 */
export function handleEdit(id, promptFn) {
  const current = getTaskList().find((task) => task.id === id);
  if (!current) {
    return;
  }

  const ask =
    typeof promptFn === 'function'
      ? promptFn
      : typeof globalThis.prompt === 'function'
        ? globalThis.prompt.bind(globalThis)
        : null;

  // Tanpa mekanisme prompt, tidak ada input edit yang bisa diambil.
  if (!ask) {
    return;
  }

  const nextText = ask('Ubah teks tugas:', current.text);

  // Pembatalan edit: pertahankan Task_Text sebelumnya tanpa perubahan (Req 4.4).
  if (nextText === null) {
    return;
  }

  const result = editTask(getTaskList(), id, nextText);
  if (!result.ok) {
    // Teks tidak valid: pertahankan Task, tampilkan pesan spesifik (Req 4.2).
    showError(VALIDATION_MESSAGES[result.reason] ?? VALIDATION_MESSAGES.empty);
    return;
  }

  commit(result.taskList);
  showError('');
}

/**
 * Memulai penghapusan sebuah Task. Memunculkan dialog konfirmasi lebih dulu;
 * Task hanya dihapus bila pengguna menyetujui (Req 5.1, 5.2). Membatalkan
 * konfirmasi membiarkan Task tetap ada tanpa perubahan (Req 5.3). Pada konfirmasi,
 * daftar diperbarui, disimpan, dan di-render sinkron (Req 5.4); bila penyimpanan
 * gagal, Task yang ditampilkan dipertahankan dan error ditampilkan (Req 5.6).
 *
 * @param {string} id Pengenal Task yang akan dihapus.
 * @returns {void}
 */
export function handleDelete(id) {
  confirmDelete(
    () => {
      commit(deleteTask(getTaskList(), id));
    },
    () => {
      // Batal: tidak ada perubahan pada Task_List (Req 5.3).
    },
  );
}

/**
 * Mengembalikan kumpulan handler aksi untuk diteruskan ke lapisan presentasi.
 * Dipisah agar `render` memasang handler yang sama secara konsisten dan agar
 * pengujian dapat memeriksa wiring.
 *
 * @returns {{ onToggle: (id: string) => void, onEdit: (id: string) => void, onDelete: (id: string) => void }}
 */
export function getHandlers() {
  return {
    onToggle: handleToggle,
    onEdit: handleEdit,
    onDelete: handleDelete,
  };
}

/**
 * Inisialisasi aplikasi saat dimuat (Req 2.4, 6.2, 6.3, 6.4):
 * - Me-resolve elemen DOM sesuai id pada index.html.
 * - Memuat Task_List via `loadTasks()` dan menjadikannya state awal.
 * - Bila data rusak (`corrupted: true`), menampilkan pesan bahwa daftar tidak
 *   dapat ditampilkan lalu melanjutkan dengan daftar kosong tanpa menghapus
 *   data tersimpan (penanganan non-destruktif ditangani di store.js).
 * - Merender Task_List ke kontainer `#task-list`.
 *
 * @param {Document} [doc] Document sumber (default: `document` global).
 * @returns {{ corrupted: boolean }}
 */
export function init(doc = document) {
  resolveElements(doc);

  // Pasang handler submit form untuk aksi tambah (Req 1.3, 1.4, 1.5). Mencegah
  // perilaku submit default agar halaman tidak dimuat ulang.
  if (elements.form) {
    elements.form.addEventListener('submit', (event) => {
      event.preventDefault();
      handleAdd();
    });
  }

  const { tasks, corrupted } = loadTasks();

  if (corrupted) {
    // Data rusak: lanjutkan dengan daftar kosong dan beri tahu pengguna.
    // store.js tidak menghapus data lama, menjaga sifat non-destruktif.
    setTaskList([]);
    showError(CORRUPTED_MESSAGE);
  } else {
    setTaskList(tasks);
  }

  render();

  return { corrupted };
}

// Jalankan inisialisasi otomatis di peramban (entry point <script type=module>).
// Dilewati pada lingkungan non-DOM (mis. pengujian unit modul) agar init dapat
// dipanggil secara eksplisit dengan document tiruan.
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }
}
