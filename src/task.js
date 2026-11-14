// Domain Logic (task.js)
// Logika domain murni untuk Todo_App: validasi, pembuatan Task, dan operasi
// pada Task_List (add/toggle/edit/delete). Tidak bergantung pada DOM maupun
// localStorage.

// Batas panjang minimum Task_Text hasil trim (Req 1.4, 4.2).
export const MIN_TEXT_LENGTH = 3;

// Batas panjang maksimum Task_Text hasil trim (Req 1.1, 1.5, 4.1).
export const MAX_TEXT_LENGTH = 50;

// Batas jumlah Task yang ditampilkan (Req 2.1).
export const MAX_TASKS = 1000;

/**
 * Memvalidasi Task_Text mentah. Mem-trim spasi di awal/akhir lalu memeriksa
 * panjang hasil trim. Tidak melempar; selalu mengembalikan hasil terstruktur
 * agar Controller dapat memetakan `reason` ke pesan spesifik (Req 1.1, 1.4,
 * 1.5, 4.1).
 *
 * @param {string} rawText Teks mentah dari input pengguna.
 * @returns {{ ok: true, value: string } | { ok: false, reason: 'empty' | 'too_short' | 'too_long' }}
 */
export function validateTaskText(rawText) {
  const trimmed = String(rawText ?? '').trim();
  if (trimmed.length === 0) {
    return { ok: false, reason: 'empty' };
  }
  if (trimmed.length < MIN_TEXT_LENGTH) {
    return { ok: false, reason: 'too_short' };
  }
  if (trimmed.length > MAX_TEXT_LENGTH) {
    return { ok: false, reason: 'too_long' };
  }
  return { ok: true, value: trimmed };
}

/**
 * Menghasilkan id unik yang berbeda dari seluruh id pada `existingIds`.
 * Menggunakan `crypto.randomUUID()` bila tersedia, dengan retry untuk menjamin
 * keunikan; jika tidak tersedia, menggunakan kombinasi timestamp + counter +
 * random (Req 1.2).
 *
 * @param {Iterable<string>} [existingIds] Kumpulan id yang sudah dipakai.
 * @returns {string} id unik terhadap `existingIds`.
 */
export function generateId(existingIds) {
  const existing = existingIds instanceof Set ? existingIds : new Set(existingIds ?? []);

  const hasRandomUUID =
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function';

  let counter = 0;
  for (;;) {
    let candidate;
    if (hasRandomUUID) {
      candidate = globalThis.crypto.randomUUID();
    } else {
      const random = Math.random().toString(36).slice(2);
      candidate = `${Date.now().toString(36)}-${counter.toString(36)}-${random}`;
    }
    if (!existing.has(candidate)) {
      return candidate;
    }
    counter += 1;
  }
}

/**
 * Membuat Task baru dengan id unik terhadap `existingIds`. Mengembalikan objek
 * Task biasa `{ id, text, completed }` dengan `completed` bernilai `false`
 * (Req 1.1, 1.2).
 *
 * @param {string} trimmedText Task_Text hasil trim (sudah tervalidasi).
 * @param {Iterable<string>} [existingIds] Kumpulan id yang sudah dipakai.
 * @returns {{ id: string, text: string, completed: boolean }}
 */
export function createTask(trimmedText, existingIds) {
  return {
    id: generateId(existingIds),
    text: trimmedText,
    completed: false,
  };
}
/**
 * Menambahkan Task baru ke Task_List. Memvalidasi `rawText` terlebih dahulu;
 * bila tidak valid mengembalikan `{ ok: false, reason }` tanpa mengubah
 * `taskList`. Bila valid, membuat Task baru (id unik terhadap id yang ada,
 * `completed: false`) lalu mengembalikan Task_List BARU dengan Task tersebut
 * di-append ke akhir (mempertahankan urutan pembuatan). Tidak memutasi input
 * (Req 1.1, 1.2).
 *
 * @param {Array<{ id: string, text: string, completed: boolean }>} taskList
 * @param {string} rawText Teks mentah dari input pengguna.
 * @returns {{ ok: true, taskList: Array } | { ok: false, reason: 'empty' | 'too_short' | 'too_long' }}
 */
export function addTask(taskList, rawText) {
  const validation = validateTaskText(rawText);
  if (!validation.ok) {
    return { ok: false, reason: validation.reason };
  }

  const existingIds = taskList.map((task) => task.id);
  const newTask = createTask(validation.value, existingIds);

  return { ok: true, taskList: [...taskList, newTask] };
}

/**
 * Membalik Completion_Status Task dengan `id` yang cocok. Mengembalikan
 * Task_List BARU dengan Task yang cocok diganti objek baru ber-`completed`
 * terbalik; `id`, `text`, dan Task lain tidak berubah, urutan dipertahankan.
 * Bila tidak ada Task yang cocok, mengembalikan daftar baru yang setara (tanpa
 * perubahan). Tidak memutasi input (Req 3.1, 3.2).
 *
 * @param {Array<{ id: string, text: string, completed: boolean }>} taskList
 * @param {string} id Pengenal Task yang akan di-toggle.
 * @returns {Array<{ id: string, text: string, completed: boolean }>}
 */
export function toggleTask(taskList, id) {
  return taskList.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task,
  );
}

/**
 * Memperbarui Task_Text Task dengan `id` yang cocok. Memvalidasi `rawText`
 * terlebih dahulu; bila tidak valid mengembalikan `{ ok: false, reason }` tanpa
 * mengubah daftar (Req 4.2). Bila valid, mengembalikan Task_List BARU dengan
 * `text` Task yang cocok diganti nilai hasil trim, sementara `id` dan
 * `completed` dipertahankan; Task lain dan urutan tidak berubah. Tidak memutasi
 * input (Req 4.1, 4.3).
 *
 * @param {Array<{ id: string, text: string, completed: boolean }>} taskList
 * @param {string} id Pengenal Task yang akan diedit.
 * @param {string} rawText Teks mentah baru dari input pengguna.
 * @returns {{ ok: true, taskList: Array } | { ok: false, reason: 'empty' | 'too_short' | 'too_long' }}
 */
export function editTask(taskList, id, rawText) {
  const validation = validateTaskText(rawText);
  if (!validation.ok) {
    return { ok: false, reason: validation.reason };
  }

  const newList = taskList.map((task) =>
    task.id === id ? { ...task, text: validation.value } : task,
  );

  return { ok: true, taskList: newList };
}

/**
 * Menghapus Task dengan `id` yang cocok. Mengembalikan Task_List BARU tanpa
 * Task ber-`id` tersebut; Task lain dipertahankan dalam urutan semula dan
 * panjang berkurang tepat satu bila id ada. Tidak memutasi input (Req 5.2).
 *
 * @param {Array<{ id: string, text: string, completed: boolean }>} taskList
 * @param {string} id Pengenal Task yang akan dihapus.
 * @returns {Array<{ id: string, text: string, completed: boolean }>}
 */
export function deleteTask(taskList, id) {
  return taskList.filter((task) => task.id !== id);
}
