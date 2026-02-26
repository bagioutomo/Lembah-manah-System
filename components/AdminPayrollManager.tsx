
import React, { useState, useMemo } from 'react';
import { 
  Banknote, Search, CheckCircle2, X, Settings2, Info
} from 'lucide-react';
import { Employee, ExpenseRecord, WalletName, UserRole, IncomeRecord, LeaveRecord, PayrollSystemSettings } from '../types';
import PayrollConfigPanel from './PayrollConfigPanel';
import PayrollKPI from './PayrollKPI';
import PayrollPaymentModal from './PayrollPaymentModal';

interface PayrollForm {
  employeeId: string;
  overtimeHours: number;
  serviceChargeOverride: number | null;
  bonusOverride: number | null;
  absenceDays: number | null; 
  otherDeductions: number;
  notes: string;
}

interface Props {
  employees: Employee[];
  wallets: WalletName[];
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
  leaves: LeaveRecord[];
  onAddExpense: (expense: ExpenseRecord) => void;
  userRole: UserRole;
  selectedMonth: number;
  selectedYear: number;
  // Tambahkan props untuk sinkronisasi cloud
  payrollSystemSettings: PayrollSystemSettings;
  setPayrollSystemSettings: (settings: PayrollSystemSettings) => void;
}

const AdminPayrollManager: React.FC<Props> = ({ 
  employees, wallets, incomes, expenses, leaves, onAddExpense, 
  userRole, selectedMonth, selectedYear, 
  payrollSystemSettings, setPayrollSystemSettings 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [payrollData, setPayrollData] = useState<Record<string, PayrollForm>>({});
  const [showConfig, setShowConfig] = useState(false);
  const [payingEmployee, setPayingEmployee] = useState<Employee | null>(null);

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const periodLabel = `${months[selectedMonth]} ${selectedYear}`;
  const todayStr = new Date().toISOString().split('T')[0];

  const adminMetrics = useMemo(() => {
    const monthlyIncomes = incomes.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
    const grossIncome = monthlyIncomes.reduce((sum, r) => sum + r.total, 0);
    const netRevenue = Math.round(grossIncome / 1.1); 
    const poolSC = Math.round((grossIncome - netRevenue) / 2);
    
    const eligibleForSCList = employees.filter(e => {
      if (!e.active || e.status === 'PARTTIME') return false;
      const keywords = payrollSystemSettings.scEligibleKeywords.toLowerCase().split(',').map(k => k.trim());
      return keywords.some(k => k && e.position.toLowerCase().includes(k));
    });
    const scPerPerson = eligibleForSCList.length > 0 ? Math.floor(poolSC / eligibleForSCList.length) : 0;
    const sortedTiers = [...payrollSystemSettings.bonusTiers].sort((a, b) => b.revenue - a.revenue);
    const matchedTier = sortedTiers.find(tier => netRevenue >= tier.revenue);
    return { grossIncome, netRevenue, poolSC, scPerPerson, baseBonus: matchedTier ? matchedTier.bonus : 0 };
  }, [incomes, employees, selectedMonth, selectedYear, payrollSystemSettings]);

  const autoAbsenceMap = useMemo(() => {
    const map: Record<string, number> = {};
    leaves.filter(l => l.status === 'APPROVED').forEach(l => {
      const start = new Date(l.startDate);
      if (start.getFullYear() === selectedYear && start.getMonth() === selectedMonth) {
        map[l.employeeId] = (map[l.employeeId] || 0) + (l.isHalfDay ? 0.5 : 1);
      }
    });
    return map;
  }, [leaves, selectedMonth, selectedYear]);

  const getCalc = (emp: Employee) => {
    const data = payrollData[emp.id];
    const posLower = emp.position.toLowerCase();
    const isSecurity = posLower.includes('security') || posLower.includes('satpam');
    const isGardener = posLower.includes('gardener') || posLower.includes('kebun');
    
    const baseMaster = emp.baseSalary;
    const absenceDays = data?.absenceDays ?? (autoAbsenceMap[emp.id] || 0);
    const divisor = payrollSystemSettings.standardWorkDays || 26; 
    
    const isMgmt = payrollSystemSettings.managementKeywords.toLowerCase().split(',').some(k => k.trim() && emp.position.toLowerCase().includes(k.trim()));
    const otRate = isMgmt ? payrollSystemSettings.otRateManagement : payrollSystemSettings.otRateStaff;
    const otHours = isSecurity ? 0 : (data?.overtimeHours || 0);
    const otAmount = otHours * otRate;

    const isEligibleSC = !isSecurity && !isGardener && payrollSystemSettings.scEligibleKeywords.toLowerCase().includes(emp.position.toLowerCase());
    const rawSc = data?.serviceChargeOverride ?? (isEligibleSC ? adminMetrics.scPerPerson : 0);
    const scNet = Math.floor(rawSc * (divisor - absenceDays) / divisor);
    
    let bonusNet = 0;
    if (!isSecurity) {
      if (isGardener) {
        bonusNet = data?.bonusOverride || 0;
      } else {
        let bonusBasis = adminMetrics.baseBonus;
        if (isMgmt) bonusBasis *= payrollSystemSettings.bonusMultipliers.management;
        else if (emp.status === 'DAILYWORKER') bonusBasis *= payrollSystemSettings.bonusMultipliers.dw;
        bonusNet = Math.floor((data?.bonusOverride ?? bonusBasis) * (divisor - absenceDays) / divisor);
      }
    }
    
    const absenceDeduction = Math.floor((baseMaster / divisor) * absenceDays);
    const otherDeductions = data?.otherDeductions || 0;
    
    return { 
      baseMaster, otAmount, scNet, bonusNet, 
      absenceDays, 
      absenceDeduction, 
      otherDeductions,
      otHours,
      netBase: Math.max(0, baseMaster - absenceDeduction - otherDeductions),
      total: Math.max(0, (baseMaster - absenceDeduction - otherDeductions) + otAmount + scNet + bonusNet) 
    };
  };

  const allCalculations = useMemo(() => {
    return employees.filter(e => e.active).map(emp => ({
      ...getCalc(emp),
      employeeId: emp.id
    }));
  }, [employees, payrollData, adminMetrics, payrollSystemSettings, autoAbsenceMap]);

  const handlePayConfirm = (wallet: WalletName) => {
    if (!payingEmployee) return;
    const calc = getCalc(payingEmployee);
    const timestamp = new Date().toISOString();
    const txId = Date.now();
    const commonNote = `${payingEmployee.name} (${periodLabel}) [TXID:${txId}]`;
    const metadata = `[B:${calc.baseMaster}][OT:${calc.otHours}][DA:${calc.absenceDeduction}][DO:${calc.otherDeductions}]`;

    if (calc.netBase >= 0) {
      onAddExpense({
        id: `pay-base-${payingEmployee.id}-${txId}`,
        date: todayStr,
        notes: `[GAJI POKOK] ${commonNote} ${metadata}`,
        qty: 1,
        amount: calc.netBase,
        wallet: wallet,
        category: 'Gaji Pokok',
        timestamp,
        createdBy: userRole
      });
    }

    if (calc.otAmount > 0) {
      onAddExpense({
        id: `pay-ot-${payingEmployee.id}-${txId}`,
        date: todayStr,
        notes: `[LEMBUR] ${commonNote}`,
        qty: 1,
        amount: calc.otAmount,
        wallet: wallet,
        category: 'Overtime',
        timestamp,
        createdBy: userRole
      });
    }

    if (calc.bonusNet > 0) {
      onAddExpense({
        id: `pay-bonus-${payingEmployee.id}-${txId}`,
        date: todayStr,
        notes: `[BONUS TARGET] ${commonNote}`,
        qty: 1,
        amount: calc.bonusNet,
        wallet: wallet,
        category: 'Bonus Target',
        timestamp,
        createdBy: userRole
      });
    }

    if (calc.scNet > 0) {
      onAddExpense({
        id: `pay-sc-${payingEmployee.id}-${txId}`,
        date: todayStr,
        notes: `[SERVICE CHARGE] ${commonNote}`,
        qty: 1,
        amount: calc.scNet,
        wallet: 'Pajak & Service',
        category: 'Service Charge',
        timestamp,
        createdBy: userRole
      });
    }

    setPayingEmployee(null);
    alert('Pembayaran gaji telah dipecah & berhasil dicatat!');
  };

  const formatCurrency = (v: number) => 'Rp ' + Math.round(v).toLocaleString('id-ID');

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => e.active && e.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [employees, searchTerm]);

  return (
    <div className="space-y-8 animate-fade-in">
      <style>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl"><Banknote size={28}/></div>
          <div><h2 className="text-3xl font-black uppercase tracking-tighter">Admin Payroll Hub</h2><p className="text-xs font-bold text-gray-400">Periode: {periodLabel}</p></div>
        </div>
        <button onClick={() => setShowConfig(true)} className="px-6 py-3 bg-white dark:bg-gray-900 text-blue-600 rounded-xl font-black text-xs uppercase border border-blue-100 flex items-center gap-2 shadow-sm hover:bg-blue-50 transition-all"><Settings2 size={18}/> System Config</button>
      </div>

      <PayrollKPI 
        employees={employees.filter(e => e.active)} 
        expenses={expenses} 
        payrollCalculations={allCalculations}
        adminMetrics={adminMetrics}
        periodLabel={periodLabel}
      />

      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border shadow-2xl overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/30">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Cari karyawan..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl font-bold text-sm outline-none focus:border-blue-600 transition-all"/>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
             <Info size={14} className="text-blue-600"/>
             <span className="text-[9px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest italic">Basis Hitung: 26 Hari Kerja (Sync Izin & Cuti Aktif)</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50 font-black uppercase text-gray-400">
              <tr className="border-b">
                <th className="px-5 py-3">Karyawan</th>
                <th className="px-4 py-3 text-center">Pokok</th>
                <th className="px-4 py-3 text-center text-blue-600">Lembur (Jam)</th>
                <th className="px-4 py-3 text-center text-blue-700">SC (+)</th>
                <th className="px-4 py-3 text-center text-emerald-600">Bonus (+)</th>
                <th className="px-4 py-3 text-center text-rose-600">Absen (Hari)</th>
                <th className="px-4 py-3 text-center text-rose-800">Lain (-)</th>
                <th className="px-5 py-3 text-right bg-indigo-50/30 dark:bg-indigo-900/10">Total Bersih</th>
                <th className="px-5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {filteredEmployees.map(emp => {
                const calc = getCalc(emp);
                const isPaid = expenses.some(ex => ex.notes.includes(emp.name) && ex.notes.includes(periodLabel));
                const empPayroll = payrollData[emp.id];
                
                return (
                  <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-2.5">
                      <div>
                        <p className="font-black uppercase text-gray-900 dark:text-white leading-none mb-1">{emp.name}</p>
                        <p className="text-[9px] text-gray-400 uppercase tracking-tighter">{emp.position}</p>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center font-bold">{formatCurrency(emp.baseSalary)}</td>
                    <td className="px-4 py-2.5 text-center">
                       <div className="flex flex-col items-center">
                          <input 
                            disabled={isPaid} 
                            type="number" 
                            step="0.5" 
                            value={empPayroll?.overtimeHours || ''} 
                            onChange={e => setPayrollData({...payrollData, [emp.id]: {...(payrollData[emp.id] || {employeeId: emp.id, overtimeHours: 0, serviceChargeOverride: null, bonusOverride: null, absenceDays: null, otherDeductions: 0, notes: ''}), overtimeHours: parseFloat(e.target.value) || 0}})} 
                            className="w-12 p-1.5 rounded-lg text-center border font-black bg-blue-50 dark:bg-gray-950 text-blue-700 outline-none focus:border-blue-500 transition-all appearance-none text-[11px]" 
                            placeholder="-" 
                          />
                          <span className="text-[7px] font-bold text-blue-600/60 mt-0.5">{calc.otAmount > 0 ? formatCurrency(calc.otAmount).replace('Rp ', '') : ''}</span>
                       </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                       <div className="flex flex-col items-center">
                          <input disabled={isPaid} type="text" placeholder="Auto" value={empPayroll?.serviceChargeOverride?.toLocaleString() ?? ''} onChange={e => setPayrollData({...payrollData, [emp.id]: {...(payrollData[emp.id] || {employeeId: emp.id, overtimeHours: 0, serviceChargeOverride: null, bonusOverride: null, absenceDays: null, otherDeductions: 0, notes: ''}), serviceChargeOverride: parseInt(e.target.value.replace(/[^\d]/g, '')) || null}})} className="w-20 p-1.5 rounded-lg text-center border font-bold bg-indigo-50/50 outline-none text-[11px]" />
                          <span className="text-[7px] font-black text-indigo-700 mt-0.5">{formatCurrency(calc.scNet).replace('Rp ', '')}</span>
                       </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                       <div className="flex flex-col items-center">
                          <input disabled={isPaid} type="text" placeholder="Auto" value={empPayroll?.bonusOverride?.toLocaleString() ?? ''} onChange={e => setPayrollData({...payrollData, [emp.id]: {...(payrollData[emp.id] || {employeeId: emp.id, overtimeHours: 0, serviceChargeOverride: null, bonusOverride: null, absenceDays: null, otherDeductions: 0, notes: ''}), bonusOverride: parseInt(e.target.value.replace(/[^\d]/g, '')) || null}})} className="w-20 p-1.5 rounded-lg text-center border font-bold bg-emerald-50/50 outline-none text-[11px]" />
                          <span className="text-[7px] font-black text-emerald-700 mt-0.5">{formatCurrency(calc.bonusNet).replace('Rp ', '')}</span>
                       </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                       <div className="flex flex-col items-center">
                          <input 
                            disabled={isPaid} 
                            type="number" 
                            step="0.5" 
                            value={empPayroll?.absenceDays ?? (autoAbsenceMap[emp.id] || '')} 
                            onChange={e => setPayrollData({...payrollData, [emp.id]: {...(payrollData[emp.id] || {employeeId: emp.id, overtimeHours: 0, serviceChargeOverride: null, bonusOverride: null, absenceDays: 0, otherDeductions: 0, notes: ''}), absenceDays: parseFloat(e.target.value) || 0}})} 
                            className="w-12 p-1.5 rounded-lg text-center border font-black bg-rose-50 text-rose-600 outline-none focus:border-rose-500 transition-all appearance-none text-[11px]" 
                            placeholder="-" 
                          />
                          <span className="text-[7px] font-bold text-rose-600/60 mt-0.5">-{calc.absenceDeduction.toLocaleString()}</span>
                       </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                       <input disabled={isPaid} type="text" value={empPayroll?.otherDeductions?.toLocaleString() ?? ''} onChange={e => setPayrollData({...payrollData, [emp.id]: {...(payrollData[emp.id] || {employeeId: emp.id, overtimeHours: 0, serviceChargeOverride: null, bonusOverride: null, absenceDays: null, otherDeductions: 0, notes: ''}), otherDeductions: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0}})} className="w-20 p-1.5 rounded-lg text-center border-2 border-dashed border-rose-200 font-bold text-rose-500 outline-none text-[11px]" placeholder="0" />
                    </td>
                    <td className="px-5 py-2.5 text-right font-black text-[13px] bg-indigo-50/30 dark:bg-indigo-900/10">{formatCurrency(calc.total)}</td>
                    <td className="px-5 py-2.5 text-center">
                      {isPaid ? (
                        <div className="flex items-center justify-center gap-1 text-green-600 font-black"><CheckCircle2 size={14}/><span className="text-[9px] uppercase">LUNAS</span></div>
                      ) : (
                        <button onClick={() => setPayingEmployee(emp)} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] shadow-md hover:bg-blue-700 transition-all cursor-pointer">BAYAR</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showConfig && <PayrollConfigPanel settings={payrollSystemSettings} onClose={() => setShowConfig(false)} onSave={s => { setPayrollSystemSettings(s); setShowConfig(false); }} />}
      
      {payingEmployee && (
        <PayrollPaymentModal 
          employee={payingEmployee}
          calc={getCalc(payingEmployee)}
          wallets={wallets}
          periodLabel={periodLabel}
          onClose={() => setPayingEmployee(null)}
          onConfirm={handlePayConfirm}
        />
      )}
    </div>
  );
};

export default AdminPayrollManager;
