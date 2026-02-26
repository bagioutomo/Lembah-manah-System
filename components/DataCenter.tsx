
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Download, Database, Loader2, TrendingUp, ShoppingBag, Receipt, Ticket, 
  Box, Users, Tag, Search, Calendar, BadgeDollarSign, RefreshCw, 
  Calculator, Sigma, User, Wallet, Filter, X, ShieldCheck, Zap
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  IncomeRecord, ExpenseRecord, Employee, InventoryItem, 
  Article, Recipe, Reservation, BusinessInfo, UserRole, BillRecord, InventoryLog
} from '../types';
import { storage } from '../services/storageService';
import { SyncStatus } from '../hooks/useAppState';

// Import Sub-Modul
import DataCenterIncome from './DataCenterIncome';
import DataCenterExpense from './DataCenterExpense';
import DataCenterPayroll from './DataCenterPayroll';
import DataCenterHpp from './DataCenterHpp';
import DataCenterLogs from './DataCenterLogs';
import DataCenterInventory from './DataCenterInventory';
import DataCenterCatalog from './DataCenterCatalog';
import DataCenterBills from './DataCenterBills';
import DataCenterReservations from './DataCenterReservations';
import DataCenterStaff from './DataCenterStaff';

interface Props {
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
  employees: Employee[];
  inventoryItems: InventoryItem[];
  inventoryLogs: InventoryLog[];
  articles: Article[];
  recipes: Recipe[];
  reservations: Reservation[];
  bills: BillRecord[];
  wallets: string[];
  userRole: UserRole;
  businessInfo: BusinessInfo;
  allData: any;
  globalMonth: number;
  globalYear: number;
  viewMode: 'BULANAN' | 'TAHUNAN';
  syncStatus: any;
}

