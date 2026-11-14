# Implementation Plan: Todolist App

## Overview

Rencana implementasi ini memecah desain Todo_App menjadi langkah-langkah pengodean inkremental menggunakan vanilla JavaScript, HTML, dan CSS dengan persistensi `localStorage`. Setiap langkah dibangun di atas langkah sebelumnya dan diakhiri dengan proses wiring sehingga tidak ada kode yang menggantung atau terpisah.

Urutan implementasi mengikuti arsitektur berlapis: scaffolding proyek dan test runner lebih dulu, lalu logika domain murni (`task.js`), lapisan persistensi (`store.js`), lapisan presentasi (`view.js`), kemudian controller (`app.js`) yang menyatukan semuanya, diakhiri dengan `index.html`/`styles.css` serta pengujian jalur kegagalan. Pengujian berbasis properti menggunakan `fast-check` (minimum 100 iterasi) dijalankan melalui Vitest, dilengkapi unit/example test untuk interaksi UI, timing, dan jalur kegagalan.

## Tasks

- [x] 1. Siapkan struktur proyek dan test runner
  - Buat struktur direktori `src/` dan file placeholder `src/task.js`, `src/store.js`, `src/view.js`, `src/app.js`
  - Inisialisasi `package.json` dengan Vitest sebagai test runner dan `fast-check` serta `jsdom` sebagai devDependencies
  - Konfigurasikan Vitest (environment `jsdom` untuk test presentasi, mode `--run` untuk eksekusi tunggal)
  - _Requirements: 1.1, 6.1_

- [x] 2. Implementasi logika domain murni (`task.js`)
  - [x] 2.1 Implementasi validasi teks dan pembuatan id serta Task
    - Tulis konstanta `MIN_TEXT_LENGTH = 3`, `MAX_TEXT_LENGTH = 50`, dan `MAX_TASKS = 1000`
    - Tulis `validateTaskText(rawText)` yang mem-trim lalu mengembalikan `{ ok: true, value }` atau `{ ok: false, reason: 'empty' | 'too_short' | 'too_long' }`
    - Tulis `generateId(existingIds)` yang menghasilkan id unik terhadap `existingIds` dan `createTask(trimmedText, existingIds)`
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 4.1_

  - [x] 2.2 Implementasi operasi Task_List murni (add/toggle/edit/delete)
    - Tulis `addTask(taskList, rawText)` mengembalikan `{ ok, taskList?, reason? }`, selalu menghasilkan daftar baru (immutable)
    - Tulis `toggleTask(taskList, id)`, `editTask(taskList, id, rawText)`, dan `deleteTask(taskList, id)` yang mempertahankan invarian (id unik, urutan, status saat edit)
    - _Requirements: 1.1, 3.1, 3.2, 4.1, 4.3, 5.2_

  - [x] 2.3 Tulis property test untuk penambahan task valid
    - **Property 1: Penambahan task valid menumbuhkan daftar dengan teks ter-trim**
    - **Validates: Requirements 1.1**

  - [x] 2.4 Tulis property test untuk keunikan id
    - **Property 2: Setiap id pada Task_List unik**
    - **Validates: Requirements 1.2**

  - [x] 2.5 Tulis property test untuk penolakan teks kosong/whitespace dan kurang dari 3 karakter
    - **Property 3: Teks kosong/whitespace dan kurang dari 3 karakter ditolak**
    - Verifikasi kasus kosong/whitespace ditolak dengan `reason: 'empty'` dan kasus 1–2 karakter (setelah trim) ditolak dengan `reason: 'too_short'`, keduanya menjaga Task_List tetap tidak berubah
    - Generator harus menghasilkan string kosong/whitespace maupun string 1–2 karakter non-spasi, lalu menegaskan `reason` 'empty' dan 'too_short' secara berurutan
    - **Validates: Requirements 1.4**

  - [x] 2.6 Tulis property test untuk penolakan teks melebihi batas
    - **Property 4: Teks melebihi batas ditolak**
    - **Validates: Requirements 1.5**

  - [x] 2.7 Tulis property test untuk involusi toggle
    - **Property 8: Toggle bersifat involusi**
    - **Validates: Requirements 3.1, 3.2**

  - [x] 2.8 Tulis property test untuk edit yang mempertahankan id dan status
    - **Property 9: Edit memperbarui teks serta mempertahankan id dan status**
    - **Validates: Requirements 4.1, 4.3**

  - [x] 2.9 Tulis property test untuk penolakan edit tidak valid
    - **Property 10: Edit tidak valid ditolak tanpa mengubah Task**
    - **Validates: Requirements 4.2**

  - [x] 2.10 Tulis property test untuk penghapusan Task yang tepat
    - **Property 11: Delete menghapus Task yang tepat**
    - **Validates: Requirements 5.2**

