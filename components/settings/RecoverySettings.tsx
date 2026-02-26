import React, { useState } from 'react';
import { ShieldAlert, RefreshCw, Database, Cloud, Server, AlertTriangle, Key, Loader2, CheckCircle2, Flame } from 'lucide-react';
import { storage } from '../../services/storageService';

interface Props {
  onRestore: (data: any) => void;
}

const RecoverySettings: React.FC<Props> = ({ onRestore }) => {
  const [password, setPassword] = useState('');
  const [selectedMirror, setSelectedMirror] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'ERROR' | 'SUCCESS'>('IDLE');

  const mirrors = [
    // Fix: Removed unnecessary 'as any' casting since methods now exist on storage object
    { id: 1, name: 'Cermin 1: Google Sheets Cloud', icon: <Cloud size={24}/>, fetcher: storage.fetchFromGoogleSheet, desc: 'Data tersinkron dari naskah digital Google.' },
    { id: 2, name: 'Cermin 2: Drive Snapshot JSON', icon: <Database size={24}/>, fetcher: storage.fetchFromGoogleDrive, desc: 'Cadangan snapshot harian dari folder Drive.' },
    { id: 3, name: 'Cermin 3: MySQL Relational Bridge', icon: <Server size={24}/>, fetcher: storage.fetchFromMySQL, desc: 'Data terstruktur dari server IDCloudHost.' },
    { id: 4, name: 'Cermin 4: Firebase Realtime DB', icon: <Flame size={24} className="text-orange-500" />, fetcher: storage.fetchFromFirebase, desc: 'Database NoSQL ultra-cepat untuk failover instan.' }
  ];

  const handleStartRecovery = async () => {
    const ownerPass = storage.getRolePasswords().OWNER;

    if (!selectedMirror) return alert("Pilih salah satu cermin cadangan terlebih dahulu!");
    if (password !== ownerPass) return alert("PIN Owner salah! Akses pemulihan ditolak.");

    if (!confirm("Bapak Yakin? Tindakan ini akan MENGHAPUS seluruh data sistem saat ini dan menggantinya dengan data dari cermin. Tidak ada data yang tertumpuk dobel, semua akan kembali ke kondisi cadangan.")) {
      return;
    }

    setIsProcessing(true);
    setStatus('IDLE');

    try {
      const fetcher = mirrors.find(m => m.id === selectedMirror)?.fetcher;
      if (!fetcher) throw new Error("Fetcher not found");

      const backupData = await fetcher();

      if (backupData && (backupData.categories || backupData.incomes)) {
        onRestore(backupData);
        setStatus('SUCCESS');
        alert("PEMULIHAN BERHASIL! Seluruh data sistem telah diperbarui dari cermin cadangan.");
        setPassword('');
        setSelectedMirror(null);
      } else {
        throw new Error("Data cadangan kosong atau API belum terhubung.");
      }
    } catch (e) {
      console.error(e);
      setStatus('ERROR');
      alert("Gagal melakukan recovery. Pastikan URL API Cermin sudah benar di pengaturan.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-950 rounded-[3.5rem] border border-red-100 dark:border-red-900/30 shadow-2xl p-10 space-y-10 animate-fade-in overflow-hidden relative">
      <div className="absolute top-0 right-0 p-12 opacity-[0.02] rotate-12 pointer-events-none">
        <RefreshCw size={240} className="text-red-600" />
      </div>

      <div className="flex items-center gap-6 relative z-10">
        <div className="p-4 bg-red-600 text-white rounded-[1.5rem] shadow-xl shadow-red-500/20">
          <ShieldAlert size={32}/>
        </div>
        <div>
          <h3 className="text-3xl font-black uppercase tracking-tighter dark:text-white">Emergency Recovery</h3>
          <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] mt-2">Sistem Pemulihan Data Menyeluruh</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {mirrors.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedMirror(m.id)}
            className={`p-6 rounded-[2.5rem] border-2 transition-all text-left flex flex-col gap-4 group ${
              selectedMirror === m.id 
              ? 'bg-red-50 dark:bg-red-900/20 border-red-600 shadow-lg' 
              : 'bg-gray-50 dark:bg-gray-900 border-transparent hover:border-gray-300'
            }`}
          >
            <div className={`p-3 rounded-2xl w-fit transition-colors ${
               selectedMirror === m.id ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-400 group-hover:text-red-600'
            }`}>
              {m.icon}
            </div>
            <div>
              <h4 className={`text-[11px] font-black uppercase tracking-widest ${selectedMirror === m.id ? 'text-red-700 dark:text-red-400' : 'text-gray-500'}`}>
                {m.name}
              </h4>
              <p className="text-[9px] font-medium text-gray-400 mt-1 leading-relaxed">
                {m.desc}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-gray-900 text-white p-10 rounded-[3rem] shadow-2xl relative z-10 space-y-8">
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex-1 space-y-3">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                 <Key size={14} className="text-red-500"/> Masukkan PIN Owner untuk Otorisasi
               </label>
               <input 
                 type="password"
                 value={password}
                 onChange={e => setPassword(e.target.value)}
                 placeholder="••••••••"
                 className="w-full bg-white/10 border-2 border-white/5 focus:border-red-600 rounded-2xl px-6 py-5 outline-none font-black text-2xl tracking-[0.5em] text-center transition-all placeholder:text-white/10"
               />
            </div>
            
            <button
               disabled={isProcessing || !password || !selectedMirror}
               onClick={handleStartRecovery}
               className={`px-12 py-6 rounded-[1.8rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl transition-all flex items-center gap-4 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
                 status === 'SUCCESS' ? 'bg-emerald-600' : 'bg-red-600 hover:bg-red-700'
               }`}
            >
               {isProcessing ? (
                 <><Loader2 size={24} className="animate-spin" /> Sedang Memulihkan...</>
               ) : status === 'SUCCESS' ? (
                 <><CheckCircle2 size={24} /> Berhasil Pulih</>
               ) : (
                 <><RefreshCw size={24} /> Jalankan Recovery</>
               )}
            </button>
         </div>

         <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex gap-4">
            <AlertTriangle size={24} className="text-amber-500 shrink-0 mt-1" />
            <p className="text-[10px] text-gray-400 font-medium leading-relaxed italic uppercase">
               <b>SISTEM CLEAN RECOVERY:</b> Seluruh data saat ini akan dihapus permanen dan digantikan oleh data murni dari cermin pilihan. Tidak ada duplikasi data, struktur database akan kembali 100% seperti semula.
            </p>
         </div>
      </div>
    </div>
  );
};

export default RecoverySettings;