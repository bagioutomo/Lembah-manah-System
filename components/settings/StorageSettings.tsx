import React from 'react';
import { Cloud, Lock, Database, FileSpreadsheet, Share2, Globe, Info, Flame, CheckCircle2, AlertCircle } from 'lucide-react';
import { BusinessInfo } from '../../types';

interface Props {
  businessInfo: BusinessInfo;
}

const StorageSettings: React.FC<Props> = ({ businessInfo }) => {
  const isFirebaseSet = businessInfo.firebaseUrl && !businessInfo.firebaseUrl.includes("FIREBASE_URL");
  const isDriveSet = businessInfo.gdriveJsonUrl && !businessInfo.gdriveJsonUrl.includes("URL_GAS");

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-xl p-10 space-y-8">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 rounded-2xl shadow-sm"><Cloud size={24}/></div>
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Arsitektur Data</h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Multi-Layer Mirroring System</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* DATABASE UTAMA */}
        <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
              <Database size={12}/> 1. Utama (Primary)
            </span>
            <span className="text-[8px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded">SUPABASE CLOUD</span>
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black text-gray-400 uppercase ml-2 tracking-widest flex items-center gap-1"><Lock size={8}/> Endpoint API Utama</label>
            <input value={businessInfo.cloudApiUrl} readOnly className="w-full bg-white dark:bg-gray-800 rounded-xl px-4 py-2.5 text-[9px] font-mono text-gray-500 cursor-not-allowed border-none shadow-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CERMIN 1 */}
          <div className={`p-5 rounded-2xl border-2 transition-all space-y-3 ${isDriveSet ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800' : 'bg-gray-50 border-transparent dark:bg-gray-800/50'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${isDriveSet ? 'text-blue-600' : 'text-gray-500'}`}>
                <Share2 size={12}/> Cermin 1
              </span>
              <span className="text-[7px] font-black text-gray-400 uppercase">G-SHEETS JSON</span>
            </div>
            <div className="w-full bg-white dark:bg-gray-900 rounded-lg px-4 py-2 text-[8px] font-mono text-gray-400 truncate">
               {businessInfo.gdriveJsonUrl || 'Belum Seting'}
            </div>
          </div>

          {/* CERMIN 2 */}
          <div className={`p-5 rounded-2xl border-2 transition-all space-y-3 ${isDriveSet ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/10 dark:border-indigo-800' : 'bg-gray-50 border-transparent dark:bg-gray-800/50'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${isDriveSet ? 'text-indigo-600' : 'text-gray-500'}`}>
                <Database size={12}/> Cermin 2
              </span>
              <span className="text-[7px] font-black text-gray-400 uppercase">DRIVE SNAPSHOT</span>
            </div>
            <div className="w-full bg-white dark:bg-gray-900 rounded-lg px-4 py-2 text-[8px] font-mono text-gray-400 truncate">
               {isDriveSet ? 'SINKRONISASI AKTIF' : 'Belum Seting'}
            </div>
          </div>

          {/* CERMIN 3 */}
          <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Globe size={12}/> Cermin 3
              </span>
              <span className="text-[7px] font-black text-gray-400 uppercase">MYSQL BRIDGE</span>
            </div>
            <input value={businessInfo.mysqlApiUrl || 'BELUM SETING'} readOnly className="w-full bg-white dark:bg-gray-900 rounded-lg px-4 py-2 text-[8px] font-mono text-gray-400 border-none truncate" />
          </div>

          {/* CERMIN 4 - FIREBASE STATUS */}
          <div className={`p-5 rounded-2xl border-2 transition-all space-y-3 ${isFirebaseSet ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800' : 'bg-gray-50 border-transparent dark:bg-gray-800/50'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${isFirebaseSet ? 'text-orange-600' : 'text-gray-500'}`}>
                <Flame size={12} /> Cermin 4
              </span>
              {isFirebaseSet ? <CheckCircle2 size={10} className="text-emerald-500"/> : <AlertCircle size={10} className="text-gray-300"/>}
            </div>
            <div className="w-full bg-white dark:bg-gray-900 rounded-lg px-4 py-2 text-[8px] font-mono text-gray-400 truncate">
               {businessInfo.firebaseUrl || 'Belum Seting'}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border-2 border-dashed border-amber-100 dark:border-amber-900 flex gap-3">
        <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-700 dark:text-amber-500 font-medium leading-relaxed italic">
          Data cadangan terbagi ke 4 penjuru. <b>Cermin 1 & 2</b> memastikan Bapak punya salinan file di Google Drive yang bisa dibuka kapan saja tanpa aplikasi.
        </p>
      </div>
    </div>
  );
};

export default StorageSettings;