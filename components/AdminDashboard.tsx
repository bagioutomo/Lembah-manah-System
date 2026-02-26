
import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, ShoppingBag, ShieldCheck, Target, 
  ArrowUpRight, ArrowLeftRight, PieChart as PieIcon, History, ListTodo, PlusCircle, Check, Zap, Loader2, Trash2,
  Wallet, Ticket, Receipt, MapPin, Calendar, Plus, ArrowUpCircle, Activity, Sparkles,
  BarChart3, CreditCard, Users2, BellRing, ChevronRight, ClipboardCheck, AlertCircle,
  UserCheck, Banknote, Clock
} from 'lucide-react';
import { PageId, DashboardTask, IncomeRecord, ExpenseRecord, UserRole, Reservation, BillRecord, ScheduleRecord, Employee } from '../types';

const AnimatedCounter = ({ value, formatCurrency }: { value: number, formatCurrency: (v: number) => string }) => {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => { 
    if (typeof value === 'number' && !isNaN(value)) {
      setDisplayValue(value); 
    }
  }, [value]);
  return <span className="tabular-nums font-black">{formatCurrency(displayValue || 0)}</span>;
};

interface Props {
  stats: any;
  viewMode: 'BULANAN' | 'TAHUNAN';
  onNavigate: (page: PageId) => void;
  formatCurrency: (val: number) => string;
  currentTasks: DashboardTask[];
  newTaskText: string;
  setNewTaskText: (val: string) => void;
  onAddTask: (e: React.FormEvent) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  aiInsights: any[];
  loadingAI: boolean;
  wallets: string[];
  categories: string[];
  onAddIncome: (data: IncomeRecord) => void;
  onAddExpense: (data: ExpenseRecord) => void;
  userRole: UserRole;
  reservations?: Reservation[];
  bills?: BillRecord[];
  schedules?: ScheduleRecord[];
  employees?: Employee[];
  expenses: ExpenseRecord[];
}

