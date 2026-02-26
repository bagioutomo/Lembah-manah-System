
import React, { useMemo, useState, useEffect } from 'react';
import { 
  Package, Wallet, Warehouse, AlertOctagon, Plus, Receipt, ChevronRight, 
  History, ListTodo, PlusCircle, Check, Trash2, TrendingUp, ArrowUpRight, Coins,
  Clock, AlertTriangle, PieChart as PieIcon, Activity, ArrowDownCircle, ArrowUpCircle,
  AlertCircle, Tag, Layers, BellRing
} from 'lucide-react';
import { PageId, DashboardTask, BillRecord } from '../types';

interface Props {
  purchData: any;
  formatCurrency: (val: number) => string;
  walletBalance: number;
  onNavigate: (page: PageId) => void;
  currentTasks: DashboardTask[];
  newTaskText: string;
  setNewTaskText: (val: string) => void;
  onAddTask: (e: React.FormEvent) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  recentExpenses: any[];
  chartData?: any[];
  expenseChartData?: any[];
  stats?: any;
  bills?: BillRecord[];
}

const PurchasingDashboard: React.FC<Props> = ({ 
  purchData, formatCurrency, walletBalance, onNavigate, 
  currentTasks, newTaskText, setNewTaskText, onAddTask, 
  onToggleTask, onDeleteTask, recentExpenses, chartData = [],
  stats,
  bills = []
}) => {
  
  const [jobdeskStats, setJobdeskStats] = useState({ pending: 0, total: 0 });

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Sync Jobdesk Notifications for Purchasing
  useEffect(() => {
    const now = new Date();
    const storageKey = `jobdesk-v7-${now.getFullYear()}-${now.getMonth() + 1}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const jobs = JSON.parse(saved);
      // Filter tasks for PURCHASING or tasks assigned to MANAGER (Global Oversight)
      const purchasingJobs = jobs.filter((j: any) => j.pic === 'PURCHASING' || j.pic === 'MANAGER');
      const pendingCount = purchasingJobs.filter((j: any) => !j.completed).length;
      setJobdeskStats({ pending: pendingCount, total: jobs.length });
    }
  }, [currentTasks]);

  const incomeChartBars = useMemo(() => {
    const data = chartData || [];
    if (data.length === 0) return [];
    const maxVal = Math.max(...data.map((d: any) => d.income || 0), 1);
    return data.slice(-12).map((d: any) => ({ 
      ...d, 
      height: ((d.income || 0) / maxVal) * 100 
    }));
  }, [chartData]);

  const dailyAvgIncome = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0;
    const total = chartData.reduce((sum, d) => sum + (d.income || 0), 0);
    return total / chartData.length;
  }, [chartData]);

  const billAlerts = useMemo(() => {
    const now = new Date();
    return bills
      .filter(b => b.status === 'UNPAID')
      .map(b => ({
        ...b,
        isOverdue: new Date(b.dueDate) < now,
        isSoon: ! (new Date(b.dueDate) < now) && (new Date(b.dueDate).getTime() - now.getTime()) < (2 * 24 * 60 * 60 * 1000)
      }))
      .sort((a, b) => {
        if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [bills]);

  const safeFormatCurrency = (val: number) => {
    if (typeof val !== 'number' || isNaN(val)) return 'Rp 0';
    return formatCurrency(val);
  };

  return (
    <div className="space-y-12 animate-fade-in">
       
       {/* NOTIFIKASI JOBDESK HARIAN PURCHASING */}
       {jobdeskStats.total > 0 && (
         <div className="animate-slide-up no-print mb-6">
            <div className={`p-[2px] rounded-[2.5rem] shadow-2xl transition-all duration-700 ${jobdeskStats.pending > 0 ? 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 shadow-amber-500/20' : 'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700 shadow-emerald-500/10'}`}>
               <div className="bg-white dark:bg-gray-950 rounded-[2.45rem] p-6 sm:px-10 sm:py-7 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative group">
                  <div className="flex items-center gap-6 relative z-10">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner transition-colors duration-500 ${jobdeskStats.pending > 0 ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600'}`}>
                        <BellRing size={28} className={jobdeskStats.pending > 0 ? 'animate-bounce' : ''} />
                     </div>
                     <div className="text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
                           <p className={`text-[9px] font-black uppercase tracking-[0.4em] ${jobdeskStats.pending > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {jobdeskStats.pending > 0 ? 'TUGAS TERTUNDA' : 'TUGAS SELESAI'}
                           </p>
                        </div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                           {jobdeskStats.pending > 0 
                             ? `Terdapat ${jobdeskStats.pending} agenda tugas pengadaan yang menunggu penyelesaian Bapak.` 
                             : 'Sempurna! Seluruh target harian logistik dan belanja hari ini telah tercapai.'}
                        </h3>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 relative z-10 shrink-0">
                    <button onClick={() => onNavigate('jobdesk-checklist')} className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 ${jobdeskStats.pending > 0 ? 'bg-amber-600 text-white hover:bg-amber-700 hover:-translate-y-1' : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:-translate-y-1'}`}>
                       Buka Agenda Tugas <ChevronRight size={16}/>
                    </button>
                  </div>
               </div>
            </div>
         </div>
       )}

       {/* 1. SECTION TOP: SALDO & OMZET */}
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* SALDO CARD */}
          <div className="lg:col-span-4 bg-white dark:bg-gray-950 p-10 rounded-[4rem] border border-blue-100 dark:border-blue-900/30 shadow-2xl relative overflow-hidden group transition-all duration-700 hover:scale-[1.05] hover:-translate-y-3 hover:shadow-blue-500/20">
             <div className="absolute top-0 right-0 p-12 opacity-[0.03] -rotate-12 group-hover:rotate-0 group-hover:scale-150 transition-all duration-1000"><Wallet size={180} className="text-blue-600" /></div>
             <div className="relative z-10 flex flex-col justify-between h-full space-y-10">
                <div>
                   <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-2xl animate-breath-glow text-blue-600">
                         <Wallet size={24} />
                      </div>
                      <span className="px-4 py-1.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-blue-200 dark:border-blue-900">
                         Net Arus Kas Periode
                      </span>
                   </div>
                   <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2 group-hover:text-blue-500 transition-colors">Dana Masuk Bersih Purchasing</p>
                   <h2 className={`text-5xl font-black tracking-tighter leading-none group-hover:translate-x-3 transition-transform duration-500 ${walletBalance >= 0 ? 'text-blue-700 dark:text-blue-500' : 'text-rose-600'}`}>
                      {walletBalance > 0 ? '+' : ''}{safeFormatCurrency(walletBalance)}
                   </h2>
                </div>

                <div className="space-y-3">
                   <button 
                      onClick={() => onNavigate('pengeluaran')}
                      className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 shadow-xl hover:bg-blue-700 hover:shadow-blue-600/40 hover:-translate-y-1 active:scale-95"
                   >
                      Input Belanja Baru <Plus size={18} />
                   </button>
                   <button 
                      onClick={() => onNavigate('tagihan-baru')}
                      className="w-full py-4 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-700 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 shadow-sm border border-transparent hover:border-blue-100"
                   >
                      <Receipt size={16}/> Daftarkan Nota / Tagihan
                   </button>
                </div>
             </div>
          </div>

          {/* INCOME CHART */}
          <div className="lg:col-span-8 bg-white dark:bg-gray-900 p-12 rounded-[4.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl relative overflow-hidden group transition-all duration-700 hover:shadow-emerald-500/10 hover:border-emerald-100">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 relative z-10 gap-6">
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center animate-breath-glow group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                      <ArrowUpCircle size={28} />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter group-hover:text-emerald-600 transition-colors">Pendapatan Harian</h3>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Monitoring Omzet Bisnis Berjalan</p>
                   </div>
                </div>
                
                <div className="text-right group-hover:-translate-x-2 transition-transform duration-500 border-l-2 border-emerald-100 pl-6">
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Rerata Omzet</p>
                   <p className="text-lg font-black text-emerald-600 leading-none">{safeFormatCurrency(dailyAvgIncome)}</p>
                </div>
             </div>

             <div className="flex items-end justify-between h-[180px] gap-2 mb-6 px-4 relative">
                {incomeChartBars.length === 0 ? (
                   <div className="absolute inset-0 flex items-center justify-center opacity-20 italic font-black uppercase text-[11px] tracking-[0.4em]">Menunggu Data Omzet...</div>
                ) : (
                   incomeChartBars.map((bar: any, idx: number) => (
                      <div key={idx} className="flex-1 flex flex-col items-center group/bar relative cursor-pointer">
                         <div className="absolute bottom-full mb-4 opacity-0 group-hover/bar:opacity-100 scale-75 group-hover/bar:scale-100 -translate-y-4 group-hover/bar:translate-y-0 transition-all duration-500 z-20 pointer-events-none origin-bottom">
                            <div className="bg-gray-900 text-white text-[9px] font-black px-3 py-1.5 rounded-2xl shadow-2xl whitespace-nowrap">
                               {safeFormatCurrency(bar.income)}
                            </div>
                         </div>
                         <div className="w-full h-[180px] bg-gray-50 dark:bg-gray-800/40 rounded-full relative overflow-hidden shadow-inner border border-gray-100/10 group-hover/bar:border-emerald-500/40 transition-colors duration-300">
                            <div 
                              className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1) group-hover/bar:shadow-[0_0_30px_rgba(16,185,129,0.9)] origin-bottom" 
                              style={{ height: `${Math.max(bar.height, 6)}%`, transitionDelay: `${idx * 15}ms` }}
                            ></div>
                         </div>
                         <span className="text-[8px] font-black text-gray-300 uppercase mt-3 group-hover/bar:text-emerald-500 transition-colors duration-300">{bar.day}</span>
                      </div>
                   ))
                )}
             </div>
          </div>
       </div>

       {/* 2. SECTION MIDDLE: TREN PENGELUARAN SAYA (Hanya Kategori) */}
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 bg-white dark:bg-gray-900 p-12 rounded-[4.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl relative overflow-hidden group transition-all duration-700 hover:shadow-rose-500/10 hover:border-rose-100">
             <div className="absolute top-0 right-0 p-12 opacity-[0.02] rotate-12 transition-transform duration-1000"><Tag size={240} className="text-rose-600" /></div>
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 relative z-10 gap-6">
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center animate-breath-glow group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                      <Activity size={28} />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter group-hover:text-rose-600 transition-colors">Tren Pengeluaran Saya</h3>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Breakdown Khusus Belanja Purchasing</p>
                   </div>
                </div>
                
                <div className="flex items-center gap-8 group-hover:-translate-x-2 transition-transform duration-500 border-l-2 border-rose-100 dark:border-rose-900/30 pl-6">
                   <div className="text-right">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center justify-end gap-1.5">
                         <ArrowDownCircle size={10} className="text-rose-500"/> Personal Spending
                      </p>
                      <p className="text-xl font-black text-rose-700 dark:text-rose-400 leading-none">{safeFormatCurrency(stats?.purchasing?.totalExpense || 0)}</p>
                   </div>
                </div>
             </div>

             {/* CATEGORY BREAKDOWN LIST - FILTERED TO PURCHASING ONLY */}
             <div className="relative z-10 pt-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                   <Tag size={12}/> Analisa Komposisi Belanja Per Kategori (Data Saya)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                   {(!stats?.purchasing?.categoryDistribution || stats.purchasing.categoryDistribution.length === 0) ? (
                      <div className="col-span-full py-20 text-center opacity-20 italic font-black uppercase text-[11px] tracking-[0.4em]">Belum Ada Data Belanja...</div>
                   ) : (
                      stats.purchasing.categoryDistribution.map((cat: any, idx: number) => {
                         const perc = Math.round((cat.value / (stats.purchasing.totalExpense || 1)) * 100);
                         return (
                            <div key={idx} className="space-y-3 group/item transition-all hover:translate-x-1">
                               <div className="flex justify-between items-end px-1">
                                  <span className="text-[13px] font-black uppercase text-gray-700 dark:text-gray-300 truncate">{cat.name}</span>
                                  <span className="text-[11px] font-bold text-rose-600">{formatCurrency(cat.value).replace('Rp ', '')} ({perc}%)</span>
                               </div>
                               <div className="h-2 w-full bg-gray-50 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                                  <div 
                                     className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full transition-all duration-1000 ease-out" 
                                     style={{ width: `${perc}%` }}
                                  ></div>
                               </div>
                            </div>
                         );
                      })
                   )}
                </div>
             </div>
          </div>

          {/* ALERT TAGIHAN VENDOR */}
          <div className="lg:col-span-4 bg-white dark:bg-gray-900 p-12 rounded-[4.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl flex flex-col transition-all duration-500 hover:shadow-blue-500/10 group/card">
             <div className="flex items-center justify-between mb-10 relative z-10">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 flex items-center justify-center animate-breath-glow">
                      <AlertCircle size={24} />
                   </div>
                   <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Alert Tagihan</h3>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[9px] font-black uppercase tracking-widest">Pending</span>
             </div>
             
             <div className="flex-1 space-y-4 overflow-y-auto max-h-[450px] pr-2 custom-scrollbar">
                {billAlerts.length === 0 ? (
                   <div className="py-24 text-center opacity-30 italic font-black uppercase text-[10px]">Semua Tagihan Lunas</div>
                ) : (
                   billAlerts.map((bill: any, idx: number) => (
                      <div key={idx} className={`p-5 rounded-3xl border-2 transition-all duration-300 flex items-center justify-between ${
                         bill.isOverdue ? 'bg-red-50/60 border-red-200' : 
                         bill.isSoon ? 'bg-orange-50/60 border-orange-200' : 'bg-gray-50/60 border-transparent'
                      }`}>
                         <div className="flex-1 min-w-0 pr-4">
                            <p className="text-xs font-black uppercase text-gray-900 dark:text-white truncate">{bill.title}</p>
                            <p className={`text-[8px] font-black uppercase tracking-widest mt-1 ${bill.isOverdue ? 'text-red-600' : bill.isSoon ? 'text-orange-600' : 'text-gray-400'}`}>
                               {bill.isOverdue ? 'Terlambat' : bill.isSoon ? 'Segera Bayar' : 'Belum Lunas'}
                            </p>
                         </div>
                         <div className="text-right">
                            <p className="text-sm font-black text-gray-900 dark:text-white leading-none">{safeFormatCurrency(bill.amount).replace('Rp ', '')}</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase mt-1.5">{new Date(bill.dueDate).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})}</p>
                         </div>
                      </div>
                   ))
                )}
             </div>
             <button onClick={() => onNavigate('tagihan')} className="mt-8 w-full py-4 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all duration-300 shadow-lg hover:bg-blue-700 hover:-translate-y-1">Monitor Tagihan</button>
          </div>
       </div>

       {/* 3. SECTION BOTTOM: RADAR, RIWAYAT & MEMO */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* SUPPLY RADAR */}
          <div className="bg-white dark:bg-gray-900 p-10 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-xl flex flex-col transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group/card h-full">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                   <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600">
                      <Warehouse size={22} />
                   </div>
                   <h3 className="text-[12px] font-black uppercase tracking-widest text-gray-900 dark:text-white">Supply Radar</h3>
                </div>
                <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-[9px] font-black uppercase tracking-widest">Kritis</span>
             </div>
             
             <div className="flex-1 space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                {purchData?.criticalStock.length === 0 ? (
                   <div className="py-24 text-center opacity-30 italic font-black uppercase tracking-widest text-[10px]">Stok Bahan Aman</div>
                ) : (
                   purchData?.criticalStock.map((item: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-2xl bg-rose-50/40 border border-transparent hover:border-rose-200 transition-all duration-300 flex items-center justify-between group/item">
                         <div>
                            <p className="text-xs font-black uppercase text-gray-900 dark:text-white truncate max-w-[140px]">{item.name}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.category}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-sm font-black text-rose-600 leading-none">{item.quantity} <span className="text-[8px] font-bold text-gray-400 uppercase">{item.unit}</span></p>
                         </div>
                      </div>
                   ))
                )}
             </div>
             <button onClick={() => onNavigate('inv-stocks')} className="mt-8 w-full py-4 bg-gray-50 dark:bg-gray-800 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-rose-600 hover:bg-white dark:hover:bg-gray-700 rounded-2xl transition-all duration-300 border border-transparent hover:border-rose-100">Pusat Stok</button>
          </div>

          {/* RIWAYAT BELANJA SAYA */}
          <div className="bg-white dark:bg-gray-900 p-10 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-xl flex flex-col transition-all duration-500 hover:shadow-2xl group/card">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                   <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600">
                      <History size={22} />
                   </div>
                   <h3 className="text-[12px] font-black uppercase tracking-widest text-gray-900 dark:text-white">Riwayat Belanja Saya</h3>
                </div>
                <button onClick={() => onNavigate('expense')} className="text-[9px] font-black text-blue-600 hover:underline">Database</button>
             </div>
             
             <div className="flex-1 overflow-y-auto max-h-[500px] custom-scrollbar pr-2">
                <table className="w-full text-left">
                   <tbody className="divide-y dark:divide-gray-800">
                      {recentExpenses.length === 0 ? (
                         <tr><td className="py-24 text-center opacity-30 italic font-black uppercase text-[10px]">Belum Ada Belanja</td></tr>
                      ) : (
                        recentExpenses.slice(0, 12).map((exp: any) => (
                            <tr key={exp.id} className="group/row hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 cursor-default">
                               <td className="py-4 pr-4">
                                  <p className="text-xs font-black uppercase text-gray-800 dark:text-gray-200 leading-none mb-1 truncate max-w-[150px] group-hover/row:text-blue-600 transition-colors">{exp.notes || 'Belanja'}</p>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{exp.category}</p>
                               </td>
                               <td className="py-4 text-right">
                                  <p className="text-sm font-black text-blue-700 leading-none mb-1">-{safeFormatCurrency(exp.amount).replace('Rp ', '')}</p>
                                  <p className="text-[8px] font-bold text-gray-400 uppercase">{new Date(exp.date).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})}</p>
                               </td>
                            </tr>
                         ))
                      )}
                   </tbody>
                </table>
             </div>
          </div>

          {/* LOGISTICS MEMO / COMMAND CENTRE */}
          <div className="bg-white dark:bg-gray-900 p-10 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500 flex-1 flex flex-col h-full">
             <div className="flex items-center justify-between mb-8 px-2">
                <h3 className="text-[12px] font-black uppercase tracking-[0.2em] flex items-center gap-4 group-hover:text-blue-600 transition-colors text-gray-900 dark:text-white">
                   <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl animate-breath-glow text-blue-600">
                      <ListTodo size={24} />
                   </div>
                   Sentra Logistik
                </h3>
             </div>
             <form onSubmit={onAddTask} className="flex gap-2 mb-8 px-2 group/form">
                <input type="text" value={newTaskText} onChange={e => setNewTaskText(e.target.value)} placeholder="Tulis instruksi..." className="flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-5 py-4 outline-none font-bold text-xs shadow-inner focus:ring-4 focus:ring-blue-500/10 transition-all" />
                <button type="submit" className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all"><PlusCircle size={20}/></button>
             </form>
             <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 px-2 custom-scrollbar flex-1">
                {currentTasks.length === 0 ? (
                   <div className="py-24 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[2.5rem] opacity-30 italic font-black uppercase tracking-widest text-[11px]">Belum ada memo</div>
                ) : (
                   currentTasks.map(task => (
                      <div key={task.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-[1.5rem] group/task border border-transparent hover:border-blue-100 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300">
                         <button onClick={() => onToggleTask(task.id)} className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${task.completed ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'border-gray-300 bg-white group-hover/task:border-blue-400 group-hover/task:rotate-12'}`}>{task.completed && <Check size={14} strokeWidth={4}/>}</button>
                         <span className={`text-[10px] font-black uppercase tracking-tight truncate flex-1 ${task.completed ? 'text-gray-300 line-through' : 'text-gray-700 dark:text-gray-200'}`}>{task.text}</span>
                         <button onClick={() => onDeleteTask(task.id)} className="p-1 text-red-300 opacity-0 group-hover/task:opacity-100 hover:text-red-500 transition-all hover:scale-125"><Trash2 size={14}/></button>
                      </div>
                   ))
                )}
             </div>
          </div>
       </div>
    </div>
  );
};

export default PurchasingDashboard;
