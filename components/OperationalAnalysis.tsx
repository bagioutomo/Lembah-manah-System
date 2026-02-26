
import React, { useMemo } from 'react';
import { 
  UserCheck, 
  Wrench, 
  Activity, 
  ShieldCheck,
  AlertTriangle,
  History,
  ShieldAlert
} from 'lucide-react';
import { OperationalChecklistItem, DashboardTask, InventoryItem, MaintenanceTask } from '../types';

interface Props {
  checklist: OperationalChecklistItem[];
  tasks: DashboardTask[];
  inventoryItems: InventoryItem[];
  maintenance: MaintenanceTask[];
}

const OperationalAnalysis: React.FC<Props> = ({ checklist, tasks, inventoryItems, maintenance }) => {
  
  const picPerformance = useMemo(() => {
    const stats: Record<string, { total: number, done: number }> = {};
    
    tasks.forEach(t => {
      if (!stats[t.pic]) stats[t.pic] = { total: 0, done: 0 };
      stats[t.pic].total += 1;
      if (t.completed) stats[t.pic].done += 1;
    });

    return Object.entries(stats)
      .map(([pic, data]) => ({
        pic,
        percent: data.total > 0 ? Math.round((data.done / data.total) * 100) : 0,
        count: `${data.done}/${data.total}`
      }))
      .sort((a, b) => b.percent - a.percent);
  }, [tasks]);

  const assetAudit = useMemo(() => {
    const assets = inventoryItems.filter(i => i.type === 'ASSET');
    const damaged = assets.filter(a => a.condition === 'DAMAGED' || a.condition === 'MISSING');
    const stable = assets.filter(a => a.condition === 'GOOD');
    
    const typeCount: Record<string, number> = {};
    maintenance.forEach(m => {
      typeCount[m.type] = (typeCount[m.type] || 0) + 1;
    });
    
    const topServiceType = Object.entries(typeCount).sort((a,b) => b[1] - a[1])[0] || ["Nihil", 0];

    return {
      damagedItems: damaged.slice(0, 3),
      stableCount: stable.length,
      damagedCount: damaged.length,
      topServiceType: topServiceType[0]
    };
  }, [inventoryItems, maintenance]);

  const totalScore = checklist.length + tasks.length > 0 
    ? Math.round(((checklist.filter(c=>c.done).length + tasks.filter(t=>t.completed).length) / (checklist.length + tasks.length)) * 100) 
    : 100;

  return (
    <div className="space-y-8 h-full">
      <div className="bg-white dark:bg-gray-950 p-10 rounded-[4rem] border-2 border-indigo-100 dark:border-indigo-900/30 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 transition-transform duration-1000 group-hover:rotate-0">
          <UserCheck size={180} className="text-indigo-600" />
        </div>
        
        <div className="flex items-center justify-between mb-10 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl shadow-inner">
              <Activity size={24}/>
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white leading-none">Kedisiplinan PIC</h3>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">Ranking Penyelesaian Tugas Tim</p>
            </div>
          </div>
          <div className="text-right">
             <span className="text-3xl font-black text-indigo-700 dark:text-indigo-400 tracking-tighter">{totalScore}%</span>
             <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Kepatuhan Global</p>
          </div>
        </div>

        <div className="space-y-6 relative z-10">
          {picPerformance.length === 0 ? (
            <div className="py-10 text-center opacity-30 italic text-[10px] font-black uppercase">Belum ada delegasi tugas</div>
          ) : (
            picPerformance.map((item, i) => (
              <div key={i} className="space-y-2 group/pic">
                <div className="flex justify-between items-end px-1">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover/pic:bg-indigo-600 group-hover/pic:text-white transition-all">#{i+1}</div>
                      <span className="text-xs font-black uppercase text-gray-700 dark:text-gray-200">{item.pic}</span>
                   </div>
                   <span className="text-[10px] font-black text-indigo-600">{item.count} Selesai ({item.percent}%)</span>
                </div>
                <div className="h-2 w-full bg-gray-50 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                   <div 
                      className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${item.percent}%` }}
                   />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-950 p-10 rounded-[4rem] border-2 border-amber-100 dark:border-amber-900/30 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] -rotate-12 transition-transform duration-1000 group-hover:rotate-0">
          <Wrench size={180} className="text-amber-600" />
        </div>

        <div className="flex items-center gap-4 mb-10 relative z-10">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-2xl shadow-inner">
            <ShieldAlert size={24}/>
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white leading-none">Reliabilitas Aset</h3>
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-1">Audit Alat Rusak vs Berfungsi</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
           <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/40 text-center">
              <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Kondisi Normal</p>
              <h4 className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{assetAudit.stableCount} <span className="text-[10px] opacity-40">Unit</span></h4>
              <p className="text-[7px] font-bold text-gray-400 uppercase mt-1 italic">Status: BAIK</p>
           </div>
           <div className="p-5 bg-rose-50/50 dark:bg-rose-950/10 rounded-3xl border border-rose-100 dark:border-rose-900/40 text-center">
              <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest mb-1">Aset Bermasalah</p>
              <h4 className="text-2xl font-black text-rose-700 dark:text-rose-400">{assetAudit.damagedCount} <span className="text-[10px] opacity-40">Unit</span></h4>
              <p className="text-[7px] font-bold text-gray-400 uppercase mt-1 italic">Butuh Perbaikan</p>
           </div>
        </div>

        <div className="space-y-3 relative z-10">
           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2 border-b dark:border-gray-800 pb-2">
              <AlertTriangle size={12} className="text-amber-500"/> Hotlist Aset Kritis:
           </p>
           {assetAudit.damagedItems.length === 0 ? (
             <div className="py-6 text-center bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl flex items-center justify-center gap-3">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Seluruh Alat Berfungsi Baik</span>
             </div>
           ) : (
             assetAudit.damagedItems.map((asset, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-transparent hover:border-rose-200 transition-all">
                   <div className="flex flex-col">
                      <span className="text-[11px] font-black uppercase text-gray-800 dark:text-white truncate max-w-[150px]">{asset.name}</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{asset.category}</span>
                   </div>
                   <div className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[7px] font-black uppercase">{asset.condition}</div>
                </div>
             ))
           )}
        </div>

        <div className="mt-8 pt-6 border-t border-dashed dark:border-gray-800 flex justify-between items-center relative z-10">
           <div>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Paling Sering Diservis:</p>
              <p className="text-xs font-black text-indigo-600 uppercase">{assetAudit.topServiceType}</p>
           </div>
           <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <History size={16} className="text-gray-300" />
           </div>
        </div>
      </div>
    </div>
  );
};

export default OperationalAnalysis;