const AdminDashboard: React.FC<Props> = ({ 
  stats, viewMode, onNavigate, formatCurrency, currentTasks, newTaskText, 
  setNewTaskText, onAddTask, onToggleTask, onDeleteTask, 
  aiInsights, loadingAI, wallets, categories, onAddIncome, onAddExpense, userRole,
  reservations = [],
  bills = [],
  schedules = [],
  employees = [],
  expenses = []
}) => {
  
  const [jobdeskStats, setJobdeskStats] = useState({ pending: 0, total: 0 });

  // Logic to fetch current period tasks from localStorage
  useEffect(() => {
    const now = new Date();
    const storageKey = `jobdesk-v7-${now.getFullYear()}-${now.getMonth() + 1}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const jobs = JSON.parse(saved);
      const pendingCount = jobs.filter((j: any) => !j.completed).length;
      setJobdeskStats({ pending: pendingCount, total: jobs.length });
    }
  }, []);

  const widgetOrder = [
    'JOBDESK_NOTIF',
    'KPI_HORIZONTAL_BAR', 
    'INCOME_CHART',
    'EXPENSE_CHART',
    'WALLET_HUB',          
    'OPERATIONAL_GRID',
    'RECENT_TX',
    'PAYROLL_SECTION',
    'BOTTOM_GRID'
  ];

  const chartBars = useMemo(() => {
    const data = stats?.chartData || [];
    if (data.length === 0) return [];
    const maxIncome = Math.max(...data.map((d: any) => d.income || 0), 1);
    return data.slice(-15).map((d: any) => ({ ...d, incomeHeight: ((d.income || 0) / maxIncome) * 100 }));
  }, [stats?.chartData]);

  const smoothTrendPath = useMemo(() => {
    const data = stats?.chartData || [];
    if (data.length < 2) return "";
    const subset = data.slice(-15);
    const maxIncome = Math.max(...subset.map((d: any) => d.income || 0), 1);
    const width = 300;
    const height = 120;
    const step = width / (subset.length - 1);
    
    const points = subset.map((d: any, i: number) => ({
      x: i * step,
      y: height - ((d.income || 0) / maxIncome) * height
    }));

    if (points.length === 0) return "";

    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y}`;
    }
    return d;
  }, [stats?.chartData]);

  const todayStrDate = new Date().toISOString().split('T')[0];
  const todayReservations = useMemo(() => {
    return (reservations || [])
      .filter(r => r.date === todayStrDate && (r.status === 'CONFIRMED' || r.status === 'PENDING'))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [reservations, todayStrDate]);

  const unpaidBills = (bills || []).filter(b => b.status === 'UNPAID');

  const staffOnDuty = useMemo(() => {
    return (schedules || []).map(s => {
      const shift = s.shifts[todayStrDate];
      if (shift && shift !== 'NONE' && shift !== 'OFF') {
        const emp = (employees || []).find(e => e.id === s.employeeId);
        return {
          id: s.employeeId,
          name: emp?.name || s.employeeName,
          shift,
          position: emp?.position || 'Staff'
        };
      }
      return null;
    }).filter(Boolean);
  }, [schedules, employees, todayStrDate]);
  
  const payrollSummary = useMemo(() => {
    // Kategori pengeluaran yang dihitung sebagai biaya gaji
    const payrollCategories = ['Gaji Pokok', 'Gaji Part-time', 'Overtime', 'Bonus Target', 'Service Charge'];
    
    // Hitung total riil yang sudah dibayar dari tabel pengeluaran periode ini
    const totalPaid = expenses
      .filter(e => payrollCategories.includes(e.category))
      .reduce((sum, e) => sum + (Number(e.amount) * (Number(e.qty) || 1)), 0);

    // Hitung estimasi kewajiban bulanan (Gaji pokok dari seluruh staff aktif)
    const activeStaff = (employees || []).filter(e => e.active && (e.status === 'FULLTIME' || e.status === 'PROBATION' || e.status === 'DAILYWORKER'));
    const estimatedMonthly = activeStaff.reduce((sum, e) => sum + (Number(e.baseSalary) || 0), 0);
    
    // Progres pembayaran
    const progress = estimatedMonthly > 0 ? (totalPaid / estimatedMonthly) * 100 : 0;
    
    return { 
      totalPaid, 
      estimatedMonthly, 
      progress, 
      staffCount: employees.filter(e => e.active).length 
    };
  }, [expenses, employees]);

  const getShiftBadgeColor = (shift: string) => {
    switch (shift) {
      case 'PAGI': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200';
      case 'SORE': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200';
      case 'MIDDLE': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const renderWidget = (id: string) => {
    switch (id) {
      case 'JOBDESK_NOTIF':
        if (jobdeskStats.total === 0) return null;
        const isAlert = jobdeskStats.pending > 0;
        return (
          <div key={id} className="animate-slide-up no-print mb-8">
            <div className={`p-[2px] rounded-[2.5rem] shadow-2xl transition-all duration-700 ${isAlert ? 'bg-gradient-to-r from-rose-600 via-red-500 to-rose-700 shadow-red-500/40 animate-pulse' : 'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700 shadow-emerald-500/20'}`}>
               <div className="bg-white dark:bg-gray-950 rounded-[2.45rem] p-6 sm:px-10 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative group">
                  <div className="flex items-center gap-6 relative z-10">
                     <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner transition-colors duration-500 ${isAlert ? 'bg-red-50 dark:bg-red-900/30 text-red-600' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600'}`}><BellRing size={32} className={isAlert ? 'animate-bounce' : ''} /></div>
                     <div className="text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
                           <p className={`text-[9px] font-black uppercase tracking-[0.4em] ${isAlert ? 'text-red-600' : 'text-emerald-600'}`}>{isAlert ? 'PERINGATAN KRITIS: TUGAS TERTUNDA' : 'STATUS SISTEM: BERJALAN OPTIMAL'}</p>
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">{isAlert ? `Ada ${jobdeskStats.pending} tugas utama yang butuh perhatian Bapak segera.` : 'Luar biasa! Seluruh target harian tim telah tercapai sesuai standar.'}</h3>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 relative z-10 shrink-0">
                    <button onClick={() => onNavigate('jobdesk-checklist')} className={`flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl transition-all active:scale-95 ${isAlert ? 'bg-red-600 text-white hover:bg-red-700 hover:-translate-y-1' : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:-translate-y-1'}`}>Tinjau Sekarang <ChevronRight size={18}/></button>
                  </div>
               </div>
            </div>
          </div>
        );

      case 'KPI_HORIZONTAL_BAR':
        const kpis = [
          { label: 'Laba Bersih', val: stats?.netProfit || 0, trend: stats?.trends?.profit, icon: <Target size={20} />, bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Total Omzet', val: stats?.totalIncome || 0, trend: stats?.trends?.income, icon: <TrendingUp size={20} />, bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
          { label: 'Total Biaya', val: stats?.totalExpense || 0, trend: stats?.trends?.expense, icon: <ShoppingBag size={20} />, bg: 'bg-rose-50 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
          { label: 'Pajak & SC', val: stats?.taxPool || 0, trend: stats?.trends?.tax, icon: <ShieldCheck size={20} />, bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' }
        ];
        return (
          <div key={id} className="animate-slide-up bg-white dark:bg-gray-900 p-8 sm:p-10 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden group">
             <div className="flex flex-col sm:flex-row items-center divide-y sm:divide-y-0 sm:divide-x dark:divide-gray-800">
                {kpis.map((kpi, idx) => (
                   <div key={idx} className={`flex-1 w-full sm:w-auto p-4 sm:p-6 flex flex-col gap-3 group/kpi transition-all hover:translate-x-1 first:pl-0 last:pr-0`}>
                      <div className="flex items-center gap-5">
                         <div className={`p-3.5 rounded-full ${kpi.bg} ${kpi.text} shadow-sm transition-transform group-hover/kpi:scale-110`}>
                            {kpi.icon}
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{kpi.label}</p>
                            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tighter leading-none whitespace-nowrap">
                               <AnimatedCounter value={kpi.val} formatCurrency={formatCurrency} />
                            </h3>
                         </div>
                      </div>
                      <div className="flex items-center gap-2 pl-[54px]">
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${kpi.trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                           {kpi.trend >= 0 ? <ArrowUpRight size={10}/> : <TrendingDown size={10}/>}
                           {Math.abs(Math.round(kpi.trend))}%
                        </div>
                        <span className="text-[7px] font-bold text-gray-300 uppercase tracking-widest">vs {viewMode === 'BULANAN' ? 'Bulan' : 'Tahun'} Lalu</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        );

      case 'INCOME_CHART':
        const avgIncome = Math.round((stats?.totalIncome || 0) / (stats?.chartData?.length || 1));
        const latestIncome = stats?.chartData?.slice(-1)[0]?.income || 0;
        const trendPercent = avgIncome > 0 ? ((latestIncome - avgIncome) / avgIncome) * 100 : 0;
        
        return (
          <div key={id} className="bg-white dark:bg-gray-900 p-8 sm:p-12 rounded-[4rem] border border-gray-100 dark:border-gray-800 shadow-2xl relative overflow-hidden group animate-fade-in">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] rotate-12 transition-transform duration-1000"><BarChart3 size={240} className="text-blue-600" /></div>
            
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 relative z-10">
               <div className="xl:col-span-8 pr-0 xl:pr-12 xl:border-r border-gray-100 dark:border-gray-800">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
                      <div className="flex items-center gap-6">
                         <div className="w-16 h-16 rounded-[1.8rem] bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-500"><ArrowUpCircle size={32}/></div>
                         <div><h3 className="text-2xl font-black uppercase tracking-tighter leading-none text-gray-900 dark:text-white">Performa Omzet</h3><p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">Analisa Pendapatan Harian</p></div>
                      </div>
                      <div className="flex gap-4">
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 px-8 py-4 rounded-3xl border border-blue-100 dark:border-blue-800 backdrop-blur-sm">
                          <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1 text-center">Rerata Per Hari</p>
                          <p className="text-lg font-black text-blue-700 dark:text-blue-400 leading-none">{formatCurrency(avgIncome || 0)}</p>
                        </div>
                        <button onClick={() => onNavigate('penjualan')} className="p-5 bg-gray-900 text-white dark:bg-white dark:text-black rounded-[1.5rem] hover:scale-110 transition-all shadow-xl active:scale-95"><Plus size={24} /></button>
                      </div>
                  </div>
                  <div className="flex items-end justify-between h-[180px] gap-2 sm:gap-4 relative px-4">
                      {chartBars.map((bar: any, idx: number) => (
                        <div key={idx} className="flex-1 flex flex-col items-center group/bar relative h-full">
                          <div className="absolute bottom-full mb-4 opacity-0 group-hover/bar:opacity-100 scale-75 group-hover/bar:scale-100 -translate-y-4 group-hover/bar:translate-y-0 transition-all duration-500 z-20 pointer-events-none origin-bottom">
                            <div className="bg-gray-900 dark:bg-white text-white dark:text-black text-[9px] font-black px-3 py-1.5 rounded-2xl shadow-2xl whitespace-nowrap">
                               Tgl {bar.day}: {formatCurrency(bar.income)}
                            </div>
                          </div>
                          <div className="w-full h-[180px] bg-gray-50 dark:bg-gray-800/40 rounded-full relative overflow-hidden shadow-inner group-hover/bar:border-blue-500/30 transition-colors">
                              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-blue-700 to-blue-400 rounded-full transition-all duration-1000 origin-bottom" style={{ height: `${Math.max(bar.incomeHeight, 6)}%`, transitionDelay: `${idx * 15}ms` }}></div>
                          </div>
                          <span className="text-[9px] font-black text-gray-300 mt-5 uppercase group-hover/bar:text-blue-600 transition-colors">{bar.day}</span>
                        </div>
                      ))}
                  </div>
               </div>

               <div className="xl:col-span-4 flex flex-col justify-between py-2 group/trend">
                  <div>
                    <div className="flex justify-between items-start mb-10">
                       <div>
                          <div className="flex items-center gap-2 mb-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
                             <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em]">Statistik Pasar</p>
                          </div>
                          <h4 className="text-2xl font-black uppercase tracking-tighter text-gray-900 dark:text-white leading-none">Statistik Tren</h4>
                       </div>
                       <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-transparent group-hover/trend:border-emerald-500/30 transition-all duration-500">
                          <Sparkles size={24} className="text-emerald-500 animate-pulse"/>
                       </div>
                    </div>

                    <div className="relative h-[120px] w-full mb-10 group-hover/trend:scale-[1.02] transition-transform duration-700">
                       <svg className="w-full h-full overflow-visible" viewBox="0 0 300 120" preserveAspectRatio="none">
                          <defs>
                             <linearGradient id="glowGradient" x1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                             </linearGradient>
                             <filter id="neonShadow">
                                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                <feMerge>
                                   <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
                                </feMerge>
                             </filter>
                          </defs>
                          <path d={`${smoothTrendPath} L 300,120 L 0,120 Z`} fill="url(#glowGradient)" className="transition-all duration-1000" />
                          <path 
                             d={smoothTrendPath} 
                             fill="none" 
                             stroke="#10b981" 
                             strokeWidth="5" 
                             strokeLinecap="round" 
                             strokeLinejoin="round" 
                             filter="url(#neonShadow)"
                             className="transition-all duration-1000 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                          />
                          {chartBars.length > 0 && (
                             <g className="animate-pulse">
                                <circle cx="300" cy={120 - (chartBars[chartBars.length-1].incomeHeight / 100) * 120} r="6" fill="#10b981" />
                                <circle cx="300" cy={120 - (chartBars[chartBars.length-1].incomeHeight / 100) * 120} r="10" fill="#10b981" className="opacity-20" />
                             </g>
                          )}
                       </svg>
                       <div className="absolute inset-0 grid grid-cols-5 pointer-events-none opacity-5">
                          {[1,2,3,4,5].map(i => <div key={i} className="h-full w-px border-r border-dashed border-gray-900 dark:border-white"></div>)}
                       </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-1">
                     <div className="flex justify-between items-end">
                        <div>
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Transaksi Terakhir</p>
                           <h4 className="text-3xl font-black text-gray-900 dark:text-white tabular-nums leading-none tracking-tighter">
                              {formatCurrency(latestIncome).replace('Rp ', '')}
                           </h4>
                        </div>
                        <div className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl font-black text-[11px] shadow-lg ${trendPercent >= 0 ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-rose-600 text-white shadow-rose-600/20'}`}>
                           {trendPercent >= 0 ? <ArrowUpRight size={16}/> : <TrendingDown size={16}/>}
                           {Math.abs(Math.round(trendPercent))}%
                        </div>
                     </div>
                     <p className="text-[8px] font-bold text-gray-400 uppercase mt-4 tracking-[0.2em] italic">Audit Finansial Terverifikasi @ Selo</p>
                  </div>
               </div>
            </div>
          </div>
        );

      case 'EXPENSE_CHART':
        const netProfit = stats?.netProfit || 1;
        return (
          <div key={id} className="bg-white dark:bg-gray-900 p-12 rounded-[4rem] border border-gray-100 dark:border-gray-800 shadow-2xl relative overflow-hidden group animate-fade-in">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] rotate-12 transition-transform duration-1000"><PieIcon size={240} className="text-rose-600" /></div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 relative z-10 gap-8">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 rounded-[1.8rem] bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-500"><Activity size={32}/></div>
                   <div><h3 className="text-2xl font-black uppercase tracking-tighter leading-none text-gray-900 dark:text-white">Struktur Pengeluaran</h3><p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">Analisa Beban vs Laba Bersih</p></div>
                </div>
                <button onClick={() => onNavigate('pengeluaran')} className="p-5 bg-rose-600 text-white rounded-[1.5rem] hover:scale-110 transition-all shadow-xl active:scale-95"><Plus size={24} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 relative z-10">
                {(stats?.categoryDistribution || []).slice(0, 10).map((entry: any, idx: number) => {
                  // BASIS PERSENTASE: TERHADAP LABA BERSIH
                  const percentageOfProfit = netProfit > 0 ? (entry.value / netProfit) * 100 : 0;
                  return (
                    <div key={idx} className="space-y-2 group/cat transition-all hover:translate-x-2">
                      <div className="flex justify-between items-end px-3">
                        <div className="flex flex-col">
                           <span className="text-[12px] font-black uppercase text-gray-700 dark:text-gray-200 tracking-tight truncate max-w-[200px]">{entry.name}</span>
                           <span className="text-[10px] font-bold text-rose-600/70">{formatCurrency(entry.value)}</span>
                        </div>
                        <div className="text-right">
                           <span className="text-[11px] font-black text-rose-600">{Math.round(percentageOfProfit)}%</span>
                           <p className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter">Dari Laba</p>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-gray-50 dark:bg-gray-800 rounded-full relative overflow-hidden shadow-inner">
                         <div className={`absolute inset-y-0 left-0 bg-gradient-to-r from-rose-600 to-rose-400 rounded-full transition-all duration-1000 ${percentageOfProfit > 50 ? 'animate-pulse' : ''}`} style={{ width: `${Math.min(percentageOfProfit, 100)}%` }}></div>
                      </div>
                    </div>
                  );
                })}
                {(!stats?.categoryDistribution || stats.categoryDistribution.length === 0) && (
                   <div className="col-span-full py-10 text-center text-gray-400 italic font-black uppercase tracking-widest text-[10px]">Data pengeluaran belum tersedia</div>
                )}
            </div>
          </div>
        );

      case 'WALLET_HUB':
        return (
          <div key={id} className="space-y-4 no-print animate-fade-in py-6">
             <div className="flex items-center justify-between px-8">
                <div className="flex items-center gap-4">
                   <div className="w-1.5 h-6 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
                   <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-gray-50">Arus Kas Per Dompet</h3>
                </div>
                <button onClick={() => onNavigate('adj-finance')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer">
                   Audit Mendalam <ArrowLeftRight size={14}/>
                </button>
             </div>

             <div className="overflow-x-auto pb-4 no-scrollbar">
                <div className="grid grid-rows-2 grid-flow-col gap-4 px-8 auto-cols-max">
                   {(wallets || []).map(w => (
                      <div 
                         key={w} 
                         className="w-[350px] p-8 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl flex flex-col justify-between hover:border-indigo-400 hover:shadow-indigo-50/5 transition-all duration-300 group cursor-default"
                      >
                         <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-4">
                               <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse"></div>
                               <span className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] truncate max-w-[200px]">{w}</span>
                            </div>
                            <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                               <CreditCard size={18} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                            </div>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter opacity-60">Net Arus Kas Periode</p>
                            <h4 className={`text-3xl font-black tracking-tight tabular-nums leading-none ${stats?.walletBalances?.[w] > 0 ? 'text-emerald-600' : stats?.walletBalances?.[w] < 0 ? 'text-rose-600' : 'text-gray-300'}`}>
                               {stats?.walletBalances?.[w] > 0 ? '+' : ''}{formatCurrency(stats?.walletBalances?.[w] || 0).replace('Rp ', '')}
                            </h4>
                         </div>
                      </div>
                   ))}
                   <button onClick={() => onNavigate('adj-finance')} className="w-[180px] h-full rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center gap-4 text-gray-300 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50/10 transition-all group cursor-pointer">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full group-hover:scale-110 transition-transform">
                         <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Aset Baru</span>
                   </button>
                </div>
             </div>
          </div>
        );

      case 'OPERATIONAL_GRID':
        return (
          <div key={id} className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
             <div className="bg-white dark:bg-gray-900 p-8 sm:p-10 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-xl group">
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-4"><div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl"><Ticket size={24}/></div><h3 className="text-lg font-black uppercase tracking-tighter leading-none">Reservasi Hari Ini</h3></div>
                   <button onClick={() => onNavigate('reservasi')} className="p-2 text-gray-400 hover:text-emerald-600 transition-all"><ArrowUpRight size={20}/></button>
                </div>
                <div className="space-y-3">
                   {todayReservations.length === 0 ? (<div className="py-12 text-center opacity-30 italic text-[10px] font-black uppercase tracking-widest">Tidak ada jadwal hari ini</div>) : (
                      todayReservations.map(res => (
                         <div key={res.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl hover:bg-white border border-transparent hover:border-emerald-100 transition-all">
                            <div className="flex items-center gap-3">
                               <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${res.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>{res.time}</span>
                               <p className="text-xs font-black uppercase text-gray-800 dark:text-gray-200 truncate max-w-[100px]">{res.customerName}</p>
                            </div>
                            <div className="text-[8px] font-bold text-gray-400 uppercase">{res.guests} Pax</div>
                         </div>
                      ))
                   )}
                </div>
             </div>

             <div className="bg-white dark:bg-gray-900 p-8 sm:p-10 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-xl group">
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-4"><div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl"><Receipt size={24}/></div><h3 className="text-lg font-black uppercase tracking-tighter leading-none">Tagihan Vendor</h3></div>
                   <button onClick={() => onNavigate('tagihan')} className="p-2 text-gray-400 hover:text-indigo-600 transition-all"><ArrowUpRight size={20}/></button>
                </div>
                <div className="space-y-3">
                   {unpaidBills.length === 0 ? (<div className="py-12 text-center opacity-30 italic text-[10px] font-black uppercase tracking-widest">Semua Tagihan Lunas</div>) : (
                      unpaidBills.slice(0, 4).map(bill => (
                         <div key={bill.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl hover:bg-white border border-transparent hover:border-indigo-100 transition-all">
                            <p className="text-xs font-black uppercase text-gray-800 dark:text-gray-200 truncate max-w-[100px]">{bill.title}</p>
                            <p className="text-[10px] font-black text-indigo-700">{formatCurrency(bill.amount || 0).replace('Rp ', '')}</p>
                         </div>
                      ))
                   )}
                </div>
             </div>

             <div className="bg-white dark:bg-gray-900 p-8 sm:p-10 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-xl group">
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-4"><div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl"><UserCheck size={24}/></div><h3 className="text-lg font-black uppercase tracking-tighter leading-none">Petugas Shift</h3></div>
                   <button onClick={() => onNavigate('op-schedule')} className="p-2 text-gray-400 hover:text-blue-600 transition-all"><ArrowUpRight size={20}/></button>
                </div>
                <div className="space-y-3">
                   {staffOnDuty.length === 0 ? (
                      <div className="py-12 text-center opacity-30 italic text-[10px] font-black uppercase tracking-widest">Tidak ada penugasan tercatat</div>
                   ) : (
                      staffOnDuty.map((s: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl hover:bg-white border border-transparent hover:border-blue-100 transition-all">
                           <div className="flex flex-col">
                              <p className="text-xs font-black uppercase text-gray-800 dark:text-gray-200 truncate max-w-[120px]">{s.name}</p>
                              <span className="text-[7px] font-bold text-gray-400 uppercase">{s.position}</span>
                           </div>
                           <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border ${getShiftBadgeColor(s.shift)}`}>
                             {s.shift}
                           </span>
                        </div>
                      ))
                   )}
                </div>
             </div>
          </div>
        );

      case 'RECENT_TX':
        return (
          <div key={id} className="bg-white dark:bg-gray-900 p-10 rounded-[4rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden group animate-fade-in">
              <div className="flex items-center justify-between mb-10 px-4">
                 <div className="flex items-center gap-6">
                    <div className="p-4 bg-rose-50 dark:bg-rose-900/30 rounded-2xl text-rose-600 shadow-inner group-hover:scale-110 transition-transform duration-500"><History size={28} /></div>
                    <div><h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Aktivitas Terkini</h3><p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Audit Log Transaksi Terbaru</p></div>
                 </div>
                 <button onClick={() => onNavigate('expense')} className="px-8 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-rose-600 transition-all">Audit Database <ArrowUpRight size={16} className="inline ml-1"/></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 pb-4">
                 {(stats?.recentExpenses || []).slice(0, 9).map((exp: any) => (
                    <div key={exp.id} className="p-6 bg-gray-50/50 dark:bg-gray-800/40 rounded-3xl border border-transparent hover:border-rose-100 hover:bg-white transition-all group/tx flex justify-between items-center shadow-sm">
                       <div className="overflow-hidden">
                          <p className="text-xs font-black uppercase truncate text-gray-900 dark:text-white mb-1 group-hover/tx:text-rose-600">{exp.notes || 'Pengeluaran'}</p>
                          <div className="flex items-center gap-3"><span className="text-[8px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{exp.category}</span><span className="text-[7px] font-bold text-gray-300">{new Date(exp.date).toLocaleDateString('id-ID')}</span></div>
                       </div>
                       <p className="text-sm font-black text-rose-600 tracking-tighter shrink-0 ml-4">-{formatCurrency(exp.amount || 0).replace('Rp ', '')}</p>
                    </div>
                 ))}
              </div>
          </div>
        );

      case 'PAYROLL_SECTION':
        return (
          <div key={id} className="bg-white dark:bg-gray-900 p-12 rounded-[4rem] border border-gray-100 dark:border-gray-800 shadow-2xl animate-fade-in group overflow-hidden relative">
             <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12 transition-transform duration-1000 group-hover:scale-110"><Banknote size={240} className="text-indigo-600" /></div>
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 relative z-10 gap-8">
                <div className="flex items-center gap-6">
                   <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-[1.8rem] shadow-inner"><Banknote size={32}/></div>
                   <div><h3 className="text-2xl font-black uppercase tracking-tighter leading-none text-gray-900 dark:text-white">Ringkasan Gaji</h3><p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-2">Realisasi Penggajian Karyawan</p></div>
                </div>
                <button onClick={() => onNavigate('hrd-payroll')} className="px-8 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-all flex items-center gap-2 shadow-sm">Pusat Payroll <ArrowUpRight size={16}/></button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gaji Terbayar</p>
                   <h4 className="text-3xl font-black text-indigo-700 dark:text-indigo-400 leading-none">{formatCurrency(payrollSummary.totalPaid)}</h4>
                   <div className="flex items-center gap-2 text-[9px] font-bold text-emerald-600 uppercase"><Check size={12}/> {payrollSummary.staffCount} Staff Terdata</div>
                </div>
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alokasi Bulanan</p>
                   <h4 className="text-3xl font-black text-gray-900 dark:text-white leading-none">{formatCurrency(payrollSummary.estimatedMonthly)}</h4>
                   <p className="text-[9px] font-bold text-gray-400 uppercase italic">Gaji Pokok Staff Aktif</p>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between items-end"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progres Pembayaran</p><span className="text-[11px] font-black text-indigo-600">{Math.round(payrollSummary.progress)}%</span></div>
                   <div className="h-3 w-full bg-gray-50 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-1000 ease-out" style={{ width: `${Math.min(payrollSummary.progress, 100)}%` }}></div>
                   </div>
                   <p className="text-[9px] font-medium text-gray-400 leading-relaxed uppercase tracking-tight">Persentase realisasi gaji terhadap total liabilitas bulanan.</p>
                </div>
             </div>
          </div>
        );

      case 'BOTTOM_GRID':
        const isQuotaLimited = aiInsights && aiInsights.length > 0 && aiInsights[0].isQuotaMessage;

        return (
          <div key={id} className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
             <div className={`lg:col-span-7 bg-white dark:bg-gray-900 p-12 rounded-[4.5rem] border-2 shadow-xl relative overflow-hidden flex flex-col justify-center group ${isQuotaLimited ? 'border-amber-400/50' : 'border-gray-100 dark:border-gray-800'}`}>
                 <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 transition-all duration-1000 group-hover:scale-110"><Zap size={240} className={isQuotaLimited ? 'text-amber-600' : 'text-indigo-600'} /></div>
                 <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-10">
                       <div className={`p-3 rounded-2xl shadow-inner ${isQuotaLimited ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'}`}>
                          {isQuotaLimited ? <Clock size={28}/> : <Sparkles size={28}/>}
                       </div>
                       <div>
                          <h3 className="text-2xl font-black uppercase tracking-tighter leading-none text-gray-900 dark:text-white">
                             {isQuotaLimited ? 'Wawasan AI Terbatas' : 'Wawasan Pintar AI'}
                          </h3>
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mt-1">
                             {isQuotaLimited ? 'Mode Cooldown Aktif' : 'Analisis Finansial Mendalam'}
                          </p>
                       </div>
                    </div>
                    {loadingAI ? (
                       <div className="py-12 flex flex-col items-center gap-6">
                          <Loader2 className="animate-spin text-indigo-600" size={48} />
                          <p className="text-[11px] font-black uppercase tracking-[0.6em] animate-pulse text-indigo-600 opacity-60">AUDIT DATA SEDANG BERJALAN...</p>
                       </div>
                    ) : aiInsights && aiInsights.length > 0 ? (
                       <div className="space-y-8 animate-fade-in">
                          <div>
                             <h4 className={`text-xl font-black uppercase tracking-tight mb-3 ${isQuotaLimited ? 'text-amber-700 dark:text-amber-400' : 'text-indigo-700 dark:text-indigo-400'}`}>
                                {aiInsights[0].title}
                             </h4>
                             <p className={`text-[13px] font-medium leading-relaxed italic border-l-4 pl-6 ${isQuotaLimited ? 'text-amber-800 dark:text-amber-50 border-amber-200' : 'text-gray-600 dark:text-gray-400 border-indigo-100 dark:border-indigo-900'}`}>
                                "{aiInsights[0].description}"
                             </p>
                             {isQuotaLimited && (
                                <p className="mt-6 text-[10px] font-black text-amber-600 uppercase tracking-widest">
                                   * Analisis real-time akan kembali setelah kuota gratis di-reset.
                                </p>
                             )}
                          </div>
                       </div>
                    ) : (
                       <div className="text-center py-12 opacity-40 uppercase text-[11px] font-black tracking-[0.4em] text-gray-400">Menunggu Aliran Data...</div>
                    )}
                 </div>
             </div>
             <div className="lg:col-span-5 bg-white dark:bg-gray-900 p-12 rounded-[4.5rem] border border-gray-100 dark:border-gray-800 shadow-xl">
                 <div className="flex items-center justify-between mb-10"><h3 className="text-[13px] font-black uppercase tracking-[0.3em] flex items-center gap-4 text-gray-900 dark:text-white"><div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 shadow-inner"><ListTodo size={24} /></div>Memo Strategis</h3><BellRing size={16} className="text-emerald-500 animate-pulse" /></div>
                 <form onSubmit={onAddTask} className="flex gap-3 mb-8"><input type="text" value={newTaskText} onChange={e => setNewTaskText(e.target.value)} placeholder="Instruksi baru..." className="flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 outline-none font-bold text-xs shadow-inner focus:ring-4 focus:ring-indigo-500/10 transition-all" /><button type="submit" className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all"><PlusCircle size={22}/></button></form>
                 <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-3">{currentTasks.map(task => (<div key={task.id} className="flex items-center gap-4 p-4.5 bg-gray-50/50 dark:bg-gray-800/40 rounded-[1.8rem] group/task border border-transparent hover:border-indigo-100 hover:bg-white transition-all"><button onClick={() => onToggleTask(task.id)} className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${task.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200'}`}>{task.completed && <Check size={18} strokeWidth={4}/>}</button><span className={`text-[12px] font-black uppercase tracking-tight truncate flex-1 ${task.completed ? 'text-gray-300 line-through' : 'text-gray-700 dark:text-gray-200'}`}>{task.text}</span><button onClick={() => onDeleteTask(task.id)} className="p-2 text-red-300 opacity-0 group-hover/task:opacity-100 hover:text-red-600 transition-all hover:scale-125"><Trash2 size={16}/></button></div>))}</div>
             </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-12 pb-24 relative max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-4 no-print px-2">
         <div className="flex items-center gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pusat Manajemen Lembah Manah v25</span>
         </div>
      </div>
      <div className="space-y-10">
        {widgetOrder.map(id => renderWidget(id))}
      </div>
    </div>
  );
};

export default AdminDashboard;
