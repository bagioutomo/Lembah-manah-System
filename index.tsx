import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Pastikan global process tersedia sebelum app dimuat
// Fix: Property 'process' does not exist on type 'Window & typeof globalThis'. Using 'as any' to safely check for process.
if (typeof window !== 'undefined' && !(window as any).process) {
    (window as any).process = { env: {} };
}

console.log("Index.tsx loading...");
const rootElement = document.getElementById('root');
console.log("Root element:", rootElement);

if (!rootElement) {
  console.error("Fatal: Elemen #root tidak ditemukan di index.html");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Terjadi kesalahan saat memuat aplikasi:", error);
    alert("Gagal memuat aplikasi: " + (error instanceof Error ? error.message : String(error)));
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: sans-serif;">
        <h2 style="color: red;">Gagal Memuat Aplikasi</h2>
        <p>Silakan refresh halaman atau hubungi pengembang.</p>
        <code style="font-size: 10px; color: gray;">${error instanceof Error ? error.message : 'Unknown error'}</code>
      </div>
    `;
  }
}