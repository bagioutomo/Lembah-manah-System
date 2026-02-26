
import React, { useState, useMemo } from 'react';
import { 
  ArrowLeftRight, 
  Wallet as WalletIcon,
  ShieldCheck,
  Plus,
  FileText,
  History,
  TrendingUp,
  TrendingDown,
  ListFilter,
  X,
  ChevronDown,
  ArrowRight,
  Info,
  CalendarDays,
  Trash2
} from 'lucide-react';
import { TransferRecord, IncomeRecord, ExpenseRecord } from '../types';

interface Props {
  wallets: string[];
  setWallets: React.Dispatch<React.SetStateAction<string[]>>;
  transfers: TransferRecord[];
  setTransfers: React.Dispatch<React.SetStateAction<TransferRecord[]>>;
  incomes: IncomeRecord[];
  setIncomes: React.Dispatch<React.SetStateAction<IncomeRecord[]>>;
  expenses: ExpenseRecord[];
  setExpenses: React.Dispatch<React.SetStateAction<ExpenseRecord[]>>;
  globalMonth: number;
  globalYear: number;
  viewMode: 'BULANAN' | 'TAHUNAN';
}

const WalletManager: React.FC<Props> = ({ 
  wallets, setWallets, transfers, setTransfers, 
  incomes, setIncomes, expenses, setExpenses, 
  globalMonth, globalYear, viewMode 
}) => {
  const [selectedWalletDetail, setSelectedWalletDetail] = useState<string | null>(null);
  const [showGlobalLog, setShowGlobalLog] = useState(false);
  const [actualInput, setActualInput] = useState<Record<string, string>>({});
  const [newWalletName, setNewWalletName] = useState('');
  const [transferData, setTransferData] = useState({ from: '', to: '', amount: '', notes: '' });

  const monthsList = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const periodLabel = viewMode === 'TAHUNAN' ? `Tahun ${globalYear}` : `${monthsList[globalMonth]} ${globalYear}`;

  const auditData = useMemo(() => {
    const balances: Record<string, number> = {};
    const ledger: Record<string, any[]> = {};
    const monthlyBreakdown: Record<string, Record<number, number>> = {}; 
    const internalMutationLogs: any[] = [];
    
    wallets.forEach(w => {
      balances[w] = 0;
      ledger[w] = [];
      monthlyBreakdown[w] = {};
      for(let i=0; i<12; i++) monthlyBreakdown[w][i] = 0;
    });

    const isInPeriod = (dateStr: string) => {
      const d = new Date(dateStr);
      if (viewMode === 'TAHUNAN') return d.getFullYear() === globalYear;
      return d.getMonth() === globalMonth && d.getFullYear() === globalYear;
    };

    const processEntry = (wallet: string, amount: number, dateStr: string, type: string, notes: string, ts: string) => {
      if (balances[wallet] === undefined) return;
      const d = new Date(dateStr);
      const mIdx = d.getMonth();
      balances[wallet] += amount;
      monthlyBreakdown[wallet][mIdx] += amount;
      ledger[wallet].push({ date: dateStr, month: mIdx, type, notes, amount, timestamp: ts });
    };

    // 1. Pemasukan
    incomes.forEach(r => {
      if (!isInPeriod(r.date)) return;
      const entries = [
        { w: 'Cash Naim', v: Number(r.cashNaim) || 0 },
        { w: 'BRI', v: Number(r.bri) || 0 },
        { w: 'BNI', v: Number(r.bni) || 0 }
      ];
      entries.forEach(ent => {
        if (ent.v > 0) processEntry(ent.w, ent.v, r.date, 'MASUK', r.notes || 'Pemasukan', r.timestamp);
      });
    });

    // 2. Pengeluaran
    expenses.forEach(r => {
      if (!isInPeriod(r.date)) return;
      const amt = (Number(r.amount) || 0) * (Number(r.qty) || 1);
      processEntry(r.wallet, -amt, r.date, 'KELUAR', r.notes, r.timestamp);
    });

    // 3. Mutasi Internal
    transfers.forEach(r => {
      if (!isInPeriod(r.date)) return;
      const amt = Number(r.amount) || 0;
      processEntry(r.fromWallet, -amt, r.date, 'TRF KELUAR', `Ke ${r.toWallet}: ${r.notes}`, r.timestamp);
      processEntry(r.toWallet, amt, r.date, 'TRF MASUK', `Dari ${r.fromWallet}: ${r.notes}`, r.timestamp);
      
      internalMutationLogs.push({
        date: r.date,
        from: r.fromWallet,
        to: r.toWallet,
        amount: amt,
        notes: r.notes,
        timestamp: r.timestamp
      });
    });

    return { 
      balances, 
      ledger,
      monthlyBreakdown,
      internalMutationLogs: internalMutationLogs.sort((a,b) => b.timestamp.localeCompare(a.timestamp))
    };
  }, [wallets, incomes, expenses, transfers, globalMonth, globalYear, viewMode]);

  const formatCurrency = (val: number) => {
    const prefix = val < 0 ? '-Rp ' : 'Rp ';
    return prefix + Math.abs(Math.round(val)).toLocaleString('id-ID');
  };

  const executeTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(transferData.amount.replace(/[^\d]/g, '')) || 0;
    if (!transferData.from || !transferData.to || amt <= 0) return alert('Lengkapi data mutasi!');
    if (transferData.from === transferData.to) return alert('Tujuan tidak boleh sama!');

    const newTransfer = {
      id: `trf-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      fromWallet: transferData.from,
      toWallet: transferData.to,
      amount: amt,
      notes: transferData.notes.toUpperCase() || 'MUTASI INTERNAL',
      timestamp: new Date().toISOString()
    };

    setTransfers(prev => [...prev, newTransfer]);
    setTransferData({ from: '', to: '', amount: '', notes: '' });
  };

  return (
    <div className="animate-fade-in space-y-8 pb-24">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-indigo-700 text-white rounded-[1.8rem] shadow-xl"><WalletIcon size={32} /></div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Manajemen Aset</h2>
            <p className="text-sm text-gray-500 font-medium italic mt-2">Daftar saldo aktif {periodLabel}.</p>
          </div>
        </div>
        <button onClick={() => setShowGlobalLog(true)} className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 hover:scale-105 transition-all cursor-pointer">
          <ListFilter size={18}/> Log Mutasi {viewMode}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {wallets.map((w) => {
          const balance = auditData.balances[w] || 0;
          return (
            <div key={w} className="bg-white dark:bg-gray-950 p-8 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-lg flex flex-col group relative hover:shadow-2xl transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl shadow-inner ${balance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                   {balance >= 0 ? <TrendingUp size={24}/> : <TrendingDown size={24}/>}
                </div>
                <div className="flex gap-2">
                   <button onClick={() => setSelectedWalletDetail(w)} className="p-2 text-gray-400 hover:text-indigo-600 transition-all"><FileText size={18}/></button>
                   <button onClick={() => { if(confirm('Hapus dompet ini?')) setWallets(prev => prev.filter(item => item !== w)) }} className="p-2 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={18}/></button>
                </div>
              </div>
              <h3 className="text-xs font-black uppercase text-gray-400 mb-1 tracking-[0.2em]">{w}</h3>
              <h4 className={`text-3xl font-black tracking-tighter tabular-nums ${balance > 0 ? 'text-emerald-600' : balance < 0 ? 'text-rose-600' : 'text-gray-300'}`}>
                {balance > 0 ? '+' : ''}{formatCurrency(balance)}
              </h4>
            </div>
          );
        })}

        <div className="bg-gray-50 dark:bg-gray-900/40 rounded-[3.5rem] border-4 border-dashed border-gray-100 dark:border-gray-800 p-8 flex flex-col items-center justify-center text-center gap-4 group">
           <input type="text" placeholder="NAMA DOMPET BARU..." value={newWalletName} onChange={e => setNewWalletName(e.target.value.toUpperCase())} className="bg-white dark:bg-gray-800 rounded-2xl px-6 py-4 outline-none font-black text-sm w-full shadow-sm text-center border-2 border-transparent focus:border-indigo-600 transition-all" />
           <button onClick={() => { if(!newWalletName) return; setWallets(p => [...new Set([...p, newWalletName])]); setNewWalletName(''); }} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 cursor-pointer"><Plus size={20}/> Daftarkan Aset</button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[3.5rem] p-10 border border-gray-100 dark:border-gray-800 shadow-2xl relative overflow-hidden group">
         <div className="flex items-center gap-5 mb-12">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-[1.5rem] shadow-inner"><ArrowLeftRight size={28}/></div>
            <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">Mutasi Saldo Internal</h3>
         </div>
         <form onSubmit={executeTransfer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-3">Dari Sumber</label>
              <select value={transferData.from} onChange={e => setTransferData({...transferData, from: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl font-black text-sm uppercase outline-none">
                <option value="">-- PILIH --</option>
                {wallets.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-3">Tujuan Dana</label>
              <select value={transferData.to} onChange={e => setTransferData({...transferData, to: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl font-black text-sm uppercase outline-none">
                <option value="">-- PILIH --</option>
                {wallets.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-3">Nominal</label>
              <input type="text" value={transferData.amount ? parseInt(transferData.amount.replace(/[^\d]/g, '')).toLocaleString('id-ID') : ''} onChange={e => setTransferData({...transferData, amount: e.target.value})} placeholder="0" className="w-full bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl font-black text-xl outline-none" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl flex items-center justify-center gap-3">Eksekusi Mutasi <ArrowRight size={18}/></button>
            </div>
         </form>
      </div>

      {selectedWalletDetail && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 animate-fade-in">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedWalletDetail(null)} />
           <div className="relative w-full max-w-5xl bg-white dark:bg-gray-900 rounded-[3.5rem] shadow-2xl overflow-hidden animate-scale-in border-t-[12px] border-indigo-600">
              <div className="p-10 flex justify-between items-center border-b dark:border-gray-800">
                 <h3 className="text-3xl font-black uppercase tracking-tighter">Buku Besar: {selectedWalletDetail}</h3>
                 <button onClick={() => setSelectedWalletDetail(null)} className="p-3 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"><X size={28}/></button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-10">
                   <table className="w-full text-left">
                    <thead><tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b dark:border-gray-800 pb-4"><th className="py-4">Waktu</th><th className="py-4">Berita Acara</th><th className="py-4">Tipe</th><th className="py-4 text-right">Nominal</th></tr></thead>
                    <tbody className="divide-y dark:divide-gray-800">
                       {(auditData.ledger[selectedWalletDetail] || []).map((log, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors text-xs font-bold uppercase">
                             <td className="py-5 w-32"><span className="font-black text-gray-900 dark:text-white">{log.date}</span></td>
                             <td className="py-5 truncate text-gray-600">"{log.notes}"</td>
                             <td className="py-5 w-24"><span className={`px-2 py-0.5 rounded text-[8px] font-black border ${log.amount > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>{log.type}</span></td>
                             <td className={`py-5 text-right font-black text-sm ${log.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{log.amount > 0 ? '+' : ''}{log.amount.toLocaleString('id-ID')}</td>
                          </tr>
                       ))}
                    </tbody>
                   </table>
              </div>
           </div>
        </div>
      )}

      {showGlobalLog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 animate-fade-in">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowGlobalLog(false)} />
           <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl overflow-hidden animate-scale-in border-t-[12px] border-indigo-600">
              <div className="p-10 flex justify-between items-center border-b dark:border-gray-800">
                 <h3 className="text-3xl font-black uppercase tracking-tighter">Log Mutasi Internal</h3>
                 <button onClick={() => setShowGlobalLog(false)} className="p-3 hover:bg-gray-100 rounded-xl transition-all"><X size={28}/></button>
              </div>
              <div className="max-h-[50vh] overflow-y-auto custom-scrollbar p-10">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-4">
                          <th className="py-4">Tanggal</th>
                          <th className="py-4">Alur Dana</th>
                          <th className="py-4">Keterangan</th>
                          <th className="py-4 text-right">Nominal</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-800">
                       {auditData.internalMutationLogs.map((log, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors text-xs font-bold uppercase">
                             <td className="py-5 w-32 font-black">{log.date}</td>
                             <td className="py-5">
                                <div className="flex items-center gap-2">
                                   <span className="text-rose-600">{log.from}</span>
                                   <ArrowRight size={12} className="text-gray-300"/>
                                   <span className="text-emerald-600">{log.to}</span>
                                </div>
                             </td>
                             <td className="py-5 truncate max-w-xs text-gray-500">"{log.notes}"</td>
                             <td className="py-5 text-right font-black text-indigo-600">{formatCurrency(log.amount)}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default WalletManager;
