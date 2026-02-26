
import React from 'react';
import { InventoryLog } from '../types';

interface Props { data: InventoryLog[]; }

const DataCenterLogs: React.FC<Props> = ({ data }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead><tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-5">Waktu</th><th className="px-8 py-5">Barang</th><th className="px-6 py-5 text-center">Aksi</th><th className="px-6 py-5 text-center">Qty Mutasi</th><th className="px-8 py-5">Alasan</th></tr></thead>
      <tbody className="divide-y dark:divide-gray-800 text-xs font-bold uppercase">
         {data.sort((a,b) => b.timestamp.localeCompare(a.timestamp)).map(l => (
            <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30"><td className="px-8 py-4 text-gray-400 font-mono text-[10px]">{new Date(l.timestamp).toLocaleString('id-ID')}</td><td className="px-8 py-4 font-black">{l.itemName}</td><td className="px-6 py-4 text-center"><span className={`px-2 py-0.5 rounded text-[8px] font-black bg-gray-100`}>{l.action}</span></td><td className="px-6 py-4 text-center font-black">{l.qtyChange}</td><td className="px-8 py-4 italic text-gray-400 normal-case">"{l.reason}"</td></tr>
         ))}
      </tbody>
    </table>
  </div>
);

export default DataCenterLogs;
