import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart3, Download, Loader2, Building2, ShieldCheck,
  TrendingUp, ShoppingBag, Target, Percent, ArrowRight,
  Coins, Scale, Calculator, Printer, X, FileText, ImageIcon
} from 'lucide-react';
import { 
  IncomeRecord, ExpenseRecord, BusinessInfo, 
  Employee, LeaveRecord, InventoryItem, MaintenanceTask, 
  OperationalChecklistItem, Recipe, Article, Reservation, DashboardTask,
  InventoryLog
} from '../types';
import html2canvas from 'html2canvas';
import { storage } from '../services/storageService';
import { getStrategicCeoAnalysis } from '../services/geminiService';

// Sub Components
import IncomeInfographic from './IncomeInfographic';
import ExpenseInfographic from './ExpenseInfographic';
import AIStrategicVerdict from './AIStrategicVerdict';
import SDMAnalysis from './SDMAnalysis';
import OperationalAnalysis from './OperationalAnalysis';
import HppVarianceAnalysis from './HppVarianceAnalysis';
import InventoryLogisticsAnalysis from './InventoryLogisticsAnalysis';
import ReservationAnalysis from './ReservationAnalysis';

interface Props {
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
  employees: Employee[];
  leaves: LeaveRecord[];
  inventoryItems: InventoryItem[];
  maintenance: MaintenanceTask[];
  checklist: OperationalChecklistItem[];
  recipes: Recipe[];
  articles: Article[];
  reservations: Reservation[];
  tasks: DashboardTask[];
  periodLabel: string;
  businessInfo: BusinessInfo;
  viewMode: 'BULANAN' | 'TAHUNAN';
  globalMonth: number;
  globalYear: number;
}

