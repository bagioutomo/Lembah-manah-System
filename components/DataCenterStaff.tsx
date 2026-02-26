
import React from 'react';
import { Employee } from '../types';

interface Props { data: Employee[]; formatCurrency: (v: number) => string; }

const DataCenterStaff: React.FC<Props> = ({ data, formatCurrency }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead><tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-5">Nama Karyawan</th><th className="px-8 py-5">Jabatan</th><th className="px-6 py-5 text-center">Status</th><th className="px-8 py-5 text-right">Gaji Pokok</th></tr></thead>
      <tbody className="divide-y dark:divide-gray-800 text-xs font-bold uppercase">
         {data.map(e => (
            <tr key={e.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${!e.active ? 'opacity-40 grayscale' : ''}`}><td className="px-8 py-4 font-black">{e.name}</td><td className="px-8 py-4 text-gray-500">{e.position}</td><td className="px-6 py-4 text-center"><span className="px-2 py-1 bg-gray-100 rounded text-[8px] font-black">{e.status}</span></td><td className="px-8 py-4 text-right font-black">{formatCurrency(e.baseSalary)}</td></tr>
         ))}
      </tbody>
    </table>
  </div>
);

export default DataCenterStaff;