const DataCenter: React.FC<Props> = (props) => {
  const { globalMonth, globalYear, viewMode, inventoryLogs, articles, recipes, bills, reservations, employees, expenses, incomes, inventoryItems, wallets, allData } = props;
  const [activeDataTab, setActiveDataTab] = useState<'INCOME' | 'EXPENSE' | 'BILLS' | 'RESERVATION' | 'INVENTORY' | 'LOGS' | 'STAFF' | 'ARTICLES' | 'GAJI' | 'HPP'>('INCOME');
  const [isExporting, setIsExporting] = useState(false);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPIC, setSelectedPIC] = useState('ALL');
  const [selectedWallet, setSelectedWallet] = useState('ALL');

  const resetFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setSelectedCategory('ALL');
    setSelectedPIC('ALL');
    setSelectedWallet('ALL');
  };

  // LOGIKA KRITIS: OTOMATIS EXPORT SAAT HALAMAN DIBUKA
  useEffect(() => {
    const triggerAutoCloudBackup = async () => {
      setIsAutoSyncing(true);
      try {
        // Bapak, sistem secara cerdas mendorong data ke Google Sheet (Cermin 1) 
        // dan Snapshot JSON (Cermin 2) segera setelah menu ini diklik.
        await Promise.all([
          storage.syncToGoogleSheet(allData),
          storage.syncToGoogleDriveJson(allData)
        ]);
      } catch (e) {
        console.error("Auto Sync Failed", e);
      } finally {
        // Berikan sedikit delay agar transisi visual halus
        setTimeout(() => setIsAutoSyncing(false), 2000);
      }
    };
    triggerAutoCloudBackup();
  }, []); 

  const formatCurrency = (v: number) => 'Rp ' + Math.floor(v).toLocaleString('id-ID');

  const uniquePICs = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach(e => { if (e.createdBy) set.add(e.createdBy); });
    return Array.from(set).sort();
  }, [expenses]);

  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach(e => { if (e.category) set.add(e.category); });
    return Array.from(set).sort();
  }, [expenses]);

  const applyFilters = (list: any[], tabType: string) => {
    const s = searchTerm.toLowerCase();
    return (list || []).filter(item => {
      const matchSearch = JSON.stringify(item).toLowerCase().includes(s);
      let matchPeriod = true;
      const dateStr = item.date || item.timestamp || item.lastUpdated;
      if (dateStr) {
        const d = new Date(dateStr);
        if (startDate || endDate) {
          if (startDate) matchPeriod = matchPeriod && (dateStr.split('T')[0]) >= startDate;
          if (endDate) matchPeriod = matchPeriod && (dateStr.split('T')[0]) <= endDate;
        } else {
           if (viewMode === 'TAHUNAN') matchPeriod = d.getFullYear() === globalYear;
           else matchPeriod = d.getMonth() === globalMonth && d.getFullYear() === globalYear;
        }
      }
      if (tabType === 'EXPENSE') {
        const matchPIC = selectedPIC === 'ALL' || item.createdBy === selectedPIC;
        const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
        const matchWal = selectedWallet === 'ALL' || item.wallet === selectedWallet;
        return matchSearch && matchPeriod && matchPIC && matchCat && matchWal;
      }
      return matchSearch && matchPeriod;
    });
  };

  const filteredIncomes = useMemo(() => applyFilters(incomes, 'INCOME'), [incomes, searchTerm, startDate, endDate, globalMonth, globalYear, viewMode]);
  const filteredExpenses = useMemo(() => applyFilters(expenses, 'EXPENSE'), [expenses, searchTerm, startDate, endDate, selectedCategory, selectedPIC, selectedWallet, globalMonth, globalYear, viewMode]);
  const filteredGaji = useMemo(() => {
    const payrollCategories = ['Gaji Pokok', 'Gaji Part-time', 'Overtime', 'Bonus Target', 'Service Charge'];
    return applyFilters(expenses.filter(e => payrollCategories.includes(e.category)), 'EXPENSE');
  }, [expenses, searchTerm, startDate, endDate, selectedPIC, selectedWallet, globalMonth, globalYear, viewMode]);

  const totalTabAmount = useMemo(() => {
    if (activeDataTab === 'INCOME') return filteredIncomes.reduce((s, i) => s + i.total, 0);
    if (activeDataTab === 'EXPENSE') return filteredExpenses.reduce((s, i) => s + (i.amount * (i.qty || 1)), 0);
    if (activeDataTab === 'GAJI') return filteredGaji.reduce((s, i) => s + (i.amount * (i.qty || 1)), 0);
    if (activeDataTab === 'BILLS') return applyFilters(bills, 'BILLS').reduce((s, i) => s + i.amount, 0);
    return 0;
  }, [activeDataTab, filteredIncomes, filteredExpenses, filteredGaji, bills, searchTerm, startDate, endDate, selectedCategory, selectedPIC, selectedWallet]);

  const handleFullExport = () => {
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incomes), 'PEMASUKAN');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenses), 'PENGELUARAN');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(inventoryItems), 'INVENTARIS');
      XLSX.writeFile(wb, `LMK_FULL_BACKUP_${new Date().toISOString().split('T')[0]}.xlsx`);
    } finally { setIsExporting(false); }
  };

  return (
    <div className="animate-fade-in space-y-10 pb-24">
      {/* 1. AUTO SYNC STATUS OVERLAY - GAYA PREMIUM */}
      {isAutoSyncing && (
        <div className="bg-indigo-600 text-white px-10 py-6 rounded-[3rem] flex items-center justify-between shadow-2xl animate-slide-up no-print mx-2">
           <div className="flex items-center gap-6">
              <div className="p-4 bg-white/20 rounded-2xl animate-spin"><RefreshCw size={32} /></div>
              <div>
                 <p className="text-[13px] font-black uppercase tracking-[0.3em]">Vault Auto-Synchronization</p>
                 <p className="text-[11px] font-medium opacity-80">Menghubungkan ke Google Drive & Cloud Mirroring... Bapak mohon tunggu sebentar.</p>
              </div>
           </div>
           <div className="hidden lg:flex items-center gap-4">
              <div className="px-5 py-2 bg-black/20 rounded-xl text-[10px] font-black uppercase tracking-widest">Mirroring Slot: 01, 02</div>
           </div>
        </div>
      )}

      {/* HEADER ACTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 px-4">
        <div className="flex items-center gap-6">
          <div className="p-6 bg-gray-950 text-white rounded-[2.5rem] shadow-2xl ring-8 ring-gray-100 dark:ring-gray-800"><Database size={40} /></div>
          <div>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Pusat Data</h2>
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500"/> Terintegrasi 10 Modul Bisnis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full lg:w-auto">
           {!isAutoSyncing && (
             <div className="hidden md:flex items-center gap-3 px-8 py-4 bg-emerald-50 text-emerald-600 rounded-3xl border-2 border-emerald-100 animate-fade-in shadow-sm">
                <ShieldCheck size={20}/>
                <span className="text-[12px] font-black uppercase tracking-widest leading-none">Vault Secured</span>
             </div>
           )}
           <button onClick={handleFullExport} className="flex-1 lg:flex-none px-12 py-6 bg-gray-950 text-white rounded-[2.2rem] font-black text-sm uppercase tracking-widest shadow-2xl flex items-center justify-center gap-4 hover:bg-indigo-700 hover:-translate-y-2 transition-all cursor-pointer">
              {isExporting ? <Loader2 size={24} className="animate-spin"/> : <Download size={24} />} Local Snapshot
           </button>
        </div>
      </div>

      {/* TABS & FILTERS */}
      <div className="bg-white dark:bg-gray-900 p-10 rounded-[4rem] border border-gray-100 dark:border-gray-800 shadow-2xl space-y-12">
         <div className="flex flex-wrap items-center gap-6">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 max-w-full">
               {[
                 { id: 'INCOME', label: 'Income', icon: <TrendingUp size={14}/> },
                 { id: 'EXPENSE', label: 'Expenses', icon: <ShoppingBag size={14}/> },
                 { id: 'GAJI', label: 'Gaji', icon: <BadgeDollarSign size={14}/> },
                 { id: 'LOGS', label: 'Mutasi', icon: <RefreshCw size={14}/> },
                 { id: 'HPP', label: 'HPP', icon: <Calculator size={14}/> },
                 { id: 'INVENTORY', label: 'Gudang', icon: <Box size={14}/> },
                 { id: 'ARTICLES', label: 'Katalog', icon: <Tag size={14}/> },
                 { id: 'BILLS', label: 'Tagihan', icon: <Receipt size={14}/> },
                 { id: 'RESERVATION', label: 'Reservasi', icon: <Ticket size={14}/> },
                 { id: 'STAFF', label: 'Staff', icon: <Users size={14}/> },
               ].map(tab => (
                 <button key={tab.id} onClick={() => setActiveDataTab(tab.id as any)} className={`px-7 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 cursor-pointer whitespace-nowrap ${activeDataTab === tab.id ? 'bg-indigo-600 text-white shadow-xl scale-110' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>{tab.icon} {tab.label}</button>
               ))}
            </div>
            <div className="relative flex-1 min-w-[300px]"><Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={24}/><input type="text" placeholder="Audit cerdas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-[2.5rem] pl-16 pr-8 py-5 outline-none font-bold text-lg shadow-inner" /></div>
         </div>

         {/* FILTER ROW */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 pt-12 border-t dark:border-gray-800">
            <div className="space-y-3">
               <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2"><Calendar size={14}/> Dari Tgl</label>
               <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 rounded-[1.5rem] px-6 py-5 outline-none font-black text-sm shadow-sm" />
            </div>
            <div className="space-y-3">
               <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2"><Calendar size={14}/> Sampai Tgl</label>
               <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 rounded-[1.5rem] px-6 py-5 outline-none font-black text-sm shadow-sm" />
            </div>

            {activeDataTab === 'EXPENSE' && (
              <>
                <div className="space-y-3 animate-slide-up">
                   <label className="text-[11px] font-black text-rose-600 uppercase tracking-widest ml-4 flex items-center gap-2"><Filter size={14}/> Kategori</label>
                   <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 rounded-[1.5rem] px-6 py-5 outline-none font-black text-[11px] appearance-none uppercase cursor-pointer border-2 border-transparent focus:border-rose-500 shadow-sm">
                      <option value="ALL">SEMUA KATEGORI</option>
                      {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
                <div className="space-y-3 animate-slide-up">
                   <label className="text-[11px] font-black text-blue-600 uppercase tracking-widest ml-4 flex items-center gap-2"><User size={14}/> Audit PIC</label>
                   <select value={selectedPIC} onChange={e => setSelectedPIC(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 rounded-[1.5rem] px-6 py-5 outline-none font-black text-[11px] appearance-none uppercase cursor-pointer border-2 border-transparent focus:border-blue-500 shadow-sm">
                      <option value="ALL">SEMUA USER</option>
                      {uniquePICs.map(p => <option key={p} value={p}>{p}</option>)}
                   </select>
                </div>
              </>
            )}

            {(activeDataTab === 'EXPENSE' || activeDataTab === 'INCOME') && (
              <div className="space-y-3 animate-slide-up">
                 <label className="text-[11px] font-black text-indigo-600 uppercase tracking-widest ml-4 flex items-center gap-2"><Wallet size={14}/> Dana</label>
                 <select value={selectedWallet} onChange={e => setSelectedWallet(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 rounded-[1.5rem] px-6 py-5 outline-none font-black text-[11px] appearance-none uppercase cursor-pointer border-2 border-transparent focus:border-indigo-500 shadow-sm">
                    <option value="ALL">SEMUA DOMPET</option>
                    {activeDataTab === 'INCOME' 
                      ? ['Cash Naim', 'Cash Tiwi', 'BRI', 'BNI'].map(w => <option key={w} value={w}>{w.toUpperCase()}</option>)
                      : wallets?.map(w => <option key={w} value={w}>{w.toUpperCase()}</option>)
                    }
                 </select>
              </div>
            )}

            <div className="flex items-end">
               <button onClick={resetFilters} className="w-full py-5 bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-red-600 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 cursor-pointer shadow-sm"><X size={20}/> Reset Audit</button>
            </div>
         </div>

         {/* TOTAL FOOTER INFO */}
         {totalTabAmount > 0 && (
           <div className="pt-12 border-t dark:border-gray-800 flex justify-end">
              <div className="bg-gray-900 text-white px-12 py-6 rounded-[2.5rem] shadow-2xl flex items-center gap-10 border-l-[12px] border-emerald-500">
                 <div className="p-4 bg-emerald-600 rounded-2xl shadow-xl"><Sigma size={32}/></div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.5em] mb-2">Total Rekapitulasi Audit</p>
                    <p className="text-4xl font-black tabular-nums">{formatCurrency(totalTabAmount)}</p>
                 </div>
              </div>
           </div>
         )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[4.5rem] border border-gray-100 dark:border-gray-800 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.15)] overflow-hidden min-h-[700px]">
         {activeDataTab === 'INCOME' && <DataCenterIncome data={filteredIncomes} formatCurrency={formatCurrency} />}
         {activeDataTab === 'EXPENSE' && <DataCenterExpense data={filteredExpenses} formatCurrency={formatCurrency} />}
         {activeDataTab === 'GAJI' && <DataCenterPayroll data={filteredGaji} formatCurrency={formatCurrency} />}
         {activeDataTab === 'HPP' && <DataCenterHpp data={applyFilters(recipes, 'HPP')} formatCurrency={formatCurrency} />}
         {activeDataTab === 'LOGS' && <DataCenterLogs data={applyFilters(inventoryLogs, 'LOGS')} />}
         {activeDataTab === 'INVENTORY' && <DataCenterInventory data={applyFilters(inventoryItems, 'INVENTORY')} formatCurrency={formatCurrency} />}
         {activeDataTab === 'ARTICLES' && <DataCenterCatalog data={applyFilters(articles, 'ARTICLES')} formatCurrency={formatCurrency} />}
         {activeDataTab === 'BILLS' && <DataCenterBills data={applyFilters(bills, 'BILLS')} formatCurrency={formatCurrency} />}
         {activeDataTab === 'RESERVATION' && <DataCenterReservations data={applyFilters(reservations, 'RESERVATION')} formatCurrency={formatCurrency} />}
         {activeDataTab === 'STAFF' && <DataCenterStaff data={employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()))} formatCurrency={formatCurrency} />}
      </div>
    </div>
  );
};

export default DataCenter;