const DataAnalysisView: React.FC<Props> = (props) => {
  const { incomes, expenses, periodLabel, businessInfo, viewMode, globalMonth, globalYear } = props;
  const [isCapturing, setIsCapturing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  
  const inventoryLogs = useMemo(() => storage.getInventoryLogs(), []);

  const formatCurrency = (v: number) => 'Rp ' + (v || 0).toLocaleString('id-ID');

  const stats = useMemo(() => {
    const totalGross = incomes.reduce((sum, r) => sum + r.total, 0);
    const netRevenue = Math.round(totalGross / 1.1);
    const totalExp = expenses.reduce((sum, r) => sum + r.amount, 0);
    const opProfit = netRevenue - totalExp;
    const profitMargin = netRevenue > 0 ? (opProfit / netRevenue) * 100 : 0;

    const catMap: Record<string, number> = {};
    expenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
    const topExpenses = Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const chartMap: Record<string, { inc: number, exp: number }> = {};
    incomes.forEach(r => {
      const d = new Date(r.date);
      const key = viewMode === 'TAHUNAN' ? d.toLocaleDateString('id-ID', {month:'short'}) : d.getDate().toString();
      if (!chartMap[key]) chartMap[key] = { inc: 0, exp: 0 };
      chartMap[key].inc += r.total;
    });

    const timelineData = Object.entries(chartMap)
      .map(([key, val]) => ({ label: key, ...val }))
      .sort((a, b) => {
        if (viewMode === 'BULANAN') return parseInt(a.label) - parseInt(b.label);
        return 0; 
      });

    return { 
      totalGross, netRevenue, totalExp, opProfit, profitMargin, 
      topExpenses, timelineData 
    };
  }, [incomes, expenses, viewMode]);

  useEffect(() => {
    const fetchAiSummary = async () => {
      setIsLoadingAI(true);
      
      const context = {
        finance: { gross: stats.totalGross, exp: stats.totalExp, margin: stats.profitMargin },
        hr: { leaveCount: props.leaves.length, staffCount: props.employees.length },
        ops: { checklistDone: props.checklist.filter(c=>c.done).length, totalChecklist: props.checklist.length },
        inventory: { damagedCount: props.inventoryItems.filter(i=>i.condition==='DAMAGED').length }
      };

      try {
        const result = await getStrategicCeoAnalysis(context, periodLabel);
        setAiAnalysis(result || 'Analisis strategis otomatis sedang dikalkulasi oleh sistem.');
      } catch (e) {
        setAiAnalysis('Gagal memuat analisis cerdas. Silakan periksa koneksi internet Bapak.');
      } finally {
        setIsLoadingAI(false);
      }
    };
    fetchAiSummary();
  }, [stats, periodLabel, props.leaves.length, props.employees.length, props.checklist, props.inventoryItems]);

  const handleCapture = async (e?: React.MouseEvent) => {
    const element = document.getElementById('infographic-main-container');
    if (!element) return;
    try {
      setIsCapturing(true);
      await new Promise(r => setTimeout(r, 1000));
      const canvas = await html2canvas(element, { 
        scale: 2.5, 
        useCORS: true, 
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0a0a0a' : '#ffffff',
        logging: false,
        windowWidth: 1400 
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.download = `LAPORAN_INTELIJEN_${periodLabel.replace(/\s+/g, '_')}.jpg`;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Gagal mengambil gambar laporan.");
    } finally { 
      setIsCapturing(false); 
    }
  };

  const handlePrint = (e?: React.MouseEvent) => {
    window.print();
  };

  return (
    <div className="animate-fade-in space-y-10 pb-24">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 no-print">
         <div className="flex items-center gap-5">
            <div className="p-4 bg-gray-900 dark:bg-gray-800 text-white rounded-[1.5rem] shadow-xl shadow-gray-900/20"><BarChart3 size={28} /></div>
            <div>
               <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Pusat Analisis Intelijen</h2>
               <p className="text-sm text-gray-500 font-medium italic mt-2">Menghubungkan data lintas departemen dalam satu visi strategis.</p>
            </div>
         </div>
         <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={handleCapture} 
              disabled={isCapturing} 
              className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-3 shadow-xl hover:bg-emerald-700 transition-all active:scale-95 cursor-pointer"
            >
               {isCapturing ? <Loader2 size={18} className="animate-spin"/> : <><ImageIcon size={18}/> Simpan JPG</>}
            </button>
            <button 
              onClick={handlePrint}
              className="px-8 py-4 bg-black text-white rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-3 shadow-xl hover:bg-gray-800 transition-all active:scale-95 cursor-pointer"
            >
               <Printer size={18}/> Cetak / Simpan PDF
            </button>
         </div>
      </div>

      <div id="infographic-main-container" className="p-4 sm:p-12 lg:p-20 bg-white dark:bg-[#0a0a0a] rounded-[4rem] border-2 border-gray-100 dark:border-gray-800 shadow-2xl space-y-20 paper-preview print:p-0 print:m-0 print:shadow-none print:border-none !w-full max-w-full">
        
        <div className="flex justify-between items-end border-b-8 border-black dark:border-white pb-12">
           <div className="space-y-4 text-left">
              <div className="flex items-center gap-3 text-emerald-600 font-black text-xs uppercase tracking-[0.4em]">
                 <ShieldCheck size={16}/> Platform Intelijen Lembah Manah
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-[0.85]">
                Laporan <br/>Audit Strategis <br/>
                <span className="text-emerald-600">{periodLabel}</span>
              </h1>
           </div>
           <div className="text-right">
              {businessInfo.logoUrl ? (
                 <img src={businessInfo.logoUrl} className="h-28 w-auto mb-6 ml-auto object-contain" alt="Logo" />
              ) : (
                <div className="w-24 h-24 bg-black text-white rounded-3xl flex items-center justify-center ml-auto mb-6">
                  <Building2 size={48}/>
                </div>
              )}
              <p className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.5em]">DATA RESMI {businessInfo.name.toUpperCase()}</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="p-10 bg-emerald-50 dark:bg-emerald-900/10 rounded-[3rem] border-2 border-emerald-100 dark:border-emerald-800 flex flex-col items-center text-center group hover:scale-[1.02] transition-transform">
              <div className="p-5 bg-emerald-600 text-white rounded-2xl mb-6 shadow-xl shadow-emerald-500/20"><TrendingUp size={32}/></div>
              <p className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.4em] mb-2">Pendapatan Bersih (Estimasi)</p>
              <h4 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">{formatCurrency(stats.netRevenue)}</h4>
              <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase mt-2 italic">Setelah Pajak & Service Charge</p>
           </div>
           <div className="p-10 bg-rose-50 dark:bg-rose-900/10 rounded-[3rem] border-2 border-rose-100 dark:border-rose-800 flex flex-col items-center text-center group hover:scale-[1.02] transition-transform">
              <div className="p-5 bg-rose-600 text-white rounded-2xl mb-6 shadow-xl shadow-rose-500/20"><ShoppingBag size={32}/></div>
              <p className="text-[11px] font-black text-rose-600 uppercase tracking-[0.4em] mb-2">Beban Operasional (OPEX)</p>
              <h4 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">{formatCurrency(stats.totalExp)}</h4>
              <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase mt-2 italic">Total Seluruh Pengeluaran</p>
           </div>
           <div className={`p-10 rounded-[3rem] border-2 flex flex-col items-center text-center group hover:scale-[1.02] transition-transform ${stats.profitMargin >= 30 ? 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-800' : 'bg-amber-50 border-amber-100 dark:border-amber-900/10 dark:border-amber-800'}`}>
              <div className={`p-5 rounded-2xl mb-6 shadow-xl ${stats.profitMargin >= 30 ? 'bg-indigo-600 text-white shadow-indigo-500/20' : 'bg-amber-600 text-white shadow-amber-500/20'}`}><Target size={32}/></div>
              <p className={`text-[11px] font-black uppercase tracking-[0.4em] mb-2 ${stats.profitMargin >= 30 ? 'text-indigo-600' : 'text-amber-600'}`}>Margin Laba Bersih</p>
              <h4 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">{Math.round(stats.profitMargin)}%</h4>
              <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase mt-2 italic">Efisiensi Profitabilitas</p>
           </div>
        </div>

        <div className="space-y-12">
           <div className="flex items-center gap-4 text-left"><div className="h-1 w-20 bg-emerald-600"></div><span className="text-xs font-black uppercase tracking-[0.5em] text-gray-400 dark:text-gray-600">Bagian I: Performa Finansial Utama</span></div>
           <div className="grid grid-cols-1 gap-12">
              <IncomeInfographic 
                 totalGross={stats.totalGross} 
                 timelineData={stats.timelineData} 
                 viewMode={viewMode} 
                 formatCurrency={formatCurrency} 
                 globalMonth={globalMonth}
                 globalYear={globalYear}
              />
              <ExpenseInfographic 
                 totalExp={stats.totalExp} 
                 netRevenue={stats.netRevenue} 
                 topExpenses={stats.topExpenses} 
                 expenses={expenses} 
                 formatCurrency={formatCurrency} 
              />
           </div>
        </div>

        <div className="space-y-12">
           <div className="flex items-center gap-4 text-left"><div className="h-1 w-20 bg-rose-600"></div><span className="text-xs font-black uppercase tracking-[0.5em] text-gray-400 dark:text-gray-600">Bagian II: Analisis HPP & Inventaris</span></div>
           <div className="grid grid-cols-1 gap-12">
              <HppVarianceAnalysis articles={props.articles} expenses={props.expenses} recipes={props.recipes} />
           </div>
        </div>

        <div className="space-y-12">
           <div className="flex items-center gap-4 text-left"><div className="h-1 w-20 bg-violet-600"></div><span className="text-xs font-black uppercase tracking-[0.5em] text-gray-400 dark:text-gray-600">Bagian III: Sumber Daya Manusia & Operasional</span></div>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <SDMAnalysis employees={props.employees} leaves={props.leaves} />
              <OperationalAnalysis 
                 checklist={props.checklist} 
                 tasks={props.tasks} 
                 inventoryItems={props.inventoryItems} 
                 maintenance={props.maintenance} 
              />
           </div>
        </div>

        <div className="space-y-12">
           <div className="flex items-center gap-4 text-left"><div className="h-1 w-20 bg-amber-600"></div><span className="text-xs font-black uppercase tracking-[0.5em] text-gray-400 dark:text-gray-600">Bagian IV: Logistik & Kepuasan Pelanggan</span></div>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <InventoryLogisticsAnalysis 
                 inventoryItems={props.inventoryItems} 
                 maintenance={props.maintenance} 
                 inventoryLogs={inventoryLogs} 
                 globalMonth={globalMonth} 
                 globalYear={globalYear} 
              />
              <ReservationAnalysis reservations={props.reservations} />
           </div>
        </div>

        <div className="pt-16 border-t-8 border-gray-100 dark:border-gray-800">
           <AIStrategicVerdict isLoading={isLoadingAI} analysis={aiAnalysis} />
        </div>

        <div className="pt-12 flex justify-between items-center text-gray-400 dark:text-gray-600 border-t border-gray-100 dark:border-gray-800">
           <div className="flex items-center gap-6">
              <Building2 size={32} className="opacity-20"/>
              <div className="text-left">
                 <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sistem Manajemen Lembah Manah Kopi</p>
                 <p className="text-[9px] font-bold uppercase italic mt-1 tracking-widest">Audit Intelijen Digital v2.5</p>
              </div>
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.5em]">DOCUMENT ID: {Date.now()}</p>
        </div>
      </div>
    </div>
  );
};

export default DataAnalysisView;