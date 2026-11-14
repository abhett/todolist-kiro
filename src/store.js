// Persistence Layer (store.js)
// Membungkus localStorage: serialisasi/deserialisasi Task_List dengan
// penanganan data rusak dan kegagalan kuota. Tidak bergantung pada DOM maupun
// logika domain; semua fungsi mengembalikan hasil terstruktur tanpa melempar.

// Key tetap tempat Task_List diserialisasi pada localStorage (Req 6.1, 6.2).
export const STORAGE_KEY = 'todolist-app.tasks';

/**
 * Memeriksa apakah `value` memiliki bentuk Task yang valid, yakni objek biasa
 * dengan `id` bertipe string, `text` bertipe string, dan `completed` bertipe
 * boolean (Req 6.4, lihat Data Models pada design.md).
 *
 * @param {unknown} value Kandidat Task hasil parse.
 * @returns {boolean} `true` bila bentuk valid.
 */
function isValidTaskShape(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.text === 'string' &&
    typeof value.completed === 'boolean'
  );
}

/**
 * Memuat Task_List dari Task_Store. Tidak pernah melempar; selalu mengembalikan
 * hasil terstruktur agar Controller dapat menampilkan pesan bila perlu.
 *
 * - Bila `getItem` mengembalikan `null` (tidak ada data tersimpan), kembalikan
 *   daftar kosong dengan `corrupted: false` (Req 6.3).
 * - Bila `JSON.parse` gagal, hasil parse bukan array, atau ada elemen dengan
 *   bentuk Task tidak valid, kembalikan daftar kosong dengan `corrupted: true`
 *   TANPA menghapus data lama dari localStorage (Req 2.4, 6.4).
 * - Bila `localStorage` tidak tersedia (mis. `getItem` melempar), perlakukan
 *   sebagai rusak: daftar kosong dengan `corrupted: true` (Req 6.4).
 *
 * @returns {{ tasks: Array<{ id: string, text: string, completed: boolean }>, corrupted: boolean }}
 */
export function loadTasks() {
  let raw;
  try {
    raw = globalThis.localStorage.getItem(STORAGE_KEY);
  } catch {
    return { tasks: [], corrupted: true };
  }

  if (raw === null || raw === undefined) {
    return { tasks: [], corrupted: false };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { tasks: [], corrupted: true };
  }

  if (!Array.isArray(parsed) || !parsed.every(isValidTaskShape)) {
    return { tasks: [], corrupted: true };
  }

  const tasks = parsed.map((task) => ({
    id: task.id,
    text: task.text,
    completed: task.completed,
  }));

  return { tasks, corrupted: false };
}

/**
 * Menyimpan Task_List ke Task_Store. Membungkus `setItem` dalam `try/catch`
 * sehingga kegagalan apa pun (termasuk `QuotaExceededError` atau `localStorage`
 * tidak tersedia) menghasilkan `{ ok: false }` tanpa melempar. Pada sukses
 * mengembalikan `{ ok: true }` (Req 6.1, 6.5).
 *
 * @param {Array<{ id: string, text: string, completed: boolean }>} taskList
 * @returns {{ ok: boolean }}
 */
export function saveTasks(taskList) {
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(taskList));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
