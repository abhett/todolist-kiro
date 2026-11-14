# Product

## Ringkasan

Todo_App adalah aplikasi todolist sederhana berbasis frontend yang berjalan sepenuhnya di peramban tanpa backend. Pengguna mengelola daftar tugas harian: menambah, melihat, menandai selesai/belum selesai, mengedit, dan menghapus tugas. Seluruh data disimpan secara lokal di peramban (localStorage) sehingga tetap bertahan setelah halaman dimuat ulang.

## Pengguna & Tujuan

Pengguna individu yang ingin mencatat dan melacak pekerjaan harian secara ringan, tanpa akun, server, atau koneksi internet.

## Kapabilitas Inti

- **Menambah tugas** dengan validasi teks (1–500 karakter setelah dipangkas spasi).
- **Melihat daftar** dalam urutan pembuatan, dengan penanda visual coretan (strikethrough) untuk tugas selesai dan pesan kosong saat belum ada tugas.
- **Menandai status** selesai/belum selesai (toggle).
- **Mengedit teks tugas** dengan validasi dan opsi batal; id dan status dipertahankan.
- **Menghapus tugas** dengan konfirmasi terlebih dahulu.
- **Persistensi lokal** via localStorage, tahan terhadap data rusak dan kegagalan penyimpanan.

## Prinsip Produk

- **Sederhana lebih diutamakan**: fitur minimal, tanpa kompleksitas yang tidak perlu.
- **Non-destruktif**: kegagalan (data rusak, penyimpanan penuh) tidak boleh menghapus data pengguna; aplikasi tetap dapat dioperasikan.
- **Umpan balik jelas**: validasi dan kesalahan ditampilkan ke pengguna melalui pesan yang spesifik.
- **Bahasa UI**: Bahasa Indonesia.
