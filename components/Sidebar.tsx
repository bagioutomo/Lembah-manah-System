
import React, { useMemo } from 'react';
import { 
  LayoutDashboard, PlusCircle, Database, PieChart, ClipboardList, 
  Archive, Users, Library, Ticket, ListChecks, Settings, 
  ChevronDown, ChevronUp, Coffee, UserCheck, ChevronRight,
  Sun, Moon, CalendarDays, Filter, FlaskConical, Scale,
  Box, ShoppingBasket, History, FileSignature, BarChart3,
  Tag, Truck, LayoutGrid, FileSpreadsheet, Bell, BookOpen,
  TrendingUp
} from 'lucide-react';
import { PageId, UserRole, BusinessInfo } from '../types';

interface SidebarProps {
  userRole: UserRole;
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  businessInfo: BusinessInfo;
  theme: string;
  setTheme: (theme: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  setShowUserModal: (show: boolean) => void;
  expandedMenus: Record<string, boolean>;
  toggleMenu: (menu: string) => void;
  viewMode: 'BULANAN' | 'TAHUNAN';
  setViewMode: (mode: 'BULANAN' | 'TAHUNAN') => void;
  globalMonth: number;
  setGlobalMonth: (m: number) => void;
  globalYear: number;
  setGlobalYear: (y: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  userRole, currentPage, setCurrentPage, businessInfo, theme, setTheme,
  isSidebarOpen, setIsSidebarOpen, setShowUserModal, expandedMenus, toggleMenu,
  viewMode, setViewMode, globalMonth, setGlobalMonth, globalYear, setGlobalYear
}) => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const isPurchasing = userRole === 'PURCHASING';
  const isSupervisor = userRole === 'SUPERVISOR';
  const isAdmin = userRole === 'ADMIN';
  const isOwner = userRole === 'OWNER';
  const isManager = userRole === 'MANAGER';

  const pendingTaskCount = useMemo(() => {
    try {
      const storageKey = `jobdesk-v7-${globalYear}-${globalMonth + 1}`;
      const saved = localStorage.getItem(storageKey);
      if (!saved) return 0;
      const tasks = JSON.parse(saved);
      return tasks.filter((t: any) => !t.completed && (t.pic === userRole || userRole === 'OWNER')).length;
    } catch (e) { return 0; }
  }, [userRole, globalMonth, globalYear]);

  const navClass = (id: PageId) => `w-full flex items-center px-4 py-3 text-left rounded-xl font-bold transition-all duration-300 text-[13px] tracking-tight cursor-pointer group ${currentPage === id ? 'bg-green-700 text-white shadow-lg shadow-green-900/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'} hover:translate-x-1`;
  const submenuClass = (id: PageId, activeCond: boolean = false) => `w-full flex items-center px-3 py-2.5 text-left rounded-lg text-[12px] font-semibold transition-all duration-300 cursor-pointer group ${(currentPage === id && activeCond) ? 'bg-green-50 dark:bg-green-900/30 text-green-700 border-l-4 border-green-700' : 'text-gray-400 dark:text-gray-500 hover:text-green-600'} hover:pl-4`;

