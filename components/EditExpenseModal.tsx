
import React, { useState, useMemo } from 'react';
import { X, Save, ShoppingBag, ChevronDown, Layers, Info } from 'lucide-react';
import { ExpenseRecord } from '../types';
import { CATEGORY_GROUPS } from '../constants';

interface Props {
  expense: ExpenseRecord;
  wallets: string[];
  onSave: (updated: ExpenseRecord) => void;
  onClose: () => void;
}

const EditExpenseModal: React.FC<Props> = ({ expense, wallets, onSave, onClose }) => {
  const [formData, setFormData] = useState<ExpenseRecord>({ ...expense });

  const total = useMemo(() => {
    return (Number(formData.amount) || 0) * (Number(formData.qty) || 1);
  }, [formData.amount, formData.qty]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.wallet || !formData.category || formData.amount <= 0) {
      alert('Lengkapi data pengeluaran!');
      return;
    }
    onSave(formData);
  };

  const formatCurrency = (val: number) => 'Rp ' + Math.round(val).toLocaleString('id-ID');

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center px-4 animate-fade-in no-print">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-10 animate-scale-in border-t-8 border-red-600 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-2xl">
              <ShoppingBag size={24} />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Edit Pengeluaran</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Tanggal Pengeluaran</label>
              <input 
                type="date" 
                value={formData.date} 
                onChange={e => setFormData({...formData, date: e.target.value})} 
                className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl outline-none font-black text-sm border-2 border-transparent focus:border-red-600 transition-all" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Dompet Sumber Dana</label>
              <div className="relative">
                <select 
                  value={formData.wallet} 
                  onChange={e => setFormData({...formData, wallet: e.target.value})} 
                  className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl outline-none font-black text-sm appearance-none cursor-pointer border-2 border-transparent focus:border-red-600 transition-all"
                >
                  {wallets.map(w => <option key={w} value={w}>{w.toUpperCase()}</option>)}
                </select>
                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Keterangan Barang / Jasa</label>
            <input 
              type="text" 
              value={formData.notes} 
              onChange={e => setFormData({...formData, notes: e.target.value.toUpperCase()})} 
              className="w-full bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl outline-none font-bold text-sm uppercase shadow-inner border-2 border-transparent focus:border-red-600 transition-all" 
              placeholder="CONTOH: PEMBELIAN BIJI KOPI..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Kategori Biaya</label>
                <div className="relative">
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                    className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl outline-none font-black text-[11px] appearance-none cursor-pointer border-2 border-transparent focus:border-red-600 transition-all"
                  >
                    {CATEGORY_GROUPS.map(g => (
                      <optgroup key={g.name} label={g.name.toUpperCase()}>
                        {g.subs.map(s => <option key={s} value={s}>{s}</option>)}
                      </optgroup>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Harga Satuan</label>
                <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300">Rp</span>
                   <input 
                    type="text" 
                    value={formData.amount.toLocaleString('id-ID')} 
                    onChange={e => setFormData({...formData, amount: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0})} 
                    className="w-full pl-8 bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl outline-none font-black text-sm border-2 border-transparent focus:border-red-600 transition-all" 
                   />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Kuantitas (Qty)</label>
                <div className="relative">
                   <input 
                    type="number" 
                    step="any" 
                    value={formData.qty || ''} 
                    onChange={e => setFormData({...formData, qty: parseFloat(e.target.value) || 0})} 
                    className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl outline-none font-black text-sm text-center border-2 border-transparent focus:border-red-600 transition-all" 
                   />
                   <Layers size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                </div>
             </div>
          </div>

          <div className="p-8 bg-gray-950 text-white rounded-[2.5rem] flex flex-col sm:flex-row justify-between items-center shadow-xl gap-6 relative overflow-hidden">
             <div className="relative z-10 text-center sm:text-left">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Total Biaya Baru</p>
                <h4 className="text-4xl font-black text-red-500 tracking-tighter tabular-nums">{formatCurrency(total)}</h4>
             </div>
             <button type="submit" className="relative z-10 px-12 py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg flex items-center gap-3 active:scale-95 transition-all">
                <Save size={18}/> Perbarui Data
             </button>
          </div>
          
          <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border-2 border-dashed border-red-100 dark:border-red-800 flex gap-4">
             <Info size={18} className="text-red-500 shrink-0 mt-0.5" />
             <p className="text-[10px] text-red-800 dark:text-red-300 font-bold uppercase italic">
                Pembaruan data ini akan langsung memicu sinkronisasi cloud dalam waktu 3 detik setelah disimpan.
             </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExpenseModal;
