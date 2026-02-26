
import React, { useMemo } from 'react';
import { 
  Printer, ImageIcon, X, Loader2, Calculator, ShieldCheck, 
  Building2, FileCheck, CheckCircle2, TrendingUp, Scale, Target 
} from 'lucide-react';
import { Recipe, BusinessInfo } from '../types';

interface Props {
  selectedRecipes: Recipe[];
  businessInfo: BusinessInfo;
  periodLabel: string;
  isCapturing: boolean;
  onClose: () => void;
  onExportImage: () => void;
}

const HppLaporan: React.FC<Props> = ({ selectedRecipes, businessInfo, periodLabel, isCapturing, onClose, onExportImage }) => {
  
  const reportStats = useMemo(() => {
    if (!selectedRecipes || selectedRecipes.length === 0) return { avgFC: 0 };
    const sumFC = selectedRecipes.reduce((sum, r) => sum + (r.costFoodPercent || 0), 0);
    // Tambahkan guard untuk pembagian
    const avgFC = selectedRecipes.length > 0 ? sumFC / selectedRecipes.length : 0;
    return { avgFC };
  }, [selectedRecipes]);

  const formatCurrency = (val: number) => {
    const safeVal = val || 0;
    return 'Rp ' + Math.round(safeVal).toLocaleString('id-ID');
  };

  return (
    <div className="fixed inset-0 z-[200] bg-gray-200 dark:bg-black overflow-y-auto flex flex-col no-scrollbar animate-fade-in no-print py-10">
      <div className="fixed top-0 left-0 w-full z-[210] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b p-4 flex items-center justify-between shadow-xl">
         <button onClick={onClose} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-md cursor-pointer"><X size={20} /> KELUAR</button>
         <div className="flex gap-3">
            <button onClick={onExportImage} disabled={isCapturing} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl active:scale-95 disabled:opacity-50 cursor-pointer">{isCapturing ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16}/>} SIMPAN JPG</button>
            <button onClick={() => window.print()} className="px-8 py-3 bg-black text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-lg hover:bg-gray-800 transition-all active:scale-95 cursor-pointer"><Printer size={18} /> CETAK LAPORAN</button>
         </div>
      </div>

      <div className="flex-1 mt-14 flex flex-col items-center">
         <div id="hpp-formal-report-paper" className="bg-white text-black p-[20mm] shadow-2xl border border-gray-100 mx-auto print:shadow-none relative" style={{ width: '210mm', minHeight: '297mm' }}>
            <div className="flex flex-col items-center text-center mb-12 pb-10 border-b-[8px] border-black gap-4">
               {businessInfo.logoUrl ? (
                 <img src={businessInfo.logoUrl} className="h-20 w-auto object-contain mb-4" alt="Logo" />
               ) : <div className="w-20 h-20 bg-black text-white rounded-[2rem] flex items-center justify-center font-black text-3xl mb-4 shadow-lg">LM</div>}
               <div><h1 className="text-4xl font-black uppercase tracking-tighter leading-none text-black">AUDIT HPP & PROFITABILITAS</h1><p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.6em]">{businessInfo.name.toUpperCase()} • STRATEGIC PRICING</p><div className="mt-8 px-8 py-2.5 bg-gray-100 rounded-full border-2 border-black inline-block font-black text-xs uppercase tracking-widest">Tgl Audit: {new Date().toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric'})}</div></div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-12">
               <div className="p-8 bg-gray-50 border-2 border-black rounded-[2.5rem] text-center">
                  <p className="text-[9pt] font-black text-gray-400 uppercase tracking-widest mb-1">Rerata Food Cost Audit</p>
                  <h4 className={`text-5xl font-black ${reportStats.avgFC > 35 ? 'text-rose-600' : 'text-emerald-700'}`}>{Math.round(reportStats.avgFC)}%</h4>
               </div>
               <div className="p-8 bg-emerald-50 border-4 border-emerald-500 shadow-inner text-center">
                  <p className="text-[9pt] font-black text-emerald-600 uppercase tracking-widest mb-1">Menu Di-Audit</p>
                  <h4 className="text-5xl font-black text-emerald-900">{selectedRecipes.length} <span className="text-base opacity-40">PORSI</span></h4>
               </div>
            </div>

            <div className="space-y-6">
               <div className="flex items-center gap-3 border-b-2 border-black pb-2"><Calculator size={18} /><h3 className="text-[11pt] font-black uppercase tracking-[0.2em]">RINCIAN HARGA & MARGIN BERSIH</h3></div>
               <div className="overflow-hidden rounded-xl border-4 border-black">
                  <table className="w-full text-left border-collapse">
                     <thead><tr className="bg-gray-100 text-black border-b-4 border-black font-black uppercase text-[9px] text-center"><th className="p-4 border-r-2 border-black w-10">No</th><th className="p-4 border-r-2 border-black text-left">Nama Menu</th><th className="p-4 border-r-2 border-black w-32">HPP Riil</th><th className="p-4 border-r-2 border-black w-32">Harga Jual</th><th className="p-4 text-center w-24">Food Cost</th></tr></thead>
                     <tbody className="text-[10px] font-bold uppercase">
                        {selectedRecipes.map((r, idx) => (
                           <tr key={r.id} className="border-b-2 border-black last:border-b-0">
                              <td className="p-3 text-center border-r-2 border-black text-gray-400 font-mono">{idx + 1}</td>
                              <td className="p-3 border-r-2 border-black"><div><p className="font-black text-[11px] leading-tight mb-0.5">{r.menuName}</p><p className="text-[7px] text-gray-400 tracking-widest">{r.subCategory}</p></div></td>
                              <td className="p-3 text-right border-r-2 border-black font-black text-rose-600 bg-rose-50/20">{formatCurrency(r.totalCost || 0)}</td>
                              <td className="p-3 text-right border-r-2 border-black font-black text-blue-700 bg-blue-50/20">{formatCurrency(r.actualSales || 0)}</td>
                              <td className="p-3 text-center">
                                 <span className={`px-2 py-1 rounded font-black border-2 border-black ${r.costFoodPercent <= 30 ? 'bg-green-100' : r.costFoodPercent <= 35 ? 'bg-amber-100' : 'bg-red-100'}`}>{Math.round(r.costFoodPercent || 0)}%</span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            <div className="mt-12 p-8 bg-indigo-50 border-2 border-indigo-200 rounded-[2.5rem]"><div className="flex items-center gap-3 mb-4 text-indigo-600"><ShieldCheck size={20}/><h4 className="text-xs font-black uppercase tracking-widest">Opini Audit Strategis</h4></div><p className="text-[10pt] font-medium leading-[1.8] italic text-gray-700">Data ini disusun berdasarkan kalkulasi komposisi bahan baku dari modul <b>Katalog Bahan</b>. Menu dengan nilai Cost di atas <b>35%</b> disarankan untuk dievaluasi ulang porsi atau harga jualnya guna menjaga likuiditas harian.</p></div>

            <div className="mt-24 grid grid-cols-2 gap-20 text-center uppercase font-black">
               <div><p className="text-[10px] text-gray-400 mb-20 tracking-widest">DIPERIKSA (COST CONTROL)</p><div className="border-b-2 border-black w-full mb-1"></div><p className="text-[11px] font-black">LM FINANCE</p></div>
               <div><p className="text-[10px] text-gray-400 mb-20 tracking-widest">MANAJEMEN (GM)</p><div className="border-b-2 border-black w-full mb-1"></div><p className="text-[11px] font-black">{businessInfo.managerName || 'OFFICIAL'}</p></div>
            </div>
            <div className="mt-32 pt-10 border-t border-dashed border-gray-200 text-center opacity-30"><p className="text-[8pt] font-bold text-gray-300 uppercase tracking-[0.5em]">SYSTEM GENERATED OFFICIAL DOCUMENT v2.5 • LM STRATEGIC INTEL</p></div>
         </div>
      </div>
    </div>
  );
};

export default HppLaporan;
