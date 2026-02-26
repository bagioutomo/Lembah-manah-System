
import React, { useState, useMemo } from 'react';
import { 
  ArrowLeftRight, 
  Search, 
  Calendar, 
  ChevronRight, 
  Trash2, 
  History, 
  Wallet,
  ArrowRight,
  Filter,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { TransferRecord, UserRole } from '../types';

interface Props {
  transfers: TransferRecord[];
  setTransfers: React.Dispatch<React.SetStateAction<TransferRecord[]>>;
  wallets: string[];
  userRole: UserRole;
}

const MutationLogs: React.FC<Props> = ({ transfers, setTransfers, wallets, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const isPurchasing = userRole === 'PURCHASING';
  const isSupervisor = userRole === 'SUPERVISOR';

  const filteredTransfers = useMemo(() => {
    const s = searchTerm.toLowerCase();
    
    let baseList = transfers;
    
    // Logika Filter Peran
    if (isPurchasing) {
      baseList = transfers.filter(t => t.toWallet === 'Purchasing');
    } else if (isSupervisor) {
      // Supervisor hanya melihat transaksi yang masuk atau keluar dari dompet "Supervisor"
      baseList = transfers.filter(t => t.fromWallet === 'Supervisor' || t.toWallet === 'Supervisor');
    }

    return baseList.filter(t => {
      const matchSearch = 
        (t.notes || '').toLowerCase().includes(s) || 
        (t.fromWallet || '').toLowerCase().includes(s) || 
        (t.toWallet || '').toLowerCase().includes(s);

      let matchDate = true;
      if (startDate) matchDate = matchDate && t.date >= startDate;
      if (endDate) matchDate = matchDate && t.date <= endDate;

      return matchSearch && matchDate;
    }).sort((a, b) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime());
  }, [transfers, searchTerm, startDate, endDate, isPurchasing, isSupervisor]);

  const totalMutationAmount = useMemo(() => {
    return filteredTransfers.reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransfers]);

  const formatCurrency = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

  const handleDelete = (id: string) => {
    if (confirm('Hapus record mutasi ini? Tindakan ini tidak akan mengembalikan saldo dompet secara otomatis. Lanjutkan?')) {
      setTransfers(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-600 text-white rounded-[1.5rem] shadow-xl shadow-indigo-600/20">
            <ArrowLeftRight size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
              {isPurchasing ? 'Monitoring Dana Masuk' : isSupervisor ? 'Monitoring Kas Lapangan' : 'Log Mutasi Dana'}
            </h2>
            <p className="text-sm text-gray-500 font-medium italic mt-2">
              {isPurchasing 
                ? 'Pantau riwayat transfer budget belanja dari tim Finance.' 
                : isSupervisor
                ? 'Pantau alur dana masuk dan keluar pada dompet operasional Supervisor.'
                : 'Audit jejak perpindahan saldo antar dompet internal perusahaan.'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <div className="lg:col-span-3 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row items-end gap-4">
               <div className="flex-1 w-full space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-1"><Search size={12}/> Cari {isPurchasing ? 'Penerimaan' : 'Transaksi'}</label>
                  <input 
                    type="text" 
                    placeholder={isPurchasing ? "Cari berita acara..." : "Cari berita atau nama dompet..."} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-3 outline-none font-bold text-sm transition-all"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-1"><Calendar size={12}/> Tanggal Awal</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none font-black text-xs uppercase" />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-1"><Calendar size={12}/> Tanggal Akhir</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none font-black text-xs uppercase" />
               </div>
               {(startDate || endDate || searchTerm) && (
                 <button onClick={() => { setStartDate(''); setEndDate(''); setSearchTerm(''); }} className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"><RotateCcw size={20}/></button>
               )}
            </div>
         </div>

         <div className="bg-indigo-600 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:rotate-12 transition-transform"><History size={100} /></div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">
              {isPurchasing ? 'Total Budget Diterima' : isSupervisor ? 'Akumulasi Mutasi Lapangan' : 'Akumulasi Mutasi'}
            </p>
            <h3 className="text-2xl font-black tracking-tighter">{formatCurrency(totalMutationAmount)}</h3>
            <div className="mt-4 flex items-center gap-2">
               <CheckCircle2 size={12} className="opacity-60" />
               <span className="text-[9px] font-black uppercase tracking-widest opacity-80">{filteredTransfers.length} Transaksi Terdata</span>
            </div>
         </div>
      </div>

      {/* Main Logs Table */}
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                <th className="px-8 py-5">Waktu Transaksi</th>
                <th className="px-8 py-5">Alur Perpindahan Dana</th>
                <th className="px-8 py-5">Berita Acara / Catatan</th>
                <th className="px-8 py-5 text-right">Nominal</th>
                {!isPurchasing && !isSupervisor && <th className="px-8 py-5 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {filteredTransfers.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-black uppercase italic tracking-widest">Belum ada aktivitas mutasi dana tercatat</td></tr>
              ) : (
                filteredTransfers.map(t => (
                  <tr key={t.id} className="hover:bg-indigo-50/5 transition-colors group">
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-400"><Calendar size={14}/></div>
                          <div>
                             <p className="text-xs font-black text-gray-900 dark:text-white uppercase leading-none mb-1">{new Date(t.date).toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric'})}</p>
                             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{new Date(t.timestamp).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})} WIB</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <div className="flex flex-col items-end">
                             <span className={`text-[10px] font-black uppercase ${t.fromWallet === 'Supervisor' ? 'text-orange-500' : 'text-red-500'}`}>{t.fromWallet}</span>
                             <span className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter">SUMBER</span>
                          </div>
                          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-full"><ArrowRight size={14}/></div>
                          <div className="flex flex-col items-start">
                             <span className={`text-[10px] font-black uppercase ${t.toWallet === 'Supervisor' ? 'text-orange-500' : 'text-green-600'}`}>{t.toWallet}</span>
                             <span className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter">PENERIMA</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-xs font-medium text-gray-500 dark:text-gray-400 italic truncate max-w-[250px] group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                         "{t.notes || (isPurchasing ? 'Drop Dana Purchasing' : 'Internal Transfer')}"
                       </p>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <p className="text-lg font-black text-indigo-600 tracking-tighter">{formatCurrency(t.amount)}</p>
                    </td>
                    {!isPurchasing && !isSupervisor && (
                      <td className="px-8 py-6 text-center">
                        <button onClick={() => handleDelete(t.id)} className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 size={16}/>
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Card */}
      <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-[2.5rem] flex gap-4">
         <AlertCircle size={24} className="text-blue-600 shrink-0 mt-1" />
         <div>
            <h4 className="text-sm font-black uppercase text-blue-900 dark:text-blue-400">
              {isPurchasing ? 'Verifikasi Fisik Uang' : isSupervisor ? 'Transparansi Dana Lapangan' : 'Verifikasi Alur Dana'}
            </h4>
            <p className="text-xs text-blue-800 dark:text-blue-500 font-medium leading-relaxed mt-1">
               {isPurchasing 
                 ? 'Setiap transfer yang muncul di sini berarti dana telah dialokasikan oleh Finance. Harap segera lakukan verifikasi fisik jumlah uang tunai yang Bapak terima sesuai nominal tercatat.' 
                 : isSupervisor
                 ? 'Halaman ini menampilkan log mutasi khusus yang melibatkan dompet Supervisor. Pastikan setiap drop dana dari Finance atau pengembalian dana sisa operasional tercatat dengan benar di sini.'
                 : 'Halaman ini menampilkan log audit dari mutasi antar dompet yang Bapak lakukan di menu Koreksi Saldo. Pastikan setiap perpindahan dana tunai besar tercatat di sini untuk memudahkan rekonsiliasi kas.'}
            </p>
         </div>
      </div>
    </div>
  );
};

export default MutationLogs;
