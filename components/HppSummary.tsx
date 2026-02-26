
import React, { useState, useMemo } from 'react';
import { 
  Utensils, Coffee, Search, PieChart, Filter, 
  ChevronDown, Activity, AlertTriangle, FileText, ImageIcon, Printer,
  CheckCircle2, AlertCircle, XCircle, Check, X, Layers, Box
} from 'lucide-react';
import { Recipe, Article, ExpenseRecord } from '../types';
import AnalisisHpp from './AnalisisHpp';
import HppLaporan from './HppLaporan';
import { storage } from '../services/storageService';
import html2canvas from 'html2canvas';

interface Props {
  recipes: Recipe[];
  articles: Article[];
  expenses: ExpenseRecord[];
  hppSubCategories: { FOOD: string[], BEVERAGE: string[] };
}

const HppSummary: React.FC<Props> = ({ recipes, articles, expenses, hppSubCategories }) => {
  const [activeViewMode, setActiveViewMode] = useState<'OVERVIEW' | 'ANALYSIS'>('OVERVIEW');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'FOOD' | 'BEVERAGE'>('ALL');
  
  // States for Report Feature
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);
  const [showFormalReport, setShowFormalReport] = useState(false);
  const [isCapturingReport, setIsCapturingReport] = useState(false);

  const businessInfo = useMemo(() => storage.getBusinessInfo(), []);

  // Performa HPP Global (Safe Calculation)
  const summaryStats = useMemo(() => {
    const data = Array.isArray(recipes) ? recipes : [];
    if (data.length === 0) return { avgFC: 0, healthyCount: 0, warningCount: 0, criticalCount: 0, totalRecipes: 0 };
    
    const totalFC = data.reduce((sum, r) => sum + (r.costFoodPercent || 0), 0);
    const avgFC = data.length > 0 ? totalFC / data.length : 0;
    
    const healthy = data.filter(r => (r.costFoodPercent || 0) <= 30).length;
    const warning = data.filter(r => (r.costFoodPercent || 0) > 30 && (r.costFoodPercent || 0) <= 35).length;
    const critical = data.filter(r => (r.costFoodPercent || 0) > 35).length;
    
    return { avgFC, healthyCount: healthy, warningCount: warning, criticalCount: critical, totalRecipes: data.length };
  }, [recipes]);

  // Fungsi Cetak
  const handleGenerateReport = () => {
    const currentList = selectedRecipeIds.length > 0 ? selectedRecipeIds : filteredRecipes.map(r => r.id);
    if (currentList.length === 0) {
      alert("Belum ada menu yang bisa dilaporkan, Pak.");
      return;
    }
    if (selectedRecipeIds.length === 0) {
      setSelectedRecipeIds(currentList);
    }
    setShowFormalReport(true);
  };

  const toggleSelection = (id: string) => {
    setSelectedRecipeIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExportFormalJpg = async () => {
    const element = document.getElementById('hpp-formal-report-paper');
    if (!element) {
      alert("Elemen laporan tidak ditemukan. Silakan coba lagi.");
      return;
    }
    
    try {
      setIsCapturingReport(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const canvas = await html2canvas(element, { 
        scale: 2.5, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const link = document.createElement('a');
      link.href = canvas.toDataURL("image/jpeg", 0.9);
      link.download = `Audit_HPP_LMK_${new Date().getTime()}.jpg`;
      link.click();
    } catch (e) {
      console.error("Capture error:", e);
      alert("Gagal mengambil gambar. Pastikan koneksi Bapak stabil.");
    } finally {
      setIsCapturingReport(false);
    }
  };

  const formatCurrency = (val: number) => 'Rp ' + Math.round(val || 0).toLocaleString('id-ID');

  const filteredRecipes = useMemo(() => {
    const data = Array.isArray(recipes) ? recipes : [];
    return data.filter(r => {
      const matchSearch = (r.menuName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = activeFilter === 'ALL' || r.category === activeFilter;
      return matchSearch && matchFilter;
    }).sort((a, b) => (a.menuName || '').localeCompare(b.menuName || ''));
  }, [recipes, searchTerm, activeFilter]);

  // View Laporan Formal
  if (showFormalReport) {
    const dataSafe = Array.isArray(recipes) ? recipes : [];
    const selectedRecipes = dataSafe.filter(r => selectedRecipeIds.includes(r.id));
    return (
       <HppLaporan 
          selectedRecipes={selectedRecipes} 
          businessInfo={businessInfo} 
          periodLabel="AUDIT STRATEGIS" 
          isCapturing={isCapturingReport}
          onClose={() => setShowFormalReport(false)}
          onExportImage={handleExportFormalJpg}
       />
    );
  }

  return (
    <div className="animate-fade-in space-y-10 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-emerald-600 text-white rounded-[1.5rem] shadow-xl"><PieChart size={28} /></div>
          <div>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Costing Intelligent</h2>
            <p className="text-sm text-gray-500 font-medium italic mt-2">Audit performa profitabilitas resep dan menu LMK.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border dark:border-gray-700 w-full sm:w-auto">
             <button onClick={() => setActiveViewMode('OVERVIEW')} className={`flex-1 px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeViewMode === 'OVERVIEW' ? 'bg-white dark:bg-gray-900 text-emerald-600 shadow-md' : 'text-gray-400'}`}>Overview</button>
             <button onClick={() => setActiveViewMode('ANALYSIS')} className={`flex-1 px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeViewMode === 'ANALYSIS' ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-md' : 'text-gray-400'}`}>Analisis</button>
          </div>
          
          <button 
            onClick={handleGenerateReport}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 ${selectedRecipeIds.length > 0 ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
          >
            <FileText size={18} /> 
            {selectedRecipeIds.length > 0 ? `Cetak (${selectedRecipeIds.length}) Menu` : 'Cetak Semua Menu'}
          </button>
        </div>
      </div>

      {activeViewMode === 'OVERVIEW' ? (
        <div className="space-y-10 animate-fade-in">
          {/* STATS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Activity size={80}/></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Rerata Food Cost</p>
                <h4 className={`text-4xl font-black tracking-tighter ${summaryStats.avgFC > 35 ? 'text-rose-600' : 'text-emerald-600'}`}>{Math.round(summaryStats.avgFC)}%</h4>
                <div className="mt-4 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${summaryStats.avgFC <= 35 ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></div>
                  <span className="text-[8px] font-bold text-gray-400 uppercase">Health Index</span>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl flex items-center gap-6">
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner"><CheckCircle2 size={28}/></div>
                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Menu Sehat</p><h4 className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{summaryStats.healthyCount} <span className="text-xs opacity-30">PORSI</span></h4></div>
            </div>
            <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl flex items-center gap-6">
                <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner"><AlertTriangle size={28}/></div>
                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Warning</p><h4 className="text-2xl font-black text-amber-600">{summaryStats.warningCount} <span className="text-xs opacity-30">PORSI</span></h4></div>
            </div>
            <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl flex items-center gap-6">
                <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner"><AlertCircle size={28}/></div>
                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Kritis (FC &gt; 35%)</p><h4 className="text-2xl font-black text-rose-600">{summaryStats.criticalCount} <span className="text-xs opacity-30">PORSI</span></h4></div>
            </div>
          </div>

          {/* SEARCH & FILTER */}
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-6 items-center flex-1">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="Cari menu..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-gray-900 border-2 border-transparent focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 outline-none font-bold text-sm shadow-sm transition-all" />
              </div>
              <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border dark:border-gray-800 px-6 py-3 rounded-2xl shadow-sm">
                <Filter size={16} className="text-gray-400" />
                <select value={activeFilter} onChange={e => setActiveFilter(e.target.value as any)} className="bg-transparent border-none outline-none font-black text-[10px] uppercase tracking-widest text-emerald-600 cursor-pointer">
                  <option value="ALL">SEMUA PRODUK</option>
                  <option value="FOOD">FOOD</option>
                  <option value="BEVERAGE">BEVERAGE</option>
                </select>
              </div>
            </div>

            {selectedRecipeIds.length > 0 && (
              <button 
                onClick={() => setSelectedRecipeIds([])}
                className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm"
              >
                <XCircle size={16}/> Hapus ({selectedRecipeIds.length}) Pilihan
              </button>
            )}
          </div>

          {/* MENU GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredRecipes.map(r => {
               const isSelected = selectedRecipeIds.includes(r.id);
               return (
                <div 
                  key={r.id} 
                  onClick={() => toggleSelection(r.id)}
                  className={`bg-white dark:bg-gray-900 rounded-[3rem] border-4 overflow-hidden flex flex-col group hover:shadow-2xl transition-all relative cursor-pointer ${isSelected ? 'border-indigo-600 shadow-indigo-500/20' : 'border-gray-100 dark:border-gray-800'}`}
                >
                  <div className={`absolute top-6 right-6 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all z-10 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg rotate-0' : 'bg-white/80 border-gray-200 text-transparent opacity-0 group-hover:opacity-100 rotate-45'}`}>
                    <Check size={20} strokeWidth={4} />
                  </div>

                  <div className="p-8">
                    <div className="flex justify-between items-start mb-8">
                      <div className={`p-4 rounded-2xl shadow-sm ${r.category === 'FOOD' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                        {r.category === 'FOOD' ? <Utensils size={24}/> : <Coffee size={24}/>}
                      </div>
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2 ${(r.costFoodPercent || 0) <= 30 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : (r.costFoodPercent || 0) <= 35 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                        {Math.round(r.costFoodPercent || 0)}% Cost
                      </div>
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tighter mb-1 truncate leading-none">{r.menuName}</h3>
                    <p className="text-[9px] font-black px-2 py-0.5 rounded bg-gray-50 dark:bg-gray-800 text-gray-400 uppercase tracking-tighter w-fit mb-6">{r.subCategory}</p>
                    
                    {/* INGREDIENT BREAKDOWN SECTION */}
                    <div className="mt-4 p-5 bg-gray-50/50 dark:bg-gray-800/40 rounded-[2rem] space-y-3 border border-gray-100 dark:border-gray-800 shadow-inner group-hover:bg-white dark:group-hover:bg-gray-950 transition-colors">
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Layers size={12}/> Struktur Komposisi Bahan:</p>
                       <div className="max-h-28 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                          {(r.items || []).map((item, idx) => (
                             <div key={idx} className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-gray-600 dark:text-gray-400 truncate max-w-[120px] uppercase">{item.name}</span>
                                <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 tabular-nums">@ {formatCurrency(item.totalCost).replace('Rp ', '')}</span>
                             </div>
                          ))}
                          {(!r.items || r.items.length === 0) && <p className="text-[9px] text-gray-300 italic uppercase py-2">Resep belum diinput</p>}
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-6 border-t border-dashed dark:border-gray-800 mt-6">
                       <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total HPP</p><p className="text-lg font-black text-indigo-600">{formatCurrency(r.totalCost)}</p></div>
                       <div className="text-right"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Harga Jual</p><p className="text-lg font-black text-blue-700">{formatCurrency(r.actualSales)}</p></div>
                    </div>
                    
                    <div className={`mt-2 pt-4 border-t dark:border-gray-800 flex justify-between items-center rounded-xl transition-colors ${isSelected ? 'bg-indigo-50/30' : 'group-hover:bg-emerald-50/20'}`}>
                       <span className="text-[10px] font-black text-gray-400 uppercase ml-2">Profit Riil / Pax</span>
                       <span className="text-base font-black text-emerald-700 dark:text-emerald-400 mr-2">{formatCurrency((r.actualSales || 0) - (r.totalCost || 0))}</span>
                    </div>
                  </div>
                </div>
               );
            })}
          </div>
        </div>
      ) : (
        <AnalisisHpp 
           recipes={recipes}
           articles={articles}
           expenses={expenses}
           selectedIds={selectedRecipeIds}
           onToggleSelect={(id) => setSelectedRecipeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
           onSelectAll={(ids) => setSelectedRecipeIds(ids)}
           onGenerateReport={() => setShowFormalReport(true)}
        />
      )}
    </div>
  );
};

export default HppSummary;
