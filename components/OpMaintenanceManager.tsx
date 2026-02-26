import React, { useState, useMemo } from 'react';
import { 
  Wrench, Plus, RotateCcw, AlertOctagon, Trash2, X, Save, 
  AlertCircle, Hammer, Info, Coins, ShieldAlert, User, 
  Calendar, Clock, Truck, Printer, ImageIcon, Loader2, Building2,
  FileText, History, CheckCircle2, TrendingUp, Download, Share2,
  ShieldCheck, ChevronDown, Package, Check, Settings
} from 'lucide-react';
import { MaintenanceTask, Employee, InventoryItem } from '../types';
import { storage } from '../services/storageService';
import html2canvas from 'html2canvas';

interface Props {
  maintenance: MaintenanceTask[];
  setMaintenance: React.Dispatch<React.SetStateAction<MaintenanceTask[]>>;
  employees: Employee[];
  inventoryItems: InventoryItem[];
}

const OpMaintenanceManager: React.FC<Props> = ({ maintenance = [], setMaintenance, employees, inventoryItems = [] }) => {
  const [showForm, setShowForm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const businessInfo = useMemo(() => storage.getBusinessInfo(), []);
  const today = new Date().toISOString().split('T')[0];
  const selectedMonth = new Date().getMonth();
  const selectedYear = new Date().getFullYear();
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const assetList = useMemo(() => {
    if (!Array.isArray(inventoryItems)) return [];
    return inventoryItems.filter(item => item.type === 'ASSET').sort((a, b) => a.name.localeCompare(b.name));
  }, [inventoryItems]);

  const [formData, setFormData] = useState<Partial<MaintenanceTask>>({ 
    deviceName: '', 
    type: 'SERVICE', 
    frequency: 'MONTHLY', 
    assignedTo: '', 
    lastDoneDate: today,
    costEstimate: 0,
    priority: 'NORMAL',
    vendorInfo: '',
    notes: ''
  });

  const calculateNext = (last: string, freq: string) => {
    const d = new Date(last);
    if (freq === 'DAILY') d.setDate(d.getDate() + 1);
    else if (freq === 'WEEKLY') d.setDate(d.getDate() + 7);
    else if (freq === 'MONTHLY') d.setMonth(d.getMonth() + 1);
    else if (freq === '3_MONTHS') d.setMonth(d.getMonth() + 3);
    else if (freq === '6_MONTHS') d.setMonth(d.getMonth() + 6);
    else if (freq === 'YEARLY') d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.deviceName) return alert('Pilih alat/aset terlebih dahulu!');
    const nextDue = calculateNext(formData.lastDoneDate!, formData.frequency!);
    const newTask: MaintenanceTask = { 
      id: `maint-${Date.now()}`, 
      deviceName: formData.deviceName!, 
      type: (formData as any).type, 
      frequency: (formData as any).frequency, 
      lastDoneDate: formData.lastDoneDate!, 
      nextDueDate: nextDue, 
      assignedTo: formData.assignedTo || 'Supervisor', 
      status: 'OK',
      costEstimate: Number(formData.costEstimate) || 0,
      priority: (formData as any).priority || 'NORMAL',
      vendorInfo: formData.vendorInfo || '',
      notes: formData.notes || ''
    };
    setMaintenance(prev => [...(prev || []), newTask]);
    setShowForm(false);
    setFormData({ 
      deviceName: '', type: 'SERVICE', frequency: 'MONTHLY', 
      assignedTo: '', lastDoneDate: today,
      costEstimate: 0, priority: 'NORMAL', vendorInfo: '', notes: ''
    });
  };

  const markDone = (id: string) => {
    setMaintenance(prev => (prev || []).map(m => {
      if (m.id === id) {
        const nextDue = calculateNext(today, m.frequency);
        return { ...m, lastDoneDate: today, nextDueDate: nextDue, status: 'OK' };
      }
      return m;
    }));
    alert('Sukses! Tanggal service telah diperbarui ke hari ini.');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bapak yakin ingin menghapus jadwal pemeliharaan alat ini secara permanen?')) {
      setMaintenance(prev => (prev || []).filter(m => m.id !== id));
    }
  };

  const servicedThisMonth = useMemo(() => {
    const list = Array.isArray(maintenance) ? maintenance : [];
    return list.filter(m => {
      const d = new Date(m.lastDoneDate);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [maintenance, selectedMonth, selectedYear]);

  const totalMonthlyCost = useMemo(() => {
    return servicedThisMonth.reduce((sum, item) => sum + (item.costEstimate || 0), 0);
  }, [servicedThisMonth]);

  const formatCurrency = (val: number) => 'Rp ' + Math.floor(val).toLocaleString('id-ID');

  const captureReport = async () => {
    const element = document.getElementById('maintenance-report-paper');
    if (!element) return;
    try {
      setIsCapturing(true);
      await new Promise(r => setTimeout(r, 1000));
      const canvas = await html2canvas(element, { 
        scale: 3, 
        useCORS: true, 
        backgroundColor: '#ffffff'
      });
      const image = canvas.toDataURL("image/jpeg", 0.95);
      const link = document.createElement('a');
      link.href = image;
      link.download = `Audit_Maintenance_${periodLabel.replace(/\s+/g, '_')}.jpg`;
      link.click();
    } catch (err) {
      alert("Gagal memotret laporan.");
    } finally {
      setIsCapturing(false);
    }
  };

  const periodLabel = `${months[selectedMonth]} ${selectedYear}`;

  if (showReport) {
    return (
      <div className="fixed inset-0 z-[150] bg-gray-200 dark:bg-black overflow-y-auto flex flex-col no-scrollbar animate-fade-in no-print">
        <div className="sticky top-0 z-[160] w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b p-4 flex items-center justify-between shadow-lg">
          <button onClick={() => setShowReport(false)} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl hover:bg-red-700 font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md cursor-pointer"><X size={20} /> KELUAR</button>
          <div className="flex gap-3">
             <button onClick={captureReport} disabled={isCapturing} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-xl hover:bg-emerald-700 active:scale-95 disabled:opacity-50 cursor-pointer">
               {isCapturing ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18}/>} SIMPAN JPG
             </button>
             <button onClick={() => window.print()} className="px-8 py-3 bg-black text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-xl hover:bg-gray-800 active:scale-95 cursor-pointer"><Printer size={18} /> CETAK PDF (LONG PAGE)</button>
          </div>
        </div>

        <div className="flex-1 py-10 flex flex-col items-center bg-gray-200 dark:bg-black/50">
          <div id="maintenance-report-paper" className="bg-white text-black p-[25mm] rounded-none shadow-2xl border border-gray-100 mx-auto print-view-optimized relative" style={{ width: '210mm', minHeight: 'auto' }}>
            
            {/* WATERMARK */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.02] flex items-center justify-center rotate-[-35deg] select-none">
              <p className="text-[100px] font-black uppercase tracking-[0.3em]">EQUIPMENT AUDIT</p>
            </div>

            {/* HEADER FORMAL */}
            <div className="relative z-10 flex flex-col items-center text-center mb-16 pb-12 border-b-[8px] border-black gap-4">
              {businessInfo.logoUrl ? (
                <img src={businessInfo.logoUrl} className="h-20 w-auto object-contain mb-4" alt="Logo" />
              ) : (
                <div className="w-20 h-20 bg-black text-white rounded-[2rem] flex items-center justify-center font-black text-2xl mb-4 shadow-lg">LM</div>
              )}
              <div className="space-y-2">
                <h1 className="text-4xl font-black uppercase tracking-tighter leading-none text-black">LAPORAN PEMELIHARAAN ASET</h1>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em]">{businessInfo.name.toUpperCase()} • TECHNICAL SERVICES DIVISION</p>
                <div className="flex items-center justify-center gap-6 mt-8 px-10 py-3 bg-gray-100 rounded-full border-2 border-black">
                   <span className="text-xs font-black tracking-[0.2em] uppercase">PERIODE AUDIT: {periodLabel.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* RINGKASAN BIAYA & UNIT */}
            <div className="relative z-10 grid grid-cols-2 gap-8 mb-16 break-inside-avoid">
               <div className="p-10 rounded-[3rem] bg-gray-50 border-2 border-black flex flex-col justify-center items-center text-center">
                  <p className="text-[10pt] font-black text-gray-400 uppercase tracking-widest mb-2">Total Aset Diservis</p>
                  <h4 className="text-5xl font-black text-black">{servicedThisMonth.length} <span className="text-lg opacity-40">UNIT</span></h4>
               </div>
               <div className="p-10 rounded-[3rem] bg-emerald-50 border-4 border-emerald-500 shadow-inner flex flex-col justify-center items-center text-center">
                  <p className="text-[10pt] font-black text-emerald-600 uppercase tracking-widest mb-2">Akumulasi Biaya Perawatan</p>
                  <h4 className="text-4xl font-black text-emerald-900">{formatCurrency(totalMonthlyCost)}</h4>
               </div>
            </div>

            {/* DETAIL TABEL */}
            <div className="relative z-10 space-y-8">
               <div className="flex items-center gap-3 border-b-2 border-black pb-2">
                  <Settings size={20} className="text-indigo-600" />
                  <h3 className="text-[11pt] font-black uppercase tracking-[0.2em]">DAFTAR RINCIAN PEKERJAAN TEKNIS</h3>
               </div>
               
               <div className="overflow-hidden rounded-2xl border-4 border-black shadow-sm mb-16">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="bg-gray-100 text-black border-b-4 border-black font-black uppercase text-[10px] text-center">
                           <th className="p-4 border-r-2 border-black w-12">No</th>
                           <th className="p-4 border-r-2 border-black text-left">Deskripsi Peralatan</th>
                           <th className="p-4 border-r-2 border-black w-32">Jenis Jasa</th>
                           <th className="p-4 border-r-2 border-black w-32">Vendor/PIC</th>
                           <th className="p-4 text-right w-40">Biaya Riil</th>
                        </tr>
                     </thead>
                     <tbody className="text-[10px] font-bold uppercase">
                        {servicedThisMonth.map((m, idx) => (
                           <tr key={m.id} className="border-b-2 border-black last:border-b-0 hover:bg-gray-50/50 transition-colors">
                              <td className="p-4 text-center border-r-2 border-black text-gray-400 font-mono">{idx + 1}</td>
                              <td className="p-4 border-r-2 border-black">
                                 <p className="font-black text-[11px] leading-tight mb-1">{m.deviceName}</p>
                                 <p className="text-[8px] text-gray-400 tracking-widest">Selesai: {new Date(m.lastDoneDate).toLocaleDateString('id-ID')}</p>
                              </td>
                              <td className="p-4 text-center border-r-2 border-black">
                                 <span className="px-2 py-0.5 rounded font-black border border-black bg-indigo-50">{m.type}</span>
                              </td>
                              <td className="p-4 text-center border-r-2 border-black italic text-gray-600">{m.vendorInfo || m.assignedTo || 'Internal'}</td>
                              <td className="p-4 text-right font-black bg-gray-50">{formatCurrency(m.costEstimate || 0)}</td>
                           </tr>
                        ))}
                        {servicedThisMonth.length === 0 && (
                           <tr><td colSpan={5} className="p-20 text-center text-gray-300 italic uppercase font-black tracking-widest">Nihil aktivitas perbaikan bulan ini</td></tr>
                        )}
                     </tbody>
                     {servicedThisMonth.length > 0 && (
                        <tfoot>
                           <tr className="bg-black text-white font-black uppercase">
                              <td colSpan={4} className="p-4 text-right tracking-[0.2em] text-[9px]">Grand Total Pengeluaran Maintenance</td>
                              <td className="p-4 text-right text-base text-emerald-400">{formatCurrency(totalMonthlyCost)}</td>
                           </tr>
                        </tfoot>
                     )}
                  </table>
               </div>

               {/* SIGNATURE SECTION */}
               <div className="relative z-10 mt-32 pt-12 border-t border-dashed border-gray-300 text-center uppercase break-inside-avoid">
                 <div className="flex justify-between px-16">
                    <div className="w-64">
                       <p className="text-[10px] font-black text-gray-400 mb-20 tracking-widest uppercase">PIC TEKNIS / SUPERVISOR</p>
                       <div className="border-b-2 border-black w-full mb-1"></div>
                       <p className="text-[11pt] font-black text-black">{businessInfo.supervisorName || 'OFFICIAL SUPERVISOR'}</p>
                    </div>
                    <div className="w-64">
                       <p className="text-[10px] font-black text-gray-400 mb-20 tracking-widest uppercase">EXECUTIVE MANAGER</p>
                       <div className="border-b-2 border-black w-full mb-1"></div>
                       <p className="text-[11pt] font-black text-black">{businessInfo.managerName || 'GENERAL MANAGER'}</p>
                    </div>
                 </div>
               </div>
            </div>

            <div className="mt-32 pt-10 border-t border-dashed border-gray-200 text-center">
              <p className="text-[8pt] font-bold text-gray-300 uppercase tracking-[0.8em]">SYSTEM GENERATED DOCUMENT • EQUIPMENT HEALTH HUB v2.5</p>
            </div>
          </div>
        </div>
        
        <style>{`
          .print-view-optimized {
            height: auto !important;
            min-height: 297mm !important;
            page-break-after: always;
          }
          @media print {
            body * { visibility: hidden; }
            #maintenance-report-paper, #maintenance-report-paper * { visibility: visible; }
            #maintenance-report-paper {
              position: absolute; left: 0; top: 0;
              width: 100% !important; height: auto !important;
              min-height: auto !important; margin: 0 !important;
              padding: 15mm !important; box-shadow: none !important;
              border: none !important;
            }
            .break-inside-avoid { 
              page-break-inside: avoid !important; 
              break-inside: avoid !important; 
            }
            @page { size: auto; margin: 10mm; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className="p-5 bg-orange-600 text-white rounded-[1.8rem] shadow-2xl">
            <Wrench size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Perbaikan Alat</h2>
            <p className="text-sm text-gray-500 font-medium italic mt-2">Monitor kesehatan aset & manajemen vendor perbaikan.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowReport(true)} className="px-6 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-xs uppercase flex items-center gap-2 hover:bg-gray-200 transition-all shadow-sm cursor-pointer"><FileText size={16} /> Laporan Bulanan</button>
          <button onClick={() => setShowForm(true)} className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-lg hover:bg-orange-700 active:scale-95 transition-all cursor-pointer"><Plus size={18} /> Tambah Jadwal</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {maintenance.length === 0 ? (<div className="col-span-full py-24 text-center border-2 border-dashed rounded-[3rem] opacity-30 italic text-sm font-black uppercase tracking-widest text-gray-400">Belum Ada Jadwal Pemeliharaan Tercatat</div>) : (
          maintenance.map(m => {
            const isOverdue = new Date(m.nextDueDate) < new Date();
            const isDoneToday = m.lastDoneDate === today;
            return (
              <div key={m.id} className={`p-8 rounded-[2.5rem] border-2 transition-all group relative hover:shadow-xl ${isDoneToday ? 'bg-emerald-50/30 border-emerald-200' : isOverdue ? 'bg-red-50/30 border-red-200' : 'bg-white dark:bg-gray-950 border-gray-100 dark:border-gray-800 hover:border-orange-300 shadow-lg'}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-4 rounded-2xl shadow-sm ${isDoneToday ? 'bg-emerald-600 text-white' : isOverdue ? 'bg-red-600 text-white animate-pulse' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>{isDoneToday ? <CheckCircle2 size={24}/> : isOverdue ? <AlertOctagon size={24}/> : <Hammer size={24}/>}</div>
                  <div className="flex gap-2">
                    {isDoneToday && (<span className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[8px] font-black uppercase border border-emerald-500 shadow-sm animate-fade-in">SELESAI HARI INI</span>)}
                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase border ${m.priority === 'HIGH' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>{m.priority || 'NORMAL'}</span>
                    <button onClick={() => handleDelete(m.id)} className="p-2 text-gray-300 hover:text-red-600 transition-colors cursor-pointer opacity-100 sm:opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                  </div>
                </div>
                <h4 className="text-lg font-black uppercase mb-1 truncate text-gray-900 dark:text-white leading-none">{m.deviceName}</h4>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-6">{m.type} • {m.frequency}</p>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl space-y-3 mb-6 border border-gray-100 dark:border-gray-700 shadow-inner"><div className="flex justify-between items-center text-[10px] font-bold uppercase"><span className="text-gray-400">Est. Biaya:</span><span className="text-indigo-600 font-black">{formatCurrency(m.costEstimate || 0)}</span></div><div className="flex justify-between items-center text-[10px] font-bold uppercase"><span className="text-gray-400">Vendor:</span><span className="text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{m.vendorInfo || 'Internal'}</span></div></div>
                <div className="border-t pt-4 mb-8 space-y-2 text-[10px] font-bold uppercase"><div className="flex justify-between text-gray-400"><span>Terakhir:</span><span className={isDoneToday ? 'text-emerald-600 font-black' : ''}>{new Date(m.lastDoneDate).toLocaleDateString('id-ID')}</span></div><div className="flex justify-between items-center"><span className="text-gray-400">Berikutnya:</span><span className={`px-2 py-0.5 rounded font-black ${isOverdue ? 'bg-red-600 text-white' : 'text-blue-600'}`}>{new Date(m.nextDueDate).toLocaleDateString('id-ID')}</span></div></div>
                <button onClick={() => markDone(m.id)} disabled={isDoneToday} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${isDoneToday ? 'bg-emerald-600 text-white cursor-default' : 'bg-gray-900 dark:bg-white text-white dark:text-black hover:scale-[1.02]'}`}>{isDoneToday ? <><Check size={14}/> Service Tercatat Selesai</> : <><RotateCcw size={14}/> Selesaikan Service Hari Ini</>}</button>
              </div>
            );
          })
        )}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center px-4 animate-fade-in"><div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowForm(false)} /><div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[3rem] p-10 animate-scale-in border-t-8 border-orange-500 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"><div className="flex items-center justify-between mb-10"><div className="flex items-center gap-4"><div className="p-3 bg-orange-50 dark:bg-orange-950/30 text-orange-600 rounded-xl"><Wrench size={24}/></div><h3 className="text-2xl font-black uppercase tracking-tighter">Setup Perbaikan Aset</h3></div><button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer"><X size={24}/></button></div><form onSubmit={handleAdd} className="space-y-6"><div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3 flex items-center gap-1"><Package size={10}/> Pilih Alat / Aset (Dari Inventaris)</label><div className="relative"><select required autoFocus value={formData.deviceName} onChange={e => setFormData({...formData, deviceName: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-orange-500 rounded-2xl px-6 py-4 outline-none font-black text-sm uppercase appearance-none cursor-pointer"><option value="">-- PILIH NAMA ASET --</option>{assetList.map(asset => (<option key={asset.id} value={asset.name}>{asset.name}</option>))}{assetList.length === 0 && <option value="" disabled>Belum ada aset di menu Inventaris</option>}</select><ChevronDown size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3 flex items-center gap-1"><AlertCircle size={10}/> Jenis Pekerjaan</label><select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-orange-500 rounded-2xl px-6 py-4 outline-none font-black text-xs appearance-none"><option value="SERVICE">SERVICE RUTIN</option><option value="KALIBRASI">KALIBRASI ALAT</option><option value="GANTI SPAREPART">GANTI SPAREPART</option><option value="PEMBERSIHAN">PEMBERSIHAN DEEP</option></select></div><div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3 flex items-center gap-1"><ShieldAlert size={10}/> Tingkat Urgensi</label><select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-orange-500 rounded-2xl px-6 py-4 outline-none font-black text-xs appearance-none"><option value="LOW">RENDAH (LOW)</option><option value="NORMAL">STANDAR (NORMAL)</option><option value="HIGH">DARURAT (HIGH)</option></select></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3 flex items-center gap-1"><Calendar size={10}/> Tanggal Terakhir Servis</label><input type="date" value={formData.lastDoneDate} onChange={e => setFormData({...formData, lastDoneDate: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-orange-500 rounded-2xl px-6 py-4 outline-none font-black text-sm" /></div><div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3 flex items-center gap-1"><Clock size={10}/> Frekuensi Pengulangan</label><select value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value as any})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-orange-500 rounded-2xl px-6 py-4 outline-none font-black text-xs appearance-none"><option value="DAILY">SETIAP HARI</option><option value="WEEKLY">SETIAP MINGGU</option><option value="MONTHLY">SETIAP BULAN</option><option value="3_MONTHS">TIAP 3 BULAN</option><option value="6_MONTHS">TIAP 6 BULAN</option><option value="YEARLY">SETIAP TAHUN</option></select></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3 flex items-center gap-1"><Coins size={10}/> Estimasi Biaya (IDR)</label><input type="text" placeholder="Rp 0" value={formData.costEstimate ? formData.costEstimate.toLocaleString('id-ID') : ''} onChange={e => setFormData({...formData, costEstimate: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0})} className="w-full bg-indigo-50/50 dark:bg-indigo-900/10 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-6 py-4 outline-none font-black text-sm transition-all" /></div><div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3 flex items-center gap-1"><Truck size={10}/> Vendor / Teknisi Luar</label><input placeholder="NAMA TOKO / NO HP" value={formData.vendorInfo} onChange={e => setFormData({...formData, vendorInfo: e.target.value.toUpperCase()})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-orange-500 rounded-2xl px-6 py-4 outline-none font-black text-sm" /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3 flex items-center gap-1"><User size={10}/> PIC Penanggung Jawab</label><select value={formData.assignedTo} onChange={e => setFormData({...formData, assignedTo: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-orange-500 rounded-2xl px-6 py-4 outline-none font-black text-xs appearance-none"><option value="">PILIH STAFF...</option>{employees.filter(e => e.active).map(e => <option key={e.id} value={e.name}>{e.name.toUpperCase()}</option>)}</select></div><div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Instruksi Khusus / SOP</label><textarea placeholder="MISAL: MATIKAN LISTRIK SEBELUM BUKA BODY MESIN..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-orange-500 rounded-2xl px-6 py-4 outline-none font-medium text-sm resize-none h-[64px]" /></div></div><div className="pt-6"><button type="submit" className="w-full py-6 bg-orange-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-orange-700 transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer"><Save size={20}/> Terbitkan Jadwal Maintenance</button></div></form></div></div>
      )}
    </div>
  );
};

export default OpMaintenanceManager;