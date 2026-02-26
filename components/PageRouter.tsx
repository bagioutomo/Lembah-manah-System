
import React from 'react';
import Dashboard from './Dashboard';
import TransactionForms from './TransactionForms';
import DatabaseView from './DatabaseView';
import WalletManager from './WalletManager';
import Reports from './Reports';
import CategoryManager from './CategoryManager';
import SettingsView from './SettingsView';
import EmployeeManager from './EmployeeManager';
import AdminPayrollManager from './AdminPayrollManager';
import SupervisorPayrollManager from './SupervisorPayrollManager';
import PayrollSlips from './PayrollSlips';
import LeaveManager from './LeaveManager';
import OpChecklistManager from './OpChecklistManager';
import OpMaintenanceManager from './OpMaintenanceManager';
import ScheduleManager from './ScheduleManager';
import StockAuditManager from './StockAuditManager';
import AssetInventoryManager from './AssetInventoryManager';
import ArticleManager from './ArticleManager';
import HppProcessManager from './HppProcessManager';
import ProcessedMaterialManager from './ProcessedMaterialManager';
import HppSummary from './HppSummary';
import ReservasiPage from './ReservasiPage';
import JobdeskChecklist from './JobdeskChecklist';
import DataAnalysisView from './DataAnalysisView';
import DataCenter from './DataCenter';
import MutationLogs from './MutationLogs';
import BillsManager from './BillsManager';
import ContractGenerator from './ContractGenerator';
import CookBookManager from './CookBookManager';
import PriceAlertsView from './PriceAlertsView';
import { PageId, ExpenseRecord, BillRecord } from '../types';

interface Props {
  currentPage: PageId;
  state: any; 
  handleNavigate: (p: PageId) => void;
}

