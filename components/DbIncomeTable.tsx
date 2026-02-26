
import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { IncomeRecord } from '../types';

interface Props {
  data: IncomeRecord[];
  isOwnerOrAdmin: boolean;
  onEdit: (item: IncomeRecord) => void;
  onDelete: (item: IncomeRecord) => void;
  formatCurrency: (val: number) => string;
}

const DbIncomeTable: React.FC<Props> = ({ data, isOwnerOrAdmin, onEdit, onDelete, formatCurrency }) => {
  // Fungsi anti-bug tanggal iPhone
  const formatDateSafe = (dateStr: string) => {
    if (!dateStr) return "-";
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[1000px]">
        <thead>
          <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b dark:border-gray-800">
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-16">No</th>
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tanggal</th>
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Keterangan</th>
            <th className="px-6 py-5 text-[10px] font-black text-green-700 uppercase tracking-widest text-right">Tunai</th>
            <th className="px-6 py-5 text-[10px] font-black text-blue-700 uppercase tracking-widest text-right">Transfer</th>
            <th className="px-6 py-5 text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest text-right">Total</th>
            {isOwnerOrAdmin && <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Aksi</th>}
          </tr>
        </thead>
        <tbody className="divide-y dark:divide-gray-800">
          {data.map((row, idx) => (
            <tr key={row.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors group text-sm">
              <td className="px-6 py-5 text-center text-gray-400 font-bold">{idx + 1}</td>
              <td className="px-6 py-5 font-bold">{formatDateSafe(row.date)}</td>
              <td className="px-6 py-5 font-medium truncate max-w-[250px]">{row.notes || '-'}</td>
              <td className="px-6 py-5 text-right font-bold text-green-700">{formatCurrency(row.cashNaim + row.cashTiwi)}</td>
              <td className="px-6 py-5 text-right font-bold text-blue-700">{formatCurrency(row.bri + row.bni)}</td>
              <td className="px-6 py-5 text-right font-black text-gray-900 dark:text-white">{formatCurrency(row.total)}</td>
              {isOwnerOrAdmin && (
                <td className="px-6 py-5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => onEdit(row)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                    <button onClick={() => onDelete(row)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DbIncomeTable;
