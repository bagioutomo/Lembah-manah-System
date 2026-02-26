
import React from 'react';
import { Recipe } from '../types';

interface Props { data: Recipe[]; formatCurrency: (v: number) => string; }

const DataCenterHpp: React.FC<Props> = ({ data, formatCurrency }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead><tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-5">Nama Menu</th><th className="px-6 py-5 text-center">Kategori</th><th className="px-8 py-5 text-right">HPP Total</th><th className="px-8 py-5 text-right">Harga Jual</th><th className="px-8 py-5 text-center bg-emerald-50/20">Cost %</th></tr></thead>
      <tbody className="divide-y dark:divide-gray-800 text-xs font-bold uppercase">
         {data.map(r => (
            <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30"><td className="px-8 py-4 font-black">{r.menuName}</td><td className="px-6 py-4 text-center text-gray-400">{r.subCategory}</td><td className="px-8 py-4 text-right font-bold text-rose-600">{formatCurrency(r.totalCost)}</td><td className="px-8 py-4 text-right font-bold text-blue-700">{formatCurrency(r.actualSales)}</td><td className="px-8 py-4 text-center"><span className={`px-3 py-1 rounded-full font-black ${r.costFoodPercent > 35 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>{Math.round(r.costFoodPercent)}%</span></td></tr>
         ))}
      </tbody>
    </table>
  </div>
);

export default DataCenterHpp;
