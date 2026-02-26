import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Search, Trash2, Edit3, Save, History, RefreshCw, Clock, Package,
  ArrowDownLeft, ArrowUpRight, ChevronDown, X,
  ImageIcon, Loader2, Printer, ShieldCheck, Building2, Download,
  FileText, User, Hash, Phone, AlertCircle, Smartphone, Tag,
  Briefcase, Settings, Coffee, CupSoda, Receipt, ExternalLink,
  Landmark, CreditCard, Zap, Layers, ChefHat, Info, Filter,
  ArrowRight, Sparkles, ChefHatIcon, Soup, FileEdit, Leaf,
  CheckSquare, Square, UserPlus, Coins, ClipboardList,
  PlusCircle, MinusCircle, Box, ShoppingBasket, FolderTree, Settings2,
  TrendingUp, TrendingDown, Wallet, ListFilter, Banknote, AlertTriangle, Scale, CheckCircle2, AlertOctagon, Minus,
  ArrowBigDown, ArrowBigUp
} from 'lucide-react';
import { InventoryItem, InventoryLog, InventoryCategoryConfig } from '../types';
import { storage } from '../services/storageService';
import html2canvas from 'html2canvas';

// NAMA TIPE HARUS UNIK UNTUK MENGHINDARI KONFLIK TS
type InventoryPanelTab = 'INPUT' | 'MONITOR' | 'CATEGORIES' | 'ADJUST' | 'REPORT' | 'OPNAME';

interface Props {
  inventoryItems: InventoryItem[];
  setInventoryItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  initialTab?: string; 
  initialScope?: 'ASSET' | 'RAW_MATERIAL';
  globalMonth?: number;
  globalYear?: number;
}

