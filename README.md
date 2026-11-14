# Todolist App

Aplikasi todolist sederhana berbasis frontend yang berjalan tanpa backend. Pengguna dapat mencatat, menandai, mengedit, dan menghapus tugas harian. Seluruh data disimpan secara lokal menggunakan `localStorage`, sehingga tetap tersedia setelah halaman dimuat ulang atau ditutup.

Proyek dibangun dengan vanilla JavaScript (ES Modules), HTML, dan CSS, tanpa framework. Arsitekturnya memisahkan logika domain murni dari persistensi dan presentasi, dan diverifikasi oleh rangkaian pengujian unit serta property-based testing.

## Fitur Utama

- **Menambah tugas** dengan validasi panjang teks 3 sampai 50 karakter (setelah pemangkasan spasi). Input yang terlalu pendek atau terlalu panjang ditolak dengan pesan yang jelas, dan isi input dipertahankan.
- **Melihat daftar tugas** dalam urutan pembuatan (paling awal ke paling akhir), dengan dukungan hingga 1000 tugas yang dirender.
- **Menandai status penyelesaian** (selesai / belum selesai). Tugas yang selesai ditampilkan dengan gaya coretan (strikethrough), dengan pembaruan visual seketika.
- **Mengedit teks tugas** sambil mempertahankan pengenal dan status penyelesaiannya. Pengeditan dapat dibatalkan tanpa mengubah data.
- **Menghapus tugas** melalui dialog konfirmasi. Pembatalan konfirmasi membiarkan tugas tetap utuh.
- **Persistensi lokal** otomatis ke `localStorage` pada setiap perubahan, dengan pemuatan kembali saat aplikasi dibuka.
- **Penanganan kesalahan yang aman**: data tersimpan yang rusak tidak dihapus dan aplikasi tetap berjalan dengan daftar kosong; kegagalan penyimpanan (mis. kuota terlampaui) mempertahankan tampilan dan memberi tahu pengguna bahwa perubahan belum tersimpan.
- **Pemotongan teks tampilan** untuk teks panjang tanpa mengubah data asli yang tersimpan.
- **Antarmuka bergaya Neobrutalism** (border tebal, hard shadow, kontras tinggi).

## Teknologi yang Digunakan

- **JavaScript (ES Modules)** - logika aplikasi, tanpa framework.
- **HTML5** - struktur antarmuka.
- **CSS3** - gaya visual Neobrutalism, termasuk indikator coretan untuk tugas selesai.
- **Web Storage API (`localStorage`)** - persistensi data lokal.
- **Vitest** - test runner untuk unit test dan property-based test.
- **fast-check** - pustaka property-based testing.
- **jsdom** - lingkungan DOM untuk pengujian lapisan presentasi.

## Struktur Proyek

```
todolist/
├── index.html          Titik masuk UI dan pemuatan skrip modul
├── styles.css          Gaya Neobrutalism dan indikator strikethrough
├── src/
│   ├── app.js          Controller/entry point; wiring domain, store, dan view
│   ├── task.js         Logika domain murni (validasi dan operasi Task_List)
│   ├── store.js        Lapisan persistensi berbasis localStorage
│   └── view.js         Lapisan presentasi (render, pesan, dialog konfirmasi)
├── test/               Unit test dan property-based test
├── vitest.config.js    Konfigurasi Vitest
└── package.json        Metadata proyek dan skrip npm
```

Pemisahan lapisan:

- `task.js` berisi logika murni dan tidak bergantung pada DOM maupun `localStorage`.
- `store.js` membungkus `localStorage` dan tidak pernah melempar; selalu mengembalikan hasil terstruktur.
- `view.js` hanya menangani rendering ke DOM dan tidak menyimpan state.
- `app.js` memegang Task_List sebagai satu sumber kebenaran dan mengoordinasikan ketiga lapisan di atas.

## Prasyarat

- [Node.js](https://nodejs.org/) versi 18 atau lebih baru (disertai npm) untuk menjalankan pengujian.
- Peramban web modern yang mendukung ES Modules dan `localStorage` untuk menjalankan aplikasi.

## Instalasi

Klona atau salin proyek, lalu pasang dependensi pengembangan:

```bash
npm install
```

Langkah ini hanya diperlukan untuk menjalankan pengujian. Aplikasi itu sendiri tidak memiliki dependensi runtime dan tidak memerlukan proses build.

## Menjalankan Aplikasi

Karena aplikasi memakai ES Modules, berkas harus disajikan melalui HTTP (bukan dibuka langsung dengan protokol `file://`). Gunakan server statis apa pun, misalnya:

```bash
npx serve .
```

Atau dengan modul bawaan Python:

```bash
python -m http.server 8000
```

Kemudian buka alamat yang ditampilkan (misalnya `http://localhost:8000`) di peramban. Jika menggunakan Laragon atau server lokal lain, arahkan document root atau akses melalui host virtual yang menunjuk ke folder proyek, lalu buka `index.html`.

## Menjalankan Pengujian

Jalankan seluruh pengujian satu kali:

```bash
npm test
```

Jalankan pengujian dalam mode pengawasan (watch) selama pengembangan:

```bash
npm run test:watch
```

Rangkaian pengujian mencakup unit test untuk setiap lapisan dan property-based test (menggunakan fast-check) untuk invarian domain seperti keunikan pengenal, involusi penandaan status, round-trip persistensi, dan ketahanan terhadap data rusak.

## Catatan Perilaku

- Teks tugas valid: 3 sampai 50 karakter setelah pemangkasan spasi.
- Daftar dirender hingga maksimum 1000 tugas.
- Data rusak di penyimpanan tidak dihapus; aplikasi melanjutkan dengan daftar kosong.
- Jika penyimpanan gagal, tampilan dipertahankan sebagai sumber kebenaran dan pengguna diberi tahu bahwa perubahan belum tersimpan.
