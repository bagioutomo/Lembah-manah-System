
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
  Menu, Coffee, Sparkles, ChevronDown, Database, 
  Globe, Flame, FileSpreadsheet, ShieldCheck,
  Bell, Package, Wrench, Clock, Receipt, CheckCircle2, Volume2,
  TrendingUp, Ticket, Trash2
} from 'lucide-react';
import { UserRole, BusinessInfo, DashboardTask, InventoryItem, MaintenanceTask, BillRecord, Reservation, Article, ExpenseRecord, PageId } from '../types';
import { SyncStatus } from '../hooks/useAppState';

interface HeaderProps {
  setIsSidebarOpen: (open: boolean) => void;
  userRole: UserRole;
  businessInfo: BusinessInfo;
  setShowUserModal: (show: boolean) => void;
  setCurrentPage: (page: PageId) => void;
  syncStatus: {
    supabase: SyncStatus;
    google: SyncStatus;
    mysql: SyncStatus;
    firebase: SyncStatus;
    gemini: SyncStatus;
    excel: SyncStatus;
  };
  tasks?: DashboardTask[];
  inventoryItems?: InventoryItem[];
  maintenance?: MaintenanceTask[];
  bills?: BillRecord[];
  reservations?: Reservation[];
  articles?: Article[];
  expenses?: ExpenseRecord[];
}

