
import React, { useMemo, useState, useEffect } from 'react';
import { 
  TrendingUp, Zap, Layers, AlertCircle, Info, ShieldAlert, Search, 
  ArrowUpRight, ArrowLeft, RefreshCw, BarChart3, Clock, Package,
  CheckCircle2, Edit3, Save, X, ClipboardCheck, ArrowDownCircle,
  ShieldCheck, Printer, ImageIcon, Loader2, FileText, CheckCircle,
  TrendingDown, BadgeAlert
} from 'lucide-react';
import { Article, ExpenseRecord, Recipe, PageId } from '../types';
import html2canvas from 'html2canvas';
import { storage } from '../services/storageService';

interface Props {
  articles: Article[];
  expenses: ExpenseRecord[];
  recipes: Recipe[];
  onNavigate: (page: PageId) => void;
}

const PriceAlertsView: React.FC<Props> = ({ articles, expenses, recipes, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [auditedSpikes, setAuditedSpikes] = useState<Record<string, { status: string, note: string, date: string }>>({});
  const [showActionModal, setShowActionModal] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [tempNote, setTempNote] = useState('');
  const [tempAction, setTempAction] = useState('HARGA JUAL NAIK');

  const businessInfo = useMemo(() => storage.getBusinessInfo(), []);

  // Load status audit dari localStorage agar awet
  useEffect(() => {
    const saved = localStorage.getItem('lmk-audited-price-spikes');
    if (saved) setAuditedSpikes(JSON.parse(saved));
  }, []);

  const priceAlerts = useMemo(() => {
    const alerts: any[] = [];
    const bahanExp = expenses.filter(e => 
      e.category.includes('Bahan Baku') || 
      e.category.includes('Purchasing') ||
      e.category.includes('Pengadaan')
    );
    
    articles.forEach(art => {
      const related = bahanExp.filter(e => {
        const note = (e.notes || '').toUpperCase();
        const artName = art.name.toUpperCase();
        return note.includes(artName) || artName.includes(note);
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (related.length > 0) {
        const latestTx = related[0];
        const actualPrice = (latestTx.amount || 0) / (latestTx.qty || 1);
        const masterPrice = art.purchasePrice || 0;

        // Tampilkan jika harga naik (minimal selisih Rp 50)
        if (actualPrice > masterPrice + 50) {
          const diffNominal = actualPrice - masterPrice;
          const diffPercent = (diffNominal / (masterPrice || 1)) * 100;
          
          const affectedRecipes = recipes.filter(r => 
            r.items.some(item => item.articleId === art.id || item.name.toUpperCase() === art.name.toUpperCase())
          );

          // ID unik untuk spike ini (Gabungan ID bahan dan Tanggal Nota terakhir)
          const spikeId = `${art.id}-${latestTx.date}`;
          const auditStatus = auditedSpikes[spikeId] || { status: 'PENDING', note: '-', date: '-' };

          alerts.push({
            spikeId,
            id: art.id,
            name: art.name,
            master: masterPrice,
            actual: actualPrice,
            unit: art.unit,
            diffNominal,
            diffPercent,
            affectedCount: affectedRecipes.length,
            lastDate: latestTx.date,
            isHighRisk: diffPercent > 15,
            auditStatus: auditStatus.status,
            auditNote: auditStatus.note,
            auditDate: auditStatus.date
          });
        }
      }
    });

    return alerts.sort((a, b) => {
       // Prioritas: yang PENDING di atas, lalu berdasarkan persentase kenaikan
       if (a.auditStatus === 'AUDITED' && b.auditStatus === 'PENDING') return 1;
       if (a.auditStatus === 'PENDING' && b.auditStatus === 'AUDITED') return -1;
       return b.diffPercent - a.diffPercent;
    });
  }, [articles, expenses, recipes, auditedSpikes]);

  const handleSaveAudit = () => {
     if (!showActionModal) return;
     const updated = { 
        ...auditedSpikes, 
        [showActionModal.spikeId]: { 
           status: 'AUDITED', 
           note: `${tempAction}: ${tempNote || 'Sudah divalidasi'}`, 
           date: new Date().toISOString() 
        } 
     };
     setAuditedSpikes(updated);
     localStorage.setItem('lmk-audited-price-spikes', JSON.stringify(updated));
     setShowActionModal(null);
     setTempNote('');
  };

  const handleExportJPG = async () => {
    const element = document.getElementById('formal-price-report-paper');
    if (!element) return;
    try {
      setIsCapturing(true);
      await new Promise(r => setTimeout(r, 800));
      const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.download = `Audit_Harga_Pasar_${new Date().getTime()}.jpg`;
      link.click();
    } finally {
      setIsCapturing(false);
    }
  };

  const filteredAlerts = useMemo(() => {
    return priceAlerts.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [priceAlerts, searchTerm]);

  const formatCurrency = (val: number) => 'Rp' + Math.round(val).toLocaleString('id-ID');

  // REPORT VIEW OVERLAY
  if (showReport) {
    const stats = {
      total: priceAlerts.length,
      audited: priceAlerts.filter(a => a.auditStatus === 'AUDITED').length,
      pending: priceAlerts.filter(a => a.auditStatus === 'PENDING').length,
      avgSpike: priceAlerts.reduce((sum, a) => sum + a.diffPercent, 0) / (priceAlerts.length || 1)
    };

    return (
      <div className="fixed inset-0 z-[200] bg-gray-200 dark:bg-black overflow-y-auto flex flex-col no-scrollbar animate-fade-in no-print">
        <div className="sticky top-0 z-[210] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b p-4 flex items-center justify-between shadow-xl">
           <button onClick={() => setShowReport(false)} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 active:scale-95 transition-all cursor-pointer"><X size={20} /> TUTUP</button>
           <div className="flex gap-3">
              <button onClick={handleExportJPG} disabled={isCapturing} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl active:scale-95 disabled:opacity-50 cursor-pointer">
                {isCapturing ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16}/>} SIMPAN JPG
              </button>
              <button onClick={() => window.print()} className="px-8 py-3 bg-black text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-lg hover:bg-gray-800 transition-all active:scale-95 cursor-pointer"><Printer size={18} /> CETAK LAPORAN</button>
           </div>
        </div>

        <div className="flex-1 py-10 flex flex-col items-center">
           <div id="formal-price-report-paper" className="bg-white text-black p-[20mm] shadow-2xl border border-gray-100 mx-auto print:shadow-none relative" style={{ width: '210mm', minHeight: '297mm' }}>
              
              {/* WATERMARK */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.02] flex items-center justify-center rotate-[-35deg] select-none">
                <p className="text-[100px] font-black uppercase tracking-[0.3em]">CONFIDENTIAL</p>
              </div>

              {/* HEADER */}
              <div className="relative z-10 flex flex-col items-center text-center mb-12 pb-10 border-b-[8px] border-black gap-4">
                 {businessInfo.logoUrl ? (
                   <img src={businessInfo.logoUrl} className="h-20 w-auto object-contain mb-4" alt="Logo" />
                 ) : <div className="w-20 h-20 bg-black text-white rounded-[2rem] flex items-center justify-center font-black text-3xl mb-4 shadow-lg">LM</div>}
                 <div>
                   <h1 className="text-4xl font-black uppercase tracking-tighter leading-none text-black">LAPORAN AUDIT HARGA PASAR</h1>
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.6em]">{businessInfo.name.toUpperCase()} • COST CONTROL DIVISION</p>
                   <div className="mt-8 px-8 py-2.5 bg-gray-100 rounded-full border-2 border-black inline-block font-black text-xs uppercase tracking-widest">TGL AUDIT: {new Date().toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric'})}</div>
                 </div>
              </div>

              {/* STATS SUMMARY */}
              <div className="relative z-10 grid grid-cols-2 gap-8 mb-12">
                 <div className="p-8 bg-gray-50 border-2 border-black rounded-[2.5rem] text-center">
                    <p className="text-[9pt] font-black text-gray-400 uppercase tracking-widest mb-1">Total Fluktuasi Terdeteksi</p>
                    <h4 className="text-5xl font-black">{stats.total} <span className="text-lg opacity-40">ITEM</span></h4>
                 </div>
                 <div className="p-8 bg-emerald-50 border-4 border-emerald-500 shadow-inner text-center">
                    <p className="text-[9pt] font-black text-emerald-600 uppercase tracking-widest mb-1">Tindakan Mitigasi Diambil</p>
                    <h4 className="text-5xl font-black text-emerald-900">{stats.audited} <span className="text-lg opacity-40">ITEM</span></h4>
                 </div>
              </div>

              {/* TABLE */}
              <div className="relative z-10 space-y-6">
                 <div className="flex items-center gap-3 border-b-2 border-black pb-2">
                    <ShieldCheck size={18} className="text-emerald-600"/>
                    <h3 className="text-[11pt] font-black uppercase tracking-[0.2em]">RINCIAN VALIDASI HARGA & MITIGASI</h3>
                 </div>
                 <div className="overflow-hidden rounded-xl border-4 border-black">
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="bg-gray-100 text-black border-b-4 border-black font-black uppercase text-[8px] text-center">
                             <th className="p-3 border-r-2 border-black w-8">No</th>
                             <th className="p-3 border-r-2 border-black text-left">Nama Bahan Baku</th>
                             <th className="p-3 border-r-2 border-black w-24">Hrg Katalog</th>
                             <th className="p-3 border-r-2 border-black w-24">Hrg Pasar</th>
                             <th className="p-3 border-r-2 border-black w-14">Selisih</th>
                             <th className="p-3 text-left">Status & Tindakan Strategis</th>
                          </tr>
                       </thead>
                       <tbody className="text-[9px] font-bold uppercase">
                          {priceAlerts.map((r, idx) => (
                             <tr key={r.spikeId} className="border-b-2 border-black last:border-b-0">
                                <td className="p-2 text-center border-r-2 border-black text-gray-400 font-mono">{idx + 1}</td>
                                <td className="p-2 border-r-2 border-black"><p className="font-black text-[10px] leading-tight">{r.name}</p></td>
                                <td className="p-2 text-right border-r-2 border-black text-gray-400">{formatCurrency(r.master)}</td>
                                <td className="p-2 text-right border-r-2 border-black font-black text-rose-600">{formatCurrency(r.actual)}</td>
                                <td className="p-2 text-center border-r-2 border-black font-black bg-rose-50 text-rose-700">+{Math.round(r.diffPercent)}%</td>
                                <td className="p-2 text-left">
                                   {r.auditStatus === 'AUDITED' ? (
                                      <div className="flex flex-col gap-0.5">
                                         <span className="text-[7px] text-emerald-600 font-black">VALIDATED OK</span>
                                         <p className="text-[9px] font-black leading-tight text-gray-800">"{r.auditNote}"</p>
                                         <p className="text-[7px] text-gray-400">Tgl: {new Date(r.auditDate).toLocaleDateString('id-ID')}</p>
                                      </div>
                                   ) : (
                                      <div className="flex items-center gap-1.5 text-gray-300 italic">
                                         <Clock size={10}/>
                                         <span>MENUNGGU RESPON OWNER</span>
                                      </div>
                                   )}
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>

              {/* FOOTER FORMAL */}
              <div className="relative z-10 mt-16 p-8 bg-gray-50 border-2 border-black rounded-[2.5rem]">
                 <div className="flex items-center gap-3 mb-4 text-black">
                    <Info size={20}/>
                    <h4 className="text-xs font-black uppercase tracking-widest">Catatan Finansial</h4>
                 </div>
                 <p className="text-[9pt] font-medium leading-[1.6] italic text-gray-700">
                    Data audit ini dikumpulkan berdasarkan rekaman transaksi harian tim Purchasing. Item yang berstatus "VALIDATED" menandakan bahwa manajemen sadar akan kenaikan harga tersebut dan telah mengambil langkah mitigasi demi menjaga margin laba bersih cafe tanpa harus merevisi data historis belanja.
                 </p>
              </div>

              <div className="mt-24 grid grid-cols-2 gap-20 text-center uppercase font-black">
                 <div className="relative z-10">
                    <p className="text-[10px] text-gray-400 mb-20 tracking-widest">DIPERIKSA (FINANCE)</p>
                    <div className="border-b-2 border-black w-full mb-1"></div>
                    <p className="text-[11px] font-black">{businessInfo.adminName || 'OFFICIAL ADMIN'}</p>
                 </div>
                 <div className="relative z-10">
                    <p className="text-[10px] text-gray-400 mb-20 tracking-widest">DISETUJUI (OWNER)</p>
                    <div className="border-b-2 border-black w-full mb-1"></div>
                    <p className="text-[11px] font-black">{businessInfo.ownerName || 'DEDY SASMITO'}</p>
                 </div>
              </div>

              <div className="mt-32 pt-10 border-t border-dashed border-gray-200 text-center opacity-30">
                 <p className="text-[8pt] font-bold text-gray-300 uppercase tracking-[0.5em]">SYSTEM GENERATED OFFICIAL DOCUMENT • VALID AUDIT TRAIL v2.5</p>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="p-4 bg-rose-600 text-white rounded-[1.5rem] shadow-xl animate-pulse">
              <TrendingUp size={28} />
           </div>
           <div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Audit Strategis Harga</h2>
              <p className="text-sm text-gray-500 font-medium italic mt-2 flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-600"/> Rekam jejak koreksi harga bahan baku harian.
              </p>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
           <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari item di radar..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl pl-12 pr-4 py-3 outline-none text-sm font-medium shadow-sm transition-all focus:border-rose-500" 
              />
           </div>
           <button onClick={() => setShowReport(true)} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl hover:bg-indigo-700 transition-all cursor-pointer">
              <FileText size={18}/> Cetak Laporan Audit
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-lg flex items-center gap-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl"><AlertCircle size={20}/></div>
            <div>
               <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Menunggu Audit</p>
               <h4 className="text-xl font-black text-rose-600">{priceAlerts.filter(a => a.auditStatus === 'PENDING').length} Item</h4>
            </div>
         </div>
         <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-lg flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl"><CheckCircle2 size={20}/></div>
            <div>
               <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Selesai Audit</p>
               <h4 className="text-xl font-black text-emerald-600">{priceAlerts.filter(a => a.auditStatus === 'AUDITED').length} Item</h4>
            </div>
         </div>
         <div className="bg-indigo-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl"><Layers size={20}/></div>
            <div>
               <p className="text-[8px] font-black opacity-60 uppercase tracking-widest">Total Resep Terimbas</p>
               <h4 className="text-xl font-black">
                 {Array.from(new Set(priceAlerts.flatMap(a => a.affectedCount))).length} Menu
               </h4>
            </div>
         </div>
         <div className="bg-gray-900 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center justify-center">
            <button onClick={() => onNavigate('hpp-summary')} className="flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-widest hover:underline transition-all">
               Monitor Margin Menu <ArrowUpRight size={14}/>
            </button>
         </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden">
        <div className="p-8 border-b dark:border-gray-800 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-rose-600 rounded-full"></div>
              <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Radar Kenaikan Harga Pasar</h3>
           </div>
           <div className="px-4 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-[9px] font-black text-gray-400 uppercase tracking-widest">Update: {new Date().toLocaleDateString('id-ID')}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-5">Nama Bahan</th>
                <th className="px-6 py-5 text-right">Harga Katalog</th>
                <th className="px-6 py-5 text-right">Harga Pasar</th>
                <th className="px-6 py-5 text-center">Selisih</th>
                <th className="px-6 py-5">Status & Tindakan Strategis</th>
                <th className="px-8 py-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {filteredAlerts.length === 0 ? (
                <tr><td colSpan={6} className="py-32 text-center opacity-30 italic font-black uppercase tracking-widest text-[11px]">Sistem tidak mendeteksi lonjakan harga saat ini.</td></tr>
              ) : (
                filteredAlerts.map(alert => (
                  <tr key={alert.spikeId} className={`transition-colors group ${alert.auditStatus === 'AUDITED' ? 'bg-emerald-50/20 dark:bg-emerald-900/5' : 'hover:bg-gray-50 dark:hover:bg-gray-800/20'}`}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-colors ${alert.auditStatus === 'AUDITED' ? 'bg-emerald-100 text-emerald-600' : alert.isHighRisk ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                           <Package size={24}/>
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 dark:text-white uppercase leading-none mb-1">{alert.name}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Nota: {new Date(alert.lastDate).toLocaleDateString('id-ID')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                       <p className="text-[11px] font-bold text-gray-400 line-through decoration-1">{formatCurrency(alert.master)}</p>
                    </td>
                    <td className="px-6 py-6 text-right">
                       <p className={`text-sm font-black ${alert.auditStatus === 'AUDITED' ? 'text-emerald-600' : alert.isHighRisk ? 'text-rose-600' : 'text-amber-600'}`}>{formatCurrency(alert.actual)}</p>
                       <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">per {alert.unit}</p>
                    </td>
                    <td className="px-6 py-6 text-center">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${alert.auditStatus === 'AUDITED' ? 'bg-emerald-100 text-emerald-700' : alert.isHighRisk ? 'bg-rose-600 text-white shadow-lg' : 'bg-amber-100 text-amber-700'}`}>
                         +{Math.round(alert.diffPercent)}%
                       </span>
                    </td>
                    <td className="px-6 py-6">
                       {alert.auditStatus === 'AUDITED' ? (
                          <div className="space-y-1">
                             <div className="flex items-center gap-2 text-emerald-600">
                                <CheckCircle2 size={14}/>
                                <span className="text-[10px] font-black uppercase">Selesai Audit</span>
                             </div>
                             <p className="text-[9px] font-medium text-gray-500 italic max-w-[200px] leading-tight">"{alert.auditNote}"</p>
                             <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">Verifikasi: {new Date(alert.auditDate).toLocaleDateString('id-ID')}</p>
                          </div>
                       ) : (
                          <div className="flex items-center gap-2 text-gray-300">
                             <Clock size={14}/>
                             <span className="text-[10px] font-black uppercase tracking-widest">Menunggu Tindakan</span>
                          </div>
                       )}
                    </td>
                    <td className="px-8 py-6 text-center">
                       {alert.auditStatus === 'AUDITED' ? (
                         <button onClick={() => { setShowActionModal(alert); setTempNote(alert.auditNote.split(': ')[1] || ''); }} className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-indigo-600 rounded-xl transition-all cursor-pointer">
                            <Edit3 size={18}/>
                         </button>
                       ) : (
                         <button onClick={() => { setShowActionModal(alert); setTempNote(''); }} className="px-6 py-2.5 bg-rose-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-md hover:bg-rose-700 active:scale-95 transition-all cursor-pointer flex items-center gap-2">
                           <ClipboardCheck size={14}/> Re-Audit
                         </button>
                       )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TINDAKAN AUDIT */}
      {showActionModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center px-4 animate-fade-in no-print">
           <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowActionModal(null)} />
           <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-[3rem] p-10 shadow-2xl animate-scale-in border-t-8 border-rose-600">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl shadow-inner"><ClipboardCheck size={24}/></div>
                    <h3 className="text-xl font-black uppercase tracking-tighter">Otorisasi Re-Audit</h3>
                 </div>
                 <button onClick={() => setShowActionModal(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-all"><X size={24}/></button>
              </div>

              <div className="space-y-6">
                 <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Item Terdeteksi Naik:</p>
                    <p className="text-lg font-black uppercase text-rose-600">{showActionModal.name}</p>
                    <p className="text-[11px] font-bold text-gray-500">Kenaikan: <span className="text-rose-600">+{Math.round(showActionModal.diffPercent)}%</span> dari harga katalog.</p>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Tindakan Strategis Diambil:</label>
                    <select 
                      value={tempAction} 
                      onChange={e => setTempAction(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-rose-500 rounded-2xl px-5 py-4 outline-none font-black text-xs uppercase"
                    >
                       <option value="HARGA JUAL NAIK">NAIKKAN HARGA JUAL MENU</option>
                       <option value="CARI VENDOR BARU">CARI VENDOR ALTERNATIF (MURAH)</option>
                       <option value="PROSES REDUKSI PORSI">REDUKSI PORSI (GRAMASI TURUN)</option>
                       <option value="SINKRONISASI HPP">SINKRONISASI HPP (MARGIN TURUN)</option>
                       <option value="DIABAIKAN">DIABAIKAN (FLUKTUASI WAJAR)</option>
                    </select>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Catatan Tambahan (Opsional):</label>
                    <textarea 
                      value={tempNote} 
                      onChange={e => setTempNote(e.target.value.toUpperCase())}
                      placeholder="MISAL: SUDAH UPDATE MENU HARGA BARU..." 
                      className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-rose-500 rounded-2xl px-6 py-4 outline-none font-bold text-xs h-24 resize-none shadow-inner"
                    />
                 </div>

                 <button 
                   onClick={handleSaveAudit}
                   className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-rose-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                 >
                    <Save size={18}/> Simpan Status Audit
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* STRATEGIC INFO */}
      <div className="p-8 bg-blue-50 dark:bg-blue-900/10 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-[3rem] flex gap-6">
         <div className="p-4 bg-white dark:bg-gray-800 rounded-3xl h-fit shadow-sm">
            <Info size={32} className="text-blue-600" />
         </div>
         <div className="space-y-2">
            <h4 className="text-sm font-black uppercase text-blue-900 dark:text-blue-400">Pusat Transparansi Harga LMK</h4>
            <p className="text-[11px] text-blue-800 dark:text-blue-300 font-medium leading-relaxed italic">
               Radar ini adalah benteng pertama pertahanan margin Bapak. Setiap ada selisih antara belanja tim Purchasing dan harga master Bapak, sistem akan memberikan sinyal. Dengan melakukan <b>Re-Audit</b>, Bapak menyatakan bahwa manajemen sadar akan kenaikan tersebut dan telah mengambil langkah mitigasi (seperti menaikkan harga jual) tanpa harus menghapus data historis kenaikan tersebut dari laporan.
            </p>
         </div>
      </div>
    </div>
  );
};

export default PriceAlertsView;
