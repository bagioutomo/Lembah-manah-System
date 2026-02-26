
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShoppingBasket, Search, History, ChevronDown, PlusCircle, Save, X, Tag,
  ArrowRight, CheckCircle2, TrendingUp, TrendingDown, ClipboardList, Edit3, Trash2,
  Package, Scale, AlertCircle, RefreshCw, Printer, ImageIcon, Loader2, 
  ArrowUpCircle, ArrowDownCircle, FileText, Database, ShieldCheck, ListFilter,
  Settings, FolderTree, Scale as ScaleIcon, MinusCircle, Plus, Info, ReceiptText,
  ListTodo, Coffee, Utensils
} from 'lucide-react';
import { Article, InventoryLog, InventoryCategoryConfig } from '../types';
import { storage } from '../services/storageService';
import html2canvas from 'html2canvas';

type StockView = 'AUDIT' | 'MASTER' | 'OPNAME' | 'LOGS' | 'REPORT';

interface Props {
  articles: Article[];
  setArticles: React.Dispatch<React.SetStateAction<Article[]>>;
  globalMonth: number;
  globalYear: number;
  mutationReasons: string[];
  setMutationReasons: React.Dispatch<React.SetStateAction<string[]>>;
}

const StockAuditManager: React.FC<Props> = ({ articles, setArticles, globalMonth, globalYear, mutationReasons, setMutationReasons }) => {
  const [activeView, setActiveView] = useState<StockView>('AUDIT');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showUnitSettings, setShowUnitSettings] = useState(false);
  const [showCategorySettings, setShowCategorySettings] = useState(false);
  const [showReasonSettings, setShowReasonSettings] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Fix: Added local formatCurrency helper to fix compilation error
  const formatCurrency = (val: number) => 'Rp ' + Math.round(val || 0).toLocaleString('id-ID');

  const [categories, setCategories] = useState<InventoryCategoryConfig[]>(storage.getInventoryCategories());
  const [units, setUnits] = useState<string[]>(storage.getUnits());
  
  const [newUnitName, setNewUnitName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newReasonName, setNewReasonName] = useState('');
  
  const [logs, setLogs] = useState<InventoryLog[]>(storage.getInventoryLogs());
  const businessInfo = useMemo(() => storage.getBusinessInfo(), []);

  const stockCategories = useMemo(() => categories.filter(c => c.type === 'RAW_MATERIAL'), [categories]);
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const periodLabel = `${months[globalMonth]} ${globalYear}`;

  const [formData, setFormData] = useState<Partial<Article>>({ name: '', category: '', quantity: 0, unit: 'gr', purchasePrice: 0 });
  const [adjustData, setAdjustData] = useState({ itemId: '', qty: '', type: 'IN' as 'IN' | 'OUT', reason: '' });
  const [opnameInputs, setOpnameInputs] = useState<Record<string, string>>({});

  useEffect(() => { storage.setUnits(units); }, [units]);
  useEffect(() => { storage.setInventoryCategories(categories); }, [categories]);

  const auditData = useMemo(() => {
    const startOfCurrentMonth = new Date(globalYear, globalMonth, 1);
    const endOfCurrentMonth = new Date(globalYear, globalMonth + 1, 0, 23, 59, 59);
    return articles.map(item => {
      const itemLogs = (logs || []).filter(l => l.itemId === item.id);
      const logsBefore = itemLogs.filter(l => new Date(l.timestamp) < startOfCurrentMonth);
      let stokAwal = 0;
      logsBefore.forEach(l => {
        if (['IN', 'CREATE'].includes(l.action)) stokAwal += l.qtyChange;
        else if (['OUT', 'DAMAGE', 'LOSS', 'DELETE'].includes(l.action)) stokAwal -= l.qtyChange;
        else if (l.action === 'ADJUST') { stokAwal += (l.newQty - l.previousQty); }
      });
      const logsThisMonth = itemLogs.filter(l => { const d = new Date(l.timestamp); return d >= startOfCurrentMonth && d <= endOfCurrentMonth; });
      let masuk = 0; let keluar = 0;
      logsThisMonth.forEach(l => {
        if (['IN', 'CREATE'].includes(l.action)) masuk += l.qtyChange;
        else if (['OUT', 'DAMAGE', 'LOSS', 'DELETE'].includes(l.action)) keluar += l.qtyChange;
        else if (l.action === 'ADJUST') { const diff = l.newQty - l.previousQty; if (diff > 0) masuk += diff; else keluar += Math.abs(diff); }
      });
      return { ...item, stokAwal, masuk, keluar, sisaStok: stokAwal + masuk - keluar };
    });
  }, [articles, logs, globalMonth, globalYear]);

  const handleSaveMaster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    const itemId = editingArticle?.id || `art-${Date.now()}`;
    const isNew = !editingArticle;
    const qtyVal = Number(formData.quantity) || 0;
    const newItem = { 
      ...formData, 
      id: itemId, 
      code: editingArticle?.code || `ART-${Math.floor(Math.random()*1000)}`,
      lastUpdated: new Date().toISOString() 
    } as Article;
    
    setArticles(prev => isNew ? [...prev, newItem] : prev.map(i => i.id === itemId ? newItem : i));
    
    const newLog: InventoryLog = { 
      id: `log-${Date.now()}`, 
      itemId, 
      itemName: formData.name!.toUpperCase(), 
      action: isNew ? 'CREATE' : 'ADJUST', 
      qtyChange: isNew ? qtyVal : Math.abs(qtyVal - (editingArticle?.quantity || 0)), 
      previousQty: editingArticle?.quantity || 0, 
      newQty: qtyVal, 
      reason: isNew ? 'Registrasi Master' : 'Koreksi Data Master', 
      timestamp: new Date().toISOString() 
    };
    const updatedLogs = [newLog, ...(logs || [])]; 
    setLogs(updatedLogs); 
    storage.setInventoryLogs(updatedLogs); 
    setShowForm(false); 
    setEditingArticle(null);
  };

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    const item = articles.find(i => i.id === adjustData.itemId);
    if (!item || !adjustData.qty) return;
    const change = Number(adjustData.qty);
    const currentQty = item.quantity || 0;
    const newQty = adjustData.type === 'IN' ? currentQty + change : Math.max(0, currentQty - change);
    
    setArticles(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty, lastUpdated: new Date().toISOString() } : i));
    
    const newLog: InventoryLog = { 
      id: `log-mut-${Date.now()}`, 
      itemId: item.id, 
      itemName: item.name, 
      action: adjustData.type, 
      qtyChange: change, 
      previousQty: currentQty, 
      newQty, 
      reason: adjustData.reason || (adjustData.type === 'IN' ? 'STOK MASUK' : 'STOK KELUAR'), 
      timestamp: new Date().toISOString() 
    };
    const updatedLogs = [newLog, ...(logs || [])]; 
    setLogs(updatedLogs); 
    storage.setInventoryLogs(updatedLogs); 
    setShowAdjust(false); 
    setAdjustData({ itemId: '', qty: '', type: 'IN', reason: '' });
  };

  const executeOpname = () => {
    if (Object.keys(opnameInputs).length === 0) return alert('Input jumlah fisik terlebih dahulu!');
    const updatedItems = [...articles]; const newLogs: InventoryLog[] = []; const now = new Date().toISOString();
    Object.entries(opnameInputs).forEach(([id, physicalVal]) => {
      const itemIndex = updatedItems.findIndex(i => i.id === id);
      if (itemIndex > -1) {
        const item = updatedItems[itemIndex]; 
        const currentQty = item.quantity || 0;
        const physicalQty = parseFloat(physicalVal as string); 
        const difference = physicalQty - currentQty;
        if (difference !== 0) {
           newLogs.push({ 
             id: `log-opn-${Date.now()}-${id}`, 
             itemId: item.id, 
             itemName: item.name, 
             action: 'ADJUST', 
             qtyChange: Math.abs(difference), 
             previousQty: currentQty, 
             newQty: physicalQty, 
             reason: `STOK OPNAME: Selisih ${difference > 0 ? '+' : ''}${difference} ${item.unit}`, 
             timestamp: now 
           });
           updatedItems[itemIndex] = { ...item, quantity: physicalQty, lastUpdated: now };
        }
      }
    });
    if (newLogs.length > 0) { 
      setArticles(updatedItems); 
      const updatedLogsList = [...newLogs, ...(logs || [])]; 
      setLogs(updatedLogsList); 
      storage.setInventoryLogs(updatedLogsList); 
      setOpnameInputs({}); 
      alert(`Opname Selesai!`); 
    }
    else alert('Tidak ada selisih.');
  };

  const handleExportImage = async (id: string, name: string) => {
    const el = document.getElementById(id); if (!el) return;
    try { setIsCapturing(true); await new Promise<void>(resolve => setTimeout(() => resolve(), 600)); const canvas = await html2canvas(el, { scale: 2.5, useCORS: true, backgroundColor: '#ffffff' }); const link = document.createElement('a'); link.href = canvas.toDataURL("image/jpeg", 0.9); link.download = `${name}_${Date.now()}.jpg`; link.click(); } finally { setIsCapturing(false); }
  };

  const isPositiveAction = (log: InventoryLog) => { if (['IN', 'CREATE'].includes(log.action)) return true; if (['OUT', 'DAMAGE', 'LOSS', 'DELETE'].includes(log.action)) return false; if (log.action === 'ADJUST') return log.newQty >= log.previousQty; return true; };

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4"><div className="p-5 bg-emerald-600 text-white rounded-[1.8rem] shadow-2xl"><ShoppingBasket size={32}/></div><div><h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Audit Stok Bahan</h2><p className="text-sm text-gray-500 font-medium italic mt-2">Periode Audit: {periodLabel} (Sistem Estafet Aktif).</p></div></div>
        <div className="flex flex-wrap items-center gap-3">
           <button onClick={() => setShowUnitSettings(true)} className="p-4 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-2xl border hover:text-indigo-600 transition-all shadow-sm cursor-pointer"><Settings size={20}/></button>
           <button onClick={() => setShowCategorySettings(true)} className="p-4 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-2xl border hover:text-emerald-600 transition-all shadow-sm cursor-pointer"><FolderTree size={20}/></button>
           <button onClick={() => setShowReasonSettings(true)} className="p-4 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-2xl border hover:text-orange-600 transition-all shadow-sm cursor-pointer"><ListTodo size={20}/></button>
           <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border dark:border-gray-700 overflow-x-auto no-scrollbar">
              <button onClick={() => setActiveView('AUDIT')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeView === 'AUDIT' ? 'bg-white text-emerald-600 shadow-md' : 'text-gray-400'}`}>Audit</button>
              <button onClick={() => setActiveView('MASTER')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeView === 'MASTER' ? 'bg-white text-emerald-600 shadow-md' : 'text-gray-400'}`}>Master</button>
              <button onClick={() => setActiveView('OPNAME')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeView === 'OPNAME' ? 'bg-white text-orange-600 shadow-md' : 'text-gray-400'}`}>Opname</button>
              <button onClick={() => setActiveView('LOGS')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeView === 'LOGS' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}>Log</button>
              <button onClick={() => setActiveView('REPORT')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeView === 'REPORT' ? 'bg-white text-gray-800 shadow-md' : 'text-gray-400'}`}>Laporan</button>
           </div>
           <button onClick={() => { setAdjustData({itemId:'', qty:'', type:'IN', reason:''}); setShowAdjust(true); }} className="px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-black transition-all cursor-pointer flex items-center gap-2"><PlusCircle size={18}/> Mutasi Stok</button>
        </div>
      </div>

      {activeView === 'AUDIT' && (
        <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden"><div className="p-8 border-b dark:border-gray-800 flex justify-between items-center"><div className="relative max-w-md w-full"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Cari bahan baku..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-3 outline-none font-bold text-sm transition-all" /></div><div className="flex items-center gap-3"><span className="text-[10px] font-black uppercase text-gray-400">Total Nilai Stok:</span><span className="text-xl font-black text-emerald-600">{formatCurrency(auditData.reduce((s,i) => s+(i.sisaStok*(i.purchasePrice||0)), 0))}</span></div></div><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-5">Nama Bahan</th><th className="px-4 py-5 text-center">Awal</th><th className="px-4 py-5 text-center text-green-600">Masuk (+)</th><th className="px-4 py-5 text-center text-red-600">Keluar (-)</th><th className="px-4 py-5 text-center font-black text-gray-900 dark:text-white">Sisa Akhir</th><th className="px-8 py-5 text-right">Nilai Rupiah</th></tr></thead><tbody className="divide-y dark:divide-gray-800">{auditData.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (<tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors group text-xs"><td className="px-8 py-6"><p className="text-sm font-black text-gray-900 dark:text-white uppercase leading-none mb-1 group-hover:text-emerald-600 transition-colors">{item.name}</p><span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{item.category}</span></td><td className="px-4 py-6 text-center font-bold text-gray-400">{item.stokAwal} {item.unit}</td><td className="px-4 py-6 text-center font-bold text-green-600">+{item.masuk}</td><td className="px-4 py-6 text-center font-bold text-red-500">-{item.keluar}</td><td className="px-4 py-6 text-center"><span className={`px-4 py-1.5 rounded-xl font-black text-sm border shadow-sm ${item.sisaStok <= 5 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>{item.sisaStok} <span className="text-[10px] uppercase opacity-60 ml-1">{item.unit}</span></span></td><td className="px-8 py-6 text-right font-black text-gray-900 dark:text-white">{formatCurrency(item.sisaStok * (item.purchasePrice || 0))}</td></tr>))}</tbody></table></div></div>
      )}

      {/* MODAL SETTINGS (MENGGUNAKAN PROPS) */}
      {showReasonSettings && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 animate-fade-in no-print">
           <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowReasonSettings(false)} />
           <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-10 animate-scale-in border-t-8 border-orange-600">
              <div className="flex items-center justify-between mb-8"><h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3"><ListTodo size={24} className="text-orange-600" /> Master Alasan Mutasi</h3><button onClick={() => setShowReasonSettings(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"><X size={24}/></button></div>
              <div className="space-y-6">
                 <div className="flex gap-2">
                    <input type="text" value={newReasonName} onChange={e => setNewReasonName(e.target.value.toUpperCase())} placeholder="Alasan baru..." className="flex-1 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-black text-xs transition-all" />
                    <button onClick={() => { if(!newReasonName) return; setMutationReasons(p => [...new Set([...p, newReasonName.trim()])]); setNewReasonName(''); }} className="p-3 bg-orange-600 text-white rounded-xl active:scale-90 cursor-pointer"><Plus size={18}/></button>
                 </div>
                 <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2 space-y-2">{mutationReasons.map(r => (<div key={r} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl group border border-transparent hover:border-orange-500 transition-all"><span className="text-xs font-black uppercase tracking-widest">{r}</span><button onClick={() => setMutationReasons(prev => prev.filter(reason => reason !== r))} className="p-2 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-xl transition-all cursor-pointer"><Trash2 size={16}/></button></div>))}</div>
              </div>
           </div>
        </div>
      )}

      {/* FORM: MUTASI DENGAN ALASAN DARI PROPS */}
      {showAdjust && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-fade-in"><div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAdjust(false)} /><div className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-10 animate-scale-in border-t-8 border-indigo-600"><div className="flex items-center gap-4 mb-10"><div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl shadow-inner"><History size={24}/></div><h3 className="text-2xl font-black uppercase tracking-tighter">Formulir Mutasi Stok</h3></div><form onSubmit={handleAdjust} className="space-y-6"><div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Pilih Bahan Baku</label><select required value={adjustData.itemId} onChange={e => setAdjustData({...adjustData, itemId: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-5 outline-none font-black text-sm uppercase appearance-none cursor-pointer"><option value="">-- PILIH BAHAN --</option>{articles.map(i => <option key={i.id} value={i.id}>{i.name} (Sisa: {i.quantity || 0} {i.unit})</option>)}</select></div><div className="grid grid-cols-2 gap-6"><div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Tipe</label><div className="flex p-1 bg-gray-100 rounded-xl"><button type="button" onClick={() => setAdjustData({...adjustData, type:'IN'})} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase ${adjustData.type === 'IN' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400'}`}>Masuk</button><button type="button" onClick={() => setAdjustData({...adjustData, type:'OUT'})} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase ${adjustData.type === 'OUT' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400'}`}>Keluar</button></div></div><div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Qty</label><input required type="number" step="any" value={adjustData.qty} onChange={e => setAdjustData({...adjustData, qty: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 outline-none font-black text-xl shadow-inner" /></div></div>
                 {adjustData.type === 'OUT' && (<div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Tujuan Pengeluaran</label><div className="grid grid-cols-3 gap-3">{mutationReasons.map(r => (<button key={r} type="button" onClick={() => setAdjustData({...adjustData, reason: `PENGELUARAN ${r}`})} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${adjustData.reason === `PENGELUARAN ${r}` ? 'bg-orange-50 text-orange-600 border-orange-200 shadow-sm' : 'bg-white dark:bg-gray-900 text-gray-400 border-gray-100 dark:border-gray-800'}`}>{r}</button>))}</div></div>)}
                 <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Keterangan</label><textarea value={adjustData.reason} onChange={e => setAdjustData({...adjustData, reason: e.target.value.toUpperCase()})} placeholder="Catatan tambahan..." className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-5 outline-none font-medium text-xs h-24 resize-none shadow-inner" /></div><button type="submit" className={`w-full py-6 rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-xl text-white cursor-pointer ${adjustData.type === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>Simpan Mutasi</button></form></div></div>
      )}

      {/* VIEW: MASTER */}
      {activeView === 'MASTER' && (
        <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden animate-fade-in">
          <div className="p-8 border-b dark:border-gray-800 flex justify-between items-center">
             <h3 className="text-xl font-black uppercase tracking-tighter">Katalog Master Bahan</h3>
             <button onClick={() => { setEditingArticle(null); setFormData({name:'', category: (stockCategories[0]?.name || ''), quantity:0, unit: 'gr', purchasePrice: 0}); setShowForm(true); }} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-black transition-all flex items-center gap-2 cursor-pointer"><PlusCircle size={16}/> Registrasi Bahan Baru</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-8 py-5">Nama Barang</th>
                  <th className="px-6 py-5">Kategori</th>
                  <th className="px-6 py-5 text-right">Harga Satuan</th>
                  <th className="px-8 py-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-800">
                {articles.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="px-8 py-6 font-black uppercase text-gray-900 dark:text-white">{item.name}</td>
                    <td className="px-6 py-6"><span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-[9px] font-black uppercase">{item.category}</span></td>
                    <td className="px-6 py-6 text-right font-black text-indigo-600">{formatCurrency(item.purchasePrice)}</td>
                    <td className="px-8 py-6 text-center">
                       <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setEditingArticle(item); setFormData(item); setShowForm(true); }} className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl cursor-pointer transition-all"><Edit3 size={16}/></button>
                          <button onClick={() => { if(confirm('Hapus master bahan ini?')) setArticles(p => p.filter(i => i.id !== item.id)) }} className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl cursor-pointer transition-all"><Trash2 size={16}/></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: OPNAME */}
      {activeView === 'OPNAME' && (
        <div className="space-y-6">
           <div className="bg-orange-50 dark:bg-orange-900/10 border-2 border-dashed border-orange-200 dark:border-orange-800 p-10 rounded-[3rem] flex items-center gap-8 animate-slide-up">
              <div className="p-6 bg-orange-600 text-white rounded-[2rem] shadow-lg animate-pulse"><ScaleIcon size={32}/></div>
              <div className="flex-1">
                 <h3 className="text-2xl font-black text-orange-800 dark:text-orange-400 uppercase tracking-tighter leading-none">Stock Opname Bahan</h3>
                 <p className="text-sm font-medium text-orange-600/80 italic mt-2">Input jumlah fisik riil di gudang/station untuk audit selisih stok.</p>
              </div>
              <button onClick={executeOpname} className="px-12 py-5 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-orange-700 transition-all active:scale-95 cursor-pointer">Submit Laporan Opname</button>
           </div>
           <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                       <th className="px-8 py-5">Identitas Bahan</th>
                       <th className="px-6 py-5 text-center">Stok Sistem</th>
                       <th className="px-8 py-5 text-center w-72">Jumlah Fisik (Riil)</th>
                       <th className="px-6 py-5 text-center">Satuan</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y dark:divide-gray-800">
                    {articles.map(item => (
                       <tr key={item.id} className="hover:bg-orange-50/5 transition-colors">
                          <td className="px-8 py-6">
                             <p className="font-black uppercase text-gray-800 dark:text-gray-200">{item.name}</p>
                             <p className="text-[9px] font-bold text-gray-400 uppercase">{item.category}</p>
                          </td>
                          <td className="px-6 py-6 text-center font-bold text-gray-400">{item.quantity || 0} {item.unit}</td>
                          <td className="px-8 py-6 text-center">
                             <input 
                               type="number" step="any" placeholder="0"
                               value={opnameInputs[item.id] || ''}
                               onChange={e => setOpnameInputs({...opnameInputs, [item.id]: e.target.value})}
                               className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-orange-500 rounded-2xl px-6 py-4 outline-none text-center font-black text-xl shadow-inner transition-all"
                             />
                          </td>
                          <td className="px-6 py-6 text-center uppercase text-[10px] font-black text-gray-400">{item.unit}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* VIEW: LOGS */}
      {activeView === 'LOGS' && (
        <div className="space-y-6 animate-fade-in">
           <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border dark:border-gray-800 shadow-xl gap-6 no-print">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl shadow-inner"><History size={28}/></div>
                 <div><h3 className="text-xl font-black uppercase tracking-tighter leading-none">Log Aktivitas Stok</h3><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Rekam Jejak Mutasi Bahan Baku</p></div>
              </div>
              <div className="flex gap-3">
                 <button onClick={() => handleExportImage('stock-log-paper', 'Log_Stok')} disabled={isCapturing} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-xl hover:bg-emerald-700 transition-all cursor-pointer">
                    {isCapturing ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />} SIMPAN JPG
                 </button>
                 <button onClick={() => window.print()} className="px-8 py-4 bg-black text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-lg hover:bg-gray-800 transition-all cursor-pointer">
                    <Printer size={18} /> CETAK PDF
                 </button>
              </div>
           </div>

           <div id="stock-log-paper" className="bg-white text-black p-12 rounded-[2.5rem] border border-gray-100 shadow-none !min-h-[297mm] mx-auto w-full paper-preview">
              <div className="flex justify-between items-start mb-12 pb-10 border-b-[8px] border-black">
                 <div className="flex items-center gap-6">
                    {businessInfo.logoUrl ? <img src={businessInfo.logoUrl} className="h-20 w-auto object-contain" alt="Logo" /> : <div className="w-16 h-16 bg-black text-white rounded-xl flex items-center justify-center font-black text-2xl">LM</div>}
                    <div><h1 className="text-3xl font-black uppercase tracking-tighter leading-none">LEMBAH MANAH KOPI</h1><p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-2">Raw Material Stock Audit Logs</p></div>
                 </div>
                 <div className="text-right"><div className="bg-blue-600 text-white px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest mb-2">STOCK TRAIL</div><p className="text-[10px] font-bold text-gray-400 uppercase">PERIODE: {periodLabel.toUpperCase()}</p></div>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse border-4 border-black rounded-xl overflow-hidden">
                    <thead>
                       <tr className="bg-gray-100 text-black border-b-4 border-black font-black uppercase text-[10px] text-center">
                          <th className="p-4 border-r-2 border-black w-32">Waktu</th>
                          <th className="p-4 border-r-2 border-black text-left">Nama Bahan</th>
                          <th className="p-4 border-r-2 border-black w-24">Aksi</th>
                          <th className="p-4 border-r-2 border-black w-24">Mutasi</th>
                          <th className="p-4 text-left">Keterangan / Alasan</th>
                       </tr>
                    </thead>
                    <tbody className="text-[10px] font-bold uppercase">
                       {(logs || []).filter(l => articles.find(i => i.id === l.itemId)).map(log => {
                          const pos = isPositiveAction(log);
                          return (
                           <tr key={log.id} className="border-b-2 border-black last:border-b-0 hover:bg-gray-50/50 transition-colors">
                              <td className="p-3 text-center border-r-2 border-black font-mono text-gray-500">{new Date(log.timestamp).toLocaleString('id-ID', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'})}</td>
                              <td className="p-3 border-r-2 border-black font-black">{log.itemName}</td>
                              <td className="p-3 text-center border-r-2 border-black">
                                 <span className={`px-2 py-0.5 rounded font-black border border-black ${pos ? 'bg-green-100' : 'bg-red-100'}`}>
                                    {log.action}
                                 </span>
                              </td>
                              <td className={`p-3 text-center border-r-2 border-black font-black ${pos ? 'text-green-600' : 'text-red-600'}`}>
                                 {(pos ? '+' : '-') + log.qtyChange}
                              </td>
                              <td className="p-3 italic text-gray-500 normal-case">"{log.reason}"</td>
                           </tr>
                          );
                       })}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {/* VIEW: REPORT */}
      {activeView === 'REPORT' && (
        <div className="animate-fade-in space-y-8 no-scrollbar">
           <div className="sticky top-0 z-[60] bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b p-4 flex items-center justify-between no-print shadow-sm">
             <button onClick={() => setActiveView('AUDIT')} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 transition-all cursor-pointer"><X size={20}/></button>
             <div className="flex gap-3">
                <button onClick={() => handleExportImage('stock-report-paper', 'Audit_Stok')} disabled={isCapturing} className="px-8 py-3 bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-xl cursor-pointer">{isCapturing ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />} SIMPAN JPG</button>
                <button onClick={() => window.print()} className="px-8 py-3 bg-black text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-lg cursor-pointer"><Printer size={18} /> CETAK PDF</button>
             </div>
           </div>
           
           <div id="stock-report-paper" className="paper-preview bg-white text-black p-16 mx-auto border border-gray-100 shadow-none !min-h-[297mm]">
              <div className="flex justify-between items-start mb-12 pb-10 border-b-[8px] border-black">
                 <div className="flex items-center gap-6">
                    {businessInfo.logoUrl ? <img src={businessInfo.logoUrl} className="h-20 w-auto object-contain" alt="Logo" /> : <div className="w-16 h-16 bg-black text-white rounded-xl flex items-center justify-center font-black text-2xl">LM</div>}
                    <div><h1 className="text-3xl font-black uppercase tracking-tighter leading-none">LEMBAH MANAH KOPI</h1><p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-2">Monthly Inventory Reconciliation Audit</p></div>
                 </div>
                 <div className="text-right"><div className="bg-black text-white px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest mb-2">STOCK LEDGER</div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PERIODE: {periodLabel.toUpperCase()}</p></div>
              </div>

              <table className="w-full text-left border-collapse border-4 border-black overflow-hidden rounded-xl">
                 <thead>
                    <tr className="bg-gray-100 text-black border-b-4 border-black font-black uppercase text-[9px] text-center">
                       <th className="p-4 border-r-2 border-black w-10">No</th>
                       <th className="p-4 border-r-2 border-black text-left">Nama Bahan Baku</th>
                       <th className="p-4 border-r-2 border-black w-20">Awal</th>
                       <th className="p-4 border-r-2 border-black w-20">Masuk</th>
                       <th className="p-4 border-r-2 border-black w-20">Keluar</th>
                       <th className="p-4 w-28 text-center bg-gray-900 text-white">Saldo Akhir</th>
                    </tr>
                 </thead>
                 <tbody className="text-[10px] font-bold uppercase">
                    {auditData.map((item, idx) => (
                       <tr key={item.id} className="border-b-2 border-black last:border-b-0">
                          <td className="p-3 text-center border-r-2 border-black text-gray-400 font-mono">{idx + 1}</td>
                          <td className="p-3 border-r-2 border-black font-black">{item.name}</td>
                          <td className="p-3 text-center border-r-2 border-black bg-gray-50/50">{item.stokAwal}</td>
                          <td className="p-3 text-center border-r-2 border-black text-green-700">+{item.masuk}</td>
                          <td className="p-3 text-center border-r-2 border-black text-red-600">-{item.keluar}</td>
                          <td className="p-3 text-center font-black bg-gray-50">{item.sisaStok} {item.unit}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>

              <div className="mt-24 grid grid-cols-3 gap-10 text-center uppercase font-black">
                 <div><p className="text-[10px] text-gray-400 mb-20 tracking-widest">GUDANG (PIC)</p><div className="border-b-2 border-black w-full mb-1"></div><p className="text-[11px] font-black">STAFF LOGISTIK</p></div>
                 <div><p className="text-[10px] text-gray-400 mb-20 tracking-widest">VERIFIKASI</p><div className="border-b-2 border-black w-full mb-1"></div><p className="text-[11px] font-black">SUPERVISOR</p></div>
                 <div><p className="text-[10px] text-gray-400 mb-20 tracking-widest">MENYETUJUI</p><div className="border-b-2 border-black w-full mb-1"></div><p className="text-[11px] font-black">MANAGER</p></div>
              </div>

              <div className="mt-32 pt-10 border-t border-dashed border-gray-200 text-center"><p className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.5em]">LMK DIGITAL INFRASTRUCTURE STOCK AUDIT • GENERATED: {new Date().toLocaleString()}</p></div>
           </div>
        </div>
      )}

      {/* FORM: MASTER BAHAN */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-fade-in">
           <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowForm(false)} />
           <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-10 lg:p-14 animate-scale-in border-t-8 border-emerald-600 overflow-y-auto max-h-[90vh] custom-scrollbar">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-10">{editingArticle ? 'Edit Data Bahan' : 'Registrasi Bahan Baku Baru'}</h3>
              <form onSubmit={handleSaveMaster} className="space-y-8">
                 <div className="p-8 bg-gray-50 dark:bg-gray-800/50 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 space-y-6">
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Nama Bahan Baku</label><input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} placeholder="BIJI KOPI / AYAM / BERAS..." className="w-full bg-white dark:bg-gray-950 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-6 py-4 outline-none font-black text-sm uppercase shadow-sm transition-all" /></div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Kategori Bahan</label><select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-white dark:bg-gray-950 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-6 py-4 outline-none font-black text-xs uppercase appearance-none cursor-pointer">{stockCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}<option value="BAHAN BAKU">BAHAN BAKU</option></select></div>
                       <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Satuan</label><select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full bg-white dark:bg-gray-950 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-6 py-4 outline-none font-black text-[10px] uppercase appearance-none cursor-pointer">{units.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}</select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 pt-4 border-t dark:border-gray-700">
                       <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Saldo Awal (Bulan Ini)</label><input type="number" step="any" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})} className="w-full bg-white dark:bg-gray-950 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-6 py-4 outline-none font-black text-xl shadow-inner" /></div>
                       <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Harga Master (Estimasi)</label><input type="text" value={formData.purchasePrice ? formData.purchasePrice.toLocaleString('id-ID') : ''} onChange={e => setFormData({...formData, purchasePrice: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0})} placeholder="0" className="w-full bg-white dark:bg-gray-950 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-6 py-4 outline-none font-black text-xl shadow-inner" /></div>
                    </div>
                 </div>
                 <button type="submit" className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95 cursor-pointer">Simpan Ke Master Bahan</button>
              </form>
           </div>
        </div>
      )}

      {/* MASTER MODALS: UNIT & CATEGORY */}
      {showUnitSettings && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 animate-fade-in no-print">
           <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowUnitSettings(false)} />
           <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-10 animate-scale-in border-t-8 border-indigo-600">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3"><Settings size={24} className="text-indigo-600" /> Master Satuan</h3>
                 <button onClick={() => setShowUnitSettings(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"><X size={24}/></button>
              </div>
              <div className="space-y-6">
                 <div className="flex gap-2">
                    <input type="text" value={newUnitName} onChange={e => setNewUnitName(e.target.value.toLowerCase())} placeholder="satuan baru..." className="flex-1 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-xl px-4 py-3 outline-none font-black text-xs lowercase" />
                    <button onClick={() => { if(!newUnitName) return; setUnits(p => [...new Set([...p, newUnitName])]); setNewUnitName(''); }} className="p-3 bg-indigo-600 text-white rounded-xl active:scale-90 cursor-pointer"><Plus size={18}/></button>
                 </div>
                 <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
                    {units.map(u => (
                       <div key={u} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl group border border-transparent hover:border-indigo-500 transition-all"><span className="text-xs font-black uppercase tracking-widest">{u}</span><button onClick={() => { if(confirm(`Hapus satuan "${u}"?`)) setUnits(prev => prev.filter(unit => unit !== u)); }} className="p-2 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-xl transition-all cursor-pointer"><Trash2 size={16}/></button></div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {showCategorySettings && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 animate-fade-in no-print">
           <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowCategorySettings(false)} />
           <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-10 animate-scale-in border-t-8 border-emerald-600">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3"><FolderTree size={24} className="text-emerald-600" /> Master Kategori</h3>
                 <button onClick={() => setShowCategorySettings(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"><X size={24}/></button>
              </div>
              <div className="space-y-6">
                 <div className="flex gap-2">
                    <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value.toUpperCase())} placeholder="Kategori baru..." className="flex-1 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 rounded-xl px-4 py-3 outline-none font-black text-xs transition-all" />
                    <button onClick={() => { if(!newCategoryName) return; setCategories(p => [...p, { id: `cat-${Date.now()}`, name: newCategoryName, type: 'RAW_MATERIAL' }]); setNewCategoryName(''); }} className="p-3 bg-emerald-600 text-white rounded-xl active:scale-90 cursor-pointer"><Plus size={18}/></button>
                 </div>
                 <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
                    {stockCategories.map(c => (
                       <div key={c.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl group border border-transparent hover:border-emerald-500 transition-all"><span className="text-xs font-black uppercase tracking-widest">{c.name}</span><button onClick={() => { if(confirm(`Hapus kategori "${c.name}"?`)) setCategories(prev => prev.filter(cat => cat.id !== c.id)); }} className="p-2 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-xl transition-all cursor-pointer"><Trash2 size={16}/></button></div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default StockAuditManager;
