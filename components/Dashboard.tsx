
import React, { useMemo, useState } from 'react';
import { 
  LayoutDashboard, Navigation, Package, Shield, CalendarDays, TrendingUp, LayoutGrid
} from 'lucide-react';
import { IncomeRecord, ExpenseRecord, TransferRecord, UserRole, PageId, DashboardTask, CategoryConfig, ScheduleRecord, Employee, LeaveRecord, InventoryItem, MaintenanceTask, OperationalChecklistItem, BillRecord, Reservation } from '../types';

// Sub-dashboards
import AdminDashboard from './AdminDashboard';
import SupervisorDashboard from './SupervisorDashboard';
import PurchasingDashboard from './PurchasingDashboard';
import ManagerDashboard from './ManagerDashboard';

interface Props {
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
  allIncomes?: IncomeRecord[];
  allExpenses?: ExpenseRecord[];
  setIncomes: React.Dispatch<React.SetStateAction<IncomeRecord[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<ExpenseRecord[]>>;
  transfers: TransferRecord[];
  wallets: string[];
  categories: CategoryConfig[];
  userRole: UserRole;
  onNavigate: (page: PageId) => void;
  globalMonth: number;
  globalYear: number;
  businessInfo: any;
  schedules?: ScheduleRecord[];
  employees?: Employee[];
  leaves?: LeaveRecord[];
  inventoryItems?: InventoryItem[];
  maintenance?: MaintenanceTask[];
  checklist?: OperationalChecklistItem[];
  bills?: BillRecord[];
  reservations?: Reservation[];
  currentTasks: DashboardTask[];
  newTaskText: string;
  setNewTaskText: (val: string) => void;
  onAddTask: (e: React.FormEvent) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  aiInsights: any[];
  loadingAI: boolean;
  viewMode: 'BULANAN' | 'TAHUNAN';
  setViewMode: (mode: 'BULANAN' | 'TAHUNAN') => void;
}

const Dashboard: React.FC<Props> = (props) => {
  const { 
    userRole, globalMonth, globalYear, wallets, onNavigate, 
    setIncomes, setExpenses, inventoryItems = [], maintenance = [], 
    checklist = [], reservations = [], transfers = [], bills = [],
    currentTasks, newTaskText, setNewTaskText, onAddTask, onToggleTask, onDeleteTask,
    aiInsights, loadingAI, businessInfo, schedules = [], employees = [], viewMode
  } = props;
  
  const isSupervisor = userRole === 'SUPERVISOR';
  const isPurchasing = userRole === 'PURCHASING';
  const isManager = userRole === 'MANAGER';

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const stats = useMemo(() => {
    const currentIncomes = props.incomes || [];
    const currentExpenses = props.expenses || [];
    
    const totalIncome = Math.round(currentIncomes.reduce((sum, r) => sum + (Number(r.total) || 0), 0));
    const totalExpense = Math.round(currentExpenses.reduce((sum, e) => sum + ((Number(e.amount) || 0) * (Number(e.qty) || 1)), 0));
    
    const netRevenue = Math.round(totalIncome / 1.1);
    const taxPool = totalIncome - netRevenue; 
    const netProfit = netRevenue - totalExpense;

    // Helper untuk filter periode
    const isInPeriod = (dateStr: string) => {
      const d = new Date(dateStr);
      if (viewMode === 'TAHUNAN') return d.getFullYear() === globalYear;
      return d.getMonth() === globalMonth && d.getFullYear() === globalYear;
    };

    // ==========================================
    // PERIODIC VIRTUAL WALLET ENGINE
    // ==========================================
    const walletBalances: Record<string, number> = {};
    wallets.forEach(w => walletBalances[w] = 0);
    
    // 1. Audit Pemasukan
    (props.allIncomes || []).forEach(r => {
      if (!isInPeriod(r.date)) return;
      if (walletBalances['Cash Naim'] !== undefined) walletBalances['Cash Naim'] += (Number(r.cashNaim) || 0);
      if (walletBalances['BRI'] !== undefined) walletBalances['BRI'] += (Number(r.bri) || 0);
      if (walletBalances['BNI'] !== undefined) walletBalances['BNI'] += (Number(r.bni) || 0);
    });
    
    // 2. Audit Pengeluaran
    (props.allExpenses || []).forEach(r => {
      if (!isInPeriod(r.date)) return;
      const actualOut = (Number(r.amount) || 0) * (Number(r.qty) || 1);
      if (walletBalances[r.wallet] !== undefined) {
        walletBalances[r.wallet] -= actualOut;
      }
    });

    // 3. Audit Mutasi Internal
    (props.transfers || []).forEach(t => {
       if (!isInPeriod(t.date)) return;
       const amt = Number(t.amount) || 0;
       if (walletBalances[t.fromWallet] !== undefined) walletBalances[t.fromWallet] -= amt;
       if (walletBalances[t.toWallet] !== undefined) walletBalances[t.toWallet] += amt;
    });

    Object.keys(walletBalances).forEach(k => {
      walletBalances[k] = Math.round(walletBalances[k]);
    });

    // Trends calculation
    const currentGMonth = Number(globalMonth);
    const currentGYear = Number(globalYear);
    const prevMonth = currentGMonth === 0 ? 11 : currentGMonth - 1;
    const prevYear = currentGMonth === 0 ? currentGYear - 1 : currentGYear;
    
    const filterPrev = (itemDate: string) => {
      const d = new Date(itemDate);
      if (viewMode === 'TAHUNAN') return d.getFullYear() === currentGYear - 1;
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    };

    const prevIncome = (props.allIncomes || []).filter(i => filterPrev(i.date)).reduce((sum, r) => sum + (Number(r.total) || 0), 0);
    const prevExpense = (props.allExpenses || []).filter(e => filterPrev(e.date)).reduce((sum, r) => sum + ((Number(r.amount) || 0) * (Number(r.qty) || 1)), 0);
    const prevProfit = (prevIncome / 1.1) - prevExpense;

    const calcTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / Math.abs(prev)) * 100;
    };

    const categoryMap = currentExpenses.reduce((acc: Record<string, number>, curr: ExpenseRecord) => {
      const val = (Number(curr.amount) || 0) * (Number(curr.qty) || 1);
      acc[curr.category] = (acc[curr.category] || 0) + val;
      return acc;
    }, {} as Record<string, number>);

    const categoryDistribution = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value: Math.round(value as number) }))
      .sort((a, b) => Number(b.value) - Number(a.value));

    const dailyMap: Record<number, { income: number, expense: number }> = {};
    currentIncomes.forEach((inc: IncomeRecord) => {
      const d = new Date(inc.date);
      const k = viewMode === 'TAHUNAN' ? d.getMonth() + 1 : d.getDate();
      if (!dailyMap[k]) dailyMap[k] = { income: 0, expense: 0 };
      dailyMap[k].income += (Number(inc.total) || 0);
    });
    currentExpenses.forEach((exp: ExpenseRecord) => {
      const d = new Date(exp.date);
      const k = viewMode === 'TAHUNAN' ? d.getMonth() + 1 : d.getDate();
      if (!dailyMap[k]) dailyMap[k] = { income: 0, expense: 0 };
      dailyMap[k].expense += ((Number(exp.amount) || 0) * (Number(exp.qty) || 1));
    });

    const combinedChartData = Object.entries(dailyMap)
      .map(([key, val]) => {
        const v = val as { income: number, expense: number };
        return { day: parseInt(key), income: Math.round(v.income), expense: Math.round(v.expense) };
      })
      .sort((a, b) => a.day - b.day);

    return { 
      totalIncome, totalExpense, netProfit, taxPool,
      trends: {
        income: calcTrend(totalIncome, prevIncome),
        expense: calcTrend(totalExpense, prevExpense),
        profit: calcTrend(netProfit, prevProfit),
        tax: calcTrend(taxPool, (prevIncome * 0.1))
      },
      walletBalances, categoryDistribution, chartData: combinedChartData,
      recentExpenses: (props.allExpenses || []).slice(-15).reverse(),
      purchasing: {
        totalExpense: currentExpenses.filter(e => e.createdBy === 'PURCHASING').reduce((sum, e) => sum + ((Number(e.amount) || 0) * (Number(e.qty) || 1)), 0),
        recentExpenses: (props.allExpenses || []).filter(e => e.createdBy === 'PURCHASING').slice(-15).reverse(),
        categoryDistribution: Object.entries(currentExpenses.filter(e => e.createdBy === 'PURCHASING').reduce((acc: any, e) => { acc[e.category] = (acc[e.category] || 0) + (Number(e.amount) * (Number(e.qty) || 1)); return acc; }, {})).map(([name, value]) => ({ name, value: Math.round(value as number) })).sort((a,b) => b.value - a.value)
      },
      supervisor: {
        totalExpense: currentExpenses.filter(e => e.createdBy === 'SUPERVISOR').reduce((sum, e) => sum + ((Number(e.amount) || 0) * (Number(e.qty) || 1)), 0),
        recentExpenses: (props.allExpenses || []).filter(e => e.createdBy === 'SUPERVISOR').slice(-15).reverse(),
        categoryDistribution: Object.entries(currentExpenses.filter(e => e.createdBy === 'SUPERVISOR').reduce((acc: any, e) => { acc[e.category] = (acc[e.category] || 0) + (Number(e.amount) * (Number(e.qty) || 1)); return acc; }, {})).map(([name, value]) => ({ name, value: Math.round(value as number) })).sort((a,b) => b.value - a.value)
      }
    };
  }, [props.incomes, props.expenses, props.allIncomes, props.allExpenses, props.transfers, wallets, viewMode, globalMonth, globalYear]);

  const opData = useMemo(() => {
    const doneChecklist = (checklist || []).filter(t => t.done).length;
    const totalChecklist = (checklist || []).length;
    return { doneChecklist, totalChecklist, readinessScore: totalChecklist > 0 ? (doneChecklist / totalChecklist) * 100 : 0 };
  }, [checklist]);

  const safeFormatCurrency = (v: number) => 'Rp ' + Math.round(v || 0).toLocaleString('id-ID');

  return (
    <div className="animate-fade-in space-y-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4 px-2">
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 bg-green-700 text-white rounded-[2rem] flex items-center justify-center shadow-xl animate-scale-in">
              {isSupervisor ? <Navigation size={32} /> : isPurchasing ? <Package size={32}/> : <LayoutDashboard size={32}/>}
           </div>
           <div>
              <div className="flex items-center gap-3">
                 <h1 className="text-4xl font-black tracking-tighter uppercase leading-none dark:text-white">{userRole} Terminal</h1>
                 <span className="px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-100 dark:border-green-800">Audit System Aktif</span>
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                 <CalendarDays size={12} className="text-green-600"/>
                 {viewMode === 'BULANAN' ? `Audit Periode: ${months[globalMonth]} ${globalYear}` : `Audit Akumulasi: ${globalYear}`}
              </p>
           </div>
        </div>
      </div>

      {userRole === 'OWNER' || userRole === 'ADMIN' ? (
        <AdminDashboard stats={stats} viewMode={viewMode} onNavigate={onNavigate} formatCurrency={safeFormatCurrency} currentTasks={currentTasks} newTaskText={newTaskText} setNewTaskText={setNewTaskText} onAddTask={onAddTask} onToggleTask={onToggleTask} onDeleteTask={id => onDeleteTask(id)} aiInsights={aiInsights} loadingAI={loadingAI} wallets={wallets} categories={props.categories.map(c => c.name)} onAddIncome={(data) => setIncomes(prev => [...prev, data])} onAddExpense={(data) => setExpenses(prev => [...prev, data])} userRole={userRole} reservations={reservations} bills={bills} schedules={schedules} employees={employees} expenses={props.expenses} />
      ) : isManager ? (
        <ManagerDashboard stats={stats} opData={opData} onNavigate={onNavigate} formatCurrency={safeFormatCurrency} aiInsights={aiInsights} loadingAI={loadingAI} inventoryItems={inventoryItems} maintenance={maintenance} checklist={checklist} schedules={schedules} bills={bills} transfers={transfers} />
      ) : isSupervisor ? (
        <SupervisorDashboard opData={opData} viewMode={viewMode} formatCurrency={safeFormatCurrency} walletBalances={stats.walletBalances} onNavigate={onNavigate} currentTasks={currentTasks} newTaskText={newTaskText} setNewTaskText={setNewTaskText} onAddTask={onAddTask} onToggleTask={onToggleTask} onDeleteTask={id => onDeleteTask(id)} schedules={schedules} employees={employees} inventoryItems={inventoryItems} maintenance={maintenance} recentExpenses={stats.supervisor.recentExpenses} chartData={stats.chartData} checklist={checklist} bills={bills} businessInfo={businessInfo} reservations={reservations} />
      ) : (
        <PurchasingDashboard purchData={{ criticalStock: (inventoryItems || []).filter(i => (i.quantity || 0) <= 5) }} formatCurrency={safeFormatCurrency} walletBalance={stats.walletBalances['Purchasing'] || 0} onNavigate={onNavigate} currentTasks={currentTasks} newTaskText={newTaskText} setNewTaskText={setNewTaskText} onAddTask={onAddTask} onToggleTask={id => onToggleTask(id)} onDeleteTask={id => onDeleteTask(id)} recentExpenses={stats.purchasing.recentExpenses} chartData={stats.chartData} stats={stats} bills={bills} />
      )}
    </div>
  );
};

export default Dashboard;
