
export type WalletName = string;
export type UserRole = 'OWNER' | 'ADMIN' | 'PURCHASING' | 'SUPERVISOR' | 'MANAGER';
export type CloudProvider = 'SUPABASE' | 'MYSQL_API' | 'LOCAL';

export interface BonusTier {
  revenue: number;
  bonus: number;
}

export interface PayrollSystemSettings {
  otRateManagement: number;
  otRateStaff: number;
  standardWorkDays: number;
  bonusTiers: BonusTier[];
  bonusMultipliers: {
    management: number;
    staff: number;
    dw: number;
  };
  managementKeywords: string;
  staffKeywords: string;
  dwKeywords: string;
  scEligibleKeywords: string;
  bonusEligibleKeywords: string;
}

export interface OperationalChecklistItem {
  id: string;
  task: string;
  done: boolean;
  skipped?: boolean;
  time: string;
  priority: 'NORMAL' | 'HIGH';
  frequency: 'DAILY' | '3_DAYS' | 'WEEKLY' | 'MONTHLY';
  category: 'OPERASIONAL' | 'KEBERSIHAN';
  lastCompletedDate?: string;
  lastCompletedBy?: string;
  lastCompletedTimestamp?: string;
}

export interface ContractTemplate {
  intro: string;
  pasal1: string;
  pasal2: string;
  pasal3: string;
  pasal4: string;
  pasal5: string;
  pasal6: string;
  pasal7: string;
  pasal8: string;
  pasal9: string;
  pasal10: string;
  closing: string;
}

export interface ChecklistLog {
  id: string;
  taskId: string;
  taskName: string;
  completedBy: string;
  date: string;
  time: string;
  status: 'COMPLETED' | 'SKIPPED' | 'OVERDUE';
  timestamp: string;
}

export interface AdditionalCharge {
  id: string;
  name: string;
  price: number;
}

export interface CategoryConfig {
  name: string;
  isOperational: boolean;
}

export interface IncomeRecord {
  id: string;
  date: string;
  notes: string;
  cashNaim: number;
  cashTiwi: number;
  bri: number;
  bni: number;
  total: number;
  timestamp: string;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  notes: string;
  qty: number;
  amount: number;
  wallet: string;
  category: string;
  timestamp: string;
  createdBy: string;
  articleId?: string;
}

export interface TransferRecord {
  id: string;
  date: string;
  fromWallet: string;
  toWallet: string;
  amount: number;
  notes: string;
  timestamp: string;
}

export interface BillItem {
  description: string;
  qty: number;
  unitPrice: number;
  amount: number;
  category: string;
}

export interface BillRecord {
  id: string;
  title: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'UNPAID' | 'PAID';
  items: BillItem[];
  notes: string;
  timestamp: string;
  category: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
}

export interface BusinessInfo {
  name: string;
  cloudApiUrl: string;
  cloudApiKey: string;
  mysqlApiUrl?: string;
  gdriveSheetUrl?: string; 
  gdriveJsonUrl?: string;  
  gdriveExcelUrl?: string;
  firebaseUrl?: string; 
  activeProvider?: CloudProvider;
  logoUrl?: string;
  sidebarLogoUrl?: string;
  address?: string;
  phone?: string;
  ownerName?: string;
  adminName?: string;
  purchasingName?: string;
  supervisorName?: string;
  managerName?: string;
  loginBgUrl?: string;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  status: 'FULLTIME' | 'PARTTIME' | 'DAILYWORKER' | 'PROBATION';
  joinDate: string;
  phone: string;
  baseSalary: number;
  bankAccount: string;
  active: boolean;
  leaveBalance: number;
  birthInfo: string;
  address: string;
  ktp: string;
}

export interface LeaveRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'SAKIT' | 'IZIN' | 'CUTI';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isHalfDay: boolean;
  timestamp: string;
}

export interface ScheduleRecord {
  employeeId: string;
  employeeName: string;
  shifts: Record<string, string>;
}

export type ShiftConfig = Record<string, { start: string; end: string }>;

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  type: 'ASSET' | 'RAW_MATERIAL';
  condition: 'GOOD' | 'DAMAGED' | 'EXPIRED' | 'MISSING';
  notes: string;
  unitPrice: number;
  lastUpdated: string;
}

export interface InventoryLog {
  id: string;
  itemId: string;
  itemName: string;
  action: 'IN' | 'OUT' | 'DAMAGE' | 'LOSS' | 'CREATE' | 'ADJUST' | 'DELETE';
  qtyChange: number;
  previousQty: number;
  newQty: number;
  reason: string;
  timestamp: string;
}

