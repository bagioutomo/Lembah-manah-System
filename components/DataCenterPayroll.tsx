
import React from 'react';
import { ExpenseRecord } from '../types';

interface Props { data: ExpenseRecord[]; formatCurrency: (v: number) => string; }

const DataCenterPayroll: React.FC<Props> = ({ data, formatCurrency }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead><tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-5">Tanggal</th><th className="px-8 py-5">Deskripsi Slip</th><th className="px-6 py-5 text-center">Komponen</th><th className="px-8 py-5 text-right bg-blue-50/20">Netto Dibayar</th></tr></thead>
      <tbody className="divide-y dark:divide-gray-800 text-xs font-bold uppercase">
         {data.sort((a,b) => b.date.localeCompare(a.date)).map(e => (
            <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30"><td className="px-8 py-4 text-gray-400 font-mono">{e.date}</td><td className="px-8 py-4 font-black truncate max-w-[400px]">{e.notes}</td><td className="px-6 py-4 text-center"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[8px] font-black">{e.category}</span></td><td className="px-8 py-4 text-right font-black text-blue-600">{formatCurrency(e.amount)}</td></tr>
         ))}
      </tbody>
    </table>
  </div>
);

export default DataCenterPayroll;
