
import React, { useMemo } from 'react';
import { 
  TrendingUp, Calendar, ArrowUpRight, BarChart3, Target, 
  AlertTriangle, CheckCircle2, TrendingDown, Activity, Star,
  AlertOctagon, Info
} from 'lucide-react';

interface Props {
  totalGross: number;
  timelineData: any[];
  viewMode: 'BULANAN' | 'TAHUNAN';
  formatCurrency: (v: number) => string;
  globalMonth: number;
  globalYear: number;
}

const IncomeInfographic: React.FC<Props> = ({ totalGross, timelineData, viewMode, formatCurrency, globalMonth, globalYear }) => {
  const maxVal = Math.max(...timelineData.map(d => d.inc), 1);

  const auditPerformance = useMemo(() => {
    const analyzed = timelineData.map(d => {
      let status: 'RED' | 'YELLOW' | 'GREEN' | 'NORMAL' = 'NORMAL';
      const val = d.inc;
      let labelDetail = "";
      let isWeekend = false;

      if (viewMode === 'BULANAN') {
        const dayNum = parseInt(d.label);
        const dateObj = new Date(globalYear, globalMonth, dayNum);
        const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
        isWeekend = dayName === 'Sabtu' || dayName === 'Minggu';
        labelDetail = `${dayName}, Tgl ${d.label}`;

        if (!isWeekend) {
          if (val < 3000000) status = 'RED';
          else if (val >= 3000000 && val <= 8000000) status = 'YELLOW';
          else status = 'GREEN';
        } else {
          if (val < 15000000) status = 'RED';
          else if (val >= 15000000 && val <= 20000000) status = 'YELLOW';
          else status = 'GREEN';
        }
      } else {
        labelDetail = `Bulan ${d.label}`;
        if (val < 200000000) status = 'RED';
        else if (val >= 200000000 && val <= 350000000) status = 'YELLOW';
        else if (val > 350000000) status = 'GREEN';
      }

      return { ...d, labelDetail, isWeekend, status };
    });

    const alertItems = analyzed.filter(x => x.status === 'RED' || x.status === 'YELLOW')
                        .sort((a, b) => a.inc - b.inc);

    const counts = {
      RED: analyzed.filter(x => x.status === 'RED').length,
      YELLOW: analyzed.filter(x => x.status === 'YELLOW').length,
      GREEN: analyzed.filter(x => x.status === 'GREEN').length
    };

    return { analyzed, alertItems, counts };
  }, [timelineData, viewMode, globalMonth, globalYear]);

  return (
    <div className="bg-white dark:bg-gray-950 p-10 lg:p-14 rounded-[4rem] border-2 border-emerald-100 dark:border-emerald-900/30 shadow-2xl relative overflow-hidden group col-span-1 lg:col-span-2">
      <div className="absolute top-0 right-0 p-12 opacity-[0.02] rotate-12 transition-transform duration-1000 group-hover:rotate-0 group-hover:scale-110">
        <TrendingUp size={300} className="text-emerald-600" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[1.8rem] bg-emerald-600 text-white flex items-center justify-center shadow-xl shadow-emerald-600/20">
              <BarChart3 size={32} />
            </div>
            <div>
              <h3 className="text-3xl font-black uppercase tracking-tighter leading-none dark:text-white">Tren Pendapatan</h3>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                <Calendar size={12} className="text-emerald-600"/> Statistik {viewMode === 'BULANAN' ? 'Harian' : 'Tahunan'} Terkalibrasi
              </p>
            </div>
          </div>
          <div className="text-right bg-emerald-50 dark:bg-emerald-900/20 px-8 py-4 rounded-3xl border border-emerald-100 dark:border-emerald-800">
             <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Omzet Bruto</p>
             <h4 className="text-3xl font-black text-emerald-700 dark:text-emerald-400 tracking-tighter leading-none">{formatCurrency(totalGross)}</h4>
          </div>
        </div>

        <div className="flex items-end justify-between h-[250px] gap-2 sm:gap-4 px-4 relative mb-20">
          <div className="absolute inset-x-0 top-0 h-full flex flex-col justify-between pointer-events-none opacity-5">
             {[1,2,3,4].map(i => <div key={i} className="w-full border-t border-gray-900 dark:border-white border-dashed"></div>)}
          </div>

          {timelineData.map((d, i) => {
            const h = (d.inc / maxVal) * 100;
            const status = auditPerformance?.analyzed[i]?.status;
            const barColor = status === 'RED' ? 'from-rose-600 to-rose-400' : 
                            status === 'YELLOW' ? 'from-amber-500 to-amber-300' : 
                            status === 'GREEN' ? 'from-emerald-700 to-emerald-400' : 'from-gray-400 to-gray-200';

            return (
              <div key={i} className="flex-1 flex flex-col items-center group/bar relative h-full justify-end">
                <div className="absolute bottom-full mb-4 opacity-0 group-hover/bar:opacity-100 scale-75 group-hover/bar:scale-100 -translate-y-4 group-hover/bar:translate-y-0 transition-all duration-500 z-20 pointer-events-none origin-bottom">
                  <div className="bg-gray-900 text-white text-[10px] font-black px-4 py-2 rounded-2xl shadow-2xl whitespace-nowrap">
                     {d.label}: {formatCurrency(d.inc)}
                  </div>
                </div>
                <div className="w-full bg-gray-50 dark:bg-gray-800/40 rounded-full relative overflow-hidden shadow-inner border border-transparent group-hover/bar:border-emerald-500/30 transition-all" style={{ height: '220px' }}>
                   <div 
                      className={`absolute bottom-0 left-0 w-full bg-gradient-to-t ${barColor} rounded-full transition-all duration-1000 origin-bottom group-hover/bar:shadow-lg`} 
                      style={{ height: `${Math.max(h, 4)}%`, transitionDelay: `${i * 10}ms` }} 
                   />
                </div>
                <span className="text-[8px] font-black text-gray-300 mt-4 uppercase group-hover/bar:text-emerald-600 transition-colors tracking-tighter">
                   {d.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="pt-14 border-t-4 border-dashed border-gray-100 dark:border-gray-800 grid grid-cols-1 lg:grid-cols-12 gap-10">
           <div className="lg:col-span-4 space-y-8 h-fit sticky top-0">
              <div>
                 <h4 className="text-xl font-black uppercase tracking-tighter dark:text-white flex items-center gap-3">
                    <Target size={20} className="text-emerald-600"/> Kartu Skor Target
                 </h4>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">Ringkasan Pencapaian Ambang Batas</p>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between items-center p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                    <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div><span className="text-[11px] font-black uppercase tracking-widest">Optimal</span></div>
                    <span className="text-lg font-black text-emerald-600">{auditPerformance.counts.GREEN} {viewMode === 'BULANAN' ? 'Hari' : 'Bulan'}</span>
                 </div>
                 <div className="flex justify-between items-center p-5 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-800">
                    <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-[11px] font-black uppercase tracking-widest">Waspada</span></div>
                    <span className="text-lg font-black text-amber-600">{auditPerformance.counts.YELLOW} {viewMode === 'BULANAN' ? 'Hari' : 'Bulan'}</span>
                 </div>
                 <div className="flex justify-between items-center p-5 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-800">
                    <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-rose-600"></div><span className="text-[11px] font-black uppercase tracking-widest">Kritis</span></div>
                    <span className="text-lg font-black text-rose-600">{auditPerformance.counts.RED} {viewMode === 'BULANAN' ? 'Hari' : 'Bulan'}</span>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-8">
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h4 className="text-xl font-black uppercase tracking-tighter dark:text-white flex items-center gap-3">
                       <AlertOctagon size={20} className="text-rose-600"/> Jejak Audit Performa
                    </h4>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Daftar Rekaman di Bawah Target Optimal</p>
                 </div>
                 <div className="px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-black rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg">Audit Mendalam Aktif</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                 {auditPerformance.alertItems.map((d, i) => (
                    <div key={i} className={`p-6 rounded-[2.5rem] border-2 transition-all group/worst ${d.status === 'RED' ? 'bg-rose-50/30 border-rose-100 dark:bg-rose-950/10' : 'bg-amber-50/30 border-amber-100 dark:bg-amber-950/10'}`}>
                       <div className="flex justify-between items-start mb-6">
                          <div className={`p-2.5 rounded-xl shadow-sm ${d.status === 'RED' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>
                             {d.status === 'RED' ? <AlertOctagon size={16}/> : <AlertTriangle size={16} />}
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${d.status === 'RED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                             {d.status === 'RED' ? 'Kritis' : 'Waspada'}
                          </span>
                       </div>
                       
                       <h5 className="text-base font-black uppercase tracking-tight text-gray-900 dark:text-white leading-tight mb-1">{d.labelDetail}</h5>
                       
                       <div className="mt-4 pt-4 border-t border-dashed dark:border-gray-800 flex justify-between items-end">
                          <div>
                             <p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">Pendapatan</p>
                             <p className={`text-sm font-black ${d.status === 'RED' ? 'text-rose-600' : 'text-amber-600'}`}>{formatCurrency(d.inc)}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[7px] font-bold text-gray-400 uppercase italic leading-none mb-1">Target Min:</p>
                             <p className="text-[9px] font-black text-emerald-600">
                                {viewMode === 'BULANAN' 
                                  ? (d.isWeekend ? "Rp 20 Juta" : "Rp 8 Juta")
                                  : "Rp 350 Juta"}
                             </p>
                          </div>
                       </div>
                    </div>
                 ))}
                 {auditPerformance.alertItems.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[3rem]">
                       <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-4 opacity-20" />
                       <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">Seluruh Target Terlampaui</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeInfographic;