export interface InventoryCategoryConfig {
  id: string;
  name: string;
  type: 'ASSET' | 'RAW_MATERIAL';
}

export interface MaintenanceTask {
  id: string;
  deviceName: string;
  type: 'SERVICE' | 'KALIBRASI' | 'GANTI SPAREPART' | 'PEMBERSIHAN';
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | '3_MONTHS' | '6_MONTHS' | 'YEARLY';
  lastDoneDate: string;
  nextDueDate: string;
  assignedTo: string;
  status: 'OK' | 'WARNING';
  costEstimate: number;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  vendorInfo: string;
  notes: string;
}

export interface Article {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  purchasePrice: number;
  internalUnit: string;
  conversionFactor: number;
  baseCost: number;
  quantity?: number;
  lastUpdated: string;
}

export interface RecipeItem {
  articleId: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  yield: number;
  costPerUnit: number;
  totalCost: number;
}

export interface Recipe {
  id: string;
  menuName: string;
  category: string; 
  subCategory: string;
  items: RecipeItem[];
  costPrice: number;
  energyCost: number;
  totalCost: number;
  budgetFoodCost: number;
  suggestedPrice: number;
  actualSales: number;
  costFoodPercent: number;
  lastUpdated: string;
  instructions?: string;
  preparation?: string;
  notes?: string;
  imageUrl?: string;
  servings?: number;
  cookTime?: string;
  difficulty?: string;
  method?: string;
}

export interface ProcessedMaterialItem {
  articleId: string;
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
}

export interface ProcessedMaterial {
  id: string;
  name: string;
  items: ProcessedMaterialItem[];
  totalIngredientCost: number;
  yieldQuantity: number;
  yieldUnit: string;
  costPerYieldUnit: number;
  lastUpdated: string;
}

export interface MenuPackage {
  id: string;
  name: string;
  category?: string;
  foodItems: string;
  beverageItems: string;
  snackItems: string;
  dessertItems: string;
  additionalCharges: string;
  additionalChargePrice?: number;
  pricePerPax: number;
  timestamp: string;
}

export interface PaxOrder {
  name: string;
  food: string;
  drink: string;
}

export interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  area: string;
  category: string;
  serviceType?: string;
  dpAmount: number;
  foodSelection: string;
  beverageSelection: string;
  paxOrders?: PaxOrder[];
  packageName?: string;
  snackSelection?: string;
  dessertSelection?: string;
  additionalChargeItems?: string;
  additionalChargePrice?: number;
  pricePerPax?: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes: string;
  timestamp: string;
}

export interface WorkContract {
  id: string;
  employeeId: string;
  employeeName: string;
  contractNo: string;
  type: 'PKWT' | 'PKWTT' | 'DW';
  startDate: string;
  endDate: string;
  probationMonths: string;
  jobDesc: string;
  notes: string;
  status: string;
  timestamp: string;
  birthInfo: string;
  address: string;
  ktp: string;
  contractPlace: string;
  party1Name: string;
  party1Position: string;
  party1Address: string;
}

export interface ReservationPaymentConfig {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface DashboardTask {
  id: string;
  text: string;
  completed: boolean;
  month: number;
  year: number;
  pic: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  extensionRequest?: {
    newDate: string;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
  };
}

export interface MeetingMinute {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  attendants: string;
  discussion: string;
  decisions?: string;
  actionItems: string;
  timestamp: string;
}

export type PageId = 
  | 'dashboard' 
  | 'penjualan' 
  | 'pengeluaran' 
  | 'tagihan-baru'
  | 'income' 
  | 'expense' 
  | 'expense-category'
  | 'price-alerts'
  | 'mutation-logs'
  | 'adj-finance'
  | 'tagihan'
  | 'reservasi'
  | 'laba-rugi'
  | 'alokasi'
  | 'generate'
  | 'dompet'
  | 'kategori'
  | 'settings'
  | 'op-checklist'
  | 'op-maintenance'
  | 'op-schedule'
  | 'inv-assets'
  | 'inv-stocks'
  | 'inv-stocks-in'
  | 'inv-stocks-out'
  | 'inv-logs'
  | 'hrd-employees'
  | 'hrd-payroll'
  | 'hrd-slips'
  | 'hrd-leaves'
  | 'hrd-contracts'
  | 'hpp-production'
  | 'hpp-processed-materials'
  | 'hpp-summary'
  | 'articles'
  | 'hpp-process'
  | 'hpp-process-food'
  | 'hpp-process-bev'
  | 'jobdesk-checklist'
  | 'data-analisis'
  | 'data-center'
  | 'settings'
  | 'hpp-cookbook';
