
import React from 'react';
import { Ticket, Utensils } from 'lucide-react';
import { Reservation } from '../types';

interface Props {
  reservations: Reservation[];
}

const ReservationAnalysis: React.FC<Props> = ({ reservations }) => {
  const totalGuests = reservations.filter(r => r.status === 'CONFIRMED' || r.status === 'COMPLETED').reduce((sum, r) => sum + r.guests, 0);
  
  return (
    <div className="bg-white dark:bg-gray-950 p-10 rounded-[4rem] border-2 border-emerald-100 dark:border-emerald-900/30 shadow-xl">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl"><Ticket size={24}/></div>
        <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Loyalitas & Preferensi Tamu</h3>
      </div>
      <div className="space-y-6">
        <div className="p-6 bg-emerald-600 text-white rounded-[2.5rem] text-center shadow-lg">
           <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Total Tamu Terlayani</p>
           <p className="text-4xl font-black tracking-tighter">{totalGuests} <span className="text-sm">Pax</span></p>
        </div>
        <div className="space-y-4">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Utensils size={12}/> Pesanan Menu Terkini:</p>
           {reservations.filter(r => r.foodSelection).slice(0, 3).map((res, i) => (
              <div key={i} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
                 <p className="text-[10px] font-black uppercase text-gray-900 dark:text-white mb-1">{res.customerName}</p>
                 <p className="text-[9px] font-medium text-gray-500 italic line-clamp-1">"{res.foodSelection}"</p>
              </div>
           ))}
           {reservations.length === 0 && <div className="py-6 text-center opacity-30 italic text-[10px] font-black uppercase">Belum ada data pesanan</div>}
        </div>
      </div>
    </div>
  );
};

export default ReservationAnalysis;