const Header: React.FC<HeaderProps> = ({ 
  setIsSidebarOpen, userRole, businessInfo, setShowUserModal, setCurrentPage, syncStatus,
  tasks = [], inventoryItems = [], maintenance = [], bills = [], reservations = [], articles = [], expenses = []
}) => {
  const [showNotif, setShowNotif] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // LOGIKA AUDIT NOTIFIKASI 6-PILAR
  const allAlerts = useMemo(() => {
    const list = [];
    const today = new Date().toISOString().split('T')[0];

    // 1. Alert Tugas
    const pendingTasks = tasks.filter(t => !t.completed && (userRole === 'OWNER' || t.pic === userRole));
    if (pendingTasks.length > 0) {
      list.push({ id: 'task', title: `${pendingTasks.length} Agenda Pending`, desc: 'Klik untuk cek agenda tugas.', color: 'text-blue-500', bg: 'bg-blue-50', icon: <Clock size={14}/>, target: 'jobdesk-checklist' as PageId });
    }

    // 2. Alert Stok Kritis
    const lowStock = inventoryItems.filter(i => i.type === 'RAW_MATERIAL' && i.quantity <= 5);
    if (lowStock.length > 0) {
      list.push({ id: 'stock', title: `${lowStock.length} Bahan Menipis`, desc: 'Klik untuk cek gudang stok.', color: 'text-rose-500', bg: 'bg-rose-50', icon: <Package size={14}/>, target: 'inv-stocks' as PageId });
    }

    // 3. Alert Kenaikan Harga
    const rawExp = expenses.filter(e => e.category.includes('Bahan Baku'));
    const inflationCount = articles.filter(art => {
      const related = rawExp.filter(e => (e.notes || '').toUpperCase().includes(art.name.toUpperCase())).sort((a,b) => b.date.localeCompare(a.date))[0];
      return related && (related.amount / (related.qty || 1)) > (art.purchasePrice * 1.05);
    }).length;
    if (inflationCount > 0) {
      list.push({ id: 'price', title: `${inflationCount} Harga Naik`, desc: 'Klik untuk audit kenaikan harga.', color: 'text-amber-600', bg: 'bg-amber-50', icon: <TrendingUp size={14}/>, target: 'price-alerts' as PageId });
    }

    // 4. Alert Maintenance
    const overdueMaint = maintenance.filter(m => new Date(m.nextDueDate) < new Date());
    if (overdueMaint.length > 0) {
      list.push({ id: 'maint', title: `${overdueMaint.length} Aset Butuh Servis`, desc: 'Klik untuk jadwal servis alat.', color: 'text-orange-500', bg: 'bg-orange-50', icon: <Wrench size={14}/>, target: 'op-maintenance' as PageId });
    }

    // 5. Alert Tagihan
    const unpaidBills = bills.filter(b => b.status === 'UNPAID' && new Date(b.dueDate) < new Date());
    if (unpaidBills.length > 0) {
      list.push({ id: 'bill', title: `Tagihan Jatuh Tempo`, desc: 'Klik untuk monitor tagihan aktif.', color: 'text-rose-600', bg: 'bg-red-50', icon: <Receipt size={14}/>, target: 'tagihan' as PageId });
    }

    // 6. Alert Reservasi
    const todayRes = reservations.filter(r => r.date === today && r.status === 'CONFIRMED');
    if (todayRes.length > 0) {
      list.push({ id: 'res', title: `${todayRes.length} Tamu Hari Ini`, desc: 'Klik untuk lihat detail pesanan tamu.', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <Ticket size={14}/>, target: 'reservasi' as PageId });
    }

    return list;
  }, [tasks, inventoryItems, maintenance, bills, reservations, articles, expenses, userRole]);

  // Filter alert yang belum di-dismiss/diklik
  const activeAlerts = useMemo(() => {
    return allAlerts.filter(alert => !dismissedAlerts.includes(alert.id));
  }, [allAlerts, dismissedAlerts]);

  // ALARM AUDIO LOOPING
  useEffect(() => {
    if (activeAlerts.length > 0 && !showNotif) {
      if (!audioRef.current) {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch(() => {});
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [activeAlerts.length, showNotif]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAlertClick = (id: string, target: PageId) => {
    setDismissedAlerts(prev => [...prev, id]);
    setCurrentPage(target);
    setShowNotif(false);
    setIsSidebarOpen(false);
  };

  const handleClearAll = () => {
    setDismissedAlerts(allAlerts.map(a => a.id));
    setShowNotif(false);
  };

  const authorizedName = useMemo(() => {
    switch (userRole) {
      case 'OWNER': return businessInfo.ownerName || 'Executive Owner';
      case 'ADMIN': return businessInfo.adminName || 'Admin Finance';
      case 'PURCHASING': return businessInfo.purchasingName || 'Purchasing Officer';
      case 'SUPERVISOR': return businessInfo.supervisorName || 'Field Supervisor';
      case 'MANAGER': return businessInfo.managerName || 'General Manager';
      default: return userRole;
    }
  }, [userRole, businessInfo]);

  const getStatusStyle = (status: SyncStatus) => {
    if (status === 'SYNCING') return 'text-blue-500 border-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.3)]';
    if (status === 'SUCCESS') return 'text-emerald-500 border-emerald-500/30';
    if (status === 'ERROR') return 'text-rose-500 border-rose-500 animate-bounce';
    return 'text-gray-300 border-transparent opacity-40';
  };

  const cloudNodes = [
    { id: 'Supa', icon: <Database size={14}/>, status: syncStatus.supabase, tooltip: 'Supabase' },
    { id: 'Fire', icon: <Flame size={14}/>, status: syncStatus.firebase, tooltip: 'Firebase' },
    { id: 'C1', icon: <FileSpreadsheet size={14}/>, status: syncStatus.google, tooltip: 'Sheets' },
    { id: 'Sql', icon: <Globe size={14}/>, status: syncStatus.mysql, tooltip: 'MySQL' },
    { id: 'Ai', icon: <Sparkles size={14}/>, status: syncStatus.gemini, tooltip: 'AI' }
  ];

  return (
    <header className="h-20 bg-white dark:bg-gray-950 border-b dark:border-gray-800 flex items-center px-4 sm:px-8 gap-6 z-30 shrink-0">
       <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2.5 -ml-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all">
         <Menu size={24}/>
       </button>
       
       <div className="flex items-center gap-4 shrink-0 border-r dark:border-gray-800 pr-6 h-10">
          <div className="w-10 h-10 rounded-[1.1rem] bg-gray-950 flex items-center justify-center shrink-0 shadow-xl overflow-hidden ring-4 ring-gray-50 dark:ring-gray-900">
             {businessInfo.sidebarLogoUrl ? (
                <img src={businessInfo.sidebarLogoUrl} className="w-full h-full object-contain p-1" alt="L" />
             ) : (
                <div className="w-full h-full bg-green-700 flex items-center justify-center text-white"><Coffee size={20}/></div>
             )}
          </div>
          <div className="hidden sm:flex flex-col">
             <span className="font-black uppercase text-[11px] tracking-tight text-gray-900 dark:text-white leading-none">{businessInfo.name}</span>
             <span className="text-[7px] font-black text-emerald-600 uppercase tracking-[0.4em] mt-1.5">Neural Hub Active</span>
          </div>
       </div>

       {/* CLOUD MONITOR */}
       <div className="hidden md:flex items-center gap-2.5 flex-1 overflow-x-auto no-scrollbar py-2">
          {cloudNodes.map((node, idx) => (
             <div 
               key={idx} 
               title={node.tooltip}
               className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-500 bg-gray-50/50 dark:bg-gray-900/50 group cursor-help ${getStatusStyle(node.status)}`}
             >
                {node.icon}
             </div>
          ))}
          <div className="h-6 w-px bg-gray-100 dark:bg-gray-800 mx-2"></div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl border border-emerald-100 dark:border-emerald-800 shadow-sm">
             <ShieldCheck size={14} className="animate-pulse" />
             <span className="text-[8px] font-black uppercase tracking-widest hidden xl:inline">Security Verified</span>
          </div>
       </div>

       {/* NOTIFIKASI & WELCOME & PROFILE */}
       <div className="ml-auto flex items-center gap-2 sm:gap-6">
          
          {/* NOTIFICATION HUB */}
          <div className="relative" ref={notifRef}>
             <button 
               onClick={() => setShowNotif(!showNotif)}
               className={`p-3.5 rounded-full transition-all relative hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-90 ${activeAlerts.length > 0 ? 'text-rose-600' : 'text-gray-400'}`}
             >
                <Bell size={24} className={activeAlerts.length > 0 ? 'animate-denyut' : ''} />
                {activeAlerts.length > 0 && (
                   <span className="absolute top-2 right-2 w-5 h-5 bg-rose-600 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-gray-950 animate-bounce shadow-lg">
                      {activeAlerts.length}
                   </span>
                )}
             </button>

             {/* DROPDOWN NOTIF */}
             {showNotif && (
                <div className="absolute right-0 mt-4 w-72 sm:w-85 bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-gray-800 overflow-hidden animate-slide-up py-5 px-5 space-y-4 z-50">
                   <div className="flex items-center justify-between px-3 pb-3 border-b dark:border-gray-800">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pusat Alert Operasional</h4>
                      {activeAlerts.length > 0 ? (
                        <button onClick={handleClearAll} className="text-[9px] font-black text-rose-500 uppercase flex items-center gap-1.5 hover:underline transition-all"><Trash2 size={12}/> Bersihkan</button>
                      ) : (
                        <span className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-1.5"><CheckCircle2 size={12}/> Normal</span>
                      )}
                   </div>
                   
                   <div className="space-y-2.5 max-h-[400px] overflow-y-auto no-scrollbar">
                      {activeAlerts.length === 0 ? (
                         <div className="py-12 text-center flex flex-col items-center gap-4">
                            <CheckCircle2 size={40} className="text-emerald-500 opacity-20" />
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Tidak Ada Pesan Baru</p>
                         </div>
                      ) : (
                         activeAlerts.map((alert) => (
                            <button 
                              key={alert.id} 
                              onClick={() => handleAlertClick(alert.id, alert.target)}
                              className={`w-full p-4 rounded-3xl flex items-start gap-4 transition-all hover:scale-[1.02] border border-transparent hover:border-gray-100 dark:hover:border-gray-800 text-left ${alert.bg} dark:bg-opacity-5`}
                            >
                               <div className={`p-2.5 rounded-2xl shadow-sm ${alert.color} bg-white dark:bg-gray-800`}>{alert.icon}</div>
                               <div className="flex-1 min-w-0">
                                  <p className={`text-[11px] font-black uppercase tracking-tight truncate leading-none mb-1.5 ${alert.color}`}>{alert.title}</p>
                                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 leading-tight">{alert.desc}</p>
                               </div>
                            </button>
                         ))
                      )}
                   </div>
                   
                   <div className="pt-3 border-t dark:border-gray-800 text-center">
                      <p className="text-[7px] font-bold text-gray-400 uppercase tracking-[0.3em] italic">Neural Operational Sync v2.5</p>
                   </div>
                </div>
             )}
          </div>

          <div className="hidden md:flex flex-col items-end leading-none">
             <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Selamat Datang,</span>
             <span className="text-[14px] font-black text-gray-900 dark:text-white uppercase tracking-tighter truncate max-w-[140px]">{authorizedName}</span>
          </div>

          <button 
            onClick={() => setShowUserModal(true)} 
            className="flex items-center gap-2.5 pl-1 pr-1 sm:pr-4 py-1 rounded-[1.5rem] bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-emerald-500 hover:bg-white transition-all active:scale-95 group shrink-0 shadow-sm"
          >
            <div className="w-10 h-10 rounded-[1.1rem] bg-gray-900 text-white shadow-xl group-hover:bg-emerald-600 transition-all flex items-center justify-center overflow-hidden border-2 border-white dark:border-gray-800">
               <span className="text-sm font-black uppercase">{userRole.charAt(0)}</span>
            </div>
            <div className="pr-1 hidden xs:block">
               <ChevronDown size={14} className="text-gray-300 group-hover:text-emerald-500 transition-transform" />
            </div>
          </button>
       </div>
       
       <style>{`
         @keyframes denyut-kencang {
           0% { transform: scale(1); }
           50% { transform: scale(1.2); filter: drop-shadow(0 0 10px rgba(225, 29, 72, 0.6)); }
           100% { transform: scale(1); }
         }
         .animate-denyut {
           animation: denyut-kencang 0.5s infinite cubic-bezier(0.4, 0, 0.6, 1);
         }
       `}</style>
    </header>
  );
};

export default Header;
