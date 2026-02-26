import React, { useMemo } from 'react';
import { 
  Activity, PieChart, Coins, Landmark, ArrowUpCircle, Banknote,
  Clock, Trophy, MinusCircle, Sigma
} from 'lucide-react';
import { Employee, ExpenseRecord } from '../types';

interface Props {
  employees: Employee[];
  expenses: ExpenseRecord[];
  payrollCalculations: any[]; 
  adminMetrics: any;
  periodLabel: string;
}

const PayrollKPI: React.FC<Props> = ({ employees, expenses, payrollCalculations, adminMetrics, periodLabel }) => {
  const stats = useMemo(() => {
    // 1. Perhitungan Breakdown Kolektif (Total Seluruh Staff)
    const breakdown = {
      base: payrollCalculations.reduce((sum, item) => sum + item.baseMaster, 0),
      ot: payrollCalculations.reduce((sum, item) => sum + item.otAmount, 0),
      sc: payrollCalculations.reduce((sum, item) => sum + item.scNet, 0),
      bonus: payrollCalculations.reduce((sum, item) => sum + item.bonusNet, 0),
      absence: payrollCalculations.reduce((sum, item) => sum + item.absenceDeduction, 0),
      totalNet: payrollCalculations.reduce((sum, item) => sum + item.total, 0),
    };

    // 2. Total Liabilitas (Sama dengan breakdown.totalNet)
    const totalLiability = breakdown.totalNet;
    
    // 3. Total Realisasi (Apa yang SUDAH dibayar/tercatat di database pengeluaran)
    const paidExpenses = expenses.filter(e => 
      (e.category === 'Gaji Pokok' || e.category === 'Overtime' || e.category === 'Bonus Target' || e.category === 'Service Charge') && 
      e.notes.includes(periodLabel)
    );
    const totalRealized = paidExpenses.reduce((sum, e) => sum + e.amount, 0);

    // 4. Progres Persentase
    const progressPercent = totalLiability > 0 ? Math.round((totalRealized / totalLiability) * 100) : 0;

    // 5. Statistik Kehadiran (26 hari basis)
    const totalAbsenceDays = payrollCalculations.reduce((sum, item) => sum + item.absenceDays, 0);
    const avgAttendance = employees.length > 0 ? (26 - (totalAbsenceDays / employees.length)) : 26;
    const attendanceRate = (avgAttendance / 26) * 100;

    return { totalLiability, totalRealized, progressPercent, attendanceRate, breakdown };
  }, [employees, expenses, payrollCalculations, periodLabel]);

  const formatCurrency = (v: number) => 'Rp ' + Math.round(v).toLocaleString('id-ID');

  return (
    <div className="space-y-6 mb-6">
      {/* ROW 1: FINANCIAL BASIS (Net Revenue & SC Pool) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-900/30 shadow-lg flex items-center gap-5">
           <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl"><ArrowUpCircle size={24}/></div>
           <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Gross Income</p>
              <h4 className="text-xl font-black text-gray-900 dark:text-white">{formatCurrency(adminMetrics?.grossIncome || 0)}</h4>
           </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-blue-100 dark:border-blue-900/30 shadow-lg flex items-center gap-5">
           <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl"><Landmark size={24}/></div>
           <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Net Revenue (DPP)</p>
              <h4 className="text-xl font-black text-blue-700 dark:text-blue-400">{formatCurrency(adminMetrics?.netRevenue || 0)}</h4>
           </div>
        </div>
        <div className="bg-gray-900 p-6 rounded-[2.5rem] shadow-xl flex items-center justify-between group overflow-hidden relative border border-gray-800">
           <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 group-hover:rotate-0 transition-transform"><Coins size={80}/></div>
           <div className="flex items-center gap-5 relative z-10">
              <div className="p-3 bg-white/10 text-white rounded-2xl"><Coins size={24}/></div>
              <div>
                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Service Charge Pool</p>
                 <h4 className="text-xl font-black text-emerald-400">{formatCurrency(adminMetrics?.poolSC || 0)}</h4>
              </div>
           </div>
           <div className="text-right relative z-10 pr-2">
              <p className="text-[8px] font-black text-gray-500 uppercase">Per Staf</p>
              <p className="text-sm font-black text-white">{formatCurrency(adminMetrics?.scPerPerson || 0)}</p>
           </div>
        </div>
      </div>

      {/* ROW 2: PROGRESS STATUS */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl relative overflow-hidden group animate-fade-in">
        <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 transition-transform group-hover:rotate-0"><Activity size={180}/></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-8">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Realisasi Anggaran Gaji</p>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Status Penyaluran Dana Periode Aktif</h3>
              </div>
              <div className="text-right">
                <span className="text-4xl font-black text-blue-600 dark:text-blue-400">{stats.progressPercent}%</span>
              </div>
          </div>
          
          <div className="space-y-6">
              <div className="h-6 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-1 shadow-inner">
                <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-1000 ease-out shadow-lg" 
                    style={{ width: `${Math.min(stats.progressPercent, 100)}%` }}
                ></div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Total Liabilitas</p>
                    <p className="text-sm font-black">{formatCurrency(stats.totalLiability)}</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                    <p className="text-[8px] font-black text-blue-600 uppercase mb-1">Sudah Cair</p>
                    <p className="text-sm font-black text-blue-700 dark:text-blue-400">{formatCurrency(stats.totalRealized)}</p>
                </div>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                    <p className="text-[8px] font-black text-emerald-600 uppercase mb-1">Avg. Attendance</p>
                    <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">{stats.attendanceRate.toFixed(1)}%</p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-100 dark:border-orange-800">
                    <p className="text-[8px] font-black text-orange-600 uppercase mb-1">Sisa Hutang</p>
                    <p className="text-sm font-black text-orange-700 dark:text-orange-400">{formatCurrency(stats.totalLiability - stats.totalRealized)}</p>
                </div>
              </div>
          </div>
        </div>
      </div>

      {/* ROW 3: COLLECTIVE BREAKDOWN (Total Bar sebelum tabel) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-fade-in pt-4">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 shadow-lg group hover:border-blue-500 transition-all">
           <div className="flex items-center gap-2 mb-2 text-gray-400">
              <Banknote size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">Total Pokok</span>
           </div>
           <p className="text-sm font-black text-gray-900 dark:text-white leading-none">{formatCurrency(stats.breakdown.base)}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 shadow-lg group hover:border-blue-400 transition-all">
           <div className="flex items-center gap-2 mb-2 text-blue-500">
              <Clock size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">Total Lembur</span>
           </div>
           <p className="text-sm font-black text-blue-600 leading-none">{formatCurrency(stats.breakdown.ot)}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 shadow-lg group hover:border-indigo-400 transition-all">
           <div className="flex items-center gap-2 mb-2 text-indigo-500">
              <Coins size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">Total SC</span>
           </div>
           <p className="text-sm font-black text-indigo-600 leading-none">{formatCurrency(stats.breakdown.sc)}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 shadow-lg group hover:border-emerald-400 transition-all">
           <div className="flex items-center gap-2 mb-2 text-emerald-500">
              <Trophy size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">Total Bonus</span>
           </div>
           <p className="text-sm font-black text-emerald-600 leading-none">{formatCurrency(stats.breakdown.bonus)}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 shadow-lg group hover:border-rose-400 transition-all">
           <div className="flex items-center gap-2 mb-2 text-rose-500">
              <MinusCircle size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">Total Pot. Absen</span>
           </div>
           <p className="text-sm font-black text-rose-600 leading-none">-{formatCurrency(stats.breakdown.absence)}</p>
        </div>

        <div className="bg-indigo-600 p-5 rounded-[2rem] shadow-xl group hover:bg-indigo-700 transition-all border-2 border-indigo-400">
           <div className="flex items-center gap-2 mb-2 text-indigo-200">
              <Sigma size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">Total Dana Siap</span>
           </div>
           <p className="text-sm font-black text-white leading-none">{formatCurrency(stats.breakdown.totalNet)}</p>
        </div>
      </div>
    </div>
  );
};

export default PayrollKPI;