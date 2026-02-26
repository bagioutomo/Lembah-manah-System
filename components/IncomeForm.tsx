import React, { useState, useMemo } from 'react';
import { ArrowUpCircle, Banknote, CreditCard, Coins, Save, Info, ShieldCheck } from 'lucide-react';
import { IncomeRecord } from '../types';

interface Props {
  onSubmit: (data: IncomeRecord) => void;
}

const IncomeForm: React.FC<Props> = ({ onSubmit }) => {
  const [incomeData, setIncomeData] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: '',
    cashNaim: 0,
    cashTiwi: 0,
    bri: 0,
    bni: 0
  });

  const totalIncome = useMemo(() => {
    return (incomeData.cashNaim || 0) + (incomeData.cashTiwi || 0) + (incomeData.bri || 0) + (incomeData.bni || 0);
  }, [incomeData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalIncome <= 0) return alert('Mohon masukkan nominal pendapatan, Pak.');
    
    if (!incomeData.notes) {
      if (!confirm('Simpan tanpa catatan tambahan?')) return;
    }

    const record: IncomeRecord = {
      id: `inc-${Date.now()}`,
      ...incomeData,
      total: totalIncome,
      timestamp: new Date().toISOString()
    };
    onSubmit(record);
    alert(`Sukses! Omzet sebesar ${formatCurrency(totalIncome)} telah dialokasikan ke masing-masing dompet.`);
    setIncomeData({ date: new Date().toISOString().split('T')[0], notes: '', cashNaim: 0, cashTiwi: 0, bri: 0, bni: 0 });
  };

  const formatCurrency = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in pb-20">
      <div className="flex items-center gap-6 mb-4">
         <div className="p-5 rounded-[2.2rem] text-white shadow-2xl bg-gradient-to-br from-green-600 to-emerald-700">
            <ArrowUpCircle size={36}/>
         </div>
         <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter leading-none dark:text-white">Input Omzet Harian</h2>
            <p className="text-sm text-gray-500 font-bold italic mt-2 uppercase tracking-[0.2em] flex items-center gap-2">
               <ShieldCheck size={14} className="text-green-600"/> Verified Transaction Input
            </p>
         </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-[3.5rem] p-10 lg:p-14 border border-gray-100 dark:border-gray-800 shadow-2xl space-y-12 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-12 opacity-[0.02] rotate-12 group-hover:rotate-0 transition-all duration-1000"><Coins size={240}/></div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-2">
               <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-4">Tanggal Tutup Buku</label>
               <input type="date" value={incomeData.date} onChange={e => setIncomeData({...incomeData, date: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 p-6 rounded-3xl outline-none font-black text-sm border-2 border-transparent focus:border-green-600 transition-all shadow-inner" />
            </div>
            <div className="space-y-2">
               <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-4">Berita Acara / Catatan</label>
               <input type="text" value={incomeData.notes} onChange={e => setIncomeData({...incomeData, notes: e.target.value.toUpperCase()})} placeholder="CONTOH: OMZET SENIN NORMAL" className="w-full bg-gray-50 dark:bg-gray-800 p-6 rounded-3xl outline-none font-bold text-sm border-2 border-transparent focus:border-green-600 transition-all shadow-inner" />
            </div>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 pt-10 border-t dark:border-gray-800 relative z-10">
            {/* CASH SECTION */}
            <div className="space-y-6">
               <div className="flex items-center justify-between px-2">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-green-700 flex items-center gap-2"><Banknote size={18}/> Audit Kas Tunai</h3>
                  <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800 ml-4"></div>
               </div>
               <div className="space-y-5">
                  <div className="relative group">
                     <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-black text-xs group-focus-within:text-green-600 transition-colors">NAIM</span>
                     <input type="text" value={incomeData.cashNaim ? incomeData.cashNaim.toLocaleString('id-ID') : ''} onChange={e => setIncomeData({...incomeData, cashNaim: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0})} className="w-full bg-gray-50 dark:bg-gray-800 pl-20 pr-6 py-5 rounded-[1.8rem] outline-none font-black text-xl border-2 border-transparent focus:border-green-600 transition-all shadow-inner" placeholder="0" />
                  </div>
                  <div className="relative group">
                     <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-black text-xs group-focus-within:text-green-600 transition-colors">TIWI</span>
                     <input type="text" value={incomeData.cashTiwi ? incomeData.cashTiwi.toLocaleString('id-ID') : ''} onChange={e => setIncomeData({...incomeData, cashTiwi: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0})} className="w-full bg-gray-50 dark:bg-gray-800 pl-20 pr-6 py-5 rounded-[1.8rem] outline-none font-black text-xl border-2 border-transparent focus:border-green-600 transition-all shadow-inner" placeholder="0" />
                  </div>
               </div>
            </div>

            {/* BANK SECTION */}
            <div className="space-y-6">
               <div className="flex items-center justify-between px-2">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-blue-700 flex items-center gap-2"><CreditCard size={18}/> Audit Digital</h3>
                  <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800 ml-4"></div>
               </div>
               <div className="space-y-5">
                  <div className="relative group">
                     <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-black text-xs group-focus-within:text-blue-600 transition-colors">BRI</span>
                     <input type="text" value={incomeData.bri ? incomeData.bri.toLocaleString('id-ID') : ''} onChange={e => setIncomeData({...incomeData, bri: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0})} className="w-full bg-gray-50 dark:bg-gray-800 pl-20 pr-6 py-5 rounded-[1.8rem] outline-none font-black text-xl border-2 border-transparent focus:border-blue-600 transition-all shadow-inner" placeholder="0" />
                  </div>
                  <div className="relative group">
                     <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-black text-xs group-focus-within:text-blue-600 transition-colors">BNI</span>
                     <input type="text" value={incomeData.bni ? incomeData.bni.toLocaleString('id-ID') : ''} onChange={e => setIncomeData({...incomeData, bni: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0})} className="w-full bg-gray-50 dark:bg-gray-800 pl-20 pr-6 py-5 rounded-[1.8rem] outline-none font-black text-xl border-2 border-transparent focus:border-blue-600 transition-all shadow-inner" placeholder="0" />
                  </div>
               </div>
            </div>
         </div>

         <div className="p-10 lg:p-12 bg-gray-950 text-white rounded-[3.5rem] flex flex-col md:flex-row items-center justify-between shadow-[0_30px_70px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden group/total">
            <div className="absolute inset-0 bg-gradient-to-r from-green-900/40 to-transparent pointer-events-none"></div>
            <div className="relative z-10 text-center md:text-left mb-8 md:mb-0">
               <p className="text-[11px] font-black uppercase tracking-[0.5em] text-green-500/60 mb-3">Gross Sales Reconstructed</p>
               <h4 className="text-6xl font-black tracking-tighter text-white tabular-nums leading-none">
                  {formatCurrency(totalIncome).replace('Rp ', '')}<span className="text-lg text-green-500 ml-2">IDR</span>
               </h4>
               <p className="text-[9px] font-bold text-gray-500 uppercase mt-4 tracking-widest flex items-center gap-2">
                  <Info size={12} className="text-blue-500"/> Dana akan otomatis didistribusikan ke 4 dompet terkait.
               </p>
            </div>
            <button type="submit" className="relative z-10 px-14 py-6 bg-green-600 hover:bg-green-500 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all shadow-[0_20px_50px_rgba(16,185,129,0.3)] flex items-center gap-4 active:scale-95 cursor-pointer">
               <Save size={24}/> Konfirmasi Audit
            </button>
         </div>
      </form>
    </div>
  );
};

export default IncomeForm;