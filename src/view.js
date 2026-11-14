// Presentation Layer (view.js)
// Rendering Task_List ke DOM: strikethrough, pemotongan teks tampilan, pesan
// kosong/error, dan dialog konfirmasi hapus.
//
// Lapisan ini murni presentasional: menerima state (Task_List) + callback
// (handlers) dan menerapkan kelas CSS Neobrutalism, tanpa menyimpan state
// sendiri dan tanpa menyentuh logika domain maupun localStorage.

// Batas maksimum baris Task yang ditampilkan (Req 2.1).
export const MAX_RENDERED_TASKS = 1000;

// Batas panjang teks tampilan sebelum dipotong (Req 2.5).
export const DISPLAY_TEXT_LIMIT = 50;

// Penanda bahwa teks tampilan telah dipotong (Req 2.5).
export const TRUNCATION_MARKER = '\u2026'; // karakter ellipsis "…"

// Pesan yang tampil saat Task_List kosong (Req 2.2, 5.5).
export const EMPTY_MESSAGE = 'belum ada tugas';

/**
 * Menghasilkan teks tampilan untuk sebuah Task_Text. Bila teks asli melebihi
 * {@link DISPLAY_TEXT_LIMIT} karakter, hasil dipotong hingga batas tersebut
 * lalu diberi penanda pemotongan ({@link TRUNCATION_MARKER}); bila tidak,
 * teks dikembalikan apa adanya. Fungsi ini TIDAK mengubah input yang diteruskan
 * (string bersifat immutable di JavaScript, sehingga argumen asli tetap utuh)
 * dan hanya memengaruhi tampilan, bukan Task_Text tersimpan (Req 2.5).
 *
 * @param {string} text Task_Text asli.
 * @returns {string} Teks tampilan (dipotong + penanda bila melebihi batas).
 */
export function toDisplayText(text) {
  const value = String(text ?? '');
  if (value.length <= DISPLAY_TEXT_LIMIT) {
    return value;
  }
  return value.slice(0, DISPLAY_TEXT_LIMIT) + TRUNCATION_MARKER;
}

/**
 * Merender seluruh Task_List ke dalam `container`.
 *
 * Perilaku (Req 2.1, 2.2, 2.3, 2.5, 5.5):
 * - Mengosongkan `container` lalu merender Task sesuai urutan Task_List
 *   (pembuatan paling awal → paling akhir).
 * - Membatasi jumlah baris yang ditampilkan hingga {@link MAX_RENDERED_TASKS}.
 * - Menampilkan Task_Text melalui {@link toDisplayText} (dipotong bila > 50
 *   karakter) tanpa mengubah data tersimpan.
 * - Menerapkan kelas `.completed` pada baris Task berstatus "selesai".
 * - Bila Task_List kosong, menampilkan satu pesan kosong ({@link EMPTY_MESSAGE})
 *   dan TIDAK menampilkan satu pun baris Task.
 * - Menerapkan kelas Neobrutalism `.nb-card` pada setiap baris/kartu Task.
 *
 * `handlers` bersifat opsional dan hanya dipasang sebagai event listener;
 * lapisan ini tidak menjalankan logika domain sendiri.
 *
 * @param {HTMLElement} container Elemen induk tempat Task dirender.
 * @param {Array<{ id: string, text: string, completed: boolean }>} taskList
 * @param {{ onToggle?: (id: string) => void, onEdit?: (id: string) => void, onDelete?: (id: string) => void }} [handlers]
 * @returns {void}
 */
export function renderTaskList(container, taskList, handlers = {}) {
  if (!container) {
    return;
  }

  const list = Array.isArray(taskList) ? taskList : [];
  const { onToggle, onEdit, onDelete } = handlers;

  // Kosongkan tampilan sebelum render ulang (render dari state terbaru).
  container.replaceChildren();

  // Pesan daftar kosong, tanpa baris Task (Req 2.2, 5.5).
  if (list.length === 0) {
    const empty = container.ownerDocument.createElement('p');
    empty.className = 'nb-empty';
    empty.dataset.empty = 'true';
    empty.textContent = EMPTY_MESSAGE;
    container.appendChild(empty);
    return;
  }

  // Batasi jumlah Task yang ditampilkan (Req 2.1).
  const visible = list.slice(0, MAX_RENDERED_TASKS);
  const doc = container.ownerDocument;

  for (const task of visible) {
    const row = doc.createElement('li');
    row.className = 'nb-card task-item';
    row.dataset.id = task.id;
    if (task.completed) {
      // Strikethrough via CSS (Req 2.3).
      row.classList.add('completed');
    }

    // Checkbox toggle status penyelesaian (Req 3.1, 3.2 wiring di controller).
    const checkbox = doc.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-toggle';
    checkbox.checked = Boolean(task.completed);
    if (typeof onToggle === 'function') {
      checkbox.addEventListener('change', () => onToggle(task.id));
    }

    // Teks tampilan dipotong bila > 50 karakter; data asli tidak diubah (Req 2.5).
    const label = doc.createElement('span');
    label.className = 'task-text';
    label.textContent = toDisplayText(task.text);

    const editBtn = doc.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'nb-btn task-edit';
    editBtn.textContent = 'Edit';
    if (typeof onEdit === 'function') {
      editBtn.addEventListener('click', () => onEdit(task.id));
    }

    const deleteBtn = doc.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'nb-btn task-delete';
    deleteBtn.textContent = 'Hapus';
    if (typeof onDelete === 'function') {
      deleteBtn.addEventListener('click', () => onDelete(task.id));
    }

    row.append(checkbox, label, editBtn, deleteBtn);
    container.appendChild(row);
  }
}

