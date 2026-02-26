
import React from 'react';
import { Article } from '../types';

interface Props { data: Article[]; formatCurrency: (v: number) => string; }

const DataCenterCatalog: React.FC<Props> = ({ data, formatCurrency }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead><tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-5">Bahan</th><th className="px-6 py-5">Kategori</th><th className="px-6 py-5 text-right">Hrg Beli</th><th className="px-6 py-5 text-center">Yield</th><th className="px-8 py-5 text-right bg-blue-50/20">HPP Unit</th></tr></thead>
      <tbody className="divide-y dark:divide-gray-800 text-xs font-bold uppercase">
         {data.map(a => (
            <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30"><td className="px-8 py-4 font-black">{a.name}</td><td className="px-6 py-4 text-gray-400">{a.category}</td><td className="px-6 py-4 text-right font-bold">{formatCurrency(a.purchasePrice)}</td><td className="px-6 py-4 text-center font-black text-gray-400">{a.conversionFactor} {a.internalUnit}</td><td className="px-8 py-4 text-right font-black text-blue-600">{formatCurrency(a.baseCost)}</td></tr>
         ))}
      </tbody>
    </table>
  </div>
);

export default DataCenterCatalog;
