
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', 
  define: {
    // API KEY GEMINI
    'process.env.API_KEY': JSON.stringify('AIzaSyBpJOvie0FOOXZV-4I08veF1qxbESk678Y'),
    
    // CONFIG SUPABASE (Database Utama)
    'process.env.SUPABASE_URL': JSON.stringify('https://lwnbuoyvjjmjdvvfbhda.supabase.co'),
    'process.env.SUPABASE_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3bmJ1b3l2amptamR2dmZiaGRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MTgyMzYsImV4cCI6MjA4NjA5NDIzNn0.Ka3lFhr6-i0OMUlZH-tjNaqhgkU6WCLBBKG8rSgwwak'),
    
    // CONFIG GOOGLE DRIVE BRIDGE (3 Slot Wajib)
    // Mirror 1: Untuk pecah data ke Tab-Tab Google Sheets
    'process.env.GDRIVE_SHEET_URL': JSON.stringify('https://script.google.com/macros/s/AKfycbwRFreCBi8q663FztESgp_39teLHUNcsy_e61vspAQ_7xBoqcjf-nitgsMcHoFJTm_5tg/exec'),
    
    // Mirror 2 & Photo Vault: Untuk Backup JSON & Simpan Foto Resep
    'process.env.GDRIVE_JSON_URL': JSON.stringify('https://script.google.com/macros/s/AKfycbzGRn0yi2GZQWJxqw_EvjQNt8Zpr2LxW-eUo6F7MpQxBRHS_I0bd3X12Q4Y-ZvBQZW-/exec'),
    
    // Auto-Reporting: Untuk ekspor file Excel otomatis
    'process.env.GDRIVE_EXCEL_URL': JSON.stringify('https://script.google.com/macros/s/AKfycbzJ9MpTqK_pR1d13wQ_2BNnIIhZSKrfdG-d-J3D_GLR6kpGgfayVKHgMJmNoZ3OfAz2Tw/exec'),
    
    // CONFIG FIREBASE (Mirror 4)
    'process.env.FIREBASE_URL': JSON.stringify('https://lmk-management-recovery-2ab2b-default-rtdb.asia-southeast1.firebasedatabase.app/'),

    // CONFIG MYSQL (Mirror 3)
    'process.env.MYSQL_API_URL': JSON.stringify('https://lembahmanahsystem.com/api_lembah.php')
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
