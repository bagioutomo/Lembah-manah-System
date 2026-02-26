
import React, { useState, useMemo } from 'react';
import { 
  Plus, Trash2, ShieldAlert, Flame, Target, Percent, 
  FolderTree, Building2, Settings2 
} from 'lucide-react';

interface Props {
  hppSubCategories: Record<string, string[]>;
  setHppSubCategories: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  globalEnergyStandard: number;
  setGlobalEnergyStandard: (val: number) => void;
  globalTargetFC: number;
  setGlobalTargetFC: (val: number) => void;
}

const HppMasterHub: React.FC<Props> = ({ 
  hppSubCategories, setHppSubCategories, 
  globalEnergyStandard, setGlobalEnergyStandard,
  globalTargetFC, setGlobalTargetFC 
}) => {
  const departments = useMemo(() => Object.keys(hppSubCategories), [hppSubCategories]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
       {/* 1. FINANCE POLICY */}
       <div className="bg-white dark:bg-gray-950 p-8 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-900/30 shadow-xl space-y-6">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md"><ShieldAlert size={20}/></div>
             <h3 className="text-lg font-black uppercase tracking-tight">Financial</h3>
          </div>
          <div className="space-y-6">
             <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Flame size={12} className="text-orange-500"/> Overhead Energi (%)</label>
                <div className="relative">
                   <input type="number" value={globalEnergyStandard} onChange={e => setGlobalEnergyStandard(Number(e.target.value))} className="w-full bg-gray-50 dark:bg-gray-900 rounded-xl px-5 py-3.5 outline-none font-black text-xl border-2 border-transparent focus:border-emerald-600 shadow-inner" />
                   <Percent size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300" />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Target size={12} className="text-emerald-500"/> Target Ideal (%)</label>
                <div className="relative">
                   <input type="number" value={globalTargetFC} onChange={e => setGlobalTargetFC(Number(e.target.value))} className="w-full bg-gray-50 dark:bg-gray-900 rounded-xl px-5 py-3.5 outline-none font-black text-xl border-2 border-transparent focus:border-emerald-600 shadow-inner" />
                   <Percent size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300" />
                </div>
             </div>
          </div>
       </div>

       {/* 2. MASTER DEPARTEMEN */}
       <div className="bg-white dark:bg-gray-950 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl space-y-6">
          <div className="flex items-center gap-4"><div className="p-3 bg-indigo-700 text-white rounded-xl shadow-md"><Building2 size={20}/></div><h3 className="text-lg font-black uppercase tracking-tight">Departemen</h3></div>
          <div className="flex gap-2">
             <input id="newDept" type="text" placeholder="DEPT BARU..." className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none font-black text-xs uppercase" />
             <button onClick={() => {
                const input = document.getElementById('newDept') as HTMLInputElement;
                const val = input.value.toUpperCase().trim();
                if(!val) return;
                if(hppSubCategories[val]) return alert('Departemen sudah ada!');
                setHppSubCategories(prev => ({ ...prev, [val]: [] }));
                input.value = '';
             }} className="p-3 bg-indigo-600 text-white rounded-xl shadow-md"><Plus size={18}/></button>
          </div>
          <div className="max-h-[250px] overflow-y-auto custom-scrollbar space-y-3 pr-1">
             {departments.map(dept => (
                <div key={dept} className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-transparent hover:border-indigo-500 transition-all group">
                   <span className="text-[10px] font-black uppercase tracking-wider">{dept}</span>
                   <button onClick={() => {
                      if(confirm(`Hapus departemen ${dept}? Seluruh kategori di dalamnya juga akan terhapus!`)) {
                         setHppSubCategories(prev => { const n = {...prev}; delete n[dept]; return n; });
                      }
                   }} className="p-1.5 text-red-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"><Trash2 size={14}/></button>
                </div>
             ))}
          </div>
       </div>

       {/* 3. MASTER KATEGORI */}
       <div className="bg-white dark:bg-gray-950 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl space-y-6">
          <div className="flex items-center gap-4"><div className="p-3 bg-emerald-700 text-white rounded-xl shadow-md"><FolderTree size={20}/></div><h3 className="text-lg font-black uppercase tracking-tight">Kategori Sub</h3></div>
          <div className="flex gap-2">
             <select id="targetDept" className="bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-3 text-[9px] font-black uppercase outline-none">
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
             </select>
             <input id="newSub" type="text" placeholder="KATEGORI..." className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none font-black text-xs uppercase" />
             <button onClick={() => {
                const dept = (document.getElementById('targetDept') as HTMLSelectElement).value;
                const input = (document.getElementById('newSub') as HTMLInputElement);
                const val = input.value.toUpperCase().trim();
                if(!dept || !val) return;
                if(hppSubCategories[dept].includes(val)) return alert('Kategori sudah ada di departemen ini');
                setHppSubCategories(prev => ({ ...prev, [dept]: [...prev[dept], val] }));
                input.value = '';
             }} className="p-3 bg-emerald-600 text-white rounded-xl shadow-md"><Plus size={18}/></button>
          </div>
          <div className="max-h-[250px] overflow-y-auto custom-scrollbar space-y-4 pr-1">
             {departments.map(dept => (
                <div key={dept} className="space-y-2">
                   <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">{dept} Group</p>
                   {hppSubCategories[dept].map(sub => (
                      <div key={sub} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl group border border-transparent hover:border-emerald-500 transition-all">
                         <span className="text-[9px] font-bold uppercase tracking-wider">{sub}</span>
                         <button onClick={() => {
                            setHppSubCategories(prev => ({ ...prev, [dept]: prev[dept].filter(x => x !== sub) }));
                         }} className="p-1.5 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"><Trash2 size={14}/></button>
                      </div>
                   ))}
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};

export default HppMasterHub;
