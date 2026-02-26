
import React, { useMemo, useState, useEffect } from 'react';
import { 
  Radar, Wrench, Navigation, ListTodo, PlusCircle, Check, Trash2, Wallet, Coins, 
  ChevronRight, Activity, UserCheck, Clock, CalendarDays, AlertOctagon, Package, 
  Box, AlertTriangle, Hammer, History, TrendingUp, TrendingDown, ArrowUpRight, ArrowLeftRight, Sparkles, Scale as ScaleIcon,
  Eraser, CheckCircle2, Receipt, AlertCircle, SearchCheck, Star, ThumbsUp, ThumbsDown, Loader2, Globe,
  Cpu, Zap, MessageSquareQuote, ShieldCheck as ShieldIcon, Lightbulb, Ticket, MapPin, Users, BellRing,
  ExternalLink, Banknote
} from 'lucide-react';
import { PageId, DashboardTask, ScheduleRecord, Employee, InventoryItem, MaintenanceTask, OperationalChecklistItem, BillRecord, BusinessInfo, Reservation } from '../types';
import { getGoogleReviewAnalysis, getOperationalAnalysis } from '../services/geminiService';

interface Props {
  opData: any;
  viewMode: 'BULANAN' | 'TAHUNAN';
  formatCurrency: (val: number) => string;
  walletBalances: Record<string, number>;
  onNavigate: (page: PageId) => void;
  currentTasks: DashboardTask[];
  newTaskText: string;
  setNewTaskText: (val: string) => void;
  onAddTask: (e: React.FormEvent) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  schedules?: ScheduleRecord[];
  employees?: Employee[];
  inventoryItems?: InventoryItem[];
  maintenance?: MaintenanceTask[];
  recentExpenses?: any[];
  chartData?: any[];
  checklist?: OperationalChecklistItem[];
  bills?: BillRecord[];
  businessInfo?: BusinessInfo;
  reservations?: Reservation[];
}

