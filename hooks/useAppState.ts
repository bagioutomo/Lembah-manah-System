
import { useState, useEffect, useMemo, useRef } from 'react';
import { storage } from '../services/storageService';
import { validateApiKey } from '../services/geminiService';
import * as XLSX from 'xlsx';
import { 
  PageId, IncomeRecord, ExpenseRecord, TransferRecord, 
  BillRecord, UserRole, BusinessInfo, CategoryConfig, 
  Employee, LeaveRecord, ScheduleRecord, InventoryItem, 
  MaintenanceTask, OperationalChecklistItem, Recipe, 
  Article, DashboardTask, MeetingMinute, Supplier, Reservation, WorkContract,
  MenuPackage, AdditionalCharge, ReservationPaymentConfig, ProcessedMaterial,
  PayrollSystemSettings
} from '../types';
import { DEFAULT_WALLETS, DEFAULT_CATEGORIES, HPP_SUB_CATEGORIES as DEFAULT_HPP_SUBS } from '../constants';

export type SyncStatus = 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR';

export const useAppState = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    const role = storage.getUserRole();
    if (!role || (role as any) === "null") return null;
    return role;
  });

  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [theme, setTheme] = useState(storage.getTheme());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [authTarget, setAuthTarget] = useState<UserRole | null>(null);
  const [passAttempt, setPassAttempt] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [syncStatus, setSyncStatus] = useState({
    supabase: 'IDLE' as SyncStatus,
    google: 'IDLE' as SyncStatus,
    mysql: 'IDLE' as SyncStatus,
    firebase: 'IDLE' as SyncStatus,
    gemini: 'IDLE' as SyncStatus,
    excel: 'IDLE' as SyncStatus 
  });
  
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(storage.getBusinessInfo());
  const [globalMonth, setGlobalMonth] = useState(new Date().getMonth());
  const [globalYear, setGlobalYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'BULANAN' | 'TAHUNAN'>('BULANAN');
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [dbCategory, setDbCategory] = useState<string | null>(null);

  // States Data Utama
  const [incomes, setIncomes] = useState<IncomeRecord[]>(storage.getIncomes());
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(storage.getExpenses());
  const [transfers, setTransfers] = useState<TransferRecord[]>(storage.getTransfers());
  const [wallets, setWallets] = useState<string[]>(DEFAULT_WALLETS);
  const [categories, setCategories] = useState<CategoryConfig[]>(DEFAULT_CATEGORIES);
  const [bills, setBills] = useState<BillRecord[]>(storage.getBills());
  const [employees, setEmployees] = useState<Employee[]>(storage.getEmployees());
  const [leaves, setLeaves] = useState<LeaveRecord[]>(storage.getLeaves());
  const [schedules, setSchedules] = useState<ScheduleRecord[]>(storage.getSchedules());
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(storage.getInventoryItems());
  const [maintenance, setMaintenance] = useState<MaintenanceTask[]>([]);
  const [checklist, setChecklist] = useState<OperationalChecklistItem[]>(storage.getChecklist());
  const [suppliers, setSuppliers] = useState<Supplier[]>(storage.getSuppliers());
  const [recipes, setRecipes] = useState<Recipe[]>(storage.getRecipes());
  const [articles, setArticles] = useState<Article[]>(storage.getArticles());
  const [processedMaterials, setProcessedMaterials] = useState<ProcessedMaterial[]>(storage.getProcessedMaterials());
  const [reservations, setReservations] = useState<Reservation[]>(storage.getReservations());
  const [tasks, setTasks] = useState<DashboardTask[]>(storage.getTasks());
  const [meetings, setMeetings] = useState<MeetingMinute[]>(storage.getMeetings());
  const [contracts, setContracts] = useState<WorkContract[]>(storage.getContracts());
  const [units, setUnits] = useState<string[]>(storage.getUnits());
  
  const [articleCategories, setArticleCategories] = useState<string[]>(['BAHAN BAKU', 'PACKAGING', 'LAIN-LAIN']);
  const [checklistCategories, setChecklistCategories] = useState<string[]>(['OPERASIONAL', 'KEBERSIHAN']);
  const [mutationReasons, setMutationReasons] = useState<string[]>(['BAR', 'KITCHEN', 'RUSAK', 'STOK OPNAME']);
  
  const [menuPackages, setMenuPackages] = useState<MenuPackage[]>(storage.getMenuPackages());
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>(storage.getAdditionalCharges());
  const [areas, setAreas] = useState<string[]>(['INDOOR', 'OUTDOOR', 'VIP']);
  const [reservationCategories, setReservationCategories] = useState<string[]>(['MAKAN SIANG', 'MAKAN MALAM', 'MEETING', 'ULANG TAHUN', 'WEDDING']);
  const [serviceTypes, setServiceTypes] = useState<string[]>(['BUFFET', 'ALA CARTE', 'ALA CARTE PER PAX']);
  const [reservationPaymentConfig, setReservationPaymentConfig] = useState<ReservationPaymentConfig>({
    bankName: 'BRI', accountNumber: '0123-4567-8901', accountHolder: 'LEMBAH MANAH KOPI'
  });

  const [hppSubCategories, setHppSubCategories] = useState(DEFAULT_HPP_SUBS);
  const [globalEnergyStandard, setGlobalEnergyStandard] = useState(storage.getGlobalEnergy());
  const [globalTargetFC, setGlobalTargetFC] = useState(storage.getGlobalTargetFC());
  const [payrollSystemSettings, setPayrollSystemSettings] = useState<PayrollSystemSettings>({
    otRateManagement: 7500, otRateStaff: 5000, standardWorkDays: 26,
    bonusTiers: [{ revenue: 200000000, bonus: 250000 }, { revenue: 300000000, bonus: 500000 }],
    bonusMultipliers: { management: 2.0, staff: 1.0, dw: 0.5 },
    managementKeywords: "admin, manager, supervisor, spv, purchasing",
    staffKeywords: "barista, waiter, cook, server, floor, cashier, runner",
    dwKeywords: "dw, daily worker, probation, trainee",
    scEligibleKeywords: "barista, waiter, cook, server, floor, cashier, admin, purchasing",
    bonusEligibleKeywords: "barista, waiter, cook, server, floor, cashier"
  });

  const fullStateObject = useMemo(() => ({ 
    incomes, expenses, transfers, wallets, categories, bills, employees, 
    leaves, schedules, inventoryItems, maintenance, checklist, suppliers, 
    recipes, articles, processedMaterials, reservations, tasks, meetings, contracts,
    menuPackages, additionalCharges, units, hppSubCategories, articleCategories,
    checklistCategories, mutationReasons,
    globalEnergyStandard, globalTargetFC, payrollSystemSettings, businessInfo,
    areas, reservationCategories, serviceTypes, reservationPaymentConfig
  }), [incomes, expenses, transfers, wallets, categories, bills, employees, leaves, schedules, inventoryItems, maintenance, checklist, suppliers, recipes, articles, processedMaterials, reservations, tasks, meetings, contracts, menuPackages, additionalCharges, units, hppSubCategories, articleCategories, checklistCategories, mutationReasons, globalEnergyStandard, globalTargetFC, payrollSystemSettings, businessInfo, areas, reservationCategories, serviceTypes, reservationPaymentConfig]);

  // AUTO BACKUP EXCEL LOGIC (GLOBAL)
  const hasTriggeredExcelBackup = useRef(false);
  useEffect(() => {
    const runGlobalExcelBackup = async () => {
      if (!isDataLoaded || hasTriggeredExcelBackup.current) return;
      
      const config = storage.getBusinessInfo();
      const url = config.gdriveExcelUrl || config.gdriveSheetUrl;
      if (!url || !url.includes("/exec")) return;

      const todayDate = new Date().toISOString().split('T')[0];
      const lastBackupDate = storage.getLastExcelDriveDate();
      
      if (!lastBackupDate || !lastBackupDate.startsWith(todayDate)) {
        hasTriggeredExcelBackup.current = true;
        setSyncStatus(prev => ({ ...prev, excel: 'SYNCING' }));
        
        try {
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incomes), 'PEMASUKAN');
          XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenses), 'PENGELUARAN');
          XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(inventoryItems), 'INVENTARIS');
          
          const base64Excel = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
          const success = await storage.uploadExcelToDrive(base64Excel, `AUTO_LMK_${todayDate}.xlsx`);
          
          if (success) {
            setSyncStatus(prev => ({ ...prev, excel: 'SUCCESS' }));
            setTimeout(() => setSyncStatus(prev => ({ ...prev, excel: 'IDLE' })), 10000);
          } else {
            setSyncStatus(prev => ({ ...prev, excel: 'ERROR' }));
          }
        } catch (e) {
          setSyncStatus(prev => ({ ...prev, excel: 'ERROR' }));
        }
      }
    };
    
    runGlobalExcelBackup();
  }, [isDataLoaded, incomes, expenses, inventoryItems]);

  // Database Mirroring Sync
  useEffect(() => {
    if (!isDataLoaded) return;
    const syncTimer = setTimeout(async () => {
      const isSupabaseReady = storage.isConfigValid('SUPABASE');
      const isFirebaseReady = storage.isConfigValid('FIREBASE');
      const isMysqlReady = storage.isConfigValid('MYSQL');
      const isGoogleReady = storage.isConfigValid('GOOGLE_1');
      const isGoogleJsonReady = storage.isConfigValid('GOOGLE_2');

      setSyncStatus(prev => ({ 
        ...prev, 
        supabase: isSupabaseReady ? 'SYNCING' : 'IDLE', 
        firebase: isFirebaseReady ? 'SYNCING' : 'IDLE', 
        mysql: isMysqlReady ? 'SYNCING' : 'IDLE', 
        google: (isGoogleReady || isGoogleJsonReady) ? 'SYNCING' : 'IDLE' 
      }));

      // Kirim ke Google Sheet dlu karena sering memakan waktu lama
      const gRes = isGoogleReady ? await storage.syncToGoogleSheet(fullStateObject) : null;
      const gJsonRes = isGoogleJsonReady ? await storage.syncToGoogleDriveJson(fullStateObject) : null;
      
      const syncPromises = [ 
        isSupabaseReady ? storage.syncToSupabase(fullStateObject) : Promise.resolve(null), 
        isFirebaseReady ? storage.syncToFirebase(fullStateObject) : Promise.resolve(null), 
        isMysqlReady ? storage.syncToMysql(fullStateObject) : Promise.resolve(null)
      ];

      const [supaRes, fireRes, mysqlRes] = await Promise.all(syncPromises);

      // Logika status khusus untuk Google (Mirror 1 & 2)
      let googleStatus: SyncStatus = 'IDLE';
      if (isGoogleReady || isGoogleJsonReady) {
        if (gRes === false || gJsonRes === false) googleStatus = 'ERROR';
        else googleStatus = 'SUCCESS';
      }

      setSyncStatus(prev => ({ 
        ...prev, 
        supabase: supaRes === null ? 'IDLE' : (supaRes ? 'SUCCESS' : 'ERROR'), 
        firebase: fireRes === null ? 'IDLE' : (fireRes ? 'SUCCESS' : 'ERROR'), 
        mysql: mysqlRes === null ? 'IDLE' : (mysqlRes ? 'SUCCESS' : 'ERROR'), 
        google: googleStatus
      }));

      setTimeout(() => {
        setSyncStatus(prev => ({ 
          ...prev, 
          supabase: prev.supabase === 'SUCCESS' ? 'IDLE' : prev.supabase, 
          firebase: prev.firebase === 'SUCCESS' ? 'IDLE' : prev.firebase, 
          mysql: prev.mysql === 'SUCCESS' ? 'IDLE' : prev.mysql, 
          google: prev.google === 'SUCCESS' ? 'IDLE' : prev.google 
        }));
      }, 10000); 

    }, 2000); 
    return () => clearTimeout(syncTimer);
  }, [fullStateObject, isDataLoaded]);

  // Local Storage Persistence
  useEffect(() => { storage.setSuppliers(suppliers); }, [suppliers]);
  useEffect(() => { storage.setArticles(articles); }, [articles]);
  useEffect(() => { storage.setRecipes(recipes); }, [recipes]);
  useEffect(() => { storage.setProcessedMaterials(processedMaterials); }, [processedMaterials]);
  useEffect(() => { storage.setIncomes(incomes); }, [incomes]);
  useEffect(() => { storage.setExpenses(expenses); }, [expenses]);
  useEffect(() => { storage.setTransfers(transfers); }, [transfers]);
  useEffect(() => { storage.setBills(bills); }, [bills]);
  useEffect(() => { storage.setEmployees(employees); }, [employees]);
  useEffect(() => { storage.setInventoryItems(inventoryItems); }, [inventoryItems]);
  useEffect(() => { storage.setReservations(reservations); }, [reservations]);
  useEffect(() => { storage.setSchedules(schedules); }, [schedules]);
  useEffect(() => { storage.setLeaves(leaves); }, [leaves]);
  useEffect(() => { storage.setChecklist(checklist); }, [checklist]);
  useEffect(() => { storage.setTasks(tasks); }, [tasks]);
  useEffect(() => { storage.setMeetings(meetings); }, [meetings]);
  useEffect(() => { storage.setContracts(contracts); }, [contracts]);
  useEffect(() => { storage.setMenuPackages(menuPackages); }, [menuPackages]);
  useEffect(() => { storage.setAdditionalCharges(additionalCharges); }, [additionalCharges]);
  useEffect(() => { storage.setGlobalEnergy(globalEnergyStandard); }, [globalEnergyStandard]);
  useEffect(() => { storage.setGlobalTargetFC(globalTargetFC); }, [globalTargetFC]);

  const handleRestoreState = (data: any) => {
    if (!data) return;
    if (data.incomes) setIncomes(data.incomes);
    if (data.expenses) setExpenses(data.expenses);
    if (data.transfers) setTransfers(data.transfers);
    if (data.wallets) setWallets(data.wallets);
    if (data.categories) setCategories(data.categories);
    if (data.bills) setBills(data.bills);
    if (data.employees) setEmployees(data.employees);
    if (data.leaves) setLeaves(data.leaves);
    if (data.schedules) setSchedules(data.schedules);
    if (data.inventoryItems) setInventoryItems(data.inventoryItems);
    if (data.maintenance) setMaintenance(data.maintenance);
    if (data.checklist) setChecklist(data.checklist);
    if (data.suppliers) setSuppliers(data.suppliers);
    if (data.recipes) setRecipes(data.recipes);
    if (data.articles) setArticles(data.articles);
    if (data.processedMaterials) setProcessedMaterials(data.processedMaterials);
    if (data.reservations) setReservations(data.reservations);
    if (data.tasks) setTasks(data.tasks);
    if (data.meetings) setMeetings(data.meetings);
    if (data.contracts) setContracts(data.contracts);
    if (data.units) setUnits(data.units);
    if (data.articleCategories) setArticleCategories(data.articleCategories);
    if (data.checklistCategories) setChecklistCategories(data.checklistCategories);
    if (data.mutationReasons) setMutationReasons(data.mutationReasons);
    if (data.areas) setAreas(data.areas);
    if (data.reservationCategories) setReservationCategories(data.reservationCategories);
    if (data.serviceTypes) setServiceTypes(data.serviceTypes);
    if (data.reservationPaymentConfig) setReservationPaymentConfig(data.reservationPaymentConfig);
    if (data.menuPackages) setMenuPackages(data.menuPackages);
    if (data.additionalCharges) setAdditionalCharges(data.additionalCharges);
    if (data.payrollSystemSettings) setPayrollSystemSettings(data.payrollSystemSettings);
    if (data.globalEnergyStandard) setGlobalEnergyStandard(data.globalEnergyStandard);
    if (data.globalTargetFC) setGlobalTargetFC(data.globalTargetFC);
    if (data.hppSubCategories) setHppSubCategories(data.hppSubCategories);

    if (data.businessInfo) {
      const localInfo = storage.getBusinessInfo();
      const mergedInfo = { ...localInfo, ...data.businessInfo };
      setBusinessInfo(mergedInfo);
      storage.setBusinessInfo(mergedInfo);
    }
  };

  useEffect(() => {
    if (!userRole) {
      setIsDataLoaded(false);
      return;
    }

    if (isDataLoaded) return;

    const hydrate = async () => {
      setSyncStatus(prev => ({ ...prev, supabase: 'SYNCING' }));
      try {
        validateApiKey().then(isValid => { setSyncStatus(prev => ({ ...prev, gemini: isValid ? 'SUCCESS' : 'ERROR' })); });
        const recoveredData = await storage.smartHydrate();
        if (recoveredData) {
          handleRestoreState(recoveredData);
          setSyncStatus(prev => ({ ...prev, supabase: 'SUCCESS', google: 'SUCCESS' }));
          setTimeout(() => setSyncStatus(prev => ({ ...prev, supabase: 'IDLE', google: 'IDLE' })), 3000);
        }
        setIsDataLoaded(true);
      } catch (e) { 
        console.error("Hydration error", e);
        setSyncStatus(prev => ({ ...prev, supabase: 'ERROR' })); 
        setIsDataLoaded(true); 
      }
    };
    hydrate();
  }, [userRole, isDataLoaded]);

  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]);

  return {
    userRole, setUserRole, currentPage, setCurrentPage, theme, setTheme,
    isSidebarOpen, setIsSidebarOpen, showUserModal, setShowUserModal,
    authTarget, setAuthTarget, passAttempt, setPassAttempt, isDataLoaded,
    syncStatus, setSyncStatus, businessInfo, setBusinessInfo,
    globalMonth, setGlobalMonth, globalYear, setGlobalYear,
    viewMode, setViewMode, expandedMenus, setExpandedMenus,
    dbCategory, setDbCategory, incomes, setIncomes, expenses, setExpenses,
    transfers, setTransfers, wallets, setWallets, categories, setCategories,
    bills, setBills, employees, setEmployees, leaves, setLeaves,
    schedules, setSchedules, inventoryItems, setInventoryItems,
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
    fullStateObject, handleRestoreState
  };
};
