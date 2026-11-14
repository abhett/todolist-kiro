# Requirements Document

## Introduction

Dokumen ini mendefinisikan kebutuhan untuk aplikasi Todolist sederhana berbasis frontend. Aplikasi memungkinkan pengguna mengelola daftar tugas harian melalui peramban (browser) tanpa backend. Pengguna dapat menambah, melihat, menandai selesai/belum selesai, mengedit, dan menghapus tugas. Seluruh data tugas disimpan secara lokal di peramban menggunakan localStorage sehingga tetap tersedia setelah halaman dimuat ulang.

## Glossary

- **Todo_App**: Aplikasi frontend todolist yang berjalan di peramban dan mengelola daftar tugas.
- **Task**: Satu item tugas yang terdiri dari pengenal unik, teks deskripsi, dan status penyelesaian.
- **Task_List**: Kumpulan seluruh Task yang dikelola oleh Todo_App.
- **Task_Store**: Komponen penyimpanan lokal berbasis localStorage peramban yang menyimpan dan memuat Task_List.
- **Task_Text**: Teks deskripsi dari sebuah Task yang dimasukkan oleh pengguna.
- **Completion_Status**: Status penyelesaian sebuah Task, bernilai "selesai" (completed) atau "belum selesai" (active).

## Requirements

### Requirement 1: Menambah Tugas

**User Story:** Sebagai pengguna, saya ingin menambahkan tugas baru ke dalam daftar, agar saya dapat mencatat hal yang perlu dikerjakan.

#### Acceptance Criteria

1. WHEN pengguna mengirimkan Task_Text yang setelah pemangkasan spasi di awal dan akhir memiliki panjang 3 sampai 50 karakter, THE Todo_App SHALL membuat Task baru dengan Task_Text hasil pemangkasan tersebut, Completion_Status bernilai "belum selesai", dan menambahkannya ke Task_List.
2. WHEN Todo_App membuat Task baru, THE Todo_App SHALL menetapkan pengenal unik yang berbeda dari pengenal seluruh Task lain pada Task_List.
3. WHEN Todo_App berhasil menambahkan Task baru, THE Todo_App SHALL mengosongkan kolom input Task_Text.
4. IF pengguna mengirimkan Task_Text yang setelah pemangkasan spasi di awal dan akhir memiliki panjang kurang dari 3 karakter (termasuk 0 karakter), THEN THE Todo_App SHALL menolak penambahan, mempertahankan isi kolom input Task_Text, dan menampilkan pesan yang menyatakan bahwa teks tugas minimal 3 karakter.
5. IF pengguna mengirimkan Task_Text yang setelah pemangkasan spasi di awal dan akhir memiliki panjang lebih dari 50 karakter, THEN THE Todo_App SHALL menolak penambahan, mempertahankan isi kolom input Task_Text, dan menampilkan pesan yang menyatakan bahwa teks tugas melebihi batas 50 karakter.

### Requirement 2: Melihat Daftar Tugas

**User Story:** Sebagai pengguna, saya ingin melihat seluruh tugas yang telah saya buat, agar saya dapat mengetahui apa saja yang perlu dikerjakan.

#### Acceptance Criteria

1. WHEN Todo_App selesai dimuat, THE Todo_App SHALL menampilkan seluruh Task pada Task_List (hingga maksimum 1000 Task) beserta Task_Text dan Completion_Status masing-masing, diurutkan berdasarkan urutan pembuatan dari yang paling awal ke yang paling akhir.
2. WHILE Task_List tidak memuat satu pun Task setelah Todo_App selesai dimuat, THE Todo_App SHALL menampilkan pesan teks yang menyatakan bahwa belum ada tugas dan tidak menampilkan satu pun baris Task.
3. WHEN sebuah Task memiliki Completion_Status "selesai", THE Todo_App SHALL menampilkan Task_Text dari Task tersebut dengan gaya coretan (strikethrough) sehingga secara visual berbeda dari Task_Text berstatus "belum selesai" yang ditampilkan tanpa coretan.
4. IF proses pengambilan data Task gagal saat Todo_App dimuat, THEN THE Todo_App SHALL menampilkan pesan yang mengindikasikan bahwa daftar tugas tidak dapat ditampilkan dan tidak menghapus data Task yang tersimpan.
5. IF Task_Text sebuah Task melebihi 50 karakter, THEN THE Todo_App SHALL menampilkan Task_Text dalam bentuk terpotong hingga 50 karakter dengan penanda bahwa teks dipotong, tanpa mengubah Task_Text yang tersimpan.

### Requirement 3: Menandai Status Penyelesaian Tugas

**User Story:** Sebagai pengguna, saya ingin menandai tugas sebagai selesai atau belum selesai, agar saya dapat melacak kemajuan pekerjaan saya.

#### Acceptance Criteria

