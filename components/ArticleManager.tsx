
import React, { useState, useMemo, useEffect } from 'react';
import { Article, Recipe, ProcessedMaterial } from '../types';
import ArticleMasterManager from './ArticleMasterManager';
import { 
  Plus as PlusIcon, 
  Search as SearchIcon, 
  Trash2 as TrashIcon, 
  Edit3 as EditIcon, 
  Save as SaveIcon, 
  X as XIcon, 
  Settings2 as SettingsIcon, 
  FolderTree as FolderIcon,
  ChevronDown as ChevronDownIcon,
  Briefcase as BriefcaseIcon,
  ArrowDownCircle as ArrowIcon,
  Database,
  Layers,
  Sparkles,
  Scale as ScaleIcon
} from 'lucide-react';

interface Props {
  articles: Article[];
  setArticles: React.Dispatch<React.SetStateAction<Article[]>>;
  units: string[];
  setUnits: React.Dispatch<React.SetStateAction<string[]>>;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  recipes: Recipe[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  processedMaterials: ProcessedMaterial[];
  setProcessedMaterials: React.Dispatch<React.SetStateAction<ProcessedMaterial[]>>;
}

const ArticleManager: React.FC<Props> = ({ 
  articles, setArticles, units, setUnits, categories, setCategories,
  recipes, setRecipes, processedMaterials, setProcessedMaterials
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showMasterHub, setShowMasterHub] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const [formData, setFormData] = useState<Partial<Article>>({
    name: '',
    category: categories[0],
    unit: '',
    purchasePrice: 0,
    internalUnit: '',
    conversionFactor: 1,
    baseCost: 0
  });

  useEffect(() => {
    const price = formData.purchasePrice || 0;
    const factor = formData.conversionFactor || 1;
    const calculatedBase = factor > 0 ? price / factor : 0;
    if (formData.baseCost !== calculatedBase) {
      setFormData(prev => ({ ...prev, baseCost: calculatedBase }));
    }
  }, [formData.purchasePrice, formData.conversionFactor]);

  const filteredArticles = useMemo(() => {
    return articles.filter(a => 
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [articles, searchTerm]);

  const totalCatalogValue = useMemo(() => {
    return filteredArticles.reduce((sum, a) => sum + (a.purchasePrice || 0), 0);
  }, [filteredArticles]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category) return;

    const finalData: Article = {
      id: editingArticle?.id || `art-${Date.now()}`,
      code: editingArticle?.code || `ART-${Math.floor(Math.random()*1000)}`,
      name: formData.name.toUpperCase(),
      category: formData.category,
      unit: formData.unit || units[0] || 'pcs',
      purchasePrice: formData.purchasePrice || 0,
      internalUnit: formData.internalUnit || units[0] || 'gr',
      conversionFactor: formData.conversionFactor || 1,
      baseCost: formData.baseCost || 0,
      lastUpdated: new Date().toISOString()
    };

    if (editingArticle) {
      setArticles(prev => prev.map(a => a.id === editingArticle.id ? finalData : a));

      // PROPAGATE TO PROCESSED MATERIALS
      let updatedPMs: ProcessedMaterial[] = [];
      setProcessedMaterials(prev => {
        updatedPMs = prev.map(pm => {
          let hasChange = false;
          const updatedItems = pm.items.map(item => {
            if (item.articleId === editingArticle.id) {
              hasChange = true;
              const newCostPerUnit = finalData.baseCost;
              return {
                ...item,
                name: finalData.name,
                unit: finalData.internalUnit,
                costPerUnit: newCostPerUnit,
                totalCost: item.quantity * newCostPerUnit
              };
            }
            return item;
          });

          if (hasChange) {
            const totalIngredientCost = updatedItems.reduce((sum, i) => sum + i.totalCost, 0);
            const costPerYieldUnit = totalIngredientCost / (pm.yieldQuantity || 1);
            return {
              ...pm,
              items: updatedItems,
              totalIngredientCost,
              costPerYieldUnit,
              lastUpdated: new Date().toISOString()
            };
          }
          return pm;
        });
        return updatedPMs;
      });

      // PROPAGATE TO RECIPES
      setRecipes(prev => {
        return prev.map(recipe => {
          let hasChange = false;
          const updatedItems = recipe.items.map(item => {
            // Check if it's the article
            if (item.articleId === editingArticle.id) {
              hasChange = true;
              const newUnitPrice = finalData.baseCost;
              const newTotalCost = (item.quantity * newUnitPrice) / (item.yield || 1);
              return {
                ...item,
                name: finalData.name,
                unit: finalData.internalUnit,
                unitPrice: newUnitPrice,
                totalCost: newTotalCost
              };
            }
            
            // Check if it's a processed material that was updated
            const updatedPM = updatedPMs.find(pm => pm.id === item.articleId);
            if (updatedPM) {
              hasChange = true;
              const newUnitPrice = updatedPM.costPerYieldUnit;
              const newTotalCost = (item.quantity * newUnitPrice) / (item.yield || 1);
              return {
                ...item,
                name: updatedPM.name,
                unit: updatedPM.yieldUnit,
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
             const targetFC = recipe.budgetFoodCost || 30;
             const recommendedPrice = totalCost / (targetFC / 100);

             return {
               ...recipe,
               items: updatedItems,
               costPrice: rawItemsCost,
               totalCost: totalCost,
               suggestedPrice: recommendedPrice,
               costFoodPercent: foodCostPercent,
               lastUpdated: new Date().toISOString()
             };
          }
          return recipe;
        });
      });
    } else {
      setArticles(prev => [...prev, finalData]);
    }
    handleCloseForm();
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setFormData(article);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Hapus bahan dari katalog? Seluruh resep dan bahan olahan yang menggunakan bahan ini akan ikut terupdate. Lanjutkan?')) return;

    // 1. Delete Article
    setArticles(prev => prev.filter(a => a.id !== id));

    // 2. Delete from Processed Materials
    let updatedPMs: ProcessedMaterial[] = [];
    setProcessedMaterials(prev => {
      updatedPMs = prev.map(pm => {
        const filteredItems = pm.items.filter(item => item.articleId !== id);
        if (filteredItems.length !== pm.items.length) {
          const totalIngredientCost = filteredItems.reduce((sum, i) => sum + i.totalCost, 0);
          const costPerYieldUnit = totalIngredientCost / (pm.yieldQuantity || 1);
          return {
            ...pm,
            items: filteredItems,
            totalIngredientCost,
            costPerYieldUnit,
            lastUpdated: new Date().toISOString()
          };
        }
        return pm;
      });
      return updatedPMs;
    });

    // 3. Delete from Recipes
    setRecipes(prev => {
      return prev.map(recipe => {
        const filteredItems = recipe.items.filter(item => item.articleId !== id);
        
        // We also need to check if any items were processed materials that might have been updated (though here we are deleting an article, not a PM)
        // But wait, if an article is deleted, we only care about items that use that articleId.
        
        if (filteredItems.length !== recipe.items.length) {
           const rawItemsCost = filteredItems.reduce((sum, i) => sum + i.totalCost, 0);
           const energyPercent = recipe.energyCost || 0;
           const totalCost = rawItemsCost + (rawItemsCost * energyPercent / 100);
           const actualSales = recipe.actualSales || 0;
           const foodCostPercent = actualSales > 0 ? (totalCost / actualSales) * 100 : 0;
           const targetFC = recipe.budgetFoodCost || 30;
           const recommendedPrice = totalCost / (targetFC / 100);

           return {
             ...recipe,
             items: filteredItems,
             costPrice: rawItemsCost,
             totalCost: totalCost,
             suggestedPrice: recommendedPrice,
             costFoodPercent: foodCostPercent,
             lastUpdated: new Date().toISOString()
           };
        }
        return recipe;
      });
    });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingArticle(null);
    setFormData({ name: '', category: categories[0], purchasePrice: 0, conversionFactor: 1 });
  };

  const formatCurrency = (val: number) => 'Rp ' + Math.round(val).toLocaleString('id-ID');

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-amber-600 text-white rounded-[1.5rem] shadow-xl animate-scale-in"><BriefcaseIcon size={28} /></div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Katalog Master Bahan</h2>
            <p className="text-sm text-gray-500 font-medium italic mt-2">Database harga beli dan konversi porsi bahan baku.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <button 
            onClick={() => setShowMasterHub(true)} 
            className="flex-1 lg:flex-none px-8 py-4 bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 rounded-2xl font-black text-xs uppercase tracking-widest border-2 border-amber-100 dark:border-amber-900 hover:bg-amber-50 transition-all flex items-center justify-center gap-3 shadow-xl cursor-pointer"
          >
            <SettingsIcon size={18} /> Master Hub
          </button>
          <button 
            onClick={() => { 
              setEditingArticle(null); 
              setFormData({ name: '', category: categories[0], purchasePrice: 0, conversionFactor: 1, unit: units[0] || 'pcs', internalUnit: 'gr' }); 
              setShowForm(true); 
            }} 
            className="flex-1 lg:flex-none px-10 py-4 bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 cursor-pointer group"
          >
            <PlusIcon size={20} className="group-hover:rotate-90 transition-transform" /> Tambah Bahan
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden">
        <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/30">
           <div className="relative max-w-md w-full">
             <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input type="text" placeholder="Cari bahan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl pl-12 pr-6 py-2.5 outline-none font-bold text-sm transition-all shadow-sm focus:border-amber-500" />
           </div>
           <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Nilai Katalog</span>
                <span className="text-sm font-black text-amber-600 leading-none mt-1">{formatCurrency(totalCatalogValue)}</span>
              </div>
              <div className="w-px h-8 bg-gray-200 dark:bg-gray-800 mx-2 hidden sm:block"></div>
              <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-100 dark:border-amber-800 flex items-center gap-2">
                 <Database size={10} className="text-amber-600"/>
                 <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest hidden sm:inline-block">{filteredArticles.length} Bahan Terdata</span>
              </div>
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-3">Nama Bahan</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-center">Unit Beli</th>
                <th className="px-4 py-3 text-right">Harga Beli</th>
                <th className="px-4 py-3 text-center">Isi (Yield)</th>
                <th className="px-4 py-3 text-center text-blue-600">HPP Unit Kecil</th>
                <th className="px-8 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {filteredArticles.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center opacity-30 italic font-black uppercase tracking-widest text-xs">Belum ada bahan baku di katalog</td></tr>
              ) : (
                filteredArticles.map(a => (
                  <tr key={a.id} className="hover:bg-amber-50/10 dark:hover:bg-amber-950/10 transition-colors group">
                    <td className="px-8 py-2">
                       <p className="text-sm font-black text-gray-900 dark:text-white uppercase leading-none group-hover:text-amber-600 transition-colors">{a.name}</p>
                    </td>
                    <td className="px-4 py-2">
                       <span className="text-[9px] font-black text-amber-600 uppercase bg-amber-50 dark:bg-amber-900/40 px-2 py-1 rounded border border-amber-100 dark:border-amber-800">{a.category}</span>
                    </td>
                    <td className="px-4 py-2 text-center">
                       <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase">{a.unit}</span>
                    </td>
                    <td className="px-4 py-2 text-right">
                       <span className="text-xs font-black text-gray-900 dark:text-white tabular-nums">{formatCurrency(a.purchasePrice)}</span>
                    </td>
                    <td className="px-4 py-2 text-center font-black text-gray-500 text-[11px] whitespace-nowrap">{a.conversionFactor} {a.internalUnit}</td>
                    <td className="px-4 py-2 text-center bg-blue-50/10 dark:bg-blue-900/5">
                      <p className="text-[11px] font-black text-blue-700 dark:text-blue-400 italic leading-none whitespace-nowrap">
                        @ {formatCurrency(a.baseCost)} <span className="text-[7px] text-gray-400 ml-0.5">/ {a.internalUnit}</span>
                      </p>
                    </td>
                    <td className="px-8 py-2 text-center">
                       <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(a)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all cursor-pointer"><EditIcon size={15}/></button>
                          <button onClick={() => handleDelete(a.id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all cursor-pointer"><TrashIcon size={15}/></button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredArticles.length > 0 && (
              <tfoot className="bg-gray-50 dark:bg-gray-800/50 border-t-2 border-gray-100 dark:border-gray-700">
                <tr className="font-black">
                  <td colSpan={3} className="px-8 py-4 text-[10px] text-gray-400 uppercase tracking-widest text-right">Total Akumulasi Harga Beli Katalog</td>
                  <td className="px-4 py-4 text-right text-sm text-amber-600 tabular-nums">{formatCurrency(totalCatalogValue)}</td>
                  <td colSpan={3} className="px-4 py-4"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* MODAL MASTER HUB UNTUK KATEGORI & SATUAN */}
      <ArticleMasterManager 
        show={showMasterHub} 
        onClose={() => setShowMasterHub(false)}
        categories={categories}
        setCategories={setCategories}
        units={units}
        setUnits={setUnits}
      />

      {showForm && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center px-4 animate-fade-in">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={handleCloseForm} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[3.5rem] p-10 lg:p-14 animate-scale-in border-t-8 border-amber-600 overflow-y-auto max-h-[95vh] custom-scrollbar shadow-2xl">
            <div className="flex items-center justify-between mb-10">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-2xl shadow-inner"><PlusIcon size={24}/></div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter">{editingArticle ? 'Edit Data Bahan' : 'Registrasi Bahan Baru'}</h3>
               </div>
               <button onClick={handleCloseForm} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer"><XIcon size={28}/></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Bahan Baku / Material</label>
                <input required autoFocus type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} placeholder="BIJI KOPI / SUSU / AYAM" className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-amber-500 rounded-2xl px-6 py-4 outline-none font-black text-sm uppercase transition-all shadow-inner" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kategori Katalog</label>
                  <div className="relative">
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-amber-500 rounded-2xl px-6 py-4 outline-none font-black text-[11px] appearance-none uppercase shadow-inner cursor-pointer">
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      {categories.length === 0 && <option disabled>Master Kategori Kosong</option>}
                    </select>
                    <ChevronDownIcon size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ID / Kode Bahan (Opsional)</label>
                  <input readOnly value={editingArticle?.code || 'AUTO-GENERATE'} className="w-full bg-gray-100 dark:bg-gray-950 border-none rounded-2xl px-6 py-4 outline-none font-mono text-[10px] text-gray-400" />
                </div>
              </div>

              <div className="p-8 bg-amber-50 dark:bg-amber-900/10 rounded-[2.5rem] border-2 border-dashed border-amber-200 dark:border-amber-800 space-y-8">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400"><ArrowIcon size={18} /><h4 className="text-[11px] font-black uppercase tracking-widest">Kalkulasi Harga Beli & Konversi</h4></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Satuan Beli (Nota)</label>
                      <div className="relative">
                        <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-3.5 font-black text-xs uppercase outline-none shadow-sm cursor-pointer appearance-none">
                          {units.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                        </select>
                        <ChevronDownIcon size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Harga Beli per Satuan</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300">Rp</span>
                        <input type="text" value={formData.purchasePrice ? formData.purchasePrice.toLocaleString() : ''} onChange={e => setFormData({...formData, purchasePrice: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0})} placeholder="0" className="w-full bg-white dark:bg-gray-900 border-none rounded-xl pl-10 pr-4 py-3.5 font-black text-sm outline-none shadow-sm" />
                      </div>
                   </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t dark:border-gray-800">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Satuan Pakai (HPP)</label>
                      <div className="relative">
                        <select value={formData.internalUnit} onChange={e => setFormData({...formData, internalUnit: e.target.value})} className="w-full bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-3.5 font-black text-xs uppercase outline-none shadow-sm cursor-pointer appearance-none">
                          {units.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                        </select>
                        <ChevronDownIcon size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Isi per Satuan Beli (Yield)</label>
                      <div className="relative">
                         <input type="number" step="any" value={formData.conversionFactor} onChange={e => setFormData({...formData, conversionFactor: parseFloat(e.target.value) || 1})} className="w-full bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-3.5 font-black text-sm outline-none shadow-sm" />
                         <ScaleIcon size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-blue-600 uppercase ml-1">HPP Satuan Kecil</label>
                      <div className="w-full bg-blue-50 dark:bg-blue-900/30 rounded-xl px-4 py-3.5 font-black text-xs text-blue-700 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900 shadow-sm">
                        {formatCurrency(formData.baseCost || 0)}
                      </div>
                   </div>
                </div>
              </div>

              <div className="flex gap-4">
                 <button 
                   type="submit" 
                   className="flex-1 py-7 bg-amber-600 hover:bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-95 cursor-pointer"
                 >
                    <SaveIcon size={24}/> Simpan Ke Katalog Master
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleManager;
