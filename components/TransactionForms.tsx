
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowUpCircle, ArrowDownCircle, Receipt, Tag, Truck, Package,
  ChevronDown, Plus, Save, X, History, ArrowRight, CheckCircle2, 
  CloudUpload, Banknote, CreditCard, Layers, FileSpreadsheet
} from 'lucide-react';
import { IncomeRecord, ExpenseRecord, BillRecord, Supplier, UserRole, BillItem, Article } from '../types';
import { CATEGORY_GROUPS } from '../constants';
import RecentExpensesList from './RecentExpensesList';
import ExcelImportModal from './ExcelImportModal';

interface Props {
  type: 'income' | 'expense' | 'bill';
  onSubmit: (data: any) => Promise<boolean>;
  wallets: string[];
  categories?: string[];
  suppliers?: Supplier[];
  currentBalances?: Record<string, number>;
  userRole?: UserRole;
  articles?: Article[];
  expenses?: ExpenseRecord[];
}

const TransactionForms: React.FC<Props> = ({ 
  type, onSubmit, wallets, categories = [], suppliers = [], 
  userRole, articles = [], expenses = [] 
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState<'IDLE' | 'SENDING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [showExcelModal, setShowExcelModal] = useState(false);

  const expenseNameSuggestions = useMemo(() => {
    const fromArticles = (articles || []).map(a => a.name.toUpperCase());
    const fromHistory = (expenses || []).map(e => e.notes.toUpperCase());
    return Array.from(new Set([...fromArticles, ...fromHistory])).sort();
  }, [articles, expenses]);

  // Form states
  const [incomeData, setIncomeData] = useState<Record<string, any>>({
    date: new Date().toISOString().split('T')[0],
    notes: '', 
    amounts: {} // Dynamic amounts per wallet
  });

  const [expenseData, setExpenseData] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: '', wallet: '', category: '', amount: 0, qty: 1
  });

  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [billData, setBillData] = useState({
    title: '', date: new Date().toISOString().split('T')[0], 
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    category: '', notes: ''
  });

  const totalIncome = useMemo<number>((): number => {
    const amounts = (incomeData.amounts || {}) as Record<string, any>;
    return Object.values(amounts).reduce((sum: number, val: any): number => sum + (Number(val) || 0), 0);
  }, [incomeData.amounts]);

  const totalBillAmount = useMemo<number>((): number => {
    return billItems.reduce((sum: number, item: BillItem): number => sum + (Number(item.amount) || 0), 0);
  }, [billItems]);

  const triggerSyncVisual = async (record: any, clearFormCallback: () => void) => {
    setIsSyncing(true);
    setSyncStep('SENDING');
    const minDelay = new Promise<void>(r => setTimeout(() => r(), 1000));
    const [success] = await Promise.all([onSubmit(record), minDelay]);
    if (success) {
      setSyncStep('SUCCESS');
      await new Promise<void>(r => setTimeout(() => r(), 1000));
      clearFormCallback();
      setIsSyncing(false);
      setSyncStep('IDLE');
    } else {
      setSyncStep('ERROR');
      await new Promise<void>(r => setTimeout(() => r(), 3000));
      setIsSyncing(false);
      setSyncStep('IDLE');
    }
  };

  const handleExcelImport = async (data: ExpenseRecord[]) => {
    // Impor data secara massal
    for (const record of data) {
      await onSubmit(record);
    }
  };

  const handleIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalIncome <= 0) return alert('Input nominal pendapatan!');
    
    const record: IncomeRecord = {
      id: `inc-${Date.now()}`,
      date: incomeData.date,
      notes: incomeData.notes,
      cashNaim: Number(incomeData.amounts['Cash Naim']) || 0,
      cashTiwi: Number(incomeData.amounts['Cash Tiwi']) || 0,
      bri: Number(incomeData.amounts['BRI']) || 0,
      bni: Number(incomeData.amounts['BNI']) || 0,
      total: totalIncome,
      timestamp: new Date().toISOString()
    };

    triggerSyncVisual(record, () => {
      setIncomeData({ date: new Date().toISOString().split('T')[0], notes: '', amounts: {} });
    });
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseData.wallet || !expenseData.category || expenseData.amount <= 0) return alert('Lengkapi data pengeluaran!');
    const record: ExpenseRecord = { id: `exp-${Date.now()}`, ...expenseData, timestamp: new Date().toISOString(), createdBy: userRole || 'SYSTEM' };
    triggerSyncVisual(record, () => {
      setExpenseData({ ...expenseData, notes: '', amount: 0, qty: 1, wallet: userRole === 'PURCHASING' ? 'Purchasing' : '', category: '' });
    });
  };

  const handleBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billData.title || billItems.length === 0) return alert('Lengkapi data tagihan!');
    const record: BillRecord = { id: `bill-${Date.now()}`, ...billData, amount: totalBillAmount, status: 'UNPAID', items: billItems, timestamp: new Date().toISOString() };
    triggerSyncVisual(record, () => {
      setBillData({ title: '', date: new Date().toISOString().split('T')[0], dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], category: '', notes: '' });
      setBillItems([]);
    });
  };

  const updateBillItem = (index: number, field: keyof BillItem, value: any) => {
    const newItems = [...billItems];
    const item = { ...newItems[index], [field]: value };
    if (field === 'qty' || field === 'unitPrice') item.amount = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0);
    newItems[index] = item;
    setBillItems(newItems);
  };

  const handleIncomeAmountChange = (walletName: string, value: string) => {
    const numericVal = parseInt(value.replace(/[^\d]/g, '')) || 0;
    setIncomeData(prev => ({
      ...prev,
      amounts: { ...prev.amounts, [walletName]: numericVal }
    }));
  };

  const incomeWallets = useMemo(() => {
    const standardIncome = ['Cash Naim', 'Cash Tiwi', 'BRI', 'BNI'];
    return wallets.filter(w => standardIncome.includes(w));
  }, [wallets]);

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32 relative">
      {isSyncing && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/60 dark:bg-black/80 backdrop-blur-md animate-fade-in pointer-events-auto">
           <div className="relative">
              <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl ${syncStep === 'SUCCESS' ? 'bg-emerald-600' : syncStep === 'ERROR' ? 'bg-rose-600 animate-shake' : 'bg-blue-600 animate-pulse'}`}>
                 {syncStep === 'SENDING' ? <CloudUpload size={64} className="text-white animate-bounce" /> : syncStep === 'SUCCESS' ? <CheckCircle2 size={64} className="text-white animate-scale-in" /> : <X size={64} className="text-white animate-pulse" />}
              </div>
              {syncStep === 'SENDING' && <div className="absolute inset-0 w-full h-full border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>}
           </div>
           <div className="mt-8 text-center px-6">
              <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900 dark:text-white">
                 {syncStep === 'SENDING' ? 'Mengkoneksi Cloud...' : syncStep === 'SUCCESS' ? 'Data Aman Terkirim!' : 'Gangguan Jaringan!'}
              </h3>
           </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10 px-2">
         <div className="flex items-center gap-5">
            <div className={`p-5 rounded-[2.5rem] text-white shadow-xl ${type === 'income' ? 'bg-green-600' : type === 'bill' ? 'bg-indigo-600' : 'bg-red-600'}`}>
               {type === 'income' ? <ArrowUpCircle size={36}/> : type === 'bill' ? <Receipt size={36}/> : <ArrowDownCircle size={36}/>}
            </div>
            <div>
               <h2 className="text-4xl font-black uppercase tracking-tighter leading-none dark:text-white">
                  {type === 'income' ? 'Input Pendapatan' : type === 'bill' ? 'Daftar Tagihan Baru' : 'Input Pengeluaran'}
               </h2>
               <div className="flex items-center gap-2 mt-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${syncStep === 'ERROR' ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`}></div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">Smart Sync v2.8 Active</p>
               </div>
            </div>
         </div>
         
         {type === 'expense' && (
           <button 
             onClick={() => setShowExcelModal(true)}
             className="px-6 py-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-emerald-100 flex items-center gap-2 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
           >
              <FileSpreadsheet size={18}/> Import via Excel
           </button>
         )}
      </div>

      {type === 'income' && (
        <form onSubmit={handleIncomeSubmit} className="bg-white dark:bg-gray-900 rounded-[3rem] p-10 border border-gray-100 dark:border-gray-800 shadow-2xl space-y-8 animate-scale-in">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Tanggal Transaksi</label>
                 <input type="date" value={incomeData.date} onChange={e => setIncomeData({...incomeData, date: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl outline-none font-black text-sm border-2 border-transparent focus:border-green-600 transition-all" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Catatan Pendapatan</label>
                 <input type="text" value={incomeData.notes} onChange={e => setIncomeData({...incomeData, notes: e.target.value.toUpperCase()})} placeholder="Contoh: Omzet Hari Senin" className="w-full bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-green-600 transition-all" />
              </div>
           </div>

           <div className="pt-4 border-t dark:border-gray-800">
              <h3 className="text-xs font-black uppercase tracking-widest text-green-700 flex items-center gap-2 mb-6"><Banknote size={16}/> Alokasi Dana Masuk Ke Dompet</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {incomeWallets.map(w => (
                    <div key={w} className="space-y-2">
                       <label className="text-[9px] font-black text-gray-400 uppercase ml-4">{w}</label>
                       <div className="relative group">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 font-black text-[10px] group-focus-within:text-green-600">Rp</span>
                          <input 
                            type="text" 
                            value={incomeData.amounts[w] ? incomeData.amounts[w].toLocaleString('id-ID') : ''} 
                            onChange={e => handleIncomeAmountChange(w, e.target.value)} 
                            className="w-full bg-gray-50 dark:bg-gray-800 pl-12 pr-6 py-4 rounded-2xl outline-none font-black text-lg border-2 border-transparent focus:border-green-600 transition-all shadow-inner" 
                            placeholder="0" 
                          />
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           <div className="p-10 bg-gray-950 text-white rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden group">
              <div className="relative z-10 mb-6 md:mb-0">
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-50 mb-2">Total Pendapatan Terakumulasi</p>
                 <h4 className="text-5xl font-black tracking-tighter text-green-400 tabular-nums leading-none">Rp {totalIncome.toLocaleString('id-ID')}</h4>
              </div>
              <button type="submit" disabled={incomeWallets.length === 0} className="relative z-10 px-12 py-6 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl flex items-center gap-4 active:scale-95 cursor-pointer disabled:opacity-30">
                 <Save size={20}/> Simpan & Push ke Cloud
              </button>
           </div>
        </form>
      )}

      {type === 'expense' && (
        <>
          <form onSubmit={handleExpenseSubmit} className="bg-white dark:bg-gray-900 rounded-[3rem] p-10 border border-gray-100 dark:border-gray-800 shadow-2xl space-y-10 animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Tanggal</label>
                   <input type="date" value={expenseData.date} onChange={e => setExpenseData({...expenseData, date: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl outline-none font-black text-sm border-2 border-transparent focus:border-red-600 transition-all" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Dompet Dana</label>
                   <div className="relative">
                      <select required value={expenseData.wallet} onChange={e => setExpenseData({...expenseData, wallet: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl outline-none font-black text-sm appearance-none cursor-pointer border-2 border-transparent focus:border-red-600 transition-all">
                         {userRole === 'PURCHASING' ? <option value="Purchasing">PURCHASING</option> : <><option value="">-- PILIH DOMPET --</option>{wallets.map(w => <option key={w} value={w}>{w.toUpperCase()}</option>)}</>}
                      </select>
                      <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Kategori Biaya</label>
                   <div className="relative">
                      <select required value={expenseData.category} onChange={e => setExpenseData({...expenseData, category: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl outline-none font-black text-sm appearance-none cursor-pointer border-2 border-transparent focus:border-red-600 transition-all">
                         <option value="">-- PILIH KATEGORI --</option>
                         {CATEGORY_GROUPS.map(group => <optgroup key={group.name} label={group.name.toUpperCase()}>{group.subs.map(sub => <option key={sub} value={sub}>{sub}</option>)}</optgroup>)}
                      </select>
                      <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2"><Tag size={12} className="text-red-500" /> Barang / Jasa (Auto-Link Katalog Aktif)</label>
                   <div className="relative">
                      <input required list="expense-suggestions" value={expenseData.notes} onChange={e => setExpenseData({...expenseData, notes: e.target.value.toUpperCase()})} placeholder="KETIK NAMA BARANG..." className="w-full bg-gray-50 dark:bg-gray-800 p-6 rounded-[1.5rem] outline-none font-black text-sm border-2 border-transparent focus:border-red-600 transition-all shadow-inner" />
                      <datalist id="expense-suggestions">{expenseNameSuggestions.map(suggestion => <option key={suggestion} value={suggestion} />)}</datalist>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Qty (Kuantitas)</label>
                   <div className="relative">
                      <input type="number" step="any" value={expenseData.qty || ''} onChange={e => setExpenseData({...expenseData, qty: parseFloat(e.target.value) || 0})} className="w-full bg-gray-50 dark:bg-gray-800 p-6 rounded-[2rem] outline-none font-black text-2xl text-center border-2 border-transparent focus:border-red-600 shadow-inner" placeholder="1" />
                      <Layers size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-red-600 uppercase tracking-widest ml-4">Harga Satuan (IDR)</label>
                   <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-red-400 text-xl">Rp</span>
                      <input type="text" value={expenseData.amount ? expenseData.amount.toLocaleString('id-ID') : ''} onChange={e => setExpenseData({...expenseData, amount: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0})} className="w-full bg-white dark:bg-gray-950 pl-16 pr-6 py-6 rounded-3xl outline-none font-black text-3xl text-red-600 shadow-xl border-2 border-transparent focus:border-red-600" placeholder="0" />
                   </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-600 p-8 rounded-[2.5rem] shadow-lg flex flex-col justify-center h-full">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600/60 mb-2">Total Pengeluaran</p>
                    <h4 className="text-4xl font-black text-red-600 tracking-tighter">Rp {(expenseData.amount * expenseData.qty).toLocaleString('id-ID')}</h4>
                </div>
             </div>

             <button type="submit" className="w-full py-7 bg-red-600 hover:bg-red-700 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-sm shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4">
                <CloudUpload size={24}/> Catat & Sinkronisasi Cloud
             </button>
          </form>

          <RecentExpensesList expenses={expenses || []} />
        </>
      )}

      {type === 'bill' && (
        <form onSubmit={handleBillSubmit} className="bg-white dark:bg-gray-900 rounded-[3rem] p-10 border border-gray-100 dark:border-gray-800 shadow-2xl space-y-8 animate-scale-in">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Nama Suplier / Vendor</label>
                 <div className="relative">
                    <input list="suppliers" value={billData.title} onChange={e => setBillData({...billData, title: e.target.value.toUpperCase()})} placeholder="PILIH ATAU KETIK..." className="w-full bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl outline-none font-black text-sm uppercase" />
                    <datalist id="suppliers">{suppliers.map(s => <option key={s.id} value={s.name} />)}</datalist>
                    <Truck size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Tgl Tagihan</label><input type="date" value={billData.date} onChange={e => setBillData({...billData, date: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl outline-none font-black text-xs" /></div>
                 <div className="space-y-2"><label className="text-[10px] font-black text-red-600 uppercase tracking-widest ml-4">Jatuh Tempo</label><input type="date" value={billData.dueDate} onChange={e => setBillData({...billData, dueDate: e.target.value})} className="w-full bg-red-50 dark:bg-red-950/20 p-5 rounded-2xl outline-none font-black text-xs text-red-600" /></div>
              </div>
           </div>

           <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2"><Package size={18}/> Item Belanja</h3>
                 <button type="button" onClick={() => setBillItems([...billItems, { description: '', qty: 1, unitPrice: 0, amount: 0, category: billData.category || (categories.length > 0 ? categories[0] : '') }])} className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all"><Plus size={14}/> Tambah Item</button>
              </div>
              <div className="space-y-3">
                 {billItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 relative group animate-slide-up">
                       <div className="md:col-span-4 space-y-1"><label className="text-[8px] font-black text-gray-400 uppercase ml-1">Nama Item</label><input type="text" list="expense-suggestions" value={item.description} onChange={e => updateBillItem(idx, 'description', e.target.value.toUpperCase())} placeholder="TELUR / KOPI" className="w-full bg-white dark:bg-gray-900 px-3 py-2 rounded-lg outline-none font-bold text-xs" /></div>
                       <div className="md:col-span-3 space-y-1"><label className="text-[8px] font-black text-gray-400 uppercase ml-1">Kategori</label><select value={item.category} onChange={e => updateBillItem(idx, 'category', e.target.value)} className="w-full bg-white dark:bg-gray-900 px-2 py-2 rounded-lg outline-none font-black text-[9px] uppercase"><option value="">-- PILIH --</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                       <div className="md:col-span-1 space-y-1"><label className="text-[8px] font-black text-gray-400 uppercase ml-1 text-center block">Qty</label><input type="number" step="any" value={item.qty} onChange={e => updateBillItem(idx, 'qty', e.target.value)} className="w-full bg-white dark:bg-gray-900 px-1 py-2 rounded-lg outline-none font-black text-xs text-center" /></div>
                       <div className="md:col-span-2 space-y-1"><label className="text-[8px] font-black text-gray-400 uppercase ml-1">Harga Satuan</label><input type="text" value={item.unitPrice ? item.unitPrice.toLocaleString('id-ID') : ''} onChange={e => updateBillItem(idx, 'unitPrice', parseInt(e.target.value.replace(/[^\d]/g, '')) || 0)} className="w-full bg-white dark:bg-gray-900 px-3 py-2 rounded-lg outline-none font-black text-xs" placeholder="0" /></div>
                       <div className="md:col-span-2 space-y-1"><label className="text-[8px] font-black text-indigo-600 uppercase ml-1">Subtotal</label><div className="w-full bg-white dark:bg-gray-900 px-3 py-2 rounded-lg font-black text-xs text-indigo-700 overflow-hidden">Rp {item.amount.toLocaleString('id-ID')}</div></div>
                       <button type="button" onClick={() => setBillItems(billItems.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 p-1.5 bg-white dark:bg-gray-800 text-red-400 rounded-full border opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-indigo-600 text-white p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden">
              <div className="relative z-10 text-center md:text-left mb-6 md:mb-0">
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-50 mb-2">Total Tagihan Bruto</p>
                 <h4 className="text-5xl font-black tracking-tighter">Rp {totalBillAmount.toLocaleString('id-ID')}</h4>
              </div>
              <button type="submit" className="relative z-10 px-12 py-5 bg-white text-indigo-700 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-gray-100 active:scale-95 flex items-center gap-3 cursor-pointer"><CloudUpload size={20}/> Simpan & Backup</button>
           </div>
        </form>
      )}

      <ExcelImportModal 
        show={showExcelModal} 
        onClose={() => setShowExcelModal(false)} 
        onImport={handleExcelImport}
        userRole={userRole!}
        wallets={wallets}
        categories={categories}
      />
    </div>
  );
};

export default TransactionForms;
