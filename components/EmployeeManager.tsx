
import React, { useState, useMemo } from 'react';
import { 
  Users, UserPlus, Search, Trash2, Edit2, Phone, Briefcase, Calendar, 
  CreditCard, X, Save, ShieldCheck, ShieldAlert, MoreHorizontal, 
  UserCheck, Play, Umbrella, Globe, UserX, CheckCircle2, AlertCircle,
  Info, MapPin, Fingerprint
} from 'lucide-react';
import { Employee } from '../types';

interface Props {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
}

const EmployeeManager: React.FC<Props> = ({ employees, setEmployees }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filterActive, setFilterActive] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    position: '',
    status: 'FULLTIME',
    joinDate: new Date().toISOString().split('T')[0],
    phone: '',
    baseSalary: 0,
    bankAccount: '',
    active: true,
    leaveBalance: 12,
    birthInfo: '',
    address: '',
    ktp: ''
  });

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           e.position.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterActive === 'ALL' ? true : 
                           filterActive === 'ACTIVE' ? e.active === true : 
                           e.active === false;
                           
      return matchesSearch && matchesStatus;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, searchTerm, filterActive]);

  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [employees]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.position) return alert('Mohon lengkapi Nama dan Jabatan');

    if (editingEmployee) {
      setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? { ...emp, ...formData } as Employee : emp));
    } else {
      const newEmployee: Employee = {
        id: `emp-${Date.now()}`,
        name: formData.name || '',
        position: formData.position || '',
        status: formData.status || 'FULLTIME',
        joinDate: formData.joinDate || new Date().toISOString().split('T')[0],
        phone: formData.phone || '',
        baseSalary: formData.baseSalary || 0,
        bankAccount: formData.bankAccount || '',
        active: formData.active ?? true,
        leaveBalance: formData.leaveBalance ?? 12,
        birthInfo: formData.birthInfo || '',
        address: formData.address || '',
        ktp: formData.ktp || ''
      };
      setEmployees(prev => [...prev, newEmployee]);
    }

    handleCloseForm();
  };

  const toggleEmployeeStatus = (emp: Employee) => {
    const action = emp.active ? 'Me-nonaktifkan' : 'Mengaktifkan kembali';
    if (window.confirm(`Apakah Bapak yakin ingin ${action} ${emp.name}?`)) {
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, active: !e.active } : e));
    }
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData(emp);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEmployee(null);
    setFormData({
      name: '',
      position: '',
      status: 'FULLTIME',
      joinDate: new Date().toISOString().split('T')[0],
      phone: '',
      baseSalary: 0,
      bankAccount: '',
      active: true,
      leaveBalance: 12,
      birthInfo: '',
      address: '',
      ktp: ''
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Bapak yakin ingin menghapus data "${name}" secara permanen? Data riwayat penggajian dan kontrak yang terhubung mungkin akan terpengaruh.`)) {
      setEmployees(prev => prev.filter(e => e.id !== id));
    }
  };

  const formatCurrency = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'FULLTIME': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'PARTTIME': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'DAILYWORKER': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'PROBATION': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-900 text-white rounded-[1.5rem] shadow-xl"><Users size={28} /></div>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight uppercase tracking-tighter">Master Database Staff</h2>
               <div className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1 border border-blue-100 dark:border-blue-800"><Globe size={10} /> Data Global</div>
            </div>
            <p className="text-sm text-gray-500 font-medium italic">Data tersimpan permanen termasuk informasi KTP untuk kebutuhan kontrak.</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="w-full lg:w-auto px-8 py-4 bg-blue-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95 cursor-pointer"><UserPlus size={18} /> Registrasi Staff Baru</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
         <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-700 rounded-2xl flex items-center justify-center"><Users size={24}/></div>
            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Database</p><h4 className="text-xl font-black">{stats.total} Orang</h4></div>
         </div>
         <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 text-green-700 rounded-2xl flex items-center justify-center"><UserCheck size={24}/></div>
            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Staff Aktif</p><h4 className="text-xl font-black text-green-700">{stats.active} Orang</h4></div>
         </div>
         <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl flex items-center justify-center"><UserX size={24}/></div>
            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Non-Aktif</p><h4 className="text-xl font-black text-red-600">{stats.inactive} Orang</h4></div>
         </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden">
        <div className="p-8 border-b dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="relative max-w-md w-full">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input type="text" placeholder="Cari nama atau jabatan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-900 rounded-2xl pl-12 pr-6 py-3 outline-none font-bold text-sm transition-all" />
           </div>
           <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border dark:border-gray-700 w-fit">
              <button onClick={() => setFilterActive('ACTIVE')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${filterActive === 'ACTIVE' ? 'bg-white dark:bg-gray-900 text-green-600 shadow-sm' : 'text-gray-400'}`}>Aktif</button>
              <button onClick={() => setFilterActive('INACTIVE')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${filterActive === 'INACTIVE' ? 'bg-white dark:bg-gray-900 text-red-600 shadow-sm' : 'text-gray-400'}`}>Resign</button>
              <button onClick={() => setFilterActive('ALL')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${filterActive === 'ALL' ? 'bg-white dark:bg-gray-900 text-blue-600 shadow-sm' : 'text-gray-400'}`}>Semua</button>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identitas Staff</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Kontrak</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Informasi NIK</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Gaji Pokok</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {filteredEmployees.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-300 font-black uppercase tracking-widest italic text-xs">Data tidak ditemukan dalam database</td></tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr key={emp.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group ${!emp.active ? 'opacity-50 grayscale' : ''}`}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${emp.active ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30' : 'bg-gray-200 text-gray-500'}`}>{emp.name.charAt(0)}</div>
                        <div><p className="text-sm font-black text-gray-900 dark:text-white uppercase leading-none mb-1">{emp.name}</p><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{emp.position}</span></div>
                      </div>
                    </td>
                    <td className="px-6 py-6"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusBadgeClass(emp.status)}`}>{emp.status}</span></td>
                    <td className="px-6 py-6"><div className="space-y-1"><p className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-tighter"><Fingerprint size={12} className="inline mr-1 text-blue-500"/> {emp.ktp || 'Belum Input NIK'}</p><p className="text-[9px] font-bold text-gray-400 uppercase truncate max-w-[150px]"><MapPin size={10} className="inline mr-1"/> {emp.address || 'Alamat Kosong'}</p></div></td>
                    <td className="px-6 py-6 text-right"><p className="text-sm font-black text-gray-900 dark:text-white tracking-tighter">{emp.status === 'PARTTIME' ? '-' : formatCurrency(emp.baseSalary)}</p></td>
                    <td className="px-8 py-6">
                       <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEdit(emp)} className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"><Edit2 size={16}/></button>
                          <button onClick={() => toggleEmployeeStatus(emp)} className={`p-2.5 rounded-xl transition-all cursor-pointer ${emp.active ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`}>{emp.active ? <UserX size={16}/> : <UserCheck size={16}/>}</button>
                          <button onClick={() => handleDelete(emp.id, emp.name)} className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-all cursor-pointer"><Trash2 size={16}/></button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-fade-in">
           <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={handleCloseForm} />
           <div className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-8 sm:p-12 animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar border-t-8 border-blue-900">
              <div className="flex items-center justify-between mb-10">
                 <div className="flex items-center gap-4"><div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-400 rounded-2xl shadow-sm"><UserPlus size={24}/></div><h3 className="text-2xl font-black uppercase tracking-tighter">{editingEmployee ? 'Update Data Staff' : 'Registrasi Staff Baru'}</h3></div>
                 <button onClick={handleCloseForm} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer"><X size={24}/></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-8">
                 <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-[2rem] border border-gray-100 dark:border-gray-700 space-y-6">
                    <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2"><Fingerprint size={14}/> I. Identitas Pribadi (Sesuai KTP)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Nama Lengkap</label><input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} placeholder="BUDI SANTOSO" className="w-full bg-white dark:bg-gray-900 border-2 border-transparent focus:border-blue-900 rounded-2xl px-6 py-4 outline-none font-black text-sm uppercase transition-all" /></div>
                       <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Nomor NIK / KTP</label><input type="text" value={formData.ktp} onChange={e => setFormData({...formData, ktp: e.target.value})} placeholder="3309..." className="w-full bg-white dark:bg-gray-900 border-2 border-transparent focus:border-blue-900 rounded-2xl px-6 py-4 outline-none font-black text-sm transition-all" /></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Tempat / Tanggal Lahir</label><input type="text" value={formData.birthInfo} onChange={e => setFormData({...formData, birthInfo: e.target.value})} placeholder="Boyolali, 14 Juni 2005" className="w-full bg-white dark:bg-gray-900 border-2 border-transparent focus:border-blue-900 rounded-2xl px-6 py-4 outline-none font-bold text-sm transition-all" /></div>
                       <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">No. WhatsApp</label><input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="08XXX" className="w-full bg-white dark:bg-gray-900 border-2 border-transparent focus:border-blue-900 rounded-2xl px-6 py-4 outline-none font-black text-sm transition-all" /></div>
                    </div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Alamat Lengkap (Sesuai KTP)</label><textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Senet Rt 10 / Rw 02, Selo, Selo, Boyolali" className="w-full bg-white dark:bg-gray-900 border-2 border-transparent focus:border-blue-900 rounded-2xl px-6 py-4 outline-none font-medium text-sm resize-none h-20" /></div>
                 </div>
                 <div className="p-6 bg-blue-50/30 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100 dark:border-blue-900 space-y-6">
                    <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-2"><Briefcase size={14}/> II. Informasi Pekerjaan</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Jabatan</label><input required type="text" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} placeholder="BARISTA" className="w-full bg-white dark:bg-gray-900 border-2 border-transparent focus:border-blue-900 rounded-2xl px-6 py-4 outline-none font-black text-sm uppercase transition-all" /></div>
                       <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Tipe Kontrak</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full bg-white dark:bg-gray-950 border-2 border-transparent focus:border-blue-900 rounded-2xl px-6 py-4 outline-none font-black text-xs appearance-none transition-all" ><option value="FULLTIME">FULLTIME</option><option value="PARTTIME">PARTTIME</option><option value="DAILYWORKER">DAILYWORKER</option><option value="PROBATION">PROBATION</option></select></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Tgl Mulai Bekerja</label><input type="date" value={formData.joinDate} onChange={e => setFormData({...formData, joinDate: e.target.value})} className="w-full bg-white dark:bg-gray-900 border-2 border-transparent focus:border-blue-900 rounded-2xl px-6 py-4 outline-none font-black text-xs transition-all" /></div>
                       <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Rekening Bank</label><input type="text" value={formData.bankAccount} onChange={e => setFormData({...formData, bankAccount: e.target.value})} placeholder="BRI - 0123XXX" className="w-full bg-white dark:bg-gray-900 border-2 border-transparent focus:border-blue-900 rounded-2xl px-6 py-4 outline-none font-black text-xs transition-all" /></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div className="space-y-2"><label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-3 flex items-center gap-1"><Umbrella size={10}/> Jatah Cuti (Hari/Tahun)</label><input type="number" value={formData.leaveBalance} onChange={e => setFormData({...formData, leaveBalance: parseInt(e.target.value) || 0})} className="w-full bg-white dark:bg-gray-900 border-2 border-transparent focus:border-blue-500 rounded-2xl px-6 py-4 outline-none font-black text-sm transition-all" /></div>
                       <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Gaji Pokok Master (IDR)</label><div className="relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-400 text-xs">Rp</span><input type="text" value={formData.baseSalary ? formData.baseSalary.toLocaleString('id-ID') : ''} onChange={e => setFormData({...formData, baseSalary: parseInt(e.target.value.replace(/[^\d]/g, '') || '0')})} placeholder="0" className="w-full bg-white dark:bg-gray-900 border-2 border-transparent focus:border-blue-900 rounded-2xl pl-14 pr-6 py-5 outline-none font-black text-xl tracking-tight transition-all" /></div></div>
                    </div>
                 </div>
                 <div className="pt-6"><button type="submit" className="w-full py-6 bg-blue-900 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer"><Save size={20}/> {editingEmployee ? 'Simpan Perubahan Database' : 'Registrasi Ke Database Global'}</button></div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManager;
