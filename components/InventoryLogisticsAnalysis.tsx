
import React, { useMemo } from 'react';
import { 
  Package, 
  ShieldAlert, 
  Activity,
  TrendingDown,
  ChevronRight,
  ShieldCheck,
  Info,
  AlertTriangle,
  Zap,
  Anchor
} from 'lucide-react';
import { InventoryItem, MaintenanceTask, InventoryLog } from '../types';

interface Props {
  inventoryItems: InventoryItem[];
  maintenance: MaintenanceTask[];
  inventoryLogs: InventoryLog[];
  globalMonth: number;
  globalYear: number;
}

const InventoryLogisticsAnalysis: React.FC<Props> = ({ inventoryItems, maintenance, inventoryLogs, globalMonth, globalYear }) => {
  
  const assetRisks = useMemo(() => {
    const damaged = inventoryItems.filter(i => i.type === 'ASSET' && i.condition === 'DAMAGED');
    const missing = inventoryItems.filter(i => i.type === 'ASSET' && i.condition === 'MISSING');
    const expired = inventoryItems.filter(i => i.type === 'RAW_MATERIAL' && i.condition === 'EXPIRED');
    
    return {
      damaged,
      missing,
      expired,
      totalRisk: damaged.length + missing.length + expired.length
    };
  }, [inventoryItems]);

  const stockVelocity = useMemo(() => {
    const startOfPeriod = new Date(globalYear, globalMonth, 1);
    const endOfPeriod = new Date(globalYear, globalMonth + 1, 0, 23, 59, 59);

    const rawMaterials = inventoryItems.filter(i => i.type === 'RAW_MATERIAL');
    
    const analysis = rawMaterials.map(item => {
      const itemLogs = inventoryLogs.filter(l => 
        l.itemId === item.id && 
        new Date(l.timestamp) >= startOfPeriod && 
        new Date(l.timestamp) <= endOfPeriod
      );

      const totalOut = itemLogs
        .filter(l => l.action === 'OUT' || l.action === 'DAMAGE' || l.action === 'LOSS')
        .reduce((sum, l) => sum + l.qtyChange, 0);
      
      const moveCount = itemLogs.length;

      return {
        ...item,
        totalOut,
        moveCount
      };
    });

    const fastMoving = [...analysis].filter(a => a.totalOut > 0).sort((a, b) => b.totalOut - a.totalOut).slice(0, 4);
    const deadStock = analysis.filter(a => a.moveCount === 0);

    return { fastMoving, deadStock };
  }, [inventoryItems, inventoryLogs, globalMonth, globalYear]);

  return (
    <div className="space-y-10 h-full">
      <div className="bg-white dark:bg-gray-950 p-10 rounded-[4rem] border-2 border-rose-100 dark:border-rose-900/30 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 transition-transform duration-1000">
          <ShieldAlert size={180} className="text-rose-600" />
        </div>

        <div className="flex items-center justify-between mb-10 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-2xl shadow-inner">
              <AlertTriangle size={24}/>
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white leading-none">Audit Risiko Aset</h3>
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mt-1">Status Aset Kritis (Rusak/Hilang)</p>
            </div>
          </div>
          <div className="text-right">
             <span className="text-3xl font-black text-rose-600 tracking-tighter">{assetRisks.totalRisk}</span>
             <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Unit Bermasalah</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 relative z-10">
           {assetRisks.totalRisk === 0 ? (
             <div className="py-12 text-center border-2 border-dashed border-emerald-100 dark:border-emerald-900/20 rounded-[2.5rem]">
                <ShieldCheck size={40} className="text-emerald-500 mx-auto mb-4 opacity-20" />
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Seluruh Aset Berfungsi Baik</p>
             </div>
           ) : (
             <>
               {[...assetRisks.damaged, ...assetRisks.missing, ...assetRisks.expired].slice(0, 5).map((asset, i) => (
                 <div key={i} className="flex justify-between items-center p-4 bg-rose-50/50 dark:bg-rose-900/10 rounded-2xl border border-transparent hover:border-rose-200 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 text-rose-600 flex items-center justify-center shadow-sm">
                          <Package size={18}/>
                       </div>
                       <div>
                          <p className="text-[11px] font-black uppercase text-gray-800 dark:text-white truncate max-w-[150px]">{asset.name}</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{asset.category}</p>
                       </div>
                    </div>
                    <div className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-[8px] font-black uppercase tracking-widest border border-red-200 dark:border-red-800">
                       {asset.condition === 'DAMAGED' ? 'RUSAK' : asset.condition}
                    </div>
                 </div>
               ))}
             </>
           )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-950 p-10 rounded-[4rem] border-2 border-indigo-100 dark:border-indigo-900/30 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] -rotate-12 transition-transform duration-1000">
          <Activity size={180} className="text-indigo-600" />
        </div>

        <div className="flex items-center justify-between mb-10 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl shadow-inner">
              <TrendingDown size={24}/>
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white leading-none">Perputaran Stok</h3>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">Analisis Kecepatan Keluar Bahan Baku</p>
            </div>
          </div>
        </div>

        <div className="space-y-8 relative z-10">
           <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                 <Zap size={14} className="text-emerald-500 fill-emerald-500" />
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Barang Paling Laku (Fast Moving)</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 {stockVelocity.fastMoving.length === 0 ? (
                   <p className="col-span-full py-6 text-center text-[9px] font-black text-gray-300 uppercase italic">Nihil data pergerakan</p>
                 ) : (
                    stockVelocity.fastMoving.map((item, i) => (
                       <div key={i} className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-[1.5rem] border border-emerald-100 dark:border-emerald-800">
                          <p className="text-[10px] font-black uppercase text-gray-700 dark:text-white truncate mb-1">{item.name}</p>
                          <div className="flex justify-between items-end">
                             <p className="text-[8px] font-bold text-gray-400 uppercase">Keluar: {item.totalOut} {item.unit}</p>
                             <span className="text-[9px] font-black text-emerald-600 flex items-center gap-0.5 animate-pulse"><TrendingDown size={10}/> AKTIF</span>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>

           <div className="space-y-4 pt-6 border-t border-dashed dark:border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                 <Anchor size={14} className="text-gray-400" />
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Stok Mati (Tanpa Pergerakan)</h4>
              </div>
              <div className="space-y-2">
                 {stockVelocity.deadStock.length === 0 ? (
                   <p className="py-6 text-center text-[9px] font-black text-gray-300 uppercase italic">Seluruh stok bergerak aktif</p>
                 ) : (
                    stockVelocity.deadStock.slice(0, 3).map((item, i) => (
                       <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-transparent hover:border-indigo-100">
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-300">{item.name}</span>
                             <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Sisa: {item.quantity} {item.unit}</span>
                          </div>
                          <span className="text-[8px] font-black bg-gray-200 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded uppercase">Zero Move</span>
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>

        <div className="mt-8 pt-6 border-t border-dashed dark:border-gray-800 flex justify-between items-center relative z-10">
           <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/30 px-5 py-3 rounded-2xl w-full">
              <Info size={14} className="text-blue-500 shrink-0" />
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                 Sistem mendeteksi <b>Stok Mati</b> untuk mencegah modal mati pada bahan yang tidak laku.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryLogisticsAnalysis;
