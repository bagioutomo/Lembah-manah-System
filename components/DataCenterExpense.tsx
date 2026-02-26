
import React from 'react';
import { ExpenseRecord } from '../types';

interface Props { data: ExpenseRecord[]; formatCurrency: (v: number) => string; }

const DataCenterExpense: React.FC<Props> = ({ data, formatCurrency }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead><tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-5">Kategori</th><th className="px-6 py-5">Tgl</th><th className="px-8 py-5">Barang/Jasa</th><th className="px-8 py-5 text-right">Nominal</th><th className="px-6 py-5 text-center">Qty</th><th className="px-8 py-5 text-right bg-rose-50/20">Total</th></tr></thead>
      <tbody className="divide-y dark:divide-gray-800 text-xs font-bold uppercase">
         {data.sort((a,b) => b.date.localeCompare(a.date)).map(e => (
            <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30"><td className="px-8 py-4"><span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded text-[9px] font-black">{e.category}</span></td><td className="px-6 py-4 text-gray-400 font-mono">{e.date}</td><td className="px-8 py-4 font-black">{e.notes}</td><td className="px-8 py-4 text-right font-bold text-gray-500">{formatCurrency(e.amount)}</td><td className="px-6 py-4 text-center">x{e.qty || 1}</td><td className="px-8 py-4 text-right font-black text-red-600">{formatCurrency(e.amount * (e.qty || 1))}</td></tr>
         ))}
      </tbody>
    </table>
  </div>
);

export default DataCenterExpense;
