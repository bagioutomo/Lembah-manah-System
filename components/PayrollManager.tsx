import React, { useState, useMemo, useEffect } from 'react';
import { 
  Banknote, 
  Search, 
  CheckCircle2, 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Calculator, 
  Settings2, 
  Clock, 
  Shield, 
  TrendingUp, 
  Coins, 
  PlusCircle,
  Trophy,
  Filter,
  UserCheck,
  Briefcase,
  Percent,
  ChevronRight,
  Info,
  ShieldCheck,
  Target,
  MinusCircle,
  UserX,
  CalendarCheck,
  CalendarDays,
  Settings,
  RefreshCcw,
  UserPlus,
  Umbrella,
  AlertCircle,
  ArrowDownCircle,
  ChevronDown,
  Zap,
  Users,
  Loader2
} from 'lucide-react';
import { Employee, ExpenseRecord, WalletName, UserRole, IncomeRecord, LeaveRecord, ScheduleRecord } from '../types';
import PayrollConfigPanel, { PayrollSystemSettings } from './PayrollConfigPanel';

interface PayrollForm {
  employeeId: string;
  overtimeHours: number;
  overtime: number;
  serviceChargeOverride: number | null;
  bonusOverride: number | null;
  absenceDays: number;
  otherDeductions: number;
  notes: string;
  daysWorked?: number;
  customBaseSalary?: number | null; 
  details?: string;
  payDate?: string;
}

interface Props {
  employees: Employee[];
  wallets: WalletName[];
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
  leaves: LeaveRecord[];
  schedules?: ScheduleRecord[];
  onAddExpense: (expense: ExpenseRecord) => void;
  userRole: UserRole;
  selectedMonth: number;
  selectedYear: number;
}