- [x] 3. Checkpoint - Pastikan seluruh test logika domain lulus
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implementasi lapisan persistensi (`store.js`)
  - [x] 4.1 Implementasi load dan save dengan penanganan data rusak dan kuota
    - Tulis konstanta `STORAGE_KEY = 'todolist-app.tasks'`
    - Tulis `loadTasks()` yang mengembalikan `{ tasks, corrupted }`: daftar kosong `corrupted: false` saat `null`, daftar kosong `corrupted: true` tanpa menghapus data saat parse/bentuk tidak valid
    - Tulis `saveTasks(taskList)` yang membungkus `setItem` dalam `try/catch` dan mengembalikan `{ ok }` tanpa melempar
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 4.2 Tulis property test round-trip persistensi
    - **Property 12: Round-trip persistensi mempertahankan daftar dan urutan**
    - Gunakan `localStorage` tiruan (in-memory)
    - **Validates: Requirements 6.1, 6.2**

  - [x] 4.3 Tulis property test ketahanan terhadap data rusak
    - **Property 13: Pemuatan robust terhadap data rusak**
    - Gunakan generator string sembarang/rusak dengan `localStorage` tiruan
    - **Validates: Requirements 6.4**

  - [x] 4.4 Tulis unit test untuk store kosong dan gagal simpan kuota
    - Verifikasi `loadTasks` pada store kosong mengembalikan `{ tasks: [], corrupted: false }` (Req 6.3)
    - Mock `setItem` melempar `QuotaExceededError`, verifikasi `saveTasks` mengembalikan `{ ok: false }` tanpa melempar (Req 6.5)
    - _Requirements: 6.3, 6.5_

- [x] 5. Implementasi lapisan presentasi (`view.js`)
  - [x] 5.1 Implementasi fungsi render dan teks tampilan
    - Tulis `renderTaskList(container, taskList, handlers)` yang merender hingga 1000 Task sesuai urutan, menerapkan kelas `.completed`, dan menampilkan pesan kosong bila tidak ada Task
    - Tulis `toDisplayText(text)` yang memotong hingga 50 karakter dengan penanda tanpa mengubah input
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 5.5_

  - [x] 5.2 Implementasi pesan error dan dialog konfirmasi hapus
    - Tulis `showError(message)` non-destruktif dan `confirmDelete(onConfirm, onCancel)`
    - _Requirements: 1.4, 1.5, 2.4, 3.4, 4.2, 5.1, 5.3, 5.6, 6.5_

  - [x] 5.3 Tulis property test untuk urutan dan batas render
    - **Property 5: Urutan dan batas render dipertahankan**
    - Gunakan DOM tiruan (jsdom)
    - **Validates: Requirements 2.1**

  - [x] 5.4 Tulis property test untuk strikethrough sesuai status
    - **Property 6: Strikethrough sesuai Completion_Status**
    - **Validates: Requirements 2.3**

  - [x] 5.5 Tulis property test untuk pemotongan teks tampilan
    - **Property 7: Pemotongan teks tampilan tidak mengubah data**
    - **Validates: Requirements 2.5**

  - [x] 5.6 Tulis unit test untuk pesan daftar kosong dan dialog konfirmasi
    - Verifikasi pesan "belum ada tugas" tampil tanpa baris Task saat daftar kosong (Req 2.2, 5.5)
    - Verifikasi `confirmDelete` memunculkan dialog konfirmasi (Req 5.1)
    - _Requirements: 2.2, 5.1, 5.5_

