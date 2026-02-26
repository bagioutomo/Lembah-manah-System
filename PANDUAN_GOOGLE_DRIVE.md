# Panduan Integrasi Google Drive (LMK System)

Gunakan panduan ini untuk mengaktifkan fitur **Auto-Backup Cloud** dan **Auto-Excel to Drive**.

## 1. Persiapan Google Apps Script
1. Buka [Google Apps Script](https://script.google.com/home).
2. Buat Proyek Baru.
3. Paste kode script yang disediakan di chat asisten (fungsi `doPost`).
4. Beri nama proyek: `LMK_Cloud_Sync`.

## 2. Proses Deployment
1. Klik **Deploy** -> **New Deployment**.
2. Type: **Web App**.
3. Execute as: **Me** (Email Anda).
4. Who has access: **Anyone**.
5. Klik **Deploy** dan setujui izin keamanan (Authorize).
6. **Copy Web App URL** yang muncul.

## 3. Menghubungkan ke Aplikasi
1. Buka file `vite.config.ts`.
2. Tempelkan URL tersebut ke dalam variabel `process.env.GDRIVE_URL`.
3. Jalankan `npm run dev` atau build ulang aplikasi.

## 4. Hasil Kerja
* Setiap hari saat menu **Pusat Data** dibuka, sistem akan otomatis membuat folder `BACKUP_LEMBAH_MANAH` di Google Drive Anda.
* Di dalamnya akan berisi file `.json` (data database) dan `.xlsx` (rekap Excel siap cetak).

---
*Lembah Manah Management System - Automation Guide*