const PayrollManager: React.FC<Props> = ({ employees, wallets, incomes, expenses, leaves, schedules = [], onAddExpense, userRole, selectedMonth, selectedYear }) => {
  const isAdminOrOwner = userRole === 'ADMIN' || userRole === 'OWNER';
  const isSupervisor = userRole === 'SUPERVISOR';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [payrollData, setPayrollData] = useState<Record<string, PayrollForm>>({});
  const [showConfig, setShowConfig] = useState(false);
  
  const [sysSettings, setSysSettings] = useState<PayrollSystemSettings>(() => {
    const saved = localStorage.getItem('payroll-system-settings-v10');
    const defaults: PayrollSystemSettings = {
      otRateManagement: 7500,
      otRateStaff: 5000,
      standardWorkDays: 26,
      bonusTiers: [
        { revenue: 200000000, bonus: 250000 },
        { revenue: 300000000, bonus: 500000 },
        { revenue: 400000000, bonus: 750000 },
        { revenue: 500000000, bonus: 1000000 },
      ],
      bonusMultipliers: { management: 2.0, staff: 1.0, dw: 0.5 },
      managementKeywords: "admin, manager, supervisor, spv, purchasing",
      staffKeywords: "barista, waiter, cook, server, floor, cashier, runner",
      dwKeywords: "dw, daily worker, probation, trainee",
      scEligibleKeywords: "barista, waiter, cook, server, floor, cashier, admin, purchasing",
      bonusEligibleKeywords: "barista, waiter, cook, server, floor, cashier"
    };
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  const handleSaveSettings = (newSettings: PayrollSystemSettings) => {
    setSysSettings(newSettings);
    localStorage.setItem('payroll-system-settings-v10', JSON.stringify(newSettings));
    setShowConfig(false);
    alert('Konfigurasi sistem payroll diperbarui permanen!');
  };

  const [payingEmployee, setPayingEmployee] = useState<Employee | null>(null);
  const [confirmWallet, setConfirmWallet] = useState<WalletName>(isSupervisor ? 'Supervisor' : (wallets[0] || ''));

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const periodLabel = `${months[selectedMonth]} ${selectedYear}`;
  const todayDateStr = new Date().toISOString().split('T')[0];

  // Helper untuk deteksi posisi manual (Gardener / Security)
  const isManualPosition = (pos: string) => {
    const p = pos.toLowerCase();
    return p.includes('gardener') || p.includes('security');
  };

  const adminMetrics = useMemo(() => {
    if (isSupervisor) return null;
    const monthlyIncomes = incomes.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
    const grossIncome = monthlyIncomes.reduce((sum, r) => sum + r.total, 0);
    const netRevenue = Math.round(grossIncome / 1.1); 
    const totalFee = grossIncome - netRevenue; 
    const poolSC = Math.round(totalFee / 2);
    
    const eligibleForSCList = employees.filter(e => {
      if (!e.active || e.status === 'PARTTIME' || isManualPosition(e.position)) return false;
      const keywords = sysSettings.scEligibleKeywords.toLowerCase().split(',').map(k => k.trim());
      return keywords.some(k => k && e.position.toLowerCase().includes(k));
    });
    
    const scPerPerson = eligibleForSCList.length > 0 ? Math.floor(poolSC / eligibleForSCList.length) : 0;
    
    const sortedTiers = [...sysSettings.bonusTiers].sort((a, b) => b.revenue - a.revenue);
    const matchedTier = sortedTiers.find(tier => netRevenue >= tier.revenue);
    const baseBonus = matchedTier ? matchedTier.bonus : 0;
    
    return { grossIncome, netRevenue, poolSC, scPerPerson, baseBonus, eligibleCount: eligibleForSCList.length };
  }, [incomes, employees, selectedMonth, selectedYear, sysSettings, isSupervisor]);

  const autoAbsenceMap = useMemo(() => {
    const map: Record<string, number> = {};
    leaves.filter(l => l.status === 'APPROVED' && l.type !== 'CUTI').forEach(leave => {
      const start = new Date(leave.startDate);
      if (start.getFullYear() === selectedYear && start.getMonth() === selectedMonth) {
        let duration = 0;
        if (leave.isHalfDay) duration = 0.5;
        else {
          const end = new Date(leave.endDate);
          duration = (Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        }
        map[leave.employeeId] = (map[leave.employeeId] || 0) + duration;
      }
    });
    return map;
  }, [leaves, selectedMonth, selectedYear]);

  const activeEmployees = useMemo(() => {
    return employees.filter(e => {
      const matchSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.position.toLowerCase().includes(searchTerm.toLowerCase());
      if (!e.active || !matchSearch) return false;
      if (isSupervisor) return e.status === 'PARTTIME' || isManualPosition(e.position);
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, searchTerm, isSupervisor]);

  const getEmployeeCalculations = (emp: Employee) => {
    const data = payrollData[emp.id];
    const posLower = emp.position.toLowerCase();
    
    // LOGIKA MANUAL: PARTTIME, GARDENER, SECURITY
    if (emp.status === 'PARTTIME' || isManualPosition(emp.position)) {
        const finalWage = (data?.customBaseSalary !== undefined && data?.customBaseSalary !== null) ? data.customBaseSalary : 0; 
        const otherDeductions = data?.otherDeductions || 0;
        return { 
           base: finalWage, ot: 0, sc: 0, bonus: 0, 
           deductions: otherDeductions, absenceDays: 0, 
           total: Math.max(0, finalWage - otherDeductions), 
           isAuto: false 
        };
    }

    const base = emp.baseSalary;
    const absenceDays = data?.absenceDays !== undefined ? data.absenceDays : (autoAbsenceMap[emp.id] || 0);
    const divisor = sysSettings.standardWorkDays || 26;
    
    const isMgmt = sysSettings.managementKeywords.toLowerCase().split(',').map(k => k.trim()).some(k => k && posLower.includes(k));
    const isDw = sysSettings.dwKeywords.toLowerCase().split(',').map(k => k.trim()).some(k => k && posLower.includes(k));
    const isStaffLap = sysSettings.staffKeywords.toLowerCase().split(',').map(k => k.trim()).some(k => k && posLower.includes(k));
    
    const otRate = isMgmt ? sysSettings.otRateManagement : sysSettings.otRateStaff;
    const otAmount = (data?.overtimeHours || 0) * otRate;

    const isEligibleSC = sysSettings.scEligibleKeywords.toLowerCase().split(',').map(k => k.trim()).some(k => k && posLower.includes(k));
    const rawSc = (data?.serviceChargeOverride !== null && data?.serviceChargeOverride !== undefined) 
               ? data.serviceChargeOverride 
               : (isEligibleSC ? (adminMetrics?.scPerPerson || 0) : 0);
    const scAfterAbsence = Math.floor(rawSc * (divisor - absenceDays) / divisor);
    
    const isEligibleBonus = sysSettings.bonusEligibleKeywords.toLowerCase().split(',').map(k => k.trim()).some(k => k && posLower.includes(k));
    let baseBonusAmount = isEligibleBonus ? (adminMetrics?.baseBonus || 0) : 0;
    
    if (isEligibleBonus && (data?.bonusOverride === null || data?.bonusOverride === undefined)) {
      if (isMgmt) baseBonusAmount *= sysSettings.bonusMultipliers.management;
      else if (isDw) baseBonusAmount *= sysSettings.bonusMultipliers.dw;
      else if (isStaffLap) baseBonusAmount *= sysSettings.bonusMultipliers.staff;
    }
    
    const rawBonus = (data?.bonusOverride !== null && data?.bonusOverride !== undefined) ? data.bonusOverride : baseBonusAmount;
    const bonusAfterAbsence = Math.floor(rawBonus * (divisor - absenceDays) / divisor);

    const baseSalaryDeduction = Math.floor((base / divisor) * absenceDays);
    const totalDeductions = baseSalaryDeduction + (data?.otherDeductions || 0);

    return {
        base, ot: otAmount, sc: scAfterAbsence, bonus: bonusAfterAbsence, deductions: totalDeductions, absenceDays,
        total: Math.max(0, base + otAmount + scAfterAbsence + bonusAfterAbsence - totalDeductions),
        isAuto: false
    };
  };

  const handleInputChange = (empId: string, field: keyof PayrollForm, value: string) => {
    const numValue = field === 'notes' ? value : (field === 'absenceDays' || field === 'overtimeHours' ? parseFloat(value || '0') : parseInt(value.replace(/[^\d]/g, '') || '0'));
    setPayrollData(prev => {
      const existingEntry = prev[empId] || { employeeId: empId, overtimeHours: 0, overtime: 0, serviceChargeOverride: null, bonusOverride: null, absenceDays: autoAbsenceMap[empId] || 0, otherDeductions: 0, notes: '', customBaseSalary: 0 };
      return { ...prev, [empId]: { ...existingEntry, [field]: numValue } };
    });
  };

  const executePayment = () => {
    if (!payingEmployee) return;
    const emp = payingEmployee;
    const data: Partial<PayrollForm> = payrollData[emp.id] || {};
    const calc = getEmployeeCalculations(emp);
    const wallet = isSupervisor ? 'Supervisor' : confirmWallet;
    const category = (emp.status === 'PARTTIME' || isManualPosition(emp.position)) ? 'Gaji Part-time' : 'Gaji Pokok';
    const txId = Date.now();
    const todayStrDate = new Date().toLocaleDateString('id-ID');
    const breakdownTags = (emp.status === 'PARTTIME' || isManualPosition(emp.position)) ? `[MANUAL UPAH TGL:${todayStrDate}]` : `[B:${calc.base}][O:${calc.ot}][S:${calc.sc}][N:${calc.bonus}][D:${calc.deductions}]`;

    onAddExpense({ id: `pay-${emp.id}-${txId}`, date: new Date().toISOString().split('T')[0], notes: `[GAJI ${emp.status}] ${emp.name} (Periode: ${periodLabel}) [TXID:${txId}] ${breakdownTags} ${data.notes || ''}`, qty: 1, amount: calc.total, wallet, category, timestamp: new Date().toISOString(), createdBy: userRole });
    
    if (emp.status === 'PARTTIME' || isManualPosition(emp.position)) {
      setPayrollData(prev => ({ ...prev, [emp.id]: { ...(prev[emp.id] || {}), customBaseSalary: 0, otherDeductions: 0, notes: '', employeeId: emp.id, overtimeHours: 0, overtime: 0, serviceChargeOverride: null, bonusOverride: null, absenceDays: 0 } }));
    } else {
      setPayrollData(prev => { const n = { ...prev }; delete n[emp.id]; return n; });
    }
    setPayingEmployee(null);
    alert(`Sukses! Pembayaran ${emp.name} telah dicatat.`);
  };

  const formatCurrency = (val: number) => 'Rp ' + Math.floor(val).toLocaleString('id-ID');

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className={`p-4 ${isSupervisor ? 'bg-orange-600' : 'bg-blue-600'} text-white rounded-[1.5rem] shadow-xl`}>
            <Banknote size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight uppercase tracking-tighter">
              {isSupervisor ? 'Payroll Harian & Manual' : 'Payroll Management'}
            </h2>
            <p className="text-sm text-gray-500 font-medium italic">Sistem penggajian periode <b>{periodLabel}</b>.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           {!isSupervisor && isAdminOrOwner && (
             <button onClick={() => setShowConfig(true)} className="px-6 py-3 bg-white dark:bg-gray-900 text-blue-600 border border-blue-100 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center gap-2 hover:bg-blue-50 transition-all">
                <Settings2 size={18}/> Konfigurasi Sistem
             </button>
           )}
        </div>
      </div>

      {!isSupervisor && isAdminOrOwner && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-3xl flex gap-3 animate-fade-in">
           <ShieldCheck size={20} className="text-blue-600 shrink-0 mt-0.5" />
           <div className="text-[11px] text-blue-800 dark:text-blue-300 font-medium leading-relaxed italic">
              <p><b>Sistem Sinkronisasi Izin Aktif:</b> Data "Absen" di bawah ditarik otomatis dari menu <b>Izin & Cuti</b>.</p>
              <p><b>Posisi Gardener & Security:</b> Terdeteksi otomatis sebagai <b>Input Manual</b> tanpa SC/Bonus Omzet.</p>
           </div>
        </div>
      )}

      {!isSupervisor && adminMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
           <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-xl flex items-center justify-center"><TrendingUp size={20}/></div>
              <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Gross Revenue</p><h4 className="text-lg font-black">{formatCurrency(adminMetrics.grossIncome)}</h4></div>
           </div>
           <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded-xl flex items-center justify-center"><CheckCircle2 size={20}/></div>
              <div><p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Net Rev (Basis 1.1)</p><h4 className="text-lg font-black text-blue-700 dark:text-blue-400">{formatCurrency(adminMetrics.netRevenue)}</h4></div>
           </div>
           <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 rounded-xl flex items-center justify-center"><Coins size={20}/></div>
              <div><p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Pool SC (5% Gross)</p><h4 className="text-lg font-black text-indigo-700 dark:text-indigo-400">{formatCurrency(adminMetrics.poolSC)}</h4></div>
           </div>
           <div className="bg-blue-900 text-white p-6 rounded-3xl shadow-xl flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><Calculator size={20}/></div>
              <div><p className="text-[9px] font-black opacity-60 uppercase tracking-widest">Bonus Basis (Omzet)</p><h4 className="text-lg font-black text-blue-100">{formatCurrency(adminMetrics.baseBonus)}</h4></div>
           </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden">
        <div className="p-8 border-b dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="relative max-w-md w-full">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input type="text" placeholder="Cari nama staff..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-600 rounded-2xl pl-12 pr-6 py-3 outline-none font-bold text-sm transition-all" />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-5">Karyawan</th>
                <th className="px-4 py-5 text-center">Upah / Gaji Pokok</th>
                <th className="px-4 py-5 text-center text-blue-600">Lembur (Jam)</th>
                <th className="px-4 py-5 text-center text-blue-700">SC (+)</th>
                <th className="px-4 py-5 text-center text-emerald-600">Bonus (+)</th>
                <th className="px-4 py-5 text-center text-rose-600">Absen (Hari)</th>
                <th className="px-4 py-5 text-center text-red-600">Potongan Lain (-)</th>
                <th className="px-8 py-5 text-right text-gray-900 dark:text-white">Total Netto</th>
                <th className="px-8 py-5 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {activeEmployees.length === 0 ? (
                <tr><td colSpan={10} className="py-24 text-center text-gray-300 font-black uppercase italic tracking-widest">Tidak ada data karyawan</td></tr>
              ) : (
                activeEmployees.map(emp => {
                  const data = payrollData[emp.id];
                  const calc = getEmployeeCalculations(emp);
                  const isManual = emp.status === 'PARTTIME' || isManualPosition(emp.position);
                  
                  const isAlreadyPaidToday = expenses.some(e => 
                    e.notes.includes(emp.name) && 
                    e.date === todayDateStr &&
                    (e.category === 'Gaji Pokok' || e.category === 'Gaji Part-time')
                  );

                  const isAlreadyPaidMonth = expenses.some(e => 
                    e.notes.includes(emp.name) && 
                    e.notes.includes(periodLabel) && 
                    (e.category === 'Gaji Pokok' || e.category === 'Gaji Part-time')
                  );

                  const isAlreadyPaid = isSupervisor ? isAlreadyPaidToday : isAlreadyPaidMonth;
                  const autoAbsenceValue = autoAbsenceMap[emp.id] || 0;

                  return (
                    <tr key={emp.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors ${isAlreadyPaidToday && isSupervisor ? 'bg-green-50/20' : ''}`}>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <p className="text-sm font-black uppercase leading-none mb-1">{emp.name}</p>
                          <div className="flex items-center gap-2">
                             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{emp.position}</p>
                             {isManualPosition(emp.position) && <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[7px] font-black uppercase border border-indigo-100">MANUAL</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-6 text-center font-black text-xs">
                        {isManual ? (
                          <div className="relative max-w-[150px] mx-auto">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">Rp</span>
                            <input 
                              disabled={isAlreadyPaid}
                              type="text"
                              value={data?.customBaseSalary !== undefined && data?.customBaseSalary !== null ? data.customBaseSalary.toLocaleString('id-ID') : ''}
                              onChange={e => handleInputChange(emp.id, 'customBaseSalary', e.target.value)}
                              placeholder="Ketik upah..."
                              className={`w-full pl-8 pr-3 py-3 rounded-xl text-center font-black text-xs border-2 transition-all outline-none bg-white dark:bg-gray-800 ${data?.customBaseSalary && data?.customBaseSalary > 0 ? 'border-orange-500 shadow-lg shadow-orange-500/10' : 'border-gray-100 dark:border-gray-700'}`}
                            />
                          </div>
                        ) : (
                          formatCurrency(emp.baseSalary)
                        )}
                      </td>
                      <td className="px-4 py-6 text-center space-y-1">
                        {!isManual && (
                          <>
                            <input disabled={isAlreadyPaid} type="text" placeholder="Jam" value={data?.overtimeHours || ''} onChange={e => handleInputChange(emp.id, 'overtimeHours', e.target.value)} className="w-12 text-center rounded py-1 font-black text-[10px] bg-blue-50 dark:bg-blue-900/20 outline-none border border-transparent focus:border-blue-400" />
                            <p className="text-[9px] font-black text-blue-600">{calc.ot > 0 ? formatCurrency(calc.ot).replace('Rp ', '') : '-'}</p>
                          </>
                        )}
                        {isManual && <span className="text-[8px] text-gray-300">-</span>}
                      </td>
                      <td className="px-4 py-6 text-center space-y-1">
                        {!isManual && (
                          <>
                            <input disabled={isAlreadyPaid} type="text" placeholder={adminMetrics?.scPerPerson.toLocaleString('id-ID')} value={data?.serviceChargeOverride?.toLocaleString('id-ID') || ''} onChange={e => handleInputChange(emp.id, 'serviceChargeOverride', e.target.value)} className="w-20 text-center rounded py-1 font-black text-[10px] bg-blue-50 dark:bg-blue-900/20 outline-none border border-transparent focus:border-blue-400" />
                            <p className="text-[9px] font-black text-blue-700">{formatCurrency(calc.sc).replace('Rp ', '')}</p>
                          </>
                        )}
                        {isManual && <span className="text-[8px] text-gray-300">-</span>}
                      </td>
                      <td className="px-4 py-6 text-center space-y-1">
                        {!isManual && (
                          <>
                            <input disabled={isAlreadyPaid} type="text" placeholder="Auto" value={data?.bonusOverride?.toLocaleString('id-ID') || ''} onChange={e => handleInputChange(emp.id, 'bonusOverride', e.target.value)} className="w-20 text-center rounded py-1 font-black text-[10px] bg-emerald-50 dark:bg-emerald-900/20 outline-none border border-transparent focus:border-emerald-400" />
                            <p className="text-[9px] font-black text-emerald-600">{formatCurrency(calc.bonus).replace('Rp ', '')}</p>
                          </>
                        )}
                        {isManual && <span className="text-[8px] text-gray-300">-</span>}
                      </td>
                      <td className="px-4 py-6 text-center space-y-1">
                        {!isManual && (
                          <>
                            <div className="flex items-center gap-1 justify-center">
                              <input 
                                 disabled={isAlreadyPaid} 
                                 type="number" 
                                 step="0.5" 
                                 value={data?.absenceDays !== undefined ? data.absenceDays : (autoAbsenceValue || '')} 
                                 onChange={e => handleInputChange(emp.id, 'absenceDays', e.target.value)} 
                                 className={`w-10 text-center rounded py-1 font-black text-[10px] outline-none ${autoAbsenceValue > 0 ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-rose-50'}`} 
                              />
                              <span className="text-[8px] text-gray-400 font-black">HR</span>
                            </div>
                            <p className="text-[9px] font-black text-rose-600">{calc.absenceDays > 0 ? `Potong Gaji` : '-'}</p>
                          </>
                        )}
                        {isManual && <span className="text-[8px] text-gray-300">-</span>}
                      </td>
                      <td className="px-4 py-6 text-center space-y-2">
                         <div className="relative group">
                            <input 
                              disabled={isAlreadyPaid} 
                              type="text" 
                              placeholder="Potongan" 
                              value={data?.otherDeductions?.toLocaleString('id-ID') || ''} 
                              onChange={e => handleInputChange(emp.id, 'otherDeductions', e.target.value)} 
                              className={`w-24 text-center rounded-lg py-2 font-black text-[10px] outline-none border-2 transition-all ${data?.otherDeductions ? 'bg-red-50 border-red-200 text-red-600' : 'bg-gray-50 border-transparent focus:border-red-400'}`} 
                            />
                         </div>
                         <input 
                           disabled={isAlreadyPaid}
                           type="text" 
                           placeholder="Rincian..." 
                           value={data?.notes || ''} 
                           onChange={e => handleInputChange(emp.id, 'notes', e.target.value)} 
                           className="w-full text-[8px] font-bold text-center bg-transparent border-b border-gray-100 dark:border-gray-800 outline-none focus:border-red-400 transition-colors uppercase"
                         />
                      </td>
                      <td className="px-8 py-6 text-right font-black text-gray-900 dark:text-white text-base">
                        {formatCurrency(calc.total)}
                      </td>
                      <td className="px-8 py-6 text-center">
                         {isAlreadyPaid ? (
                            <div className="flex items-center justify-center gap-2 text-green-600 font-black text-[10px] uppercase bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                              <CheckCircle2 size={14} /> SUDAH LUNAS
                            </div>
                          ) : (
                            <button 
                               onClick={() => setPayingEmployee(emp)} 
                               disabled={calc.total <= 0}
                               className={`px-8 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-md transition-all active:scale-95 flex items-center gap-2 ${calc.total > 0 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                            >
                               Bayar
                            </button>
                         )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {showConfig && (
        <PayrollConfigPanel settings={sysSettings} onSave={handleSaveSettings} onClose={() => setShowConfig(false)} />
      )}

      {payingEmployee && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 animate-fade-in no-print">
           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPayingEmployee(null)} />
           <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl p-6 sm:p-8 animate-scale-in border-t-8 border-orange-600">
              <div className="flex justify-between items-start mb-4">
                 <h3 className="text-lg font-black uppercase tracking-tighter leading-tight">Konfirmasi Gaji</h3>
                 <button onClick={() => setPayingEmployee(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20}/></button>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-3xl space-y-4 mb-6">
                 <div className="text-center">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{payingEmployee.name}</p>
                    <h4 className="text-3xl font-black text-orange-600 dark:text-orange-500 tracking-tighter">{formatCurrency(getEmployeeCalculations(payingEmployee).total)}</h4>
                 </div>
                 
                 {payrollData[payingEmployee.id]?.notes && (
                    <div className="pt-3 border-t dark:border-gray-700">
                       <p className="text-[8px] font-bold text-red-500 uppercase mb-0.5">Rincian Potongan:</p>
                       <p className="text-[10px] font-black uppercase text-gray-500 truncate">"{payrollData[payingEmployee.id].notes}"</p>
                    </div>
                 )}

                 <div className="pt-3 border-t dark:border-gray-700 space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Sumber Dana</label>
                    <div className="relative">
                       <select 
                         value={confirmWallet} 
                         onChange={e => setConfirmWallet(e.target.value)} 
                         className="w-full bg-white dark:bg-gray-900 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-black text-xs outline-none focus:border-blue-500 transition-all uppercase appearance-none"
                       >
                          {wallets.filter(w => w !== 'Pajak & Service').map(w => <option key={w} value={w}>{w}</option>)}
                       </select>
                       <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                 </div>
              </div>

              <div className="flex flex-col gap-2">
                 <button onClick={executePayment} className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-orange-700 transition-all flex items-center justify-center gap-2">
                    <CheckCircle2 size={16}/> Konfirmasi Bayar
                 </button>
                 <button onClick={() => setPayingEmployee(null)} className="w-full py-3 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-gray-600">Batalkan</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PayrollManager;