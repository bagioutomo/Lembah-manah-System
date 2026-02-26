
import React from 'react';
import { BillRecord } from '../types';

interface Props { data: BillRecord[]; formatCurrency: (v: number) => string; }

const DataCenterBills: React.FC<Props> = ({ data, formatCurrency }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead><tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-5">Vendor</th><th className="px-8 py-5">Kategori</th><th className="px-6 py-5">Jatuh Tempo</th><th className="px-8 py-5 text-right bg-blue-50/20">Total Tagihan</th></tr></thead>
      <tbody className="divide-y dark:divide-gray-800 text-xs font-bold uppercase">
         {data.sort((a,b) => a.dueDate.localeCompare(b.dueDate)).map(b => (
            <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30"><td className="px-8 py-4 font-black">{b.title}</td><td className="px-8 py-4 text-gray-500">{b.category}</td><td className="px-6 py-4 text-rose-600 font-mono">{b.dueDate}</td><td className="px-8 py-4 text-right font-black text-blue-600">{formatCurrency(b.amount)}</td></tr>
         ))}
      </tbody>
    </table>
  </div>
);

export default DataCenterBills;