  return (
    <>
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
      
      <aside className={`fixed lg:relative inset-y-0 left-0 w-72 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 z-50 transform transition-transform duration-300 ease-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b dark:border-gray-800">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shrink-0 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {businessInfo.sidebarLogoUrl ? (
                   <img src={businessInfo.sidebarLogoUrl} className="w-full h-full object-cover" alt="L" />
                ) : (
                   <div className="w-full h-full bg-green-700 flex items-center justify-center text-white"><Coffee size={20}/></div>
                )}
              </div>
              <h2 className="text-[12px] font-bold uppercase truncate leading-tight tracking-tight text-gray-900 dark:text-white">{businessInfo.name}</h2>
           </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
           <div className="mb-6">
              <button onClick={() => toggleMenu('period')} className="w-full flex items-center justify-between px-4 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all">
                <div className="flex items-center gap-3"><CalendarDays size={18} className="text-green-700"/> <span className="text-[11px] font-semibold uppercase tracking-wider">Filter Periode</span></div>
                {expandedMenus.period ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
              </button>
              {expandedMenus.period && (
                <div className="mt-2 bg-gray-50 dark:bg-gray-800/40 rounded-xl p-3 border border-gray-100 dark:border-gray-700 space-y-3 animate-fade-in">
                  <div className="flex p-0.5 bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700 shadow-sm">
                      <button onClick={() => setViewMode('BULANAN')} className={`flex-1 py-1.5 rounded-md text-[9px] font-bold uppercase transition-all ${viewMode === 'BULANAN' ? 'bg-green-700 text-white shadow-sm' : 'text-gray-400'}`}>Bulan</button>
                      <button onClick={() => setViewMode('TAHUNAN')} className={`flex-1 py-1.5 rounded-md text-[9px] font-bold uppercase transition-all ${viewMode === 'TAHUNAN' ? 'bg-green-700 text-white shadow-sm' : 'text-gray-400'}`}>Tahun</button>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                      {viewMode === 'BULANAN' && (
                        <select value={globalMonth} onChange={(e) => setGlobalMonth(parseInt(e.target.value))} className="w-full bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg px-2 py-2 text-[10px] font-bold uppercase outline-none focus:border-green-600">
                          {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                        </select>
                      )}
                      <select value={globalYear} onChange={(e) => setGlobalYear(parseInt(e.target.value))} className="w-full bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg px-2 py-2 text-[10px] font-bold uppercase outline-none focus:border-green-600">
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                  </div>
                </div>
              )}
           </div>

           <button onClick={() => { setCurrentPage('dashboard'); setIsSidebarOpen(false); }} className={navClass('dashboard')}><LayoutDashboard size={18} className="mr-3"/> Dashboard</button>

           <div className="pt-4 pb-1 px-4"><span className="text-[10px] font-semibold text-gray-300 dark:text-gray-600 uppercase tracking-widest">Navigasi Utama</span></div>

           {(!isManager && !isSupervisor) && (
             <div className="w-full">
                <button onClick={() => toggleMenu('input')} className="w-full flex items-center justify-between px-4 py-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all">
                   <div className="flex items-center gap-3"><PlusCircle size={18} className="text-green-600"/> <span className="text-[13px] font-bold">Input Data</span></div>
                   {expandedMenus.input ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                </button>
                {expandedMenus.input && (
                  <div className="mt-1 ml-4 space-y-0.5">
                     {!isPurchasing && <button onClick={() => { setCurrentPage('penjualan'); setIsSidebarOpen(false); }} className={submenuClass('penjualan', true)}>Pemasukan</button>}
                     <button onClick={() => { setCurrentPage('pengeluaran'); setIsSidebarOpen(false); }} className={submenuClass('pengeluaran', true)}>Pengeluaran</button>
                     <button onClick={() => { setCurrentPage('tagihan-baru'); setIsSidebarOpen(false); }} className={submenuClass('tagihan-baru', true)}>Tagihan Baru</button>
                  </div>
                )}
             </div>
           )}

           {(!isManager) && (
              <div className="w-full">
                <button onClick={() => toggleMenu('database')} className="w-full flex items-center justify-between px-4 py-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all">
                   <div className="flex items-center gap-3"><Database size={18} className="text-indigo-600"/> <span className="text-[13px] font-bold">Basis Data</span></div>
                   {expandedMenus.database ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                </button>
                {expandedMenus.database && (
                  <div className="mt-1 ml-4 space-y-0.5">
                     {(isOwner || isAdmin) && <button onClick={() => { setCurrentPage('income'); setIsSidebarOpen(false); }} className={submenuClass('income', true)}>Data Pemasukan</button>}
                     <button onClick={() => { setCurrentPage('expense'); setIsSidebarOpen(false); }} className={submenuClass('expense', true)}>Data Pengeluaran</button>
                     <button onClick={() => { setCurrentPage('expense-category'); setIsSidebarOpen(false); }} className={submenuClass('expense-category', true)}>Monitor per Kategori</button>
                     <button onClick={() => { setCurrentPage('tagihan'); setIsSidebarOpen(false); }} className={submenuClass('tagihan', true)}>Tagihan Aktif</button>
                     <button onClick={() => { setCurrentPage('data-center'); setIsSidebarOpen(false); }} className={submenuClass('data-center', true)}>Pusat Data & Export</button>
                     {(isOwner || isAdmin) && <button onClick={() => { setCurrentPage('kategori'); setIsSidebarOpen(false); }} className={submenuClass('kategori', true)}>Master Kategori & Suplier</button>}
                     {(isOwner || isAdmin) && <button onClick={() => { setCurrentPage('adj-finance'); setIsSidebarOpen(false); }} className={submenuClass('adj-finance', true)}>Manajemen Dompet</button>}
                     <button onClick={() => { setCurrentPage('price-alerts'); setIsSidebarOpen(false); }} className={submenuClass('price-alerts', true)}>Kenaikan Harga</button>
                  </div>
                )}
              </div>
           )}

           {(!isPurchasing && !isSupervisor) && (
              <div className="w-full">
                <button onClick={() => toggleMenu('laporan')} className="w-full flex items-center justify-between px-4 py-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all">
                   <div className="flex items-center gap-3"><PieChart size={18} className="text-emerald-600"/> <span className="text-[13px] font-bold">Laporan Keuangan</span></div>
                   {expandedMenus.laporan ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                </button>
                {expandedMenus.laporan && (
                  <div className="mt-1 ml-4 space-y-0.5">
                     <button onClick={() => { setCurrentPage('laba-rugi'); setIsSidebarOpen(false); }} className={submenuClass('laba-rugi', true)}>Laba Rugi</button>
                     <button onClick={() => { setCurrentPage('alokasi'); setIsSidebarOpen(false); }} className={submenuClass('alokasi', true)}>Alokasi Dana</button>
                     <button onClick={() => { setCurrentPage('generate'); setIsSidebarOpen(false); }} className={submenuClass('generate', true)}>Buat JPG Laporan</button>
                  </div>
                )}
              </div>
           )}

           {(!isPurchasing) && (
              <div className="w-full">
                <button onClick={() => toggleMenu('operasional')} className="w-full flex items-center justify-between px-4 py-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all">
                   <div className="flex items-center gap-3"><ClipboardList size={18} className="text-orange-500"/> <span className="text-[13px] font-bold">Operasional</span></div>
                   {expandedMenus.operasional ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                </button>
                {expandedMenus.operasional && (
                  <div className="mt-1 ml-4 space-y-0.5">
                     <button onClick={() => { setCurrentPage('op-schedule'); setIsSidebarOpen(false); }} className={submenuClass('op-schedule', true)}>Jadwal Shift Tim</button>
                     <button onClick={() => { setCurrentPage('op-checklist'); setIsSidebarOpen(false); }} className={submenuClass('op-checklist', true)}>Ceklist Harian</button>
                     <button onClick={() => { setCurrentPage('op-maintenance'); setIsSidebarOpen(false); }} className={submenuClass('op-maintenance', true)}>Perbaikan Alat</button>
                  </div>
                )}
              </div>
           )}

           {(isOwner || isAdmin || isSupervisor) && (
              <div className="w-full">
                <button onClick={() => toggleMenu('hrd')} className="w-full flex items-center justify-between px-4 py-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all">
                   <div className="flex items-center gap-3"><Users size={18} className="text-violet-600"/> <span className="text-[13px] font-bold">Sdm dan Hrd</span></div>
                   {expandedMenus.hrd ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                </button>
                {expandedMenus.hrd && (
                  <div className="mt-1 ml-4 space-y-0.5">
                     <button onClick={() => { setCurrentPage('hrd-contracts'); setIsSidebarOpen(false); }} className={submenuClass('hrd-contracts', true)}>Kontrak Kerja</button>
                     <button onClick={() => { setCurrentPage('hrd-employees'); setIsSidebarOpen(false); }} className={submenuClass('hrd-employees', true)}>Database Staff</button>
                     <button onClick={() => { setCurrentPage('hrd-leaves'); setIsSidebarOpen(false); }} className={submenuClass('hrd-leaves', true)}>Izin & Cuti</button>
                     <button onClick={() => { setCurrentPage('hrd-payroll'); setIsSidebarOpen(false); }} className={submenuClass('hrd-payroll', true)}>Sistem Penggajian</button>
                     <button onClick={() => { setCurrentPage('hrd-slips'); setIsSidebarOpen(false); }} className={submenuClass('hrd-slips', true)}>Slip Gaji Resmi</button>
                  </div>
                )}
              </div>
           )}

           <div className="w-full">
              <button onClick={() => toggleMenu('inventaris')} className="w-full flex items-center justify-between px-4 py-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all">
                 <div className="flex items-center gap-3"><Archive size={18} className="text-blue-500"/> <span className="text-[13px] font-bold">Inventaris dan Stok</span></div>
                 {expandedMenus.inventaris ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
              </button>
              {expandedMenus.inventaris && (
                <div className="mt-1 ml-4 space-y-0.5">
                   <button onClick={() => { setCurrentPage('inv-stocks'); setIsSidebarOpen(false); }} className={submenuClass('inv-stocks', currentPage === 'inv-stocks')}>Stok Bahan Baku</button>
                   <button onClick={() => { setCurrentPage('inv-assets'); setIsSidebarOpen(false); }} className={submenuClass('inv-assets', currentPage === 'inv-assets')}>Inventaris & Peralatan</button>
                </div>
              )}
           </div>

           {(!isPurchasing) && (
              <div className="w-full">
                <button onClick={() => toggleMenu('hpp')} className="w-full flex items-center justify-between px-4 py-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all">
                   <div className="flex items-center gap-3"><Library size={18} className="text-amber-600"/> <span className="text-[13px] font-bold">Produksi & HPP</span></div>
                   {expandedMenus.hpp ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                </button>
                {expandedMenus.hpp && (
                  <div className="mt-1 ml-4 space-y-0.5">
                     <button onClick={() => { setCurrentPage('hpp-summary'); setIsSidebarOpen(false); }} className={submenuClass('hpp-summary', true)}>HPP Overview</button>
                     <button onClick={() => { setCurrentPage('articles'); setIsSidebarOpen(false); }} className={submenuClass('articles', true)}>Katalog Bahan</button>
                     <button onClick={() => { setCurrentPage('hpp-processed-materials'); setIsSidebarOpen(false); }} className={submenuClass('hpp-processed-materials', true)}>Bahan Olahan</button>
                     <button onClick={() => { setCurrentPage('hpp-process'); setIsSidebarOpen(false); }} className={submenuClass('hpp-process', true)}>Worksheet HPP</button>
                     <button onClick={() => { setCurrentPage('hpp-cookbook'); setIsSidebarOpen(false); }} className={submenuClass('hpp-cookbook', true)}>Buku Resep (Cook Book)</button>
                  </div>
                )}
              </div>
           )}

           {(isOwner || isAdmin || isSupervisor) && (
              <button onClick={() => { setCurrentPage('reservasi'); setIsSidebarOpen(false); }} className={navClass('reservasi')}>
                <Ticket size={18} className="mr-3 text-rose-500"/> Reservasi Tamu
              </button>
           )}

           <button onClick={() => { setCurrentPage('jobdesk-checklist'); setIsSidebarOpen(false); }} className={navClass('jobdesk-checklist')}>
              <div className="flex items-center flex-1">
                 <ListChecks size={18} className={`mr-3 ${pendingTaskCount > 0 ? 'text-orange-600 animate-pulse' : 'text-indigo-600'}`}/> Agenda Tugas
              </div>
              {pendingTaskCount > 0 && (
                 <span className="ml-2 bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-orange-500/30 animate-bounce">
                    {pendingTaskCount}
                 </span>
              )}
           </button>

           <button onClick={() => { setCurrentPage('data-analisis'); setIsSidebarOpen(false); }} className={navClass('data-analisis')}>
              <BarChart3 size={18} className="mr-3 text-emerald-500"/> Data Analisis
           </button>

           {isOwner && (
             <div className="pt-6 mt-8 border-t dark:border-gray-800">
               <button onClick={() => { setCurrentPage('settings'); setIsSidebarOpen(false); }} className={navClass('settings')}>
                 <Settings size={18} className="mr-3 text-gray-400 group-hover:rotate-90 transition-transform duration-500"/> Pengaturan Sistem
               </button>
             </div>
           )}
        </nav>

        <div className="p-4 border-t dark:border-gray-800 bg-gray-50/50 dark:bg-black/20 space-y-2">
           <button 
             onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
             className="w-full flex items-center justify-between p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 hover:shadow-sm transition-all"
           >
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    {theme === 'dark' ? <Sun size={14}/> : <Sun size={14}/>}
                 </div>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Mode {theme === 'dark' ? 'Terang' : 'Gelap'}</span>
              </div>
           </button>

           <button onClick={() => { setShowUserModal(true); }} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-700 group-hover:scale-110 transition-transform"><UserCheck size={18}/></div>
              <div className="text-left overflow-hidden">
                <p className="text-[11px] font-bold uppercase truncate leading-tight group-hover:text-green-700 transition-colors text-gray-900 dark:text-white">{userRole}</p>
                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-tight">Ganti Peran</p>
              </div>
              <ChevronRight size={14} className="ml-auto text-gray-300 group-hover:text-green-700 group-hover:translate-x-1 transition-all" />
           </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
