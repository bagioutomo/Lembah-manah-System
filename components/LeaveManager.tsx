
import React, { useState, useMemo } from 'react';
import { 
  CalendarX, 
  UserPlus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  X, 
  Save, 
  AlertCircle,
  MoreVertical,
  Check,
  Calendar,
  Trash2,
  ToggleLeft
} from 'lucide-react';
import { Employee, LeaveRecord, ScheduleRecord } from '../types';

interface Props {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  leaves: LeaveRecord[];
  setLeaves: React.Dispatch<React.SetStateAction<LeaveRecord[]>>;
  schedules: ScheduleRecord[];
  setSchedules: React.Dispatch<React.SetStateAction<ScheduleRecord[]>>;
}

const LeaveManager: React.FC<Props> = ({ employees, setEmployees, leaves, setLeaves, schedules, setSchedules }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    employeeId: '',
    type: 'IZIN' as 'SAKIT' | 'IZIN' | 'CUTI',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
    isHalfDay: false
  });

  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => 
      l.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.reason.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [leaves, searchTerm]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const activeToday = leaves.filter(l => 
      l.status === 'APPROVED' && 
      today >= l.startDate && 
      today <= l.endDate
    ).length;
    
    const pending = leaves.filter(l => l.status === 'PENDING').length;
    return { activeToday, pending };
  }, [leaves]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === formData.employeeId);
    if (!emp) return alert('Pilih karyawan terlebih dahulu');

    const start = new Date(formData.startDate);
    const end = formData.isHalfDay ? new Date(formData.startDate) : new Date(formData.endDate);
    const duration = formData.isHalfDay ? 0.5 : (Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    if (formData.type === 'CUTI' && emp.leaveBalance < duration) {
       return alert(`Sisa cuti ${emp.name} tidak mencukupi. Sisa: ${emp.leaveBalance} hari, Pengajuan: ${duration} hari.`);
    }

    const newLeave: LeaveRecord = {
      id: `leave-${Date.now()}`,
      employeeId: formData.employeeId,
      employeeName: emp.name,
      type: formData.type,
      startDate: formData.startDate,
      endDate: formData.isHalfDay ? formData.startDate : formData.endDate,
      reason: formData.reason,
      status: 'PENDING',
      isHalfDay: formData.isHalfDay,
      timestamp: new Date().toISOString()
    };

    setLeaves(prev => [...prev, newLeave]);
    setShowForm(false);
    setFormData({
      employeeId: '',
      type: 'IZIN',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      reason: '',
      isHalfDay: false
    });
  };

  const updateStatus = (id: string, status: 'APPROVED' | 'REJECTED') => {
    const leave = leaves.find(l => l.id === id);
    if (!leave) return;

    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status } : l));

    if (status === 'APPROVED') {
       // 1. Hitung durasi dan daftar tanggal
       const start = new Date(leave.startDate);
       const end = new Date(leave.endDate);
       const duration = leave.isHalfDay ? 0.5 : (Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
       const dateList: string[] = [];
       
       for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          dateList.push(new Date(d).toISOString().split('T')[0]);
       }

       // 2. Sinkronisasi Cuti (Potong Saldo)
       if (leave.type === 'CUTI') {
          setEmployees(prev => prev.map(emp => {
             if (emp.id === leave.employeeId) {
                return { ...emp, leaveBalance: Math.max(0, emp.leaveBalance - duration) };
             }
             return emp;
          }));
       }

       // 3. Sinkronisasi Jadwal Staff (Hanya jika bukan setengah hari agar shift tidak hilang sepenuhnya)
       if (!leave.isHalfDay) {
          setSchedules(prev => {
             const existingRecord = prev.find(s => s.employeeId === leave.employeeId);
             if (existingRecord) {
                const updatedShifts = { ...existingRecord.shifts };
                dateList.forEach(dt => { updatedShifts[dt] = 'OFF'; });
                return prev.map(s => s.employeeId === leave.employeeId ? { ...s, shifts: updatedShifts } : s);
             } else {
                const newShifts: Record<string, 'PAGI' | 'SORE' | 'MIDDLE' | 'OFF' | 'NONE'> = {};
                dateList.forEach(dt => { newShifts[dt] = 'OFF'; });
                return [...prev, {
                   employeeId: leave.employeeId,
                   employeeName: leave.employeeName,
                   shifts: newShifts
                }];
             }
          });
       }
       alert(`Izin disetujui. ${leave.type === 'CUTI' ? `Sisa cuti ${leave.employeeName} telah dikurangi ${duration} hari.` : 'Telah dicatat dalam sistem.'} ${leave.isHalfDay ? 'Catatan: Izin Setengah Hari.' : 'Jadwal shift otomatis diset ke OFF.'}`);
    }
  };

  const deleteLeave = (id: string) => {
    if (confirm('Hapus riwayat izin ini?')) {
      setLeaves(prev => prev.filter(l => l.id !== id));
    }
  };

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-orange-600 text-white rounded-[1.5rem] shadow-xl shadow-orange-600/20">
            <CalendarX size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight uppercase tracking-tighter">Izin & Cuti Staff</h2>
            <p className="text-sm text-gray-500 font-medium italic">Approval langsung sinkron dengan Jadwal Shift (O) dan Payroll.</p>
          </div>
        </div>

        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-3 px-8 py-4 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-orange-700 transition-all active:scale-95"
        >
          <UserPlus size={18} /> Ajukan Izin Baru
        </button>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
         <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-2xl flex items-center justify-center">
               <Calendar size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Absen Hari Ini</p>
               <h4 className="text-2xl font-black text-gray-900 dark:text-white">{stats.activeToday} Staff</h4>
            </div>
         </div>
         <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center">
               <Clock size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Menunggu Persetujuan</p>
               <h4 className="text-2xl font-black text-gray-900 dark:text-white">{stats.pending} Pengajuan</h4>
            </div>
         </div>
      </div>

      {/* List Table */}
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden">
        <div className="p-8 border-b dark:border-gray-800 flex justify-between items-center">
           <div className="relative max-w-md w-full">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input 
               type="text" 
               placeholder="Cari pengajuan staff..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-orange-500 rounded-2xl pl-12 pr-6 py-3 outline-none font-bold text-sm transition-all"
             />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Karyawan</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Tipe & Rentang</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Alasan</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {filteredLeaves.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest italic text-xs">Belum ada riwayat pengajuan izin</td></tr>
              ) : (
                filteredLeaves.map(leave => (
                  <tr key={leave.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-8 py-6">
                       <p className="text-sm font-black text-gray-900 dark:text-white uppercase leading-none mb-1">{leave.employeeName}</p>
                       <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">ID: {leave.employeeId.slice(-6)}</span>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                               leave.type === 'SAKIT' ? 'bg-red-100 text-red-700' :
                               leave.type === 'CUTI' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                            }`}>{leave.type}</span>
                            {leave.isHalfDay && <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[7px] font-black uppercase">0.5 HARI</span>}
                          </div>
                          <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">
                             {new Date(leave.startDate).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})} 
                             {!leave.isHalfDay && ` - ${new Date(leave.endDate).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})}`}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-xs font-medium text-gray-500 dark:text-gray-400 italic truncate max-w-[200px]">{leave.reason || '-'}</p>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          leave.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          leave.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                       }`}>
                          {leave.status}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center justify-center gap-2">
                          {leave.status === 'PENDING' && (
                             <>
                                <button onClick={() => updateStatus(leave.id, 'APPROVED')} className="p-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-xl transition-all" title="Setujui"><Check size={16}/></button>
                                <button onClick={() => updateStatus(leave.id, 'REJECTED')} className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all" title="Tolak"><X size={16}/></button>
                             </>
                          )}
                          <button onClick={() => deleteLeave(leave.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-xl transition-all"><Trash2 size={16}/></button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-fade-in">
           <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowForm(false)} />
           <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-10 animate-scale-in">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-2xl font-black uppercase tracking-tighter">Ajukan Izin Staff</h3>
                 <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"><X size={24}/></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Pilih Karyawan</label>
                    <select 
                       required
                       value={formData.employeeId}
                       onChange={e => setFormData({...formData, employeeId: e.target.value})}
                       className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-orange-500 rounded-2xl px-6 py-4 outline-none font-black text-sm uppercase transition-all appearance-none"
                    >
                       <option value="">CARI NAMA STAFF...</option>
                       {employees.filter(e => e.active).map(e => <option key={e.id} value={e.id}>{e.name.toUpperCase()} (Sisa Cuti: {e.leaveBalance} Hr)</option>)}
                    </select>
                 </div>

                 <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-800 flex items-center justify-between">
                    <div>
                       <p className="text-xs font-black uppercase tracking-widest text-orange-700">Setengah Hari (0.5)</p>
                       <p className="text-[9px] font-bold text-orange-600/60 uppercase italic">Potongan gaji/cuti hanya dihitung 0.5 hari</p>
                    </div>
                    <button 
                       type="button"
                       onClick={() => setFormData({...formData, isHalfDay: !formData.isHalfDay})}
                       className={`p-2 rounded-xl transition-all ${formData.isHalfDay ? 'bg-orange-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-300 border border-gray-100'}`}
                    >
                       <ToggleLeft size={24} className={formData.isHalfDay ? 'rotate-180 transition-transform' : 'transition-transform'} />
                    </button>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Tipe Ketidakhadiran</label>
                       <select 
                          value={formData.type}
                          onChange={e => setFormData({...formData, type: e.target.value as any})}
                          className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-orange-500 rounded-2xl px-6 py-4 outline-none font-black text-sm transition-all"
                       >
                          <option value="IZIN">IZIN</option>
                          <option value="SAKIT">SAKIT</option>
                          <option value="CUTI">CUTI TAHUNAN</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Tanggal Mulai</label>
                       <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-orange-500 rounded-2xl px-6 py-4 outline-none font-black text-sm" />
                    </div>
                 </div>

                 {!formData.isHalfDay && (
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Sampai Tanggal (Hanya jika izin full hari)</label>
                       <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-orange-500 rounded-2xl px-6 py-4 outline-none font-black text-sm" />
                    </div>
                 )}

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Alasan / Keterangan</label>
                    <textarea 
                       value={formData.reason}
                       onChange={e => setFormData({...formData, reason: e.target.value})}
                       placeholder="Sebutkan alasan izin..."
                       className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-orange-500 rounded-2xl px-6 py-4 outline-none font-medium text-sm resize-none h-24"
                    />
                 </div>

                 <button type="submit" className="w-full py-5 bg-orange-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-orange-700 transition-all flex items-center justify-center gap-3">
                    <Save size={20}/> Daftarkan Pengajuan
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManager;
