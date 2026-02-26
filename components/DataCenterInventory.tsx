
import React from 'react';
import { InventoryItem } from '../types';

interface Props { data: InventoryItem[]; formatCurrency: (v: number) => string; }

const DataCenterInventory: React.FC<Props> = ({ data, formatCurrency }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead><tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-5">Nama Barang</th><th className="px-6 py-5">Kategori</th><th className="px-6 py-5 text-center">Stok Aktif</th><th className="px-6 py-5 text-center">Kondisi</th><th className="px-8 py-5 text-right">Harga Est.</th></tr></thead>
      <tbody className="divide-y dark:divide-gray-800 text-xs font-bold uppercase">
         {data.map(i => (
            <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30"><td className="px-8 py-4 font-black">{i.name}</td><td className="px-6 py-4 text-gray-400">{i.category}</td><td className="px-6 py-4 text-center font-black">{i.quantity} {i.unit}</td><td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded text-[8px] font-black ${i.condition === 'GOOD' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{i.condition}</span></td><td className="px-8 py-4 text-right font-bold">{formatCurrency(i.unitPrice)}</td></tr>
         ))}
      </tbody>
    </table>
  </div>
);

export default DataCenterInventory;
