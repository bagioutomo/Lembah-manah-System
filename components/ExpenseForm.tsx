
import React, { useState, useEffect } from 'react';
import { ArrowDownCircle, ChevronDown, Layers, Save } from 'lucide-react';
import { ExpenseRecord, UserRole } from '../types';
import { CATEGORY_GROUPS } from '../constants';

interface Props {
  onSubmit: (data: ExpenseRecord) => void;
  wallets: string[];
  categories: string[];
  currentBalances: Record<string, number>;
  userRole: UserRole;
}

const ExpenseForm: React.FC<Props> = ({ onSubmit, wallets, currentBalances, userRole }) => {
  const [expenseData, setExpenseData] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: '',
    wallet: userRole === 'PURCHASING' ? 'Purchasing' : '', 
    category: '', 
    amount: 0,
    qty: 1
  });

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseData.wallet) return alert('Pilih Dompet Dana terlebih dahulu!');
    if (!expenseData.category) return alert('Pilih Kategori Biaya terlebih dahulu!');
    if (expenseData.amount <= 0) return alert('Masukkan nominal pengeluaran!');
    
    const record: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      ...expenseData,
      timestamp: new Date().toISOString(),
      createdBy: userRole
    };
    onSubmit(record);
    alert('Pengeluaran berhasil dicatat!');
    setExpenseData({
      ...expenseData,
      notes: '',
      amount: 0,
      qty: 1,
      wallet: userRole === 'PURCHASING' ? 'Purchasing' : '', 
      category: '' 
    });
  };

  const formatCurrency = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center gap-5 mb-6">
         <div className="p-5 rounded-[2rem] text-white shadow-xl bg-red-600">
            <ArrowDownCircle size={32}/>
         </div>
         <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter leading-none dark:text-white">Input Pengeluaran</h2>
            <p className="text-sm text-gray-500 font-medium italic mt-2 uppercase tracking-widest">Pencatatan Biaya & Belanja</p>
         </div>
      </div>

      <form onSubmit={handleExpenseSubmit} className="bg-white dark:bg-gray-900 rounded-[3rem] p-10 border border-gray-100 dark:border-gray-800 shadow-2xl space-y-10">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Tanggal</label>
               <input type="date" value={expenseData.date} onChange={e => setExpenseData({...expenseData, date: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl outline-none font-black text-sm border-2 border-transparent focus:border-red-600 transition-all" />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Dompet Dana</label>
               <div className="relative">
                  <select 
                    required 
                    value={expenseData.wallet} 
                    onChange={e => setExpenseData({...expenseData, wallet: e.target.value})} 
                    className="w-full bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl outline-none font-black text-sm appearance-none cursor-pointer border-2 border-transparent focus:border-red-600 transition-all"
                  >
                     {userRole === 'PURCHASING' ? (
                       <option value="Purchasing">PURCHASING</option>
                     ) : (
                       <>
                         <option value="">-- PILIH DOMPET --</option>
                         {wallets.map(w => <option key={w} value={w}>{w.toUpperCase()}</option>)}
                       </>
                     )}
                  </select>
                  <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
               </div>
               {expenseData.wallet && <p className="text-[9px] font-bold text-gray-400 ml-4 uppercase tracking-widest">SISA SALDO: {formatCurrency(currentBalances[expenseData.wallet] || 0)}</p>}
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Kategori Biaya</label>
               <div className="relative">
                  <select required value={expenseData.category} onChange={e => setExpenseData({...expenseData, category: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl outline-none font-black text-sm appearance-none cursor-pointer border-2 border-transparent focus:border-red-600 transition-all">
                     <option value="">-- PILIH KATEGORI --</option>
                     {CATEGORY_GROUPS.map(group => (
                        <optgroup key={group.name} label={group.name.toUpperCase()}>
                           {group.subs.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                        </optgroup>
                     ))}
                  </select>
                  <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-2">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Keterangan Barang / Jasa</label>
               <textarea required value={expenseData.notes} onChange={e => setExpenseData({...expenseData, notes: e.target.value.toUpperCase()})} placeholder="MASUKKAN RINCIAN PEMBELIAN..." className="w-full bg-gray-50 dark:bg-gray-800 p-6 rounded-[2rem] outline-none font-black text-sm resize-none h-28 border-2 border-transparent focus:border-red-600 transition-all shadow-inner" />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Qty (Kuantitas)</label>
               <div className="relative">
                  <input type="number" step="any" value={expenseData.qty || ''} onChange={e => setExpenseData({...expenseData, qty: parseFloat(e.target.value) || 0})} className="w-full bg-gray-50 dark:bg-gray-800 p-6 rounded-[2rem] outline-none font-black text-2xl text-center border-2 border-transparent focus:border-red-600 transition-all shadow-inner" placeholder="1" />
                  <Layers size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-red-50/50 dark:bg-red-950/10 p-8 rounded-[2.5rem] border-2 border-dashed border-red-200 dark:border-red-900/40">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-red-600 uppercase tracking-widest ml-4">Nominal Total Bayar (Rp)</label>
               <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-red-400 text-xl">Rp</span>
                  <input type="text" value={expenseData.amount ? expenseData.amount.toLocaleString('id-ID') : ''} onChange={e => setExpenseData({...expenseData, amount: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0})} className="w-full bg-white dark:bg-gray-900 pl-16 pr-6 py-6 rounded-3xl outline-none font-black text-3xl text-red-600 shadow-xl border-2 border-transparent focus:border-red-600" placeholder="0" />
               </div>
            </div>
            <button type="submit" className="w-full py-7 bg-red-600 hover:bg-red-700 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4">
               <Save size={24}/> Catat Transaksi
            </button>
         </div>
      </form>
    </div>
  );
};

export default ExpenseForm;
