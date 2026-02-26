import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Package, Plus, Search, Trash2, Edit3, Save, X, Calculator, Settings2,
  Utensils, Coffee, Receipt, AlertTriangle, CheckCircle2, Target, Library,
  ArrowUpRight, RefreshCw, Clock, ArrowDownCircle, TrendingUp, Tag, Layers,
  FolderOpen, Zap, Info, ShieldAlert, BadgeAlert, Scale
} from 'lucide-react';
import { Article, Recipe, RecipeItem, ProcessedMaterial, ExpenseRecord } from '../types';
import { storage } from '../services/storageService';

interface Props {
  recipes: Recipe[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  articles: Article[];
  setArticles: React.Dispatch<React.SetStateAction<Article[]>>;
}

const HppProductionManager: React.FC<Props> = ({ recipes, setRecipes, articles, setArticles }) => {
  const [activeTab, setActiveTab] = useState<'RECIPES' | 'ARTICLES' | 'ALERTS'>('RECIPES');
  const [units, setUnits] = useState<string[]>(storage.getUnits());
  const [processedMaterials, setProcessedMaterials] = useState<ProcessedMaterial[]>(storage.getProcessedMaterials());
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(storage.getExpenses());
  const [hppSubCategories, setHppSubCategories] = useState<{ FOOD: string[], BEVERAGE: string[] }>(storage.getHppSubCategories());
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  useEffect(() => { storage.setArticles(articles); }, [articles]);
  useEffect(() => { storage.setRecipes(recipes); }, [recipes]);

  // =========================================================
  // CORE ENGINE: SMART PRICE SYNC (FUZZY MATCH LOGIC)
  // =========================================================
  const priceDiscrepancies = useMemo(() => {
    const alerts: any[] = [];
    const rawExp = expenses.filter(e => e.category.includes('Bahan Baku'));
    
    articles.forEach(article => {
      // Algoritma Pencocokan Pintar (Fuzzy Match):
      // Mencocokkan jika nama katalog ada di catatan, atau sebaliknya.
      const relatedExpenses = rawExp.filter(e => {
        if (e.articleId === article.id) return true;
        const note = (e.notes || '').toUpperCase();
        const artName = article.name.toUpperCase();
        return note.includes(artName) || artName.includes(note);
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const latestExp = relatedExpenses[0];
      
      if (latestExp) {
        // LOGIKA INFERRED UNIT: Ambil Qty nota dan asumsikan satuannya adalah Master Beli
        const actualPricePerUnit = latestExp.amount / (latestExp.qty || 1);
        const masterPrice = article.purchasePrice;
        
        // Deteksi Kenaikan/Penurunan (Abaikan selisih di bawah Rp 50 untuk menghindari noise)
        if (Math.abs(actualPricePerUnit - masterPrice) > 50) { 
          const diff = actualPricePerUnit - masterPrice;
          const percent = (diff / masterPrice) * 100;
          
          // Deteksi Inkonsistensi Satuan (Jika harga beda > 500%, kemungkinan salah input Qty atau kemasan berubah)
          const isInconsistent = Math.abs(percent) > 500;

          alerts.push({ 
            articleId: article.id, 
            name: article.name, 
            masterPrice, 
            actualPrice: actualPricePerUnit, 
            diff, 
            percent, 
            date: latestExp.date, 
            unitInferred: article.unit, 
            isAutoMatched: !latestExp.articleId,
            isInconsistent
          });
        }
      }
    });
    return alerts.sort((a, b) => b.percent - a.percent);
  }, [expenses, articles]);

  const updateMasterPrice = (alert: any) => {
    const msg = alert.isInconsistent 
      ? `PERINGATAN KRITIS: Selisih harga mencapai ${Math.round(alert.percent)}%. \nPastikan Qty pada nota belanja sudah benar untuk 1 ${alert.unitInferred}. \n\nLanjutkan Update Katalog?`
      : `Update harga ${alert.name} dari ${formatCurrency(alert.masterPrice)} ke ${formatCurrency(alert.actualPrice)} per ${alert.unitInferred}?`;

    if (confirm(msg)) {
      setArticles(prev => prev.map(a => {
        if (a.id === alert.articleId) {
          const newPrice = alert.actualPrice;
          return { 
            ...a, 
            purchasePrice: newPrice, 
            baseCost: newPrice / (a.conversionFactor || 1), 
            lastUpdated: new Date().toISOString() 
          };
        }
        return a;
      }));
      alert('Katalog diperbarui! Semua HPP resep terkait telah dikalibrasi ulang secara otomatis.');
    }
  };

  const [articleData, setArticleData] = useState<Partial<Article>>({ name: '', category: 'BAHAN BAKU', unit: 'pcs', purchasePrice: 0, internalUnit: 'gr', conversionFactor: 1, baseCost: 0 });

  useEffect(() => {
    const p = articleData.purchasePrice || 0;
    const f = articleData.conversionFactor || 1;
    const calc = f > 0 ? p / f : 0;
    if (articleData.baseCost !== calc) setArticleData(prev => ({ ...prev, baseCost: calc }));
  }, [articleData.purchasePrice, articleData.conversionFactor]);

  const handleArticleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData: Article = { id: editingArticle?.id || `art-${Date.now()}`, code: editingArticle?.code || `ART-${Math.floor(Math.random()*1000)}`, name: articleData.name!.toUpperCase(), category: articleData.category!, unit: articleData.unit!, purchasePrice: articleData.purchasePrice!, internalUnit: articleData.internalUnit!, conversionFactor: articleData.conversionFactor!, baseCost: articleData.baseCost!, lastUpdated: new Date().toISOString() };
    setArticles(prev => editingArticle ? prev.map(a => a.id === editingArticle.id ? finalData : a) : [...prev, finalData]);
    setShowArticleForm(false);
    setEditingArticle(null);
  };

  const formatCurrency = (val: number) => 'Rp ' + Math.round(val).toLocaleString('id-ID');

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-600 text-white rounded-[1.5rem] shadow-xl"><Library size={28} /></div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Produksi & Margin</h2>
            <p className="text-sm text-gray-500 font-medium italic mt-2">Sinkronisasi HPP otomatis berbasis history belanja riil.</p>
          </div>
        </div>
        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border dark:border-gray-700">
           <button onClick={() => setActiveTab('RECIPES')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'RECIPES' ? 'bg-white dark:bg-gray-900 text-emerald-600 shadow-md' : 'text-gray-400'}`}>Resep Menu</button>
           <button onClick={() => setActiveTab('ARTICLES')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'ARTICLES' ? 'bg-white dark:bg-gray-900 text-emerald-600 shadow-md' : 'text-gray-400'}`}>Katalog Bahan</button>
           <button onClick={() => setActiveTab('ALERTS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer relative ${activeTab === 'ALERTS' ? 'bg-white dark:bg-gray-900 text-red-600 shadow-md' : 'text-gray-400'}`}>
              Sync Harga{priceDiscrepancies.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900">{priceDiscrepancies.length}</span>}
           </button>
        </div>
      </div>

      {activeTab === 'ALERTS' && (
        <div className="space-y-6">
           <div className="bg-red-50 dark:bg-red-950/20 p-8 rounded-[2.5rem] border border-red-100 dark:border-red-900/30 flex items-center gap-6 animate-fade-in">
              <div className="p-4 bg-red-600 text-white rounded-3xl animate-pulse"><AlertTriangle size={32}/></div>
              <div>
                 <h3 className="text-2xl font-black text-red-700 dark:text-red-400 uppercase tracking-tighter leading-none">Smart Price Sync</h3>
                 <p className="text-xs font-bold text-red-600 dark:text-red-500 uppercase mt-2 italic">Mendeteksi fluktuasi harga pasar melalui nota belanja tim Purchasing.</p>
              </div>
           </div>

           <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border-2 border-dashed border-blue-200 flex gap-4">
              <Info className="text-blue-600 shrink-0 mt-1" size={24}/>
              <p className="text-[11px] text-blue-800 dark:text-blue-300 font-medium leading-relaxed italic">
                 <b>Metode Audit:</b> Sistem secara cerdas menyambungkan catatan pengeluaran ke Katalog Bahan (Fuzzy Matching). Karena pengeluaran tidak memiliki kolom satuan, sistem menggunakan <b>Satuan Master Katalog</b> sebagai basis hitung (Inferred Unit).
              </p>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {priceDiscrepancies.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-20 text-center border-2 border-dashed dark:border-gray-800">
                   <CheckCircle2 size={60} className="text-green-500 mx-auto mb-4" />
                   <h4 className="text-xl font-black uppercase tracking-widest text-gray-400">Seluruh Harga Katalog Sudah Sinkron</h4>
                </div>
              ) : (
                priceDiscrepancies.map((alert, idx) => (
                  <div key={idx} className={`bg-white dark:bg-gray-900 rounded-[2rem] border-l-[12px] p-8 shadow-xl flex flex-col md:flex-row justify-between items-center gap-8 group transition-all hover:scale-[1.01] ${alert.isInconsistent ? 'border-orange-500' : 'border-red-600'}`}>
                    <div className="flex items-center gap-6 flex-1">
                       <div className={`p-4 rounded-3xl relative ${alert.isInconsistent ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'}`}>
                          {alert.isInconsistent ? <BadgeAlert size={28}/> : <ArrowUpRight size={28}/>}
                          {alert.isAutoMatched && <div className="absolute -top-2 -right-2 bg-blue-600 text-white p-1 rounded-full" title="Nama Cocok Otomatis"><Zap size={10} /></div>}
                       </div>
                       <div>
                          <h4 className="text-xl font-black uppercase tracking-tight mb-1">{alert.name}</h4>
                          <div className="flex flex-wrap items-center gap-2">
                             <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${alert.percent > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {alert.percent > 0 ? 'Naik' : 'Turun'} {Math.abs(Math.round(alert.percent))}%
                             </span>
                             <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Inferred Unit: {alert.unitInferred}</span>
                             {alert.isInconsistent && <span className="text-[8px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 animate-pulse">CHECK QTY!</span>}
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex gap-10">
                       <div className="text-left">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Harga Katalog</p>
                          <p className="text-sm font-black text-gray-400 line-through decoration-1">{formatCurrency(alert.masterPrice)}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Harga Nota Baru</p>
                          <p className={`text-xl font-black ${alert.isInconsistent ? 'text-orange-600' : 'text-red-700'}`}>{formatCurrency(alert.actualPrice)}</p>
                       </div>
                    </div>

                    <button 
                       onClick={() => updateMasterPrice(alert)} 
                       className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${alert.isInconsistent ? 'bg-orange-600 text-white' : 'bg-red-600 text-white'}`}
                    >
                       <RefreshCw size={16}/> SINKRONISASI HPP
                    </button>
                  </div>
                ))
              )}
           </div>
        </div>
      )}

      {activeTab === 'RECIPES' && (
        <div className="space-y-6">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
              <div className="relative max-w-md w-full">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                 <input type="text" placeholder="Cari resep menu..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl pl-12 pr-6 py-3 outline-none font-bold text-sm shadow-sm transition-all focus:border-emerald-500"/>
              </div>
              <button onClick={() => alert('Gunakan menu "Worksheet HPP" di sidebar untuk input resep, Pak.')} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 cursor-pointer"><Plus size={18}/> Tambah Menu Baru</button>
           </div>
           <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden">
              <table className="w-full text-left">
                 <thead><tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-5">Identitas Menu</th><th className="px-4 py-5 text-center">HPP Total</th><th className="px-4 py-5 text-center">Harga Jual</th><th className="px-4 py-5 text-center">Cost %</th><th className="px-8 py-5 text-center">Aksi</th></tr></thead>
                 <tbody className="divide-y dark:divide-gray-800">
                    {recipes.filter(r => r.menuName.toLowerCase().includes(searchTerm.toLowerCase())).map(r => (
                       <tr key={r.id} className="hover:bg-emerald-50/10 transition-colors">
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.category === 'FOOD' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>{r.category === 'FOOD' ? <Utensils size={18}/> : <Coffee size={18}/>}</div>
                                <div><p className="text-sm font-black uppercase leading-none mb-1">{r.menuName}</p><span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-blue-50 text-blue-500 dark:bg-blue-900/30 uppercase">{r.subCategory}</span></div>
                             </div>
                          </td>
                          <td className="px-4 py-6 text-center font-black text-emerald-600">{formatCurrency(r.totalCost)}</td>
                          <td className="px-4 py-6 text-center font-black text-blue-700">{formatCurrency(r.actualSales)}</td>
                          <td className="px-4 py-6 text-center">
                             <span className={`px-3 py-1 rounded-full text-[10px] font-black ${r.costFoodPercent < 35 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {Math.round(r.costFoodPercent)}%
                             </span>
                          </td>
                          <td className="px-8 py-6 text-center">
                             <div className="flex items-center justify-center gap-2">
                                <button onClick={() => alert('Gunakan "Worksheet HPP" untuk mengedit, Pak.')} className="p-2 text-blue-500 hover:bg-emerald-50 rounded-xl cursor-pointer"><Edit3 size={16}/></button>
                                <button onClick={() => setRecipes(p => p.filter(i => i.id !== r.id))} className="p-2 text-red-400 hover:bg-red-50 rounded-xl cursor-pointer"><Trash2 size={16}/></button>
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {activeTab === 'ARTICLES' && (
        <div className="space-y-6">
           <div className="flex justify-between items-center">
              <div className="relative max-w-md w-full"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/><input type="text" placeholder="Cari bahan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl pl-12 pr-6 py-3 outline-none font-bold text-sm shadow-sm transition-all focus:border-emerald-500"/></div>
              <button onClick={() => { setEditingArticle(null); setShowArticleForm(true); }} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 cursor-pointer"><Plus size={18}/> Tambah Bahan Baru</button>
           </div>
           <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead><tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-5">Nama Bahan</th><th className="px-4 py-5 text-center">Satuan Beli / Harga</th><th className="px-4 py-5 text-center">Cost @ Satuan Dalam</th><th className="px-8 py-5 text-center">Aksi</th></tr></thead>
                <tbody className="divide-y dark:divide-gray-800">
                  {articles.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())).map(a => (
                    <tr key={a.id} className="hover:bg-amber-50/10 transition-colors"><td className="px-8 py-6"><p className="text-sm font-black uppercase text-gray-900 dark:text-white leading-none mb-1">{a.name}</p><p className="text-[9px] font-bold text-gray-400 uppercase">{a.category}</p></td><td className="px-4 py-6 text-center"><p className="text-xs font-black uppercase text-gray-700 dark:text-gray-300">{a.unit}</p><p className="text-[10px] font-bold text-gray-400 italic">{formatCurrency(a.purchasePrice)}</p></td><td className="px-4 py-6 text-center bg-blue-50/20 dark:bg-blue-900/10"><p className="text-[11px] font-black text-blue-700 italic">@ {formatCurrency(a.baseCost)} / {a.internalUnit}</p></td><td className="px-8 py-6 text-center"><div className="flex items-center justify-center gap-2"><button onClick={() => { setEditingArticle(a); setArticleData(a); setShowArticleForm(true); }} className="p-2 text-blue-500 hover:bg-emerald-50 rounded-xl cursor-pointer"><Edit3 size={16}/></button><button onClick={() => setArticles(p => p.filter(i => i.id !== a.id))} className="p-2 text-red-400 hover:bg-red-50 rounded-xl cursor-pointer"><Trash2 size={16}/></button></div></td></tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {/* FORM: MASTER BAHAN (ARTICLE) */}
      {showArticleForm && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center px-4 animate-fade-in">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowArticleForm(false)} />
           <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[3rem] p-10 lg:p-14 animate-scale-in border-t-8 border-emerald-600 shadow-2xl max-h-[95vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-10">
                 <h3 className="text-2xl font-black uppercase tracking-tighter">{editingArticle ? 'Edit Master Bahan' : 'Registrasi Bahan Baru'}</h3>
                 <button onClick={() => setShowArticleForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer"><X size={32}/></button>
              </div>

              <form onSubmit={handleArticleSubmit} className="space-y-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Nama Bahan Baku</label>
                    <input required value={articleData.name} onChange={e => setArticleData({...articleData, name: e.target.value.toUpperCase()})} placeholder="BIJI KOPI / AYAM / BERAS..." className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-600 rounded-[1.8rem] px-8 py-5 outline-none font-black text-sm uppercase shadow-inner transition-all" />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Satuan Beli (Nota)</label>
                       <select value={articleData.unit} onChange={e => setArticleData({...articleData, unit: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-600 rounded-[1.5rem] px-8 py-5 outline-none font-black text-xs uppercase appearance-none">
                          {units.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Harga Beli per Satuan</label>
                       <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-300">Rp</span>
                          <input type="text" value={articleData.purchasePrice?.toLocaleString('id-ID') || ''} onChange={e => setArticleData({...articleData, purchasePrice: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0})} className="w-full pl-12 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-600 rounded-[1.5rem] px-8 py-5 outline-none font-black text-sm shadow-inner" />
                       </div>
                    </div>
                 </div>

                 <div className="p-8 bg-blue-50 dark:bg-blue-900/10 rounded-[2.5rem] border-2 border-dashed border-blue-200 dark:border-blue-800 space-y-6">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><Scale size={14}/> Konversi Gramasi / HPP</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="space-y-1.5"><label className="text-[9px] font-black text-gray-400 uppercase ml-2">Isi Bersih</label><input type="number" step="any" value={articleData.conversionFactor} onChange={e => setArticleData({...articleData, conversionFactor: parseFloat(e.target.value) || 1})} className="w-full bg-white dark:bg-gray-900 rounded-xl px-4 py-3 outline-none font-black text-sm" /></div>
                       <div className="space-y-1.5"><label className="text-[9px] font-black text-gray-400 uppercase ml-2">Satuan Dalam</label><select value={articleData.internalUnit} onChange={e => setArticleData({...articleData, internalUnit: e.target.value})} className="w-full bg-white dark:bg-gray-900 rounded-xl px-4 py-3 outline-none font-black text-xs uppercase">{units.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                       <div className="space-y-1.5"><label className="text-[9px] font-black text-blue-600 uppercase ml-2">HPP Unit</label><div className="w-full bg-blue-600 text-white rounded-xl px-4 py-3 font-black text-xs flex items-center justify-center">{formatCurrency(articleData.baseCost || 0)}</div></div>
                    </div>
                 </div>

                 <button type="submit" className="w-full py-7 bg-emerald-600 text-white rounded-[2.2rem] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-4 cursor-pointer active:scale-95">
                    <Save size={24}/> Simpan Ke Katalog
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default HppProductionManager;
