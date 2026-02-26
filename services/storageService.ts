
import { 
  BusinessInfo, UserRole, CloudProvider, ExpenseRecord, Article, 
  ShiftConfig, ScheduleRecord, InventoryLog, InventoryCategoryConfig, 
  ProcessedMaterial, Recipe, ContractTemplate, Supplier, IncomeRecord,
  TransferRecord, BillRecord, Employee, InventoryItem, Reservation,
  LeaveRecord, OperationalChecklistItem, DashboardTask, MeetingMinute,
  WorkContract, MenuPackage, AdditionalCharge
} from '../types';

const ENV_SUPABASE_URL = (typeof process !== 'undefined' && process.env?.SUPABASE_URL) || "";
const ENV_SUPABASE_KEY = (typeof process !== 'undefined' && process.env?.SUPABASE_KEY) || "";
const ENV_FIREBASE_URL = (typeof process !== 'undefined' && process.env?.FIREBASE_URL) || "";
const ENV_MYSQL_API_URL = (typeof process !== 'undefined' && process.env?.MYSQL_API_URL) || "";
const ENV_GDRIVE_SHEET_URL = (typeof process !== 'undefined' && process.env?.GDRIVE_SHEET_URL) || "";
const ENV_GDRIVE_JSON_URL = (typeof process !== 'undefined' && process.env?.GDRIVE_JSON_URL) || "";
const ENV_GDRIVE_EXCEL_URL = (typeof process !== 'undefined' && process.env?.GDRIVE_EXCEL_URL) || "";

const KEYS = {
  THEME: 'cafe-theme-v2',
  ROLE: 'cafe-user-role-session-v2',
  PASSWORDS: 'cafe-role-passwords-v2',
  BUSINESS: 'cafe-business-info-v2',
  UNITS: 'cafe-units-v2',
  LAST_SYNC: 'cafe-last-sync-timestamp',
  LAST_EXCEL_DATE: 'cafe-last-excel-date',
  SHIFT_CONFIG: 'cafe-shift-config-v2',
  SCHEDULES: 'cafe-schedules-v2',
  INVENTORY_LOGS: 'cafe-inventory-logs-v2',
  INVENTORY_CATEGORIES: 'cafe-inventory-categories-v2',
  PROCESSED_MATERIALS: 'cafe-processed-materials-v2',
  EXPENSES: 'cafe-expenses-v2',
  HPP_SUB_CATEGORIES: 'cafe-hpp-sub-categories-v2',
  ARTICLES: 'cafe-articles-v2',
  RECIPES: 'cafe-recipes-v2',
  CONTRACT_TEMPLATE: 'cafe-contract-template-v2',
  SUPPLIERS: 'cafe-suppliers-v2',
  INCOMES: 'cafe-incomes-v2',
  TRANSFERS: 'cafe-transfers-v2',
  BILLS: 'cafe-bills-v2',
  EMPLOYEES: 'cafe-employees-v2',
  INVENTORY_ITEMS: 'cafe-inventory-items-v2',
  RESERVATIONS: 'cafe-reservations-v2',
  LEAVES: 'cafe-leaves-v2',
  CHECKLIST: 'cafe-checklist-v2',
  TASKS: 'cafe-tasks-v2',
  MEETINGS: 'cafe-meetings-v2',
  CONTRACTS: 'cafe-contracts-v2',
  MENU_PACKAGES: 'cafe-menu-packages-v2',
  ADDITIONAL_CHARGES: 'cafe-additional-charges-v2',
  GLOBAL_ENERGY: 'cafe-global-energy-v2',
  GLOBAL_TARGET_FC: 'cafe-global-target-fc-v2'
};