1. WHEN pengguna menandai sebuah Task yang berstatus "belum selesai", THE Todo_App SHALL mengubah Completion_Status Task tersebut menjadi "selesai".
2. WHEN pengguna menandai sebuah Task yang berstatus "selesai", THE Todo_App SHALL mengubah Completion_Status Task tersebut menjadi "belum selesai".
3. WHEN Completion_Status sebuah Task berubah, THE Todo_App SHALL memperbarui indikator visual Task tersebut agar sesuai dengan Completion_Status yang baru dalam waktu 200 milidetik.
4. IF pembaruan Completion_Status sebuah Task gagal, THEN THE Todo_App SHALL mempertahankan Completion_Status sebelumnya dan menampilkan indikasi kesalahan bahwa perubahan status tidak berhasil.

### Requirement 4: Mengedit Tugas

**User Story:** Sebagai pengguna, saya ingin mengubah teks tugas yang sudah ada, agar saya dapat memperbaiki kesalahan atau memperbarui detail tugas.

#### Acceptance Criteria

1. WHEN pengguna menyimpan Task_Text baru yang memiliki panjang 3 sampai 50 karakter setelah pemangkasan spasi untuk sebuah Task, THE Todo_App SHALL memangkas spasi di awal dan akhir lalu memperbarui Task_Text Task tersebut dengan nilai yang baru.
2. IF pengguna menyimpan Task_Text yang kosong, kurang dari 3 karakter, atau melebihi 50 karakter (setelah pemangkasan spasi) saat mengedit, THEN THE Todo_App SHALL menolak perubahan, mempertahankan Task_Text sebelumnya, dan menampilkan indikasi kesalahan yang menjelaskan bahwa teks tugas tidak valid.
3. WHEN Todo_App memperbarui Task_Text sebuah Task, THE Todo_App SHALL mempertahankan pengenal unik dan Completion_Status Task tersebut.
4. WHEN pengguna membatalkan proses pengeditan sebuah Task sebelum menyimpan, THE Todo_App SHALL mempertahankan Task_Text sebelumnya tanpa perubahan.

### Requirement 5: Menghapus Tugas

**User Story:** Sebagai pengguna, saya ingin menghapus tugas yang tidak lagi diperlukan, agar daftar tugas saya tetap relevan.

#### Acceptance Criteria

1. WHEN pengguna memilih untuk menghapus sebuah Task, THE Todo_App SHALL menampilkan permintaan konfirmasi yang meminta pengguna menyetujui atau membatalkan penghapusan.
2. WHEN pengguna menyetujui konfirmasi penghapusan sebuah Task, THE Todo_App SHALL menghapus Task tersebut dari Task_List.
3. WHEN pengguna membatalkan konfirmasi penghapusan sebuah Task, THE Todo_App SHALL mempertahankan Task tersebut di dalam Task_List tanpa perubahan.
4. WHEN Todo_App menghapus sebuah Task dari Task_List, THE Todo_App SHALL memperbarui tampilan dalam waktu paling lama 500 milidetik sehingga Task tersebut tidak lagi ditampilkan.
5. WHEN penghapusan sebuah Task menyebabkan Task_List menjadi kosong, THE Todo_App SHALL menampilkan pesan yang menyatakan bahwa belum ada tugas.
6. IF penghapusan sebuah Task gagal diselesaikan, THEN THE Todo_App SHALL mempertahankan Task tersebut di dalam Task_List dan menampilkan pesan kesalahan yang menunjukkan bahwa penghapusan tidak berhasil.

### Requirement 6: Menyimpan Tugas Secara Lokal

**User Story:** Sebagai pengguna, saya ingin tugas saya tetap tersimpan setelah menutup atau memuat ulang halaman, agar saya tidak kehilangan data tugas.

#### Acceptance Criteria

1. WHEN Task_List berubah akibat penambahan, pengeditan, penandaan status, atau penghapusan Task, THE Todo_App SHALL menyimpan seluruh Task_List ke Task_Store dalam waktu 1 detik setelah perubahan.
2. WHEN Todo_App dimuat, THE Todo_App SHALL memuat Task_List dari Task_Store dan menampilkan seluruh Task dalam urutan yang sama seperti saat terakhir disimpan.
3. IF Task_Store tidak memiliki data Task_List tersimpan saat Todo_App dimuat, THEN THE Todo_App SHALL menginisialisasi Task_List sebagai daftar kosong.
4. IF data pada Task_Store rusak atau tidak dapat diuraikan saat dimuat, THEN THE Todo_App SHALL menginisialisasi Task_List sebagai daftar kosong dan melanjutkan operasi.
5. IF penyimpanan Task_List ke Task_Store gagal karena Task_Store tidak tersedia atau kapasitasnya terlampaui, THEN THE Todo_App SHALL mempertahankan Task_List yang sedang ditampilkan dan menampilkan indikasi kesalahan yang memberitahu pengguna bahwa perubahan belum tersimpan.
