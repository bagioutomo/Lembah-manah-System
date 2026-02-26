
import React from 'react';
import { Reservation } from '../types';

interface Props { data: Reservation[]; formatCurrency: (v: number) => string; }

const DataCenterReservations: React.FC<Props> = ({ data, formatCurrency }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead><tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-5">Customer</th><th className="px-6 py-5">Tgl & Jam</th><th className="px-4 py-5 text-center">Pax</th><th className="px-8 py-5 text-right">DP Masuk</th><th className="px-6 py-5 text-center">Status</th></tr></thead>
      <tbody className="divide-y dark:divide-gray-800 text-xs font-bold uppercase">
         {data.sort((a,b) => b.date.localeCompare(a.date)).map(r => (
            <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30"><td className="px-8 py-4 font-black">{r.customerName}</td><td className="px-6 py-4 font-mono text-gray-500">{r.date} @ {r.time}</td><td className="px-4 py-4 text-center">{r.guests}</td><td className="px-8 py-4 text-right font-black text-emerald-600">{formatCurrency(r.dpAmount)}</td><td className="px-6 py-4 text-center"><span className="px-2 py-1 bg-gray-100 rounded text-[8px] font-black">{r.status}</span></td></tr>
         ))}
      </tbody>
    </table>
  </div>
);

export default DataCenterReservations;
