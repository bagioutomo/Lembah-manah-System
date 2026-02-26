
import React, { useState, useMemo } from 'react';
import { 
  Receipt, Calendar, Clock, CheckCircle2, AlertCircle, Wallet, Trash2, 
  Search, Filter, Tag, ShieldAlert, Play, DollarSign, ArrowRight, Plus, 
  X, Save, Printer, FileText, Building2, Truck, Smartphone, Package, 
  ChevronDown, History, FileCheck, Loader2, ImageIcon, ShieldCheck
} from 'lucide-react';
import { BillRecord, UserRole, Supplier, CategoryConfig, BusinessInfo, PageId } from '../types';
import { storage } from '../services/storageService';
import html2canvas from 'html2canvas';

interface Props {
  bills: BillRecord[];
  setBills: React.Dispatch<React.SetStateAction<BillRecord[]>>;
  onPay: (bill: BillRecord, wallet: string) => void;
  wallets: string[];
  userRole: UserRole;
  suppliers: Supplier[];
  categories: CategoryConfig[];
  onNavigate?: (page: PageId) => void;
  globalMonth: number;
  globalYear: number;
  viewMode: 'BULANAN' | 'TAHUNAN';
}

const BillsManager: React.FC<Props> = ({ bills, setBills, onPay, wallets, userRole, suppliers, categories, onNavigate, globalMonth, globalYear, viewMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [payModal, setPayModal] = useState<BillRecord | null>(null);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [printBill, setPrintBill] = useState<BillRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'UNPAID' | 'PAID'>('UNPAID');
  const [showFullReport, setShowFullReport] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const businessInfo = useMemo(() => storage.getBusinessInfo(), []);

  const isOwner = userRole === 'OWNER';
  const isAdmin = userRole === 'ADMIN';
  const isPurchasing = userRole === 'PURCHASING';
  const canAdd = isAdmin || isOwner || isPurchasing;
  const canPay = isAdmin || isOwner;

  const filteredBills = useMemo(() => {
    return bills
      .filter(b => {
        const matchStatus = b.status === activeTab;
        const matchSearch = b.title.toLowerCase().includes(searchTerm.toLowerCase());
        
        // SINKRONISASI PERIODE
        const d = new Date(b.date);
        let matchPeriod = true;
        if (viewMode === 'TAHUNAN') {
          matchPeriod = d.getFullYear() === globalYear;
        } else {
          matchPeriod = d.getMonth() === globalMonth && d.getFullYear() === globalYear;
        }
        
        return matchStatus && matchSearch && matchPeriod;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bills, activeTab, searchTerm, globalMonth, globalYear, viewMode]);

  const summary = useMemo(() => {
    const unpaid = bills.filter(b => b.status === 'UNPAID');
    const paid = bills.filter(b => b.status === 'PAID');
    const totalUnpaid = unpaid.reduce((sum, b) => sum + b.amount, 0);
    const totalPaid = paid.reduce((sum, b) => sum + b.amount, 0);
    const overdue = unpaid.filter(b => new Date(b.dueDate) < new Date());
    return { totalUnpaid, totalPaid, countUnpaid: unpaid.length, countPaid: paid.length, countOverdue: overdue.length };
  }, [bills]);

  const formatCurrency = (val: number) => 'Rp ' + (val || 0).toLocaleString('id-ID');

  const handleCaptureReport = async (e?: React.MouseEvent) => {
    const element = document.getElementById('full-bills-report');
    if (!element) return;
    try {
      setIsCapturing(true);
      await new Promise(r => setTimeout(() => r(null), 600));
      const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.download = `Rekap_Pelunasan_Tagihan_${new Date().getTime()}.jpg`;
      link.click();
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus draf tagihan ini? (Data ini belum masuk ke pengeluaran)')) {
      setBills(prev => prev.filter(b => b.id !== id));
    }
  };

  const monthsList = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  if (printBill) {
    return (
      <div className="animate-fade-in pb-20 no-scrollbar">
        <div className="sticky top-0 z-[60] bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b dark:border-gray-800 p-4 flex items-center justify-between no-print shadow-md">
          <button onClick={() => setPrintBill(null)} className="flex items-center gap-2 text-gray-500 hover:text-black font-black text-xs uppercase transition-all px-4 py-2 rounded-xl cursor-pointer"><X size={20} /> Tutup</button>
          <button onClick={() => window.print()} className="px-8 py-3 bg-black text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-2xl hover:scale-105 transition-all"><Printer size={18} /> Cetak Invoice</button>
        </div>
        <div className="paper-preview print-container transition-all duration-500 !min-h-[200mm]">
          <div className="flex justify-between items-start mb-10 border-b-4 border-black pb-8">
             <div className="flex items-start gap-6">
                {businessInfo.logoUrl && <div className="w-20 h-20 flex-shrink-0"><img src={businessInfo.logoUrl} alt="Logo" className="w-full h-full object-contain" /></div>}
                <div>
                  <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">Lembah Manah Kopi</h1>
                  <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.3em] mt-1">Sistem Manajemen Tagihan Vendor</p>
                  <div className="text-[10px] space-y-0.5 mt-4 font-bold uppercase">
                     <p>{businessInfo.address || 'Boyolali, Jawa Tengah'}</p>
                     <p>Kontak: {businessInfo.phone || '-'}</p>
                  </div>
                </div>
             </div>
             <div className="text-right">
                <div className={`inline-block px-4 py-2 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-lg ${printBill.status === 'PAID' ? 'bg-green-600' : 'bg-black'}`}>{printBill.status === 'PAID' ? 'OFFICIAL RECEIPT' : 'OFFICIAL BILL DRAFT'}</div>
                <p className="text-[10px] font-black mt-2 uppercase">NO: {printBill.id.slice(-8).toUpperCase()}</p>
             </div>
          </div>
          <div className="grid grid-cols-2 gap-12 mb-10">
             <div className="space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-1">DITUJUKAN KEPADA:</p>
                <div className="space-y-1"><p className="text-sm font-black uppercase">{printBill.title}</p><p className="text-[10px] font-bold text-gray-500 uppercase">Kategori: {printBill.category}</p></div>
             </div>
             <div className="space-y-4 text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-1">INFORMASI TANGGAL:</p>
                <div className="space-y-1"><p className="text-[10pt] font-bold uppercase">Tgl Tagihan: {new Date(printBill.date).toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric'})}</p><p className={`text-[10pt] font-black uppercase ${printBill.status === 'PAID' ? 'text-green-600' : `text-red-600`}`}>{printBill.status === 'PAID' ? 'STATUS: LUNAS' : `Jatuh Tempo: ${new Date(printBill.dueDate).toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric'})}`}</p></div>
             </div>
          </div>
          <div className="mb-10">
             <table className="w-full border-collapse">
                <thead><tr className="bg-gray-100 text-black border-y-2 border-black font-black uppercase text-[10px]"><th className="p-4 text-left">Item / Kategori</th><th className="p-4 text-center w-32">Kuantitas</th><th className="p-4 text-right">Harga Satuan</th><th className="p-4 text-right w-32">Subtotal</th></tr></thead>
                <tbody>
                   {(printBill.items || []).map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-200"><td className="p-4"><p className="text-xs font-black uppercase tracking-tight">{item.description}</p><p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{item.category}</p></td><td className="p-4 text-center text-xs font-black">{item.qty || 1}</td><td className="p-4 text-right text-xs font-bold text-gray-600">{formatCurrency(item.unitPrice || 0)}</td><td className="p-4 text-right text-sm font-black">{formatCurrency(item.amount)}</td></tr>
                   ))}
                   <tr className="bg-gray-50 font-black"><td colSpan={3} className="p-4 text-[10px] uppercase text-right">TOTAL TAGIHAN</td><td className="p-4 text-right text-lg">{formatCurrency(printBill.amount)}</td></tr>
                </tbody>
             </table>
          </div>
          <div className="mt-32 flex justify-between px-10">
             <div className="text-center w-48"><p className="text-[9px] font-black uppercase mb-16 text-gray-400">Verifikator Finance</p><div className="border-b-2 border-black w-full"></div><p className="text-[9px] font-black mt-2 uppercase">{businessInfo.adminName}</p></div>
             <div className="text-center w-48"><p className="text-[9px] font-black uppercase mb-16 text-gray-400">Penerima / Vendor</p><div className="border-b-2 border-black w-full"></div><p className="text-[9px] font-black mt-2 uppercase">{printBill.title}</p></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className={`p-4 rounded-[1.5rem] text-white shadow-xl transition-colors duration-500 ${activeTab === 'PAID' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
            {activeTab === 'PAID' ? <History size={28} /> : <Receipt size={28} />}
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight uppercase tracking-tighter">{activeTab === 'PAID' ? 'Riwayat Pelunasan' : 'Manajemen Tagihan'}</h2>
            <p className="text-sm text-gray-500 font-medium italic">Menampilkan tagihan periode <span className="text-blue-600 font-black uppercase">{viewMode === 'BULANAN' ? `${monthsList[globalMonth]} ${globalYear}` : `Tahun ${globalYear}`}</span>.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border dark:border-gray-700">
             <button onClick={() => setActiveTab('UNPAID')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'UNPAID' ? 'bg-white dark:bg-gray-900 text-blue-600 shadow-md' : 'text-gray-400'}`}>Tagihan Aktif</button>
             <button onClick={() => setActiveTab('PAID')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'PAID' ? 'bg-white dark:bg-gray-900 text-emerald-600 shadow-md' : 'text-gray-400'}`}>Lunas</button>
          </div>
          {activeTab === 'PAID' ? (
             <button onClick={() => setShowFullReport(true)} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-emerald-700 transition-all cursor-pointer"><Printer size={18} /> Cetak Laporan Rekap</button>
          ) : canAdd && (
            <button onClick={() => onNavigate?.('tagihan-baru')} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all cursor-pointer"><Plus size={18} /> Tambah Tagihan</button>
          )}
        </div>
      </div>

      <div className="relative max-w-md w-full no-print">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input type="text" placeholder="Cari suplier/vendor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl pl-12 pr-4 py-3 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium shadow-sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredBills.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white dark:bg-gray-900 rounded-[2.5rem] border-2 border-dashed dark:border-gray-800 opacity-40 font-black uppercase tracking-[0.4em] text-xs">Tidak ada data tagihan pada periode ini</div>
        ) : (
          filteredBills.map(bill => {
            const isOverdue = new Date(bill.dueDate) < new Date() && bill.status === 'UNPAID';
            return (
              <div key={bill.id} className={`bg-white dark:bg-gray-900 rounded-[2.5rem] border-2 p-8 transition-all hover:shadow-2xl relative overflow-hidden group ${bill.status === 'PAID' ? 'border-emerald-500 dark:border-emerald-900/50' : isOverdue ? 'border-red-500 shadow-red-500/10' : 'border-gray-100 dark:border-gray-800'}`}>
                <div className="flex justify-between items-start mb-8">
                  <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${bill.status === 'PAID' ? 'bg-emerald-600 text-white' : isOverdue ? 'bg-red-600 text-white animate-pulse' : 'bg-blue-100 text-blue-700'}`}>
                    {bill.status === 'PAID' ? 'LUNAS' : isOverdue ? 'TERLAMBAT' : 'PENDING'}
                  </div>
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setPrintBill(bill)} className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-xl transition-all cursor-pointer"><Printer size={18}/></button>
                    {bill.status === 'UNPAID' && canAdd && (
                      <button onClick={() => handleDelete(bill.id)} className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"><Trash2 size={18}/></button>
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1 uppercase tracking-tighter truncate leading-none group-hover:text-indigo-600 transition-colors">{bill.title}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Tag size={12} className="text-gray-300"/> {bill.category}</p>
                <div className="flex justify-between items-end mb-8 border-t dark:border-gray-800 pt-6">
                   <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Nilai Faktur</p>
                      <p className={`text-2xl font-black tracking-tighter ${bill.status === 'PAID' ? 'text-emerald-700 dark:text-emerald-400' : 'text-blue-700 dark:text-blue-400'}`}>{formatCurrency(bill.amount)}</p>
                   </div>
                </div>
                {bill.status === 'UNPAID' ? (
                  canPay ? (
                    <button onClick={() => setPayModal(bill)} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-95 cursor-pointer">
                      <Wallet size={18} /> Bayar Sekarang
                    </button>
                  ) : (
                    <div className="w-full py-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"><ShieldAlert size={16} /> Menunggu Otorisasi</div>
                  )
                ) : (
                  <div className="w-full py-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-800 shadow-inner"><CheckCircle2 size={18} /> Faktur Telah Lunas</div>
                )}
              </div>
            );
          })
        )}
      </div>

      {payModal && canPay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-fade-in">
           <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={() => setPayModal(null)} />
           <div className="relative w-full max-md bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-10 animate-scale-in border-t-8 border-blue-600">
              <h3 className="text-3xl font-black mb-2 uppercase tracking-tighter">Otorisasi Pembayaran</h3>
              <p className="text-xs text-gray-500 font-medium mb-10 leading-relaxed italic">"Bapak sedang memproses pelunasan faktur <b>{payModal.title}</b>. Data akan otomatis tercatat sebagai pengeluaran resmi."</p>
              <div className="space-y-6 mb-10">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Gunakan Dana Dari Dompet:</label>
                    <div className="relative">
                       <select value={selectedWallet} onChange={e => setSelectedWallet(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl outline-none font-black text-sm border-2 border-transparent focus:border-blue-600 appearance-none cursor-pointer">
                           <option value="">-- PILIH DOMPET DANA --</option>
                           {wallets.map(w => <option key={w} value={w}>{w.toUpperCase()}</option>)}
                       </select>
                       <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                 </div>
              </div>
              <div className="flex flex-col gap-3">
                 <button onClick={() => { if (!selectedWallet) return alert('Mohon pilih dompet sumber dana'); onPay(payModal, selectedWallet); setPayModal(null); }} className="w-full py-5 bg-green-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-green-800 transition-all active:scale-95 cursor-pointer">Konfirmasi Pelunasan</button>
                 <button onClick={() => setPayModal(null)} className="w-full py-4 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-all cursor-pointer">Batalkan</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default BillsManager;
