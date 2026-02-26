import React, { useState } from 'react';
import { Settings, Save, Loader2, Lock } from 'lucide-react';
import { BusinessInfo, UserRole } from '../types';
import { storage } from '../services/storageService';

import PasswordSettings from './settings/PasswordSettings';
import AuthoritySettings from './settings/AuthoritySettings';
import IdentitySettings from './settings/IdentitySettings';
import StorageSettings from './settings/StorageSettings';
import LogoSettings from './settings/LogoSettings';
import RecoverySettings from './settings/RecoverySettings';

interface Props {
  businessInfo: BusinessInfo;
  setBusinessInfo: (data: BusinessInfo) => void;
  userRole: UserRole;
  allData: any; 
  onRestore: (data: any) => void; // Added onRestore prop
}

const SettingsView: React.FC<Props> = ({ businessInfo, setBusinessInfo, allData, onRestore }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [rolePasswords, setRolePasswords] = useState<Record<string, string>>(storage.getRolePasswords());

  const handleSaveAll = () => {
    setIsSaving(true);
    storage.setRolePasswords(rolePasswords);
    storage.setBusinessInfo(businessInfo);
    setTimeout(() => {
      setIsSaving(false);
      alert('Seluruh konfigurasi modular berhasil disimpan, Pak!');
    }, 800);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-32 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-gray-900 text-white rounded-[2.5rem] shadow-2xl flex items-center justify-center">
            <Settings size={36} className="animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none mb-2">Pusat Kendali</h1>
            <p className="text-sm text-gray-500 font-medium italic flex items-center gap-2">
              <Lock size={16} className="text-amber-600"/> Arsitektur Modular Digital LMK.
            </p>
          </div>
        </div>
        <button onClick={handleSaveAll} disabled={isSaving} className="px-10 py-5 bg-green-700 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-green-800 transition-all flex items-center gap-3 cursor-pointer">
          {isSaving ? <Loader2 size={20} className="animate-spin"/> : <Save size={20}/>} 
          Simpan Semua Konfigurasi
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-10">
          <PasswordSettings rolePasswords={rolePasswords} setRolePasswords={setRolePasswords} />
          <StorageSettings businessInfo={businessInfo} />
          {/* Recovery khusus Owner/Admin di bawah Storage */}
          <RecoverySettings onRestore={onRestore} />
        </div>
        <div className="space-y-10">
          <IdentitySettings businessInfo={businessInfo} setBusinessInfo={setBusinessInfo} />
          <LogoSettings businessInfo={businessInfo} />
          <AuthoritySettings 
            businessInfo={businessInfo} 
            setBusinessInfo={setBusinessInfo} 
            employees={allData.employees || []} 
          />
        </div>
      </div>
      
      <style>{`
        .animate-spin-slow { animation: spin 10s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default SettingsView;