const getSanitizedFirebaseUrl = (rawUrl: string) => {
  if (!rawUrl) return "";
  let url = rawUrl.trim();
  url = url.replace(/["']/g, "").replace(/\/+$/, "");
  if (url && !url.startsWith("http")) url = "https://" + url;
  if (url && !url.endsWith(".json")) url = url + "/database_lmk.json";
  return url;
};

const safeGet = (key: string) => {
  try { return localStorage.getItem(key); } catch (e) { return null; }
};
const safeSet = (key: string, val: string) => {
  try { localStorage.setItem(key, val); } catch (e) { console.error("Storage write error", e); }
};
const safeRemove = (key: string) => {
  try { localStorage.removeItem(key); } catch (e) { }
};

const sessionGet = (key: string) => {
  try { return sessionStorage.getItem(key); } catch (e) { return null; }
};
const sessionSet = (key: string, val: string) => {
  try { sessionStorage.setItem(key, val); } catch (e) { }
};
const sessionRemove = (key: string) => {
  try { sessionStorage.removeItem(key); } catch (e) { }
};

export const storage = {
  getTheme: () => safeGet(KEYS.THEME) || 'light',
  setTheme: (d: string) => safeSet(KEYS.THEME, d),
  
  getUserRole: () => (sessionGet(KEYS.ROLE) as UserRole) || null,
  setUserRole: (d: UserRole | null) => d ? sessionSet(KEYS.ROLE, d) : sessionRemove(KEYS.ROLE),
  
  getRolePasswords: () => {
    const saved = safeGet(KEYS.PASSWORDS);
    if (saved) try { return JSON.parse(saved); } catch(e) { }
    return { OWNER: '12345', ADMIN: 'admin123', PURCHASING: 'buy123', SUPERVISOR: 'super123', MANAGER: 'manager123' };
  },
  setRolePasswords: (d: any) => safeSet(KEYS.PASSWORDS, JSON.stringify(d)),

  getBusinessInfo: (): BusinessInfo => {
    const saved = safeGet(KEYS.BUSINESS);
    let info: BusinessInfo = { 
      name: 'Lembah Manah Kopi', 
      cloudApiUrl: ENV_SUPABASE_URL, 
      cloudApiKey: ENV_SUPABASE_KEY, 
      firebaseUrl: ENV_FIREBASE_URL,
      mysqlApiUrl: ENV_MYSQL_API_URL,
      gdriveSheetUrl: ENV_GDRIVE_SHEET_URL,
      gdriveJsonUrl: ENV_GDRIVE_JSON_URL,
      gdriveExcelUrl: ENV_GDRIVE_EXCEL_URL,
      activeProvider: 'SUPABASE' as CloudProvider, 
      logoUrl: './logo_laporan.png', 
      sidebarLogoUrl: './logo_sidebar.png' 
    };
    if (saved) { 
      try { 
        const parsed = JSON.parse(saved); 
        return { ...info, ...parsed }; 
      } catch(e) { } 
    }
    return info;
  },
  setBusinessInfo: (d: any) => safeSet(KEYS.BUSINESS, JSON.stringify(d)),

  isConfigValid: (provider: 'SUPABASE' | 'FIREBASE' | 'MYSQL' | 'GOOGLE_1' | 'GOOGLE_2' | 'GOOGLE_3') => {
    const config = storage.getBusinessInfo();
    switch(provider) {
      case 'SUPABASE': return !!(config.cloudApiUrl && config.cloudApiUrl.length > 10 && config.cloudApiUrl.includes("supabase.co"));
      case 'FIREBASE': return !!(config.firebaseUrl && config.firebaseUrl.length > 10 && !config.firebaseUrl.includes("ISI_URL"));
      case 'GOOGLE_1': return !!(config.gdriveSheetUrl && config.gdriveSheetUrl.includes("/exec"));
      case 'GOOGLE_2': return !!(config.gdriveJsonUrl && config.gdriveJsonUrl.includes("/exec"));
      case 'GOOGLE_3': return !!(config.gdriveExcelUrl && config.gdriveExcelUrl.includes("/exec"));
      case 'MYSQL': return !!(config.mysqlApiUrl && config.mysqlApiUrl.startsWith("http") && !config.mysqlApiUrl.includes("domainanda.com"));
      default: return false;
    }
  },

  syncToSupabase: async (data: any) => {
    const config = storage.getBusinessInfo();
    if (!storage.isConfigValid('SUPABASE')) return false;
    try { 
      const baseUrl = config.cloudApiUrl.trim().replace(/\/+$/, "");
      const now = new Date().toISOString();
      const res = await fetch(`${baseUrl}/rest/v1/app_state`, { 
        method: 'POST', 
        headers: { 'apikey': config.cloudApiKey, 'Authorization': `Bearer ${config.cloudApiKey}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' }, 
        body: JSON.stringify({ id: 'main_state', data: data, updated_at: now }) 
      }); 
      return res.ok; 
    } catch (e) { return false; }
  },

  syncToFirebase: async (fullState: any) => {
    const config = storage.getBusinessInfo();
    if (!storage.isConfigValid('FIREBASE')) return false;
    try { 
      const url = getSanitizedFirebaseUrl(config.firebaseUrl!);
      const now = new Date().toISOString();
      const res = await fetch(url, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ ...fullState, updated_at: now }) 
      }); 
      return res.ok; 
    } catch (e) { return false; }
  },

  syncToGoogleSheet: async (data: any) => {
    const config = storage.getBusinessInfo();
    if (!storage.isConfigValid('GOOGLE_1')) return false;
    try {
      const res = await fetch(config.gdriveSheetUrl!, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'sync', data: data })
      });
      return res.ok;
    } catch (e) { return false; }
  },

  fetchFullState: async (provider: 'SUPABASE' | 'FIREBASE' | 'GDRIVE_JSON' | 'MYSQL') => {
    const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));
    
    const fetchData = async () => {
      try {
        if (provider === 'SUPABASE') {
          const config = storage.getBusinessInfo();
          const baseUrl = config.cloudApiUrl.trim().replace(/\/+$/, "");
          const res = await fetch(`${baseUrl}/rest/v1/app_state?select=data,updated_at&id=eq.main_state`, { headers: { 'apikey': config.cloudApiKey, 'Authorization': `Bearer ${config.cloudApiKey}` } }); 
          if (!res.ok) return null;
          const json = await res.json();
          return json[0] ? { data: json[0].data, updated_at: json[0].updated_at } : null;
        }
        if (provider === 'FIREBASE') {
          const url = getSanitizedFirebaseUrl(storage.getBusinessInfo().firebaseUrl!);
          const res = await fetch(url);
          if (!res.ok) return null;
          const json = await res.json();
          return json ? { data: json, updated_at: json.updated_at || '2000-01-01' } : null;
        }
        if (provider === 'GDRIVE_JSON') {
          const config = storage.getBusinessInfo();
          const res = await fetch(`${config.gdriveJsonUrl}?action=GET_LATEST`);
          if (!res.ok) return null;
          const json = await res.json();
          return json ? { data: json, updated_at: json.updated_at || new Date().toISOString() } : null;
        }
        return null;
      } catch (e) { return null; }
    };

    try {
      return await Promise.race([fetchData(), timeout(10000)]) as any;
    } catch (e) {
      console.warn(`Fetch timeout for ${provider}`);
      return null;
    }
  },

  smartHydrate: async () => {
    const results = await Promise.allSettled([
      storage.fetchFullState('SUPABASE'),
      storage.fetchFullState('FIREBASE'),
      storage.fetchFullState('GDRIVE_JSON')
    ]);

    let latestData: any = null;
    let latestTime = 0;

    results.forEach(res => {
      if (res.status === 'fulfilled' && res.value) {
        const timeStr = res.value.updated_at || '2000-01-01';
        const time = new Date(timeStr).getTime();
        if (time > latestTime) {
          latestTime = time;
          latestData = res.value.data;
        }
      }
    });

    return latestData;
  },

  uploadExcelToDrive: async (base64: string, filename: string) => {
    const config = storage.getBusinessInfo();
    const url = config.gdriveExcelUrl || config.gdriveSheetUrl;
    if (!url || !url.includes("/exec")) return false;
    try {
      const res = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'UPLOAD_EXCEL', data: base64, filename: filename })
      });
      return res.ok;
    } catch (e) { return false; }
  },

  uploadImageToDrive: async (base64: string, filename: string) => {
    const config = storage.getBusinessInfo();
    const url = config.gdriveJsonUrl || config.gdriveSheetUrl;
    if (!url || !url.includes("/exec")) return null;
    try {
      const res = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'UPLOAD_IMAGE', data: base64, filename: filename })
      });
      if (!res.ok) return null;
      const responseText = await res.text();
      try {
         const json = JSON.parse(responseText);
         return json.fileId || null;
      } catch (parseErr) { return null; }
    } catch (e) { return null; }
  },

  fetchFromMySQL: async () => {
    const config = storage.getBusinessInfo();
    if (!storage.isConfigValid('MYSQL')) return null;
    try {
      const res = await fetch(`${config.mysqlApiUrl}?action=GET_LAST_STATE`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.status === 'success' ? json.data : null;
    } catch (e) { return null; }
  },

  fetchFromFirebase: async () => {
    const res = await storage.fetchFullState('FIREBASE');
    return res ? res.data : null;
  },

  getUnits: () => { const saved = safeGet(KEYS.UNITS); if (saved) try { return JSON.parse(saved); } catch(e) {} return ['gr', 'ml', 'pcs', 'zak', 'liter', 'kg', 'cup', 'box']; },
  setUnits: (d: any) => safeSet(KEYS.UNITS, JSON.stringify(d)),
  getSchedules: (): ScheduleRecord[] => { const saved = safeGet(KEYS.SCHEDULES); if (saved) try { return JSON.parse(saved); } catch(e) {} return []; },
  setSchedules: (d: ScheduleRecord[]) => safeSet(KEYS.SCHEDULES, JSON.stringify(d)),
  getArticles: (): Article[] => { const saved = safeGet(KEYS.ARTICLES); if (saved) try { return JSON.parse(saved); } catch(e) {} return []; },
  setArticles: (d: Article[]) => safeSet(KEYS.ARTICLES, JSON.stringify(d)),
  getShiftConfig: (): ShiftConfig => { const saved = safeGet(KEYS.SHIFT_CONFIG); if (saved) try { return JSON.parse(saved); } catch(e) {} return { 'PAGI': { start: '08:00', end: '16:00' }, 'SORE': { start: '15:00', end: '23:00' }, 'MIDDLE': { start: '11:00', end: '19:00' } }; },
  setShiftConfig: (d: ShiftConfig) => safeSet(KEYS.SHIFT_CONFIG, JSON.stringify(d)),
  getInventoryLogs: (): InventoryLog[] => { const saved = safeGet(KEYS.INVENTORY_LOGS); if (saved) try { return JSON.parse(saved); } catch(e) {} return []; },
  setInventoryLogs: (d: InventoryLog[]) => safeSet(KEYS.INVENTORY_LOGS, JSON.stringify(d)),
  getInventoryCategories: (): InventoryCategoryConfig[] => { const saved = safeGet(KEYS.INVENTORY_CATEGORIES); if (saved) try { return JSON.parse(saved); } catch(e) {} return [{ id: 'cat-1', name: 'BAHAN BAKU', type: 'RAW_MATERIAL' }, { id: 'cat-2', name: 'PERALATAN', type: 'ASSET' }]; },
  setInventoryCategories: (d: InventoryCategoryConfig[]) => safeSet(KEYS.INVENTORY_CATEGORIES, JSON.stringify(d)),
  getProcessedMaterials: (): ProcessedMaterial[] => { const saved = safeGet(KEYS.PROCESSED_MATERIALS); if (saved) try { return JSON.parse(saved); } catch(e) {} return []; },
  setProcessedMaterials: (d: ProcessedMaterial[]) => safeSet(KEYS.PROCESSED_MATERIALS, JSON.stringify(d)),
  getExpenses: (): ExpenseRecord[] => { const saved = safeGet(KEYS.EXPENSES); if (saved) try { return JSON.parse(saved); } catch(e) {} return []; },
  setExpenses: (d: ExpenseRecord[]) => safeSet(KEYS.EXPENSES, JSON.stringify(d)),
  getHppSubCategories: () => { const saved = safeGet(KEYS.HPP_SUB_CATEGORIES); if (saved) try { return JSON.parse(saved); } catch(e) {} return { BEVERAGE: ['COFFEE', 'JUICE', 'TEA', 'NON-COFFEE', 'MOCKTAIL', 'BLENDED'], FOOD: ['MAIN COURSE', 'SNACK', 'DESSERT', 'PASTRY', 'ADDITIONAL'] }; },
  setHppSubCategories: (d: any) => safeSet(KEYS.HPP_SUB_CATEGORIES, JSON.stringify(d)),
  getRecipes: (): Recipe[] => { const saved = safeGet(KEYS.RECIPES); if (saved) try { return JSON.parse(saved); } catch(e) {} return []; },
  setRecipes: (d: Recipe[]) => safeSet(KEYS.RECIPES, JSON.stringify(d)),
  getSuppliers: (): Supplier[] => { const saved = safeGet(KEYS.SUPPLIERS); if (saved) try { return JSON.parse(saved); } catch(e) {} return []; },
  setSuppliers: (d: Supplier[]) => safeSet(KEYS.SUPPLIERS, JSON.stringify(d)),
  getIncomes: (): IncomeRecord[] => { const saved = safeGet(KEYS.INCOMES); if (saved) try { return JSON.parse(saved); } catch(e) {} return []; },
  setIncomes: (d: IncomeRecord[]) => safeSet(KEYS.INCOMES, JSON.stringify(d)),
  getTransfers: (): TransferRecord[] => { const saved = safeGet(KEYS.TRANSFERS); if (saved) try { return JSON.parse(saved); } catch(e) {} return []; },
  setTransfers: (d: TransferRecord[]) => safeSet(KEYS.TRANSFERS, JSON.stringify(d)),
  getBills: (): BillRecord[] => { const saved = safeGet(KEYS.BILLS); if (saved) try { return JSON.parse(saved); } catch(e) {} return []; },
  setBills: (d: BillRecord[]) => safeSet(KEYS.BILLS, JSON.stringify(d)),
  getEmployees: (): Employee[] => { const saved = safeGet(KEYS.EMPLOYEES); if (saved) try { return JSON.parse(saved); } catch(e) {} return []; },
  setEmployees: (d: Employee[]) => safeSet(KEYS.EMPLOYEES, JSON.stringify(d)),
  getInventoryItems: (): InventoryItem[] => { const saved = safeGet(KEYS.INVENTORY_ITEMS); if (saved) try { return JSON.parse(saved); } catch(e) {} return []; },
  setInventoryItems: (d: InventoryItem[]) => safeSet(KEYS.INVENTORY_ITEMS, JSON.stringify(d)),
  getReservations: (): Reservation[] => { const saved = safeGet(KEYS.RESERVATIONS); if (saved) try { return JSON.parse(saved); } catch(e) {} return []; },
  setReservations: (d: Reservation[]) => safeSet(KEYS.RESERVATIONS, JSON.stringify(d)),
  getLeaves: (): LeaveRecord[] => { const saved = safeGet(KEYS.LEAVES); if (saved) try { return JSON.parse(saved); } catch(e) {} return []; },
  setLeaves: (d: LeaveRecord[]) => safeSet(KEYS.LEAVES, JSON.stringify(d)),
  getChecklist: (): OperationalChecklistItem[] => { const saved = safeGet(KEYS.CHECKLIST); if (saved) try { return JSON.parse(saved); } catch(e) {} return []; },
  setChecklist: (d: OperationalChecklistItem[]) => safeSet(KEYS.CHECKLIST, JSON.stringify(d)),
  getTasks: (): DashboardTask[] => { const saved = safeGet(KEYS.TASKS); if (saved) try { return JSON.parse(saved); } catch(e) {} return []; },
  setTasks: (d: DashboardTask[]) => safeSet(KEYS.TASKS, JSON.stringify(d)),
  getMeetings: (): MeetingMinute[] => { const saved = safeGet(KEYS.MEETINGS); if (saved) try { return JSON.parse(saved); } catch(e) {} return []; },
  setMeetings: (d: MeetingMinute[]) => safeSet(KEYS.MEETINGS, JSON.stringify(d)),
  getContracts: (): WorkContract[] => { const saved = safeGet(KEYS.CONTRACTS); if (saved) try { return JSON.parse(saved); } catch(e) {} return []; },
  setContracts: (d: WorkContract[]) => safeSet(KEYS.CONTRACTS, JSON.stringify(d)),
  getMenuPackages: (): MenuPackage[] => { const saved = safeGet(KEYS.MENU_PACKAGES); if (saved) try { return JSON.parse(saved); } catch(e) {} return []; },
  setMenuPackages: (d: MenuPackage[]) => safeSet(KEYS.MENU_PACKAGES, JSON.stringify(d)),
  getAdditionalCharges: (): AdditionalCharge[] => { const saved = safeGet(KEYS.ADDITIONAL_CHARGES); if (saved) try { return JSON.parse(saved); } catch(e) {} return []; },
  setAdditionalCharges: (d: AdditionalCharge[]) => safeSet(KEYS.ADDITIONAL_CHARGES, JSON.stringify(d)),
  getGlobalEnergy: () => Number(safeGet(KEYS.GLOBAL_ENERGY)) || 10,
  setGlobalEnergy: (d: number) => safeSet(KEYS.GLOBAL_ENERGY, d.toString()),
  getGlobalTargetFC: () => Number(safeGet(KEYS.GLOBAL_TARGET_FC)) || 30,
  setGlobalTargetFC: (d: number) => safeSet(KEYS.GLOBAL_TARGET_FC, d.toString()),
  getContractTemplate: (): ContractTemplate => { const saved = safeGet(KEYS.CONTRACT_TEMPLATE); if (saved) try { return JSON.parse(saved); } catch(e) {} return { intro: "", pasal1: "", pasal2: "", pasal3: "", pasal4: "", pasal5: "", pasal6: "", pasal7: "", pasal8: "", pasal9: "", pasal10: "", closing: "" }; },
  setContractTemplate: (d: ContractTemplate) => safeSet(KEYS.CONTRACT_TEMPLATE, JSON.stringify(d)),
  getLastExcelDriveDate: () => safeGet(KEYS.LAST_EXCEL_DATE),
  testFirebaseConnection: async (u: string) => { try { const url = getSanitizedFirebaseUrl(u); const res = await fetch(url, { method: 'PUT', body: JSON.stringify({ connection_test: true, time: Date.now() }) }); return res.ok; } catch (e) { return false; } },
  fetchFromGoogleSheet: async () => null,
  fetchFromGoogleDrive: async () => {
    const config = storage.getBusinessInfo();
    const url = config.gdriveJsonUrl || config.gdriveSheetUrl;
    if (!url || !url.includes("/exec")) return null;
    try {
      const res = await fetch(`${url}?action=GET_LATEST`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) { return null; }
  },
  syncToGoogleDriveJson: async (data: any) => {
    const config = storage.getBusinessInfo();
    if (!storage.isConfigValid('GOOGLE_2')) return false;
    try {
      const res = await fetch(config.gdriveJsonUrl!, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'SYNC_JSON', data: data })
      });
      return res.ok;
    } catch (e) { return false; }
  },
  syncToMysql: async (data: any) => {
    const config = storage.getBusinessInfo();
    if (!storage.isConfigValid('MYSQL')) return false;
    try {
      const res = await fetch(config.mysqlApiUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SYNC_FULL', data })
      });
      return res.ok;
    } catch (e) { return false; }
  }
};
