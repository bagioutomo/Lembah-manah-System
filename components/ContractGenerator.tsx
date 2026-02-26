
import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileSignature, User, X, Printer, ImageIcon, Loader2, 
  FileText, Plus, Trash2, Edit3, History, Search, Save, 
  Briefcase, Fingerprint, Settings, AlignLeft, Info,
  CheckCircle2, RefreshCw
} from 'lucide-react';
import { Employee, BusinessInfo, WorkContract, ContractTemplate } from '../types';
import { storage } from '../services/storageService';
import html2canvas from 'html2canvas';

interface Props {
  employees: Employee[];
  contracts: WorkContract[];
  setContracts: React.Dispatch<React.SetStateAction<WorkContract[]>>;
  businessInfo: BusinessInfo;
}

const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const getRomanMonth = (month: number) => ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][month];

const terbilang = (n: number): string => {
  if (n < 0) return "minus " + terbilang(-n);
  if (n < 12) return ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"][n];
  if (n < 20) return terbilang(n - 10) + " belas";
  if (n < 100) return terbilang(Math.floor(n / 10)) + " puluh " + terbilang(n % 10);
  if (n < 200) return "seratus " + terbilang(n - 100);
  if (n < 1000) return terbilang(Math.floor(n / 100)) + " ratus " + terbilang(n % 100);
  if (n < 2000) return "seribu " + terbilang(n - 1000);
  if (n < 1000000) return terbilang(Math.floor(n / 1000)) + " ribu " + terbilang(n % 1000);
  if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + " juta " + terbilang(n % 1000000);
  return "";
};

