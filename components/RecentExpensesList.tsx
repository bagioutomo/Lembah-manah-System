
import React from 'react';
import { History, ShoppingBag, ArrowRight, User, Calendar } from 'lucide-react';
import { ExpenseRecord } from '../types';

interface Props {
  expenses: ExpenseRecord[];
}

const RecentExpensesList: React.FC<Props> = ({ expenses }) => {
  // Ambil 10 transaksi terbaru berdasarkan urutan waktu input (timestamp) atau tanggal
  const recent = [...expenses]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 10);

  const formatCurrency = (val: number) => 'Rp ' + Math.floor(val).toLocaleString('id-ID');

  return (
    <div className="mt-16 space-y-6 animate-slide-up no-print">
      <div className="flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500">
            <History size={18} />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tighter dark:text-white leading-none">10 Transaksi Terakhir</h3>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Audit Cepat Riwayat Input</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b dark:border-gray-800">
                <th className="px-10 py-5">Barang / Jasa</th>
                <th className="px-6 py-5 text-center">Dompet</th>
                <th className="px-4 py-5 text-center">Qty</th>
                <th className="px-10 py-5 text-right">Total Akhir</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center opacity-30 italic font-black uppercase tracking-[0.4em] text-[10px]">
                    Belum ada riwayat transaksi
                  </td>
                </tr>
              ) : (
                recent.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all group">
                    <td className="px-10 py-5">
                      <div className="flex flex-col">
                        <p className="text-xs font-black uppercase text-gray-900 dark:text-white mb-1 group-hover:text-red-600 transition-colors">
                          {exp.notes}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-[8px] font-black uppercase rounded border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">
                            {exp.category}
                          </span>
                          <span className="text-[8px] font-bold text-gray-400 flex items-center gap-1">
                            <Calendar size={10} /> {new Date(exp.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                          </span>
                          <span className="text-[8px] font-black text-gray-300 flex items-center gap-1 uppercase">
                            <User size={10} /> {exp.createdBy}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <span className="text-[9px] font-black uppercase text-gray-400 border px-2 py-0.5 rounded-lg dark:border-gray-700">
                         {exp.wallet}
                       </span>
                    </td>
                    <td className="px-4 py-5 text-center">
                      <span className="text-[10px] font-black text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg">
                        x{exp.qty}
                      </span>
                    </td>
                    <td className="px-10 py-5 text-right">
                       <p className="text-sm font-black text-red-600 tracking-tighter">
                         {formatCurrency(exp.amount * (exp.qty || 1))}
                       </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50/50 dark:bg-gray-800/20 p-4 text-center border-t dark:border-gray-800">
           <p className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.4em]">Audit Visual Terkini Lembah Manah Kopi</p>
        </div>
      </div>
    </div>
  );
};

export default RecentExpensesList;
