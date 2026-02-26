
import React, { useMemo } from 'react';
import { 
  CalendarX, 
  UserX, 
  TrendingDown, 
  Star, 
  Award, 
  ShieldCheck, 
  HeartPulse,
  UserCheck,
  Info,
  AlertTriangle
} from 'lucide-react';
import { Employee, LeaveRecord } from '../types';

interface Props {
  employees: Employee[];
  leaves: LeaveRecord[];
}

const SDMAnalysis: React.FC<Props> = ({ employees, leaves }) => {
  
  const staffStats = useMemo(() => {
    return employees.filter(e => e.active).map(emp => {
      const empLeaves = leaves.filter(l => l.employeeId === emp.id && l.status === 'APPROVED');
      
      let totalDays = 0;
      let sakit = 0;
      let izin = 0;
      let cuti = 0;

      empLeaves.forEach(l => {
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        const duration = l.isHalfDay ? 0.5 : (Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        
        totalDays += duration;
        if (l.type === 'SAKIT') sakit += duration;
        else if (l.type === 'IZIN') izin += duration;
        else if (l.type === 'CUTI') cuti += duration;
      });

      return {
        id: emp.id,
        name: emp.name,
        position: emp.position,
        total: totalDays,
        sakit,
        izin,
        cuti
      };
    });
  }, [employees, leaves]);

  const hotlist = useMemo(() => {
    return [...staffStats]
      .filter(s => s.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [staffStats]);

  const perfectAttendance = useMemo(() => {
    return staffStats.filter(s => s.total === 0);
  }, [staffStats]);

  return (
    <div className="space-y-8 h-full">
      <div className="bg-white dark:bg-gray-950 p-10 rounded-[4rem] border-2 border-rose-100 dark:border-rose-900/30 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] -rotate-12 group-hover:rotate-0 transition-transform duration-1000">
          <CalendarX size={180} className="text-rose-600" />
        </div>
        
        <div className="flex items-center gap-4 mb-10 relative z-10">
          <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-2xl shadow-inner">
            <UserX size={24}/>
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white leading-none">Daftar Ketidakhadiran</h3>
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mt-1">Staf dengan Frekuensi Izin Tertinggi</p>
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          {hotlist.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-rose-100 dark:border-rose-900/20 rounded-[2.5rem]">
               <ShieldCheck size={40} className="text-emerald-500 mx-auto mb-4 opacity-20" />
               <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Nihil Data Ketidakhadiran</p>
            </div>
          ) : (
            hotlist.map((stat, i) => (
              <div key={i} className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-900 rounded-[2rem] border border-transparent hover:border-rose-300 transition-all group/item">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 text-rose-600 flex items-center justify-center font-black text-sm shadow-sm border border-rose-50">#{i+1}</div>
                  <div>
                    <p className="text-sm font-black uppercase text-gray-900 dark:text-white group-hover/item:text-rose-600 transition-colors">{stat.name}</p>
                    <div className="flex gap-3 mt-1">
                       <span className="text-[8px] font-black text-gray-400 uppercase flex items-center gap-1"><HeartPulse size={10} className="text-red-400"/> Sakit: {stat.sakit}</span>
                       <span className="text-[8px] font-black text-gray-400 uppercase flex items-center gap-1"><AlertTriangle size={10} className="text-amber-400"/> Izin: {stat.izin}</span>
                       <span className="text-[8px] font-black text-gray-400 uppercase flex items-center gap-1"><TrendingDown size={10} className="text-blue-400"/> Cuti: {stat.cuti}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-rose-600 tracking-tighter leading-none">{stat.total}</p>
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Total Hari</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-950 p-10 rounded-[4rem] border-2 border-emerald-100 dark:border-emerald-900/30 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-1000">
          <Star size={180} className="text-emerald-600" />
        </div>

        <div className="flex items-center gap-4 mb-10 relative z-10">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl shadow-inner">
            <Award size={24}/>
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white leading-none">Staf Berdedikasi Tinggi</h3>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Kehadiran Sempurna (100% On-Duty)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
          {perfectAttendance.length === 0 ? (
            <div className="col-span-full py-10 text-center opacity-20 italic text-[10px] font-black uppercase">Seluruh staf memiliki catatan absen</div>
          ) : (
            perfectAttendance.map((stat, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-emerald-50/40 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-800 transition-all hover:scale-[1.02]">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 text-emerald-600 flex items-center justify-center shadow-sm border border-emerald-100">
                   <UserCheck size={20} />
                </div>
                <div className="overflow-hidden">
                   <p className="text-[11px] font-black uppercase text-gray-900 dark:text-white truncate">{stat.name}</p>
                   <div className="flex items-center gap-1 text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                      <Star size={8} className="fill-emerald-500"/> Absensi Sempurna
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-8 pt-6 border-t border-dashed dark:border-gray-800">
           <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 px-5 py-3 rounded-2xl">
              <Info size={14} className="text-blue-500" />
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                 Data ditarik dari modul <b>Izin & Cuti</b> yang telah mendapatkan persetujuan (Approved).
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SDMAnalysis;