// Id elemen area pesan error (dibuat on-demand bila belum ada di DOM).
const ERROR_CONTAINER_ID = 'nb-error-area';
// Id overlay dialog konfirmasi hapus (hanya satu dialog aktif pada satu waktu).
const CONFIRM_OVERLAY_ID = 'nb-confirm-overlay';

/**
 * Menampilkan pesan error non-destruktif memakai kelas Neobrutalism `.nb-error`.
 * Tidak mengubah/menyentuh data tersimpan maupun daftar Task yang dirender —
 * hanya memperbarui area pesan. Memanggil dengan pesan kosong/null akan
 * mengosongkan dan menyembunyikan area pesan.
 *
 * Mendukung Req 1.4, 1.5, 2.4, 3.4, 4.2, 5.6, 6.5 (penyampaian pesan error).
 *
 * @param {string} message Pesan error yang ditampilkan kepada pengguna.
 * @returns {HTMLElement} Elemen area pesan error.
 */
export function showError(message) {
  let area = document.getElementById(ERROR_CONTAINER_ID);
  if (!area) {
    area = document.createElement('div');
    area.id = ERROR_CONTAINER_ID;
    area.className = 'nb-error';
    area.setAttribute('role', 'alert');
    area.setAttribute('aria-live', 'assertive');
    document.body.appendChild(area);
  }

  const text = typeof message === 'string' ? message.trim() : '';
  if (text === '') {
    // Kosongkan dan sembunyikan tanpa menghapus elemen (non-destruktif).
    area.textContent = '';
    area.hidden = true;
    return area;
  }

  area.textContent = text;
  area.hidden = false;
  return area;
}

/**
 * Menampilkan dialog konfirmasi hapus bergaya Neobrutalism. Memanggil
 * `onConfirm` bila pengguna menyetujui dan `onCancel` bila pengguna
 * membatalkan; dialog ditutup pada kedua kasus. Tidak melakukan penghapusan
 * sendiri — keputusan diserahkan ke callback (Controller).
 *
 * Mendukung Req 5.1 (memunculkan konfirmasi) dan Req 5.3 (jalur pembatalan).
 *
 * @param {() => void} [onConfirm] Dipanggil saat pengguna menyetujui hapus.
 * @param {() => void} [onCancel] Dipanggil saat pengguna membatalkan hapus.
 * @returns {HTMLElement} Elemen overlay dialog konfirmasi.
 */
export function confirmDelete(onConfirm, onCancel) {
  // Pastikan hanya satu dialog aktif: buang overlay sebelumnya bila ada.
  const existing = document.getElementById(CONFIRM_OVERLAY_ID);
  if (existing) {
    existing.remove();
  }

  const overlay = document.createElement('div');
  overlay.id = CONFIRM_OVERLAY_ID;
  overlay.className = 'nb-confirm-overlay';

  const dialog = document.createElement('div');
  dialog.className = 'nb-card nb-confirm';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', 'Konfirmasi hapus tugas');

  const message = document.createElement('p');
  message.className = 'nb-confirm__message';
  message.textContent = 'Hapus tugas ini?';

  const actions = document.createElement('div');
  actions.className = 'nb-confirm__actions';

  const confirmBtn = document.createElement('button');
  confirmBtn.type = 'button';
  confirmBtn.className = 'nb-btn nb-btn--primary nb-confirm__confirm';
  confirmBtn.textContent = 'Hapus';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'nb-btn nb-confirm__cancel';
  cancelBtn.textContent = 'Batal';

  let settled = false;
  const close = () => {
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  };
  const settle = (callback) => {
    if (settled) return;
    settled = true;
    close();
    if (typeof callback === 'function') {
      callback();
    }
  };

  confirmBtn.addEventListener('click', () => settle(onConfirm));
  cancelBtn.addEventListener('click', () => settle(onCancel));
  // Klik di area luar dialog (backdrop) = batal, konsisten dengan Req 5.3.
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      settle(onCancel);
    }
  });

  actions.appendChild(cancelBtn);
  actions.appendChild(confirmBtn);
  dialog.appendChild(message);
  dialog.appendChild(actions);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  // Fokuskan tombol batal sebagai default aman.
  cancelBtn.focus();

  return overlay;
}
