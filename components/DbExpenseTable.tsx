
import React from 'react';
import { Edit2, Trash2, Layers } from 'lucide-react';
import { ExpenseRecord } from '../types';

interface Props {
  data: ExpenseRecord[];
  isOwnerOrAdmin: boolean;
  onEdit: (item: ExpenseRecord) => void;
  onDelete: (item: ExpenseRecord) => void;
  formatCurrency: (val: number) => string;
}

const DbExpenseTable: React.FC<Props> = ({ data, isOwnerOrAdmin, onEdit, onDelete, formatCurrency }) => {
  // Fungsi anti-bug tanggal iPhone
  const formatDateSafe = (dateStr: string) => {
    if (!dateStr) return "-";
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[1100px]">
        <thead>
          <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b dark:border-gray-800">
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-16">No</th>
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tanggal</th>
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Keterangan</th>
            <th className="px-4 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Qty</th>
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Dompet</th>
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Kategori</th>
            <th className="px-6 py-5 text-[10px] font-black text-indigo-600 uppercase tracking-widest">PIC</th>
            <th className="px-6 py-5 text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest text-right">Total Akhir</th>
            {isOwnerOrAdmin && <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Aksi</th>}
          </tr>
        </thead>
        <tbody className="divide-y dark:divide-gray-800">
          {data.map((row, idx) => (
            <tr key={row.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors group text-sm">
              <td className="px-6 py-5 text-center text-gray-400 font-bold">{idx + 1}</td>
              <td className="px-6 py-5 font-bold">{formatDateSafe(row.date)}</td>
              <td className="px-6 py-5 font-medium truncate max-w-[250px]">
                <p className="text-gray-900 dark:text-white uppercase font-black tracking-tight leading-none mb-1">{row.notes || '-'}</p>
                <p className="text-[10px] text-gray-400 font-bold italic">@ {formatCurrency(row.amount)}</p>
              </td>
              <td className="px-4 py-5 text-center">
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg font-black text-xs text-gray-600 dark:text-gray-400">
                  {row.qty || 1}
                </span>
              </td>
              <td className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase">{row.wallet}</td>
              <td className="px-6 py-5"><span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-black text-gray-500 uppercase">{row.category}</span></td>
              <td className="px-6 py-5"><span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded text-[9px] font-black uppercase">{row.createdBy || '-'}</span></td>
              <td className="px-6 py-6 text-right font-black text-red-600">
                {formatCurrency(row.amount * (row.qty || 1))}
              </td>
              {isOwnerOrAdmin && (
                <td className="px-6 py-5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => onEdit(row)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-all active:scale-90"><Edit2 size={16} /></button>
                    <button onClick={() => onDelete(row)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-all active:scale-90"><Trash2 size={16} /></button>
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

export default DbExpenseTable;
