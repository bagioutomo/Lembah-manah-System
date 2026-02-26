
import React from 'react';
import { IncomeRecord } from '../types';

interface Props { data: IncomeRecord[]; formatCurrency: (v: number) => string; }

const DataCenterIncome: React.FC<Props> = ({ data, formatCurrency }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead><tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-5">Tanggal</th><th className="px-8 py-5">Catatan</th><th className="px-8 py-5 text-right">Tunai</th><th className="px-8 py-5 text-right">Transfer</th><th className="px-8 py-5 text-right bg-emerald-50/20">Total Gross</th></tr></thead>
      <tbody className="divide-y dark:divide-gray-800 text-xs font-bold uppercase">
         {data.sort((a,b) => b.date.localeCompare(a.date)).map(i => (
            <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30"><td className="px-8 py-4 text-gray-500 font-mono">{i.date}</td><td className="px-8 py-4 font-black">{i.notes}</td><td className="px-8 py-4 text-right">{formatCurrency(i.cashNaim + i.cashTiwi)}</td><td className="px-8 py-4 text-right">{formatCurrency(i.bri + i.bni)}</td><td className="px-8 py-4 text-right font-black text-emerald-600">{formatCurrency(i.total)}</td></tr>
         ))}
      </tbody>
    </table>
  </div>
);

export default DataCenterIncome;
