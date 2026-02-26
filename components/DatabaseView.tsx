
import React, { useState, useMemo } from 'react';
import { 
  Search, X, Database, Filter, ImageIcon, 
  Loader2, ArrowLeft, ChevronDown, UserCircle, Building2,
  Printer, Trash2, AlertTriangle, CheckCircle2, Edit2, Save,
  Calendar, Tag, Wallet, Banknote, Coins, CreditCard, Layers, TrendingUp, User,
  ArrowUpCircle,
  ArrowDownCircle,
  Calculator,
  Receipt,
  BarChart3,
  Sigma
} from 'lucide-react';
import { PageId, IncomeRecord, ExpenseRecord, BusinessInfo, UserRole } from '../types';
import html2canvas from 'html2canvas';
import DbCategoryPicker from './DbCategoryPicker';
import DbIncomeTable from './DbIncomeTable';
import DbExpenseTable from './DbExpenseTable';
import EditIncomeModal from './EditIncomeModal';
import EditExpenseModal from './EditExpenseModal';

interface Props {
  pageId: PageId;
  category: string | null;
  setCategory?: (cat: string | null) => void;
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
  setIncomes: React.Dispatch<React.SetStateAction<IncomeRecord[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<ExpenseRecord[]>>;
  businessInfo: BusinessInfo;
  userRole: UserRole;
  wallets: string[];
  globalMonth: number;
  globalYear: number;
  viewMode: 'BULANAN' | 'TAHUNAN';
}

const DatabaseView: React.FC<Props> = ({ 
  pageId, category, setCategory, incomes, expenses, 
  setIncomes, setExpenses, businessInfo, userRole, wallets,
  globalMonth, globalYear, viewMode
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPIC, setSelectedPIC] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedWallet, setSelectedWallet] = useState<string>('ALL');
  const [itemToEdit, setItemToEdit] = useState<any | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const monthsList = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const periodLabel = useMemo(() => {
    return viewMode === 'TAHUNAN' ? `Tahun ${globalYear}` : `${monthsList[globalMonth]} ${globalYear}`;
  }, [viewMode, globalMonth, globalYear]);

  const formatCurrency = (val: number) => 'Rp ' + (val || 0).toLocaleString('id-ID');

  const isOwner = userRole === 'OWNER';
  const isAdmin = userRole === 'ADMIN';
  const isPurchasing = userRole === 'PURCHASING';
  const isSupervisor = userRole === 'SUPERVISOR';

  const accessibleExpenses = useMemo(() => {
    if (isPurchasing) return expenses.filter(e => e.category === 'PURCHASING' || e.createdBy === 'PURCHASING');
    if (isSupervisor) return expenses.filter(e => e.createdBy === 'SUPERVISOR' && e.category === 'Gaji Part-time');
    return expenses;
  }, [expenses, isPurchasing, isSupervisor]);

  const expenseCategoriesSummary = useMemo(() => {
    const map: Record<string, number> = {};
    accessibleExpenses.forEach(e => { 
      const d = new Date(e.date);
      const match = viewMode === 'TAHUNAN' 
        ? d.getFullYear() === globalYear 
        : d.getMonth() === globalMonth && d.getFullYear() === globalYear;

      if (match) {
        map[e.category] = (map[e.category] || 0) + (Number(e.amount) * (Number(e.qty) || 1)); 
      }
    });
    return Object.entries(map).sort((a,b) => b[1] - a[1]);
  }, [accessibleExpenses, globalMonth, globalYear, viewMode]);

