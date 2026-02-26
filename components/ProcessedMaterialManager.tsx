
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  FlaskConical, Plus, Search, Trash2, Edit3, Save, X, 
  Calculator, ArrowRight, Package, Layers, ChevronRight, 
  TrendingUp, Scale, Globe, Info, Sparkles, ChefHat,
  Database, Zap, ArrowDownCircle, Coins, FileText, BadgeCheck,
  // Fix: Added missing ChevronDown import
  ChevronDown
} from 'lucide-react';
import { Article, ProcessedMaterial, ProcessedMaterialItem, Recipe } from '../types';

interface Props {
  articles: Article[];
  processedMaterials: ProcessedMaterial[];
  setProcessedMaterials: React.Dispatch<React.SetStateAction<ProcessedMaterial[]>>;
  recipes: Recipe[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
}

export default function ProcessedMaterialManager({ articles, processedMaterials, setProcessedMaterials, recipes, setRecipes }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const recommendationRef = useRef<HTMLDivElement>(null);
  
  const [currentMaterial, setCurrentMaterial] = useState<Partial<ProcessedMaterial>>({
    name: '',
    items: [],
    yieldQuantity: 1000,
    yieldUnit: 'gr'
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (recommendationRef.current && !recommendationRef.current.contains(event.target as Node)) {
        setShowRecommendations(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredMaterials = useMemo(() => {
    return (processedMaterials || []).filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [processedMaterials, searchTerm]);

  const recommendedArticles = useMemo(() => {
    if (!ingredientSearch.trim()) return [];
    return articles.filter(a => 
      a.name.toLowerCase().includes(ingredientSearch.toLowerCase())
    ).slice(0, 5);
  }, [articles, ingredientSearch]);

  const handleAddItem = (article: Article) => {
    const newItem: ProcessedMaterialItem = {
      articleId: article.id,
      name: article.name,
      quantity: 1,
      unit: article.internalUnit,
      costPerUnit: article.baseCost,
      totalCost: article.baseCost
    };

    setCurrentMaterial(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));
    
    setIngredientSearch('');
    setShowRecommendations(false);
  };

  const updateItemQty = (index: number, qty: number) => {
    setCurrentMaterial(prev => {
      const items = [...(prev.items || [])];
      const item = items[index];
      items[index] = { 
        ...item, 
        quantity: qty, 
        totalCost: qty * item.costPerUnit 
      };
      return { ...prev, items };
    });
  };

  const removeItem = (index: number) => {
    setCurrentMaterial(prev => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== index)
    }));
  };

  const calculations = useMemo(() => {
    const totalIngredientCost = (currentMaterial.items || []).reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);
    const yieldQty = Number(currentMaterial.yieldQuantity) || 1;
    const costPerYieldUnit = totalIngredientCost / yieldQty;
    return { totalIngredientCost, costPerYieldUnit };
  }, [currentMaterial.items, currentMaterial.yieldQuantity]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMaterial.name) return alert('Input nama bahan olahan!');

    const newMaterial: ProcessedMaterial = {
      id: currentMaterial.id || `proc-${Date.now()}`,
      name: currentMaterial.name.toUpperCase(),
      items: currentMaterial.items || [],
      totalIngredientCost: calculations.totalIngredientCost,
      yieldQuantity: Number(currentMaterial.yieldQuantity) || 1000,
      yieldUnit: currentMaterial.yieldUnit || 'gr',
      costPerYieldUnit: calculations.costPerYieldUnit,
      lastUpdated: new Date().toISOString()
    };

    setProcessedMaterials(prev => {
      const currentArr = Array.isArray(prev) ? prev : [];
      const filtered = currentArr.filter(m => m.id !== newMaterial.id);
      return [...filtered, newMaterial];
    });

    // PROPAGATE TO RECIPES
    setRecipes(prev => {
      return prev.map(recipe => {
        let hasChange = false;
        const updatedItems = recipe.items.map(item => {
          if (item.articleId === newMaterial.id) {
            hasChange = true;
            const newUnitPrice = newMaterial.costPerYieldUnit;
            const newTotalCost = (item.quantity * newUnitPrice) / (item.yield || 1);
            return {
              ...item,
              name: newMaterial.name,
              unit: newMaterial.yieldUnit,
              unitPrice: newUnitPrice,
              totalCost: newTotalCost
            };
          }
          return item;
        });

        if (hasChange) {
          const rawItemsCost = updatedItems.reduce((sum, i) => sum + i.totalCost, 0);
          const energyPercent = recipe.energyCost || 0;
          const totalCost = rawItemsCost + (rawItemsCost * energyPercent / 100);
          const actualSales = recipe.actualSales || 0;
          const foodCostPercent = actualSales > 0 ? (totalCost / actualSales) * 100 : 0;
          const budgetFC = recipe.budgetFoodCost || 30;
          const suggestedPrice = totalCost / (budgetFC / 100);

          return {
            ...recipe,
            items: updatedItems,
            costPrice: rawItemsCost,
            totalCost: totalCost,
            suggestedPrice,
            costFoodPercent: foodCostPercent,
            lastUpdated: new Date().toISOString()
          };
        }
        return recipe;
      });
    });

    setShowEditor(false);
    setCurrentMaterial({ name: '', items: [], yieldQuantity: 1000, yieldUnit: 'gr' });
    alert('Bahan olahan berhasil disimpan ke Database Cloud!');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Hapus bahan olahan ini? Seluruh resep yang menggunakan bahan ini akan ikut terupdate (dihapus itemnya). Lanjutkan?')) return;

    // 1. Delete Processed Material
    setProcessedMaterials(prev => (prev || []).filter(m => m.id !== id));

    // 2. Delete from Recipes
    setRecipes(prev => {
      return prev.map(recipe => {
        const filteredItems = recipe.items.filter(item => item.articleId !== id);
        if (filteredItems.length !== recipe.items.length) {
          const rawItemsCost = filteredItems.reduce((sum, i) => sum + i.totalCost, 0);
          const energyPercent = recipe.energyCost || 0;
          const totalCost = rawItemsCost + (rawItemsCost * energyPercent / 100);
          const actualSales = recipe.actualSales || 0;
          const foodCostPercent = actualSales > 0 ? (totalCost / actualSales) * 100 : 0;
          const budgetFC = recipe.budgetFoodCost || 30;
          const suggestedPrice = totalCost / (budgetFC / 100);

          return {
            ...recipe,
            items: filteredItems,
            costPrice: rawItemsCost,
            totalCost: totalCost,
            suggestedPrice,
            costFoodPercent: foodCostPercent,
            lastUpdated: new Date().toISOString()
          };
        }
        return recipe;
      });
    });
  };

