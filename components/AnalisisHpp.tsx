import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, TrendingDown, CheckSquare, FileText, 
  ArrowRight, MousePointer2, Check, Plus, Square,
  PieChart, Activity, Target, Coins, AlertTriangle,
  Zap, ArrowUpRight, Flame, ShieldAlert, BarChart3,
  Search, Info, Scale, CheckCircle2, Star, AlertCircle,
  HelpCircle, ChevronRight, Gauge, Briefcase, ShoppingCart,
  Percent, ArrowDownCircle, Lightbulb, BadgeAlert, Layers,
  X
} from 'lucide-react';
import { Recipe, Article, ExpenseRecord } from '../types';

interface Props {
  recipes: Recipe[];
  articles: Article[];
  expenses: ExpenseRecord[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onGenerateReport: () => void;
}

const AnalisisHpp: React.FC<Props> = ({ recipes, articles, expenses, selectedIds, onToggleSelect, onSelectAll, onGenerateReport }) => {
  const [sensitivityPercent, setSensitivityPercent] = useState(10);

  const analysis = useMemo(() => {
    const data = recipes || [];
    if (data.length === 0) return null;

    // 1. Core Summary Stats
    const totalPotentialRevenue = data.reduce((sum, r) => sum + (r.actualSales || 0), 0);
    const totalProductionCost = data.reduce((sum, r) => sum + (r.totalCost || 0), 0);
    const avgFC = totalPotentialRevenue > 0 ? (totalProductionCost / totalPotentialRevenue) * 100 : 0;
    const totalPotentialMargin = totalPotentialRevenue - totalProductionCost;

    // 2. Menu Matrix 2.0
    const stars = data.filter(r => r.costFoodPercent <= 28); // Profit Tinggi
    const plowhorses = data.filter(r => r.costFoodPercent > 28 && r.costFoodPercent <= 35); // Standar
    const dogs = data.filter(r => r.costFoodPercent > 35); // Kritis

    // 3. Ingredient Impact (Bahan mana yang paling bikin boros?)
    const inflationAlerts: any[] = [];
    const bahanExp = expenses.filter(e => e.category.includes('Bahan Baku'));
    
    articles.forEach(art => {
      const related = bahanExp.filter(e => e.notes.toUpperCase().includes(art.name.toUpperCase()) || art.name.toUpperCase().includes(e.notes.toUpperCase()))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (related.length > 0) {
        const actualPrice = (related[0].amount || 0) / (related[0].qty || 1);
        if (actualPrice > (art.purchasePrice || 0) + 1) {
          const diff = actualPrice - (art.purchasePrice || 0);
          const diffPercent = (diff / (art.purchasePrice || 1)) * 100;
          const affectedRecipes = data.filter(r => r.items.some(i => i.articleId === art.id));
          
          if (affectedRecipes.length > 0) {
            inflationAlerts.push({
              name: art.name,
              diffPercent,
              actualPrice,
              masterPrice: art.purchasePrice,
              affectedCount: affectedRecipes.length,
              impactLevel: diffPercent > 15 ? 'HIGH' : 'MEDIUM'
            });
          }
        }
      }
    });

    // 4. Distribution Groups
    const dist = {
      under25: data.filter(r => r.costFoodPercent <= 25).length,
      range25to35: data.filter(r => r.costFoodPercent > 25 && r.costFoodPercent <= 35).length,
      over35: data.filter(r => r.costFoodPercent > 35).length
    };

    return { 
      avgFC, totalItems: data.length, totalPotentialMargin, totalPotentialRevenue,
      stars, plowhorses, dogs, 
      inflationAlerts: inflationAlerts.sort((a, b) => b.diffPercent - a.diffPercent),
      dist 
    };
  }, [recipes, articles, expenses]);

  const formatCurrency = (val: number) => 'Rp ' + Math.round(val).toLocaleString('id-ID');

  if (!analysis) return (
    <div className="py-32 text-center opacity-30 italic font-black uppercase tracking-[0.5em] text-xs">Belum ada data audit resep</div>
  );

  return (
    <div className="space-y-12 animate-fade-in pb-32">
      
      {/* SECTION 1: EXECUTIVE KPI DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] shadow-xl border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 p-8 opacity-5 group-hover:scale-110 transition-transform"><Gauge size={100}/></div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Health Index HPP</p>
            <h4 className={`text-4xl font-black tracking-tighter ${analysis.avgFC > 35 ? 'text-rose-600' : 'text-emerald-600'}`}>
               {Math.round(analysis.avgFC)}%
            </h4>
            <p className="text-[9px] font-bold text-gray-400 uppercase mt-2">Weighted Average FC</p>
         </div>
         <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] shadow-xl border border-gray-100 dark:border-gray-800 flex items-center gap-6">
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner"><Layers size={28}/></div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Populasi Menu</p>
               <h4 className="text-2xl font-black">{analysis.totalItems} <span className="text-xs opacity-30">RECIPES</span></h4>
            </div>
         </div>
         <div className="bg-emerald-600 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-6 opacity-20"><TrendingUp size={80}/></div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Potential Margin</p>
            <h4 className="text-2xl font-black tracking-tighter">{formatCurrency(analysis.totalPotentialMargin)}</h4>
            <p className="text-[9px] font-bold uppercase mt-2 opacity-60">Per 1 Siklus Porsi</p>
         </div>
         <div className="bg-rose-600 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-6 opacity-20"><BadgeAlert size={80}/></div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Risiko Inflasi</p>
            <h4 className="text-2xl font-black tracking-tighter">{analysis.inflationAlerts.length} <span className="text-xs opacity-50">BAHAN</span></h4>
            <p className="text-[9px] font-bold uppercase mt-2 opacity-60">Butuh Koreksi Harga</p>
         </div>
      </div>

      {/* SECTION 2: STRATEGIC INFLATION & SENSITIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 bg-gray-950 rounded-[4rem] p-10 lg:p-14 text-white relative overflow-hidden shadow-2xl border-b-8 border-rose-600">
            <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 transition-transform duration-1000"><Zap size={300} className="text-rose-500" /></div>
            <div className="relative z-10">
               <div className="flex justify-between items-start mb-12">
                  <div className="flex items-center gap-6">
                     <div className="p-4 bg-rose-600 text-white rounded-[2rem] shadow-lg animate-pulse"><AlertTriangle size={32}/></div>
                     <div>
                        <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">Inflation Tracker</h3>
                        <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mt-2 italic">Deteksi Real-time Deviasi Harga Pasar</p>
                     </div>
                  </div>
                  <div className="hidden sm:block text-right">
                     <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Sistem Audit LMK v2.5</span>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {analysis.inflationAlerts.length === 0 ? (
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-white/10 rounded-[3rem] opacity-30 italic uppercase font-black tracking-widest text-xs">Seluruh Harga Bahan Baku Sesuai Katalog</div>
                  ) : (
                    analysis.inflationAlerts.slice(0, 4).map((alert, i) => (
                       <div key={i} className={`p-6 rounded-[2.5rem] border-2 transition-all hover:bg-white/5 ${alert.impactLevel === 'HIGH' ? 'bg-rose-50/10 border-rose-500/40' : 'bg-white/5 border-white/10'}`}>
                          <div className="flex justify-between items-start mb-4">
                             <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${alert.impactLevel === 'HIGH' ? 'bg-rose-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                                Impact: {alert.impactLevel}
                             </div>
                             <span className="text-rose-500 font-black text-xs">+{Math.round(alert.diffPercent)}%</span>
                          </div>
                          <h4 className="text-lg font-black uppercase mb-4 leading-tight truncate">{alert.name}</h4>
                          <div className="flex justify-between items-end pt-4 border-t border-white/5">
                             <div><p className="text-[8px] text-gray-500 uppercase">Katalog Master</p><p className="text-xs font-bold text-gray-400">{formatCurrency(alert.masterPrice)}</p></div>
                             <div className="text-right"><p className="text-[8px] text-rose-400 uppercase">Harga Riil Terkini</p><p className="text-sm font-black text-rose-500">{formatCurrency(alert.actualPrice)}</p></div>
                          </div>
                       </div>
                    ))
                  )}
               </div>
            </div>
         </div>

         {/* DISTRIBUTION CHART CARD */}
         <div className="lg:col-span-4 bg-white dark:bg-gray-900 p-10 rounded-[4rem] border border-gray-100 dark:border-gray-800 shadow-xl flex flex-col justify-between group">
            <div className="space-y-8">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl"><PieChart size={24}/></div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">Sebaran Cost</h3>
               </div>
               
               <div className="space-y-6">
                  {[
                    { label: 'Sehat (≤ 25%)', val: analysis.dist.under25, color: 'bg-emerald-500', pct: (analysis.dist.under25 / analysis.totalItems) * 100 },
                    { label: 'Standar (26-35%)', val: analysis.dist.range25to35, color: 'bg-blue-500', pct: (analysis.dist.range25to35 / analysis.totalItems) * 100 },
                    { label: 'Kritis (> 35%)', val: analysis.dist.over35, color: 'bg-rose-500', pct: (analysis.dist.over35 / analysis.totalItems) * 100 }
                  ].map((d, i) => (
                    <div key={i} className="space-y-2">
                       <div className="flex justify-between text-[10px] font-black uppercase text-gray-400 px-1">
                          <span>{d.label}</span>
                          <span className="text-gray-900 dark:text-white">{d.val} Menu</span>
                       </div>
                       <div className="h-3 w-full bg-gray-50 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                          <div className={`h-full ${d.color} transition-all duration-1000`} style={{ width: `${d.pct}%` }} />
                       </div>
                    </div>
                  ))}
               </div>
            </div>
            
            <div className="mt-10 p-5 bg-gray-50 dark:bg-gray-800 rounded-3xl flex gap-4">
               <Info size={20} className="text-blue-500 shrink-0 mt-1" />
               <p className="text-[10px] text-gray-500 font-medium leading-relaxed italic">Menu di kategori <b>Kritis</b> disarankan untuk dievaluasi ulang porsinya segera, Pak.</p>
            </div>
         </div>
      </div>

      {/* SECTION 3: STRATEGIC MENU ENGINE (MATRIX) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* STAR MENU: ACTION PROFIT MAXIMIZATION */}
         <div className="bg-emerald-50/50 dark:bg-emerald-950/10 p-10 rounded-[4rem] border-2 border-emerald-500 shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 p-6 opacity-5 group-hover:rotate-12 transition-all"><Star size={150} className="text-emerald-600"/></div>
            <div className="flex items-center gap-5 mb-10 relative z-10">
               <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg"><TrendingUp size={28}/></div>
               <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-emerald-800 dark:text-emerald-400 leading-none">Stars Menu</h3>
                  <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest mt-2">Profit Maksimal</p>
               </div>
            </div>
            <div className="space-y-4 relative z-10">
               {analysis.stars.slice(0, 8).map(r => (
                  <div key={r.id} className="p-5 bg-white dark:bg-gray-900 rounded-3xl flex justify-between items-center shadow-sm border border-emerald-100 dark:border-emerald-900/50 hover:scale-[1.03] transition-all cursor-default">
                     <div className="overflow-hidden pr-4"><p className="text-xs font-black uppercase truncate text-gray-800 dark:text-white leading-none">{r.menuName}</p><p className="text-[8px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">{r.subCategory}</p></div>
                     <div className="text-right shrink-0"><p className="text-base font-black text-emerald-600 leading-none">{Math.round(r.costFoodPercent)}%</p><span className="text-[7px] font-black uppercase text-gray-400">Low Cost</span></div>
                  </div>
               ))}
            </div>
            <div className="mt-10 p-6 bg-emerald-600 text-white rounded-[2rem] shadow-xl"><div className="flex items-center gap-2 mb-2"><Lightbulb size={16}/><h5 className="text-[10px] font-black uppercase tracking-widest">Rekomendasi Strategis</h5></div><p className="text-[10px] font-medium leading-relaxed italic opacity-90 uppercase">Pertahankan Kualitas & Jadikan menu ini sebagai "Best Seller" di marketing Media Sosial Bapak.</p></div>
         </div>

         {/* PLOWHORSES: VOLUME OVER PROFIT */}
         <div className="bg-white dark:bg-gray-900 p-10 rounded-[4rem] border border-gray-100 dark:border-gray-800 shadow-xl group">
            <div className="flex items-center gap-5 mb-10">
               <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg"><Activity size={28}/></div>
               <div><h3 className="text-2xl font-black uppercase tracking-tighter text-blue-700 dark:text-blue-400 leading-none">Standard Menu</h3><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Performa Stabil</p></div>
            </div>
            <div className="space-y-4">
               {analysis.plowhorses.slice(0, 8).map(r => (
                  <div key={r.id} className="p-5 bg-gray-50 dark:bg-black rounded-3xl flex justify-between items-center border border-transparent hover:border-blue-200 transition-all">
                     <div className="overflow-hidden pr-4"><p className="text-xs font-black uppercase truncate text-gray-700 dark:text-gray-300 leading-none">{r.menuName}</p></div>
                     <div className="text-right shrink-0"><p className="text-base font-black text-blue-600 leading-none">{Math.round(r.costFoodPercent)}%</p></div>
                  </div>
               ))}
            </div>
         </div>

         {/* DOGS: URGENT EVALUATION */}
         <div className="bg-rose-50/50 dark:bg-rose-950/10 p-10 rounded-[4rem] border-2 border-rose-500 shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 p-6 opacity-5 group-hover:rotate-12 transition-all"><AlertCircle size={150} className="text-rose-600"/></div>
            <div className="flex items-center gap-5 mb-10 relative z-10">
               <div className="p-4 bg-rose-600 text-white rounded-2xl shadow-lg"><ShieldAlert size={28}/></div>
               <div><h3 className="text-2xl font-black uppercase tracking-tighter text-rose-700 dark:text-rose-400 leading-none">Dogs Menu</h3><p className="text-[10px] font-bold text-rose-600/60 uppercase tracking-widest mt-2">Margin Terancam</p></div>
            </div>
            <div className="space-y-4 relative z-10">
               {analysis.dogs.map(r => (
                  <div key={r.id} className="p-5 bg-white dark:bg-gray-900 rounded-3xl flex justify-between items-center shadow-sm border border-rose-100 dark:border-rose-900/50 hover:scale-[1.03] transition-all">
                     <div className="overflow-hidden pr-4"><p className="text-xs font-black uppercase truncate text-gray-800 dark:text-white leading-none">{r.menuName}</p></div>
                     <div className="text-right shrink-0"><p className="text-base font-black text-rose-600 leading-none">{Math.round(r.costFoodPercent)}%</p></div>
                  </div>
               ))}
               {analysis.dogs.length === 0 && <p className="py-12 text-center text-[10px] text-gray-400 uppercase italic">Luar biasa! Tidak ada menu Kritis.</p>}
            </div>
            {analysis.dogs.length > 0 && (
               <div className="mt-10 p-6 bg-rose-600 text-white rounded-[2rem] shadow-xl"><div className="flex items-center gap-2 mb-2"><BadgeAlert size={16}/><h5 className="text-[10px] font-black uppercase tracking-widest">Tindakan Darurat</h5></div><p className="text-[10px] font-medium leading-relaxed italic opacity-90 uppercase">Segera naikkan harga jual atau kurangi takaran bahan baku termahal pada menu di atas.</p></div>
            )}
         </div>
      </div>

      {/* SECTION 4: SELECTION & REPORT GENERATION HUB */}
      <div className="bg-gray-950 text-white p-12 lg:p-16 rounded-[4.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-12 opacity-10 -rotate-12 group-hover:rotate-0 transition-transform duration-1000"><FileText size={300}/></div>
         <div className="relative z-10">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-12 mb-16">
               <div className="flex items-center gap-8">
                  <div className="w-24 h-24 bg-white/10 rounded-[2.5rem] border border-white/20 flex items-center justify-center text-emerald-400 shadow-inner group-hover:scale-110 transition-transform"><CheckSquare size={44}/></div>
                  <div>
                     <h3 className="text-4xl font-black uppercase tracking-tighter leading-none">Generate Official Report</h3>
                     <p className="text-base text-gray-400 font-medium italic mt-3">"Pilih menu yang ingin Bapak masukkan ke dalam dokumen audit resmi."</p>
                  </div>
               </div>
               <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right"><p className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em] mb-1">Status Seleksi</p><p className="text-3xl font-black text-white tabular-nums">{selectedIds.length} <span className="text-sm opacity-40">ITEM</span></p></div>
                  <button 
                     onClick={onGenerateReport} 
                     disabled={selectedIds.length === 0}
                     className={`px-12 py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl flex items-center gap-4 transition-all active:scale-95 ${selectedIds.length > 0 ? 'bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-emerald-500/40 cursor-pointer' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                  >
                     KONFIRMASI & CETAK <ArrowRight size={24}/>
                  </button>
               </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 px-4">
               <div className="flex items-center gap-4 text-[11px] font-black text-gray-400 uppercase tracking-widest"><MousePointer2 size={16}/> Klik kartu menu untuk memilih secara manual</div>
               <div className="flex items-center gap-6">
                  <button onClick={() => onSelectAll(recipes.map(r => r.id))} className="text-xs font-black uppercase text-emerald-400 hover:text-white transition-colors flex items-center gap-2 group/btn"><div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover/btn:bg-emerald-500/30 transition-all"><Check size={14}/></div> Pilih Semua</button>
                  <button onClick={() => onSelectAll([])} className="text-xs font-black uppercase text-rose-500 hover:text-white transition-colors flex items-center gap-2 group/btn"><div className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center group-hover/btn:bg-rose-500/30 transition-all"><X size={14}/></div> Reset Pilihan</button>
               </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
               {recipes.map(r => {
                  const isSelected = selectedIds.includes(r.id);
                  const isKritis = r.costFoodPercent > 35;
                  return (
                     <button 
                       key={r.id} 
                       onClick={() => onToggleSelect(r.id)}
                       className={`p-6 rounded-[2rem] border-2 transition-all duration-300 text-left flex flex-col justify-between group/card relative ${isSelected ? 'bg-emerald-600 border-emerald-400 shadow-xl' : 'bg-white/5 border-white/5 hover:border-emerald-600/50'}`}
                     >
                        <div className={`absolute top-4 right-4 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-white border-white text-emerald-600' : 'border-white/10 text-transparent'}`}><Check size={14} strokeWidth={4}/></div>
                        <div className="mb-6"><p className={`text-[11px] font-black uppercase tracking-tight truncate mb-1 ${isSelected ? 'text-white' : 'text-gray-300'}`}>{r.menuName}</p><p className={`text-[8px] font-bold uppercase tracking-widest ${isSelected ? 'text-emerald-100/60' : 'text-gray-500'}`}>{r.subCategory}</p></div>
                        <div className="flex justify-between items-end"><span className={`text-[10px] font-black ${isSelected ? 'text-white' : isKritis ? 'text-rose-500' : 'text-emerald-400'}`}>{Math.round(r.costFoodPercent)}% Cost</span></div>
                     </button>
                  );
               })}
            </div>
         </div>
      </div>
    </div>
  );
};

export default AnalisisHpp;