const SupervisorDashboard: React.FC<Props> = ({ 
  opData, viewMode, formatCurrency, walletBalances, onNavigate, 
  currentTasks, newTaskText, setNewTaskText, onAddTask, 
  onToggleTask, onDeleteTask, schedules = [], employees = [], 
  inventoryItems = [], maintenance = [], recentExpenses = [],
  chartData = [], checklist = [], bills = [], businessInfo,
  reservations = []
}) => {
  const supervisorBalance = walletBalances['Supervisor'] || 0;
  const [reviewAnalysis, setReviewAnalysis] = useState<any>(null);
  const [reviewSources, setReviewSources] = useState<any[]>([]);
  const [loadingReview, setLoadingReview] = useState(false);
  const [opInsights, setOpInsights] = useState<any[]>([]);
  const [loadingOpAI, setLoadingOpAI] = useState(false);
  
  const [jobdeskStats, setJobdeskStats] = useState({ pending: 0, total: 0 });

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Sync Jobdesk Notifications for Supervisor
  useEffect(() => {
    const now = new Date();
    const storageKey = `jobdesk-v7-${now.getFullYear()}-${now.getMonth() + 1}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const jobs = JSON.parse(saved);
      // Filter jobs for SUPERVISOR or MANAGER (which usually oversees everything)
      const supervisorJobs = jobs.filter((j: any) => j.pic === 'SUPERVISOR' || j.pic === 'MANAGER');
      const pendingCount = supervisorJobs.filter((j: any) => !j.completed).length;
      setJobdeskStats({ pending: pendingCount, total: supervisorJobs.length });
    }
  }, [currentTasks]);

  const todayReservations = useMemo(() => {
    return reservations
      .filter(r => r.date === todayStr && r.status === 'CONFIRMED')
      .sort((a, b) => a.time.slice(0, 5).localeCompare(b.time.slice(0, 5)));
  }, [reservations, todayStr]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!businessInfo?.name) return;
      setLoadingReview(true);
      try {
        const res = await getGoogleReviewAnalysis(businessInfo.name);
        if (res && res.data) {
          setReviewAnalysis(res.data);
          setReviewSources(res.sources || []);
        }
      } catch (err) {
        console.error("Gagal memuat ulasan", err);
      } finally {
        setLoadingReview(false);
      }
    };
    fetchReviews();
  }, [businessInfo?.name]);

  useEffect(() => {
    const fetchOpAI = async () => {
      if (checklist.length === 0 && maintenance.length === 0) return;
      setLoadingOpAI(true);
      try {
        const res = await getOperationalAnalysis(checklist, maintenance, inventoryItems, schedules);
        if (res) setOpInsights(res);
      } catch (err) {
        console.error("Gagal memuat analisis AI", err);
      } finally {
        setLoadingOpAI(false);
      }
    };
    const timer = setTimeout(fetchOpAI, 2000);
    return () => clearTimeout(timer);
  }, [checklist.length, maintenance.length, inventoryItems.length, schedules.length]);

  const chartBars = useMemo(() => {
    const data = chartData || [];
    if (data.length === 0) return [];
    const maxVal = Math.max(...data.map((d: any) => d.income || 0), 1);
    return data.slice(-12).map((d: any) => ({ ...d, height: ((d.income || 0) / maxVal) * 100 }));
  }, [chartData]);

  const dailyAvgIncome = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0;
    const total = chartData.reduce((sum, d) => sum + (d.income || 0), 0);
    return total / chartData.length;
  }, [chartData]);

  const staffOnDuty = useMemo(() => {
    return schedules.map(s => {
      const shift = s.shifts[todayStr];
      if (shift && shift !== 'NONE' && shift !== 'OFF') {
        const emp = employees.find(e => e.id === s.employeeId);
        return {
          id: s.employeeId,
          name: emp?.name || s.employeeName,
          shift,
          position: emp?.position || 'Staff'
        };
      }
      return null;
    }).filter(Boolean);
  }, [schedules, employees, todayStr]);

  const criticalInventory = useMemo(() => {
    return inventoryItems
      .filter(item => item.type === 'RAW_MATERIAL' && item.quantity <= 5)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5);
  }, [inventoryItems]);

  const criticalMaintenance = useMemo(() => {
    return [...maintenance]
      .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())
      .slice(0, 8);
  }, [maintenance]);

  const checklistAlerts = useMemo(() => {
    const now = new Date();
    const currentTimeStr = now.toTimeString().slice(0, 5);
    
    return checklist
      .filter(item => !item.done)
      .map(item => ({
        ...item,
        isOverdue: item.frequency === 'DAILY' && item.time < currentTimeStr
      }))
      .sort((a, b) => {
        if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
        if (a.priority !== b.priority) return a.priority === 'HIGH' ? -1 : 1;
        return a.time.localeCompare(b.time);
      })
      .slice(0, 5);
  }, [checklist]);

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
      })
      .slice(0, 5);
  }, [bills]);

  const getShiftBadgeColor = (shift: string) => {
    switch (shift) {
      case 'PAGI': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200';
      case 'SORE': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200';
      case 'MIDDLE': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const safeFormatCurrency = (val: number) => {
    if (typeof val !== 'number' || isNaN(val)) return 'Rp 0';
    return formatCurrency(val);
  };

  return (
    <div className="space-y-12 animate-fade-in">
       
       {/* NOTIFIKASI JOBDESK HARIAN SUPERVISOR */}
       {jobdeskStats.total > 0 && (
         <div className="animate-slide-up no-print mb-6">
            <div className={`p-[2px] rounded-[2.5rem] shadow-2xl transition-all duration-700 ${jobdeskStats.pending > 0 ? 'bg-gradient-to-r from-orange-600 via-amber-500 to-orange-700 shadow-orange-500/20' : 'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700 shadow-emerald-500/10'}`}>
               <div className="bg-white dark:bg-gray-950 rounded-[2.45rem] p-6 sm:px-10 sm:py-7 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative group">
                  <div className="flex items-center gap-6 relative z-10">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner transition-colors duration-500 ${jobdeskStats.pending > 0 ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600'}`}>
                        <BellRing size={28} className={jobdeskStats.pending > 0 ? 'animate-bounce' : ''} />
                     </div>
                     <div className="text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
                           <p className={`text-[9px] font-black uppercase tracking-[0.4em] ${jobdeskStats.pending > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                              {jobdeskStats.pending > 0 ? 'TUGAS TERTUNDA' : 'TUGAS SELESAI'}
                           </p>
                        </div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                           {jobdeskStats.pending > 0 
                             ? `Pak Supervisor, ada ${jobdeskStats.pending} agenda tugas taktis yang perlu Bapak selesaikan hari ini.` 
                             : 'Luar biasa! Semua instruksi harian untuk Bapak telah dikonfirmasi selesai.'}
                        </h3>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 relative z-10 shrink-0">
                    <button onClick={() => onNavigate('jobdesk-checklist')} className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 ${jobdeskStats.pending > 0 ? 'bg-orange-600 text-white hover:bg-orange-700 hover:-translate-y-1' : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:-translate-y-1'}`}>
                       Buka Agenda Tugas <ChevronRight size={16}/>
                    </button>
                  </div>
               </div>
            </div>
         </div>
       )}

       {/* 1. KARTU UTAMA: SALDO & GRAFIK */}
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 bg-white dark:bg-gray-950 p-10 rounded-[4rem] border border-orange-100 dark:border-orange-900/30 shadow-2xl relative overflow-hidden group transition-all duration-700 hover:scale-[1.05] hover:-translate-y-3 hover:shadow-orange-500/20">
             <div className="absolute top-0 right-0 p-12 opacity-[0.03] -rotate-12 group-hover:rotate-0 group-hover:scale-150 transition-all duration-1000"><Wallet size={180} className="text-orange-600" /></div>
             <div className="relative z-10 flex flex-col justify-between h-full space-y-10">
                <div>
                   <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-orange-100 dark:bg-orange-900/40 rounded-2xl animate-breath-glow text-orange-600">
                         <Wallet size={24} />
                      </div>
                      <span className="px-4 py-1.5 bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-orange-200 dark:border-orange-900">
                         Net Arus Kas Periode
                      </span>
                   </div>
                   <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2 group-hover:text-orange-500 transition-colors">Mutasi Bersih Supervisor</p>
                   <h2 className={`text-5xl font-black tracking-tighter leading-none group-hover:translate-x-3 transition-transform duration-500 ${supervisorBalance >= 0 ? 'text-orange-600 dark:text-orange-500' : 'text-rose-600'}`}>
                      {supervisorBalance > 0 ? '+' : ''}{safeFormatCurrency(supervisorBalance)}
                   </h2>
                </div>
                <div className="space-y-3">
                   <button onClick={() => onNavigate('mutation-logs')} className="w-full py-5 bg-orange-600 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 shadow-xl hover:bg-orange-700 hover:shadow-orange-600/40 hover:-translate-y-1 active:scale-95">Riwayat Mutasi Dana <ArrowUpRight size={18} className="group-hover:rotate-45 transition-transform" /></button>
                </div>
             </div>
          </div>

          <div className="lg:col-span-8 bg-white dark:bg-gray-900 p-12 rounded-[4.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl relative overflow-hidden group transition-all duration-700 hover:shadow-emerald-500/10 hover:border-emerald-100">
             <div className="flex justify-between items-center mb-10 relative z-10">
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center animate-breath-glow font-black group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                      <TrendingUp size={28} />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter group-hover:text-emerald-600 transition-colors">Performa Penjualan</h3>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Monitoring Grafik Harian Terkini</p>
                   </div>
                </div>
                <div className="text-right group-hover:-translate-x-2 transition-transform duration-500">
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Rerata Omzet</p>
                   <p className="text-lg font-black text-emerald-600">{safeFormatCurrency(dailyAvgIncome)}</p>
                </div>
             </div>
             <div className="flex items-end justify-between h-[200px] gap-3 mb-6 px-4 relative">
                {chartBars.map((bar: any, idx: number) => (
                  <div key={idx} className="flex-1 flex flex-col items-center group/bar relative cursor-pointer">
                     <div className="absolute bottom-full mb-4 opacity-0 group-hover/bar:opacity-100 scale-75 group-hover/bar:scale-100 -translate-y-4 group-hover/bar:translate-y-0 transition-all duration-500 z-20 pointer-events-none origin-bottom">
                        <div className="bg-gray-900 dark:bg-white text-white dark:text-black text-[9px] font-black px-3 py-1.5 rounded-2xl shadow-2xl whitespace-nowrap border dark:border-emerald-500/30">
                           Tgl {bar.day}: {safeFormatCurrency(bar.income)}
                        </div>
                     </div>
                     <div className="w-full h-[200px] bg-gray-50 dark:bg-gray-800/40 rounded-full relative overflow-hidden shadow-inner border border-gray-100/10 group-hover/bar:border-emerald-500/40 transition-colors duration-300">
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1) group-hover/bar:shadow-[0_0_30px_rgba(16,185,129,0.9)] group-hover/bar:scale-y-[1.1] origin-bottom" style={{ height: `${Math.max(bar.height, 6)}%`, transitionDelay: `${idx * 15}ms` }} ></div>
                     </div>
                     <span className="text-[8px] font-black text-gray-300 uppercase mt-4 group-hover/bar:text-emerald-500 transition-colors duration-300">{bar.day}</span>
                  </div>
                ))}
             </div>
          </div>
       </div>

       {/* 2. OPERATIONAL HUB GRID */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
             { title: 'Penugasan Staff', icon: <UserCheck size={20} className="text-blue-600" />, count: `${staffOnDuty.length} Bertugas`, data: staffOnDuty, emptyMsg: 'Tidak ada staff', nav: 'op-schedule', btn: 'Atur Jadwal Kerja', accent: 'blue' },
             { title: 'Stok Menipis', icon: <AlertOctagon size={20} className="text-rose-600" />, count: 'Kritis', data: criticalInventory, emptyMsg: 'Aman', nav: 'inv-stocks', btn: 'Pusat Inventaris', accent: 'rose' },
             { title: 'Perawatan Aset', icon: <AlertTriangle size={20} className="text-orange-600" />, count: 'Maintenance', data: criticalMaintenance, emptyMsg: 'Semua Normal', nav: 'op-maintenance', btn: 'Detail Pemeliharaan', accent: 'orange' },
             { title: 'Tugas Operasional', icon: <CheckCircle2 size={20} className="text-emerald-600" />, count: 'Checklist', data: checklistAlerts, emptyMsg: 'Selesai Semua', nav: 'op-checklist', btn: 'Pusat Checklist', accent: 'emerald' },
             { title: 'Tagihan Vendor', icon: <Receipt size={20} className="text-blue-700" />, count: 'Pending', data: billAlerts, emptyMsg: 'Lunas Semua', nav: 'tagihan', btn: 'Pusat Billing', accent: 'indigo' },
             { title: 'Sentimen Publik', icon: <SearchCheck size={20} className="text-indigo-600" />, count: reviewAnalysis?.rating || 'Audit', data: reviewAnalysis ? [1] : [], emptyMsg: 'Tidak ada data', special: true, accent: 'violet' }
          ].map((card, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 p-10 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-xl flex flex-col transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group/card">
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                     <div className="p-2 rounded-xl animate-breath-glow">{card.icon}</div>
                     <h3 className="text-[12px] font-black uppercase tracking-widest group-hover/card:translate-x-1 transition-transform">{card.title}</h3>
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase">{card.count}</span>
               </div>
               <div className="flex-1 space-y-4 overflow-y-auto max-h-[180px] pr-2 custom-scrollbar">
                  {card.special ? (
                     loadingReview ? ( <div className="space-y-4 py-8 animate-pulse"><div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded-2xl"></div><div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-800 rounded-2xl"></div></div> ) : reviewAnalysis ? (
                        <div className="animate-fade-in space-y-5">
                           <div className="flex items-center gap-2"><div className="flex items-center">{[1,2,3,4,5].map(star => (<Star key={star} size={16} className={`${star <= Math.round(reviewAnalysis.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />))}</div><span className="text-base font-black text-gray-900 dark:text-white ml-1">{reviewAnalysis.rating}</span></div>
                           <div className="space-y-3">
                              <div className="flex items-start gap-3 group/rev">
                                 <ThumbsUp size={16} className="text-emerald-500 shrink-0 mt-1" />
                                 <p className="text-[11px] font-bold text-gray-600 dark:text-gray-400 leading-relaxed italic">"{reviewAnalysis.summary}"</p>
                              </div>
                              <div className="flex items-start gap-3 group/rev">
                                 <ThumbsDown size={16} className="text-rose-500 shrink-0 mt-1" />
                                 <p className="text-[11px] font-bold text-gray-600 dark:text-gray-400 leading-relaxed italic">"{reviewAnalysis.improvements}"</p>
                              </div>
                           </div>
                           {reviewSources.length > 0 && (
                             <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-800">
                               <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Sumber Data:</p>
                               <div className="flex flex-wrap gap-2">
                                 {reviewSources.map((source, sIdx) => (
                                   source.web && (
                                     <a key={sIdx} href={source.web.uri} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg text-[8px] font-bold text-blue-600 hover:text-blue-700 truncate max-w-[120px]">
                                       <ExternalLink size={8} /> {source.web.title || 'Link'}
                                     </a>
                                   )
                                 ))}
                               </div>
                             </div>
                           )}
                        </div>
                     ) : <div className="py-12 text-center opacity-30 italic text-[10px] font-black uppercase">{card.emptyMsg}</div>
                  ) : card.data.length === 0 ? (
                     <div className="py-12 text-center opacity-30 italic text-[10px] font-black uppercase tracking-widest">{card.emptyMsg}</div>
                  ) : (
                     card.data.map((item: any, idx: number) => (
                        <div key={idx} className={`p-4 rounded-2xl flex items-center justify-between border border-transparent transition-all duration-300 hover:translate-x-2 ${card.accent === 'rose' ? 'bg-rose-50/40 hover:border-rose-200' : card.accent === 'blue' ? 'bg-blue-50/40 hover:border-blue-200' : card.accent === 'orange' ? 'bg-orange-50/40 hover:border-orange-200' : card.accent === 'emerald' ? 'bg-emerald-50/40 hover:border-emerald-200' : 'bg-gray-50/80 hover:border-gray-300'}`}>
                           <p className="text-xs font-black uppercase text-gray-900 dark:text-white truncate max-w-[140px]">{item.name || item.task || item.deviceName || item.title}</p>
                           <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase ${item.shift ? getShiftBadgeColor(item.shift) : 'text-gray-500 bg-white shadow-sm'}`}>{item.shift || item.quantity || item.nextDueDate?.slice(5) || item.time || safeFormatCurrency(item.amount).slice(3)}</span>
                        </div>
                     ))
                  )}
               </div>
               {!card.special && <button onClick={() => onNavigate(card.nav as PageId)} className="mt-8 w-full py-4 bg-gray-50 dark:bg-gray-800 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 rounded-2xl transition-all duration-300 shadow-sm border border-transparent hover:border-gray-200 hover:-translate-y-1">{card.btn}</button>}
            </div>
          ))}
       </div>

       {/* 3. LOGS & COMMAND CENTRE */}
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-10">
             {todayReservations.length > 0 && (
                <div className="bg-white dark:bg-gray-900 p-10 rounded-[4rem] border-2 border-emerald-500 shadow-2xl relative overflow-hidden group animate-fade-in">
                   <div className="absolute top-0 right-0 p-8 opacity-[0.05] rotate-12"><Ticket size={120} className="text-emerald-600"/></div>
                   <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl text-emerald-600 animate-pulse">
                            <Ticket size={24}/>
                         </div>
                         <h3 className="text-xl font-black uppercase tracking-tighter">Alert Reservasi Hari Ini</h3>
                      </div>
                      <button onClick={() => onNavigate('reservasi')} className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-all">Manajemen Buku</button>
                   </div>
                   <div className="space-y-4">
                      {todayReservations.map(res => (
                         <div key={res.id} className="p-5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-3xl flex items-center justify-between group/res hover:scale-[1.02] transition-all">
                            <div className="flex items-center gap-5">
                               <div className="text-center bg-white dark:bg-gray-800 p-2.5 rounded-2xl shadow-sm border border-emerald-100 min-w-[70px]">
                                  <p className="text-[10px] font-black text-emerald-600 leading-none mb-1 uppercase tracking-widest">{res.time}</p>
                                  <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">WIB</p>
                               </div>
                               <div>
                                  <p className="text-sm font-black uppercase text-gray-900 dark:text-white leading-none mb-1.5">{res.customerName}</p>
                                  <div className="flex items-center gap-3">
                                     <span className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase"><Users size={10}/> {res.guests} Pax</span>
                                     <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 uppercase"><MapPin size={10}/> {res.area}</span>
                                  </div>
                               </div>
                            </div>
                            <div className="text-right">
                               <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${res.dpAmount > 0 ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                  {res.dpAmount > 0 ? 'SUDAH DP' : 'BELUM DP'}
                               </div>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             )}

             <div className="bg-white dark:bg-gray-900 p-12 rounded-[4rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500">
                <div className="flex items-center justify-between mb-10">
                   <div className="flex items-center gap-5">
                      <div className="p-4 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-2xl animate-breath-glow">
                         <History size={28} />
                      </div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter group-hover:text-rose-600 transition-colors">Aktivitas Saya (Kas Lapangan)</h3>
                   </div>
                   <button onClick={() => onNavigate('expense')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline hover:scale-105 transition-all">Lihat Semua</button>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <tbody className="divide-y dark:divide-gray-800">
                         {recentExpenses?.length === 0 ? (
                            <tr><td className="py-24 text-center text-gray-300 font-black uppercase tracking-widest text-[11px] italic opacity-50">Belum ada input pengeluaran hari ini...</td></tr>
                         ) : (
                           recentExpenses?.slice(0, 8).map((exp: any) => (
                               <tr key={exp.id} className="group/row hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 cursor-default">
                                  <td className="py-5 pr-6 group-hover/row:pl-6 transition-all">
                                     <p className="text-xs font-black uppercase text-gray-800 dark:text-gray-200 leading-none mb-2 truncate max-w-[350px] group-hover/row:text-orange-600 transition-colors">{exp.notes || 'Transaksi Kas'}</p>
                                     <div className="flex items-center gap-4">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{exp.category}</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-200"></span>
                                        <span className="text-[9px] font-black text-gray-400 uppercase">{new Date(exp.date).toLocaleDateString('id-ID')}</span>
                                     </div>
                                  </td>
                                  <td className="py-5 text-right group-hover/row:pr-4 transition-all">
                                     <p className="text-lg font-black text-rose-600 tracking-tighter leading-none mb-1.5 group-hover/row:scale-110 transition-transform origin-right">-{safeFormatCurrency(exp.amount)}</p>
                                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{exp.wallet}</p>
                                  </td>
                               </tr>
                            ))
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>

          <div className="lg:col-span-5 bg-white dark:bg-gray-900 p-12 rounded-[4rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500 h-fit">
             <div className="flex items-center justify-between mb-12 px-2">
                <h3 className="text-[12px] font-black uppercase tracking-[0.3em] flex items-center gap-4 group-hover:text-blue-600 transition-colors text-gray-900 dark:text-white">
                   <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl animate-breath-glow text-blue-600">
                      <ListTodo size={26} />
                   </div>
                   Sentra Operasional
                </h3>
                <Activity size={14} className="text-emerald-500 animate-pulse" />
             </div>
             <form onSubmit={onAddTask} className="flex gap-4 mb-10 px-2 group/form">
                <input type="text" value={newTaskText} onChange={e => setNewTaskText(e.target.value)} placeholder="Input instruksi taktis..." className="flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-[1.5rem] px-6 py-4 outline-none font-bold text-xs shadow-inner focus:ring-4 focus:ring-blue-500/10 transition-all group-hover/form:bg-white dark:group-hover/form:bg-gray-700" />
                <button type="submit" className="p-5 bg-blue-600 text-white rounded-2xl shadow-xl hover:scale-110 hover:bg-blue-700 active:scale-95 transition-all"><PlusCircle size={24}/></button>
             </form>
             <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 px-2 custom-scrollbar">
                {currentTasks.length === 0 ? (
                   <div className="py-20 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[2.5rem] opacity-30 italic font-black uppercase tracking-widest text-[11px]">Belum ada memo</div>
                ) : (
                   currentTasks.map(task => (
                      <div key={task.id} className="flex items-center gap-5 p-4.5 bg-gray-50 dark:bg-gray-800 rounded-[1.8rem] group/task border border-transparent hover:border-blue-100 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 hover:shadow-md">
                         <button onClick={() => onToggleTask(task.id)} className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${task.completed ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'border-gray-300 bg-white group-hover/task:border-blue-400 group-hover/task:rotate-12'}`}>{task.completed && <Check size={16} strokeWidth={4}/>}</button>
                         <span className={`text-[11px] font-black uppercase tracking-tight truncate flex-1 ${task.completed ? 'text-gray-300 line-through' : 'text-gray-700 dark:text-gray-200'}`}>{task.text}</span>
                         <button onClick={() => onDeleteTask(task.id)} className="p-1 text-red-300 opacity-0 group-hover/task:opacity-100 hover:text-red-500 transition-all hover:scale-125"><Trash2 size={16}/></button>
                      </div>
                   ))
                )}
             </div>
          </div>
       </div>

       {/* AI OPERATIONAL STRATEGIST */}
       <div className="pt-10 border-t-2 border-dashed dark:border-gray-800 animate-slide-up">
          <div className="bg-white dark:bg-gray-900 rounded-[4.5rem] p-12 lg:p-16 shadow-2xl relative overflow-hidden group border-2 border-gray-100 dark:border-gray-800 transition-all duration-700 hover:shadow-indigo-50/20 hover:border-indigo-200">
             <div className="absolute top-0 right-0 p-12 opacity-5 -rotate-12 group-hover:scale-150 group-hover:rotate-12 transition-all duration-1000"><Cpu size={260} className="text-indigo-600" /></div>
             <div className="relative z-10">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-16">
                   <div className="flex items-center gap-8">
                      <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-[2.5rem] flex items-center justify-center text-indigo-600 shadow-[0_0_25px_rgba(79,70,229,0.2)] animate-pulse group-hover:scale-110 duration-500"><Zap size={44} className="animate-pulse" /></div>
                      <div>
                         <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none mb-3 group-hover:translate-x-2 transition-transform duration-500 group-hover:text-indigo-600">Ahli Strategi Operasional AI</h2>
                         <div className="flex items-center gap-4"><span className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>Neural Audit Aktif</span><span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Deep Analysis: Gemini 3 Pro</span></div>
                      </div>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                   {loadingOpAI ? ( <div className="col-span-full py-24 flex flex-col items-center justify-center space-y-8"><Loader2 size={56} className="animate-spin text-indigo-400" /><p className="text-xs font-black uppercase tracking-[0.6em] text-gray-400 animate-pulse">Menganalisis Efisiensi Lapangan...</p></div> ) : opInsights.length > 0 ? (
                      opInsights.map((insight, idx) => (
                         <div key={idx} className="bg-gray-50/50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 p-10 rounded-[3rem] hover:bg-white dark:hover:bg-gray-800 transition-all duration-500 group/card shadow-sm hover:shadow-[0_25px_60px_rgba(79,70,229,0.15)] hover:-translate-y-3">
                            <div className="flex justify-between items-start mb-8"><div className={`p-4 rounded-2xl animate-pulse ${insight.type === 'danger' ? 'bg-rose-500/10 text-rose-500' : insight.type === 'warning' ? 'bg-amber-500/10 text-amber-500' : insight.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-indigo-500/10 text-indigo-500'}`}>{insight.type === 'danger' ? <AlertOctagon size={24}/> : <Lightbulb size={24}/>}</div><span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${insight.type === 'danger' ? 'border-rose-500/30 text-rose-500' : insight.type === 'warning' ? 'border-amber-500/30 text-amber-500' : insight.type === 'border-emerald-500/30 text-emerald-600'}`}>Prioritas: {insight.type.toUpperCase()}</span></div>
                            <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4 group-hover/card:text-indigo-600 transition-colors leading-tight">{insight.title}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed italic mb-10 border-l-2 border-gray-200 pl-4 group-hover/card:border-indigo-500 duration-500">"{insight.description}"</p>
                            <button className="w-full py-4 bg-gray-100 dark:bg-gray-800 hover:bg-indigo-600 dark:hover:bg-indigo-700 hover:text-white text-gray-600 dark:text-gray-300 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm group-hover/card:shadow-lg group-hover/card:-translate-y-1">{insight.actionLabel}</button>
                         </div>
                      ))
                   ) : ( <div className="col-span-full py-24 text-center"><MessageSquareQuote size={60} className="mx-auto text-gray-200 mb-6" /><p className="text-xs font-black uppercase tracking-[0.4em] text-gray-400">Menunggu Input Data Baru...</p></div> )}
                </div>
             </div>
          </div>
       </div>
       <div className="no-print opacity-0 h-0 w-0 overflow-hidden">
         {viewMode}
       </div>
    </div>
  );
};

export default SupervisorDashboard;