  const uniquePICs = useMemo(() => {
    const pics = new Set<string>();
    accessibleExpenses.forEach(e => { if (e.createdBy) pics.add(e.createdBy); });
    return Array.from(pics).sort();
  }, [accessibleExpenses]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    accessibleExpenses.forEach(e => { if (e.category) cats.add(e.category); });
    return Array.from(cats).sort();
  }, [accessibleExpenses]);

  const filteredData = useMemo(() => {
    const s = searchTerm.toLowerCase();
    let baseData: any[] = pageId === 'income' ? incomes : accessibleExpenses;
    
    const finalCategoryFilter = (pageId === 'expense-category' && category) ? category : selectedCategory;

    return baseData.filter(r => {
      const rDate = new Date(r.date);
      const rMonth = rDate.getMonth();
      const rYear = rDate.getFullYear();

      let matchPeriod = true;
      if (!startDate && !endDate) {
        if (viewMode === 'TAHUNAN') {
           matchPeriod = rYear === globalYear;
        } else {
           matchPeriod = rMonth === globalMonth && rYear === globalYear;
        }
      } else {
        if (startDate) matchPeriod = matchPeriod && r.date >= startDate;
        if (endDate) matchPeriod = matchPeriod && r.date <= endDate;
      }

      if (!matchPeriod) return false;

      const matchSearch = (r.notes || r.customerName || '').toLowerCase().includes(s) || (r.category || '').toLowerCase().includes(s);
      const matchPIC = selectedPIC === 'ALL' || r.createdBy === selectedPIC;
      const matchWallet = selectedWallet === 'ALL' || r.wallet === selectedWallet;
      const matchCategory = finalCategoryFilter === 'ALL' || r.category === finalCategoryFilter;

      if (pageId === 'income') return matchSearch && matchWallet;
      return matchSearch && matchPIC && matchWallet && matchCategory;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [pageId, category, incomes, accessibleExpenses, searchTerm, startDate, endDate, selectedPIC, selectedCategory, selectedWallet, globalMonth, globalYear, viewMode]);

  const totalFilteredAmount = useMemo(() => {
    return filteredData.reduce((sum, r) => {
      const val = Number(r.total) || (Number(r.amount) * (Number(r.qty) || 1));
      return sum + val;
    }, 0);
  }, [filteredData]);

  const handleDeleteItem = (item: any) => {
    if (!confirm('Bapak yakin ingin menghapus record ini secara permanen? Data akan hilang dari seluruh cermin cloud.')) return;
    
    if (pageId === 'income') {
      setIncomes(prev => prev.filter(i => i.id !== item.id));
    } else {
      setExpenses(prev => prev.filter(e => e.id !== item.id));
    }
    alert('Record berhasil dihapus secara permanen.');
  };

  const handleUpdateIncome = (updated: IncomeRecord) => {
    setIncomes(prev => prev.map(i => i.id === updated.id ? updated : i));
    setItemToEdit(null);
    alert('Pemasukan berhasil diperbarui!');
  };

  const handleUpdateExpense = (updated: ExpenseRecord) => {
    setExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));
    setItemToEdit(null);
    alert('Pengeluaran berhasil diperbarui!');
  };

  const handleExportImage = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    try {
      setIsCapturing(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.download = `${filename}_${new Date().getTime()}.jpg`;
      link.click();
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan gambar!');
    } finally {
      setIsCapturing(false);
    }
  };

  if (pageId === 'expense-category' && !category) {
    return <DbCategoryPicker expenseCategories={expenseCategoriesSummary} onSelect={setCategory!} formatCurrency={formatCurrency} />;
  }

  return (
    <div className="animate-fade-in space-y-6 pb-20">
      {!showPreview ? (
        <>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 no-print">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${pageId === 'income' ? 'bg-green-700' : 'bg-red-600'} text-white shadow-lg`}>
                  <Database size={24} />
              </div>
              <div>
                  <div className="flex items-center gap-3">
                    {pageId === 'expense-category' && <button onClick={() => setCategory?.(null)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 hover:text-red-600 cursor-pointer transition-all"><ArrowLeft size={16}/></button>}
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                      {pageId === 'income' ? 'Database Pemasukan' : pageId === 'expense-category' ? `Audit: ${category}` : 'Database Pengeluaran'}
                    </h2>
                  </div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mt-1">
                    Periode: <span className="text-indigo-600 font-black">{viewMode === 'BULANAN' ? `${monthsList[globalMonth]} ${globalYear}` : `Tahun ${globalYear}`}</span> • {filteredData.length} Entri
                  </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder={`Cari di tabel...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl pl-12 pr-4 py-3 outline-none text-sm font-medium shadow-sm focus:border-indigo-500 transition-all" />
              </div>
              <button onClick={() => setShowPreview(true)} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"><ImageIcon size={18} /> Pratinjau Kertas</button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl space-y-8 no-print">
            <div className="flex flex-wrap items-end gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-1.5"><Calendar size={12}/> Tgl Awal</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 outline-none font-black text-xs border border-transparent focus:border-indigo-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-1.5"><Calendar size={12}/> Tgl Akhir</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 outline-none font-black text-xs border border-transparent focus:border-indigo-500" />
                </div>
                
                <div className="h-10 w-px bg-gray-100 dark:bg-gray-800 hidden lg:block mb-1"></div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-1.5"><Wallet size={12}/> Dompet</label>
                  <div className="relative">
                      <select value={selectedWallet} onChange={(e) => setSelectedWallet(e.target.value)} className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-2.5 outline-none font-black text-xs appearance-none pr-10 border border-transparent focus:border-indigo-500 cursor-pointer min-w-[140px]">
                        <option value="ALL">SEMUA DOMPET</option>
                        {wallets.map(w => <option key={w} value={w}>{w.toUpperCase()}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {pageId !== 'income' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-indigo-600 uppercase ml-2 flex items-center gap-1.5"><User size={12}/> PIC Input</label>
                      <div className="relative">
                          <select value={selectedPIC} onChange={(e) => setSelectedPIC(e.target.value)} className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-xl px-4 py-2.5 outline-none font-black text-xs appearance-none pr-10 border border-indigo-100 dark:border-indigo-800 cursor-pointer min-w-[140px]">
                            <option value="ALL">SEMUA PETUGAS</option>
                            {uniquePICs.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
                      </div>
                    </div>

                    {pageId !== 'expense-category' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-rose-600 uppercase ml-2 flex items-center gap-1.5"><Tag size={12}/> Kategori</label>
                        <div className="relative">
                            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-xl px-4 py-2.5 outline-none font-black text-xs appearance-none pr-10 border border-rose-100 dark:border-rose-800 cursor-pointer min-w-[140px]">
                              <option value="ALL">SEMUA KATEGORI</option>
                              {allCategories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none" />
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="ml-auto bg-gray-900 text-white px-6 py-2.5 rounded-[1.5rem] shadow-xl border border-gray-800 flex items-center gap-4 animate-scale-in">
                   <div className="p-2 bg-indigo-600 rounded-xl">
                      <Sigma size={16}/>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Total Hasil Filter</span>
                      <span className="text-sm font-black tracking-tight tabular-nums">
                         {formatCurrency(totalFilteredAmount)}
                      </span>
                   </div>
                </div>

                {(startDate || endDate || selectedPIC !== 'ALL' || selectedCategory !== 'ALL' || selectedWallet !== 'ALL') && (
                  <button 
                    onClick={() => { setStartDate(''); setEndDate(''); setSelectedPIC('ALL'); setSelectedCategory('ALL'); setSelectedWallet('ALL'); }}
                    className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-red-500 rounded-xl transition-all mb-1"
                    title="Reset Filter"
                  >
                    <X size={18}/>
                  </button>
                )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden no-print">
            {pageId === 'income' ? (
              <DbIncomeTable 
                 data={filteredData} 
                 isOwnerOrAdmin={isOwner || isAdmin} 
                 onEdit={(item) => setItemToEdit(item)} 
                 onDelete={(item) => handleDeleteItem(item)} 
                 formatCurrency={formatCurrency} 
              />
            ) : (
              <DbExpenseTable 
                 data={filteredData} 
                 isOwnerOrAdmin={isOwner || isAdmin} 
                 onEdit={(item) => setItemToEdit(item)} 
                 onDelete={(item) => handleDeleteItem(item)} 
                 formatCurrency={formatCurrency} 
              />
            )}
          </div>
        </>
      ) : (
        /* PRINT PREVIEW */
        <div className="fixed inset-0 z-[9999] bg-gray-200 dark:bg-black overflow-y-auto flex flex-col no-scrollbar">
          <div className="sticky top-0 z-[10000] bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b p-4 flex items-center justify-between no-print shadow-md">
            <button onClick={() => setShowPreview(false)} className="flex items-center gap-2 bg-red-600 text-white font-black text-xs uppercase px-6 py-3 rounded-2xl transition-all shadow-lg active:scale-95 cursor-pointer">
              <X size={20} /> TUTUP
            </button>
            <div className="flex gap-3">
              <button onClick={() => handleExportImage('db-paper-c', 'Export_Data')} disabled={isCapturing} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-xl">{isCapturing ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />} SIMPAN JPG</button>
              <button onClick={() => window.print()} className="px-8 py-3 bg-black text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-xl hover:bg-gray-800 transition-all active:scale-95 cursor-pointer"><Printer size={18} /> CETAK PDF (LONG PAGE)</button>
            </div>
          </div>
          <div className="flex-1 py-14 flex flex-col items-center bg-gray-200 dark:bg-black/80">
            <div id="db-paper-c" className="paper-preview bg-white text-black font-sans shadow-2xl !p-[20mm] !w-[210mm] !min-h-[297mm]">
               <div className="text-center mb-10 border-b-4 border-black pb-8">
                  <h1 className="text-2xl font-black uppercase tracking-[0.3em]">{businessInfo.name}</h1>
                  <p className="text-[10px] font-black text-gray-500 uppercase mt-2">Database Audit Report • Periode {periodLabel}</p>
               </div>
               <table className="w-full text-left border-collapse border-2 border-black">
                  <thead><tr className="bg-gray-100 font-black uppercase text-[10px]"><th className="p-3 border-b-2 border-black">Tanggal</th><th className="p-3 border-b-2 border-black">Keterangan</th><th className="p-3 border-b-2 border-black text-right">Total</th></tr></thead>
                  <tbody className="text-[10px] uppercase font-bold">
                     {filteredData.map(row => (
                        <tr key={row.id} className="border-b border-gray-200">
                           <td className="p-3">{row.date}</td>
                           <td className="p-3 truncate max-w-[300px]">{row.notes || row.category}</td>
                           <td className="p-3 text-right font-black">{formatCurrency(row.total || (row.amount * (row.qty || 1)))}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT DINAMIS */}
      {itemToEdit && pageId === 'income' && (
         <EditIncomeModal 
            income={itemToEdit} 
            onSave={handleUpdateIncome} 
            onClose={() => setItemToEdit(null)} 
         />
      )}

      {itemToEdit && pageId !== 'income' && (
         <EditExpenseModal 
            expense={itemToEdit} 
            wallets={wallets} 
            onSave={handleUpdateExpense} 
            onClose={() => setItemToEdit(null)} 
         />
      )}
    </div>
  );
};

export default DatabaseView;