const ContractGenerator: React.FC<Props> = ({ employees = [], contracts = [], setContracts, businessInfo }) => {
  const [view, setView] = useState<'LIST' | 'FORM' | 'PREVIEW' | 'TEMPLATE_EDITOR'>('LIST');
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [template, setTemplate] = useState<ContractTemplate>(storage.getContractTemplate());
  
  const realToday = new Date();
  const realTodayStr = realToday.toISOString().split('T')[0];

  const generateAutoContractNo = () => {
    const nextNum = String((contracts?.length || 0) + 1).padStart(4, '0');
    const romanMonth = getRomanMonth(realToday.getMonth());
    const year = realToday.getFullYear();
    return `${nextNum}/LMK/${romanMonth}/${year}`;
  };

  const [formData, setFormData] = useState({
    contractNo: '',
    startDate: realTodayStr,
    endDate: new Date(new Date().setFullYear(realToday.getFullYear() + 1)).toISOString().split('T')[0],
    contractPlace: 'Genting',
    birthInfo: '',
    address: '',
    ktp: '',
    party1Name: businessInfo.ownerName || 'DEDY SASMITO',
    party1Position: 'Owner Lembah Manah Kopi',
    party1Address: businessInfo.address || 'Genting, Boyolali',
    jobDesc: 'Barista',
    notes: ''
  });

  const selectedEmployee = useMemo(() => 
    Array.isArray(employees) ? employees.find(e => e.id === selectedEmpId) : null, 
  [employees, selectedEmpId]);

  useEffect(() => {
    if (selectedEmployee && !editingContractId) {
      setFormData(prev => ({
        ...prev,
        birthInfo: selectedEmployee.birthInfo || '',
        address: selectedEmployee.address || '',
        ktp: selectedEmployee.ktp || '',
        jobDesc: selectedEmployee.position || 'Staff'
      }));
    }
  }, [selectedEmployee, editingContractId]);

  const handleSaveTemplate = () => {
    storage.setContractTemplate(template);
    alert('Naskah template kontrak berhasil diperbarui secara permanen!');
    setView('LIST');
  };

  const handleCreateNew = () => {
    setEditingContractId(null);
    setSelectedEmpId('');
    setFormData({
      contractNo: generateAutoContractNo(),
      startDate: realTodayStr,
      endDate: new Date(new Date().setFullYear(realToday.getFullYear() + 1)).toISOString().split('T')[0],
      contractPlace: 'Genting',
      birthInfo: '',
      address: '',
      ktp: '',
      party1Name: businessInfo.ownerName || 'DEDY SASMITO',
      party1Position: 'Owner Lembah Manah Kopi',
      party1Address: businessInfo.address || 'Genting, Boyolali',
      jobDesc: 'Barista',
      notes: ''
    });
    setView('FORM');
  };

  const handleEdit = (contract: WorkContract) => {
    setEditingContractId(contract.id);
    setSelectedEmpId(contract.employeeId);
    setFormData({
      contractNo: contract.contractNo,
      startDate: contract.startDate,
      endDate: contract.endDate,
      contractPlace: contract.contractPlace || 'Genting',
      birthInfo: contract.birthInfo || '',
      address: contract.address || '',
      ktp: contract.ktp || '',
      party1Name: contract.party1Name || businessInfo.ownerName || 'DEDY SASMITO',
      party1Position: contract.party1Position || 'Owner Lembah Manah Kopi',
      party1Address: contract.party1Address || businessInfo.address || 'Genting, Boyolali',
      jobDesc: contract.jobDesc,
      notes: contract.notes
    });
    setView('FORM');
  };

  const handleSaveContract = () => {
    if (!selectedEmployee) return alert('Pilih karyawan!');
    
    const newContract: WorkContract = {
      id: editingContractId || `con-${Date.now()}`,
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      contractNo: formData.contractNo || generateAutoContractNo(),
      type: 'PKWT',
      startDate: formData.startDate,
      endDate: formData.endDate,
      probationMonths: '0',
      jobDesc: formData.jobDesc,
      notes: formData.notes,
      status: 'ACTIVE',
      timestamp: new Date().toISOString(),
      birthInfo: formData.birthInfo,
      address: formData.address,
      ktp: formData.ktp,
      contractPlace: formData.contractPlace,
      party1Name: formData.party1Name,
      party1Position: formData.party1Position,
      party1Address: formData.party1Address
    };

    setContracts(prev => {
      const filtered = prev.filter(c => c.id !== newContract.id);
      return [newContract, ...filtered];
    });

    setView('LIST');
  };

  const handleExport = async () => {
    const element = document.getElementById('official-contract-paper');
    if (!element) return;
    try {
      setIsCapturing(true);
      await new Promise(r => setTimeout(r, 800));
      const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.download = `Kontrak_${selectedEmployee?.name.replace(/\s+/g, '_')}.jpg`;
      link.click();
    } finally {
      setIsCapturing(false);
    }
  };

  const getIndonesianDate = (dateStr: string) => dateStr ? new Date(dateStr).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'}) : "-";
  const getIndonesianDay = (dateStr: string) => new Date(dateStr).toLocaleDateString('id-ID', {weekday: 'long'});

  // Helper untuk merender naskah pasal dengan variabel dinamis
  const renderPasalText = (text: string) => {
    if (!text) return "";
    return text
      .replace(/\[TGL_MULAI\]/g, getIndonesianDate(formData.startDate))
      .replace(/\[TGL_BERAKHIR\]/g, getIndonesianDate(formData.endDate))
      .replace(/\[JABATAN\]/g, formData.jobDesc.toUpperCase())
      .replace(/\[TEMPAT\]/g, formData.contractPlace)
      .replace(/\[GAJI_POKOK\]/g, `${terbilang(selectedEmployee?.baseSalary || 0)} rupiah (${(selectedEmployee?.baseSalary || 0).toLocaleString('id-ID')})`);
  };

  return (
    <div className="animate-fade-in space-y-8 pb-20 min-h-[600px]">
      
      {view === 'LIST' && (
        <>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-violet-600 text-white rounded-[1.5rem] shadow-xl"><FileSignature size={28} /></div>
              <div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Kontrak Kerja</h2>
                <p className="text-sm text-gray-500 font-medium italic">Manajemen draf hukum dan arsip kepegawaian.</p>
              </div>
            </div>
            <div className="flex gap-3 w-full lg:w-auto">
               <button onClick={() => setView('TEMPLATE_EDITOR')} className="flex-1 lg:flex-none px-6 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-xs uppercase tracking-widest border border-transparent hover:border-indigo-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"><Settings size={18}/> Ubah Naskah</button>
               <button onClick={handleCreateNew} className="flex-1 lg:flex-none px-8 py-4 bg-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-violet-700 transition-all flex items-center justify-center gap-3 cursor-pointer"><Plus size={18} /> Kontrak Baru</button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden">
            <div className="p-8 border-b dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-3"><History size={20} className="text-gray-400" /><h3 className="text-lg font-black uppercase tracking-tighter">Arsip Kontrak</h3></div>
               <div className="relative w-full sm:w-64"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Cari staff..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-xs font-bold" /></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-5">Identitas Staff</th><th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Berlaku</th><th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Aksi</th></tr></thead>
                <tbody className="divide-y dark:divide-gray-800">
                  {contracts.length === 0 ? (<tr><td colSpan={5} className="px-8 py-20 text-center text-gray-300 font-black uppercase italic text-xs">Belum ada kontrak.</td></tr>) : (
                    contracts.filter(c => c.employeeName.toLowerCase().includes(searchTerm.toLowerCase())).map(con => (
                      <tr key={con.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group text-sm">
                        <td className="px-8 py-6"><p className="text-sm font-black text-gray-900 dark:text-white uppercase mb-1">{con.employeeName}</p><p className="text-[10px] font-bold text-gray-400 uppercase">{con.contractNo}</p></td>
                        <td className="px-6 py-6 font-bold text-gray-600 dark:text-gray-300 uppercase">{getIndonesianDate(con.startDate)}</td>
                        <td className="px-8 py-6 text-center"><div className="flex items-center justify-center gap-2"><button onClick={() => { setSelectedEmpId(con.employeeId); setEditingContractId(con.id); setFormData(con as any); setView('PREVIEW'); }} className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl cursor-pointer"><FileText size={16}/></button><button onClick={() => handleEdit(con)} className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl cursor-pointer"><Edit3 size={16}/></button><button onClick={() => { if(confirm('Hapus?')) setContracts(p => p.filter(c => c.id !== con.id)) }} className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl cursor-pointer"><Trash2 size={16}/></button></div></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {view === 'TEMPLATE_EDITOR' && (
        <div className="animate-fade-in space-y-8">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <button onClick={() => setView('LIST')} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-black hover:text-white transition-all"><X size={20}/></button>
                 <h2 className="text-3xl font-black uppercase tracking-tighter">Editor Naskah Kontrak</h2>
              </div>
              <button onClick={handleSaveTemplate} className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center gap-2 hover:bg-emerald-700 transition-all"><Save size={18}/> Simpan Naskah</button>
           </div>

           <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border-2 border-dashed border-blue-200 rounded-3xl flex gap-4">
              <Info className="text-blue-600 shrink-0" size={24}/>
              <div className="text-[11px] font-medium leading-relaxed italic text-blue-800 dark:text-blue-300 uppercase">
                 Gunakan kode berikut agar data otomatis terisi:<br/>
                 <b>[TGL_MULAI]</b>, <b>[TGL_BERAKHIR]</b>, <b>[JABATAN]</b>, <b>[GAJI_POKOK]</b>, <b>[TEMPAT]</b>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-8">
              {[
                { label: 'Teks Pembuka (Intro)', key: 'intro' },
                { label: 'Pasal 1: Posisi & Jabatan', key: 'pasal1' },
                { label: 'Pasal 2: Masa Berlaku', key: 'pasal2' },
                { label: 'Pasal 3: Tugas & Kewajiban', key: 'pasal3' },
                { label: 'Pasal 4: Imbalan (Gaji)', key: 'pasal4' },
                { label: 'Pasal 5: Absensi & Waktu', key: 'pasal5' },
                { label: 'Pasal 6: Penalti & Resign', key: 'pasal6' },
                { label: 'Pasal 7: Tata Tertib', key: 'pasal7' },
                { label: 'Pasal 8: Pemutusan Hubungan', key: 'pasal8' },
                { label: 'Pasal 9: Penyelesaian Sengketa', key: 'pasal9' },
                { label: 'Pasal 10: Berakhirnya Kontrak', key: 'pasal10' },
                { label: 'Teks Penutup (Closing)', key: 'closing' }
              ].map((field) => (
                <div key={field.key} className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border shadow-lg space-y-4">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><AlignLeft size={16}/></div>
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">{field.label}</h4>
                   </div>
                   <textarea 
                     value={(template as any)[field.key]} 
                     onChange={e => setTemplate({...template, [field.key]: e.target.value})}
                     className="w-full min-h-[150px] p-6 bg-gray-50 dark:bg-black rounded-2xl outline-none font-medium text-sm leading-relaxed border-2 border-transparent focus:border-indigo-500 transition-all resize-none shadow-inner"
                   />
                </div>
              ))}
           </div>
           
           <div className="pt-10 flex justify-center">
              <button onClick={handleSaveTemplate} className="px-16 py-6 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">Simpan Seluruh Perubahan Naskah</button>
           </div>
        </div>
      )}

      {view === 'FORM' && (
        <div className="animate-scale-in space-y-8">
          <div className="flex items-center gap-4"><button onClick={() => setView('LIST')} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500 hover:text-black dark:hover:text-white cursor-pointer"><X size={20}/></button><h2 className="text-3xl font-black uppercase tracking-tighter">Draft Kontrak Baru</h2></div>
          <div className="bg-white dark:bg-gray-900 p-8 sm:p-12 rounded-[3rem] border shadow-2xl space-y-12">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                   <div className="flex items-center gap-3 text-indigo-600"><Briefcase size={20}/><h4 className="text-sm font-black uppercase tracking-widest">I. Data Karyawan</h4></div>
                   <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700">
                      <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-2">Pilih Staff</label><select value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)} className="w-full bg-white dark:bg-gray-950 rounded-2xl px-5 py-4 font-black text-sm uppercase appearance-none"><option value="">-- PILIH --</option>{employees.filter(e => e.active).map(e => (<option key={e.id} value={e.id}>{e.name}</option>))}</select></div>
                      <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-2">NIK / KTP</label><input value={formData.ktp} onChange={e => setFormData({...formData, ktp: e.target.value})} className="w-full bg-white dark:bg-gray-950 rounded-2xl px-5 py-4 font-black text-sm" /></div>
                      <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-2">TTL</label><input value={formData.birthInfo} onChange={e => setFormData({...formData, birthInfo: e.target.value})} placeholder="Boyolali, 18 November 2002" className="w-full bg-white dark:bg-gray-950 rounded-2xl px-5 py-4 font-bold text-sm" /></div>
                      <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-2">Alamat Lengkap</label><textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-white dark:bg-gray-950 rounded-2xl px-5 py-4 text-xs font-bold h-20 resize-none" /></div>
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="flex items-center gap-3 text-violet-600"><FileSignature size={20}/><h4 className="text-sm font-black uppercase tracking-widest">II. Detail Kontrak</h4></div>
                   <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700">
                      <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-2">Nomor Kontrak</label><input value={formData.contractNo} onChange={e => setFormData({...formData, contractNo: e.target.value})} placeholder="Auto-generated" className="w-full bg-white dark:bg-gray-950 border-2 border-indigo-100 rounded-2xl px-5 py-4 font-black text-sm text-indigo-600" /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-2">Tgl Mulai</label><input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full bg-white dark:bg-gray-950 rounded-2xl px-4 py-4 font-black text-xs" /></div>
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-2">Tgl Berakhir</label><input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full bg-white dark:bg-gray-950 rounded-2xl px-4 py-4 font-black text-xs" /></div>
                      </div>
                      <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-2">Jabatan Dalam Kontrak</label><input value={formData.jobDesc} onChange={e => setFormData({...formData, jobDesc: e.target.value})} className="w-full bg-white dark:bg-gray-950 rounded-2xl px-5 py-4 font-black text-sm uppercase" /></div>
                   </div>
                </div>
             </div>
             <div className="flex flex-col sm:flex-row gap-4"><button onClick={() => { if (!selectedEmpId) return alert('Pilih staff!'); setView('PREVIEW'); }} className="flex-1 py-6 bg-gray-900 text-white rounded-[2rem] font-black uppercase text-[11px] shadow-xl hover:bg-black transition-all cursor-pointer">Pratinjau Dokumen</button><button onClick={handleSaveContract} className="flex-1 py-6 bg-violet-600 text-white rounded-[2rem] font-black uppercase text-[11px] shadow-xl hover:bg-violet-700 cursor-pointer">Simpan & Tutup</button></div>
          </div>
        </div>
      )}

      {view === 'PREVIEW' && selectedEmployee && (
        <div className="animate-fade-in pb-20 no-scrollbar">
          <div className="sticky top-0 z-[60] bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b p-4 flex items-center justify-between no-print shadow-md"><button onClick={() => setView('FORM')} className="flex items-center gap-2 text-gray-500 hover:text-black font-black text-xs uppercase px-4 py-2 rounded-xl cursor-pointer"><X size={20} /> Kembali</button><div className="flex gap-3"><button onClick={handleExport} disabled={isCapturing} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-xl">{isCapturing ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />} SIMPAN JPG</button><button onClick={() => window.print()} className="px-8 py-3 bg-black text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-lg cursor-pointer"><Printer size={18} /> Cetak Kontrak</button></div></div>
          
          <div className="py-10 flex justify-center">
            <div id="official-contract-paper" className="paper-preview bg-white text-black shadow-none border border-gray-100 !p-[25mm] !w-[210mm] !min-h-[297mm]" style={{ fontFamily: '"Times New Roman", Times, serif', color: '#000', lineHeight: '1.4', textAlign: 'justify' }}>
              
              <div className="text-center mb-8">
                 <h1 className="text-[16pt] font-bold uppercase underline decoration-2 underline-offset-4 tracking-tight">SURAT PERJANJIAN KERJA</h1>
                 <p className="text-[12pt] font-bold mt-1">NO. {formData.contractNo}</p>
              </div>

              <div className="text-[11pt] space-y-4">
                 <p>{template.intro}</p>
                 <div className="space-y-1 ml-4">
                    <table className="w-full">
                       <tbody>
                          <tr><td className="w-[140px] align-top">I. Nama</td><td className="w-[10px] align-top">:</td><td className="font-bold">{formData.party1Name}</td></tr>
                          <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Jabatan</td><td className="align-top">:</td><td>{formData.party1Position}</td></tr>
                       </tbody>
                    </table>
                    <p className="mt-2">Dalam hal ini mewakili dan bertindak untuk dan atas nama kedudukan dan untuk selanjutnya disebut <b>Pihak I</b>.</p>
                 </div>

                 <div className="space-y-1 ml-4">
                    <table className="w-full">
                       <tbody>
                          <tr><td className="w-[140px] align-top">II. Nama</td><td className="w-[10px] align-top">:</td><td className="font-bold">{selectedEmployee.name}</td></tr>
                          <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Tgl Lahir</td><td className="align-top">:</td><td>{formData.birthInfo}</td></tr>
                          <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Alamat</td><td className="align-top">:</td><td>{formData.address}</td></tr>
                          <tr><td className="align-top">&nbsp;&nbsp;&nbsp;NIK</td><td className="align-top">:</td><td>{formData.ktp}</td></tr>
                       </tbody>
                    </table>
                    <p className="mt-2">Dalam hal ini bertindak untuk dan atas nama dirinya sendiri, yang selanjutnya disebut <b>Pihak ke II</b>.</p>
                 </div>

                 <p className="mt-4">
                    Pada Hari {getIndonesianDay(formData.startDate)} tanggal, {getIndonesianDate(formData.startDate)} di {formData.contractPlace} telah bersepakat untuk membuat Perjanjian Kerja Dengan Jangka Waktu Tertentu dengan ketentuan-ketentuan sebagaimana tertera di bawah ini :
                 </p>

                 {/* ISI PASAL DINAMIS DARI TEMPLATE */}
                 {[1,2,3,4,5,6,7,8,9,10].map(n => (
                   <React.Fragment key={n}>
                      <div className="text-center font-bold uppercase mt-6 text-[11.5pt]">Pasal {n}</div>
                      <div className="whitespace-pre-line leading-relaxed">
                        {renderPasalText((template as any)[`pasal${n}`])}
                      </div>
                   </React.Fragment>
                 ))}

                 <div className="mt-8 whitespace-pre-line leading-relaxed">
                    {renderPasalText(template.closing)}
                 </div>
              </div>

              <div className="mt-20">
                 <p className="mb-10">{formData.contractPlace}, {getIndonesianDate(formData.startDate)}</p>
                 <div className="grid grid-cols-2 text-center text-[11pt] font-bold uppercase">
                    <div className="flex flex-col items-center">
                       <p className="mb-24">Pihak II</p>
                       <div className="border-b-2 border-black w-3/4 mb-1"></div>
                       <p className="text-sm font-black">{selectedEmployee.name}</p>
                       <p className="text-[9pt] normal-case italic font-medium">Karyawan</p>
                    </div>
                    <div className="flex flex-col items-center">
                       <p className="mb-24">Pihak I</p>
                       <div className="border-b-2 border-black w-3/4 mb-1"></div>
                       <p className="text-sm font-black">{formData.party1Name}</p>
                       <p className="text-[9pt] normal-case italic font-medium">Owner Lembah Manah Kopi</p>
                    </div>
                 </div>
              </div>

              <div className="mt-32 pt-6 border-t border-dashed border-gray-200 text-center opacity-30">
                 <p className="text-[7pt] font-bold uppercase tracking-[0.5em]">LMK DIGITAL LEGAL SYSTEM • VERIFIED SECURE DOCUMENT v2.5</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractGenerator;
