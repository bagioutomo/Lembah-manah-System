
import React from 'react';
import { Book, X, Printer, ImageIcon, Loader2, ChefHat, Coffee, Utensils, Users, Clock, Flame, Gauge, Lightbulb, PenTool, CornerDownRight, Layers } from 'lucide-react';
import { Recipe, BusinessInfo, ProcessedMaterial } from '../types';

interface Props {
  selectedRecipes: Recipe[];
  businessInfo: BusinessInfo;
  processedMaterials: ProcessedMaterial[];
  onClose: () => void;
  isCapturing: boolean;
  onExportImage: () => void;
}

const CookBookPrintMode: React.FC<Props> = ({ selectedRecipes, businessInfo, processedMaterials, onClose, isCapturing, onExportImage }) => {
  const getDriveImageUrl = (id: string) => {
    if (!id || id === "") return null;
    return `https://lh3.googleusercontent.com/d/${id}`;
  };

  return (
    <div className="fixed inset-0 z-[300] bg-gray-200 dark:bg-black overflow-y-auto flex flex-col no-print animate-fade-in">
      <div className="sticky top-0 z-[310] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b p-4 flex items-center justify-between shadow-xl">
        <button onClick={onClose} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-xs uppercase hover:bg-red-700 transition-all cursor-pointer">
          <X size={20} /> KELUAR
        </button>
        <div className="flex gap-3">
          <button onClick={onExportImage} disabled={isCapturing} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-xl active:scale-95 disabled:opacity-50 cursor-pointer">
            {isCapturing ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />} SIMPAN SEMUA (JPG)
          </button>
          <button onClick={() => window.print()} className="px-8 py-3 bg-black text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-lg hover:bg-gray-800 transition-all cursor-pointer">
            <Printer size={18} /> CETAK PDF / JILID
          </button>
        </div>
      </div>

      <div className="flex-1 py-10 flex flex-col items-center gap-20 print:gap-0 print:py-0">
        <div id="cookbook-full-print" className="flex flex-col items-center">
          {/* COVER PAGE */}
          <div className="cookbook-page bg-white text-black shadow-2xl relative flex flex-col items-center justify-center p-20 print:shadow-none" style={{ width: '210mm', height: '297mm', pageBreakAfter: 'always' }}>
            <div className="absolute inset-10 border border-gray-100"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              {businessInfo.logoUrl ? <img src={businessInfo.logoUrl} className="h-48 mb-16 object-contain grayscale" alt="Logo" /> : <div className="w-32 h-32 bg-black text-white rounded-3xl flex items-center justify-center font-black text-5xl mb-16">LM</div>}
              <div className="space-y-4 mb-24"><h1 className="text-7xl font-black uppercase tracking-tighter leading-[0.8] mb-4" style={{ fontFamily: 'serif' }}>The Secret<br/>Catalogue</h1><div className="w-24 h-2 bg-black mx-auto"></div><p className="text-sm font-bold uppercase tracking-[0.8em] text-gray-400 mt-6">Culinary Standarization Guide</p></div>
              <div className="space-y-2"><p className="text-3xl font-black uppercase tracking-tight" style={{ fontFamily: 'serif' }}>{businessInfo.name}</p><p className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-300">SYSTEM ARCHIVE v2.5</p></div>
            </div>
          </div>

          {/* TABLE OF CONTENTS */}
          <div className="cookbook-page bg-white text-black shadow-2xl relative p-24 print:shadow-none mt-10 print:mt-0" style={{ width: '210mm', height: '297mm', pageBreakAfter: 'always' }}>
             <div className="border-b-8 border-black pb-8 mb-20"><h2 className="text-4xl font-black uppercase tracking-tighter" style={{ fontFamily: 'serif' }}>Table of Contents</h2></div>
             <div className="space-y-6">{selectedRecipes.map((r, i) => (<div key={r.id} className="flex justify-between items-end gap-6 border-b border-gray-50 pb-2"><div className="flex items-center gap-4"><span className="text-xs font-black text-gray-300">0{i + 1}</span><span className="text-xl font-black uppercase tracking-tight truncate">{r.menuName}</span></div><div className="flex-1 border-b border-dotted border-gray-200 mb-1"></div><span className="text-xl font-black shrink-0 ml-4">{i + 3}</span></div>))}</div>
          </div>

          {/* RECIPE PAGES */}
          {selectedRecipes.map((r, idx) => (
            <div key={r.id} className="cookbook-page bg-white text-black shadow-2xl relative p-16 sm:p-20 print:shadow-none mt-10 print:mt-0" style={{ width: '210mm', height: '297mm', pageBreakAfter: 'always' }}>
               <div className="w-full h-px bg-gray-200 mb-2"></div>
               <div className="text-center mb-2"><span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.4em]">{r.category}</span></div>
               <div className="text-center mb-6"><h1 className="text-4xl font-black uppercase tracking-tighter" style={{ fontFamily: 'serif' }}>{r.menuName}</h1></div>
               
               {/* FOTO DIBAWAH NAMA MENU - UKURAN DIKECILKAN (h-160px) */}
               {r.imageUrl && (
                 <div className="mb-8 h-[160px] w-full rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm">
                   <img 
                    src={getDriveImageUrl(r.imageUrl)!} 
                    className="w-full h-full object-cover" 
                    alt={r.menuName} 
                    crossOrigin="anonymous" 
                   />
                 </div>
               )}

               <div className="grid grid-cols-4 gap-4 mb-8 border-y border-gray-100 py-5 text-center">
                 <div className="space-y-1"><Users size={18} strokeWidth={1} className="mx-auto text-gray-400"/><p className="text-[7px] font-black text-gray-400 uppercase">Serves</p><p className="text-xs font-black">{r.servings || 4}</p></div>
                 <div className="space-y-1 border-x border-gray-50"><Flame size={18} strokeWidth={1} className="mx-auto text-gray-400"/><p className="text-[7px] font-black text-gray-400 uppercase">Method</p><p className="text-xs font-black uppercase">{r.method || 'BOIL'}</p></div>
                 <div className="space-y-1"><Clock size={18} strokeWidth={1} className="mx-auto text-gray-400"/><p className="text-[7px] font-black text-gray-400 uppercase">Minutes</p><p className="text-xs font-black">{r.cookTime || '15'}</p></div>
                 <div className="space-y-1 border-l border-gray-50"><Gauge size={18} strokeWidth={1} className="mx-auto text-gray-400"/><p className="text-[7px] font-black text-gray-400 uppercase">Difficulty</p><p className="text-xs font-black">{r.difficulty || '3/10'}</p></div>
               </div>

               <div className="grid grid-cols-12 gap-10">
                  <div className="col-span-4 space-y-8">
                     <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <h4 className="text-[9px] font-black uppercase tracking-widest mb-3 pb-1.5 border-b border-gray-200 text-gray-400">Ingredients</h4>
                        <div className="space-y-2">
                           {r.items.map((it, i) => {
                              const procMat = processedMaterials?.find(m => m.id === it.articleId || m.name.toUpperCase() === it.name.toUpperCase());
                              return (
                                 <div key={i} className="flex flex-col">
                                    <div className="flex justify-between items-start border-b border-gray-200/50 pb-1 gap-2">
                                       <span className="text-[8.5pt] font-black text-gray-700 uppercase break-words flex-1 leading-tight">{it.name}</span>
                                       <span className="text-[8pt] font-bold text-gray-400 shrink-0 italic leading-tight">{it.quantity}{it.unit.toLowerCase()}</span>
                                    </div>
                                    {procMat && procMat.items && (
                                      <div className="ml-1 pl-2 border-l border-amber-200 mb-1 mt-1 space-y-1">
                                         {procMat.items.map((sub, sIdx) => {
                                            const scaleFactor = it.quantity / (procMat.yieldQuantity || 1);
                                            const scaledQty = sub.quantity * scaleFactor;
                                            return (
                                               <div key={sIdx} className="flex justify-between items-center gap-2 opacity-60">
                                                  <span className="text-[6.5pt] font-bold text-gray-500 leading-none uppercase break-words flex-1">{sub.name}</span>
                                                  <span className="text-[6pt] font-medium text-gray-400 shrink-0 italic">
                                                     {scaledQty.toFixed(scaledQty < 1 ? 2 : 1)}{sub.unit.toLowerCase()}
                                                  </span>
                                               </div>
                                            );
                                         })}
                                      </div>
                                    )}
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                     <div className="space-y-2.5"><h4 className="text-[9px] font-black uppercase tracking-widest border-b-2 border-black w-fit flex items-center gap-1.5 text-gray-400"><Lightbulb size={12} className="text-amber-500"/> Chef's Notes</h4><p className="text-[8.5pt] leading-[1.5] text-gray-500 font-medium italic whitespace-pre-line">{r.notes || 'No special notes.'}</p></div>
                  </div>

                  <div className="col-span-8 space-y-8">
                     <div className="space-y-3.5"><h4 className="text-[9px] font-black uppercase tracking-widest pb-1 border-b-2 border-black w-fit flex items-center gap-2 text-gray-400"><PenTool size={12}/> Preparation</h4><div className="text-[9.5pt] leading-[1.6] text-gray-600 font-medium whitespace-pre-line">{r.preparation || 'No specific preparation steps.'}</div></div>
                     <div className="space-y-3.5"><h4 className="text-[9px] font-black uppercase tracking-widest mb-4 pb-1 border-b-2 border-black w-fit flex items-center gap-2 text-gray-400"><ChefHat size={12}/> Directions</h4><div className="text-[9.5pt] leading-[1.9] text-gray-800 font-medium whitespace-pre-line text-justify">{r.instructions || 'Directions not available.'}</div></div>
                  </div>
               </div>
               <div className="absolute bottom-12 left-0 w-full text-center"><div className="w-32 h-px bg-gray-100 mx-auto mb-4"></div><p className="text-[7pt] font-black text-gray-300 uppercase tracking-[0.6em]">PAGE {idx + 3} • {businessInfo.name}</p></div>
            </div>
          ))}
        </div>
      </div>
      
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #cookbook-full-print, #cookbook-full-print * { visibility: visible; }
          #cookbook-full-print { position: absolute; left: 0; top: 0; width: 100% !important; }
          .cookbook-page { margin: 0 !important; border: none !important; box-shadow: none !important; width: 210mm !important; height: 297mm !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>
    </div>
  );
};

export default CookBookPrintMode;
