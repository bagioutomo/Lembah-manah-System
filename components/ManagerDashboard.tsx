import React, { useMemo, useState, useEffect } from 'react';
import { 
  TrendingUp, Target, ShieldCheck, ShoppingBag, Radar, Wrench, 
  ClipboardList, Package, Timer, Users, ShieldAlert, FileText, 
  Banknote, ArrowLeftRight, FileSearch, Coins, Zap, 
  Lightbulb as BulbIcon, Loader2, AlertOctagon,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Activity,
  ArrowUpCircle,
  PieChart as PieIcon,
  Truck,
  Box,
  AlertTriangle,
  Hammer,
  Shield,
  Receipt,
  Check,
  Cpu,
  BrainCircuit,
  LayoutGrid,
  ChevronRight,
  BellRing
} from 'lucide-react';
import { InventoryItem, MaintenanceTask, OperationalChecklistItem, ScheduleRecord, BillRecord, TransferRecord } from '../types';

interface Props {
  stats: any;
  opData: any;
  formatCurrency: (val: number) => string;
  aiInsights: any[];
  loadingAI: boolean;
  inventoryItems?: InventoryItem[];
  maintenance?: MaintenanceTask[];
  checklist?: OperationalChecklistItem[];
  schedules?: ScheduleRecord[];
  bills?: BillRecord[];
  transfers?: TransferRecord[];
  onNavigate: (page: any) => void;
}

