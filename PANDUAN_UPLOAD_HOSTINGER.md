# Panduan Upload ke Hostinger (Lembah Manah System)

Ikuti langkah ini secara berurutan agar aplikasi berjalan lancar:

## 1. Persiapan Build (Di Laptop/PC)
1. Buka file `.env` di folder utama.
2. Pastikan `API_KEY=...` sudah terisi dengan kunci Gemini Anda.
3. Jalankan terminal dan ketik:
   ```bash
   npm run build
   ```
4. Setelah selesai, folder `dist` akan muncul.

## 2. Masuk ke hPanel Hostinger
1. Login ke [Hostinger](https://hpanel.hostinger.com).
2. Pilih menu **Hosting** -> **Kelola**.
3. Cari menu **File Manager**.

## 3. Proses Upload
1. Masuk ke folder `public_html`.
2. Hapus file bawaan Hostinger (seperti `default.php`).
3. Buka folder `dist` di komputer Anda.
4. **UPLOAD SEMUA ISI DALAM FOLDER DIST** ke `public_html`.
   * *Catatan: Pastikan file `.htaccess` ikut terupload.*

## 4. Cek Website
Buka domain Anda. Jika muncul error 404 saat refresh halaman, pastikan file `.htaccess` sudah ada di folder `public_html` bersama dengan `index.html`.

---
*Lembah Manah Management System - Deployment Guide*
