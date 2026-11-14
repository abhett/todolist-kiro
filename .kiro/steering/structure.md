# Project Structure

## Tata Letak Direktori

```
todolist-app/
├── index.html        # Struktur halaman + kontainer UI
├── styles.css        # Gaya tampilan termasuk kelas .completed (strikethrough)
├── src/
│   ├── task.js       # Logika domain murni (tanpa DOM/localStorage)
│   ├── store.js      # Lapisan persistensi localStorage
│   ├── view.js       # Rendering DOM
│   └── app.js        # Controller / entry point
└── test/             # Property-based tests & unit tests
```

## Peran Tiap Lapisan

| Lapisan | File | Boleh bergantung pada |
|---------|------|-----------------------|
| Domain | `src/task.js` | (tidak ada — murni) |
| Persistence | `src/store.js` | `localStorage` |
| Presentation | `src/view.js` | DOM |
| Controller | `src/app.js` | `task.js`, `store.js`, `view.js` |

## Aturan Ketergantungan

- Lapisan domain tidak boleh mengimpor DOM maupun localStorage.
- Lapisan presentasi tidak menyimpan state aplikasi; menerima state + callback dari Controller.
- Hanya Controller (`app.js`) yang menghubungkan domain, store, dan view.

## Model Data

`Task` adalah plain object: `{ id: string (unik), text: string (1–500, ter-trim), completed: boolean }`. `Task_List` adalah `Task[]`; indeks array merepresentasikan urutan pembuatan (append ke akhir). Invarian: id unik, urutan pembuatan dipertahankan, maksimum 1000 Task ditampilkan.

## Konvensi Penamaan

- File: lowercase, satu modul per tanggung jawab.
- Fungsi domain memakai kata kerja jelas: `validateTaskText`, `addTask`, `toggleTask`, `editTask`, `deleteTask`, `generateId`.
- Fungsi store: `loadTasks`, `saveTasks`. Fungsi view: `renderTaskList`, `toDisplayText`, `showError`, `confirmDelete`.

## Lokasi Spec

Dokumen spec fitur berada di `.kiro/specs/todolist-app/` (requirements, design, tasks).
