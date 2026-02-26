
import React, { useState } from 'react';
import { X, Plus, Trash2, Settings, ShieldCheck, Info } from 'lucide-react';

interface Props {
  show: boolean;
  onClose: () => void;
  units: string[];
  setUnits: React.Dispatch<React.SetStateAction<string[]>>;
}

const UnitMasterModal: React.FC<Props> = ({ show, onClose, units, setUnits }) => {
  const [newUnitName, setNewUnitName] = useState('');

  if (!show) return null;

  const handleAddUnit = () => {
    const val = newUnitName.trim().toLowerCase();
    if (!val) return;
    
    if (units.includes(val)) {
      alert('Satuan ini sudah terdaftar dalam sistem, Pak.');
      return;
    }

    setUnits(prev => [...prev, val]);
    setNewUnitName('');
  };

  const handleDeleteUnit = (u: string) => {
    if (confirm(`Apakah Bapak yakin ingin menghapus satuan "${u.toUpperCase()}"? Ini mungkin mempengaruhi tampilan pada data yang sudah menggunakan satuan ini.`)) {
      setUnits(prev => prev.filter(unit => unit !== u));
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 animate-fade-in no-print">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-[3.5rem] shadow-2xl p-10 animate-scale-in border-t-8 border-indigo-600">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl shadow-inner">
              <Settings size={24} className="animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white leading-none">Master Satuan</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Standarisasi Unit Pengukuran</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer">
            <X size={24} />
          </button>
        </div>

        {/* INPUT FORM */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Tambah Satuan Baru</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                autoFocus
                value={newUnitName} 
                onChange={e => setNewUnitName(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleAddUnit()}
                placeholder="Contoh: box, zak, cup..." 
                className="flex-1 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 outline-none font-black text-sm lowercase transition-all shadow-inner" 
              />
              <button 
                onClick={handleAddUnit}
                className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-90 transition-all cursor-pointer"
              >
                <Plus size={20}/>
              </button>
            </div>
          </div>

          {/* LIST AREA */}
          <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
            {units.map(u => (
              <div key={u} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl group border border-transparent hover:border-indigo-500/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
                  <span className="text-sm font-black uppercase tracking-widest text-gray-700 dark:text-gray-200">{u}</span>
                </div>
                <button 
                  onClick={() => handleDeleteUnit(u)}
                  className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 rounded-xl transition-all cursor-pointer"
                >
                  <Trash2 size={16}/>
                </button>
              </div>
            ))}
            {units.length === 0 && (
              <div className="py-10 text-center opacity-30 italic text-[10px] font-black uppercase tracking-[0.3em]">
                Database Satuan Kosong
              </div>
            )}
          </div>

          {/* INFO CARD */}
          <div className="p-5 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border-2 border-dashed border-indigo-100 dark:border-indigo-800 flex gap-4">
             <Info size={20} className="text-indigo-600 shrink-0 mt-0.5" />
             <p className="text-[10px] text-indigo-800 dark:text-indigo-300 font-medium leading-relaxed italic">
                <b>Tips:</b> Gunakan satuan terkecil (gr, ml) agar kalkulasi HPP di menu resep menjadi lebih presisi.
             </p>
          </div>
        </div>
      </div>
      <style>{`
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default UnitMasterModal;
