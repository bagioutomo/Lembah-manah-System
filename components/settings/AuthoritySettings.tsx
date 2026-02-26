
import React from 'react';
import { BadgeCheck, User, ChevronDown, AlertCircle, Cloud, CheckCircle2 } from 'lucide-react';
import { BusinessInfo, Employee } from '../../types';

interface Props {
  businessInfo: BusinessInfo;
  setBusinessInfo: (data: BusinessInfo) => void;
  employees: Employee[];
}

const AuthoritySettings: React.FC<Props> = ({ businessInfo, setBusinessInfo, employees }) => {
  const fields = [
    { label: 'Penanggung Jawab / Owner', key: 'ownerName', icon: '👑' },
    { label: 'Otoritas Finance (Admin)', key: 'adminName', icon: '💳' },
    { label: 'Otoritas Pengadaan (Purchasing)', key: 'purchasingName', icon: '📦' },
    { label: 'Otoritas Lapangan (Supervisor)', key: 'supervisorName', icon: '🛡️' },
    { label: 'Otoritas Manajemen (Manager)', key: 'managerName', icon: '👔' },
  ];

  const activeEmployees = employees.filter(e => e.active);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-xl p-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-violet-50 dark:bg-violet-950/30 text-violet-600 rounded-2xl shadow-sm">
            <BadgeCheck size={24}/>
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Otoritas Tanda Tangan</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Nama yang muncul di Laporan Resmi</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-full border border-emerald-100 dark:border-emerald-800 animate-fade-in shadow-sm">
           <Cloud size={12} />
           <span className="text-[8px] font-black uppercase tracking-widest flex items-center gap-1">Cloud Synced <CheckCircle2 size={10}/></span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {fields.map((item) => {
          const currentValue = (businessInfo as any)[item.key] || '';
          const isNameInDatabase = employees.some(e => e.name.toUpperCase() === currentValue.toUpperCase());
          const showAlert = currentValue && !isNameInDatabase;

          return (
            <div key={item.key} className="space-y-2">
              <div className="flex justify-between items-center px-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <span>{item.icon}</span> {item.label}
                </label>
                {showAlert && (
                  <span className="text-[8px] font-bold text-amber-600 uppercase flex items-center gap-1 animate-pulse">
                    <AlertCircle size={10}/> Nama tidak di database
                  </span>
                )}
              </div>
              
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-600 transition-colors">
                  <User size={18} />
                </div>
                <select 
                  value={currentValue} 
                  onChange={e => setBusinessInfo({...businessInfo, [item.key]: e.target.value})}
                  className={`w-full bg-gray-50 dark:bg-gray-800 rounded-2xl pl-12 pr-10 py-4 outline-none font-black text-sm border-2 transition-all appearance-none cursor-pointer ${
                    showAlert ? 'border-amber-200 focus:border-amber-500' : 'border-transparent focus:border-violet-600'
                  } dark:text-white shadow-inner`}
                >
                  <option value="">-- PILIH PEJABAT BERWENANG --</option>
                  <optgroup label="INPUT MANUAL / KHUSUS">
                     {currentValue && !isNameInDatabase && (
                       <option value={currentValue}>{currentValue} (DITERUSKAN)</option>
                     )}
                     <option value="DEDY SASMITO">DEDY SASMITO (OWNER)</option>
                  </optgroup>
                  <optgroup label="DARI DATABASE STAFF">
                    {activeEmployees.map(emp => (
                      <option key={emp.id} value={emp.name.toUpperCase()}>
                        {emp.name.toUpperCase()} ({emp.position})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-hover:text-gray-500 transition-colors">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-5 bg-violet-50 dark:bg-violet-900/10 rounded-3xl border-2 border-dashed border-violet-100 dark:border-violet-800 flex gap-4">
        <div className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm h-fit">
          <BadgeCheck size={16} className="text-violet-600" />
        </div>
        <p className="text-[10px] text-violet-800 dark:text-violet-300 font-medium leading-relaxed italic">
          <b>SINKRONISASI AKTIF:</b> Setiap nama yang Bapak pilih di atas otomatis tersimpan di <b>Supabase</b>. Jika Bapak ganti HP/Komputer, nama-nama ini akan muncul kembali secara otomatis.
        </p>
      </div>
    </div>
  );
};

export default AuthoritySettings;
