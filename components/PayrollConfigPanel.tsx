
import React, { useState } from 'react';
import { 
  Settings, X, Save, Clock, Trophy, Filter, Zap, 
  Trash2, PlusCircle, Briefcase, Users, Info, ShieldCheck, Target, 
  ChevronRight, Percent, Coins, Banknote
} from 'lucide-react';

export interface BonusTier {
  revenue: number;
  bonus: number;
}

export interface PayrollSystemSettings {
  otRateManagement: number;
  otRateStaff: number;
  standardWorkDays: number;
  bonusTiers: BonusTier[];
  bonusMultipliers: {
    management: number;
    staff: number;
    dw: number;
  };
  managementKeywords: string;
  staffKeywords: string;
  dwKeywords: string;
  scEligibleKeywords: string;
  bonusEligibleKeywords: string;
}

interface Props {
  settings: PayrollSystemSettings;
  onSave: (newSettings: PayrollSystemSettings) => void;
  onClose: () => void;
}

const PayrollConfigPanel: React.FC<Props> = ({ settings, onSave, onClose }) => {
  const [localSettings, setLocalSettings] = useState<PayrollSystemSettings>({ ...settings });
  const [newTier, setNewTier] = useState({ revenue: '', bonus: '' });

  // Fungsi pembantu untuk memformat input angka ke format ribuan (titik)
  const formatDisplay = (val: string) => {
    const num = val.replace(/[^\d]/g, '');
    return num ? parseInt(num).toLocaleString('id-ID') : '';
  };

  // Fungsi pembantu untuk mengambil nilai asli angka dari string berformat
  const parseRaw = (val: string) => {
    return parseInt(val.replace(/[^\d]/g, '')) || 0;
  };

  const handleAddTier = () => {
    const rev = parseRaw(newTier.revenue);
    const bon = parseRaw(newTier.bonus);
    
    if (rev <= 0 || bon <= 0) {
      return alert('Mohon masukkan nominal omzet dan bonus yang valid!');
    }
    
    // Tambah dan urutkan berdasarkan revenue terkecil
    const updatedTiers = [...localSettings.bonusTiers, { revenue: rev, bonus: bon }]
      .sort((a, b) => a.revenue - b.revenue);
    
    setLocalSettings({ ...localSettings, bonusTiers: updatedTiers });
    setNewTier({ revenue: '', bonus: '' });
  };

  const removeTier = (index: number) => {
    const updated = localSettings.bonusTiers.filter((_, i) => i !== index);
    setLocalSettings({ ...localSettings, bonusTiers: updated });
  };

  const formatCurrency = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center px-4 animate-fade-in no-print">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-6xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-8 sm:p-12 animate-scale-in max-h-[95vh] overflow-y-auto custom-scrollbar border-t-8 border-blue-600">
        
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-[1.5rem] shadow-inner">
              <Settings size={32} />
            </div>
            <div>
              <h3 className="text-3xl font-black uppercase tracking-tighter dark:text-white leading-none">Konfigurasi Sistem Payroll</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Lembah Manah Master Logic Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all">
            <X size={28} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* KOLOM 1: PARAMETER DASAR */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 text-blue-600">
              <Clock size={24} />
              <h4 className="text-lg font-black uppercase tracking-tighter">Lembur & Hari Kerja</h4>
            </div>
            <div className="space-y-5 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Tarif Lembur Mgmt (Rp/Jam)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs">Rp</span>
                  <input 
                    type="text" 
                    value={formatDisplay(localSettings.otRateManagement.toString())} 
                    onChange={e => setLocalSettings({...localSettings, otRateManagement: parseRaw(e.target.value)})} 
                    className="w-full bg-white dark:bg-gray-800 rounded-xl pl-10 pr-4 py-3 font-black text-sm border-2 border-transparent focus:border-blue-600 outline-none shadow-sm transition-all" 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Tarif Lembur Staff (Rp/Jam)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs">Rp</span>
                  <input 
                    type="text" 
                    value={formatDisplay(localSettings.otRateStaff.toString())} 
                    onChange={e => setLocalSettings({...localSettings, otRateStaff: parseRaw(e.target.value)})} 
                    className="w-full bg-white dark:bg-gray-800 rounded-xl pl-10 pr-4 py-3 font-black text-sm border-2 border-transparent focus:border-blue-600 outline-none shadow-sm transition-all" 
                  />
                </div>
              </div>
              <div className="space-y-1.5 pt-4 border-t dark:border-gray-700">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Standar Hari Kerja (Bulan)</label>
                <input type="number" value={localSettings.standardWorkDays} onChange={e => setLocalSettings({...localSettings, standardWorkDays: parseInt(e.target.value) || 26})} className="w-full bg-white dark:bg-gray-800 rounded-xl px-4 py-3 font-black text-sm border-2 border-transparent focus:border-blue-600 outline-none shadow-sm" />
              </div>
            </div>

            <div className="flex items-center gap-3 text-indigo-600 mt-10">
              <Filter size={24} />
              <h4 className="text-lg font-black uppercase tracking-tighter">Klasifikasi Jabatan</h4>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Keywords Manajemen</label>
                <textarea value={localSettings.managementKeywords} onChange={e => setLocalSettings({...localSettings, managementKeywords: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 font-bold text-[10px] resize-none h-16 outline-none border border-transparent focus:border-indigo-400" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Keywords Staff Regular</label>
                <textarea value={localSettings.staffKeywords} onChange={e => setLocalSettings({...localSettings, staffKeywords: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 font-bold text-[10px] resize-none h-16 outline-none border border-transparent focus:border-indigo-400" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Keywords Daily Worker</label>
                <textarea value={localSettings.dwKeywords} onChange={e => setLocalSettings({...localSettings, dwKeywords: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 font-bold text-[10px] resize-none h-16 outline-none border border-transparent focus:border-indigo-400" />
              </div>
            </div>
          </div>

          {/* KOLOM 2: TIERS BONUS (CURRENCY FORMAT ENABLED) */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 text-emerald-600">
              <Trophy size={24} />
              <h4 className="text-lg font-black uppercase tracking-tighter">Target Omzet & Bonus</h4>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 space-y-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Minimum Net Revenue (Target)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs">Rp</span>
                      <input 
                        type="text" 
                        placeholder="Contoh: 200.000.000" 
                        value={newTier.revenue} 
                        onChange={e => setNewTier({...newTier, revenue: formatDisplay(e.target.value)})} 
                        className="w-full bg-white dark:bg-gray-900 rounded-2xl pl-10 pr-4 py-4 text-sm font-black outline-none border-2 border-transparent focus:border-emerald-500 shadow-sm transition-all" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Nominal Bonus Basis</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs">Rp</span>
                      <input 
                        type="text" 
                        placeholder="Contoh: 500.000" 
                        value={newTier.bonus} 
                        onChange={e => setNewTier({...newTier, bonus: formatDisplay(e.target.value)})} 
                        className="w-full bg-white dark:bg-gray-900 rounded-2xl pl-10 pr-4 py-4 text-sm font-black outline-none border-2 border-transparent focus:border-emerald-500 shadow-sm transition-all" 
                      />
                    </div>
                  </div>
                </div>
                <button onClick={handleAddTier} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-lg active:scale-95">
                  <PlusCircle size={18}/> Tambah ke Daftar Target
                </button>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center py-2 border-b dark:border-gray-700">Daftar Tier Aktif</p>
                {localSettings.bonusTiers.map((tier, idx) => (
                  <div key={idx} className="flex items-center gap-3 group">
                    <div className="flex-1 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex justify-between items-center group-hover:border-emerald-300 transition-all shadow-sm">
                      <div className="space-y-0.5">
                        <span className="text-[7px] font-black text-gray-400 uppercase block tracking-tighter">Min. Revenue</span>
                        <span className="text-xs font-black">{formatCurrency(tier.revenue)}</span>
                      </div>
                      <div className="text-right space-y-0.5">
                        <span className="text-[7px] font-black text-emerald-400 uppercase block tracking-tighter">Bonus Basis</span>
                        <span className="text-sm font-black text-emerald-600">{formatCurrency(tier.bonus)}</span>
                      </div>
                    </div>
                    <button onClick={() => removeTier(idx)} className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                  </div>
                ))}
                {localSettings.bonusTiers.length === 0 && (
                  <div className="py-10 text-center opacity-30 italic text-[10px] font-black uppercase">Belum ada target omzet</div>
                )}
              </div>
            </div>
          </div>

          {/* KOLOM 3: PENERIMA & MULTIPLIER */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 text-orange-600">
              <Zap size={24} />
              <h4 className="text-lg font-black uppercase tracking-tighter">Aturan Kelayakan & Bobot</h4>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><ShieldCheck size={12} className="text-blue-500"/> Jabatan Layak Service Charge</label>
                <textarea value={localSettings.scEligibleKeywords} onChange={e => setLocalSettings({...localSettings, scEligibleKeywords: e.target.value})} placeholder="Contoh: barista, waiter..." className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 font-bold text-[10px] resize-none h-16 outline-none border border-transparent focus:border-blue-400" />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Target size={12} className="text-emerald-500"/> Jabatan Layak Bonus Target</label>
                <textarea value={localSettings.bonusEligibleKeywords} onChange={e => setLocalSettings({...localSettings, bonusEligibleKeywords: e.target.value})} placeholder="Contoh: cook, runner..." className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 font-bold text-[10px] resize-none h-16 outline-none border border-transparent focus:border-emerald-400" />
              </div>

              <div className="pt-6 border-t dark:border-gray-700 space-y-4">
                <label className="text-[11px] font-black uppercase tracking-tighter dark:text-white">Pengali (Multiplier) Bonus</label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { key: 'management', label: 'Management', icon: <Briefcase size={16}/>, color: 'blue' },
                    { key: 'staff', label: 'Staff Regular', icon: <Users size={16}/>, color: 'emerald' },
                    { key: 'dw', label: 'Daily Worker', icon: <Clock size={16}/>, color: 'orange' }
                  ].map(m => (
                    <div key={m.key} className={`flex items-center justify-between p-4 bg-${m.color}-50 dark:bg-${m.color}-900/20 rounded-2xl border border-${m.color}-100 dark:border-${m.color}-800`}>
                      <div className="flex items-center gap-2">
                        <div className={`text-${m.color}-600`}>{m.icon}</div>
                        <span className="text-[10px] font-black uppercase">{m.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" step="0.1" 
                          value={(localSettings.bonusMultipliers as any)[m.key]} 
                          onChange={e => setLocalSettings({
                            ...localSettings, 
                            bonusMultipliers: { ...localSettings.bonusMultipliers, [m.key]: parseFloat(e.target.value) || 0 }
                          })} 
                          className="w-16 bg-white dark:bg-gray-800 border-none rounded-lg px-2 py-1 text-center font-black text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                        />
                        <span className="text-[10px] font-black text-gray-400">X</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-10 border-t dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/30 px-6 py-4 rounded-2xl max-w-2xl border border-blue-100 dark:border-blue-900/40">
            <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase leading-relaxed italic">
              <b>Catatan Sistem:</b> Setiap perubahan parameter di sini akan langsung dikalibrasi ulang ke seluruh data payroll berjalan. Pastikan nominal target sudah sesuai dengan strategi operasional.
            </p>
          </div>
          <button onClick={() => onSave(localSettings)} className="w-full sm:w-auto px-12 py-5 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:scale-95">
            <Save size={20}/> Terapkan Konfigurasi Baru
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayrollConfigPanel;
