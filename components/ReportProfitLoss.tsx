
import React, { useState, useMemo } from 'react';
import { 
  Briefcase, ImageIcon, X, Printer, Loader2, TrendingUp, Activity, 
  ArrowDownCircle, ShieldCheck, Building2, Target, Percent, 
  ArrowUpRight, BarChart3, PieChart, Info, CheckCircle2, AlertTriangle,
  Scale, Calculator, ChevronRight, FileText, Download, Coins,
  ArrowUpCircle, ArrowDownLeft, ShieldAlert, Receipt, ArrowRight
} from 'lucide-react';
import { IncomeRecord, ExpenseRecord, BusinessInfo, CategoryConfig, PageId } from '../types';
import html2canvas from 'html2canvas';

interface Props {
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
  businessInfo: BusinessInfo;
  categories: CategoryConfig[];
  periodLabel: string;
  onNavigate?: (page: PageId) => void;
}

const ReportProfitLoss: React.FC<Props> = ({ incomes, expenses, businessInfo, categories, periodLabel, onNavigate }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [showPaper, setShowPaper] = useState(false);

  const totals = useMemo(() => {
    const totalIncome = incomes.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
    const netRevenue = Math.round(totalIncome / 1.10);
    const totalTax = totalIncome - netRevenue;
    
    const opCategoryNames = categories.filter(c => c.isOperational).map(c => c.name.toLowerCase());
    const opExpenses = expenses.filter(e => opCategoryNames.includes(e.category.toLowerCase()));
    const totalOp = opExpenses.reduce((sum, r) => sum + ((Number(r.amount) || 0) * (Number(r.qty) || 1)), 0);
    
    const nonOpExpenses = expenses.filter(e => !opCategoryNames.includes(e.category.toLowerCase()));
    const totalNonOp = nonOpExpenses.reduce((sum, r) => sum + ((Number(r.amount) || 0) * (Number(r.qty) || 1)), 0);
    
    const opProfit = netRevenue - totalOp;
    const finalBalance = opProfit - totalNonOp;

    const opByCategory = opExpenses.reduce((acc: Record<string, number>, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + (Number(curr.amount) * (Number(curr.qty) || 1));
      return acc;
    }, {});

    const nonOpByCategory = nonOpExpenses.reduce((acc: Record<string, number>, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + (Number(curr.amount) * (Number(curr.qty) || 1));
      return acc;
    }, {});

    return { totalIncome, netRevenue, totalTax, totalOp, totalNonOp, opProfit, finalBalance, opByCategory, nonOpByCategory };
  }, [incomes, expenses, categories]);

  const profitMargin = totals.netRevenue > 0 ? (totals.opProfit / totals.netRevenue) * 100 : 0;

  const formatCurrency = (val: number) => 'Rp ' + Math.round(val).toLocaleString('id-ID');

  const handleExportImage = async (e?: React.MouseEvent) => {
    const element = document.getElementById('profit-loss-paper');
    if (!element) return;
    try {
      setIsCapturing(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const canvas = await html2canvas(element, { 
        scale: 3, 
        useCORS: true, 
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.download = `LABA_RUGI_${periodLabel.replace(/\s+/g, '_')}_${new Date().getTime()}.jpg`;
      link.click();
    } finally {
      setIsCapturing(false);
    }
  };

  if (showPaper) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-200 dark:bg-black overflow-y-auto flex flex-col no-scrollbar animate-fade-in no-print">
        <div className="sticky top-0 z-[110] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b p-4 flex items-center justify-between shadow-lg">
          <button onClick={() => setShowPaper(false)} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 active:scale-95 transition-all shadow-md cursor-pointer"><X size={20} /> TUTUP PRATINJAU</button>
          <div className="flex gap-3">
            <button onClick={handleExportImage} disabled={isCapturing} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-emerald-700 active:scale-95 disabled:opacity-50 cursor-pointer">
              {isCapturing ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16}/>} SIMPAN JPG
            </button>
            <button onClick={() => window.print()} className="px-8 py-3 bg-black text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-xl hover:bg-gray-800 transition-all active:scale-95 cursor-pointer"><Printer size={18} /> CETAK PDF (LONG PAGE)</button>
          </div>
        </div>

        <div className="flex-1 py-10 flex flex-col items-center bg-gray-200 dark:bg-black/50">
          <div id="profit-loss-paper" className="bg-white text-black p-[20mm] rounded-none shadow-2xl border border-gray-100 mx-auto print-view-optimized relative" style={{ width: '210mm', minHeight: 'auto' }}>
            
            {/* WATERMARK */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.02] flex items-center justify-center rotate-[-35deg] select-none">
              <p className="text-[120px] font-black uppercase tracking-[0.3em]">CONFIDENTIAL</p>
            </div>

            {/* HEADER TERPUSAT */}
            <div className="relative z-10 flex flex-col items-center text-center mb-16 pb-12 border-b-[8px] border-black gap-4">
              {businessInfo.logoUrl ? (
                <img src={businessInfo.logoUrl} className="h-20 w-auto object-contain mb-4" alt="Logo" />
              ) : (
                <div className="w-20 h-20 bg-black text-white rounded-[2rem] flex items-center justify-center font-black text-2xl mb-4 shadow-lg">LM</div>
              )}
              <div className="space-y-2">
                <h1 className="text-4xl font-black uppercase tracking-tighter leading-none text-black">LAPORAN LABA RUGI</h1>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.6em]">{businessInfo.name.toUpperCase()} • DIGITAL FINANCIAL AUDIT</p>
                <div className="flex items-center justify-center gap-6 mt-6 px-10 py-3 bg-gray-100 rounded-full border-2 border-black">
                   <span className="text-xs font-black tracking-[0.2em] uppercase">PERIODE: {periodLabel.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 space-y-16">
              {/* I. PENDAPATAN */}
              <section className="space-y-6 break-inside-avoid">
                <div className="flex items-center gap-3 border-b-2 border-black pb-2">
                  <TrendingUp size={20} className="text-emerald-600" />
                  <h3 className="text-[11pt] font-black uppercase tracking-[0.2em]">I. RINGKASAN PENDAPATAN (REVENUE)</h3>
                </div>
                <div className="space-y-4 pl-4">
                  <div className="flex justify-between items-end border-b border-gray-200 pb-3">
                    <span className="text-[10pt] font-bold uppercase text-gray-600">Total Omzet Bruto (POS/Kasir)</span>
                    <span className="text-[11pt] font-black">{formatCurrency(totals.totalIncome)}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-gray-100 pb-3 italic text-gray-400">
                    <span className="text-[9pt] font-bold uppercase">Potongan Pajak & SC (Alokasi 10%)</span>
                    <span className="text-[10pt] font-bold">-{formatCurrency(totals.totalTax)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                    <span className="text-[11pt] font-black uppercase text-blue-900 tracking-tight">Pendapatan Bersih (Net Revenue)</span>
                    <span className="text-2xl font-black text-blue-700">{formatCurrency(totals.netRevenue)}</span>
                  </div>
                </div>
              </section>

              {/* II. BEBAN OPERASIONAL */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b-2 border-black pb-2">
                  <Activity size={20} className="text-rose-600" />
                  <h3 className="text-[11pt] font-black uppercase tracking-[0.2em]">II. RINCIAN BEBAN OPERASIONAL (OPEX)</h3>
                </div>
                <div className="space-y-1 pl-4">
                  {Object.entries(totals.opByCategory).length === 0 ? (
                    <div className="py-10 text-center text-gray-300 italic text-xs uppercase font-bold tracking-widest border-2 border-dashed rounded-3xl">Nihil pengeluaran operasional</div>
                  ) : (
                    Object.entries(totals.opByCategory).map(([cat, val]) => (
                      <div key={cat} className="flex justify-between items-end border-b border-gray-100 py-3 break-inside-avoid">
                        <span className="text-[10pt] font-bold uppercase text-gray-700">{cat}</span>
                        <span className="text-[10pt] font-black">{formatCurrency(val as number)}</span>
                      </div>
                    ))
                  )}
                  <div className="flex justify-between items-center mt-6 pt-6 border-t-4 border-black">
                    <span className="text-[11pt] font-black uppercase text-gray-500">TOTAL SELURUH BEBAN OPERASIONAL</span>
                    <span className="text-2xl font-black text-rose-700">{formatCurrency(totals.totalOp)}</span>
                  </div>
                </div>
              </section>

              {/* III. HASIL LABA OPERASIONAL */}
              <div className="p-10 rounded-[3.5rem] bg-emerald-50 border-4 border-emerald-500 shadow-inner relative overflow-hidden break-inside-avoid">
                <div className="absolute top-0 right-0 p-4 opacity-[0.05]"><Calculator size={140} /></div>
                <div className="flex justify-between items-end relative z-10">
                    <div className="space-y-2">
                      <p className="text-[10pt] font-black text-emerald-600 uppercase tracking-widest">Laba Bersih Operasional (EBITDA)</p>
                      <h4 className="text-5xl font-black text-emerald-900 tracking-tighter leading-none">{formatCurrency(totals.opProfit)}</h4>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-[10pt] font-black text-emerald-600 uppercase tracking-widest">Profit Margin</p>
                      <p className="text-4xl font-black text-emerald-900">
                          {totals.netRevenue > 0 ? ((totals.opProfit / totals.netRevenue) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                </div>
              </div>

              {/* IV. PENGELUARAN NON-OPERASIONAL */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b-2 border-black pb-2">
                  <Scale size={20} className="text-indigo-600" />
                  <h3 className="text-[11pt] font-black uppercase tracking-[0.2em]">IV. ALOKASI DANA LAINNYA (NON-OP)</h3>
                </div>
                <div className="space-y-1 pl-4">
                  {Object.entries(totals.nonOpByCategory).length === 0 ? (
                    <div className="py-10 text-center text-gray-300 italic text-xs uppercase font-bold tracking-widest border-2 border-dashed rounded-3xl">Nihil alokasi dana khusus</div>
                  ) : (
                    Object.entries(totals.nonOpByCategory).map(([cat, val]) => (
                      <div key={cat} className="flex justify-between items-end border-b border-gray-100 py-3 break-inside-avoid">
                        <span className="text-[10pt] font-bold uppercase text-gray-700">{cat}</span>
                        <span className="text-[10pt] font-black">{formatCurrency(val as number)}</span>
                      </div>
                    ))
                  )}
                  <div className="flex justify-between items-center mt-6 pt-6 border-t-4 border-indigo-600">
                    <span className="text-[11pt] font-black uppercase text-indigo-500">TOTAL ALOKASI PENGELUARAN LAIN</span>
                    <span className="text-2xl font-black text-indigo-700">{formatCurrency(totals.totalNonOp)}</span>
                  </div>
                </div>
              </section>

              {/* V. SALDO AKHIR PERIODE */}
              <div className="p-12 bg-gray-900 text-white rounded-[4rem] shadow-2xl relative overflow-hidden break-inside-avoid">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/40 to-transparent pointer-events-none"></div>
                <div className="flex justify-between items-center relative z-10">
                    <div className="space-y-2">
                      <p className="text-[12pt] font-black uppercase tracking-[0.5em] text-emerald-500/60 mb-1">FINAL PERIOD BALANCE</p>
                      <p className="text-[9pt] font-bold text-gray-400 uppercase italic">Dana bersih setelah dikurangi seluruh biaya operasional & alokasi.</p>
                    </div>
                    <div className="text-right">
                       <h4 className="text-6xl font-black tracking-tighter text-white tabular-nums leading-none">
                         {formatCurrency(totals.finalBalance).replace('Rp ', '')}<span className="text-xl text-emerald-500 ml-3 font-black">IDR</span>
                       </h4>
                    </div>
                </div>
              </div>

              {/* SIGNATURE SECTION */}
              <div className="mt-32 pt-12 border-t border-dashed border-gray-300 text-center uppercase break-inside-avoid">
                 <div className="flex justify-between px-16">
                    <div className="w-64">
                       <p className="text-[10px] font-black text-gray-400 mb-20 tracking-widest">DIPERIKSA OLEH (ADMIN)</p>
                       <div className="border-b-2 border-black w-full mb-1"></div>
                       <p className="text-[11pt] font-black text-black">{businessInfo.adminName || 'OFFICIAL ADMIN'}</p>
                    </div>
                    <div className="w-64">
                       <p className="text-[10px] font-black text-gray-400 mb-20 tracking-widest">DISAHKAN OLEH (OWNER)</p>
                       <div className="border-b-2 border-black w-full mb-1"></div>
                       <p className="text-[11pt] font-black text-black">{businessInfo.ownerName || 'DEDY SASMITO'}</p>
                    </div>
                 </div>
              </div>
            </div>

            <div className="mt-32 pt-10 border-t border-dashed border-gray-200 text-center">
              <p className="text-[8pt] font-bold text-gray-300 uppercase tracking-[0.8em]">SYSTEM GENERATED DOCUMENT • LMK DIGITAL HUB v2.5</p>
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
            #profit-loss-paper, #profit-loss-paper * { visibility: visible; }
            #profit-loss-paper {
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
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-600 text-white rounded-[1.5rem] shadow-xl">
            <TrendingUp size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight uppercase tracking-tighter">Laporan Laba Rugi</h2>
            <p className="text-sm text-gray-500 font-medium italic mt-1">Audit performa finansial periode <span className="text-emerald-600 font-black">{periodLabel}</span>.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowPaper(true)} className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50 transition-all shadow-sm cursor-pointer dark:text-white">
            <FileText size={18}/> Pratinjau Laporan Formal
          </button>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl group">
            <div className="flex justify-between items-start mb-6">
               <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform"><TrendingUp size={24}/></div>
               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Omzet</span>
            </div>
            <h4 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter truncate">{formatCurrency(totals.totalIncome)}</h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase mt-2">Gross Sales</p>
         </div>

         <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl group">
            <div className="flex justify-between items-start mb-6">
               <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform"><ShieldCheck size={24}/></div>
               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Revenue Bersih</span>
            </div>
            <h4 className="text-2xl font-black text-blue-700 dark:text-blue-400 tracking-tighter truncate">{formatCurrency(totals.netRevenue)}</h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase mt-2">Eks. Pajak & SC</p>
         </div>

         <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl group">
            <div className="flex justify-between items-start mb-6">
               <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform"><ArrowDownCircle size={24}/></div>
               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Beban Operasional</span>
            </div>
            <h4 className="text-2xl font-black text-rose-600 tracking-tighter truncate">{formatCurrency(totals.totalOp)}</h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase mt-2">OPEX Total</p>
         </div>

         <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-2xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-1000"><Coins size={100}/></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
               <div className="p-3 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform text-emerald-400"><Calculator size={24}/></div>
               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Final Balance</span>
            </div>
            <h4 className="text-2xl font-black text-emerald-400 tracking-tighter relative z-10 truncate">{formatCurrency(totals.finalBalance)}</h4>
            <p className="text-[10px] font-bold text-gray-500 uppercase mt-2 relative z-10">Sisa Bersih LMK</p>
         </div>
      </div>

      {/* BREAKDOWN TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* BEBAN OPERASIONAL BREAKDOWN */}
         <div className="lg:col-span-7 bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden">
            <div className="p-8 border-b dark:border-gray-800 flex items-center gap-4">
               <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-2xl"><Activity size={20}/></div>
               <div>
                  <h3 className="text-lg font-black uppercase tracking-tighter">Audit Beban (OPEX)</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Rincian Pengeluaran Berbasis Kategori Operasional</p>
               </div>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <th className="px-8 py-5">Kategori Operasional</th>
                        <th className="px-8 py-5 text-right">Total Biaya</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-800">
                     {Object.entries(totals.opByCategory).length === 0 ? (
                        <tr><td colSpan={2} className="py-20 text-center opacity-30 italic font-black uppercase text-[10px]">Belum ada rincian data</td></tr>
                     ) : (
                        Object.entries(totals.opByCategory).map(([cat, val]) => (
                           <tr key={cat} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                              <td className="px-8 py-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-rose-500 rounded-full"></div>
                                    <span className="text-xs font-black uppercase text-gray-700 dark:text-gray-300">{cat}</span>
                                 </div>
                              </td>
                              <td className="px-8 py-4 text-right">
                                 <span className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(val as number)}</span>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
                  <tfoot>
                     <tr className="bg-gray-50 dark:bg-gray-800/50">
                        <td className="px-8 py-6 font-black text-[10px] uppercase text-gray-400">Total Akumulasi Biaya</td>
                        <td className="px-8 py-6 text-right font-black text-lg text-rose-600">{formatCurrency(totals.totalOp)}</td>
                     </tr>
                  </tfoot>
               </table>
            </div>
         </div>

         {/* STATISTIK PROFITABILITAS */}
         <div className="lg:col-span-5 space-y-8">
            <div className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl relative overflow-hidden group h-fit">
               <div className="absolute top-0 right-0 p-8 opacity-[0.02] rotate-12 transition-transform duration-1000 group-hover:scale-110"><Target size={150}/></div>
               <div className="flex items-center gap-4 mb-10 relative z-10">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl"><Percent size={20}/></div>
                  <h3 className="text-lg font-black uppercase tracking-tighter">Profitability Ratios</h3>
               </div>
               
               <div className="space-y-8 relative z-10">
                  <div className="space-y-3">
                     <div className="flex justify-between items-end">
                        <span className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Operating Margin (EBITDA)</span>
                        <span className="text-xl font-black text-emerald-600">{Math.round(profitMargin)}%</span>
                     </div>
                     <div className="h-2 w-full bg-gray-50 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${Math.min(profitMargin, 100)}%` }} />
                     </div>
                  </div>

                  <div className="space-y-3">
                     <div className="flex justify-between items-end">
                        <span className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Efficiency Ratio (OPEX/Net Rev)</span>
                        <span className="text-xl font-black text-rose-600">
                           {totals.netRevenue > 0 ? Math.round((totals.totalOp / totals.netRevenue) * 100) : 0}%
                        </span>
                     </div>
                     <div className="h-2 w-full bg-gray-50 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${totals.netRevenue > 0 ? Math.min((totals.totalOp / totals.netRevenue) * 100, 100) : 0}%` }} />
                     </div>
                  </div>
               </div>

               <div className="mt-10 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex gap-4">
                  <Info size={24} className="text-blue-500 shrink-0 mt-1" />
                  <p className="text-[10px] text-gray-500 font-medium leading-relaxed italic">
                     <b>Operating Margin</b> menunjukkan efisiensi operasional LMK sebelum dikurangi alokasi Non-Op (Investasi/Prive). Target sehat rata-rata di atas <b>30%</b>.
                  </p>
               </div>
            </div>

            {/* ALOKASI NON-OPERASIONAL SUMMARY */}
            <div className="bg-indigo-600 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 -rotate-12 group-hover:rotate-0 transition-transform duration-1000"><Scale size={120}/></div>
               <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Dana Dialokasikan (Non-Op)</p>
                  <h4 className="text-3xl font-black tracking-tighter">{formatCurrency(totals.totalNonOp)}</h4>
                  <p className="text-[8px] font-bold text-indigo-200 uppercase mt-4 italic">Modal Terpakai / Alokasi Laba</p>
               </div>
               <button onClick={() => onNavigate?.('alokasi')} className="mt-8 w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer">
                  Buka Detail Alokasi <ArrowRight size={14}/>
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ReportProfitLoss;
