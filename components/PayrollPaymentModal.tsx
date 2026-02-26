import React, { useState } from 'react';
import { 
  X, CheckCircle2, Wallet, Banknote, 
  ArrowDownCircle, ArrowUpCircle, Info, ShieldCheck, 
  ChevronDown, Landmark, CreditCard
} from 'lucide-react';
import { Employee, WalletName } from '../types';

interface Props {
  employee: Employee;
  calc: {
    baseMaster: number;
    otAmount: number;
    scNet: number;
    bonusNet: number;
    absenceDays: number;
    absenceDeduction: number;
    otherDeductions: number;
    total: number;
    netBase: number;
  };
  wallets: WalletName[];
  onConfirm: (wallet: WalletName) => void;
  onClose: () => void;
  periodLabel: string;
}

const PayrollPaymentModal: React.FC<Props> = ({ employee, calc, wallets, onConfirm, onClose, periodLabel }) => {
  const [selectedWallet, setSelectedWallet] = useState<WalletName>(wallets[0] || 'Cash Naim');

  const formatCurrency = (v: number) => 'Rp ' + Math.round(v).toLocaleString('id-ID');

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-scale-in border-t-8 border-blue-600">
        <div className="p-8 border-b dark:border-gray-800 flex justify-between items-center">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl"><ShieldCheck size={24}/></div>
              <div>
                 <h3 className="text-xl font-black uppercase tracking-tighter">Otorisasi Pembayaran Gaji</h3>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Double-Check Data Sebelum Pencairan</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer"><X size={24}/></button>
        </div>

        <div className="p-8 space-y-8">
           {/* MINI SLIP PREVIEW FOR DOUBLE CHECK */}
           <div className="bg-gray-50 dark:bg-gray-800/50 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-700 p-8">
              <div className="flex justify-between items-start mb-6 border-b dark:border-gray-700 pb-4">
                 <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Nama Karyawan</p>
                    <h4 className="text-lg font-black uppercase text-gray-900 dark:text-white">{employee.name}</h4>
                    <p className="text-[10px] font-bold text-blue-600 uppercase">{employee.position}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Periode</p>
                    <p className="text-xs font-black uppercase">{periodLabel}</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 {/* EARNINGS */}
                 <div className="space-y-3">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2"><ArrowUpCircle size={14}/> Penerimaan</p>
                    <div className="space-y-2 text-xs font-bold uppercase">
                       <div className="flex justify-between text-gray-500"><span>Gaji Pokok Master</span><span className="text-gray-900 dark:text-gray-200">{formatCurrency(calc.baseMaster)}</span></div>
                       <div className="flex justify-between text-gray-500"><span>Lembur</span><span className="text-gray-900 dark:text-gray-200">{formatCurrency(calc.otAmount)}</span></div>
                       <div className="flex justify-between text-gray-500"><span>Bonus (Net)</span><span className="text-gray-900 dark:text-gray-200">{formatCurrency(calc.bonusNet)}</span></div>
                       <div className="flex justify-between text-gray-500"><span>SC (Net)</span><span className="text-gray-900 dark:text-gray-200">{formatCurrency(calc.scNet)}</span></div>
                    </div>
                 </div>

                 {/* DEDUCTIONS */}
                 <div className="space-y-3">
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2"><ArrowDownCircle size={14}/> Potongan</p>
                    <div className="space-y-2 text-xs font-bold uppercase">
                       <div className="flex justify-between text-gray-400"><span>Izin & Absen</span><span className="text-rose-600">-{formatCurrency(calc.absenceDeduction)}</span></div>
                       <div className="flex justify-between text-gray-400"><span>Kasbon/Lainnya</span><span className="text-rose-600">-{formatCurrency(calc.otherDeductions)}</span></div>
                    </div>
                 </div>
              </div>

              <div className="mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700 flex justify-between items-center">
                 <p className="text-[11px] font-black uppercase text-gray-400 tracking-[0.2em]">Total Terima Bersih</p>
                 <h4 className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">{formatCurrency(calc.total)}</h4>
              </div>
           </div>

           {/* PAYMENT SETTINGS */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2"><Landmark size={14}/> Pilih Sumber Dana (Bank/Kas)</label>
                 <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-600 transition-colors"><CreditCard size={18}/></div>
                    <select 
                      value={selectedWallet}
                      onChange={e => setSelectedWallet(e.target.value)}
                      className="w-full bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-blue-600 rounded-2xl pl-12 pr-10 py-4 outline-none font-black text-sm uppercase appearance-none cursor-pointer"
                    >
                       {wallets.filter(w => w !== 'Pajak & Service').map(w => (
                          <option key={w} value={w}>{w}</option>
                       ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                 </div>
              </div>

              <button 
                onClick={() => onConfirm(selectedWallet)}
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
              >
                 <CheckCircle2 size={20}/> Konfirmasi & Cairkan
              </button>
           </div>
        </div>

        <div className="p-6 bg-blue-50 dark:bg-blue-900/10 flex gap-4 items-center">
           <Info size={20} className="text-blue-600 shrink-0" />
           <p className="text-[10px] text-blue-800 dark:text-blue-300 font-bold uppercase italic">
              Setelah dikonfirmasi, sistem akan otomatis mencatat pengeluaran di dompet pilihan dan menutup status payroll karyawan ini.
           </p>
        </div>
      </div>
    </div>
  );
};

export default PayrollPaymentModal;