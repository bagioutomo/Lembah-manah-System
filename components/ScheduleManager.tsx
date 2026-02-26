import React, { useState, useMemo, useEffect } from 'react';
import { 
  CalendarRange, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  RotateCcw, 
  User, 
  Clock, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  Coffee, 
  UtensilsCrossed, 
  Users2, 
  Eye, 
  X, 
  Printer, 
  Download, 
  Settings2, 
  HelpCircle,
  ImageIcon,
  Loader2,
  ShieldCheck,
  Building2,
  Trash2,
  Lock,
  Zap,
  RefreshCw,
  CalendarCheck,
  ArrowRightLeft,
  RefreshCcw,
  Plus
} from 'lucide-react';
import { Employee, ScheduleRecord, ShiftConfig, LeaveRecord } from '../types';
import { storage } from '../services/storageService';
import html2canvas from 'html2canvas';

interface Props {
  employees: Employee[];
  schedules: ScheduleRecord[];
  setSchedules: React.Dispatch<React.SetStateAction<ScheduleRecord[]>>;
  globalMonth: number;
  globalYear: number;
  leaves: LeaveRecord[];
}

const ScheduleManager: React.FC<Props> = ({ employees, schedules, setSchedules, globalMonth, globalYear, leaves }) => {
  const [shiftConfig, setShiftConfig] = useState<ShiftConfig>(storage.getShiftConfig());
  const [showPreview, setShowPreview] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [newShiftName, setNewShiftName] = useState('');

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const businessInfo = useMemo(() => storage.getBusinessInfo(), []);

  const getEmployeeCategory = (position: string) => {
    const p = position.toLowerCase();
    if (p.includes('cook') || p.includes('kitchen') || p.includes('chef')) return 'KITCHEN';
    if (p.includes('barista') || p.includes('bar')) return 'BAR';
    if (p.includes('waiter') || p.includes('server') || p.includes('floor') || p.includes('runner')) return 'WAITERS';
    return 'OTHERS'; 
  };

  const groupedEmployees = useMemo(() => {
    const operationalStaff = employees.filter(e => {
      if (!e.active) return false;
      const p = e.position.toLowerCase();
      const isManagement = p.includes('manager') || p.includes('admin') || p.includes('management') || p.includes('owner') || p.includes('supervisor') || p.includes('spv') || p.includes('purchasing');
      const isSecurity = p.includes('security') || p.includes('satpam');
      const isGardener = p.includes('gardener') || p.includes('kebun');
      return !isManagement && !isSecurity && !isGardener;
    });

    return {
      BAR: operationalStaff.filter(e => getEmployeeCategory(e.position) === 'BAR'),
      KITCHEN: operationalStaff.filter(e => getEmployeeCategory(e.position) === 'KITCHEN'),
      WAITERS: operationalStaff.filter(e => getEmployeeCategory(e.position) === 'WAITERS'),
      OTHERS: operationalStaff.filter(e => getEmployeeCategory(e.position) === 'OTHERS')
    };
  }, [employees]);

  const daysInMonth = useMemo(() => {
    return new Date(globalYear, globalMonth + 1, 0).getDate();
  }, [globalMonth, globalYear]);

  const datesArray = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(globalYear, globalMonth, i + 1);
      return {
        day: i + 1,
        dateStr: `${globalYear}-${String(globalMonth + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
        dayName: date.toLocaleDateString('id-ID', { weekday: 'short' })
      };
    });
  }, [globalMonth, globalYear, daysInMonth]);

  const getShift = (empId: string, dateStr: string) => {
    const leave = leaves.find(l => 
       l.employeeId === empId && 
       l.status === 'APPROVED' && 
       dateStr >= l.startDate && 
       dateStr <= l.endDate
    );
    if (leave) return leave.type;
    const record = schedules.find(s => s.employeeId === empId);
    return record?.shifts[dateStr] || 'NONE';
  };

  const cycleShift = (empId: string, dateStr: string) => {
    const current = getShift(empId, dateStr);
    if (['SAKIT', 'IZIN', 'CUTI'].includes(current)) {
       return alert('Tanggal ini terkunci karena ada Izin/Cuti yang disetujui, Pak.');
    }
    
    // Create sequence: NONE, [Dynamic Shifts], OFF
    const shiftKeys = Object.keys(shiftConfig).sort();
    const sequence = ['NONE', ...shiftKeys, 'OFF'];
    const nextIndex = (sequence.indexOf(current) + 1) % sequence.length;
    const nextShift = sequence[nextIndex];

    setSchedules(prev => {
      const existing = prev.find(s => s.employeeId === empId);
      if (existing) {
        return prev.map(s => s.employeeId === empId ? { ...s, shifts: { ...s.shifts, [dateStr]: nextShift } } : s);
      } else {
        const emp = employees.find(e => e.id === empId);
        return [...prev, { employeeId: empId, employeeName: emp?.name || 'Unknown', shifts: { [dateStr]: nextShift } }];
      }
    });
  };

  const handleSave = () => {
    storage.setSchedules(schedules);
    storage.setShiftConfig(shiftConfig);
    alert('Jadwal dan konfigurasi berhasil disimpan!');
  };

  const handleResetMonth = () => {
    if (confirm(`Hapus semua input jadwal manual untuk bulan ${months[globalMonth]}?`)) {
      const datePrefix = `${globalYear}-${String(globalMonth + 1).padStart(2, '0')}`;
      setSchedules(prev => prev.map(s => {
        const newShifts = { ...s.shifts };
        Object.keys(newShifts).forEach(key => { if (key.startsWith(datePrefix)) delete newShifts[key]; });
        return { ...s, shifts: newShifts };
      }));
    }
  };

  const getShiftStyle = (shift: string) => {
    if (['SAKIT', 'IZIN', 'CUTI'].includes(shift)) return 'bg-violet-600 text-white border-violet-700 shadow-lg';
    if (shift === 'OFF') return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800';
    if (shift === 'NONE') return 'bg-gray-50 text-gray-300 border-gray-100 dark:bg-gray-800 dark:border-gray-700';
    
    // Dynamic color based on shift index
    const shiftKeys = Object.keys(shiftConfig).sort();
    const idx = shiftKeys.indexOf(shift);
    const colors = [
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20',
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20',
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20',
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20',
      'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20'
    ];
    return colors[idx % colors.length] || 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const getShiftLabel = (shift: string) => {
     if (shift === 'SAKIT') return 'SKT';
     if (shift === 'IZIN') return 'IZN';
     if (shift === 'CUTI') return 'CTI';
     if (shift === 'OFF') return 'O';
     if (shift === 'NONE' || !shift) return '-';
     return shift.charAt(0).toUpperCase();
  };

  const handleExportImage = async () => {
    const element = document.getElementById('schedule-paper-container');
    if (!element) return;
    try {
      setIsCapturing(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const canvas = await html2canvas(element, { 
        scale: 2.5, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth 
      }); 
      const image = canvas.toDataURL("image/jpeg", 0.95);
      const link = document.createElement('a');
      link.href = image;
      link.download = `Jadwal_Shift_${months[globalMonth]}_${globalYear}.jpg`;
      link.click();
    } catch (err) {
      alert("Gagal memotret jadwal.");
    } finally {
      setIsCapturing(false);
    }
  };

  const renderEmployeeRows = (emps: Employee[], categoryLabel: string, icon: React.ReactNode, colorClass: string, isForPrint: boolean = false) => {
    if (emps.length === 0) return null;
    return (
      <React.Fragment>
        <tr className={`${isForPrint ? 'bg-gray-100' : `${colorClass} bg-opacity-20`} border-y border-black break-inside-avoid`}>
          <td colSpan={daysInMonth + 1} className={`px-2 py-0.5 ${!isForPrint ? 'sticky left-0 z-30 bg-inherit backdrop-blur-md' : 'bg-gray-100'} border-x border-black`}>
            <div className="flex items-center gap-2">
              {!isForPrint && icon}
              <span className={`text-[9px] font-black uppercase tracking-[0.1em] text-black`}>{categoryLabel} ({emps.length})</span>
            </div>
          </td>
        </tr>
        {emps.map(emp => (
          <tr key={emp.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors border-b border-black last:border-b-2 break-inside-avoid">
            <td className={`${!isForPrint ? 'sticky left-0 z-20 bg-white dark:bg-gray-950 pr-4 group-hover:bg-gray-50 dark:group-hover:bg-gray-800 border-r dark:border-gray-800' : 'bg-white text-black border-r border-black'} py-0.5 px-2 transition-colors`}>
              <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase text-gray-900 dark:text-white print:text-black leading-none mb-0.5 truncate max-w-[120px]">{emp.name}</p>
                <p className="text-[7px] font-bold text-gray-400 print:text-gray-500 uppercase leading-none tracking-tighter truncate max-w-[120px]">{emp.position}</p>
              </div>
            </td>
            {datesArray.map(d => {
              const shift = getShift(emp.id, d.dateStr);
              const label = getShiftLabel(shift);
              const isLeave = ['SAKIT', 'IZIN', 'CUTI'].includes(shift);
              return (
                <td key={d.day} className={`p-0 text-center min-w-[24px] ${d.dayName === 'Min' ? 'bg-rose-50/20 dark:bg-rose-900/5 print:bg-red-50' : ''} ${isForPrint ? `border-r border-black` : ''}`}>
                  {isForPrint ? (
                    <span className={`text-[9px] font-black ${shift === 'OFF' ? 'text-red-600' : isLeave ? 'text-violet-700' : 'text-black'}`}>{label}</span>
                  ) : (
                    <button onClick={() => cycleShift(emp.id, d.dateStr)} className={`w-full aspect-square max-w-[22px] mx-auto rounded border flex flex-col items-center justify-center text-[8px] font-black transition-all ${getShiftStyle(shift)}`}>{isLeave && <Lock size={7}/>}{label}</button>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </React.Fragment>
    );
  };

  const handleAddShift = () => {
    const name = newShiftName.trim().toUpperCase();
    if (!name) return;
    if (shiftConfig[name]) return alert('Nama shift sudah ada!');
    setShiftConfig({ ...shiftConfig, [name]: { start: '08:00', end: '16:00' } });
    setNewShiftName('');
  };

  const handleRemoveShift = (key: string) => {
    if (confirm(`Hapus shift ${key}?`)) {
      const newConfig = { ...shiftConfig };
      delete newConfig[key];
      setShiftConfig(newConfig);
    }
  };

  return (
    <div className="animate-fade-in space-y-8 pb-32">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 no-print">
        <div className="flex items-center gap-5">
          <div className="p-5 bg-emerald-600 text-white rounded-[1.8rem] shadow-2xl">
            <CalendarRange size={32} />
          </div>
          <div>
            <div className="flex items-center gap-3">
               <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Jadwal Shift Tim</h2>
               <div className="px-3 py-1 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border border-violet-100 dark:border-violet-800 flex items-center gap-1.5 animate-pulse">
                  <RefreshCcw size={10} className="animate-spin-slow"/> Sync Aktif
               </div>
            </div>
            <p className="text-sm text-gray-500 font-medium italic mt-2">Periode: <b>{months[globalMonth]} {globalYear}</b>.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowConfig(true)} className="px-5 py-3 bg-gray-50 dark:bg-gray-800 text-gray-500 rounded-2xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-white transition-all border border-transparent hover:border-emerald-600 cursor-pointer shadow-sm"><Settings2 size={16}/> Konfigurasi Shift</button>
          <button onClick={handleResetMonth} className="px-5 py-3 bg-gray-50 dark:bg-gray-800 text-rose-500 rounded-2xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-500 cursor-pointer shadow-sm"><RotateCcw size={16}/> Reset</button>
          <button onClick={() => setShowPreview(true)} className="px-6 py-3 bg-white dark:bg-gray-800 text-emerald-700 border border-emerald-100 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-50 transition-all shadow-sm cursor-pointer"><Eye size={18}/> Cetak</button>
          <button onClick={handleSave} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-700 transition-all active:scale-95 cursor-pointer flex items-center gap-3"><Save size={18}/> Simpan</button>
        </div>
      </div>

      {/* KODE SHIFT DINAMIS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
         <div className="lg:col-span-12 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 pr-4 border-r dark:border-gray-800">
               <Info size={14} className="text-blue-500"/>
               <span className="text-[9px] font-black uppercase text-gray-400">Shift Terdaftar:</span>
            </div>
            {Object.keys(shiftConfig).sort().map((key, idx) => (
               <div key={key} className="flex items-center gap-2">
                  <div className={`px-2 h-5 rounded flex items-center justify-center text-[8px] font-black text-white shadow-sm ${[
                    'bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-indigo-500', 'bg-teal-500'
                  ][idx % 5]}`}>{key.charAt(0)}</div>
                  <span className="text-[9px] font-bold text-gray-500 uppercase">{key}</span>
               </div>
            ))}
            <div className="flex items-center gap-2">
               <div className="px-2 h-5 rounded bg-rose-500 flex items-center justify-center text-[8px] font-black text-white">O</div>
               <span className="text-[9px] font-bold text-gray-500 uppercase">OFF</span>
            </div>
            <div className="ml-auto hidden sm:flex items-center gap-2 px-3 py-1 bg-violet-50 dark:bg-violet-900/10 rounded-lg border border-violet-100 dark:border-violet-800">
               <ShieldCheck size={12} className="text-violet-600"/>
               <span className="text-[8px] font-black text-violet-600 uppercase tracking-widest italic">Karyawan Izin Otomatis Berstatus Shift Ungu</span>
            </div>
         </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden no-print">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/40 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                <th className="p-3 border-r border-gray-100 dark:border-gray-800 sticky left-0 bg-gray-50 dark:bg-gray-800 z-40 w-40 shadow-[3px_0_5px_-3px_rgba(0,0,0,0.05)]">Daftar Karyawan</th>
                {datesArray.map(d => (
                  <th key={d.day} className={`p-0.5 border-r border-gray-50 dark:border-gray-800 text-center min-w-[24px] ${d.dayName === 'Min' ? 'text-rose-500 bg-rose-50/30' : ''}`}><div className="flex flex-col gap-0"><span className="opacity-50 text-[6px] font-bold">{d.dayName}</span><span className="text-[10px] font-black">{d.day}</span></div></th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {renderEmployeeRows(groupedEmployees.BAR, 'Barista Station', <Coffee size={12} className="text-blue-500" />, 'bg-blue-50')}
              {renderEmployeeRows(groupedEmployees.KITCHEN, 'Kitchen Crew', <UtensilsCrossed size={12} className="text-orange-500" />, 'bg-orange-50')}
              {renderEmployeeRows(groupedEmployees.WAITERS, 'Service & Floor', <Users2 size={12} className="text-emerald-500" />, 'bg-emerald-50')}
              {renderEmployeeRows(groupedEmployees.OTHERS, 'Lainnya', <ShieldCheck size={12} className="text-gray-500" />, 'bg-gray-100')}
            </tbody>
          </table>
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-[100] bg-gray-200 dark:bg-black flex flex-col no-print animate-fade-in overflow-hidden">
          <div className="bg-white dark:bg-gray-900 border-b p-4 flex items-center justify-between shadow-lg">
            <button onClick={() => setShowPreview(false)} className="flex items-center gap-2 text-gray-500 hover:text-black font-black text-xs uppercase px-4 py-2 rounded-xl transition-all cursor-pointer"><X size={20} /> Tutup</button>
            <div className="flex items-center gap-3">
               <button onClick={handleExportImage} disabled={isCapturing} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-xl hover:bg-emerald-700 active:scale-95 disabled:opacity-50 cursor-pointer">{isCapturing ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />} SIMPAN JPG</button>
               <button onClick={() => window.print()} className="px-8 py-3 bg-black text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-lg cursor-pointer"><Printer size={18} /> CETAK PDF</button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 sm:p-10 flex justify-center bg-gray-300 dark:bg-black/50 custom-scrollbar">
            <div id="schedule-paper-container" className="bg-white text-black p-8 shadow-2xl mx-auto relative overflow-hidden print-view-optimized" style={{ width: '297mm', minHeight: 'auto' }}>
              <div className="flex justify-between items-start mb-6 pb-4 border-b-[4px] border-black">
                <div className="flex items-center gap-4">
                  {businessInfo.logoUrl ? <img src={businessInfo.logoUrl} alt="Logo" className="h-12 w-auto object-contain" /> : <div className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center font-black text-xl">LM</div>}
                  <div>
                     <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">JADWAL SHIFT TIM</h1>
                     <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-1">{businessInfo.name} • DIGITAL RECORD</p>
                  </div>
                </div>
                <div className="text-right">
                   <div className="bg-black text-white px-4 py-1 rounded font-black text-[9px] uppercase tracking-widest mb-1">OFFICIAL</div>
                   <p className="text-base font-black uppercase tracking-widest">{months[globalMonth]} {globalYear}</p>
                </div>
              </div>
              
              <div className="border-2 border-black rounded overflow-hidden">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-gray-100 text-black border-b-2 border-black font-black text-[8px] uppercase text-center">
                      <th className="p-2 border-r border-black w-32 text-left">Nama Staff</th>
                      {datesArray.map(d => (
                        <th key={d.day} className={`p-0.5 border-r border-black ${d.dayName === 'Min' ? 'bg-red-50' : ''}`}><div className="flex flex-col"><span>{d.dayName}</span><span>{d.day}</span></div></th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {renderEmployeeRows(groupedEmployees.BAR, 'Barista Staff', null, '', true)}
                    {renderEmployeeRows(groupedEmployees.KITCHEN, 'Kitchen Staff', null, '', true)}
                    {renderEmployeeRows(groupedEmployees.WAITERS, 'Floor & Service', null, '', true)}
                    {renderEmployeeRows(groupedEmployees.OTHERS, 'Lainnya', null, '', true)}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-8 items-end break-inside-avoid">
                 <div className="p-4 bg-gray-50 border border-black rounded-xl">
                    <p className="text-[9px] font-black uppercase tracking-widest mb-2 border-b border-black pb-1">Legenda Shift:</p>
                    <div className="grid grid-cols-4 gap-y-1 gap-x-4">
                       {Object.keys(shiftConfig).map(k => (
                          <div key={k} className="flex items-center gap-1.5"><span className="font-black text-[9px]">{k.charAt(0)}:</span><span className="text-[8px] font-bold">{k}</span></div>
                       ))}
                       <div className="flex items-center gap-1.5"><span className="font-black text-[9px]">O:</span><span className="text-[8px] font-bold text-red-600">OFF</span></div>
                       <div className="flex items-center gap-1.5"><span className="font-black text-[9px]">SKT:</span><span className="text-[8px] font-bold text-violet-700">SAKIT</span></div>
                    </div>
                 </div>
                 <div className="flex justify-between text-[9px] font-black uppercase text-center px-4">
                    <div className="w-32"><p className="mb-12 text-gray-400">DIPERIKSA</p><div className="border-b border-black w-full mb-0.5"></div><p>MANAGER</p></div>
                    <div className="w-32"><p className="mb-12 text-gray-400">DISAHKAN</p><div className="border-b border-black w-full mb-0.5"></div><p>OWNER</p></div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfig && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center px-4 animate-fade-in">
           <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowConfig(false)} />
           <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[3rem] p-10 shadow-2xl animate-scale-in border-t-8 border-emerald-600 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Konfigurasi Shift Dinamis</h3>
                <button onClick={() => setShowConfig(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"><X size={24}/></button>
              </div>
              
              <div className="space-y-6">
                 {/* ADD NEW SHIFT */}
                 <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 rounded-3xl border-2 border-dashed border-emerald-200">
                    <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-1 mb-2 block">Tambah Label Shift Baru</label>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         value={newShiftName} 
                         onChange={e => setNewShiftName(e.target.value.toUpperCase())}
                         placeholder="Contoh: MALAM, EXTRA..."
                         className="flex-1 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 outline-none font-black text-sm border border-transparent focus:border-emerald-500"
                       />
                       <button onClick={handleAddShift} className="p-4 bg-emerald-600 text-white rounded-xl active:scale-90 transition-all"><Plus size={20}/></button>
                    </div>
                 </div>

                 {/* LIST OF SHIFTS */}
                 <div className="grid grid-cols-1 gap-4">
                    {/* Fix: Explicitly cast Object.entries(shiftConfig) to resolve 'unknown' type in map callback */}
                    {(Object.entries(shiftConfig) as [string, { start: string; end: string }][]).map(([key, val]) => (
                      <div key={key} className="p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 relative group">
                         <button onClick={() => handleRemoveShift(key)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                         <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">{key.charAt(0)}</div>
                            <h4 className="text-lg font-black uppercase">{key}</h4>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <label className="text-[8px] font-black text-gray-400 uppercase ml-2">Mulai</label>
                               {/* Fix: Using typed val to access properties and perform spread */}
                               <input type="time" value={val.start} onChange={e => setShiftConfig({...shiftConfig, [key]: {...val, start: e.target.value}})} className="w-full bg-white dark:bg-gray-900 px-4 py-2 rounded-xl border-none outline-none font-bold shadow-sm" />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[8px] font-black text-gray-400 uppercase ml-2">Selesai</label>
                               {/* Fix: Using typed val to access properties and perform spread */}
                               <input type="time" value={val.end} onChange={e => setShiftConfig({...shiftConfig, [key]: {...val, end: e.target.value}})} className="w-full bg-white dark:bg-gray-900 px-4 py-2 rounded-xl border-none outline-none font-bold shadow-sm" />
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
                 
                 <button onClick={() => { storage.setShiftConfig(shiftConfig); setShowConfig(false); }} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl mt-4">Terapkan Perubahan</button>
              </div>
           </div>
        </div>
      )}

      <style>{`
        .print-view-optimized {
          height: auto !important;
          min-height: 210mm !important;
          page-break-after: always;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media print {
          body * { visibility: hidden; }
          #schedule-paper-container, #schedule-paper-container * { visibility: visible; }
          #schedule-paper-container { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100% !important; 
            height: auto !important; 
            margin: 0 !important; 
            padding: 10mm !important; 
            box-shadow: none !important;
            transform: none !important;
            border: none !important;
          }
          tr { page-break-inside: avoid !important; }
          .break-inside-avoid { page-break-inside: avoid !important; }
          @page { size: A4 landscape; margin: 5mm; }
        }
      `}</style>
    </div>
  );
};

export default ScheduleManager;