
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  X, Cpu, Lightbulb, Save, Trash2, Search, Sparkles, 
  ChevronDown, Flame, Lock, Coins, BarChart3, CheckCircle2, AlertOctagon
} from 'lucide-react';
import { Recipe, RecipeItem, Article, ProcessedMaterial } from '../types';

interface Props {
  currentRecipe: Partial<Recipe>;
  setCurrentRecipe: React.Dispatch<React.SetStateAction<Partial<Recipe>>>;
  hppSubCategories: Record<string, string[]>;
  articles: Article[];
  processedMaterials: ProcessedMaterial[];
  globalEnergyStandard: number;
  globalTargetFC: number;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
}

const HppArchitect: React.FC<Props> = ({ 
  currentRecipe, setCurrentRecipe, hppSubCategories, 
  articles, processedMaterials, globalEnergyStandard, 
  globalTargetFC, onSave, onClose 
}) => {
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const recommendationRef = useRef<HTMLDivElement>(null);

  const departments = useMemo(() => Object.keys(hppSubCategories), [hppSubCategories]);

  const allIngredients = useMemo(() => {
    const arts = articles.map(a => ({ id: a.id, name: a.name, cost: a.baseCost, unit: a.internalUnit, cat: a.category }));
    const procs = processedMaterials.map(m => ({ id: m.id, name: m.name, cost: m.costPerYieldUnit, unit: m.yieldUnit, cat: 'BAHAN OLAHAN' }));
    return [...arts, ...procs];
  }, [articles, processedMaterials]);

  const costCalculations = useMemo(() => {
    const items = currentRecipe.items || [];
    const rawItemsCost = items.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);
    const energyPercent = Number(currentRecipe.energyCost) || globalEnergyStandard;
    const energyCostAmount = (rawItemsCost * energyPercent) / 100;
    const totalProductionCost = rawItemsCost + energyCostAmount;
    const salesPrice = Number(currentRecipe.actualSales) || 0;
    const foodCostPercent = salesPrice > 0 ? (totalProductionCost / salesPrice) * 100 : 0;
    const netProfitNominal = salesPrice - totalProductionCost;
    const targetFC = Number(currentRecipe.budgetFoodCost) || globalTargetFC;
    const recommendedPrice = totalProductionCost / (targetFC / 100);
    
    return { 
      rawItemsCost, energyCostAmount, totalProductionCost, 
      foodCostPercent, netProfitNominal, recommendedPrice
    };
  }, [currentRecipe.items, currentRecipe.actualSales, currentRecipe.energyCost, currentRecipe.budgetFoodCost, globalEnergyStandard, globalTargetFC]);

  const handleAddIngredient = (ing: any) => {
    const newItem: RecipeItem = {
      articleId: ing.id,
      name: ing.name,
      quantity: 1,
      unit: ing.unit,
      unitPrice: Number(ing.cost) || 0,
      yield: 1,
      costPerUnit: Number(ing.cost) || 0,
      totalCost: Number(ing.cost) || 0
    };
    setCurrentRecipe(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
    setIngredientSearch('');
    setShowRecommendations(false);
  };

  const handleUpdateItemQty = (idx: number, valStr: string) => {
    const val = parseFloat(valStr) || 0;
    const updatedItems = [...(currentRecipe.items || [])];
    const item = updatedItems[idx];
    updatedItems[idx] = { ...item, quantity: val, totalCost: val * item.unitPrice };
    setCurrentRecipe(prev => ({ ...prev, items: updatedItems }));
  };

  const formatCurrency = (val: number) => 'Rp ' + Math.round(val || 0).toLocaleString('id-ID');

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 animate-fade-in no-print overflow-hidden">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-white dark:bg-gray-950 rounded-[3rem] animate-scale-in border-t-[10px] border-emerald-600 h-[90vh] flex flex-col shadow-2xl">
         
         <div className="p-6 lg:px-10 border-b dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-950 shrink-0">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl shadow-inner"><Cpu size={24}/></div>
               <div>
                  <h3 className="text-xl font-black uppercase tracking-tight dark:text-white leading-none">HPP Architect</h3>
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1.5 italic">Neural Costing Engine v7.4</p>
               </div>
            </div>
            <button onClick={onClose} className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"><X size={24}/></button>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 space-y-8">
            <form onSubmit={onSave} className="space-y-8">
               <div className="bg-emerald-900 p-6 rounded-3xl shadow-xl border-b-4 border-emerald-500/30 flex flex-col lg:flex-row items-center justify-between gap-6 overflow-hidden relative">
                  <div className="flex items-center gap-6 relative z-10 w-full lg:w-auto">
                     <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg"><Lightbulb size={28} className="text-amber-300" /></div>
                     <div className="flex-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-300 mb-1">Rekomendasi Harga Strategis</p>
                        <h4 className="text-4xl font-black text-white tracking-tighter tabular-nums leading-none">{formatCurrency(costCalculations.recommendedPrice)}</h4>
                        <div className="flex items-center gap-3 mt-2">
                           <span className="px-3 py-1 bg-emerald-500 text-white rounded text-[7px] font-black uppercase tracking-widest">Goal: {currentRecipe.budgetFoodCost || globalTargetFC}% Cost</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-6 w-full lg:w-auto shrink-0 relative z-10">
                     <div className="h-10 w-px bg-white/10 hidden lg:block"></div>
                     <div className="text-right">
                        <p className="text-[8px] font-black text-emerald-400/60 uppercase tracking-widest mb-1.5">Margin Health</p>
                        <div className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase border shadow-md transition-all ${costCalculations.foodCostPercent <= (currentRecipe.budgetFoodCost || globalTargetFC) ? 'bg-emerald-50 text-white border-emerald-400' : 'bg-rose-50 text-white border-rose-400 animate-pulse'}`}>
                           {costCalculations.foodCostPercent <= (currentRecipe.budgetFoodCost || globalTargetFC) ? 'OPTIMAL' : 'LOW PROFIT'}
                        </div>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl border dark:border-gray-800 shadow-inner">
                  <div className="md:col-span-4 space-y-2">
                     <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Nama Produk / Menu</label>
                     <input required value={currentRecipe.menuName || ''} onChange={e => setCurrentRecipe({...currentRecipe, menuName: e.target.value.toUpperCase()})} placeholder="NAMA MENU..." className="w-full bg-white dark:bg-gray-950 border-2 border-transparent focus:border-emerald-600 rounded-xl px-5 py-3 outline-none font-black text-sm uppercase shadow-sm" />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                     <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Departemen</label>
                     <div className="flex p-1 bg-white dark:bg-gray-950 rounded-xl border dark:border-gray-800 shadow-sm overflow-x-auto no-scrollbar gap-1">
                        {departments.map(dept => (
                           <button key={dept} type="button" onClick={() => setCurrentRecipe({...currentRecipe, category: dept, subCategory: hppSubCategories[dept]?.[0] || ''})} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all whitespace-nowrap ${currentRecipe.category === dept ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>{dept}</button>
                        ))}
                     </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                     <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Sub Kategori</label>
                     <div className="relative">
                        <select value={currentRecipe.subCategory || ''} onChange={e => setCurrentRecipe({...currentRecipe, subCategory: e.target.value})} className="w-full bg-white dark:bg-gray-950 border-2 border-transparent focus:border-emerald-600 rounded-xl px-5 py-3 outline-none font-black text-[11px] uppercase appearance-none shadow-sm cursor-pointer">
                           {(hppSubCategories[currentRecipe.category || departments[0]] || []).map((sub: string) => <option key={sub} value={sub}>{sub}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                     </div>
                  </div>
                  <div className="md:col-span-3 space-y-2 relative" ref={recommendationRef}>
                     <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest ml-2 flex items-center gap-1.5"><Sparkles size={12}/> Pilih Bahan</label>
                     <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16}/>
                        <input type="text" value={ingredientSearch} onChange={e => { setIngredientSearch(e.target.value); setShowRecommendations(true); }} placeholder="CARI KATALOG..." className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border-2 border-transparent focus:border-emerald-600 rounded-xl pl-11 pr-4 py-3 font-black text-[11px] uppercase outline-none shadow-inner" />
                        {showRecommendations && ingredientSearch && (
                           <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border z-[130] overflow-hidden divide-y dark:divide-gray-800 animate-fade-in border-emerald-100">
                              {allIngredients.filter(i => i.name.toLowerCase().includes(ingredientSearch.toLowerCase())).slice(0, 5).map(ing => (
                                <button key={ing.id} type="button" onClick={() => handleAddIngredient(ing)} className="w-full p-4 flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-emerald-900/40 text-left transition-all group">
                                   <div><p className="text-[11px] font-black uppercase group-hover:text-emerald-600 transition-colors">{ing.name}</p><p className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">{ing.cat}</p></div>
                                   <div className="text-right"><p className="text-[10px] font-black text-emerald-600">{formatCurrency(ing.cost)}</p></div>
                                </button>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               <div className="space-y-3">
                  <div className="overflow-hidden rounded-2xl border-2 border-gray-50 dark:border-gray-900 shadow-lg bg-white dark:bg-gray-900">
                     <table className="w-full text-left">
                        <thead><tr className="bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest"><th className="px-6 py-4">Bahan Baku</th><th className="px-4 py-4 text-center">Qty</th><th className="px-4 py-4 text-center">Unit</th><th className="px-4 py-4 text-center">HPP @ Unit</th><th className="px-6 py-4 text-right bg-emerald-800">Biaya</th><th className="px-6 py-4 text-center w-12">#</th></tr></thead>
                        <tbody className="divide-y dark:divide-gray-800">
                           {(currentRecipe.items || []).map((item, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all group text-[11px] font-bold uppercase">
                                 <td className="px-6 py-3.5"><p className="text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">{item.name}</p></td>
                                 <td className="px-4 py-3.5 text-center"><input type="number" step="any" value={item.quantity} onChange={e => handleUpdateItemQty(idx, e.target.value)} className="w-16 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-lg py-1.5 text-center font-black transition-all outline-none focus:border-emerald-600" /></td>
                                 <td className="px-4 py-3.5 text-center font-black text-gray-400 uppercase text-[10px]">{item.unit}</td>
                                 <td className="px-4 py-3.5 text-center font-bold text-gray-500 text-[10px]">{formatCurrency(item.unitPrice)}</td>
                                 <td className="px-6 py-3.5 text-right font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50/20">{formatCurrency(item.totalCost)}</td>
                                 <td className="px-6 py-3.5 text-center"><button type="button" onClick={() => setCurrentRecipe({...currentRecipe, items: (currentRecipe.items || []).filter((_, i) => i !== idx)})} className="p-1.5 text-red-300 hover:text-red-500 transition-all cursor-pointer"><Trash2 size={16}/></button></td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-6 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-emerald-100 dark:border-emerald-900 rounded-3xl flex flex-col justify-between relative">
                     <div className="absolute top-4 right-5 text-emerald-400/50"><Lock size={14}/></div>
                     <div>
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-3"><Flame size={18}/> <label className="text-[10px] font-black uppercase tracking-widest">Overhead</label></div>
                        <h4 className="text-3xl font-black text-emerald-600 leading-none">{currentRecipe.energyCost || globalEnergyStandard}<span className="text-sm ml-1 opacity-40">%</span></h4>
                        <p className="text-[8px] font-bold text-gray-400 uppercase italic mt-2">Energi & Utilitas</p>
                     </div>
                  </div>
                  <div className="p-6 bg-gray-900 text-white rounded-3xl shadow-lg flex flex-col justify-center relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 transition-transform duration-1000 group-hover:rotate-0"><Coins size={80}/></div>
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Total HPP Produksi</p>
                     <h4 className="text-3xl font-black text-emerald-400 tracking-tighter leading-none">{formatCurrency(costCalculations.totalProductionCost)}</h4>
                     <div className="mt-3 flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-emerald-500"></div><span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest italic">Include Overhead</span></div>
                  </div>
                  <div className={`p-6 rounded-3xl border-4 flex flex-col justify-center shadow-lg transition-all duration-500 ${costCalculations.foodCostPercent > (currentRecipe.budgetFoodCost || globalTargetFC) ? 'bg-rose-50 border-rose-500 text-rose-800' : 'bg-emerald-50 border-emerald-500 text-emerald-800'}`}>
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-3">Harga Jual Aktual</p>
                     <div className="relative flex items-center"><span className="text-lg font-black opacity-30 mr-1.5">Rp</span><input type="text" value={(Number(currentRecipe.actualSales) || 0).toLocaleString('id-ID')} onChange={e => { const val = parseInt(e.target.value.replace(/[^\d]/g, '')) || 0; setCurrentRecipe({...currentRecipe, actualSales: val}); }} className="w-full bg-transparent border-none outline-none font-black text-4xl tracking-tighter p-0" placeholder="0" /></div>
                     <div className="mt-4 flex items-center justify-between"><span className="text-[9px] font-black uppercase bg-white/50 px-3 py-1 rounded-full shadow-sm">Real: {Math.round(costCalculations.foodCostPercent)}%</span>{costCalculations.foodCostPercent > (currentRecipe.budgetFoodCost || globalTargetFC) && <AlertOctagon size={18} className="text-rose-600 animate-bounce" />}</div>
                  </div>
                  <div className="p-6 bg-emerald-600 text-white rounded-3xl shadow-xl flex flex-col justify-center relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 transition-transform duration-1000 group-hover:scale-150"><BarChart3 size={100}/></div>
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-3">Laba Bersih / Porsi</p>
                     <h4 className="text-3xl font-black text-white tracking-tighter leading-none">{formatCurrency(costCalculations.netProfitNominal)}</h4>
                     <p className="text-[8px] font-bold text-emerald-200 uppercase mt-4 tracking-widest flex items-center gap-1.5"><CheckCircle2 size={10}/> Net Margin Clear</p>
                  </div>
               </div>

               <div className="pt-2">
                  <button type="submit" className="w-full py-6 bg-emerald-600 text-white rounded-[1.8rem] font-black uppercase tracking-widest text-xs shadow-xl hover:bg-black transition-all flex items-center justify-center gap-4 active:scale-95 cursor-pointer"><Save size={24}/> Simpan Hasil Audit Menu</button>
               </div>
            </form>
         </div>
      </div>
    </div>
  );
};

export default HppArchitect;
