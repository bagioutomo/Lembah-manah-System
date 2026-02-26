import React, { useState, useMemo, useEffect } from 'react';
import { 
  Box, PlusCircle, Search, Edit3, Trash2, Save, X, Tag, Package, 
  Info, TrendingUp, ShieldCheck, Settings, FolderTree, ChevronDown,
  Scale as ScaleIcon, History, Printer, ImageIcon, Loader2, ClipboardList,
  AlertTriangle, CheckCircle2, RotateCcw, Plus, MinusCircle, 
  ArrowUpCircle, ArrowDownCircle, Database, FileText, LayoutGrid,
  TrendingDown, Coins, Calculator, Layers, FileCheck
} from 'lucide-react';
import { InventoryItem, InventoryLog, InventoryCategoryConfig } from '../types';
import { storage } from '../services/storageService';
import html2canvas from 'html2canvas';

type AssetView = 'AUDIT' | 'MASTER' | 'OPNAME' | 'LOGS' | 'REPORT';

interface Props {
  inventoryItems: InventoryItem[];
  setInventoryItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

const AssetInventoryManager: React.FC<Props> = ({ inventoryItems, setInventoryItems }) => {
  const [activeView, setActiveView] = useState<AssetView>('AUDIT');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showUnitSettings, setShowUnitSettings] = useState(false);
  const [showCategorySettings, setShowCategorySettings] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Global Context
  const now = new Date();
  const [globalMonth] = useState(now.getMonth());
  const [globalYear] = useState(now.getFullYear());

