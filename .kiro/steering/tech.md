# Technology

## Stack

- **Bahasa**: Vanilla JavaScript (ES modules), HTML, CSS. Tanpa framework.
- **Persistensi**: `localStorage` peramban (key tunggal, mis. `todolist-app.tasks`, berisi `JSON.stringify(Task_List)`).
- **Build**: tidak ada build step wajib; file dapat dibuka langsung atau disajikan sebagai static files.

## Alasan Pilihan

Ruang lingkup kecil dan tanpa backend, sehingga framework akan menambah kompleksitas tanpa manfaat berarti. Logika inti diisolasi sebagai fungsi murni agar mudah diuji.

## Arsitektur

Aliran data satu arah (unidirectional): Event UI -> Controller memanggil operasi domain murni -> menghasilkan Task_List baru (immutable update) -> Controller menyimpan via store -> Controller memicu render ulang dari state terbaru. Task_List adalah satu sumber kebenaran yang dipegang Controller.

Pemisahan tanggung jawab:

- `src/task.js` — logika domain murni (validasi, add/toggle/edit/delete, pembuatan id). Tanpa DOM atau localStorage.
- `src/store.js` — lapisan persistensi; membungkus localStorage dengan penanganan data rusak & kuota.
- `src/view.js` — rendering DOM, strikethrough, pemotongan teks tampilan, pesan kosong/error.
- `src/app.js` — controller / entry point yang mengorkestrasi modul lain.

## Konvensi

- Operasi domain **tidak memutasi** input; selalu mengembalikan Task_List baru.
- Validasi mengembalikan hasil terstruktur (`{ ok, reason }`) alih-alih melempar exception.
- Lapisan persistensi menangkap semua kesalahan localStorage dan mengubahnya menjadi nilai hasil yang aman (`{ ok: false }`), tidak pernah melempar.
- Konstanta: `MAX_TEXT_LENGTH = 500`, `MAX_TASKS = 1000`.

## Pengujian

- **Property-based testing** dengan `fast-check` (minimum 100 iterasi per properti) untuk logika domain, fungsi tampilan murni, dan round-trip serialisasi.
- **Unit/example tests** untuk interaksi UI, timing, dan jalur kegagalan.
- Gunakan test runner ringan (Vitest atau Jest) dan `localStorage` tiruan (in-memory) untuk uji persistensi; DOM tiruan (jsdom) untuk uji presentasi.
- Beri tag setiap property test: `// Feature: todolist-app, Property {number}: {property_text}`.

## Perintah (PowerShell / Windows)

Sesuaikan setelah tooling dipilih. Contoh umum bila memakai npm + Vitest:

- Install dependency: `npm install`
- Jalankan test sekali (bukan watch): `npx vitest --run`
- Jalankan aplikasi: buka `index.html` di peramban, atau sajikan folder sebagai static (mis. `npx serve .`).

Catatan: hindari menjalankan perintah watch/dev server yang memblokir; gunakan mode `--run` untuk test.