const ManagerDashboard: React.FC<Props> = ({ 
  stats, opData, formatCurrency, 
  aiInsights, loadingAI, inventoryItems = [], maintenance = [], 
  checklist = [], schedules = [], bills = [], transfers = [],
  onNavigate
}) => {
  
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [jobdeskStats, setJobdeskStats] = useState({ pending: 0, total: 0 });

  useEffect(() => {
    const now = new Date();
    const storageKey = `jobdesk-v7-${now.getFullYear()}-${now.getMonth() + 1}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const jobs = JSON.parse(saved);
      const managerJobs = jobs.filter((j: any) => j.pic === 'MANAGER');
      const pendingCount = managerJobs.filter((j: any) => !j.completed).length;
      setJobdeskStats({ pending: pendingCount, total: managerJobs.length });
    }
  }, []);

  // Operational Calculations
  const staffingSummary = useMemo(() => {
    return schedules.filter(s => s.shifts[todayStr] && s.shifts[todayStr] !== 'OFF' && s.shifts[todayStr] !== 'NONE').length;
  }, [schedules, todayStr]);

  const criticalStocks = useMemo(() => {
    return inventoryItems.filter(i => i.type === 'RAW_MATERIAL' && i.quantity <= 5).slice(0, 4);
  }, [inventoryItems]);

  const overdueMaintenance = useMemo(() => {
    return maintenance.filter(m => new Date(m.nextDueDate) < new Date()).slice(0, 3);
  }, [maintenance]);

  const urgentTasks = useMemo(() => {
    return checklist.filter(c => !c.done && c.priority === 'HIGH').slice(0, 3);
  }, [checklist]);

  // Administration Calculations
  const pendingBills = useMemo(() => bills.filter(b => b.status === 'UNPAID'), [bills]);
  const totalPendingBillsAmount = useMemo(() => pendingBills.reduce((sum, b) => sum + b.amount, 0), [pendingBills]);
  
  const payrollExpenses = useMemo(() => {
    return stats.recentExpenses.filter((e: any) => e.category === 'Gaji Pokok' || e.category === 'Gaji Part-time');
  }, [stats.recentExpenses]);
  const totalPayrollPaid = useMemo(() => payrollExpenses.reduce((sum: number, e: any) => sum + e.amount, 0), [payrollExpenses]);

  const recentTransfersCount = useMemo(() => transfers.length, [transfers]);
  const supervisorBalance = useMemo(() => stats.walletBalances['Supervisor'] || 0, [stats.walletBalances]);

  // Purchasing & Inventory Analytics
  const inventoryExpenses = useMemo(() => {
    return stats.recentExpenses.filter((e: any) => e.category === 'Bahan Baku Bar' || e.category === 'Bahan Baku Kitchen' || e.category === 'Purchasing');
  }, [stats.recentExpenses]);
  const totalSpentInventory = useMemo(() => inventoryExpenses.reduce((sum: number, e: any) => sum + e.amount, 0), [inventoryExpenses]);

  const totalRawMaterials = inventoryItems.filter(i => i.type === 'RAW_MATERIAL').length;
  const criticalRawCount = inventoryItems.filter(i => i.type === 'RAW_MATERIAL' && i.quantity <= 5).length;
  
  // Asset Analytics
  const assets = useMemo(() => inventoryItems.filter(i => i.type === 'ASSET'), [inventoryItems]);
  const totalAssets = assets.length;
  const damagedAssets = assets.filter(a => a.condition === 'DAMAGED' || a.condition === 'EXPIRED').length;
  const missingAssets = assets.filter(a => a.condition === 'MISSING').length;
  const goodAssets = totalAssets - damagedAssets - missingAssets;

  // Chart Data Calculations
  const chartBars = useMemo(() => {
    const data = stats.chartData || [];
    if (data.length === 0) return [];
    const maxVal = Math.max(...data.map((d: any) => d.amount), 1);
    return data.map((d: any) => ({ ...d, height: (d.amount / maxVal) * 100 }));
  }, [stats.chartData]);

  const dailyAvg = useMemo(() => {
    if (!stats.chartData || stats.chartData.length === 0) return 0;
    const total = stats.chartData.reduce((sum: number, d: any) => sum + d.amount, 0);
    return total / stats.chartData.length;
  }, [stats.chartData]);

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      
      {/* JOBDESK NOTIFICATION WIDGET */}
      {jobdeskStats.total > 0 && (
         <div className="animate-slide-up no-print mb-8">
            <div className={`p-[2px] rounded-[2.5rem] shadow-2xl transition-all duration-700 ${jobdeskStats.pending > 0 ? 'bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-700 shadow-indigo-500/20' : 'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700 shadow-emerald-500/10'}`}>
               <div className="bg-white dark:bg-gray-950 rounded-[2.45rem] p-6 sm:px-10 sm:py-7 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative group">
                  <div className="flex items-center gap-6 relative z-10">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner transition-colors duration-500 ${jobdeskStats.pending > 0 ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600'}`}>
                        <BellRing size={28} className={jobdeskStats.pending > 0 ? 'animate-bounce' : ''} />
                     </div>
                     <div className="text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
                           <p className={`text-[9px] font-black uppercase tracking-[0.4em] ${jobdeskStats.pending > 0 ? 'text-indigo-600' : 'text-emerald-600'}`}>
                              {jobdeskStats.pending > 0 ? 'AGENDA MANAGER TERTUNDA' : 'OPERASIONAL TERKONTROL'}
                           </p>
                        </div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                           {jobdeskStats.pending > 0 
                             ? `Pak Manager, ada ${jobdeskStats.pending} tugas strategis yang perlu dikonfirmasi penyelesaiannya.` 
                             : 'Status hijau! Seluruh agenda Manager telah selesai dikerjakan.'}
                        </h3>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 relative z-10 shrink-0">
                    <button onClick={() => onNavigate('jobdesk-checklist')} className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 ${jobdeskStats.pending > 0 ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1' : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:-translate-y-1'}`}>
                       Buka Checklist Tugas <ChevronRight size={16}/>
                    </button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* 1. FINANCIAL KPI SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', val: stats.totalIncome, icon: <TrendingUp size={24} />, color: 'emerald' },
          { label: 'Readiness Score', val: `${Math.round(opData.readinessScore)}%`, icon: <Radar size={24} />, color: 'blue' },
          { label: 'OPEX Spent', val: stats.totalExpense, icon: <ShoppingBag size={24} />, color: 'rose' },
          { label: 'Net Profit', val: stats.netProfit, icon: <Target size={24} />, color: 'indigo' }
        ].map((card, i) => (
          <div key={i} className="p-8 bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800">
             <div className="flex justify-between items-start mb-6">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">{card.label}</p>
                <div className={`p-2.5 rounded-xl bg-${card.color}-50 dark:bg-${card.color}-900/20 text-${card.color}-600`}>{card.icon}</div>
             </div>
             <h3 className="text-3xl font-black tracking-tighter leading-none text-gray-900 dark:text-white">
                {typeof card.val === 'number' ? formatCurrency(card.val) : card.val}
             </h3>
          </div>
        ))}
      </div>

      {/* 2. PUSAT ANALITIK KEUANGAN (INFOGRAFIK) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* Kiri: Grafik Pendapatan Per Hari */}
         <div className="lg:col-span-8 bg-white dark:bg-gray-900 p-10 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12"><ArrowUpCircle size={120} className="text-emerald-600" /></div>
            <div className="flex justify-between items-center mb-10 relative z-10">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shadow-inner">
                     <Activity size={24}/>
                  </div>
                  <div>
                     <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Pendapatan Per Hari</h3>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Tren Performa Omzet Harian</p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Rerata Harian</p>
                  <p className="text-sm font-black text-emerald-600">{formatCurrency(dailyAvg)}</p>
               </div>
            </div>

            <div className="flex items-end justify-between h-[200px] gap-2 mb-6 px-2 relative">
               {chartBars.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center opacity-20 italic font-black uppercase text-[10px] tracking-[0.3em]">Menunggu Data Transaksi...</div>
               ) : (
                  chartBars.map((bar: any, idx: number) => (
                     <div key={idx} className="flex-1 flex flex-col items-center group relative">
                        <div className="w-full h-[200px] bg-gray-50 dark:bg-gray-800/40 rounded-full relative overflow-hidden shadow-inner border border-gray-100/10">
                           <div 
                              className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000 origin-bottom" 
                              style={{ height: `${Math.max(bar.height, 4)}%`, transitionDelay: `${idx * 15}ms` }}
                           ></div>
                        </div>
                        <span className="text-[7px] font-black text-gray-300 uppercase mt-2 group-hover:text-emerald-500 transition-colors">{bar.day}</span>
                     </div>
                  ))
               )}
            </div>
         </div>

         {/* Kanan: Distribusi Biaya Per Kategori */}
         <div className="lg:col-span-4 bg-white dark:bg-gray-900 p-10 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-xl flex flex-col group">
            <div className="flex items-center gap-4 mb-10">
               <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center shadow-inner">
                  <PieIcon size={24}/>
               </div>
               <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Struktur Biaya</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Alokasi Per Kategori</p>
               </div>
            </div>

            <div className="flex-1 space-y-7 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
               {stats.categoryDistribution.slice(0, 5).map((entry: any, idx: number) => {
                  const percentage = (entry.value / (stats.totalExpense || 1)) * 100;
                  return (
                     <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-end">
                           <span className="text-[9px] font-black uppercase text-gray-500 truncate max-w-[70%]">{entry.name}</span>
                           <span className="text-[9px] font-black text-rose-600">{Math.round(percentage)}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-50 dark:bg-gray-800 rounded-full relative overflow-hidden shadow-inner">
                           <div 
                              className="absolute inset-y-0 left-0 bg-gradient-to-r from-rose-600 to-rose-400 rounded-full transition-all duration-1000" 
                              style={{ width: `${Math.max(percentage, 2)}%` }}
                           ></div>
                        </div>
                     </div>
                  );
               })}
               {stats.categoryDistribution.length === 0 && (
                  <div className="py-20 text-center opacity-30 italic text-[10px] font-black uppercase tracking-widest">Belum Ada Pengeluaran</div>
               )}
            </div>
         </div>
      </div>

      {/* 3. STATUS OPERASIONAL LAPANGAN (READ ONLY) */}
      <div className="space-y-6">
         <div className="flex items-center gap-3 ml-2">
            <div className="w-10 h-10 bg-orange-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/20"><Timer size={20}/></div>
            <div>
               <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Status Operasional Lapangan</h3>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Real-time Technical & Asset Health</p>
            </div>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl flex flex-col">
               <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Daily Checklist</span>
                  <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-xl"><ClipboardList size={18}/></div>
               </div>
               <div className="space-y-4">
                  <h4 className="text-4xl font-black">{opData.doneChecklist}<span className="text-sm text-gray-300">/{opData.totalChecklist}</span></h4>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                     <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${opData.readinessScore}%` }} />
                  </div>
                  <div className="space-y-2 mt-4">
                     {urgentTasks.map(t => (
                        <div key={t.id} className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                           <p className="text-[9px] font-bold text-gray-500 uppercase truncate">{t.task}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl flex flex-col">
               <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Maintenance Alert</span>
                  <div className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl"><Wrench size={18}/></div>
               </div>
               <div className="space-y-4">
                  <h4 className={`text-4xl font-black ${overdueMaintenance.length > 0 ? 'text-rose-600' : 'text-gray-900 dark:text-white'}`}>{overdueMaintenance.length}</h4>
                  <div className="space-y-2 pt-2 border-t dark:border-gray-800">
                     {overdueMaintenance.map(m => (
                        <p key={m.id} className="text-[9px] font-bold text-rose-500 uppercase truncate">● {m.deviceName}</p>
                     ))}
                  </div>
               </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl flex flex-col">
               <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stok Kritis</span>
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl"><Package size={18}/></div>
               </div>
               <div className="space-y-3">
                  {criticalStocks.length === 0 ? (
                     <div className="py-6 text-center text-[10px] font-black text-emerald-600 uppercase tracking-widest">Stok Terkendali</div>
                  ) : (
                     criticalStocks.map(item => (
                        <div key={item.id} className="flex justify-between text-[10px] font-black uppercase border-b dark:border-gray-800 pb-2">
                           <span className="text-gray-400 truncate max-w-[60%]">{item.name}</span>
                           <span className="text-amber-600">{item.quantity} {item.unit}</span>
                        </div>
                     ))
                  )}
               </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl flex flex-col items-center justify-center text-center">
               <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-3xl mb-4">
                  <Users size={32}/>
               </div>
               <p className="text-4xl font-black text-indigo-600 leading-none mb-2">{staffingSummary}</p>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Staff On-Duty</p>
            </div>
         </div>
      </div>

      {/* 4. RINGKASAN ADMINISTRASI (READ ONLY) */}
      <div className="space-y-6">
         <div className="flex items-center gap-3 ml-2">
            <div className="w-10 h-10 bg-slate-800 text-white rounded-xl flex items-center justify-center shadow-lg shadow-slate-800/20"><FileSearch size={20}/></div>
            <div>
               <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Ringkasan Administrasi</h3>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Financial Compliance Monitoring</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl flex flex-col">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl"><FileText size={20}/></div>
                  <span className="text-[11px] font-black uppercase tracking-widest">Utang Vendor</span>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Total Unpaid</p>
                  <h4 className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{formatCurrency(totalPendingBillsAmount)}</h4>
                  <p className="text-[9px] font-bold text-red-500 uppercase mt-4 flex items-center gap-1.5"><AlertOctagon size={10}/> {pendingBills.length} Faktur</p>
               </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl flex flex-col">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-violet-50 dark:bg-violet-950/30 text-violet-600 rounded-2xl"><Banknote size={20}/></div>
                  <span className="text-[11px] font-black uppercase tracking-widest">Biaya Payroll</span>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Gaji Terbayar (Bulan Ini)</p>
                  <h4 className="text-2xl font-black text-violet-700 dark:text-violet-400">{formatCurrency(totalPayrollPaid)}</h4>
               </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl flex flex-col">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-2xl"><ArrowLeftRight size={20}/></div>
                  <span className="text-[11px] font-black uppercase tracking-widest">Alur Kas Internal</span>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Log Mutasi</p>
                  <h4 className="text-2xl font-black text-blue-700 dark:text-blue-400">{recentTransfersCount} Transaksi</h4>
               </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl flex flex-col">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-2xl"><Coins size={20}/></div>
                  <span className="text-[11px] font-black uppercase tracking-widest">Saldo Lapangan</span>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Kas Kecil Spv</p>
                  <h4 className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(supervisorBalance)}</h4>
               </div>
            </div>
         </div>
      </div>

      {/* AI STRATEGIC INTELLIGENCE (HOLISTIC AI) */}
      <div className="space-y-6 pt-10 border-t-2 border-dashed dark:border-gray-800">
         <div className="flex items-center gap-3 ml-2 group">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-110 transition-transform duration-500">
               <BrainCircuit size={28} className="animate-pulse" />
            </div>
            <div>
               <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Global Strategic Intelligence</h3>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Holistic Analysis: Finance, Ops, & Supply Chain</p>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-12">
               {loadingAI ? (
                  <div className="py-24 flex flex-col items-center justify-center space-y-6 bg-white dark:bg-gray-900 rounded-[4rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden relative">
                     <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/20 via-transparent to-emerald-50/20 dark:from-indigo-900/10 dark:to-emerald-900/10 animate-pulse"></div>
                     <Loader2 size={48} className="animate-spin text-indigo-600" />
                     <div className="text-center relative z-10">
                        <p className="text-sm font-black uppercase tracking-[0.4em] text-gray-900 dark:text-white">Neural Processing...</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 italic">Gemini AI is correlating data from Admin, Supervisor, and Purchasing</p>
                     </div>
                  </div>
               ) : aiInsights.length === 0 ? (
                  <div className="py-20 text-center text-gray-400 uppercase text-[10px] font-black italic tracking-widest border-2 border-dashed rounded-[3rem] dark:border-gray-800">
                     Belum ada analisa strategis global tersedia
                  </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                     {aiInsights.map((insight, idx) => (
                        <div key={idx} className={`p-10 rounded-[3.5rem] border-2 transition-all duration-500 hover:shadow-2xl group relative overflow-hidden flex flex-col h-full ${
                           insight.type === 'danger' ? 'bg-rose-50/30 border-rose-100 dark:bg-rose-950/10 dark:border-rose-900/30 hover:border-rose-300' :
                           insight.type === 'warning' ? 'bg-amber-50/30 border-amber-100 dark:bg-amber-950/10 dark:border-amber-900/30 hover:border-amber-300' :
                           'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-indigo-300 shadow-lg'
                        }`}>
                           <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                              {insight.domain === 'Finance' ? <TrendingUp size={120}/> : insight.domain === 'Operations' ? <Radar size={120}/> : <Truck size={120}/>}
                           </div>
                           
                           <div className="flex justify-between items-start mb-8 relative z-10">
                              <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                 insight.type === 'danger' ? 'bg-rose-600 text-white border-rose-600' :
                                 insight.type === 'warning' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                              }`}>
                                 {insight.domain} Insight
                              </div>
                              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                 insight.impact === 'High' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                              }`}>Impact: {insight.impact}</span>
                           </div>

                           <div className="flex-1 relative z-10">
                              <h4 className="text-lg font-black uppercase tracking-tight text-gray-900 dark:text-white mb-4 leading-tight group-hover:text-indigo-600 transition-colors">{insight.title}</h4>
                              <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed italic">"{insight.description}"</p>
                           </div>

                           <div className="pt-8 mt-auto border-t border-dashed dark:border-gray-800 relative z-10">
                              <button onClick={() => {
                                 if(insight.domain === 'Finance') onNavigate('laba-rugi');
                                 else if(insight.domain === 'Operations') onNavigate('op-checklist');
                                 else onNavigate('inv-stocks');
                              }} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:gap-3 transition-all">
                                 Tinjau Data Terkait <ChevronRight size={14}/>
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;