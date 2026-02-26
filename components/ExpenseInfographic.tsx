
import { 
  Layers, ArrowDownCircle, PieChart, ShoppingBag, Target, 
  AlertTriangle, Zap, Coffee, Utensils, Megaphone, 
  TrendingDown, AlertOctagon, Info, ArrowRight, Activity,
  History 
} from 'lucide-react';
import React, { useMemo } from 'react';
import { ExpenseRecord } from '../types';

interface Props {
  totalExp: number;
  netRevenue: number;
  topExpenses: any[];
  expenses: ExpenseRecord[];
  formatCurrency: (v: number) => string;
}

const ExpenseInfographic: React.FC<Props> = ({ totalExp, netRevenue, topExpenses, expenses, formatCurrency }) => {
  
  const itemizedSpend = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];
    
    const itemMap: Record<string, { amount: number, category: string, count: number }> = {};

    expenses.forEach(exp => {
      const rawNotes = exp.notes || 'TIDAK TERIDENTIFIKASI';
      const rawName = rawNotes.toUpperCase().trim();
      const cleanName = rawName.replace(/^[^A-Z]+/, '').trim();

      if (cleanName && cleanName !== 'TIDAK TERIDENTIFIKASI') {
        if (!itemMap[cleanName]) {
          itemMap[cleanName] = { amount: 0, category: exp.category, count: 0 };
        }
        itemMap[cleanName].amount += exp.amount;
        itemMap[cleanName].count += 1;
      }
    });

    return Object.entries(itemMap)
      .map(([name, data]) => ({
        name,
        ...data,
        ratio: (data.amount / (netRevenue || 1)) * 100
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [expenses, netRevenue]);

  return (
    <div className="bg-white dark:bg-gray-950 p-10 lg:p-14 rounded-[4rem] border-2 border-rose-100 dark:border-rose-900/30 shadow-2xl relative overflow-hidden group col-span-1 lg:col-span-2">
      <div className="absolute top-0 right-0 p-12 opacity-[0.02] rotate-12 transition-transform duration-1000 group-hover:rotate-0 group-hover:scale-110">
        <ShoppingBag size={300} className="text-rose-600" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[1.8rem] bg-rose-600 text-white flex items-center justify-center shadow-xl shadow-rose-600/20">
                 <Layers size={32} />
              </div>
              <div>
                 <h3 className="text-3xl font-black uppercase tracking-tighter leading-none dark:text-white">Struktur Pengeluaran</h3>
                 <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                    <PieChart size={12} className="text-rose-600"/> Analisa Komposisi Biaya Terhadap Omzet
                 </p>
              </div>
           </div>
           <div className="text-right bg-rose-50 dark:bg-rose-900/20 px-8 py-4 rounded-3xl border border-rose-100 dark:border-rose-800">
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Total OPEX (Beban)</p>
              <h4 className="text-3xl font-black text-rose-700 dark:text-white tracking-tighter leading-none">{formatCurrency(totalExp)}</h4>
           </div>
        </div>

        <div className="space-y-10 mb-20">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <Activity size={18} className="text-gray-400"/>
                 <h4 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Bagian A: Audit Makro Kategori</h4>
              </div>
              <div className="flex gap-4">
                 <span className="flex items-center gap-1.5 text-[8px] font-black uppercase text-red-600"><div className="w-2 h-2 bg-red-600 rounded-full"></div> Kritis (&gt;10%)</span>
                 <span className="flex items-center gap-1.5 text-[8px] font-black uppercase text-amber-500"><div className="w-2 h-2 bg-amber-500 rounded-full"></div> Waspada (&gt;3%)</span>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
              {(topExpenses || []).map((exp, i) => {
                 const percOfRevenue = (exp.value / (netRevenue || 1)) * 100;
                 const isCritical = percOfRevenue >= 10;
                 const isWarning = percOfRevenue >= 3 && percOfRevenue < 10;
                 
                 return (
                    <div key={i} className="group/row space-y-2">
                       <div className="flex justify-between items-end px-1">
                          <div className="flex items-center gap-3">
                             <div className={`w-1.5 h-4 rounded-full ${isCritical ? 'bg-red-600' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                             <span className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 truncate max-w-[180px]">{exp.name}</span>
                          </div>
                          <div className="text-right">
                             <p className="text-[11px] font-black text-gray-900 dark:text-white leading-none mb-1">{formatCurrency(exp.value).replace('Rp ', '')}</p>
                             <p className={`text-[9px] font-black uppercase ${isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'}`}>
                                Rasio: {percOfRevenue.toFixed(1)}%
                             </p>
                          </div>
                       </div>
                       <div className="h-2 w-full bg-gray-50 dark:bg-gray-800 rounded-full relative overflow-hidden shadow-inner">
                          <div 
                             className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out ${isCritical ? 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.4)]' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                             style={{ width: `${Math.min(percOfRevenue * 3, 100)}%` }} 
                          />
                       </div>
                    </div>
                 );
              })}
           </div>
        </div>

        <div className="pt-14 border-t-4 border-dashed border-gray-100 dark:border-gray-800">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-2xl shadow-inner"><Zap size={24} className="animate-pulse" /></div>
                 <div>
                    <h4 className="text-2xl font-black uppercase tracking-tighter dark:text-white leading-none">Penyusutan Item Terbesar</h4>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Akumulasi Barang Sejenis Terbesar Berdasarkan Catatan</p>
                 </div>
              </div>
              <div className="px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-black rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg">
                 Deteksi Risiko Aktif
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {itemizedSpend.map((item, idx) => {
                 const getIcon = (cat: string) => {
                    if (cat.includes('Bar')) return <Coffee size={18} />;
                    if (cat.includes('Kitchen')) return <Utensils size={18} />;
                    if (cat.includes('Marketing') || cat.includes('Promosi')) return <Megaphone size={18} />;
                    return <ShoppingBag size={18} />;
                 };

                 const isHigh = item.ratio >= 3;

                 return (
                    <div key={idx} className={`p-8 rounded-[3rem] border-2 transition-all duration-500 group/card flex flex-col justify-between ${isHigh ? 'bg-rose-50/40 border-rose-100 dark:bg-rose-950/10' : 'bg-gray-50 border-transparent dark:bg-gray-900'}`}>
                       <div className="flex justify-between items-start mb-6">
                          <div className={`p-3 rounded-2xl shadow-sm ${isHigh ? 'bg-rose-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-400'}`}>
                             {getIcon(item.category)}
                          </div>
                          {isHigh && (
                             <div className="px-3 py-1 bg-red-600 text-white rounded-lg text-[8px] font-black uppercase flex items-center gap-1 shadow-lg animate-fade-in">
                                <AlertOctagon size={10}/> Dampak Tinggi
                             </div>
                          )}
                       </div>
                       
                       <div className="space-y-4">
                          <div>
                             <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.category}</p>
                             <h5 className="text-lg font-black uppercase tracking-tight text-gray-900 dark:text-white line-clamp-2 leading-tight mb-1 group-hover/card:text-rose-600 transition-colors">
                                {item.name}
                             </h5>
                             <p className="text-[9px] font-bold text-gray-400 uppercase italic flex items-center gap-1.5">
                                <History size={10}/> {item.count} Transaksi Tercatat
                             </p>
                          </div>

                          <div className="pt-4 border-t border-dashed dark:border-gray-800 flex justify-between items-end">
                             <div>
                                <p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">Total Pengeluaran</p>
                                <p className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(item.amount)}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-[8px] font-black text-rose-600 uppercase mb-0.5">Persentase Omzet</p>
                                <p className="text-2xl font-black text-rose-600 leading-none">{item.ratio.toFixed(1)}%</p>
                             </div>
                          </div>
                       </div>
                    </div>
                 );
              })}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseInfographic;
