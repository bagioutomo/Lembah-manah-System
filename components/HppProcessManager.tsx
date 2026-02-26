
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calculator, Search, Plus, Trash2, Edit3, Settings2 
} from 'lucide-react';
import { Article, Recipe, ProcessedMaterial, RecipeItem } from '../types';
import HppMasterHub from './HppMasterHub';
import HppArchitect from './HppArchitect';

interface Props {
  recipes: Recipe[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  articles: Article[];
  processedMaterials: ProcessedMaterial[];
  hppSubCategories: Record<string, string[]>;
  setHppSubCategories: React.Dispatch<React.SetStateAction<any>>;
  // Props untuk sinkronisasi cloud
  globalEnergyStandard: number;
  setGlobalEnergyStandard: (val: number) => void;
  globalTargetFC: number;
  setGlobalTargetFC: (val: number) => void;
}

const HppProcessManager: React.FC<Props> = ({ 
  recipes, setRecipes, articles, processedMaterials, 
  hppSubCategories, setHppSubCategories,
  globalEnergyStandard, setGlobalEnergyStandard,
  globalTargetFC, setGlobalTargetFC
}) => {
  const departments = useMemo(() => Object.keys(hppSubCategories), [hppSubCategories]);
  const [activeMainTab, setActiveMainTab] = useState<string>(departments[0] || 'FOOD');
  const [activeSubTab, setActiveSubTab] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditor, setShowEditor] = useState(false);

  const [currentRecipe, setCurrentRecipe] = useState<Partial<Recipe>>({});

  const allSubCategories = useMemo(() => {
    return Object.entries(hppSubCategories).flatMap(([main, subs]: [string, string[]]) => 
      subs.map(s => ({ name: s, main }))
    );
  }, [hppSubCategories]);

  const filteredRecipes = useMemo(() => {
    if (activeSubTab === 'MASTER_SETTING') return [];
    return (recipes || [])
      .filter(r => {
        const matchSub = activeSubTab === 'ALL' || r.subCategory === activeSubTab;
        const matchSearch = r.menuName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchSub && matchSearch;
      })
      .sort((a, b) => a.menuName.localeCompare(b.menuName));
  }, [recipes, searchTerm, activeSubTab]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRecipe.menuName) return alert('Input nama menu!');
    
    // KALKULASI FINAL SEBELUM SAVE
    const items = currentRecipe.items || [];
    const rawItemsCost = items.reduce((sum: number, item: RecipeItem) => sum + (Number(item.totalCost) || 0), 0);
    const energyPercent = Number(currentRecipe.energyCost) || globalEnergyStandard;
    const totalCost = rawItemsCost + (rawItemsCost * energyPercent / 100);
    const actualSales = Number(currentRecipe.actualSales) || 0;
    const foodCostPercent = actualSales > 0 ? (totalCost / actualSales) * 100 : 0;
    
    const targetFC = Number(currentRecipe.budgetFoodCost) || globalTargetFC;
    const recommendedPrice = totalCost / (targetFC / 100);

    const newRecipe: Recipe = {
      id: currentRecipe.id || `rec-${Date.now()}`,
      menuName: currentRecipe.menuName.toUpperCase(),
      category: currentRecipe.category || departments[0],
      subCategory: currentRecipe.subCategory || (hppSubCategories[currentRecipe.category!]?.[0] || ''),
      items: items,
      costPrice: rawItemsCost,
      energyCost: energyPercent, 
      totalCost: totalCost,
      budgetFoodCost: targetFC, 
      suggestedPrice: recommendedPrice,
      actualSales: actualSales,
      costFoodPercent: foodCostPercent,
      lastUpdated: new Date().toISOString()
    };

