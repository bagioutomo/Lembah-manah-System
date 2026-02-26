
import React, { useMemo, useState } from 'react';
import { 
  Coins, 
  Tag, 
  History, 
  CheckCircle2, 
  Scale, 
  ChevronRight, 
  Filter,
  ArrowRight,
  PieChart,
  LayoutGrid,
  X,
  SearchCheck
} from 'lucide-react';
import { ExpenseRecord, CategoryConfig, PageId } from '../types';

interface Props {
  expenses: ExpenseRecord[];
  categories: CategoryConfig[];
  periodLabel: string;
  onNavigate?: (page: PageId) => void;
  setDbCategory?: (cat: string | null) => void;
}

const ReportAllocation: React.FC<Props> = ({ expenses, categories, periodLabel, onNavigate, setDbCategory }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const auditData = useMemo(() => {
    // 1. Ambil nama kategori yang bertanda Non-Operasional (isOperational: false)
    const nonOpCategoryNames = categories
      .filter(c => !c.isOperational)
      .map(c => c.name.toLowerCase());

    // 2. Filter transaksi belanja yang masuk ke kategori non-op tersebut
    const nonOpExpenses = expenses.filter(e => 
      nonOpCategoryNames.includes(e.category.toLowerCase())
    );

    // 3. Kalkulasi per kategori dengan presisi Nominal * Qty
    const nonOpByCategory: Record<string, number> = {};
    nonOpExpenses.forEach(e => {
      const total = (Number(e.amount) || 0) * (Number(e.qty) || 1);
      nonOpByCategory[e.category] = (nonOpByCategory[e.category] || 0) + total;
    });

    const totalAllocation = nonOpExpenses.reduce((sum, e) => 
      sum + ((Number(e.amount) || 0) * (Number(e.qty) || 1)), 0
    );

    return { 
      totalAllocation, 
      nonOpByCategory,
      allNonOpTransactions: nonOpExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };
  }, [expenses, categories]);

  const filteredTransactions = useMemo(() => {
    if (!selectedCategory) return auditData.allNonOpTransactions;
    return auditData.allNonOpTransactions.filter(t => t.category === selectedCategory);
  }, [selectedCategory, auditData.allNonOpTransactions]);

  const handleAuditDeep = (cat: string) => {
    if (onNavigate && setDbCategory) {
       setDbCategory(cat);
       onNavigate('expense-category');
    }
  };

  const formatCurrency = (val: number) => 'Rp ' + Math.round(val).toLocaleString('id-ID');

  return (
    <div className="animate-fade-in space-y-10 pb-20">
      {/* HEADER LAPORAN */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-5">
           <div className="p-4 bg-indigo-600 text-white rounded-[1.5rem] shadow-xl animate-scale-in">
              <Coins size={32} />
           </div>
           <div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Audit Alokasi Laba</h2>
              <p className="text-sm text-gray-500 font-medium italic mt-2">Resume penggunaan laba periode <span className="text-indigo-600 font-black">{periodLabel}</span>.</p>
           </div>
        </div>
        
        {selectedCategory && (
           <button 
             onClick={() => setSelectedCategory(null)}
             className="px-6 py-3 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-red-100 flex items-center gap-2 hover:bg-red-600 hover:text-white transition-all shadow-sm"
           >
              <X size={14}/> Reset Filter
           </button>
        )}
      </div>

      {/* HERO TOTAL */}
      <div className="bg-indigo-600 rounded-[3rem] p-10 text-white flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
            <Scale size={200} />
         </div>
         <div className="relative z-10 text-center md:text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Total Dana Dialokasikan (Non-Op)</p>
            <h3 className="text-5xl font-black tracking-tighter leading-none animate-slide-up">
               {formatCurrency(auditData.totalAllocation)}
            </h3>
            <div className="mt-6 flex items-center justify-center md:justify-start gap-4">
               <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                  <CheckCircle2 size={14} className="text-indigo-200" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-100">{auditData.allNonOpTransactions.length} Record Ter-Audit</span>
               </div>
               <p className="text-[10px] font-bold italic opacity-40 uppercase tracking-widest">Audit Berbasis Virtual History</p>
            </div>
         </div>
         <div className="hidden lg:block relative z-10">
            <PieChart size={120} className="text-indigo-400 opacity-20" />
         </div>
      </div>

      {/* GRID KATEGORI INTERAKTIF */}
      <div className="space-y-4">
         <div className="flex items-center gap-3 px-4">
            <Filter size={14} className="text-gray-400" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Klik Kategori untuk Audit Mendalam</span>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(auditData.nonOpByCategory).map(([cat, amount]) => {
               const isActive = selectedCategory === cat;
               return (
                  <div key={cat} className="group relative">
                    <button 
                      onClick={() => handleAuditDeep(cat)}
                      className={`w-full bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border transition-all hover:scale-[1.03] text-left shadow-xl flex flex-col group relative overflow-hidden ${
                         isActive ? 'border-indigo-600 ring-4 ring-indigo-500/10' : 'border-gray-100 dark:border-gray-800'
                      }`}
                    >
                       <div className="absolute top-0 right-0 p-4 text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"><SearchCheck size={24}/></div>
                       <div className={`p-3 rounded-2xl w-fit mb-6 transition-colors bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white`}>
                          <Tag size={20}/>
                       </div>
                       <p className={`text-[11px] font-black uppercase tracking-widest mb-1 truncate text-gray-500`}>
                          {cat}
                       </p>
                       <h4 className={`text-xl font-black tracking-tight leading-none text-gray-900 dark:text-white`}>
                          {formatCurrency(amount as number)}
                       </h4>
                       <div className="mt-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[8px] font-black uppercase text-indigo-500">Lihat Nota Audit</span>
                          <ChevronRight size={14} className="text-indigo-300" />
                       </div>
                    </button>
                  </div>
               );
            })}
            
            {Object.keys(auditData.nonOpByCategory).length === 0 && (
              <div className="col-span-full py-20 text-center bg-gray-50 dark:bg-gray-800/30 rounded-[3rem] border-2 border-dashed dark:border-gray-800">
                 <LayoutGrid size={48} className="mx-auto text-gray-200 mb-4" />
                 <p className="text-sm font-black uppercase text-gray-400 tracking-widest">Tidak ada alokasi non-operasional periode ini</p>
              </div>
            )}
         </div>
      </div>

      {/* RINCIAN SINGKAT (Untuk Preview Cepat Tanpa Pindah Halaman) */}
      <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden animate-fade-in">
         <div className="p-8 border-b dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-500">
                  <History size={20} />
               </div>
               <div>
                  <h3 className="text-lg font-black uppercase tracking-tighter">Preview Rincian Alokasi</h3>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Gunakan kartu di atas untuk audit nota lebih detail.</p>
               </div>
            </div>
            <span className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-[10px] font-black text-gray-500 uppercase">{auditData.allNonOpTransactions.length} Record</span>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                     <th className="px-8 py-5">Tanggal</th>
                     <th className="px-8 py-5">Deskripsi</th>
                     <th className="px-8 py-5">Dompet</th>
                     <th className="px-8 py-5 text-right">Nominal</th>
                  </tr>
               </thead>
               <tbody className="divide-y dark:divide-gray-800">
                  {auditData.allNonOpTransactions.slice(0, 15).map(t => (
                     <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group text-xs font-medium">
                        <td className="px-8 py-4 opacity-50">{t.date}</td>
                        <td className="px-8 py-4 font-black uppercase">{t.notes}</td>
                        <td className="px-8 py-4">{t.wallet}</td>
                        <td className="px-8 py-4 text-right font-black text-indigo-600">{formatCurrency((Number(t.amount) || 0) * (Number(t.qty) || 1))}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default ReportAllocation;
