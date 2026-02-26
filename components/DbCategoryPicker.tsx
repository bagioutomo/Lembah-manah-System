
import React from 'react';
import { Tag, ChevronRight, Filter } from 'lucide-react';

interface Props {
  expenseCategories: [string, number][];
  onSelect: (cat: string) => void;
  formatCurrency: (val: number) => string;
}

const DbCategoryPicker: React.FC<Props> = ({ expenseCategories, onSelect, formatCurrency }) => {
  return (
    <div className="animate-fade-in space-y-10 pb-20">
      <div className="flex items-center gap-5">
        <div className="p-4 bg-indigo-600 text-white rounded-[1.5rem] shadow-xl">
          <Filter size={28} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Monitor Kategori Biaya</h2>
          <p className="text-sm text-gray-500 font-medium italic mt-1">Pilih kategori untuk melihat audit pengeluaran mendalam.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {expenseCategories.map(([cat, amount]) => (
          <button 
            key={cat}
            onClick={() => onSelect(cat)}
            className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl text-left transition-all hover:scale-[1.03] hover:border-indigo-500 group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Tag size={20} />
              </div>
              <ChevronRight size={20} className="text-gray-300 group-hover:text-indigo-500 transition-all group-hover:translate-x-1" />
            </div>
            <h3 className="text-sm font-black uppercase text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors truncate mb-1">{cat}</h3>
            <p className="text-xl font-black text-indigo-700 dark:text-indigo-400">{formatCurrency(amount)}</p>
          </button>
        ))}
        {expenseCategories.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-30 italic font-black uppercase tracking-widest text-xs border-2 border-dashed rounded-[3rem]">Belum ada data pengeluaran terdeteksi</div>
        )}
      </div>
    </div>
  );
};

export default DbCategoryPicker;