  // Master Data States
  const [categories, setCategories] = useState<InventoryCategoryConfig[]>(storage.getInventoryCategories());
  const [units, setUnits] = useState<string[]>(storage.getUnits());
  const [newUnitName, setNewUnitName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [logs, setLogs] = useState<InventoryLog[]>(storage.getInventoryLogs());
  const businessInfo = useMemo(() => storage.getBusinessInfo(), []);

  const assetCategories = useMemo(() => categories.filter(c => c.type === 'ASSET'), [categories]);
  
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '', category: '', quantity: 0, unit: 'unit', condition: 'GOOD', unitPrice: 0, notes: ''
  });

  const [adjustData, setAdjustData] = useState({
    itemId: '', qty: '', type: 'IN' as 'IN' | 'OUT' | 'DAMAGE' | 'LOSS', reason: ''
  });

  const [opnameInputs, setOpnameInputs] = useState<Record<string, string>>({});

  useEffect(() => { storage.setUnits(units); }, [units]);
  useEffect(() => { storage.setInventoryCategories(categories); }, [categories]);

  const auditData = useMemo(() => {
    const startOfPeriod = new Date(globalYear, globalMonth, 1);
    const endOfPeriod = new Date(globalYear, globalMonth + 1, 0, 23, 59, 59);

    return inventoryItems.filter(item => item.type === 'ASSET').map(item => {
      const itemLogs = (logs || []).filter(l => l.itemId === item.id);
      const logsBefore = itemLogs.filter(l => new Date(l.timestamp) < startOfPeriod);
      let stokAwal = 0;
      logsBefore.forEach(l => {
        if (['IN', 'CREATE', 'ADJUST'].includes(l.action)) stokAwal += l.qtyChange;
        else if (['OUT', 'DAMAGE', 'LOSS', 'DELETE'].includes(l.action)) stokAwal -= l.qtyChange;
      });
      const logsThisMonth = itemLogs.filter(l => {
        const d = new Date(l.timestamp);
        return d >= startOfPeriod && d <= endOfPeriod;
      });
      let masuk = 0;
      let keluar = 0;
      logsThisMonth.forEach(l => {
        if (['IN', 'CREATE', 'ADJUST'].includes(l.action)) masuk += l.qtyChange;
        else if (['OUT', 'DAMAGE', 'LOSS', 'DELETE'].includes(l.action)) keluar += l.qtyChange;
      });
      const sisaAkhir = stokAwal + masuk - keluar;
      const totalValue = sisaAkhir * (item.unitPrice || 0);
      return { ...item, stokAwal, masuk, keluar, sisaAkhir, totalValue };
    });
  }, [inventoryItems, logs, globalMonth, globalYear]);

  const totalAssetValuation = useMemo(() => {
    return auditData.reduce((sum, item) => sum + item.totalValue, 0);
  }, [auditData]);

  const handleSaveMaster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    const itemId = editingItem?.id || `ast-${Date.now()}`;
    const isNew = !editingItem;
    const qtyVal = Number(formData.quantity) || 0;
    const newItem = { ...formData, id: itemId, type: 'ASSET', lastUpdated: new Date().toISOString() } as InventoryItem;
    setInventoryItems(prev => isNew ? [...prev, newItem] : prev.map(i => i.id === itemId ? newItem : i));
    const newLog: InventoryLog = {
      id: `log-ast-${Date.now()}`, itemId, itemName: formData.name!.toUpperCase(),
      action: isNew ? 'CREATE' : 'ADJUST', 
      qtyChange: isNew ? qtyVal : Math.abs(qtyVal - (editingItem?.quantity || 0)), 
      previousQty: editingItem?.quantity || 0, 
      newQty: qtyVal,
      reason: isNew ? 'Registrasi Aset Baru' : 'Koreksi Data Master', 
      timestamp: new Date().toISOString()
    };
    const updatedLogs = [newLog, ...(logs || [])];
    setLogs(updatedLogs);
    storage.setInventoryLogs(updatedLogs);
    setShowForm(false);
    setEditingItem(null);
  };

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    const item = inventoryItems.find(i => i.id === adjustData.itemId);
    if (!item || !adjustData.qty) return;
    const change = Number(adjustData.qty);
    let newQty = item.quantity;
    let finalCondition = item.condition;
    if (adjustData.type === 'IN') newQty += change;
    else {
      newQty = Math.max(0, item.quantity - change);
      if (adjustData.type === 'DAMAGE') finalCondition = 'DAMAGED';
      if (adjustData.type === 'LOSS') finalCondition = 'MISSING';
    }
    setInventoryItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty, condition: finalCondition, lastUpdated: new Date().toISOString() } : i));
    const newLog: InventoryLog = {
      id: `log-mut-ast-${Date.now()}`, itemId: item.id, itemName: item.name,
      action: adjustData.type, qtyChange: change, previousQty: item.quantity, newQty,
      reason: adjustData.reason || 'Mutasi Rutin Aset', timestamp: new Date().toISOString()
    };
    const updatedLogs = [newLog, ...(logs || [])];
    setLogs(updatedLogs);
    storage.setInventoryLogs(updatedLogs);
    setShowAdjust(false);
    setAdjustData({ itemId: '', qty: '', type: 'IN', reason: '' });
  };

  const executeOpname = () => {
    if (Object.keys(opnameInputs).length === 0) return alert('Input jumlah fisik terlebih dahulu!');
    const updatedItems = [...inventoryItems];
    const newLogs: InventoryLog[] = [];
    const now = new Date().toISOString();
    Object.entries(opnameInputs).forEach(([id, physicalVal]) => {
      const itemIndex = updatedItems.findIndex(i => i.id === id);
      if (itemIndex > -1) {
        const item = updatedItems[itemIndex];
        const physicalQty = parseFloat(physicalVal as string);
        const difference = physicalQty - item.quantity;
        if (difference !== 0) {
           newLogs.push({
             id: `log-opn-ast-${Date.now()}-${id}`, itemId: item.id, itemName: item.name,
             action: 'ADJUST', qtyChange: Math.abs(difference), previousQty: item.quantity, newQty: physicalQty,
             reason: `AUDIT OPNAME: Selisih ${difference > 0 ? '+' : ''}${difference} ${item.unit}`, timestamp: now
           });
           updatedItems[itemIndex] = { ...item, quantity: physicalQty, lastUpdated: now };
        }
      }
    });
    if (newLogs.length > 0) {
      setInventoryItems(updatedItems);
      const updatedLogsList = [...newLogs, ...(logs || [])];
      setLogs(updatedLogsList);
      storage.setInventoryLogs(updatedLogsList);
      setOpnameInputs({});
      alert(`Opname Berhasil!`);
    } else alert('Tidak ada selisih.');
  };

  const handleExportImage = async (id: string, name: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    try {
      setIsCapturing(true);
      await new Promise<void>(resolve => setTimeout(() => resolve(), 800));
      const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.download = `${name}_${Date.now()}.jpg`;
      link.click();
    } finally {
      setIsCapturing(false);
    }
  };

  const formatCurrency = (val: number) => 'Rp ' + Math.round(val || 0).toLocaleString('id-ID');

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const periodLabel = `${months[globalMonth]} ${globalYear}`;

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      {/* HEADER UTAMA */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-5">
          <div className="p-5 bg-indigo-700 text-white rounded-[1.8rem] shadow-2xl">
            <Box size={32}/>
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Audit & Inventaris</h2>
            <p className="text-sm text-gray-500 font-medium italic mt-2">Manajemen kekayaan aset dan properti Lembah Manah.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
           <button onClick={() => setShowUnitSettings(true)} className="p-4 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-2xl border hover:text-indigo-600 transition-all shadow-sm cursor-pointer" title="Master Satuan"><Settings size={20}/></button>
           <button onClick={() => setShowCategorySettings(true)} className="p-4 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-2xl border hover:text-emerald-600 transition-all shadow-sm cursor-pointer" title="Master Kategori"><FolderTree size={20}/></button>
           
           <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border dark:border-gray-700 overflow-x-auto no-scrollbar">
              <button onClick={() => setActiveView('AUDIT')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap ${activeView === 'AUDIT' ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-md' : 'text-gray-400'}`}>Audit</button>
              <button onClick={() => setActiveView('MASTER')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap ${activeView === 'MASTER' ? 'bg-white dark:bg-gray-900 text-emerald-600 shadow-md' : 'text-gray-400'}`}>Master</button>
              <button onClick={() => setActiveView('OPNAME')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap ${activeView === 'OPNAME' ? 'bg-white dark:bg-gray-900 text-orange-600 shadow-md' : 'text-gray-400'}`}>Opname</button>
              <button onClick={() => setActiveView('LOGS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap ${activeView === 'LOGS' ? 'bg-white dark:bg-gray-900 text-blue-600 shadow-md' : 'text-gray-400'}`}>Log</button>
              <button onClick={() => setActiveView('REPORT')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap ${activeView === 'REPORT' ? 'bg-white dark:bg-gray-900 text-gray-800 shadow-md' : 'text-gray-400'}`}>Laporan</button>
           </div>
           <button onClick={() => { setAdjustData({itemId:'', qty:'', type:'IN', reason:''}); setShowAdjust(true); }} className="px-8 py-4 bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-black transition-all cursor-pointer flex items-center gap-2"><PlusCircle size={18}/> Mutasi Aset</button>
        </div>
      </div>

      {/* VIEW: AUDIT */}
      {activeView === 'AUDIT' && (
        <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 flex items-center gap-6">
                 <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><TrendingUp size={28}/></div>
                 <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Valuasi Kekayaan Aset</p><h4 className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(totalAssetValuation)}</h4></div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 flex items-center gap-6">
                 <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Package size={28}/></div>
                 <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Unit Aset</p><h4 className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{auditData.length} Item</h4></div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 flex items-center gap-6">
                 <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl"><AlertTriangle size={28}/></div>
                 <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Aset Bermasalah (Rusak)</p><h4 className="text-2xl font-black text-rose-700 dark:text-rose-400">{inventoryItems.filter(i => i.condition === 'DAMAGED').length} Unit</h4></div>
              </div>
           </div>

           <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden">
             <div className="p-8 border-b dark:border-gray-800">
                <div className="relative max-w-md w-full">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   <input type="text" placeholder="Cari nama aset..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl pl-12 pr-6 py-3 outline-none font-bold text-sm transition-all shadow-inner" />
                </div>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead>
                   <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                     <th className="px-8 py-5">Nama Aset</th>
                     <th className="px-4 py-5 text-center">Awal Bulan</th>
                     <th className="px-4 py-5 text-center text-green-600">Masuk (+)</th>
                     <th className="px-4 py-5 text-center text-red-600">Keluar (-)</th>
                     <th className="px-4 py-5 text-center font-black text-gray-900 dark:text-white">Saldo Akhir</th>
                     <th className="px-8 py-5 text-right">Nilai Rupiah</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y dark:divide-gray-800">
                   {auditData.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
                     <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors group">
                       <td className="px-8 py-6">
                         <p className="text-sm font-black text-gray-900 dark:text-white uppercase leading-none mb-1 group-hover:text-indigo-600 transition-colors">{item.name}</p>
                         <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{item.category}</span>
                       </td>
                       <td className="px-4 py-6 text-center font-bold text-gray-400">{item.stokAwal} {item.unit}</td>
                       <td className="px-4 py-6 text-center font-bold text-green-600">+{item.masuk}</td>
                       <td className="px-4 py-6 text-center font-bold text-red-500">-{item.keluar}</td>
                       <td className="px-4 py-6 text-center">
                         <span className={`px-4 py-1.5 rounded-xl font-black text-sm border shadow-sm ${item.condition === 'DAMAGED' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                           {item.sisaAkhir} <span className="text-[10px] uppercase opacity-60 ml-1">{item.unit}</span>
                         </span>
                       </td>
                       <td className="px-8 py-6 text-right font-black text-gray-900 dark:text-white">{formatCurrency(item.totalValue)}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        </div>
      )}

      {/* VIEW: LOGS */}
      {activeView === 'LOGS' && (
        <div className="space-y-6 animate-fade-in">
           <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border dark:border-gray-800 shadow-xl gap-6 no-print">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl shadow-inner"><History size={28}/></div>
                 <div><h3 className="text-xl font-black uppercase tracking-tighter leading-none">Activity Trail Aset</h3><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Audit Mutasi Barang Per Periode</p></div>
              </div>
              <div className="flex gap-3">
                 <button onClick={() => handleExportImage('asset-log-paper', 'Log_Aset')} disabled={isCapturing} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-xl hover:bg-emerald-700 transition-all cursor-pointer">
                    {isCapturing ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />} SIMPAN JPG
                 </button>
                 <button onClick={() => window.print()} className="px-8 py-4 bg-black text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-lg hover:bg-gray-800 transition-all cursor-pointer">
                    <Printer size={18} /> CETAK PDF
                 </button>
              </div>
           </div>

           <div id="asset-log-paper" className="bg-white text-black p-12 rounded-[2.5rem] border border-gray-100 shadow-none !min-h-[297mm] mx-auto w-full print:border-none print:shadow-none paper-preview">
              <div className="flex justify-between items-start mb-12 pb-10 border-b-[8px] border-black">
                 <div className="flex items-center gap-6">
                    {businessInfo.logoUrl ? <img src={businessInfo.logoUrl} className="h-20 w-auto object-contain" alt="Logo" /> : <div className="w-16 h-16 bg-black text-white rounded-xl flex items-center justify-center font-black text-2xl">LM</div>}
                    <div><h1 className="text-3xl font-black uppercase tracking-tighter leading-none">LEMBAH MANAH KOPI</h1><p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-2">Asset Inventory Activity Audit Logs</p></div>
                 </div>
                 <div className="text-right"><div className="bg-blue-600 text-white px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest mb-2">AUDIT TRAIL</div><p className="text-[10px] font-bold text-gray-400 uppercase">PERIODE: {periodLabel.toUpperCase()}</p></div>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse border-4 border-black rounded-xl overflow-hidden">
                    <thead>
                       <tr className="bg-gray-100 text-black border-b-4 border-black font-black uppercase text-[10px] text-center">
                          <th className="p-4 border-r-2 border-black w-32">Waktu</th>
                          <th className="p-4 border-r-2 border-black text-left">Nama Barang</th>
                          <th className="p-4 border-r-2 border-black w-24">Aksi</th>
                          <th className="p-4 border-r-2 border-black w-24">Mutasi</th>
                          <th className="p-4 text-left">Berita Acara / Catatan</th>
                       </tr>
                    </thead>
                    <tbody className="text-[10px] font-bold uppercase">
                       {(logs || []).filter(l => inventoryItems.find(i => i.id === l.itemId)?.type === 'ASSET').map(log => {
                          const pos = ['IN', 'CREATE'].includes(log.action) || (log.action === 'ADJUST' && log.newQty >= log.previousQty);
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
                       {(logs || []).filter(l => inventoryItems.find(i => i.id === l.itemId)?.type === 'ASSET').length === 0 && (
                         <tr><td colSpan={5} className="p-20 text-center text-gray-300 italic uppercase">Belum ada aktivitas terekam</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>

              <div className="mt-24 grid grid-cols-2 gap-20 text-center uppercase font-black">
                 <div><p className="text-[10px] text-gray-400 mb-20 tracking-widest">DICATAT OLEH</p><div className="border-b-2 border-black w-full mb-1"></div><p className="text-[11px] font-black">ADMINISTRASI</p></div>
                 <div><p className="text-[10px] text-gray-400 mb-20 tracking-widest">DIVERIFIKASI</p><div className="border-b-2 border-black w-full mb-1"></div><p className="text-[11px] font-black">MANAGER</p></div>
              </div>

              <div className="mt-32 pt-10 border-t border-dashed border-gray-200 text-center"><p className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.5em]">LMK DIGITAL INFRASTRUCTURE ASSET LOG ENGINE • GENERATED: {new Date().toLocaleString()}</p></div>
           </div>
        </div>
      )}

      {/* VIEW: MASTER DATA */}
      {activeView === 'MASTER' && (
        <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden animate-fade-in">
          <div className="p-8 border-b dark:border-gray-800 flex justify-between items-center">
             <h3 className="text-xl font-black uppercase tracking-tighter">Katalog Master Aset</h3>
             <button onClick={() => { setEditingItem(null); setFormData({name:'', category: (assetCategories[0]?.name || ''), quantity:0, unit: 'unit', unitPrice: 0, notes: ''}); setShowForm(true); }} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-black transition-all flex items-center gap-2 cursor-pointer"><PlusCircle size={16}/> Registrasi Aset Baru</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-8 py-5">Nama Barang</th>
                  <th className="px-6 py-5">Kategori</th>
                  <th className="px-4 py-5 text-center">Kondisi</th>
                  <th className="px-6 py-5 text-right">Harga Satuan</th>
                  <th className="px-8 py-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-800">
                {inventoryItems.filter(i => i.type === 'ASSET').map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="px-8 py-6 font-black uppercase text-gray-900 dark:text-white">{item.name}</td>
                    <td className="px-6 py-6"><span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-[9px] font-black uppercase">{item.category}</span></td>
                    <td className="px-4 py-6 text-center">
                       <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${item.condition === 'GOOD' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{item.condition}</span>
                    </td>
                    <td className="px-6 py-6 text-right font-black text-indigo-600">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-8 py-6 text-center">
                       <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setEditingItem(item); setFormData(item); setShowForm(true); }} className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl cursor-pointer transition-all"><Edit3 size={16}/></button>
                          <button onClick={() => { if(confirm('Hapus master aset ini?')) setInventoryItems(p => p.filter(i => i.id !== item.id)) }} className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl cursor-pointer transition-all"><Trash2 size={16}/></button>
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
                 <h3 className="text-2xl font-black text-orange-800 dark:text-orange-400 uppercase tracking-tighter leading-none">Rekonsiliasi Fisik Aset</h3>
                 <p className="text-sm font-medium text-orange-600/80 italic mt-2">Input jumlah riil aset saat ini untuk audit. Sistem akan menghitung kerugian otomatis.</p>
              </div>
              <button onClick={executeOpname} className="px-12 py-5 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-orange-700 transition-all active:scale-95 cursor-pointer">Selesaikan Audit Fisik</button>
           </div>
           <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                       <th className="px-8 py-5">Identitas Aset</th>
                       <th className="px-6 py-5 text-center">Stok Sistem</th>
                       <th className="px-8 py-5 text-center w-72">Jumlah Riil (Fisik)</th>
                       <th className="px-6 py-5 text-center">Satuan</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y dark:divide-gray-800">
                    {inventoryItems.filter(i => i.type === 'ASSET').map(item => (
                       <tr key={item.id} className="hover:bg-orange-50/5 transition-colors">
                          <td className="px-8 py-6">
                             <p className="font-black uppercase text-gray-800 dark:text-gray-200">{item.name}</p>
                             <p className="text-[9px] font-bold text-gray-400 uppercase">{item.condition}</p>
                          </td>
                          <td className="px-6 py-6 text-center font-bold text-gray-400">{item.quantity} {item.unit}</td>
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

      {/* VIEW: REPORT (AUDIT NILAI ASET) */}
      {activeView === 'REPORT' && (
        <div className="animate-fade-in space-y-8 no-scrollbar">
           <div className="sticky top-0 z-[60] bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b p-4 flex items-center justify-between no-print shadow-sm">
             <button onClick={() => setActiveView('AUDIT')} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 transition-all cursor-pointer"><X size={20}/></button>
             <div className="flex gap-3">
                <button onClick={() => handleExportImage('asset-audit-paper', 'Audit_Aset')} disabled={isCapturing} className="px-8 py-3 bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-xl cursor-pointer">{isCapturing ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />} SIMPAN JPG</button>
                <button onClick={() => window.print()} className="px-8 py-3 bg-black text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-lg cursor-pointer"><Printer size={18} /> CETAK PDF</button>
             </div>
           </div>
           
           <div id="asset-audit-paper" className="paper-preview bg-white text-black p-16 mx-auto border border-gray-100 shadow-none !min-h-[297mm]">
              <div className="flex justify-between items-start mb-12 pb-10 border-b-[8px] border-black">
                 <div className="flex items-center gap-6">
                    {businessInfo.logoUrl ? <img src={businessInfo.logoUrl} className="h-20 w-auto object-contain" alt="Logo" /> : <div className="w-16 h-16 bg-black text-white rounded-xl flex items-center justify-center font-black text-2xl">LM</div>}
                    <div><h1 className="text-3xl font-black uppercase tracking-tighter leading-none">LEMBAH MANAH KOPI</h1><p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-2">Asset Inventory Audit & Property Valuation</p></div>
                 </div>
                 <div className="text-right"><div className="bg-black text-white px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest mb-2">ASSET LEDGER</div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TANGGAL: {new Date().toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric'})}</p></div>
              </div>

              <table className="w-full text-left border-collapse border-4 border-black overflow-hidden rounded-xl">
                 <thead>
                    <tr className="bg-gray-100 text-black border-b-4 border-black font-black uppercase text-[9px] text-center">
                       <th className="p-4 border-r-2 border-black w-10">No</th>
                       <th className="p-4 border-r-2 border-black text-left">Deskripsi Aset / Peralatan</th>
                       <th className="p-4 border-r-2 border-black w-24">Kondisi</th>
                       <th className="p-4 border-r-2 border-black w-20">Jumlah</th>
                       <th className="p-4 border-r-2 border-black w-28 text-right">Harga Unit</th>
                       <th className="p-4 w-32 text-right bg-gray-900 text-white">Nilai Total</th>
                    </tr>
                 </thead>
                 <tbody className="text-[10px] font-bold uppercase">
                    {auditData.map((item, idx) => (
                       <tr key={item.id} className="border-b-2 border-black last:border-b-0">
                          <td className="p-3 text-center border-r-2 border-black text-gray-400 font-mono">{idx + 1}</td>
                          <td className="p-3 border-r-2 border-black">
                             <p className="font-black text-[11px] leading-none mb-1">{item.name}</p>
                             <p className="text-[7px] text-gray-400 tracking-widest">{item.category}</p>
                          </td>
                          <td className="p-3 text-center border-r-2 border-black">
                             <span className={`px-2 py-0.5 rounded font-black border-2 border-black ${item.condition === 'GOOD' ? 'bg-green-100' : 'bg-red-100'}`}>{item.condition}</span>
                          </td>
                          <td className="p-3 text-center border-r-2 border-black bg-gray-50/50 font-black">{item.sisaAkhir} {item.unit}</td>
                          <td className="p-3 text-right border-r-2 border-black text-gray-500">{item.unitPrice.toLocaleString('id-ID')}</td>
                          <td className="p-3 text-right font-black bg-gray-50">{item.totalValue.toLocaleString('id-ID')}</td>
                       </tr>
                    ))}
                 </tbody>
                 <tfoot>
                    <tr className="bg-black text-white font-black uppercase text-[10px]">
                       <td colSpan={5} className="p-4 text-right tracking-[0.3em]">Total Nilai Seluruh Aset Terdata</td>
                       <td className="p-4 text-right text-base text-emerald-400">
                          {formatCurrency(totalAssetValuation)}
                       </td>
                    </tr>
                 </tfoot>
              </table>

              <div className="mt-24 grid grid-cols-2 gap-20 text-center uppercase font-black">
                 <div><p className="text-[10px] text-gray-400 mb-20 tracking-widest">DIBUAT OLEH (LOGISTIK)</p><div className="border-b-2 border-black w-full mb-1"></div><p className="text-[11px] font-black">ADMINISTRASI</p></div>
                 <div><p className="text-[10px] text-gray-400 mb-20 tracking-widest">MENGETAHUI (OWNER)</p><div className="border-b-2 border-black w-full mb-1"></div><p className="text-[11px] font-black">{businessInfo.ownerName || 'DEDY SASMITO'}</p></div>
              </div>

              <div className="mt-32 pt-10 border-t border-dashed border-gray-200 text-center"><p className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.5em]">LMK DIGITAL INFRASTRUCTURE ASSET ENGINE • GENERATED: {new Date().toLocaleString()}</p></div>
           </div>
        </div>
      )}

      {/* FORM: MASTER ASET */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-fade-in">
           <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowForm(false)} />
           <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-10 lg:p-14 animate-scale-in border-t-8 border-indigo-700 overflow-y-auto max-h-[90vh] custom-scrollbar">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-10">{editingItem ? 'Edit Data Aset' : 'Registrasi Aset Baru'}</h3>
              <form onSubmit={handleSaveMaster} className="space-y-8">
                 <div className="p-8 bg-gray-50 dark:bg-gray-800/50 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 space-y-6">
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Nama Barang / Properti</label><input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} placeholder="MESIN ESPRESSO / MEJA CAFE..." className="w-full bg-white dark:bg-gray-950 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 outline-none font-black text-sm uppercase shadow-sm transition-all" /></div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Kategori Aset</label><select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-white dark:bg-gray-950 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 outline-none font-black text-xs uppercase appearance-none cursor-pointer">{assetCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}<option value="UMUM">UMUM</option></select></div>
                       <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Satuan</label><select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full bg-white dark:bg-gray-950 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 outline-none font-black text-[10px] uppercase appearance-none cursor-pointer">{units.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}</select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 pt-4 border-t dark:border-gray-700">
                       <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Saldo Awal (Registrasi)</label><input type="number" step="any" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})} className="w-full bg-white dark:bg-gray-950 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 outline-none font-black text-xl shadow-inner" /></div>
                       <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Harga Beli per Unit</label><input type="text" value={formData.unitPrice ? formData.unitPrice.toLocaleString('id-ID') : ''} onChange={e => setFormData({...formData, unitPrice: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0})} placeholder="0" className="w-full bg-white dark:bg-gray-950 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 outline-none font-black text-xl shadow-inner" /></div>
                    </div>
                    <div className="space-y-2 pt-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Kondisi Saat Ini</label><select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value as any})} className="w-full bg-white dark:bg-gray-950 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 outline-none font-black text-xs uppercase appearance-none cursor-pointer"><option value="GOOD">BAIK / NORMAL</option><option value="DAMAGED">RUSAK / BUTUH SERVIS</option><option value="MISSING">HILANG / TIDAK ADA</option></select></div>
                 </div>
                 <button type="submit" className="w-full py-6 bg-indigo-700 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95 cursor-pointer">Simpan Ke Master Aset</button>
              </form>
           </div>
        </div>
      )}

      {/* FORM: MUTASI */}
      {showAdjust && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-fade-in">
           <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAdjust(false)} />
           <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-10 lg:p-14 animate-scale-in border-t-8 border-blue-600">
              <div className="flex items-center gap-4 mb-10"><div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl shadow-inner"><History size={24}/></div><h3 className="text-2xl font-black uppercase tracking-tighter">Mutasi Kondisi Aset</h3></div>
              <form onSubmit={handleAdjust} className="space-y-6">
                 <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Pilih Aset</label><select required value={adjustData.itemId} onChange={e => setAdjustData({...adjustData, itemId: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-5 outline-none font-black text-sm uppercase appearance-none cursor-pointer"><option value="">-- PILIH ASET --</option>{inventoryItems.filter(i => i.type === 'ASSET').map(i => <option key={i.id} value={i.id}>{i.name} (Saldo: {i.quantity} {i.unit})</option>)}</select></div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase ml-4">Tipe Mutasi</label>
                       <select value={adjustData.type} onChange={e => setAdjustData({...adjustData, type: e.target.value as any})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 outline-none font-black text-xs appearance-none">
                          <option value="IN">PENGADAAN BARU (+)</option>
                          <option value="OUT">PENGURANGAN (-)</option>
                          <option value="DAMAGE">AFKIR / RUSAK (-)</option>
                          <option value="LOSS">HILANG (-)</option>
                       </select>
                    </div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Kuantitas</label><input required type="number" step="any" placeholder="0" value={adjustData.qty} onChange={e => setAdjustData({...adjustData, qty: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 outline-none font-black text-xl shadow-inner" /></div>
                 </div>
                 <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Keterangan / Alasan</label><textarea value={adjustData.reason} onChange={e => setAdjustData({...adjustData, reason: e.target.value.toUpperCase()})} placeholder="ALASAN MUTASI..." className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-5 outline-none font-medium text-xs h-24 resize-none shadow-inner" /></div>
                 <button type="submit" className={`w-full py-6 rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 text-white cursor-pointer bg-blue-600 hover:bg-blue-700`}>Simpan Mutasi Aset</button>
              </form>
           </div>
        </div>
      )}

      {/* MASTER MODALS */}
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
                 <button onClick={() => setShowCategorySettings(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer"><X size={24}/></button>
              </div>
              <div className="space-y-6">
                 <div className="flex gap-2">
                    <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value.toUpperCase())} placeholder="Kategori baru..." className="flex-1 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 rounded-xl px-4 py-3 outline-none font-black text-xs transition-all" />
                    <button onClick={() => { if(!newCategoryName) return; setCategories(p => [...p, { id: `cat-${Date.now()}`, name: newCategoryName, type: 'ASSET' }]); setNewCategoryName(''); }} className="p-3 bg-emerald-600 text-white rounded-xl active:scale-90 cursor-pointer"><Plus size={18}/></button>
                 </div>
                 <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
                    {assetCategories.map(c => (
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

export default AssetInventoryManager;