  const formatCurrency = (val: number) => 'Rp ' + (val || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 });

  return (
    <div className="animate-fade-in space-y-10 pb-20">
      {/* HEADER EXECUTIF */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="p-5 bg-amber-600 text-white rounded-[2rem] shadow-xl animate-scale-in">
            <FlaskConical size={32} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1.5">
               <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Bahan Olahan</h2>
               <div className="px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-800 flex items-center gap-1.5">
                  <Database size={10} /> Sync Active
               </div>
            </div>
            <p className="text-sm text-gray-500 font-medium italic">Manajemen perakitan resep bahan baku setengah jadi (Semi-Finished Goods).</p>
          </div>
        </div>

        <button 
          onClick={() => {
            setCurrentMaterial({ name: '', items: [], yieldQuantity: 1000, yieldUnit: 'gr' });
            setShowEditor(true);
          }}
          className="px-10 py-5 bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95 flex items-center gap-3 cursor-pointer group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" /> Rakit Bahan Baru
        </button>
      </div>

      {/* SEARCH BAR PREMIUM */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari koleksi bahan olahan Bapak..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-amber-500 rounded-2xl pl-12 pr-6 py-4 outline-none font-bold text-sm transition-all"
          />
        </div>
        <div className="hidden sm:flex items-center gap-2 px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border dark:border-gray-700">
           <Layers size={18} className="text-amber-600"/>
           <span className="text-[10px] font-black uppercase text-gray-400">{filteredMaterials.length} Koleksi Terdaftar</span>
        </div>
      </div>

      {/* MAIN LIST: TABLE PROFESSIONAL */}
      <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Katalog Bahan Olahan</th>
                <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Output Jadi</th>
                <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Modal Komposisi</th>
                <th className="px-6 py-6 text-[10px] font-black text-blue-600 uppercase tracking-widest text-right">HPP Akhir (@Satuan)</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-32">#</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {filteredMaterials.length === 0 ? (
                <tr><td colSpan={5} className="px-10 py-32 text-center opacity-20 italic font-black uppercase tracking-[0.5em] text-xs">Belum ada bahan olahan dirakit</td></tr>
              ) : (
                filteredMaterials.map(m => (
                  <tr key={m.id} className="hover:bg-amber-50/10 dark:hover:bg-amber-950/10 transition-all group">
                    <td className="px-10 py-8">
                       <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                             <Layers size={24}/>
                          </div>
                          <div>
                             <p className="text-base font-black uppercase tracking-tight text-gray-900 dark:text-white leading-none mb-1.5">{m.name}</p>
                             <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><Zap size={10} className="text-amber-500"/> {m.items?.length || 0} Komponen Bahan Baku</span>
                             </div>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-8 text-center font-black">
                       <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-full border dark:border-gray-700">
                          <span className="text-sm text-gray-900 dark:text-white">{m.yieldQuantity}</span>
                          <span className="text-[10px] text-gray-400 uppercase">{m.yieldUnit}</span>
                       </div>
                    </td>
                    <td className="px-6 py-8 text-right font-black">
                       <p className="text-sm text-gray-700 dark:text-gray-300">{formatCurrency(m.totalIngredientCost)}</p>
                    </td>
                    <td className="px-6 py-8 text-right font-black bg-blue-50/20 dark:bg-blue-900/5">
                       <p className="text-lg text-blue-700 dark:text-blue-400 tracking-tighter">{formatCurrency(m.costPerYieldUnit)}</p>
                       <p className="text-[8px] text-gray-400 uppercase tracking-widest mt-0.5">per {m.yieldUnit}</p>
                    </td>
                    <td className="px-10 py-8 text-center">
                       <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setCurrentMaterial(m); setShowEditor(true); }} className="p-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all cursor-pointer shadow-sm"><Edit3 size={18}/></button>
                          <button onClick={() => handleDelete(m.id)} className="p-3 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all cursor-pointer shadow-sm"><Trash2 size={18}/></button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WORKSHEET EDITOR MODAL */}
      {showEditor && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 animate-fade-in no-print">
           <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowEditor(false)} />
           <div className="relative w-full max-w-6xl bg-white dark:bg-gray-950 rounded-[4rem] shadow-2xl animate-scale-in max-h-[95vh] overflow-hidden flex flex-col border-t-[12px] border-amber-600">
              
              {/* MODAL HEADER */}
              <div className="p-10 border-b dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-950 shrink-0">
                 <div className="flex items-center gap-6">
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-[1.5rem] shadow-inner"><FlaskConical size={32}/></div>
                    <div>
                       <h3 className="text-3xl font-black uppercase tracking-tighter dark:text-white leading-none">Worksheet Perakitan</h3>
                       <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] mt-2 italic flex items-center gap-2">
                         <BadgeCheck size={14} className="text-emerald-500"/> Lab Logic Engine v2.5
                       </p>
                    </div>
                 </div>
                 <button onClick={() => setShowEditor(false)} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"><X size={28}/></button>
              </div>

              {/* MODAL BODY (SCROLLABLE) */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12">
                 <form onSubmit={handleSave} className="space-y-12">
                    
                    {/* TOP IDENTITY SECTION */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                       <div className="lg:col-span-7 space-y-2">
                          <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] ml-3">Nama Identitas Bahan Olahan</label>
                          <input required autoFocus type="text" value={currentMaterial.name} onChange={e => setCurrentMaterial({...currentMaterial, name: e.target.value.toUpperCase()})} placeholder="MISAL: ADONAN DONAT KENTANG" className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-amber-500 rounded-[2rem] px-8 py-5 outline-none font-black text-lg uppercase shadow-inner transition-all" />
                       </div>
                       <div className="lg:col-span-5 space-y-2 relative" ref={recommendationRef}>
                          <label className="text-[11px] font-black text-amber-600 uppercase tracking-[0.3em] ml-3 flex items-center gap-2"><Sparkles size={14}/> Tambah Bahan Baku Katalog</label>
                          <div className="relative">
                             <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20}/>
                             <input 
                               type="text" 
                               value={ingredientSearch}
                               onChange={e => { setIngredientSearch(e.target.value); setShowRecommendations(true); }}
                               onFocus={() => setShowRecommendations(true)}
                               placeholder="CARI NAMA BAHAN..."
                               className="w-full bg-amber-50/50 dark:bg-amber-900/10 border-2 border-transparent focus:border-amber-500 rounded-[2rem] pl-14 pr-6 py-5 outline-none font-black text-sm uppercase shadow-sm transition-all"
                             />
                             {showRecommendations && recommendedArticles.length > 0 && (
                                <div className="absolute top-full left-0 w-full mt-3 bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl border dark:border-gray-700 z-[130] overflow-hidden divide-y dark:divide-gray-800 animate-fade-in">
                                   {recommendedArticles.map(article => (
                                      <button 
                                         key={article.id}
                                         type="button"
                                         onClick={() => handleAddItem(article)}
                                         className="w-full p-6 flex items-center justify-between hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all text-left"
                                      >
                                         <div>
                                            <p className="text-sm font-black uppercase tracking-tight dark:text-white leading-none mb-1">{article.name}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{article.category} • {article.internalUnit}</p>
                                         </div>
                                         <p className="text-xs font-black text-amber-600">{formatCurrency(article.baseCost)}</p>
                                      </button>
                                   ))}
                                </div>
                             )}
                          </div>
                       </div>
                    </div>

                    {/* TABLE AREA */}
                    <div className="space-y-6">
                       <div className="flex items-center justify-between px-2">
                          <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-3"><ChefHat size={18}/> Struktur Komposisi Bahan</h4>
                       </div>
                       <div className="overflow-hidden rounded-[3rem] border dark:border-gray-800 shadow-xl bg-white dark:bg-gray-900">
                          <table className="w-full text-left">
                             <thead>
                                <tr className="bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                                   <th className="px-8 py-5">Nama Bahan Baku</th>
                                   <th className="px-6 py-5 text-center">Takaran Pakai</th>
                                   <th className="px-6 py-5 text-center">HPP @ Unit</th>
                                   <th className="px-8 py-5 text-right bg-amber-700">Subtotal Biaya</th>
                                   <th className="px-8 py-5 text-center w-16">#</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y dark:divide-gray-800">
                                {(currentMaterial.items || []).length === 0 ? (
                                   <tr><td colSpan={5} className="py-24 text-center text-gray-300 italic font-black uppercase tracking-widest">Gunakan pencarian di atas untuk merakit komposisi</td></tr>
                                ) : (
                                   (currentMaterial.items || []).map((item, idx) => (
                                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                                         <td className="px-8 py-6">
                                            <p className="text-sm font-black uppercase text-gray-900 dark:text-white leading-none">{item.name}</p>
                                         </td>
                                         <td className="px-6 py-6 text-center">
                                            <div className="inline-flex items-center gap-3 bg-gray-50 dark:bg-gray-950 border dark:border-gray-800 rounded-xl px-4 py-2">
                                               <input 
                                                  type="number" step="any" value={item.quantity} 
                                                  onChange={e => updateItemQty(idx, parseFloat(e.target.value) || 0)}
                                                  className="w-16 bg-transparent text-center font-black outline-none text-gray-900 dark:text-white"
                                               />
                                               <span className="text-[10px] font-bold text-gray-400 uppercase">{item.unit}</span>
                                            </div>
                                         </td>
                                         <td className="px-6 py-6 text-center text-xs font-bold text-gray-500">{formatCurrency(item.costPerUnit)}</td>
                                         <td className="px-8 py-6 text-right font-black text-amber-700 dark:text-amber-400 bg-amber-50/20">{formatCurrency(item.totalCost)}</td>
                                         <td className="px-8 py-6 text-center">
                                            <button type="button" onClick={() => removeItem(idx)} className="p-2 text-red-300 hover:text-red-500 transition-colors cursor-pointer"><Trash2 size={18}/></button>
                                         </td>
                                      </tr>
                                   ))
                                )}
                             </tbody>
                             <tfoot>
                                <tr className="bg-gray-950 text-white font-black uppercase">
                                   <td colSpan={3} className="px-8 py-6 text-right tracking-[0.3em] text-[10px]">Total Modal Seluruh Bahan Komposisi</td>
                                   <td className="px-8 py-6 text-right text-2xl tracking-tighter text-amber-400">{formatCurrency(calculations.totalIngredientCost)}</td>
                                   <td></td>
                                </tr>
                             </tfoot>
                          </table>
                       </div>
                    </div>

                    {/* YIELD & RESULT SUMMARY CARD */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
                       <div className="md:col-span-7 bg-gray-50 dark:bg-gray-900/50 p-10 rounded-[3.5rem] border-2 border-dashed border-gray-100 dark:border-gray-800 flex flex-col justify-center space-y-8">
                          <div className="flex items-center gap-4">
                             <div className="p-3 bg-amber-600 text-white rounded-2xl"><Scale size={24} /></div>
                             <h4 className="text-xl font-black uppercase tracking-tight">Output Hasil Jadi (Yield)</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Total Jumlah Jadi</label>
                                <input 
                                   type="number" step="any" value={currentMaterial.yieldQuantity} 
                                   onChange={e => setCurrentMaterial({...currentMaterial, yieldQuantity: e.target.value as any})}
                                   className="w-full bg-white dark:bg-gray-950 px-8 py-5 rounded-2xl outline-none font-black text-3xl shadow-inner border border-transparent focus:border-amber-600 transition-all"
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Satuan Hasil</label>
                                <div className="relative">
                                   <select 
                                      value={currentMaterial.yieldUnit}
                                      onChange={e => setCurrentMaterial({...currentMaterial, yieldUnit: e.target.value})}
                                      className="w-full bg-white dark:bg-gray-950 px-8 py-6 rounded-2xl outline-none font-black text-sm uppercase appearance-none shadow-inner cursor-pointer"
                                   >
                                      <option value="gr">GRAM (gr)</option>
                                      <option value="ml">MILILITER (ml)</option>
                                      <option value="pcs">PCS / UNIT</option>
                                      <option value="porsi">PORSI</option>
                                   </select>
                                   {/* Fix: ChevronDown is now imported and defined */}
                                   <ChevronDown size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                             </div>
                          </div>
                          <p className="text-[10px] text-gray-400 font-medium leading-relaxed italic border-l-2 pl-4">
                             "Bapak silakan masukkan berapa gram/ml hasil bersih dari peracikan bahan-bahan di atas setelah diproses (dimasak/diaduk) untuk mendapatkan HPP Satuan yang akurat."
                          </p>
                       </div>

                       <div className="md:col-span-5 bg-indigo-700 text-white p-12 rounded-[4rem] flex flex-col justify-center items-center text-center shadow-[0_20px_50px_-15px_rgba(67,56,202,0.5)] relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000"><Calculator size={200}/></div>
                          <p className="text-[11px] font-black uppercase tracking-[0.5em] opacity-60 mb-3 relative z-10">HPP PRODUK OLAHAN BERSIH</p>
                          <h4 className="text-6xl font-black tracking-tighter relative z-10 leading-none">{formatCurrency(calculations.costPerYieldUnit)}</h4>
                          <p className="text-xs font-bold mt-4 opacity-40 uppercase tracking-widest relative z-10">per {currentMaterial.yieldUnit}</p>
                          
                          <div className="mt-10 grid grid-cols-2 gap-4 w-full relative z-10">
                             <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-md">
                                <p className="text-[9px] font-black uppercase opacity-60">Komponen</p>
                                <p className="text-base font-black">{(currentMaterial.items || []).length} Item</p>
                             </div>
                             <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-md">
                                <p className="text-[9px] font-black uppercase opacity-60">Total Cost</p>
                                <p className="text-base font-black truncate">{formatCurrency(calculations.totalIngredientCost).replace('Rp ', '')}</p>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="pt-6 border-t dark:border-gray-800">
                       <button type="submit" className="w-full py-8 bg-amber-600 hover:bg-amber-700 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[13px] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 cursor-pointer">
                          <Save size={28}/> Simpan Perakitan Ke Katalog Bahan Olahan
                       </button>
                    </div>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
