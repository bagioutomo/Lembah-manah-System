
import React, { useState } from 'react';
import { 
  Share2, Download, TrendingUp, Loader2, ShieldCheck, Activity, 
  Wallet, CreditCard, Coins, Smartphone, Landmark, Banknote,
  LayoutGrid, History
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { BusinessInfo } from '../types';

interface Props {
  totalIncome: number;
  netRevenue: number;
  totalOp: number;
  opProfit: number;
  finalBalance: number;
  walletBalances: Record<string, number>;
  wallets: string[];
  periodLabel: string;
  businessInfo: BusinessInfo;
}

const ReportShareHub: React.FC<Props> = ({ 
  totalIncome, netRevenue, totalOp, opProfit, finalBalance, 
  walletBalances, wallets, periodLabel, businessInfo 
}) => {
  const [activeCard, setActiveCard] = useState<'PROFIT' | 'WALLET'>('PROFIT');
  const [isCapturing, setIsCapturing] = useState(false);

  const formatCurrency = (val: number) => 'Rp ' + Math.floor(val).toLocaleString('id-ID');
  
  const profitMargin = netRevenue > 0 ? (opProfit / netRevenue) * 100 : 0;
  const isHealthy = profitMargin >= 30;

  // Hitung Total Likuiditas Realtime (Nilai b sudah dikalikan Qty di pemanggil prop ini)
  const totalLiquidity = Object.values(walletBalances).reduce((a, b) => (a as number) + (b as number), 0) as number;

  // Pengelompokan Dompet untuk tampilan lebih rapi
  const bankWallets = wallets.filter(w => !w.toLowerCase().includes('cash') && walletBalances[w] !== 0);
  const cashWallets = wallets.filter(w => w.toLowerCase().includes('cash') && walletBalances[w] !== 0);

  const captureCard = async () => {
    const id = activeCard === 'PROFIT' ? 'profit-summary-card' : 'wallet-summary-card';
    const element = document.getElementById(id);
    if (!element) return;
    try {
      setIsCapturing(true);
      await new Promise(r => setTimeout(r, 600));
      const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      const suffix = activeCard === 'PROFIT' ? 'P_and_L' : 'Liquidity';
      link.download = `LM_Report_${suffix}_${periodLabel.replace(/\s+/g, '_')}.jpg`;
      link.click();
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-10 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 no-print">
         <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-600 text-white rounded-[1.5rem] shadow-xl"><Share2 size={28} /></div>
            <div>
               <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Executive Share Hub</h2>
               <p className="text-sm text-gray-500 font-medium italic mt-2">Pilih kartu laporan yang ingin Bapak unduh sebagai JPG.</p>
            </div>
         </div>
         <div className="flex gap-3">
            <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border dark:border-gray-700">
               <button onClick={() => setActiveCard('PROFIT')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeCard === 'PROFIT' ? 'bg-white dark:bg-gray-900 text-emerald-600 shadow-md' : 'text-gray-400'}`}>Laba Rugi</button>
               <button onClick={() => setActiveCard('WALLET')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeCard === 'WALLET' ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-md' : 'text-gray-400'}`}>Status Dompet</button>
            </div>
            <button onClick={captureCard} disabled={isCapturing} className="px-10 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase flex items-center gap-3 shadow-xl hover:bg-emerald-700 disabled:opacity-50 transition-all">
              {isCapturing ? <Loader2 size={18} className="animate-spin"/> : <><Download size={18}/> Simpan JPG</>}
            </button>
         </div>
      </div>
      
      <div className="max-w-md mx-auto relative perspective-1000">
         {/* KARTU 1: PROFIT & LOSS SUMMARY */}
         {activeCard === 'PROFIT' && (
            <div id="profit-summary-card" className="bg-white text-black p-10 rounded-[3.5rem] shadow-2xl border border-gray-100 overflow-hidden relative animate-scale-in">
               <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12"><TrendingUp size={240}/></div>
               
               <div className="flex flex-col items-center text-center mb-10 pb-8 border-b-4 border-black gap-4 relative z-10">
                  {businessInfo.logoUrl ? (
                     <img src={businessInfo.logoUrl} className="h-14 mb-1 object-contain" alt="Logo" />
                  ) : <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center"><Activity size={24}/></div>}
                  <div>
                     <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">EXECUTIVE SUMMARY</h3>
                     <p className="text-[10px] font-black text-emerald-600 tracking-[0.3em] mt-1">LEMBAH MANAH KOPI</p>
                  </div>
               </div>

               <div className="space-y-6 relative z-10">
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-1"><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Gross Revenue</p><p className="text-sm font-black">{formatCurrency(totalIncome)}</p></div>
                     <div className="space-y-1 text-right"><p className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Net Revenue</p><p className="text-sm font-black text-blue-700">{formatCurrency(netRevenue)}</p></div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-1"><p className="text-[8px] font-black text-rose-600 uppercase tracking-widest">Total OPEX</p><p className="text-sm font-black text-rose-700">{formatCurrency(totalOp)}</p></div>
                     <div className="space-y-1 text-right"><p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Operating Profit</p><p className="text-sm font-black text-emerald-700">{formatCurrency(opProfit)}</p></div>
                  </div>

                  <div className={`p-6 rounded-3xl flex justify-between items-center ${isHealthy ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-700' : 'bg-orange-50 border-2 border-orange-500 text-orange-700'}`}>
                     <div><p className="text-[8px] font-black uppercase tracking-widest">Profit Margin</p><p className="text-2xl font-black tracking-tighter">{Math.round(profitMargin)}%</p></div>
                     <div className="text-right"><p className="text-[8px] font-black uppercase tracking-widest">Health Status</p><p className="text-xs font-black uppercase">{isHealthy ? 'EXCELLENT' : 'STABLE'}</p></div>
                  </div>

                  <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-xl text-center">
                     <p className="text-[9px] font-black opacity-40 uppercase tracking-[0.4em] mb-2">PERIODE LAPORAN</p>
                     <p className="text-xl font-black text-green-400 tracking-widest">{periodLabel.toUpperCase()}</p>
                  </div>
               </div>
               <div className="mt-10 pt-6 border-t border-dashed border-gray-200 text-center"><p className="text-[7px] font-bold text-gray-300 uppercase tracking-[0.4em]">OFFICIAL FINANCIAL AUDIT v2.5</p></div>
            </div>
         )}

         {/* KARTU 2: LIQUIDITY & WALLET REPORT */}
         {activeCard === 'WALLET' && (
            <div id="wallet-summary-card" className="bg-white text-black p-10 rounded-[3.5rem] shadow-2xl border border-gray-100 overflow-hidden relative animate-scale-in">
               <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12"><Wallet size={240}/></div>

               <div className="flex flex-col items-center text-center mb-6 pb-6 border-b-4 border-black gap-4 relative z-10">
                  <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg"><Coins size={28}/></div>
                  <div>
                     <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">LIQUIDITY REPORT</h3>
                     <p className="text-[10px] font-black text-indigo-600 tracking-[0.3em] mt-1">POSISI KAS & DANA AKTIF</p>
                  </div>
               </div>

               <div className="space-y-6 relative z-10">
                  {/* HERO TOTAL SECTION */}
                  <div className="p-8 bg-indigo-700 text-white rounded-[2.5rem] shadow-xl text-center relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                     <p className="text-[9px] font-black opacity-60 uppercase tracking-[0.4em] mb-2 relative z-10">TOTAL SELURUH ASET (LIKUIDITAS)</p>
                     <h4 className="text-4xl font-black tracking-tighter relative z-10">{formatCurrency(totalLiquidity)}</h4>
                     <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20 relative z-10">
                        <ShieldCheck size={10} className="text-emerald-400"/>
                        <span className="text-[7px] font-black uppercase tracking-widest">Dana Terverifikasi</span>
                     </div>
                  </div>

                  {/* GROUP: BANKING ASSETS */}
                  {bankWallets.length > 0 && (
                     <div className="space-y-3">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                           <Landmark size={10} className="text-blue-500"/> Saldo Rekening Bank
                        </p>
                        <div className="space-y-2">
                           {bankWallets.map(w => (
                              <div key={w} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                 <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg shadow-sm"><CreditCard size={14} className="text-blue-600"/></div>
                                    <div className="flex flex-col">
                                       <span className="text-[10px] font-black uppercase text-gray-800">{w}</span>
                                       <span className="text-[7px] font-bold text-gray-400 uppercase">Aset Digital / Transfer</span>
                                    </div>
                                 </div>
                                 <span className="text-sm font-black tracking-tight text-gray-900">{formatCurrency(walletBalances[w])}</span>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* GROUP: PHYSICAL CASH ASSETS */}
                  {cashWallets.length > 0 && (
                     <div className="space-y-3">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                           <Banknote size={10} className="text-orange-500"/> Saldo Kas Tunai
                        </p>
                        <div className="space-y-2">
                           {cashWallets.map(w => (
                              <div key={w} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                 <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg shadow-sm"><Coins size={14} className="text-orange-500"/></div>
                                    <div className="flex flex-col">
                                       <span className="text-[10px] font-black uppercase text-gray-800">{w}</span>
                                       <span className="text-[7px] font-bold text-gray-400 uppercase">Aset Fisik / Tunai</span>
                                    </div>
                                 </div>
                                 <span className="text-sm font-black tracking-tight text-gray-900">{formatCurrency(walletBalances[w])}</span>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
                  
                  {/* TIMESTAMP FOR WALLET REPORT */}
                  <div className="pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
                     <p className="text-[8px] font-bold text-gray-400 uppercase">Dicetak Pada:</p>
                     <p className="text-[8px] font-black uppercase text-gray-600">{new Date().toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit'})} WIB</p>
                  </div>
               </div>
               
               <div className="mt-8 pt-6 border-t-2 border-black text-center">
                  <p className="text-[7px] font-bold text-gray-300 uppercase tracking-[0.5em]">LEMBAH MANAH DIGITAL ASSET AUDIT v2.5</p>
               </div>
            </div>
         )}
         
         <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-3xl border-2 border-dashed border-blue-200 dark:border-blue-800 flex gap-4 mt-6 no-print">
            <Smartphone className="text-blue-600 shrink-0" size={24}/>
            <p className="text-[10px] text-blue-700 dark:text-blue-400 font-medium leading-relaxed italic">"Bapak bisa mengirimkan <b>Laporan Likuiditas</b> ini sebagai bukti posisi kas terkini. Pengelompokan Bank & Tunai memudahkan kontrol dana fisik."</p>
         </div>
      </div>
    </div>
  );
};

export default ReportShareHub;
