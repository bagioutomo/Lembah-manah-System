
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ClipboardList, Plus, Sparkles, CheckCircle2, Circle, 
  AlertOctagon, Clock, RotateCcw, Trash2, X, Save, 
  ShieldAlert, CalendarClock, Tag, Layers, Check, Info,
  FolderTree, Settings, PlusCircle, User, History, 
  CheckCircle, ShieldCheck, AlertCircle, Search, UserCheck,
  ChevronRight, CalendarDays, ChevronDown, Printer, ImageIcon,
  Loader2, Building2, FileCheck, Target, ZapOff, AlertTriangle,
  Zap,
  BarChart3
} from 'lucide-react';
import { OperationalChecklistItem, ChecklistLog, UserRole, Employee } from '../types';
import { storage } from '../services/storageService';
import html2canvas from 'html2canvas';

interface Props {
  checklist: OperationalChecklistItem[];
  setChecklist: React.Dispatch<React.SetStateAction<OperationalChecklistItem[]>>;
  employees?: Employee[];
  userRole: UserRole;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
}

const OpChecklistManager: React.FC<Props> = ({ checklist = [], setChecklist, employees = [], userRole, categories, setCategories }) => {
  const [activeView, setActiveView] = useState<'LIST' | 'REPORT'>('LIST');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  
  const [showPicModal, setShowPicModal] = useState(false);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [staffSearch, setStaffSearch] = useState('');

  const businessInfo = useMemo(() => storage.getBusinessInfo(), []);

  const [logs, setLogs] = useState<ChecklistLog[]>(() => {
    const saved = localStorage.getItem('lmk-op-checklist-logs-v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [formData, setFormData] = useState<Partial<OperationalChecklistItem>>({ 
    task: '', time: '08:00', priority: 'NORMAL', frequency: 'DAILY', category: categories[0] as any
  });

  useEffect(() => {
    localStorage.setItem('lmk-op-checklist-logs-v2', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const needUpdate = checklist.some(t => {
      if (!t.done || !t.lastCompletedDate) return false;
      const lastDate = new Date(t.lastCompletedDate);
      const diffDays = Math.ceil(Math.abs(now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (t.frequency === 'DAILY' && t.lastCompletedDate !== todayStr) return true;
      if (t.frequency === '3_DAYS' && diffDays >= 3) return true;
      if (t.frequency === 'WEEKLY' && diffDays >= 7) return true;
      if (t.frequency === 'MONTHLY') { if (now.getMonth() !== lastDate.getMonth() || now.getFullYear() !== lastDate.getFullYear()) return true; }
      return false;
    });
    
    if (needUpdate) {
      setChecklist((prev: OperationalChecklistItem[]) => prev.map(t => {
        if (!t.done || !t.lastCompletedDate) return t;
        const lastDate = new Date(t.lastCompletedDate);
        const diffDays = Math.ceil(Math.abs(now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        let shouldReset = false;
        if (t.frequency === 'DAILY' && t.lastCompletedDate !== todayStr) shouldReset = true;
        if (t.frequency === '3_DAYS' && diffDays >= 3) shouldReset = true;
        if (t.frequency === 'WEEKLY' && diffDays >= 7) shouldReset = true;
        if (t.frequency === 'MONTHLY') { if (now.getMonth() !== lastDate.getMonth() || now.getFullYear() !== lastDate.getFullYear()) shouldReset = true; }
        return shouldReset ? { ...t, done: false, skipped: false } : t;
      }));
    }
  }, [checklist, setChecklist]);

  const activeTasks = useMemo(() => {
    const now = new Date();
    const curTime = now.toTimeString().slice(0, 5);
    const list = Array.isArray(checklist) ? checklist : [];
    return list.filter(t => activeCategoryFilter === 'ALL' || t.category === activeCategoryFilter).map(item => ({ ...item, isOverdue: !item.done && item.frequency === 'DAILY' && item.time < curTime })).sort((a, b) => { if (a.done !== b.done) return a.done ? 1 : -1; if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1; return a.time.localeCompare(b.time); });
  }, [checklist, activeCategoryFilter]);

  const completionStats = useMemo(() => {
    const total = checklist.length;
    const done = checklist.filter(t => t.done).length;
    return { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [checklist]);

  const filteredStaff = useMemo(() => {
    return (employees || []).filter(e => e.active && e.name.toLowerCase().includes(staffSearch.toLowerCase()));
  }, [employees, staffSearch]);

  const handleToggleRequest = (id: string) => {
    const task = checklist.find(t => t.id === id);
    if (!task) return;
    if (!task.done) { setPendingTaskId(id); setShowPicModal(true); } 
    else { if(confirm('Batalkan status laporan tugas ini?')) { setChecklist((prev: OperationalChecklistItem[]) => prev.map(t => t.id === id ? { ...t, done: false, skipped: false } : t)); } }
  };

  const confirmCompletion = (staffName: string, isSkipped: boolean = false) => {
    if (!pendingTaskId) return;
    const task = checklist.find(t => t.id === pendingTaskId);
    if (!task) return;
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().slice(0, 5);
    setChecklist((prev: OperationalChecklistItem[]) => prev.map(t => t.id === pendingTaskId ? { ...t, done: true, skipped: isSkipped, lastCompletedDate: today, lastCompletedBy: staffName, lastCompletedTimestamp: new Date().toISOString() } : t));
    const newLog: ChecklistLog = { id: `log-cl-${Date.now()}`, taskId: pendingTaskId, taskName: task.task, completedBy: staffName, date: today, time: nowTime, status: isSkipped ? 'SKIPPED' : (nowTime > task.time ? 'OVERDUE' : 'COMPLETED'), timestamp: new Date().toISOString() };
    setLogs(prev => [newLog, ...prev].slice(0, 500));
    setShowPicModal(false); setPendingTaskId(null); setStaffSearch('');
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.task) return;
    const newItem: OperationalChecklistItem = { id: `cl-${Date.now()}`, task: formData.task!, done: false, skipped: false, time: formData.time || '08:00', priority: (formData.priority as any) || 'NORMAL', frequency: (formData.frequency as any) || 'DAILY', category: (formData.category as any) || categories[0] };
    setChecklist((prev: OperationalChecklistItem[]) => [...prev, newItem]);
    setShowForm(false);
    setFormData({ task: '', time: '08:00', priority: 'NORMAL', frequency: 'DAILY', category: categories[0] as any });
  };

  const handleExportJPG = async () => {
    const el = document.getElementById('checklist-report-paper');
    if (!el) return;
    try { setIsCapturing(true); await new Promise(r => setTimeout(r, 800)); const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: '#ffffff' }); const link = document.createElement('a'); link.href = canvas.toDataURL("image/jpeg", 0.95); link.download = `Audit_Ceklist_${Date.now()}.jpg`; link.click(); } finally { setIsCapturing(false); }
  };

  const getFreqLabel = (f: string) => { switch(f) { case 'DAILY': return 'Setiap Hari'; case '3_DAYS': return 'Setiap 3 Hari'; case 'WEEKLY': return 'Setiap 1 Minggu'; case 'MONTHLY': return 'Setiap 1 Bulan'; default: return f; } };
  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4"><div className="p-5 bg-indigo-600 text-white rounded-[1.8rem] shadow-2xl"><ClipboardList size={32} /></div><div><h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Manajemen Ceklist</h2><p className="text-sm text-gray-500 font-medium italic mt-2 flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500"/> Audit Kedisiplinan Tim Lapangan.</p></div></div>
        <div className="flex flex-wrap items-center gap-3">
           <button onClick={() => setShowCategoryManager(true)} className="p-4 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-2xl border hover:text-indigo-600 transition-all shadow-sm cursor-pointer" title="Master Kategori"><FolderTree size={20}/></button>
           <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border dark:border-gray-700">
              <button onClick={() => setActiveView('LIST')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeView === 'LIST' ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-md' : 'text-gray-400'}`}>Daftar Tugas</button>
              <button onClick={() => setActiveView('REPORT')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeView === 'REPORT' ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-md' : 'text-gray-400'}`}>Log Laporan</button>
           </div>
           {activeView === 'REPORT' ? (
              <button onClick={() => setShowPrintPreview(true)} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-2 cursor-pointer"><Printer size={18} /> Cetak Laporan</button>
           ) : (
              <button onClick={() => setShowForm(true)} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2 cursor-pointer"><Plus size={18} /> Tugas Baru</button>
           )}
        </div>
      </div>

      {activeView === 'LIST' ? (
        <div className="space-y-6">
           <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 transition-transform duration-1000 group-hover:rotate-0"><BarChart3 size={180} /></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                 <div className="flex-1 w-full space-y-6"><div className="flex items-center justify-between px-2"><div><p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Status Pengerjaan Harian</p><h3 className="text-2xl font-black uppercase tracking-tighter">Progres Tugas Kolektif</h3></div><div className="text-right"><span className="text-4xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">{completionStats.percent}%</span></div></div><div className="space-y-3"><div className="h-6 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner p-1"><div className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full transition-all duration-1000 ease-out shadow-lg" style={{ width: `${completionStats.percent}%` }}></div></div><div className="flex justify-between items-center px-4"><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Target size={12} className="text-indigo-500"/> {completionStats.done} dari {completionStats.total} Tugas Selesai</p><p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5"><CheckCircle size={12}/> Verified Activity</p></div></div></div>
                 <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto"><div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl text-center border border-gray-100 dark:border-gray-700"><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Tersisa</p><h4 className="text-xl font-black text-gray-700 dark:text-gray-300">{completionStats.total - completionStats.done}</h4></div><div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl text-center border border-emerald-100 dark:border-emerald-800"><p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Efisiensi</p><h4 className="text-xl font-black text-emerald-700 dark:text-emerald-400">{completionStats.percent >= 80 ? 'HIGH' : 'NORMAL'}</h4></div></div>
              </div>
           </div>

           <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border dark:border-gray-700 w-fit overflow-x-auto no-scrollbar max-w-full">
              <button onClick={() => setActiveCategoryFilter('ALL')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap ${activeCategoryFilter === 'ALL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>Semua</button>
              {categories.map((cat: string) => (
                <button key={cat} onClick={() => setActiveCategoryFilter(cat)} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap ${activeCategoryFilter === cat ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>{cat}</button>
              ))}
           </div>

           <div className="grid grid-cols-1 gap-4">
              {activeTasks.map(task => (
                <div key={task.id} className="group flex items-center gap-4 animate-slide-up">
                   <button onClick={() => handleToggleRequest(task.id)} className={`flex-1 flex items-center gap-6 p-6 rounded-[2.5rem] border-2 transition-all text-left shadow-sm ${task.done ? (task.skipped ? 'bg-orange-50/40 border-orange-100 dark:bg-orange-950/10' : 'bg-emerald-50/30 border-emerald-100 dark:bg-emerald-900/10') : (task as any).isOverdue ? 'bg-red-50/50 border-red-200 shadow-red-500/5' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-indigo-400'}`}><div className="shrink-0">{task.done ? (task.skipped ? (<div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg animate-scale-in"><ZapOff size={24} /></div>) : (<div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg animate-scale-in"><Check size={24} strokeWidth={4}/></div>)) : (task as any).isOverdue ? (<div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center animate-pulse shadow-lg"><AlertOctagon size={24}/></div>) : (<div className="w-10 h-10 rounded-full border-4 border-gray-200 group-hover:border-indigo-400 transition-colors"></div>)}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-3 mb-1"><h4 className={`text-lg font-black uppercase tracking-tight ${task.done ? (task.skipped ? 'text-orange-700 dark:text-orange-400 italic' : 'text-emerald-700 dark:text-emerald-400') : 'text-gray-900 dark:text-white'}`}>{task.task}</h4>{(task as any).isOverdue && <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[7px] font-black uppercase shadow-sm">Terlambat</span>}<span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[7px] font-black uppercase border border-indigo-100 dark:border-indigo-800">{getFreqLabel(task.frequency)}</span></div><div className="flex flex-wrap items-center gap-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest"><span className="flex items-center gap-1.5"><Clock size={12}/> Target Jam: {task.time} WIB</span><span className="flex items-center gap-1.5"><Tag size={12}/> {task.category}</span>{task.done && (<span className={`flex items-center gap-1.5 font-black px-3 py-1 rounded-lg border ${task.skipped ? 'text-orange-600 bg-orange-100 border-orange-200' : 'text-emerald-600 bg-emerald-100 border-emerald-200'}`}><User size={10}/> {task.skipped ? 'DILAPORKAN TIDAK DIKERJAKAN OLEH:' : 'PIC:'} {task.lastCompletedBy} @ {formatTime(task.lastCompletedTimestamp!)}</span>)}</div></div></button>
                   {activeCategoryFilter === 'ALL' && (<button onClick={() => { if(confirm('Hapus master tugas ini?')) setChecklist((p: OperationalChecklistItem[]) => p.filter(t => t.id !== task.id)) }} className="p-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"><Trash2 size={20}/></button>)}
                </div>
              ))}
           </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in"><div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden"><div className="p-8 border-b dark:border-gray-800 flex items-center justify-between"><h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3"><History size={24} className="text-indigo-600"/> Riwayat Audit Ceklist</h3><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">Database Terpusat</span></div><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-5">Tgl Laporan</th><th className="px-8 py-5">Nama Tugas</th><th className="px-8 py-5">Petugas (PIC)</th><th className="px-8 py-5 text-center">Status Audit</th></tr></thead><tbody className="divide-y dark:divide-gray-800">{logs.length === 0 ? (<tr><td colSpan={4} className="py-24 text-center opacity-30 italic font-black uppercase text-[11px] tracking-widest">Belum ada riwayat aktivitas pengerjaan</td></tr>) : (logs.map((log: ChecklistLog) => (<tr key={log.id} className="hover:bg-gray-50/50 transition-colors"><td className="px-8 py-5"><div className="flex flex-col"><span className="text-[11px] font-black text-gray-900 dark:text-white uppercase">{new Date(log.date).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'})}</span><span className="text-[9px] font-bold text-gray-400">{log.time} WIB</span></div></td><td className="px-8 py-5 font-black text-xs uppercase text-gray-700 dark:text-gray-300">{log.taskName}</td><td className="px-8 py-5"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[9px] font-black shadow-sm">{log.completedBy.charAt(0)}</div><span className="text-[10px] font-black uppercase text-gray-700 dark:text-gray-300">{log.completedBy}</span></div></td><td className="px-8 py-5 text-center"><span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase border ${log.status === 'SKIPPED' ? 'bg-orange-50 text-orange-600 border-orange-200' : log.status === 'OVERDUE' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>{log.status === 'SKIPPED' ? 'TIDAK DIKERJAKAN' : log.status === 'OVERDUE' ? 'TERLAMBAT' : 'TEPAT WAKTU'}</span></td></tr>)))}</tbody></table></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="bg-emerald-600 text-white p-8 rounded-[3rem] shadow-xl relative overflow-hidden group"><div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000"><ShieldCheck size={120}/></div><p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Tugas Selesai Tepat Waktu</p><h4 className="text-4xl font-black tracking-tighter">{logs.filter(l => l.status === 'COMPLETED').length} <span className="text-sm opacity-40">ITEM</span></h4></div><div className="bg-rose-600 text-white p-8 rounded-[3rem] shadow-xl relative overflow-hidden group"><div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000"><AlertCircle size={120}/></div><p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Total Keterlambatan</p><h4 className="text-4xl font-black tracking-tighter">{logs.filter(l => l.status === 'OVERDUE').length} <span className="text-sm opacity-40">ITEM</span></h4></div><div className="bg-orange-600 text-white p-8 rounded-[3rem] shadow-xl relative overflow-hidden group"><div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000"><ZapOff size={120}/></div><p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Total Tidak Dikerjakan</p><h4 className="text-4xl font-black tracking-tighter">{logs.filter(l => l.status === 'SKIPPED').length} <span className="text-sm opacity-40">ITEM</span></h4></div></div></div>
      )}

      {/* MASTER KATEGORI CEKLIST */}
      {showCategoryManager && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center px-4 animate-fade-in no-print">
           <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowCategoryManager(false)} />
           <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-10 animate-scale-in border-t-8 border-indigo-600">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3"><FolderTree size={24} className="text-indigo-600" /> Kategori Ceklist</h3>
                 <button onClick={() => setShowCategoryManager(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"><X size={24}/></button>
              </div>
              <div className="space-y-6">
                 <div className="flex gap-2">
                    <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value.toUpperCase())} placeholder="Kategori baru..." className="flex-1 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-xl px-4 py-3 outline-none font-black text-xs shadow-inner" />
                    <button onClick={() => { if(!newCatName) return; setCategories(p => [...new Set([...p, newCatName.trim().toUpperCase()])]); setNewCatName(''); }} className="p-3 bg-indigo-600 text-white rounded-xl active:scale-90 shadow-lg cursor-pointer"><Plus size={18}/></button>
                 </div>
                 <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                    {categories.map(c => (
                       <div key={c} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl group border border-transparent hover:border-indigo-200 transition-all"><span className="text-xs font-black uppercase tracking-widest">{c}</span><button onClick={() => { if(confirm(`Hapus kategori "${c}"?`)) setCategories(p => p.filter(x => x !== c)) }} className="p-2 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-xl transition-all cursor-pointer"><Trash2 size={16}/></button></div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {showPicModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 animate-fade-in no-print"><div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowPicModal(false)} /><div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-[3rem] p-10 shadow-2xl animate-scale-in border-t-8 border-indigo-600"><div className="flex items-center justify-between mb-8"><div className="flex items-center gap-4"><div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl shadow-inner"><UserCheck size={24}/></div><h3 className="text-xl font-black uppercase tracking-tighter">Otoritas Laporan</h3></div><button onClick={() => setShowPicModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer"><X size={24}/></button></div><div className="space-y-6"><p className="text-[13px] font-medium text-gray-500 italic leading-relaxed">"Pilih nama Bapak/Tim yang melaporkan status tugas ini untuk keperluan audit harian."</p><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input type="text" placeholder="Cari nama petugas..." value={staffSearch} onChange={e => setStaffSearch(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-600 rounded-2xl pl-11 pr-6 py-4 outline-none font-bold text-sm uppercase transition-all shadow-inner"/></div><div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2 space-y-3">{filteredStaff.map((staff: Employee) => (<div key={staff.id} className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 space-y-4"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black">{staff.name.charAt(0)}</div><div><p className="text-sm font-black uppercase text-gray-900 dark:text-white">{staff.name}</p><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{staff.position}</p></div></div><div className="grid grid-cols-2 gap-3"><button onClick={() => confirmCompletion(staff.name, false)} className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-md active:scale-95 cursor-pointer"><Check size={14}/> Selesai</button><button onClick={() => confirmCompletion(staff.name, true)} className="flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-md active:scale-95 cursor-pointer"><ZapOff size={14}/> DILEWATI</button></div></div>))}{filteredStaff.length === 0 && (<div className="py-10 text-center opacity-30 italic text-[10px] font-black uppercase tracking-widest border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl">Database Petugas Kosong</div>)}</div></div></div></div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center px-4 animate-fade-in"><div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowForm(false)} /><div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[3.5rem] p-10 lg:p-14 animate-scale-in border-t-8 border-indigo-600 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"><div className="flex items-center justify-between mb-10"><div className="flex items-center gap-4"><div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl shadow-inner"><Plus size={32}/></div><h3 className="text-3xl font-black uppercase tracking-tighter">Registrasi Tugas Baru</h3></div><button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer"><X size={32}/></button></div><form onSubmit={handleAdd} className="space-y-8"><div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Nama Tugas / SOP Lapangan</label><input required autoFocus placeholder="MISAL: MEMBERSIHKAN AREA BAR..." value={formData.task} onChange={e => setFormData({...formData, task: e.target.value.toUpperCase()})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-600 rounded-[1.8rem] px-8 py-5 outline-none font-black text-sm uppercase shadow-inner transition-all" /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2"><CalendarDays size={12}/> Frekuensi</label><div className="relative"><select value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value as any})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-600 rounded-[1.5rem] px-8 py-5 outline-none font-black text-xs uppercase appearance-none cursor-pointer"><option value="DAILY">SETIAP HARI</option><option value="3_DAYS">SETIAP 3 HARI</option><option value="WEEKLY">SETIAP 1 MINGGU</option><option value="MONTHLY">SETIAP 1 BULAN</option></select><ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /></div></div><div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2"><Clock size={12}/> Deadline Jam</label><input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-600 rounded-[1.5rem] px-8 py-5 outline-none font-black text-sm shadow-inner" /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2"><Tag size={12}/> Kategori</label><div className="relative"><select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-600 rounded-[1.5rem] px-8 py-5 outline-none font-black text-xs appearance-none cursor-pointer">{categories.map((c: string) => <option key={c} value={c}>{c}</option>)}</select><ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /></div></div><div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2"><ShieldAlert size={12}/> Prioritas</label><div className="relative"><select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-600 rounded-[1.5rem] px-8 py-5 outline-none font-black text-xs appearance-none cursor-pointer"><option value="NORMAL">NORMAL</option><option value="HIGH">TINGGI (HIGH)</option></select><ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /></div></div></div><button type="submit" className="w-full py-7 bg-indigo-600 text-white rounded-[2.2rem] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 cursor-pointer active:scale-95"><Save size={24}/> Daftarkan Ke Sistem</button></form></div></div>
      )}
    </div>
  );
};

export default OpChecklistManager;
