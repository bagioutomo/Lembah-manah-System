import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Printer, 
  X, 
  ChevronRight, 
  History, 
  ImageIcon, 
  Loader2, 
  CheckCircle2, 
  Building 
} from 'lucide-react';
import { ExpenseRecord, Employee, UserRole } from '../types';
import { storage } from '../services/storageService';
import html2canvas from 'html2canvas';

interface Props {
  expenses: ExpenseRecord[];
  employees: Employee[];
  selectedMonth: number;
  selectedYear: number;
  userRole: UserRole;
}

const PayrollSlips: React.FC<Props> = ({ expenses, employees, selectedMonth, selectedYear }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingSlip, setViewingSlip] = useState<any | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const businessInfo = useMemo(() => storage.getBusinessInfo(), []);
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const periodLabel = `${months[selectedMonth]} ${selectedYear}`;

  const paidSlips = useMemo(() => {
    // 1. Filter semua transaksi payroll bulan ini
    const payrollExpenses = expenses.filter(e => 
      (e.category === 'Gaji Pokok' || e.category === 'Gaji Part-time' || e.category === 'Overtime' || e.category === 'Bonus Target' || e.category === 'Service Charge') && 
      e.notes.includes(periodLabel)
    );

    const grouped: Record<string, any> = {};

    payrollExpenses.forEach(exp => {
      // Ekstrak nama karyawan dari notes: "NAMA (Periode)"
      const nameMatch = exp.notes.match(/\]\s(.*?)\s\(/) || exp.notes.match(/^\[.*?\]\s(.*?)\s\(/);
      if (!nameMatch) return;
      const name = nameMatch[1].trim();

      const txIdMatch = exp.notes.match(/\[TXID:(\d+)\]/);
      const txId = txIdMatch ? txIdMatch[1] : `legacy-${exp.timestamp}`;
      const uniqueKey = `${name}-${txId}`;

      if (!grouped[uniqueKey]) {
        const emp = employees.find(e => e.name.trim().toLowerCase() === name.toLowerCase());
        
        // Metadata parsing dari entri Gaji Pokok
        const baseMasterMatch = exp.notes.match(/\[B:(\d+)\]/);
        const otHoursMatch = exp.notes.match(/\[OT:(.*?)\]/);
        const daMatch = exp.notes.match(/\[DA:(\d+)\]/);
        const doMatch = exp.notes.match(/\[DO:(\d+)\]/);

        grouped[uniqueKey] = {
          id: exp.id,
          txId,
          name,
          position: emp?.position || 'Staff',
          datePaid: exp.date,
          baseMaster: baseMasterMatch ? parseInt(baseMasterMatch[1]) : 0,
          otHours: otHoursMatch ? otHoursMatch[1] : 0,
          otAmount: 0,
          scNet: 0,
          bonusNet: 0,
          deductionAbsence: daMatch ? parseInt(daMatch[1]) : 0,
          deductionOther: doMatch ? parseInt(doMatch[1]) : 0,
          totalNet: 0
        };
      }

      // Akumulasi nominal berdasarkan kategori transaksi
      if (exp.category === 'Gaji Pokok') {
        // Gaji Pokok yang disimpan adalah Net (Base - D), kita rekonstruksi jika metadata hilang
        if (grouped[uniqueKey].baseMaster === 0) grouped[uniqueKey].baseMaster = exp.amount;
      } else if (exp.category === 'Overtime') {
        grouped[uniqueKey].otAmount += exp.amount;
      } else if (exp.category === 'Bonus Target') {
        grouped[uniqueKey].bonusNet += exp.amount;
      } else if (exp.category === 'Service Charge') {
        grouped[uniqueKey].scNet += exp.amount;
      }

      // Total akhir slip adalah jumlah seluruh entri biaya terkait karyawan tersebut
      grouped[uniqueKey].totalNet += exp.amount;
    });

    return Object.values(grouped)
      .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime());
  }, [expenses, employees, periodLabel, searchTerm]);

  const formatCurrency = (val: number) => 'Rp ' + Math.floor(val).toLocaleString('id-ID');

  const handleExportImage = async (slip: any) => {
    const element = document.getElementById('slip-design-professional');
    if (!element) return;
    try {
      setIsCapturing(true);
      await new Promise(r => setTimeout(r, 600));
      const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.href = canvas.toDataURL("image/jpeg", 0.9);
      link.download = `Slip_Gaji_${slip.name.replace(/\s+/g, '_')}_${periodLabel}.jpg`;
      link.click();
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 no-print">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gray-900 text-white rounded-[1.5rem] shadow-xl"><History size={28} /></div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Arsip Slip Gaji</h2>
            <p className="text-sm text-gray-500 font-medium italic">Dokumentasi resmi periode <b>{periodLabel}</b>.</p>
          </div>
        </div>
      </div>

      <div className="max-w-md relative no-print">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input type="text" placeholder="Cari nama staff..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl pl-12 pr-6 py-3 outline-none font-bold text-sm shadow-sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
        {paidSlips.length === 0 ? (
          <div className="col-span-full py-24 text-center border-2 border-dashed rounded-[3rem] opacity-40 font-black uppercase text-[10px]">Belum ada slip terdata</div>
        ) : (
          paidSlips.map(slip => (
            <div key={slip.txId} className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-lg hover:shadow-2xl transition-all">
               <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 flex items-center justify-center font-black text-sm">{slip.name.charAt(0)}</div>
                  <div className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[7px] font-black uppercase border border-emerald-100">VERIFIED</div>
               </div>
               <h3 className="text-xl font-black uppercase tracking-tighter mb-1">{slip.name}</h3>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">{slip.position}</p>
               <div className="space-y-2 mb-8 pt-4 border-t border-dashed text-[10px] font-bold uppercase">
                  <div className="flex justify-between text-gray-400"><span>Tgl Bayar:</span><span className="text-gray-900 dark:text-gray-200">{new Date(slip.datePaid).toLocaleDateString('id-ID')}</span></div>
                  <div className="flex justify-between text-gray-400"><span>Total Netto:</span><span className="text-gray-900 dark:text-gray-200 font-black">{formatCurrency(slip.totalNet)}</span></div>
               </div>
               <button onClick={() => setViewingSlip(slip)} className="w-full py-4 bg-gray-900 text-white dark:bg-white dark:text-black rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer">Lihat Slip <ChevronRight size={14}/></button>
            </div>
          ))
        )}
      </div>

      {viewingSlip && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-fade-in">
           <div className="fixed inset-0 bg-black/80 backdrop-blur-md no-print" onClick={() => setViewingSlip(null)} />
           <div className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl p-6 sm:p-10 animate-scale-in max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex items-center justify-between mb-8 no-print border-b pb-4">
                 <h3 className="text-xl font-black uppercase tracking-tighter">Statement Preview</h3>
                 <button onClick={() => setViewingSlip(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"><X size={24}/></button>
              </div>
              
              <div id="slip-design-professional" className="bg-white p-12 sm:p-16 text-black font-sans border border-gray-100 relative overflow-hidden">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-10 border-b-4 border-black mb-10 relative z-10">
                    <div className="flex items-center gap-5">
                       {businessInfo.logoUrl ? (
                         <img src={businessInfo.logoUrl} alt="Logo" className="h-16 w-auto object-contain" />
                       ) : <div className="w-14 h-14 bg-black text-white rounded-xl flex items-center justify-center"><Building size={32}/></div>}
                       <div>
                          <h1 className="text-2xl font-black uppercase tracking-tighter leading-none text-black">LEMBAH MANAH KOPI</h1>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mt-1">Official Payroll Statement</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Masa Penggajian</p>
                       <p className="text-sm font-black uppercase border-b-2 border-black pb-0.5">{periodLabel.toUpperCase()}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-10 mb-12 relative z-10 text-[10px] font-bold uppercase">
                    <div className="space-y-6">
                       <div><p className="text-[8px] font-black text-gray-400 tracking-widest mb-1">NAMA KARYAWAN</p><p className="text-lg font-black tracking-tight">{viewingSlip.name}</p></div>
                       <div><p className="text-[8px] font-black text-gray-400 tracking-widest mb-1">JABATAN / DIVISI</p><p className="text-xs">{viewingSlip.position}</p></div>
                    </div>
                    <div className="text-right space-y-6">
                       <div><p className="text-[8px] font-black text-gray-400 tracking-widest mb-1">ID TRANSAKSI</p><p className="text-xs font-mono">#TX-{viewingSlip.txId}</p></div>
                       <div><p className="text-[8px] font-black text-gray-400 tracking-widest mb-1">TANGGAL PENERIMAAN</p><p className="text-xs">{new Date(viewingSlip.datePaid).toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric'})}</p></div>
                    </div>
                 </div>

                 <div className="space-y-10 mb-16 relative z-10">
                    <div>
                       <div className="flex items-center gap-2 border-b-2 border-black pb-2 mb-4">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">I. PENERIMAAN / EARNINGS</span>
                       </div>
                       <div className="space-y-3">
                          <div className="flex justify-between items-end border-b border-gray-100 pb-2">
                             <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-gray-700">Gaji Pokok Dasar</span><span className="text-[8px] text-gray-400 uppercase font-bold italic">Base monthly salary fixed</span></div>
                             <span className="text-sm font-black">{formatCurrency(viewingSlip.baseMaster)}</span>
                          </div>
                          {viewingSlip.otAmount > 0 && (
                             <div className="flex justify-between items-end border-b border-gray-100 pb-2">
                                <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-gray-700">Lembur (Overtime)</span><span className="text-[8px] text-gray-400 uppercase font-bold italic">{viewingSlip.otHours} Jam Kerja Ekstra</span></div>
                                <span className="text-sm font-black">{formatCurrency(viewingSlip.otAmount)}</span>
                             </div>
                          )}
                          <div className="flex justify-between items-end border-b border-gray-100 pb-2">
                             <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-gray-700">Bonus Performa (Net)</span><span className="text-[8px] text-gray-400 uppercase font-bold italic">Achieved target incentives</span></div>
                             <span className="text-sm font-black">{formatCurrency(viewingSlip.bonusNet)}</span>
                          </div>
                          <div className="flex justify-between items-end border-b border-gray-100 pb-2">
                             <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-gray-700">Service Charge (Net)</span><span className="text-[8px] text-gray-400 uppercase font-bold italic">Service point distributions</span></div>
                             <span className="text-sm font-black">{formatCurrency(viewingSlip.scNet)}</span>
                          </div>
                       </div>
                    </div>

                    <div>
                       <div className="flex items-center gap-2 border-b-2 border-black pb-2 mb-4">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">II. POTONGAN / DEDUCTIONS</span>
                       </div>
                       <div className="space-y-3">
                          {viewingSlip.deductionAbsence > 0 && (
                            <div className="flex justify-between items-end border-b border-gray-100 pb-2">
                               <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-gray-700">Izin & Absensi</span><span className="text-[8px] text-gray-400 uppercase font-bold italic">Absence proportional deduction (26 Days Basis)</span></div>
                               <span className="text-sm font-black text-red-600">-{formatCurrency(viewingSlip.deductionAbsence)}</span>
                            </div>
                          )}
                          {viewingSlip.deductionOther > 0 && (
                            <div className="flex justify-between items-end border-b border-gray-100 pb-2">
                               <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-gray-700">Potongan Lain-lain</span><span className="text-[8px] text-gray-400 uppercase font-bold italic">Cash bon, loan, or other adjustments</span></div>
                               <span className="text-sm font-black text-red-600">-{formatCurrency(viewingSlip.deductionOther)}</span>
                            </div>
                          )}
                          {viewingSlip.deductionAbsence === 0 && viewingSlip.deductionOther === 0 && (
                             <p className="text-[10px] font-bold text-gray-300 italic uppercase">Nihil Potongan</p>
                          )}
                       </div>
                    </div>
                 </div>

                 <div className="border-t-4 border-black pt-8 mb-20 flex justify-between items-center relative z-10">
                    <div className="bg-gray-50 px-6 py-4 rounded-xl border-l-8 border-black">
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-1">TOTAL TERIMA (NETTO)</p>
                       <p className="text-[8px] font-bold text-gray-400 uppercase italic">Take home pay after all adjustments</p>
                    </div>
                    <p className="text-4xl font-black tracking-tighter">{formatCurrency(viewingSlip.totalNet)}</p>
                 </div>

                 <div className="flex justify-between items-start px-4 mb-12 relative z-10 text-center uppercase">
                    <div className="w-48"><p className="text-[9px] font-black text-gray-400 tracking-widest mb-16">PENERIMA</p><div className="border-b-2 border-black w-full mb-1"></div><p className="text-[10px] font-black">{viewingSlip.name}</p></div>
                    <div className="w-48"><p className="text-[9px] font-black text-gray-400 tracking-widest mb-16">KEUANGAN</p><div className="border-b-2 border-black w-full mb-1"></div><p className="text-[10px] font-black">FINANCE MANAGER</p></div>
                 </div>

                 <div className="text-center pt-8 border-t border-dashed border-gray-200 relative z-10">
                    <p className="text-[7px] font-bold text-gray-300 uppercase tracking-[0.6em]">SYSTEM GENERATED PAYROLL STATEMENT • LEMBAH MANAH DIGITAL HUB v2.5</p>
                 </div>
              </div>

              <div className="mt-8 flex gap-4 no-print pb-6">
                 <button onClick={() => window.print()} className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"><Printer size={18}/> Cetak</button>
                 <button onClick={() => handleExportImage(viewingSlip)} disabled={isCapturing} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-emerald-700 disabled:opacity-50">
                    {isCapturing ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18}/>} Simpan JPG
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PayrollSlips;