const PageRouter: React.FC<Props> = ({ currentPage, state, handleNavigate }) => {
  const {
    userRole, incomes, expenses, setIncomes, setExpenses, transfers, setTransfers,
    wallets, setWallets, categories, setCategories, bills, setBills, employees, setEmployees,
    leaves, setLeaves, schedules, setSchedules, inventoryItems, setInventoryItems,
    maintenance, setMaintenance, checklist, setChecklist, suppliers, setSuppliers,
    recipes, setRecipes, articles, setArticles, processedMaterials, setProcessedMaterials,
    reservations, setReservations, tasks, setTasks, meetings, setMeetings,
    contracts, setContracts, units, setUnits, articleCategories, setArticleCategories,
    checklistCategories, setChecklistCategories, mutationReasons, setMutationReasons,
    menuPackages, setMenuPackages, additionalCharges, setAdditionalCharges,
    areas, setAreas, reservationCategories, setReservationCategories,
    serviceTypes, setServiceTypes, reservationPaymentConfig, setReservationPaymentConfig,
    hppSubCategories, setHppSubCategories, globalEnergyStandard, setGlobalEnergyStandard,
    globalTargetFC, setGlobalTargetFC, payrollSystemSettings, setPayrollSystemSettings,
    businessInfo, setBusinessInfo, globalMonth, globalYear, viewMode, syncStatus, setSyncStatus, dbCategory, setDbCategory,
    fullStateObject, handleRestoreState, inventoryLogs
  } = state;

  const currentMonthIncomes = incomes.filter((i: any) => { const d = new Date(i.date); return d.getMonth() === globalMonth && d.getFullYear() === globalYear; });
  const currentMonthExpenses = expenses.filter((e: any) => { const d = new Date(e.date); return d.getMonth() === globalMonth && d.getFullYear() === globalYear; });

  switch (currentPage) {
    case 'dashboard':
      return <Dashboard incomes={currentMonthIncomes} expenses={currentMonthExpenses} allIncomes={incomes} allExpenses={expenses} setIncomes={setIncomes} setExpenses={setExpenses} transfers={transfers} wallets={wallets} categories={categories} userRole={userRole} onNavigate={handleNavigate} globalMonth={globalMonth} globalYear={globalYear} businessInfo={businessInfo} schedules={schedules} employees={employees} leaves={leaves} inventoryItems={inventoryItems} maintenance={maintenance} checklist={checklist} reservations={reservations} bills={bills} currentTasks={tasks.filter((t: any) => t.month === globalMonth && t.year === globalYear)} newTaskText="" setNewTaskText={()=>{}} onAddTask={()=>{}} onToggleTask={()=>{}} onDeleteTask={()=>{}} aiInsights={[]} loadingAI={false} viewMode={viewMode} setViewMode={()=>{}} />;
    case 'penjualan':
      return <TransactionForms type="income" onSubmit={async(d)=>{setIncomes((p: any)=>[...p,d]);return true;}} wallets={wallets} userRole={userRole} articles={articles} expenses={expenses} />;
    case 'pengeluaran':
      return <TransactionForms type="expense" onSubmit={async(d)=>{setExpenses((p: any)=>[...p,d]);return true;}} wallets={wallets} categories={categories.map((c: any)=>c.name)} userRole={userRole} articles={articles} expenses={expenses} />;
    case 'tagihan-baru':
      return <TransactionForms type="bill" onSubmit={async(d)=>{setBills((p: any)=>[...p,d]);return true;}} wallets={wallets} categories={categories.map((c: any)=>c.name)} suppliers={suppliers} userRole={userRole} articles={articles} expenses={expenses} />;
    case 'income':
      return <DatabaseView pageId="income" category={null} incomes={incomes} expenses={expenses} setIncomes={setIncomes} setExpenses={setExpenses} businessInfo={businessInfo} userRole={userRole} wallets={wallets} globalMonth={globalMonth} globalYear={globalYear} viewMode={viewMode} />;
    case 'expense':
      return <DatabaseView pageId="expense" category={null} incomes={incomes} expenses={expenses} setIncomes={setIncomes} setExpenses={setExpenses} businessInfo={businessInfo} userRole={userRole} wallets={wallets} globalMonth={globalMonth} globalYear={globalYear} viewMode={viewMode} />;
    case 'expense-category':
      return <DatabaseView pageId="expense-category" category={dbCategory} setCategory={setDbCategory} incomes={incomes} expenses={expenses} setIncomes={setIncomes} setExpenses={setExpenses} businessInfo={businessInfo} userRole={userRole} wallets={wallets} globalMonth={globalMonth} globalYear={globalYear} viewMode={viewMode} />;
    case 'price-alerts':
      return <PriceAlertsView articles={articles} expenses={expenses} recipes={recipes} onNavigate={handleNavigate} />;
    case 'tagihan':
      return <BillsManager 
        bills={bills} 
        setBills={setBills} 
        onPay={(bill, wallet) => { 
          // Group items by category to create consolidated expense records per category
          const categoryGroups: Record<string, { amount: number, items: string[] }> = {};
          
          bill.items.forEach(item => {
            const cat = item.category || 'Lain-lain';
            if (!categoryGroups[cat]) {
              categoryGroups[cat] = { amount: 0, items: [] };
            }
            categoryGroups[cat].amount += item.amount;
            categoryGroups[cat].items.push(item.description);
          });

          const newExpenses: ExpenseRecord[] = Object.entries(categoryGroups).map(([cat, data], idx) => ({
            id: `pay-${bill.id}-${idx}-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            notes: `PELUNASAN [${cat}]: ${bill.title} (${data.items.join(', ')})`,
            qty: 1,
            amount: data.amount,
            wallet,
            category: cat,
            timestamp: new Date().toISOString(),
            createdBy: userRole!
          }));

          setExpenses((prev: any) => [...prev, ...newExpenses]); 
          setBills(bills.map((b: BillRecord) => b.id === bill.id ? {...b, status: 'PAID'} : b)); 
        }} 
        wallets={wallets} 
        userRole={userRole!} 
        suppliers={suppliers} 
        categories={categories} 
        onNavigate={handleNavigate} 
        globalMonth={globalMonth} 
        globalYear={globalYear} 
        viewMode={viewMode} 
      />;
    case 'adj-finance':
      return <WalletManager wallets={wallets} setWallets={setWallets} transfers={transfers} setTransfers={setTransfers} incomes={incomes} setIncomes={setIncomes} expenses={expenses} setExpenses={setExpenses} globalMonth={globalMonth} globalYear={globalYear} viewMode={viewMode} />;
    case 'mutation-logs':
      return <MutationLogs transfers={transfers} setTransfers={setTransfers} wallets={wallets} userRole={userRole!} />;
    case 'kategori':
      return <CategoryManager categories={categories} setCategories={setCategories} suppliers={suppliers} setSuppliers={setSuppliers} />;
    case 'reservasi':
      return <ReservasiPage reservations={reservations} setReservations={setReservations} areas={areas} setAreas={setAreas} reservationCategories={reservationCategories} setReservationCategories={setReservationCategories} serviceTypes={serviceTypes} setServiceTypes={setServiceTypes} recipes={recipes} menuPackages={menuPackages} setMenuPackages={setMenuPackages} additionalCharges={additionalCharges} setAdditionalCharges={setAdditionalCharges} paymentConfig={reservationPaymentConfig} setPaymentConfig={setReservationPaymentConfig} />;
    case 'laba-rugi':
      return <Reports pageId="laba-rugi" incomes={currentMonthIncomes} expenses={currentMonthExpenses} wallets={wallets} businessInfo={businessInfo} categories={categories} globalMonth={globalMonth} globalYear={globalYear} viewMode={viewMode} onNavigate={handleNavigate} />;
    case 'alokasi':
      return <Reports pageId="alokasi" incomes={currentMonthIncomes} expenses={currentMonthExpenses} wallets={wallets} businessInfo={businessInfo} categories={categories} globalMonth={globalMonth} globalYear={globalYear} viewMode={viewMode} onNavigate={handleNavigate} setDbCategory={setDbCategory} />;
    case 'generate':
      return <Reports pageId="generate" incomes={currentMonthIncomes} expenses={currentMonthExpenses} allIncomes={incomes} allExpenses={expenses} transfers={transfers} wallets={wallets} businessInfo={businessInfo} categories={categories} globalMonth={globalMonth} globalYear={globalYear} viewMode={viewMode} />;
    case 'op-checklist':
      return <OpChecklistManager checklist={checklist} setChecklist={setChecklist} employees={employees} userRole={userRole!} categories={checklistCategories} setCategories={setChecklistCategories} />;
    case 'op-maintenance':
      return <OpMaintenanceManager maintenance={maintenance} setMaintenance={setMaintenance} employees={employees} inventoryItems={inventoryItems} />;
    case 'op-schedule':
      return <ScheduleManager employees={employees} schedules={schedules} setSchedules={setSchedules} globalMonth={globalMonth} globalYear={globalYear} leaves={leaves} />;
    case 'inv-stocks':
      return <StockAuditManager articles={articles} setArticles={setArticles} globalMonth={globalMonth} globalYear={globalYear} mutationReasons={mutationReasons} setMutationReasons={setMutationReasons} />;
    case 'inv-assets':
      return <AssetInventoryManager inventoryItems={inventoryItems} setInventoryItems={setInventoryItems} />;
    case 'hrd-employees':
      return <EmployeeManager employees={employees} setEmployees={setEmployees} />;
    case 'hrd-payroll':
      return userRole === 'SUPERVISOR' ? (
        <SupervisorPayrollManager employees={employees} incomes={incomes} expenses={expenses} onAddExpense={(e)=>setExpenses((prev: any) => [...prev, e])} userRole={userRole} selectedMonth={globalMonth} selectedYear={globalYear} />
      ) : (
        <AdminPayrollManager employees={employees} wallets={wallets} incomes={incomes} expenses={expenses} leaves={leaves} onAddExpense={(e)=>setExpenses((prev: any) => [...prev, e])} userRole={userRole!} selectedMonth={globalMonth} selectedYear={globalYear} payrollSystemSettings={payrollSystemSettings} setPayrollSystemSettings={setPayrollSystemSettings} />
      );
    case 'hrd-slips':
      return <PayrollSlips expenses={expenses} employees={employees} selectedMonth={globalMonth} selectedYear={globalYear} userRole={userRole!} />;
    case 'hrd-leaves':
      return <LeaveManager employees={employees} setEmployees={setEmployees} leaves={leaves} setLeaves={setLeaves} schedules={schedules} setSchedules={setSchedules} />;
    case 'hrd-contracts':
      return <ContractGenerator employees={employees} contracts={contracts} setContracts={setContracts} businessInfo={businessInfo} />;
    case 'hpp-summary':
      return <HppSummary recipes={recipes} articles={articles} expenses={expenses} hppSubCategories={hppSubCategories} />;
    case 'articles':
      return <ArticleManager 
        articles={articles} 
        setArticles={setArticles} 
        units={units} 
        setUnits={setUnits} 
        categories={articleCategories} 
        setCategories={setArticleCategories}
        recipes={recipes}
        setRecipes={setRecipes}
        processedMaterials={processedMaterials}
        setProcessedMaterials={setProcessedMaterials}
      />;
    case 'hpp-processed-materials':
      return <ProcessedMaterialManager articles={articles} processedMaterials={processedMaterials} setProcessedMaterials={setProcessedMaterials} recipes={recipes} setRecipes={setRecipes} />;
    case 'hpp-process':
      return <HppProcessManager recipes={recipes} setRecipes={setRecipes} articles={articles} processedMaterials={processedMaterials} hppSubCategories={hppSubCategories} setHppSubCategories={setHppSubCategories} globalEnergyStandard={globalEnergyStandard} setGlobalEnergyStandard={setGlobalEnergyStandard} globalTargetFC={globalTargetFC} setGlobalTargetFC={setGlobalTargetFC} />;
    case 'jobdesk-checklist':
      return <JobdeskChecklist userRole={userRole!} selectedMonth={globalMonth} selectedYear={globalYear} tasks={tasks} setTasks={setTasks} meetings={meetings} setMeetings={setMeetings} employees={employees} />;
    case 'data-analisis':
      return <DataAnalysisView incomes={incomes} expenses={expenses} employees={employees} leaves={leaves} inventoryItems={inventoryItems} maintenance={maintenance} checklist={checklist} recipes={recipes} articles={articles} reservations={reservations} tasks={tasks} periodLabel={`${globalMonth} ${globalYear}`} businessInfo={businessInfo} viewMode={viewMode} globalMonth={globalMonth} globalYear={globalYear} />;
    case 'data-center':
      return <DataCenter incomes={incomes} expenses={expenses} employees={employees} inventoryItems={inventoryItems} inventoryLogs={inventoryLogs} articles={articles} recipes={recipes} reservations={reservations} bills={bills} wallets={wallets} userRole={userRole!} businessInfo={businessInfo} allData={fullStateObject} globalMonth={globalMonth} globalYear={globalYear} viewMode={viewMode} syncStatus={syncStatus} />;
    case 'settings':
      return <SettingsView businessInfo={businessInfo} setBusinessInfo={setBusinessInfo} userRole={userRole!} allData={fullStateObject} onRestore={handleRestoreState} />;
    case 'hpp-cookbook':
      return <CookBookManager recipes={recipes} setRecipes={setRecipes} processedMaterials={processedMaterials} />;
    default:
      return <div>Halaman tidak ditemukan</div>;
  }
};

export default PageRouter;
