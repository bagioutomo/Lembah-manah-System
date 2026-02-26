
import React, { useMemo } from 'react';
// Added missing CheckCircle2 and Info imports from lucide-react
import { AlertTriangle, TrendingUp, RefreshCw, Zap, Layers, AlertOctagon, TrendingDown, CheckCircle2, Info } from 'lucide-react';
import { Article, ExpenseRecord, Recipe } from '../types';

interface Props {
  articles: Article[];
  expenses: ExpenseRecord[];
  recipes: Recipe[];
}

const HppVarianceAnalysis: React.FC<Props> = ({ articles, expenses, recipes }) => {
  const priceAlerts = useMemo(() => {
    const alerts: any[] = [];
    // Filter kategori yang relevan dengan bahan baku
    const bahanExp = expenses.filter(e => 
      e.category.includes('Bahan Baku') || 
      e.category.includes('Purchasing') ||
      e.category.includes('Pengadaan')
    );
    
    articles.forEach(art => {
      // Pencocokan Pintar: Nama artikel di dalam catatan belanja (notes)
      const related = bahanExp.filter(e => {
        const note = (e.notes || '').toUpperCase();
        const artName = art.name.toUpperCase();
        return note.includes(artName) || artName.includes(note);
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (related.length > 0) {
        const latestTx = related[0];
        const actualPrice = (latestTx.amount || 0) / (latestTx.qty || 1);
        const masterPrice = art.purchasePrice || 0;

        // Toleransi selisih Rp 50 untuk menghindari noise
        if (actualPrice > masterPrice + 50) {
          const diffNominal = actualPrice - masterPrice;
          const diffPercent = (diffNominal / (masterPrice || 1)) * 100;
          
          // Cari resep mana saja yang menggunakan bahan ini
          const affectedRecipes = recipes.filter(r => 
            r.items.some(item => item.articleId === art.id || item.name.toUpperCase() === art.name.toUpperCase())
          );

          alerts.push({
            name: art.name,
            master: masterPrice,
            actual: actualPrice,
            unit: art.unit,
            diffPercent,
            affectedCount: affectedRecipes.length,
            lastDate: latestTx.date,
            isHighRisk: diffPercent > 15
          });
        }
      }
    });

    // Urutkan dari persentase kenaikan tertinggi
    return alerts.sort((a, b) => b.diffPercent - a.diffPercent);
  }, [articles, expenses, recipes]);

  const formatCurrency = (val: number) => 'Rp' + Math.round(val).toLocaleString('id-ID');

  return (
    <div className="bg-white dark:bg-gray-950 p-10 lg:p-14 rounded-[4rem] border-2 border-rose-100 dark:border-rose-900/30 shadow-xl lg:col-span-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div className="flex items-center gap-5">
           <div className="p-4 bg-rose-600 text-white rounded-2xl shadow-lg animate-pulse">
              <Zap size={28}/>
           </div>
           <div>
              <h3 className="text-3xl font-black uppercase tracking-tighter dark:text-white leading-none">Price Inflation Radar</h3>
              <p className="text-[11px] font-black text-rose-500 uppercase tracking-[0.3em] mt-2 italic">HPP Katalog vs Realita Pasar</p>
           </div>
        </div>
        <div className="px-6 py-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl">
           <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Terdeteksi {priceAlerts.length} Anomali Harga</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {priceAlerts.length === 0 ? (
          <div className="col-span-full py-24 text-center border-4 border-dashed border-emerald-50 dark:border-emerald-900/20 rounded-[3rem] opacity-40 group hover:opacity-100 transition-opacity">
             <CheckCircle2 size={64} className="text-emerald-500 mx-auto mb-6" />
             <h4 className="text-xl font-black uppercase tracking-[0.4em] text-emerald-600">Cost Integrity Verified</h4>
             <p className="text-xs font-bold text-gray-400 uppercase mt-2 tracking-widest">Seluruh pengadaan masih sesuai anggaran master</p>
          </div>
        ) : (
          priceAlerts.map((alert, i) => (
            <div key={i} className={`p-8 rounded-[3rem] border-2 transition-all duration-500 group/card flex flex-col justify-between hover:shadow-2xl hover:-translate-y-2 ${alert.isHighRisk ? 'bg-rose-50/40 border-rose-200 dark:bg-rose-950/10 dark:border-rose-800 shadow-rose-500/5' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}>
               <div>
                  <div className="flex justify-between items-start mb-6">
                     <div className={`p-3 rounded-2xl ${alert.isHighRisk ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-600'}`}>
                        <TrendingUp size={20}/>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-rose-600 leading-none">Naik</p>
                        <h5 className="text-2xl font-black text-rose-600 tracking-tighter">+{Math.round(alert.diffPercent)}%</h5>
                     </div>
                  </div>
                  <h4 className="text-lg font-black uppercase text-gray-900 dark:text-white mb-2 leading-tight group-hover/card:text-rose-600 transition-colors">{alert.name}</h4>
                  <div className="flex items-center gap-3 mb-6">
                     <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Per {alert.unit.toUpperCase()}</span>
                     <div className="w-1 h-1 rounded-full bg-gray-200"></div>
                     <span className="text-[9px] font-bold text-gray-400 uppercase italic">Update: {new Date(alert.lastDate).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})}</span>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="p-4 bg-gray-50 dark:bg-black rounded-2xl border dark:border-gray-800 space-y-3">
                     <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                        <span className="text-gray-400">Harga Master:</span>
                        <span className="text-gray-600 dark:text-gray-300">{formatCurrency(alert.master)}</span>
                     </div>
                     <div className="flex justify-between items-center text-[10px] font-black uppercase">
                        <span className="text-rose-400">Harga Nota:</span>
                        <span className="text-rose-600">{formatCurrency(alert.actual)}</span>
                     </div>
                  </div>

                  <div className={`flex items-center gap-3 p-4 rounded-2xl border ${alert.affectedCount > 0 ? 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20' : 'bg-gray-100 border-transparent opacity-40'}`}>
                     <Layers size={18} className={alert.affectedCount > 0 ? 'text-indigo-600' : 'text-gray-400'} />
                     <div>
                        <p className={`text-[10px] font-black uppercase leading-none mb-0.5 ${alert.affectedCount > 0 ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-400'}`}>{alert.affectedCount} Resep Terdampak</p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase">Menurunkan Margin Profit</p>
                     </div>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-12 p-8 bg-blue-50 dark:bg-blue-900/10 rounded-[2.5rem] border-2 border-dashed border-blue-100 dark:border-blue-800 flex gap-6">
         <Info size={32} className="text-blue-600 shrink-0 mt-1" />
         <div className="space-y-2">
            <h4 className="text-sm font-black uppercase text-blue-900 dark:text-blue-400">Cara Kerja Neural Price Audit</h4>
            <p className="text-[11px] text-blue-800 dark:text-blue-300 font-medium leading-relaxed italic">
               Sistem memindai <b>Katalog Bahan</b> dan mencari transaksi belanja terakhir untuk bahan yang sama. Jika harga per unit di nota lebih besar dari harga master Bapak, Radar ini akan menyala. Klik <b>"Sync Harga"</b> di menu <b>Produksi & HPP</b> untuk memperbarui seluruh kalkulasi HPP resep Bapak secara otomatis.
            </p>
         </div>
      </div>
    </div>
  );
};

export default HppVarianceAnalysis;