- [x] 6. Checkpoint - Pastikan test persistensi dan presentasi lulus
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implementasi controller dan wiring (`app.js`)
  - [x] 7.1 Implementasi inisialisasi dan pemuatan state
    - Saat muat: panggil `loadTasks()`, set state Task_List, panggil `renderTaskList`; bila `corrupted: true` tampilkan pesan daftar tidak dapat ditampilkan lalu lanjut dengan daftar kosong
    - _Requirements: 2.4, 6.2, 6.3, 6.4_

  - [x] 7.2 Wiring aksi pengguna (add/toggle/edit/delete) dengan domain, store, dan view
    - Hubungkan event UI ke operasi domain murni → perbarui state → `saveTasks` → render
    - Add: kosongkan input saat sukses (Req 1.3), pertahankan input dan tampilkan pesan spesifik sesuai `reason` saat gagal (Req 1.4, 1.5)
    - Toggle/edit/delete: perbarui tampilan dalam batas waktu; delete memunculkan konfirmasi lebih dulu (Req 5.1–5.3); bila `saveTasks` gagal pertahankan state tampilan dan panggil `showError` (Req 3.4, 5.6, 6.5)
    - _Requirements: 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 4.1, 4.4, 5.1, 5.2, 5.3, 5.4, 6.1, 6.5_

  - [x] 7.3 Tulis unit test untuk jalur sukses input dan timing
    - Verifikasi input dikosongkan setelah add sukses (Req 1.3)
    - Verifikasi indikator visual diperbarui setelah toggle (render sinkron, di bawah 200 ms) (Req 3.3)
    - Verifikasi baris Task hilang setelah hapus (render sinkron, di bawah 500 ms) (Req 5.4)
    - _Requirements: 1.3, 3.3, 5.4_

  - [x] 7.4 Tulis unit test untuk jalur kegagalan dan pembatalan
    - Mock `setItem` melempar saat toggle, verifikasi status tampilan sebelumnya dipertahankan dan error tampil (Req 3.4)
    - Mock `setItem` melempar saat hapus, verifikasi Task dipertahankan dan error tampil (Req 5.6)
    - Batal edit: mulai edit lalu batalkan, verifikasi Task_Text tidak berubah (Req 4.4)
    - Batal konfirmasi hapus: picu hapus lalu batalkan, verifikasi Task tetap ada (Req 5.3)
    - Data rusak non-destruktif saat muat: verifikasi pesan error tampil dan key store tidak dihapus (Req 2.4)
    - _Requirements: 2.4, 3.4, 4.4, 5.3, 5.6_

- [x] 8. Implementasi HTML dan CSS
  - [x] 8.1 Buat `index.html` dengan kontainer UI dan pemuatan skrip
    - Tulis struktur halaman: form input Task_Text, tombol tambah, kontainer daftar Task, area pesan error; terapkan kelas CSS Neobrutalism pada elemen (input memakai `.nb-input`, tombol tambah memakai `.nb-btn .nb-btn--primary`, baris/kartu Task memakai `.nb-card`, area pesan error memakai `.nb-error`)
    - Muat modul `src/app.js` sebagai entry point
    - _Requirements: 1.1, 2.1, 2.2_

  - [x] 8.2 Buat `styles.css` dengan gaya Neobrutalism dan strikethrough
    - Terapkan gaya Neobrutalism: border hitam tebal (~3px solid #000), hard shadow (box-shadow offset tanpa blur, mis. 4px 4px 0 #000) dengan efek "ditekan" (transform translate + shadow mengecil) pada hover/active tombol, border-radius 0, dan tipografi tebal
    - Palet kontras tinggi: kuning terang (#FFE500/#FFD600) dan pink (#FF90E8/#FF5CA2) di atas latar krem/putih dengan border/teks hitam; tombol tambah kuning, aksen/sekunder pink, pesan error latar pink/merah
    - Definisikan kelas `.nb-card`, `.nb-btn`, `.nb-btn--primary`, `.nb-input`, `.nb-error`, serta gaya daftar, input, dan dialog konfirmasi hapus
    - Pertahankan kelas `.completed` dengan `text-decoration: line-through` (harus tetap terbaca di atas palet Neobrutalism)
    - _Requirements: 2.3_

- [x] 9. Checkpoint akhir - Pastikan seluruh test lulus
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tugas yang ditandai `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat.
- Setiap tugas mereferensikan kebutuhan spesifik untuk keterlacakan.
- Checkpoint memastikan validasi inkremental.
- Property test memvalidasi properti korektness universal (minimum 100 iterasi via `fast-check`, diberi tag `// Feature: todolist-app, Property {number}: {property_text}`).
- Unit test memvalidasi contoh spesifik, edge case, interaksi UI, timing, dan jalur kegagalan.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "4.1", "5.1", "5.2"] },
    { "id": 3, "tasks": ["2.3", "2.4", "2.5", "2.6", "2.7", "2.8", "2.9", "2.10", "4.2", "4.3", "4.4", "5.3", "5.4", "5.5", "5.6", "8.1", "8.2"] },
    { "id": 4, "tasks": ["7.1", "7.2"] },
    { "id": 5, "tasks": ["7.3", "7.4"] }
  ]
}
```
