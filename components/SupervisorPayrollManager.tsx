import React, { useState, useMemo, useEffect } from 'react';
import { 
  Banknote, Search, CheckCircle2, X, Calculator, Save, 
  AlertCircle, History, Clock, Wallet, ChevronRight, UserCheck,
  CalendarDays, Settings2, Plus, Minus, Info, ReceiptText, FileText
} from 'lucide-react';
import { Employee, ExpenseRecord, UserRole, IncomeRecord } from '../types';

interface PayrollForm {
  daysWD: number;   // Senin - Jumat
  daysSat: number;  // Sabtu
  daysSun: number;  // Minggu
  otherDeductions: number;
  notes: string;
}

interface WageRates {
  rateWD: number;
  rateSat: number;
  rateSun: number;
}

interface Props {
  employees: Employee[];
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
  onAddExpense: (expense: ExpenseRecord) => void;
  userRole: UserRole;
  selectedMonth: number;
  selectedYear: number;
}

const SupervisorPayrollManager: React.FC<Props> = ({ employees, expenses, onAddExpense, userRole, selectedMonth, selectedYear }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showRateSettings, setShowRateSettings] = useState(false);
  
  const [rates, setRates] = useState<WageRates>(() => {
    const saved = localStorage.getItem('lmk-spv-wage-rates');
    return saved ? JSON.parse(saved) : { rateWD: 50000, rateSat: 60000, rateSun: 75000 };
  });

  const [payrollData, setPayrollData] = useState<Record<string, PayrollForm>>({});
  const [payingEmployee, setPayingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    localStorage.setItem('lmk-spv-wage-rates', JSON.stringify(rates));
  }, [rates]);

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const periodLabel = `${months[selectedMonth]} ${selectedYear}`;
  const todayStr = new Date().toISOString().split('T')[0];

  const visibleStaff = useMemo(() => {
    return (employees || []).filter(e => {
      const isPartTime = e.status === 'PARTTIME';
      const matchSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase());
      return e.active && isPartTime && matchSearch;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, searchTerm]);

  const handleDayChange = (id: string, field: keyof PayrollForm, value: string) => {
    const val = parseFloat(value) || 0;
    setPayrollData(prev => ({
      ...prev,
      [id]: { 
        ...(prev[id] || { daysWD: 0, daysSat: 0, daysSun: 0, otherDeductions: 0, notes: '' }), 
        [field]: val 
      }
    }));
  };

  const handleNoteChange = (id: string, value: string) => {
    setPayrollData(prev => ({
      ...prev,
      [id]: { 
        ...(prev[id] || { daysWD: 0, daysSat: 0, daysSun: 0, otherDeductions: 0, notes: '' }), 
        notes: value.toUpperCase() 
      }
    }));
  };

  const getCalc = (id: string) => {
    const d = payrollData[id] || { daysWD: 0, daysSat: 0, daysSun: 0, otherDeductions: 0, notes: '' };
    const subWD = d.daysWD * rates.rateWD;
    const subSat = d.daysSat * rates.rateSat;
    const subSun = d.daysSun * rates.rateSun;
    const bruto = subWD + subSat + subSun;
    const netto = Math.max(0, bruto - d.otherDeductions);
    const autoNote = `${d.daysWD}WD, ${d.daysSat}Sat, ${d.daysSun}Sun`;
    return { bruto, netto, autoNote };
  };

  const handlePay = () => {
    if (!payingEmployee) return;
    const calc = getCalc(payingEmployee.id);
    const d = payrollData[payingEmployee.id];
    const txId = Date.now().toString();
    
    onAddExpense({
      id: `pay-pt-spv-${txId}`, 
      date: todayStr,
      notes: `[UPAH PARTTIME] ${payingEmployee.name} (${periodLabel}) [TXID:${txId}] [DETAIL:${calc.autoNote}] - ${d.notes || 'REGULER'}`,
      qty: 1, 
      amount: calc.netto, 
      wallet: 'Supervisor', 
      category: 'Gaji Part-time', 
      timestamp: new Date().toISOString(), 
      createdBy: userRole
    });

    // Reset hanya data baris ini agar bisa diinput ulang segera
    setPayrollData(prev => {
      const n = { ...prev };
      delete n[payingEmployee.id];
      return n;
    });
    setPayingEmployee(null);
    alert(`Upah ${payingEmployee.name} berhasil dicatat.`);
  };

  const formatCurrency = (val: number) => 'Rp ' + Math.floor(val).toLocaleString('id-ID');

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-orange-600 text-white rounded-2xl shadow-lg shadow-orange-600/20">
            <Banknote size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Upah Part-Time</h2>
            <p className="text-sm font-bold text-gray-400 italic mt-2">Periode: <b>{periodLabel}</b> • Bebas bayar kapan saja & berkali-kali.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowRateSettings(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white dark:hover:bg-gray-700 transition-all border border-transparent hover:border-orange-500 shadow-sm cursor-pointer"
        >
          <Settings2 size={16}/> Atur Standar Upah
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden">
        <div className="p-8 border-b dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="relative max-w-md w-full">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
             <input 
               value={searchTerm} 
               onChange={e => setSearchTerm(e.target.value)} 
               type="text" 
               placeholder="Cari nama staff part-time..." 
               className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-orange-500 transition-all"
             />
           </div>
           <div className="flex items-center gap-3">
              <span className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-900 flex items-center gap-2">
                <CheckCircle2 size={12}/> Multi-Payment Aktif
              </span>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50 font-black uppercase text-gray-400 text-[10px] tracking-widest">
                <th className="px-8 py-5">Identitas</th>
                <th className="px-4 py-5 text-center">Sen-Jum (Days)</th>
                <th className="px-4 py-5 text-center">Sabtu (Days)</th>
                <th className="px-4 py-5 text-center">Minggu (Days)</th>
                <th className="px-4 py-5 text-center text-red-500">Potongan (-)</th>
                <th className="px-8 py-5 text-right bg-orange-50/20">Netto Kalkulasi</th>
                <th className="px-8 py-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {visibleStaff.length === 0 ? (
                <tr><td colSpan={7} className="p-24 text-center text-gray-300 font-black uppercase italic tracking-widest opacity-40">Tidak ada staff part-time terdeteksi</td></tr>
              ) : (
                visibleStaff.map(emp => {
                  const data = payrollData[emp.id] || { daysWD: 0, daysSat: 0, daysSun: 0, otherDeductions: 0, notes: '' };
                  const calc = getCalc(emp.id);
                  // Hitung berapa kali sudah dibayar bulan ini
                  const paidCount = expenses.filter(ex => ex.notes.includes(emp.name) && ex.notes.includes(periodLabel)).length;

                  return (
                    <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-8 py-6">
                        <div>
                          <p className="font-black uppercase text-gray-900 dark:text-white leading-none mb-1.5">{emp.name}</p>
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-950 px-1.5 py-0.5 rounded border border-orange-100 dark:border-orange-900">{emp.position}</span>
                             {paidCount > 0 && (
                               <span className="text-[8px] font-black text-emerald-600 uppercase flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                 <FileText size={8}/> {paidCount} SLIP TERBIT
                               </span>
                             )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-6 text-center">
                        <input 
                          type="number" step="0.5" value={data.daysWD || ''} 
                          onChange={e => handleDayChange(emp.id, 'daysWD', e.target.value)}
                          placeholder="0"
                          className="w-16 p-2 rounded-xl border dark:border-gray-700 text-center font-black bg-white dark:bg-gray-900 outline-none focus:border-orange-500" 
                        />
                      </td>
                      <td className="px-4 py-6 text-center">
                        <input 
                          type="number" step="0.5" value={data.daysSat || ''} 
                          onChange={e => handleDayChange(emp.id, 'daysSat', e.target.value)}
                          placeholder="0"
                          className="w-16 p-2 rounded-xl border dark:border-gray-700 text-center font-black bg-white dark:bg-gray-900 outline-none focus:border-orange-500" 
                        />
                      </td>
                      <td className="px-4 py-6 text-center">
                        <input 
                          type="number" step="0.5" value={data.daysSun || ''} 
                          onChange={e => handleDayChange(emp.id, 'daysSun', e.target.value)}
                          placeholder="0"
                          className="w-16 p-2 rounded-xl border dark:border-gray-700 text-center font-black bg-white dark:bg-gray-900 outline-none focus:border-orange-500" 
                        />
                      </td>
                      <td className="px-4 py-6 text-center">
                        <input 
                          type="text" value={data.otherDeductions ? data.otherDeductions.toLocaleString() : ''} 
                          onChange={e => handleDayChange(emp.id, 'otherDeductions', e.target.value)}
                          placeholder="0"
                          className="w-24 p-2 rounded-xl border-2 border-dashed border-red-200 dark:border-red-900 text-center font-bold text-red-500 bg-transparent outline-none focus:border-red-500" 
                        />
                      </td>
                      <td className="px-8 py-6 text-right font-black text-gray-900 dark:text-white bg-orange-50/10">
                        <div className="flex flex-col items-end">
                           <span className="text-base tracking-tighter">{formatCurrency(calc.netto)}</span>
                           <input 
                             type="text" value={data.notes} 
                             onChange={e => handleNoteChange(emp.id, e.target.value)} 
                             placeholder="Tambahkan ket..."
                             className="text-[8px] font-bold text-gray-400 bg-transparent outline-none border-b border-gray-100 text-right uppercase w-full mt-2"
                           />
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <button 
                          disabled={calc.netto <= 0} 
                          onClick={() => setPayingEmployee(emp)} 
                          className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95 ${calc.netto > 0 ? 'bg-orange-600 text-white hover:bg-orange-700 hover:-translate-y-0.5' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        >
                          BAYAR
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL SETTING TARIF */}
      {showRateSettings && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center px-4 animate-fade-in no-print">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowRateSettings(false)} />
           <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-[3rem] p-10 shadow-2xl animate-scale-in border-t-8 border-orange-600">
              <div className="flex items-center justify-between mb-10">
                 <h3 className="text-2xl font-black uppercase tracking-tighter">Konfigurasi Tarif Upah</h3>
                 <button onClick={() => setShowRateSettings(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"><X size={28}/></button>
              </div>
              <div className="space-y-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-3">Tarif Senin - Jumat (Normal)</label>
                    <div className="relative">
                       <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-400">Rp</span>
                       <input type="text" value={rates.rateWD.toLocaleString()} onChange={e => setRates({...rates, rateWD: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0})} className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl font-black text-sm outline-none border-2 border-transparent focus:border-orange-500" />
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-orange-600 uppercase ml-3">Tarif Hari Sabtu</label>
                    <div className="relative">
                       <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-400">Rp</span>
                       <input type="text" value={rates.rateSat.toLocaleString()} onChange={e => setRates({...rates, rateSat: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0})} className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl font-black text-sm outline-none border-2 border-transparent focus:border-orange-500" />
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-red-600 uppercase ml-3">Tarif Hari Minggu</label>
                    <div className="relative">
                       <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-400">Rp</span>
                       <input type="text" value={rates.rateSun.toLocaleString()} onChange={e => setRates({...rates, rateSun: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0})} className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl font-black text-sm outline-none border-2 border-transparent focus:border-orange-500" />
                    </div>
                 </div>
                 <button onClick={() => setShowRateSettings(false)} className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-orange-700 transition-all mt-4">Simpan Standar Tarif</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL KONFIRMASI BAYAR */}
      {payingEmployee && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in no-print">
           <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setPayingEmployee(null)}/>
           <div className="relative bg-white dark:bg-gray-900 p-10 rounded-[3rem] shadow-2xl max-sm w-full text-center animate-scale-in border-t-8 border-orange-600">
              <div className="w-20 h-20 bg-orange-50 dark:bg-orange-950 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <ReceiptText size={40}/>
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Final Audit Kas</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-3xl mb-8 space-y-4">
                 <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nama Penerima</p>
                    <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase">{payingEmployee.name}</h4>
                 </div>
                 <div className="h-px bg-gray-200 dark:bg-gray-700 w-1/2 mx-auto"></div>
                 <div>
                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Total Cair Bersih</p>
                    <h4 className="text-4xl font-black text-orange-600 tracking-tighter">{formatCurrency(getCalc(payingEmployee.id).netto)}</h4>
                 </div>
                 <p className="text-[9px] font-bold text-gray-400 uppercase italic">Catatan: {getCalc(payingEmployee.id).autoNote}</p>
              </div>
              <div className="flex flex-col gap-3">
                 <button onClick={handlePay} className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-orange-700 transition-all">Konfirmasi Cairkan Dana</button>
                 <button onClick={() => setPayingEmployee(null)} className="w-full py-4 text-gray-400 font-black text-[11px] uppercase tracking-widest hover:text-red-500 transition-all">Batalkan</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorPayrollManager;