
import React, { useState, useMemo } from 'react';
import { X, Save, Banknote, CreditCard, Calendar, Info } from 'lucide-react';
import { IncomeRecord } from '../types';

interface Props {
  income: IncomeRecord;
  onSave: (updated: IncomeRecord) => void;
  onClose: () => void;
}

const EditIncomeModal: React.FC<Props> = ({ income, onSave, onClose }) => {
  const [formData, setFormData] = useState<IncomeRecord>({ 
    ...income,
    cashTiwi: income.cashTiwi || 0 // Handle legacy data
  });

  const total = useMemo(() => {
    return (Number(formData.cashNaim) || 0) + 
           (Number(formData.cashTiwi) || 0) + 
           (Number(formData.bri) || 0) + 
           (Number(formData.bni) || 0);
  }, [formData.cashNaim, formData.cashTiwi, formData.bri, formData.bni]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, total });
  };

  const handleNumericChange = (field: keyof IncomeRecord, value: string) => {
    const numericVal = parseInt(value.replace(/[^\d]/g, '')) || 0;
    setFormData(prev => ({ ...prev, [field]: numericVal }));
  };

  const formatCurrency = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center px-4 animate-fade-in no-print">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-10 animate-scale-in border-t-8 border-green-600 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-2xl">
              <Banknote size={24} />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Edit Pemasukan</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Tanggal</label>
              <input 
                type="date" 
                value={formData.date} 
                onChange={e => setFormData({...formData, date: e.target.value})} 
                className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl outline-none font-black text-sm border-2 border-transparent focus:border-green-600 transition-all" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Catatan / Berita Acara</label>
              <input 
                type="text" 
                value={formData.notes} 
                onChange={e => setFormData({...formData, notes: e.target.value.toUpperCase()})} 
                className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl outline-none font-bold text-sm uppercase border-2 border-transparent focus:border-green-600 transition-all" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t dark:border-gray-800">
             <div className="space-y-4">
                <h4 className="text-[10px] font-black text-green-700 uppercase tracking-widest flex items-center gap-2 px-2">
                  <Banknote size={14}/> Kas Tunai
                </h4>
                <div className="space-y-3">
                   <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300">NAIM</span>
                      <input 
                        type="text" 
                        value={formData.cashNaim.toLocaleString('id-ID')} 
                        onChange={e => handleNumericChange('cashNaim', e.target.value)} 
                        className="w-full pl-16 pr-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none font-black text-sm border-2 border-transparent focus:border-green-600" 
                      />
                   </div>
                   <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300">TIWI</span>
                      <input 
                        type="text" 
                        value={formData.cashTiwi.toLocaleString('id-ID')} 
                        onChange={e => handleNumericChange('cashTiwi', e.target.value)} 
                        className="w-full pl-16 pr-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none font-black text-sm border-2 border-transparent focus:border-green-600" 
                      />
                   </div>
                </div>
             </div>

             <div className="space-y-4">
                <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2 px-2">
                  <CreditCard size={14}/> Bank & Digital
                </h4>
                <div className="space-y-3">
                   <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300">BRI</span>
                      <input 
                        type="text" 
                        value={formData.bri.toLocaleString('id-ID')} 
                        onChange={e => handleNumericChange('bri', e.target.value)} 
                        className="w-full pl-16 pr-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none font-black text-sm border-2 border-transparent focus:border-blue-600" 
                      />
                   </div>
                   <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300">BNI</span>
                      <input 
                        type="text" 
                        value={formData.bni.toLocaleString('id-ID')} 
                        onChange={e => handleNumericChange('bni', e.target.value)} 
                        className="w-full pl-16 pr-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none font-black text-sm border-2 border-transparent focus:border-blue-600" 
                      />
                   </div>
                </div>
             </div>
          </div>

          <div className="p-8 bg-gray-950 text-white rounded-[2.5rem] flex flex-col sm:flex-row justify-between items-center shadow-xl gap-6 relative overflow-hidden">
             <div className="relative z-10 text-center sm:text-left">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Total Pemasukan Baru</p>
                <h4 className="text-4xl font-black text-green-400 tracking-tighter tabular-nums">{formatCurrency(total)}</h4>
             </div>
             <button type="submit" className="relative z-10 px-12 py-5 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg flex items-center gap-3 active:scale-95 transition-all">
                <Save size={18}/> Simpan Perubahan
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditIncomeModal;
