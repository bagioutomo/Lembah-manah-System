
import React, { useMemo, useState } from 'react';
import { Building, Flame, Share2, CheckCircle2, XCircle, Info, ShieldAlert, Loader2, Zap, AlertTriangle, Server, Database, FileSpreadsheet } from 'lucide-react';
import { BusinessInfo } from '../../types';
import { storage } from '../../services/storageService';

interface Props {
  businessInfo: BusinessInfo;
  setBusinessInfo: (data: BusinessInfo) => void;
}

const IdentitySettings: React.FC<Props> = ({ businessInfo, setBusinessInfo }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'NONE' | 'SUCCESS' | 'ERROR'>('NONE');
  
  const fbStatus = useMemo(() => {
    const url = (businessInfo.firebaseUrl || "").trim();
    if (!url || url.includes("ISI_URL_FIREBASE")) return 'EMPTY';
    
    // Syarat Firebase Database URL yang benar
    const isFirebaseDomain = url.includes(".firebaseio.com") || url.includes("firebasedatabase.app");
    
    if (isFirebaseDomain) return 'PERFECT';
    if (url.length > 5) return 'PARTIAL';
    return 'EMPTY';
  }, [businessInfo.firebaseUrl]);

  const handleTestConnection = async () => {
    if (!businessInfo.firebaseUrl || fbStatus === 'EMPTY') return alert("Masukkan URL Firebase dulu Pak.");
    
    setIsTesting(true);
    setTestResult('NONE');
    
    const success = await storage.testFirebaseConnection(businessInfo.firebaseUrl);
    
    setIsTesting(false);
    setTestResult(success ? 'SUCCESS' : 'ERROR');
    
    if (success) {
      alert("MANTAP PAK! Koneksi Firebase Berhasil. Alamat sudah benar dan pintu database sudah dibuka.");
    } else {
      alert("WADUH PAK, MASIH GAGAL. Kemungkinan URL salah ketik atau Bapak belum klik tombol 'PUBLISH' di menu Rules Firebase.");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-xl p-10 space-y-8">
      <div className="flex items-center gap-4 mb-2">
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-2xl shadow-sm"><Building size={24}/></div>
        <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Identitas & Koneksi</h3>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Nama Entitas Bisnis</label>
          <input 
            value={businessInfo.name} 
            onChange={e => setBusinessInfo({...businessInfo, name: e.target.value.toUpperCase()})} 
            className="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl px-6 py-4 outline-none font-black text-sm border-2 border-transparent focus:border-blue-600 transition-all shadow-inner dark:text-white" 
            placeholder="NAMA CAFE/RESTO..."
          />
        </div>

        <div className="pt-6 border-t dark:border-gray-800 space-y-8">
           {/* CERMIN 1 */}
           <div className="space-y-3">
              <div className="flex items-center gap-2 text-indigo-600">
                <Share2 size={16} />
                <h4 className="text-xs font-black uppercase tracking-widest">Cermin 1 (Google Sheets)</h4>
              </div>
              <input 
                value={businessInfo.gdriveSheetUrl || ''} 
                onChange={e => setBusinessInfo({...businessInfo, gdriveSheetUrl: e.target.value.trim()})} 
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl px-6 py-4 outline-none font-mono text-[10px] text-blue-700 border-2 border-transparent focus:border-blue-500 shadow-inner"
              />
           </div>

           {/* CERMIN 2 */}
           <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-600">
                <Database size={16} />
                <h4 className="text-xs font-black uppercase tracking-widest">Cermin 2 (Drive Snapshot JSON)</h4>
              </div>
              <input 
                value={businessInfo.gdriveJsonUrl || ''} 
                onChange={e => setBusinessInfo({...businessInfo, gdriveJsonUrl: e.target.value.trim()})} 
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl px-6 py-4 outline-none font-mono text-[10px] text-blue-700 border-2 border-transparent focus:border-blue-500 shadow-inner"
              />
           </div>

           {/* CERMIN 5 - EXCEL AUTO-REPORTING (BARU) */}
           <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <FileSpreadsheet size={16} />
                <h4 className="text-xs font-black uppercase tracking-widest">Cermin 5 (Excel Auto-Reporting)</h4>
              </div>
              <input 
                value={businessInfo.gdriveExcelUrl || ''} 
                onChange={e => setBusinessInfo({...businessInfo, gdriveExcelUrl: e.target.value.trim()})} 
                placeholder="Bisa gunakan URL yang sama dengan Cermin 1 atau 2"
                className="w-full bg-emerald-50/30 dark:bg-emerald-900/10 rounded-2xl px-6 py-4 outline-none font-mono text-[10px] text-emerald-700 border-2 border-transparent focus:border-emerald-500 shadow-inner"
              />
              <p className="px-4 text-[9px] font-bold text-gray-400 italic">Ini digunakan untuk mengirim file Excel backup harian ke folder Google Drive Bapak.</p>
           </div>

           {/* CERMIN 3 */}
           <div className="space-y-3">
              <div className="flex items-center gap-2 text-indigo-700">
                <Server size={16} />
                <h4 className="text-xs font-black uppercase tracking-widest">Cermin 3 (MySQL Relational Bridge)</h4>
              </div>
              <input 
                value={businessInfo.mysqlApiUrl || ''} 
                onChange={e => setBusinessInfo({...businessInfo, mysqlApiUrl: e.target.value.trim()})} 
                placeholder="https://lembahmanah.com/api_lembah.php"
                className="w-full bg-indigo-50/30 dark:bg-indigo-900/10 rounded-2xl px-6 py-4 outline-none font-mono text-[10px] text-indigo-700 border-2 border-transparent focus:border-indigo-500 shadow-inner"
              />
           </div>

           {/* CERMIN 4 */}
           <div className="pt-4 border-t dark:border-gray-800 space-y-4">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-orange-600">
                    <Flame size={16} />
                    <h4 className="text-xs font-black uppercase tracking-widest">Cermin 4 (Firebase Realtime)</h4>
                 </div>
                 <div className="flex gap-2">
                    {testResult === 'SUCCESS' ? (
                      <span className="flex items-center gap-1 text-emerald-500 text-[9px] font-black uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 animate-fade-in"><CheckCircle2 size={12}/> Koneksi Oke</span>
                    ) : testResult === 'ERROR' ? (
                      <span className="flex items-center gap-1 text-rose-500 text-[9px] font-black uppercase tracking-widest bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 animate-shake"><XCircle size={12}/> Gagal Terhubung</span>
                    ) : (
                      <span className="flex items-center gap-1 text-blue-500 text-[9px] font-black uppercase tracking-widest animate-pulse"><Zap size={12}/> Siap Tes</span>
                    )}
                 </div>
              </div>
              
              <div className="flex gap-2">
                <input 
                   value={businessInfo.firebaseUrl || ''} 
                   onChange={e => {
                     setBusinessInfo({...businessInfo, firebaseUrl: e.target.value.trim()});
                     setTestResult('NONE');
                   }} 
                   placeholder="https://projek-bapak.firebaseio.com/"
                   className={`flex-1 bg-orange-50/30 dark:bg-orange-950/20 rounded-2xl px-6 py-4 outline-none font-mono text-[11px] transition-all border-2 ${
                     testResult === 'SUCCESS' ? 'border-emerald-500 text-orange-700' : testResult === 'ERROR' ? 'border-rose-500' : 'border-gray-100'
                   } shadow-inner`}
                />
                <button 
                  onClick={handleTestConnection}
                  disabled={isTesting || fbStatus === 'EMPTY'}
                  className="px-6 bg-orange-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-orange-700 disabled:opacity-30 active:scale-95 transition-all cursor-pointer"
                >
                  {isTesting ? <Loader2 size={18} className="animate-spin"/> : 'Tes Koneksi'}
                </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default IdentitySettings;