const InventoryManager = ({ 
  inventoryItems,
  setInventoryItems,
  initialTab = 'INPUT', 
  initialScope = 'ASSET',
  globalMonth = new Date().getMonth(),
  globalYear = new Date().getFullYear()
}: Props) => {
  // PAKSA TIPE STATE
  const [activeTab, setActiveTab] = useState<InventoryPanelTab>(initialTab as InventoryPanelTab);
  const [activeScope, setActiveScope] = useState<'ASSET' | 'RAW_MATERIAL'>(initialScope);
  
  const [logs, setLogs] = useState<InventoryLog[]>(storage.getInventoryLogs());
  const [categories, setCategories] = useState<InventoryCategoryConfig[]>(storage.getInventoryCategories());
  const [units, setUnits] = useState<string[]>(storage.getUnits());
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showUnitSettings, setShowUnitSettings] = useState(false);
  const [showCategorySettings, setShowCategorySettings] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '', category: '', quantity: 0, unit: units[0] || 'pcs', condition: 'GOOD', notes: '', unitPrice: 0
  });

  const [adjustFormData, setAdjustFormData] = useState({
    itemId: '', date: new Date().toISOString().split('T')[0], qty: '', reason: '',
    type: 'IN' as 'IN' | 'OUT' | 'DAMAGE' | 'LOSS'
  });

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab as InventoryPanelTab);
    if (initialScope) setActiveScope(initialScope);
  }, [initialTab, initialScope]);

  useEffect(() => { storage.setUnits(units); }, [units]);
  useEffect(() => { storage.setInventoryCategories(categories); }, [categories]);

  const formatCurrency = (val: number) => 'Rp ' + (val || 0).toLocaleString('id-ID');

  const filteredCategories = useMemo(() => categories.filter(cat => cat.type === activeScope), [categories, activeScope]);

  const inventoryDataCalculated = useMemo(() => {
    const startOfCurrentPeriod = new Date(globalYear, globalMonth, 1);
    const endOfCurrentPeriod = new Date(globalYear, globalMonth + 1, 0, 23, 59, 59);
    const items = Array.isArray(inventoryItems) ? inventoryItems : [];

    return items.filter(item => item.type === activeScope).map(item => {
      const itemLogs = (logs || []).filter(l => l.itemId === item.id);
      
      if (activeScope === 'ASSET') {
        return {
          ...item, stokAwal: 0, masukPeriod: 0, keluarPeriod: 0,
          stokAkhir: item.quantity, totalValue: item.quantity * (item.unitPrice || 0)
        };
      }

      const logsBeforePeriod = itemLogs.filter(l => new Date(l.timestamp) < startOfCurrentPeriod);
      let stokAwal = 0;
      logsBeforePeriod.forEach(l => {
        if (['IN', 'CREATE', 'ADJUST'].includes(l.action)) stokAwal += l.qtyChange;
        else if (['OUT', 'DAMAGE', 'LOSS', 'DELETE'].includes(l.action)) stokAwal -= l.qtyChange;
      });

      const logsInPeriod = itemLogs.filter(l => {
        const d = new Date(l.timestamp);
        return d >= startOfCurrentPeriod && d <= endOfCurrentPeriod;
      });

      let masuk = 0;
      let keluar = 0;
      logsInPeriod.forEach(l => {
        if (['IN', 'CREATE', 'ADJUST'].includes(l.action)) masuk += l.qtyChange;
        else if (['OUT', 'DAMAGE', 'LOSS', 'DELETE'].includes(l.action)) keluar += l.qtyChange;
      });

      const stokAkhir = stokAwal + masuk - keluar;
      return { ...item, stokAwal, masukPeriod: masuk, keluarPeriod: keluar, stokAkhir, totalValue: stokAkhir * (item.unitPrice || 0) };
    });
  }, [inventoryItems, logs, activeScope, globalMonth, globalYear]);

  const handleProcessAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const item = inventoryItems.find(i => i.id === adjustFormData.itemId);
    if (!item || !adjustFormData.qty) return alert('Pilih barang dan jumlah!');
    const qtyVal = parseFloat(adjustFormData.qty);
    let newQty = item.quantity;
    if (adjustFormData.type === 'IN') newQty += qtyVal;
    else newQty = Math.max(0, newQty - qtyVal);
    setInventoryItems(inventoryItems.map(i => i.id === item.id ? { ...i, quantity: newQty, lastUpdated: new Date().toISOString() } : i));
    const newLog: InventoryLog = {
      id: `log-${Date.now()}`, itemId: item.id, itemName: item.name, action: adjustFormData.type,
      qtyChange: qtyVal, previousQty: item.quantity, newQty: newQty,
      reason: adjustFormData.reason || 'Mutasi Rutin', timestamp: new Date().toISOString()
    };
    const updatedLogs = [newLog, ...(logs || [])];
    setLogs(updatedLogs);
    storage.setInventoryLogs(updatedLogs);
    setAdjustFormData({ ...adjustFormData, itemId: '', qty: '', reason: '' });
    alert('Mutasi berhasil dicatat!');
  };

  const handleSaveMasterItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingItem) {
      const diff = (formData.quantity || 0) - editingItem.quantity;
      if (diff !== 0) {
        const adjLog: InventoryLog = {
          id: `log-adj-${Date.now()}`, itemId: editingItem.id, itemName: formData.name.toUpperCase(),
          action: 'ADJUST', qtyChange: Math.abs(diff), previousQty: editingItem.quantity, newQty: formData.quantity || 0,
          reason: 'Koreksi Data Master', timestamp: new Date().toISOString()
        };
        const updatedLogs = [adjLog, ...(logs || [])];
        setLogs(updatedLogs);
        storage.setInventoryLogs(updatedLogs);
      }
      setInventoryItems(p => p.map(i => i.id === editingItem.id ? {...i, ...formData} : i));
    } else {
      const itemId = `inv-${Date.now()}`;
      const newItem = { ...formData, id: itemId, type: activeScope, lastUpdated: new Date().toISOString() };
      setInventoryItems(p => [...p, newItem as InventoryItem]);
      const createLog: InventoryLog = {
        id: `log-cre-${Date.now()}`, itemId: itemId, itemName: formData.name!.toUpperCase(),
        action: 'CREATE', qtyChange: formData.quantity || 0, previousQty: 0, newQty: formData.quantity || 0,
        reason: 'Saldo Awal Master', timestamp: new Date().toISOString()
      };
      const updatedLogs = [createLog, ...(logs || [])];
      setLogs(updatedLogs);
      storage.setInventoryLogs(updatedLogs);
    }
    setShowForm(false);
    setEditingItem(null);
  };

  const handleExportImage = async (elementId: string, filenamePrefix: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    try {
      setIsCapturing(true);
      await new Promise(resolve => setTimeout(resolve, 600));
      const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.download = `${filenamePrefix}_${new Date().getTime()}.jpg`;
      link.click();
    } catch (err) {
      alert("Gagal menyimpan gambar.");
    } finally {
      setIsCapturing(false);
    }
  };

  // RENDERING LOGIC FIXED FOR TS2367
  const isReportMode = (activeTab as string) === 'REPORT';
  const isOpnameMode = (activeTab as string) === 'OPNAME';

  if (isReportMode || isOpnameMode) {
    return (
      <div className="animate-fade-in pb-20 no-scrollbar">
        <div className="sticky top-0 z-[60] bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b p-4 flex items-center justify-between no-print shadow-sm">
          <button onClick={() => setActiveTab('INPUT')} className="flex items-center gap-2 text-gray-500 hover:text-black font-black text-xs uppercase px-4 py-2 rounded-xl cursor-pointer">
            <X size={20} /> Tutup Laporan
          </button>
          <div className="flex gap-3">
             <button onClick={() => handleExportImage('inventory-report-paper', isOpnameMode ? 'Opname' : 'Inventory')} disabled={isCapturing} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-xl cursor-pointer">
                {isCapturing ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />} SIMPAN JPG
             </button>
             <button onClick={() => window.print()} className="px-8 py-3 bg-black text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-lg cursor-pointer"><Printer size={18} /> CETAK PDF</button>
          </div>
        </div>
        <div id="inventory-report-paper" className="paper-preview bg-white text-black font-sans shadow-none !min-h-[297mm] mx-auto p-12 border border-gray-100">
          <div className="flex flex-col items-center text-center mb-10 border-b-[6px] border-black pb-8 gap-3 relative">
             <div className="space-y-1">
                <p className="text-[11px] font-black tracking-[0.4em] text-gray-500 uppercase">{isOpnameMode ? 'STOCK OPNAME & VALUE REPORT' : 'OFFICIAL INVENTORY MOVEMENT'}</p>
                <h1 className="text-3xl font-black uppercase tracking-tighter text-black leading-none mt-1">{isOpnameMode ? 'LAPORAN NILAI ASET' : `LAPORAN PERGERAKAN ${activeScope === 'ASSET' ? 'INVENTARIS' : 'BAHAN BAKU'}`}</h1>
             </div>
             <div className="mt-4 px-6 py-2 bg-gray-100 rounded-full border border-gray-200"><span className="text-[11px] font-black tracking-widest uppercase">PERIODE: {months[globalMonth]} {globalYear}</span></div>
          </div>
          <div className="overflow-hidden rounded-xl border-2 border-black shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-black border-b-2 border-black">
                  <th className="border-r border-black p-4 text-[10px] font-black uppercase text-center w-12">No</th>
                  <th className="border-r border-black p-4 text-[10px] font-black uppercase">Nama Barang</th>
                  {isOpnameMode ? (
                    <><th className="border-r border-black p-4 text-[10px] font-black uppercase text-center w-24">Stok Akhir</th><th className="p-4 text-[10px] font-black uppercase text-right w-40">Nilai Rupiah</th></>
                  ) : activeScope === 'RAW_MATERIAL' ? (
                    <><th className="border-r border-black p-4 text-[10px] font-black uppercase text-center w-20">Awal</th><th className="border-r border-black p-4 text-[10px] font-black uppercase text-center w-20 text-green-700">Masuk</th><th className="border-r border-black p-4 text-[10px] font-black uppercase text-center w-20 text-red-700">Keluar</th><th className="p-4 text-[10px] font-black uppercase text-center w-24">Akhir</th></>
                  ) : (
                    <><th className="border-r border-black p-4 text-[10px] font-black uppercase text-center w-24">Kondisi</th><th className="p-4 text-[10px] font-black uppercase text-center w-32">Jumlah Total</th></>
                  )}
                </tr>
              </thead>
              <tbody className="text-[11px] font-bold uppercase">
                {inventoryDataCalculated.map((item, idx) => (
                  <tr key={item.id} className="border-b border-black last:border-b-0">
                    <td className="border-r border-black p-3 text-center text-gray-400">{idx + 1}</td>
                    <td className="border-r border-black p-3"><p className="font-black text-black leading-none mb-1">{item.name}</p><p className="text-[8px] text-gray-400 tracking-widest">{item.category}</p></td>
                    {isOpnameMode ? (
                      <><td className="border-r border-black p-3 text-center bg-gray-50/50">{item.stokAkhir} {item.unit}</td><td className="p-3 text-right font-black text-blue-900">{formatCurrency(item.totalValue || 0)}</td></>
                    ) : activeScope === 'RAW_MATERIAL' ? (
                      <><td className="border-r border-black p-3 text-center bg-gray-50/50">{item.stokAwal}</td><td className="border-r border-black p-3 text-center text-green-700">+{item.masukPeriod}</td><td className="border-r border-black p-3 text-center text-red-700">-{item.keluarPeriod}</td><td className="p-3 text-center font-black">{item.stokAkhir} {item.unit}</td></>
                    ) : (
                      <><td className="border-r border-black p-3 text-center"><span className={`px-2 py-0.5 rounded border ${item.condition === 'GOOD' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{item.condition}</span></td><td className="p-3 text-center font-black">{item.stokAkhir} {item.unit}</td></>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const scopeColor = activeScope === 'ASSET' ? 'indigo' : 'emerald';

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className={`p-5 ${activeScope === 'ASSET' ? 'bg-indigo-600' : 'bg-emerald-600'} text-white rounded-[1.8rem] shadow-2xl`}>
            {activeScope === 'ASSET' ? <Box size={32}/> : <ShoppingBasket size={32}/>}
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
              {activeScope === 'ASSET' ? 'Inventaris & Peralatan' : 'Audit Stok Bahan Baku'}
            </h2>
            <p className="text-sm text-gray-500 font-medium italic mt-2">
              {activeScope === 'ASSET' ? 'Data aset bersifat Global (selalu ada).' : `Audit periode: ${months[globalMonth]} ${globalYear}`}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
           <button onClick={() => setShowUnitSettings(true)} className="p-4 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-2xl border hover:text-indigo-600 transition-all shadow-sm cursor-pointer" title="Master Satuan"><Settings size={20}/></button>
           <button onClick={() => setShowCategorySettings(true)} className="p-4 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-2xl border hover:text-emerald-600 transition-all shadow-sm cursor-pointer" title="Master Kategori"><FolderTree size={20}/></button>
           
           <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border dark:border-gray-700 overflow-x-auto no-scrollbar">
              <button onClick={() => setActiveTab('INPUT')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap ${activeTab === 'INPUT' ? `bg-white dark:bg-gray-900 text-${scopeColor}-600 shadow-md` : 'text-gray-400'}`}>Master</button>
              <button onClick={() => setActiveTab('ADJUST')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap ${activeTab === 'ADJUST' ? `bg-white dark:bg-gray-900 text-${scopeColor}-600 shadow-md` : 'text-gray-400'}`}>Mutasi</button>
              <button onClick={() => setActiveTab('OPNAME')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap ${activeTab === 'OPNAME' ? `bg-white dark:bg-gray-900 text-orange-600 shadow-md` : 'text-gray-400'}`}>Opname</button>
              <button onClick={() => setActiveTab('REPORT')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap ${activeTab === 'REPORT' ? `bg-white dark:bg-gray-900 text-gray-800 shadow-md` : 'text-gray-400'}`}>Laporan</button>
              <button onClick={() => setActiveTab('MONITOR')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap ${activeTab === 'MONITOR' ? `bg-white dark:bg-gray-900 text-gray-500 shadow-md` : 'text-gray-400'}`}>Log</button>
           </div>
           <button onClick={() => { setEditingItem(null); setFormData({name:'', category: (filteredCategories[0]?.name || ''), quantity:0, unit: (units[0] || 'pcs'), condition: 'GOOD', unitPrice: 0, notes: ''}); setShowForm(true); }} className={`px-8 py-4 bg-${scopeColor}-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-black transition-all cursor-pointer flex items-center gap-2`}><PlusCircle size={18}/> Tambah {activeScope === 'ASSET' ? 'Aset' : 'Bahan'}</button>
        </div>
      </div>

      {activeTab === 'ADJUST' ? (
        <div className="max-w-3xl mx-auto animate-scale-in">
           <div className={`bg-white dark:bg-gray-900 rounded-[3rem] border shadow-2xl p-12 relative overflow-hidden`}>
              <div className="flex items-center gap-4 mb-10">
                 <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl"><History size={24}/></div>
                 <h3 className="text-2xl font-black uppercase tracking-tighter">Formulir Kerja Mutasi</h3>
              </div>
              <form onSubmit={handleProcessAdjustment} className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Pilih Barang</label>
                       <div className="relative">
                          <select required value={adjustFormData.itemId} onChange={e => setAdjustFormData({...adjustFormData, itemId: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 outline-none font-black text-sm uppercase appearance-none cursor-pointer"><option value="">-- CARI ITEM --</option>{inventoryItems.filter(i => i.type === activeScope).map(i => (<option key={i.id} value={i.id}>{i.name} (Sisa: {i.quantity} {i.unit})</option>))}</select>
                          <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Tipe Transaksi</label>
                       <div className="relative">
                          <select value={adjustFormData.type} onChange={e => setAdjustFormData({...adjustFormData, type: e.target.value as any})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 outline-none font-black text-sm uppercase appearance-none cursor-pointer">
                             {activeScope === 'RAW_MATERIAL' ? (
                                <><option value="IN">BARANG MASUK (RESTOCK)</option><option value="OUT">BARANG KELUAR (PAKAI/PRODUKSI)</option></>
                             ) : (
                                <><option value="IN">PENGADAAN BARU / MASUK</option><option value="DAMAGE">BARANG RUSAK / AFKIR</option><option value="LOSS">BARANG HILANG</option></>
                             )}
                          </select>
                          <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                       </div>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Kuantitas</label>
                       <input required type="number" step="any" placeholder="0.00" value={adjustFormData.qty} onChange={e => setAdjustFormData({...adjustFormData, qty: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 outline-none font-black text-2xl tracking-tighter" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Berita Acara / Alasan</label>
                       <textarea required placeholder="MISAL: PRODUKSI KOPI / KERUSAKAN DI KITCHEN..." value={adjustFormData.reason} onChange={e => setAdjustFormData({...adjustFormData, reason: e.target.value.toUpperCase()})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 outline-none font-medium text-sm h-14 resize-none" />
                    </div>
                 </div>
                 <div className="pt-6">
                    <button type="submit" className={`w-full py-7 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 text-white cursor-pointer ${adjustFormData.type === 'IN' ? `bg-${scopeColor}-600 hover:bg-${scopeColor}-700` : 'bg-red-600 hover:bg-red-700'}`}>
                       Eksekusi Transaksi Mutasi
                    </button>
                 </div>
              </form>
           </div>
        </div>
      ) : activeTab === 'INPUT' ? (
        <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden animate-fade-in">
          <div className="p-8 border-b dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative max-w-md w-full"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Cari barang..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl pl-12 pr-6 py-3 outline-none font-bold text-sm transition-all" /></div>
            <button onClick={() => { setEditingItem(null); setFormData({name:'', category: (filteredCategories[0]?.name || ''), quantity:0, unit: (units[0] || 'pcs'), condition: 'GOOD', unitPrice: 0, notes: ''}); setShowForm(true); }} className={`flex items-center gap-3 px-8 py-4 bg-${scopeColor}-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg cursor-pointer transition-all hover:-translate-y-1`}><PlusCircle size={18}/> Tambah {activeScope === 'ASSET' ? 'Aset' : 'Bahan'}</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-8 py-5">Nama Barang</th>
                  {activeScope === 'RAW_MATERIAL' ? (
                    <>
                      <th className="px-4 py-5 text-center">Stok Awal</th>
                      <th className="px-4 py-5 text-center text-green-600">Masuk (+)</th>
                      <th className="px-4 py-5 text-center text-red-600">Keluar (-)</th>
                      <th className="px-4 py-5 text-center font-black text-gray-900 dark:text-white">Stok Akhir</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-5 text-center">Kondisi</th>
                      <th className="px-4 py-5 text-center">Jumlah Total</th>
                    </>
                  )}
                  <th className="px-6 py-5 text-right">Nilai Rupiah</th>
                  <th className="px-8 py-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-800">
                {inventoryDataCalculated.filter(i => i.name.toUpperCase().includes(searchTerm.toUpperCase())).map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors group">
                    <td className="px-8 py-6">
                       <p className="text-sm font-black text-gray-900 dark:text-white uppercase leading-none mb-1 group-hover:text-emerald-600 transition-colors">{item.name}</p>
                       <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{item.category}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                          <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-tighter">@ {formatCurrency(item.unitPrice)}</span>
                       </div>
                    </td>
                    {activeScope === 'RAW_MATERIAL' ? (
                      <>
                        <td className="px-4 py-6 text-center font-bold text-gray-400 text-xs">{item.stokAwal}</td>
                        <td className="px-4 py-6 text-center font-bold text-green-600 text-xs">+{item.masukPeriod}</td>
                        <td className="px-4 py-6 text-center font-bold text-red-500 text-xs">-{item.keluarPeriod}</td>
                        <td className="px-4 py-6 text-center">
                           <span className={`px-4 py-1.5 rounded-xl font-black text-sm border shadow-sm ${item.stokAkhir <= 5 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                              {item.stokAkhir} <span className="text-[10px] uppercase opacity-60 ml-1">{item.unit}</span>
                           </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-6 text-center">
                           <span className={`px-3 py-1 rounded-lg text-[9px] font-black border ${item.condition === 'GOOD' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                              {item.condition}
                           </span>
                        </td>
                        <td className="px-4 py-6 text-center font-black text-gray-700 dark:text-gray-300">{item.quantity} {item.unit}</td>
                      </>
                    )}
                    <td className="px-6 py-6 text-right font-black text-gray-900 dark:text-white">{formatCurrency(item.totalValue)}</td>
                    <td className="px-8 py-6 text-center">
                       <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setEditingItem(item as any); setFormData(item); setShowForm(true); }} className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl cursor-pointer transition-all"><Edit3 size={16}/></button>
                          <button onClick={() => { if(confirm('Hapus master barang?')) setInventoryItems(p => p.filter(i => i.id !== item.id)) }} className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl cursor-pointer transition-all"><Trash2 size={16}/></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'MONITOR' ? (
        <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden animate-fade-in">
           <table className="w-full text-left">
              <thead><tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-5">Waktu</th><th className="px-8 py-5">Nama Barang</th><th className="px-4 py-5 text-center">Aksi</th><th className="px-4 py-5 text-center">Mutasi</th><th className="px-8 py-5 text-center">Alasan</th></tr></thead>
              <tbody className="divide-y dark:divide-gray-800">
                 {logs.filter(l => inventoryItems.find(i => i.id === l.itemId)?.type === activeScope).map(log => {
                    const pos = ['IN', 'CREATE'].includes(log.action) || (log.action === 'ADJUST' && log.newQty >= log.previousQty);
                    return (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors text-xs font-bold uppercase"><td className="px-8 py-5 text-[10px] text-gray-500">{new Date(log.timestamp).toLocaleString('id-ID')}</td><td className="px-8 py-5">{log.itemName}</td><td className="px-4 py-5 text-center"><span className={`px-2 py-0.5 rounded text-[8px] font-black ${pos ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{log.action}</span></td><td className="px-4 py-5 text-center font-black">{(pos ? '+' : '-') + log.qtyChange}</td><td className="px-8 py-5 text-[10px] text-gray-400 truncate max-w-[200px]">{log.reason}</td></tr>
                    );
                 })}
              </tbody>
           </table>
        </div>
      ) : null}

      {/* MODAL MASTER SATUAN */}
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
                    <input type="text" value={newUnitName} onChange={e => setNewUnitName(e.target.value.toLowerCase())} placeholder="Tambah satuan (ex: cup, zak...)" className="flex-1 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-xl px-4 py-3 outline-none font-black text-xs lowercase transition-all" />
                    <button onClick={() => { 
                      const val = newUnitName.trim().toLowerCase();
                      if (!val) return;
                      if (units.includes(val)) return alert('Satuan sudah ada');
                      setUnits(prev => [...prev, val]);
                      setNewUnitName('');
                    }} className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg active:scale-90 transition-all cursor-pointer"><Plus size={18}/></button>
                 </div>
                 <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
                    {units.map(u => (
                       <div key={u} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl group border border-transparent hover:border-indigo-500 transition-all">
                          <span className="text-xs font-black uppercase tracking-widest">{u}</span>
                          <button onClick={() => { if(confirm(`Hapus satuan "${u}"?`)) setUnits(prev => prev.filter(unit => unit !== u)); }} className="p-2 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-xl transition-all cursor-pointer"><Trash2 size={16}/></button>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* MODAL MASTER KATEGORI */}
      {showCategorySettings && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 animate-fade-in no-print">
           <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowCategorySettings(false)} />
           <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-10 animate-scale-in border-t-8 border-emerald-600">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3"><FolderTree size={24} className="text-emerald-600" /> Master Kategori</h3>
                 <button onClick={() => setShowCategorySettings(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer"><X size={24}/></button>
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Kelola kategori untuk: <span className="text-emerald-600">{activeScope}</span></p>
              <div className="space-y-6">
                 <div className="flex gap-2">
                    <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value.toUpperCase())} placeholder="Nama kategori baru..." className="flex-1 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 rounded-xl px-4 py-3 outline-none font-black text-xs transition-all" />
                    <button onClick={() => {
                      const val = newCategoryName.trim().toUpperCase();
                      if (!val) return;
                      const newCat: InventoryCategoryConfig = { id: `cat-${Date.now()}`, name: val, type: activeScope };
                      setCategories(prev => [...prev, newCat]);
                      setNewCategoryName('');
                    }} className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg active:scale-90 transition-all cursor-pointer"><Plus size={18}/></button>
                 </div>
                 <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
                    {filteredCategories.map(c => (
                       <div key={c.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl group border border-transparent hover:border-emerald-500 transition-all">
                          <span className="text-xs font-black uppercase tracking-widest">{c.name}</span>
                          <button onClick={() => { if(confirm(`Hapus kategori "${c.name}"?`)) setCategories(prev => prev.filter(cat => cat.id !== c.id)); }} className="p-2 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-xl transition-all cursor-pointer"><Trash2 size={16}/></button>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* FORM MASTER BARANG */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-fade-in">
           <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowForm(false)} />
           <div className={`relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[3.5rem] shadow-2xl p-10 lg:p-14 animate-scale-in border-t-8 ${activeScope === 'ASSET' ? 'border-indigo-600' : 'border-emerald-600'} overflow-y-auto max-h-[90vh] custom-scrollbar`}>
              <div className="flex items-center justify-between mb-10">
                 <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl text-white shadow-xl ${activeScope === 'ASSET' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>{editingItem ? <Edit3 size={24}/> : <Plus size={24}/>}</div>
                    <div><h3 className="text-2xl font-black uppercase tracking-tighter">{editingItem ? 'Edit Data Master' : `Registrasi ${activeScope === 'ASSET' ? 'Aset' : 'Bahan'} Baru`}</h3><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Lembah Manah Inventory Engine</p></div>
                 </div>
                 <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer"><X size={28}/></button>
              </div>

              <form onSubmit={handleSaveMasterItem} className="space-y-8">
                 <div className="p-8 bg-gray-50 dark:bg-gray-800/50 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 space-y-6">
                    <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] flex items-center gap-2"><Tag size={12}/> I. Identitas Produk</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Nama Barang</label><input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} placeholder="CONTOH: SUSU UHT..." className="w-full bg-white dark:bg-gray-950 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 outline-none font-black text-sm uppercase shadow-sm transition-all" /></div>
                       <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Kategori</label><div className="relative"><select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-white dark:bg-gray-950 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 outline-none font-black text-xs uppercase appearance-none shadow-sm cursor-pointer">{filteredCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}{filteredCategories.length === 0 && <option value="UMUM">UMUM (Default)</option>}</select><ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" /></div></div>
                    </div>
                 </div>

                 <div className={`p-8 rounded-[2.5rem] border-2 border-dashed space-y-6 ${activeScope === 'ASSET' ? 'bg-indigo-50/50 border-indigo-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                    <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${activeScope === 'ASSET' ? 'text-indigo-600' : 'text-emerald-600'}`}><Coins size={12}/> II. Nilai & Stok</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Harga Satuan (IDR)</label><div className="relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-300">Rp</span><input required type="text" value={formData.unitPrice ? formData.unitPrice.toLocaleString('id-ID') : ''} onChange={e => setFormData({...formData, unitPrice: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0})} placeholder="0" className="w-full bg-white dark:bg-gray-950 pl-14 pr-6 py-5 rounded-3xl outline-none font-black text-xl border-2 border-transparent focus:border-indigo-500 shadow-xl transition-all" /></div></div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Stok Awal</label><input required type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} className="w-full bg-white dark:bg-gray-950 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-4 py-5 outline-none font-black text-sm text-center" /></div>
                          <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Satuan</label><select required value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full bg-white dark:bg-gray-950 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-4 py-5 outline-none font-black text-[10px] uppercase appearance-none cursor-pointer">{units.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}</select></div>
                       </div>
                    </div>
                    {activeScope === 'ASSET' && (
                       <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Kondisi Barang</label><select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value as any})} className="w-full bg-white dark:bg-gray-950 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 outline-none font-black text-xs uppercase appearance-none cursor-pointer"><option value="GOOD">BAIK / BERFUNGSI</option><option value="DAMAGED">RUSAK / BUTUH SERVIS</option><option value="MISSING">HILANG / TIDAK ADA</option></select></div>
                    )}
                 </div>

                 <div className={`p-8 rounded-[2.5rem] flex justify-between items-center shadow-inner ${activeScope === 'ASSET' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    <div><p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Total Estimasi Nilai Stok</p><h4 className="text-4xl font-black tracking-tighter leading-none">{formatCurrency((formData.quantity || 0) * (formData.unitPrice || 0))}</h4></div>
                    <div className="p-4 bg-white/10 rounded-3xl"><TrendingUp size={32}/></div>
                 </div>

                 <button type="submit" className={`w-full py-7 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 text-white flex items-center justify-center gap-3 cursor-pointer ${activeScope === 'ASSET' ? 'bg-indigo-700 hover:bg-black' : 'bg-emerald-700 hover:bg-black'}`}>
                    <Save size={24}/> Simpan Data Master
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;