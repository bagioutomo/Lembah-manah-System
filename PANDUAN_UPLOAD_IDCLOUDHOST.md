
# Panduan Detail Sinkronisasi MySQL (IDCloudHost)

## Langkah 1: Setup Database di cPanel
1. Cari menu **MySQL Database Wizard**.
2. Buat database baru (catat namanya).
3. Buat user & password baru (catat).
4. Klik **All Privileges**.

## Langkah 2: Buat Tabel via phpMyAdmin
1. Buka **phpMyAdmin** -> klik database Anda.
2. Klik tab **SQL**.
3. Jalankan script `CREATE TABLE` yang disediakan di asisten.

## Langkah 3: Setup PHP Bridge
1. Di **File Manager**, buka `public_html`.
2. Buat file baru: `api_lembah.php`.
3. Paste kode PHP Bridge yang diberikan.
4. Sesuaikan `$db_name`, `$username`, dan `$password` di dalam file tersebut.

## Langkah 4: Hubungkan Aplikasi
1. Buka aplikasi Anda -> **Settings**.
2. Masukkan URL bridge Anda di kolom **Relational API Endpoint**.
   * Contoh: `https://domainanda.com/api_lembah.php`
3. Tekan **Simpan Koneksi**.
4. Klik tombol **Cloud Sync** di header untuk mengetes kiriman data.

---
*Lembah Manah Management System - Data Integration Guide*