    setRecipes(prev => {
      const filtered = prev.filter(r => r.id !== newRecipe.id);
      return [...filtered, newRecipe];
    });
    setShowEditor(false);
  };

  const formatCurrency = (val: number) => 'Rp ' + Math.round(val || 0).toLocaleString('id-ID');

  return (
    <div className="animate-fade-in space-y-6 pb-20">
      <div className="flex items-center gap-5 px-2">
        <div className="p-4 bg-emerald-700 text-white rounded-2xl shadow-lg">
          <Calculator size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Worksheet Audit HPP</h2>
          <div className="flex items-center gap-2 mt-1.5">
             <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-[8px] font-black uppercase tracking-widest border border-emerald-100">Neural Engine v7.4</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
         <button onClick={() => setActiveSubTab('ALL')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all shrink-0 ${activeSubTab === 'ALL' ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-400 hover:border-emerald-200'}`}>Semua Produk</button>
         {allSubCategories.map(sub => (
           <button 
             key={`${sub.main}-${sub.name}`} 
             onClick={() => { setActiveSubTab(sub.name); setActiveMainTab(sub.main); }} 
             className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all shrink-0 ${activeSubTab === sub.name ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'text-gray-400 hover:border-emerald-200'}`}
           >
             {sub.name}
           </button>
         ))}
         <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 mx-2"></div>
         <button onClick={() => setActiveSubTab('MASTER_SETTING')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all shrink-0 flex items-center gap-2 ${activeSubTab === 'MASTER_SETTING' ? 'bg-black border-black text-white shadow-lg' : 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'}`}><Settings2 size={14}/> Master Hub</button>
      </div>

      {activeSubTab === 'MASTER_SETTING' ? (
        <HppMasterHub 
          hppSubCategories={hppSubCategories} 
          setHppSubCategories={setHppSubCategories}
          globalEnergyStandard={globalEnergyStandard}
          setGlobalEnergyStandard={setGlobalEnergyStandard}
          globalTargetFC={globalTargetFC}
          setGlobalTargetFC={setGlobalTargetFC}
        />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden animate-fade-in">
          <div className="p-6 border-b dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="relative max-w-md w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" placeholder={`Cari di ${activeSubTab === 'ALL' ? 'Semua Menu' : activeSubTab}...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 rounded-xl pl-11 pr-6 py-2.5 font-bold text-sm outline-none transition-all shadow-inner" />
             </div>
             <button onClick={() => { 
                const defCat = activeMainTab;
                const defSub = activeSubTab !== 'ALL' ? activeSubTab : (hppSubCategories[defCat]?.[0] || '');
                setCurrentRecipe({ menuName:'', category: defCat, subCategory: defSub, items:[], budgetFoodCost: globalTargetFC, energyCost: globalEnergyStandard, actualSales:0 }); 
                setShowEditor(true); 
              }} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-black transition-all cursor-pointer"><Plus size={16}/> Menu Baru</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Menu / Identitas</th>
                  <th className="px-4 py-4 text-center">HPP Produksi</th>
                  <th className="px-4 py-4 text-center">Harga Jual</th>
                  <th className="px-4 py-4 text-center text-emerald-700">Rekomendasi</th>
                  <th className="px-4 py-4 text-center">Cost %</th>
                  <th className="px-6 py-4 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-800">
                 {filteredRecipes.map(r => {
                    return (
                      <tr key={r.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-5">
                           <p className="text-xs font-black uppercase text-gray-900 dark:text-white leading-none mb-1 group-hover:text-emerald-600 transition-colors">{r.menuName}</p>
                           <div className="flex items-center gap-2">
                             <span className="text-[7px] font-black uppercase text-indigo-500">{r.category}</span>
                             <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{r.subCategory}</span>
                           </div>
                        </td>
                        <td className="px-4 py-5 text-center font-black text-gray-700 dark:text-gray-300 text-[11px]">{formatCurrency(r.totalCost)}</td>
                        <td className="px-4 py-5 text-center font-black text-blue-700">{formatCurrency(r.actualSales)}</td>
                        <td className="px-4 py-5 text-center">
                           <div className="flex items-center justify-center gap-2">
                              <span className="text-[11px] font-black text-emerald-600">{formatCurrency(r.suggestedPrice || 0)}</span>
                              <span className="text-[6px] font-bold text-gray-300 uppercase italic">Goal: {r.budgetFoodCost || globalTargetFC}%</span>
                           </div>
                        </td>
                        <td className="px-4 py-5 text-center">
                           <span className={`px-3 py-1 rounded-full text-[9px] font-black border ${r.costFoodPercent <= (r.budgetFoodCost || globalTargetFC) ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                              {Math.round(r.costFoodPercent)}%
                           </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                           <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setCurrentRecipe(r); setShowEditor(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"><Edit3 size={14}/></button>
                              <button onClick={() => setRecipes(p => p.filter(i => i.id !== r.id))} className="p-2 text-red-300 hover:text-red-500 rounded-lg transition-all cursor-pointer"><Trash2 size={14}/></button>
                           </div>
                        </td>
                      </tr>
                    );
                 })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showEditor && (
        <HppArchitect 
          currentRecipe={currentRecipe}
          setCurrentRecipe={setCurrentRecipe}
          hppSubCategories={hppSubCategories}
          articles={articles}
          processedMaterials={processedMaterials}
          globalEnergyStandard={globalEnergyStandard}
          globalTargetFC={globalTargetFC}
          onSave={handleSave}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
};

export default HppProcessManager;
