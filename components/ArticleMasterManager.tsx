
import React, { useState } from 'react';
import { 
  Settings2, X, Plus, Trash2, Tag, Scale, 
  Info, Database, ShieldCheck, CheckCircle2,
  Box, Layers, ChevronRight, Save
} from 'lucide-react';

interface Props {
  show: boolean;
  onClose: () => void;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  units: string[];
  setUnits: React.Dispatch<React.SetStateAction<string[]>>;
}

const ArticleMasterManager: React.FC<Props> = ({ show, onClose, categories, setCategories, units, setUnits }) => {
  const [activeTab, setActiveTab] = useState<'CATEGORIES' | 'UNITS'>('CATEGORIES');
  const [newName, setNewName] = useState('');

  if (!show) return null;

  const handleAddItem = () => {
    const val = newName.trim().toUpperCase();
    if (!val) return;

    if (activeTab === 'CATEGORIES') {
      if (categories.includes(val)) return alert('Kategori sudah ada, Pak.');
      setCategories(prev => [...new Set([...prev, val])]);
    } else {
      const unitVal = val.toLowerCase();
      if (units.includes(unitVal)) return alert('Satuan sudah ada, Pak.');
      setUnits(prev => [...new Set([...prev, unitVal])]);
    }
    setNewName('');
  };

  const handleDelete = (item: string) => {
    if (!confirm(`Hapus "${item}" dari Master? Data bahan baku yang sudah menggunakan ini tidak akan hilang, tapi Bapak tidak bisa memilihnya lagi untuk input baru.`)) return;
    
    if (activeTab === 'CATEGORIES') {
      setCategories(prev => prev.filter(c => c !== item));
    } else {
      setUnits(prev => prev.filter(u => u !== item));
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 animate-fade-in no-print">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[3.5rem] shadow-2xl overflow-hidden animate-scale-in border-t-[10px] border-amber-600 flex flex-col max-h-[85vh]">
        
        {/* HEADER */}
        <div className="p-8 border-b dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-950 shrink-0">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-[1.5rem] shadow-inner">
              <Settings2 size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white leading-none">Master Hub Katalog</h3>
              <div className="flex items-center gap-2 mt-2">
                 <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded text-[8px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800 flex items-center gap-1">
                    <Database size={10}/> Cloud Synced
                 </span>
                 <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">v2.5 Config</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all cursor-pointer">
            <X size={28} className="text-gray-400" />
          </button>
        </div>

        {/* TABS SELECTION */}
        <div className="px-8 pt-6 shrink-0">
           <div className="flex p-1.5 bg-gray-100 dark:bg-gray-800 rounded-[1.8rem] border dark:border-gray-700">
              <button 
                onClick={() => { setActiveTab('CATEGORIES'); setNewName(''); }}
                className={`flex-1 flex items-center justify-center gap-3 py-3.5 rounded-[1.2rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'CATEGORIES' ? 'bg-white dark:bg-gray-900 text-amber-600 shadow-md scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Tag size={16}/> Kategori Bahan
              </button>
              <button 
                onClick={() => { setActiveTab('UNITS'); setNewName(''); }}
                className={`flex-1 flex items-center justify-center gap-3 py-3.5 rounded-[1.2rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'UNITS' ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-md scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Scale size={16}/> Satuan Ukur
              </button>
           </div>
        </div>

        {/* MAIN BODY */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
           
           {/* INPUT AREA */}
           <div className={`p-8 rounded-[2.5rem] border-2 border-dashed transition-colors duration-500 ${activeTab === 'CATEGORIES' ? 'bg-amber-50/30 border-amber-200 dark:bg-amber-950/10' : 'bg-indigo-50/30 border-indigo-200 dark:bg-indigo-950/10'}`}>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2 mb-3 block">
                Tambah {activeTab === 'CATEGORIES' ? 'Kategori' : 'Satuan'} Baru
              </label>
              <div className="flex gap-3">
                 <input 
                   type="text" 
                   value={newName}
                   onChange={e => setNewName(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                   placeholder={activeTab === 'CATEGORIES' ? "MISAL: FROZEN FOOD, SAYURAN..." : "MISAL: KG, LITER, PACK..."}
                   className="flex-1 bg-white dark:bg-gray-800 border-2 border-transparent focus:border-gray-900 dark:focus:border-white rounded-2xl px-6 py-4 outline-none font-black text-sm uppercase shadow-sm transition-all"
                 />
                 <button 
                   onClick={handleAddItem}
                   className={`p-5 rounded-2xl text-white shadow-xl active:scale-90 transition-all cursor-pointer ${activeTab === 'CATEGORIES' ? 'bg-amber-600 shadow-amber-500/20' : 'bg-indigo-600 shadow-indigo-500/20'}`}
                 >
                   <Plus size={24} />
                 </button>
              </div>
           </div>

           {/* LIST AREA */}
           <div className="space-y-3">
              <div className="flex items-center justify-between px-3">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Daftar Master Aktif</h4>
                 <span className="text-[10px] font-black text-gray-400">{(activeTab === 'CATEGORIES' ? categories : units).length} Item</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 {(activeTab === 'CATEGORIES' ? categories : units).map((item, idx) => (
                    <div 
                      key={idx} 
                      className="group flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all hover:translate-x-1"
                    >
                       <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full shadow-sm ${activeTab === 'CATEGORIES' ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
                          <span className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-200">{item}</span>
                       </div>
                       <button 
                         onClick={() => handleDelete(item)}
                         className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                       >
                         <Trash2 size={16}/>
                       </button>
                    </div>
                 ))}
              </div>
              
              {(activeTab === 'CATEGORIES' ? categories : units).length === 0 && (
                <div className="py-20 text-center opacity-20 italic font-black uppercase text-[10px] tracking-[0.4em]">Data Kosong</div>
              )}
           </div>
        </div>

        {/* FOOTER INFO */}
        <div className="p-8 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0">
           <div className="flex items-start gap-4 max-w-md">
              <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed italic">
                <b>INFO SINKRONISASI:</b> Setiap penambahan atau penghapusan di sini akan disimpan secara otomatis ke Supabase dalam hitungan detik. Pastikan Bapak memiliki koneksi internet stabil.
              </p>
           </div>
           <button 
             onClick={onClose}
             className="w-full sm:w-auto px-10 py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2"
           >
              <CheckCircle2 size={16}/> Selesai & Tutup
           </button>
        </div>
      </div>
    </div>
  );
};

export default ArticleMasterManager;
