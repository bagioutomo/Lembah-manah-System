import React from 'react';
import { ImageIcon, Lock } from 'lucide-react';
import { BusinessInfo } from '../../types';

interface Props {
  businessInfo: BusinessInfo;
}

const LogoSettings: React.FC<Props> = ({ businessInfo }) => {
  const assets = [
    { label: 'Favicon (Tab Browser)', value: './favicon.png' },
    { label: 'Logo Sidebar', value: businessInfo.sidebarLogoUrl || './favicon.png' },
    { label: 'Logo Laporan (Receipt)', value: businessInfo.logoUrl || './favicon.png' },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-xl p-10 space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl shadow-sm"><ImageIcon size={24}/></div>
        <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Aset Logo & Branding</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {assets.map((asset, i) => (
          <div key={i} className="space-y-1.5 opacity-70">
            <label className="text-[8px] font-black text-gray-400 uppercase ml-2 flex items-center gap-1">
              <Lock size={8}/> {asset.label}
            </label>
            <input 
              value={asset.value} 
              readOnly 
              className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 font-mono text-[9px] text-gray-400 cursor-not-allowed border border-transparent" 
            />
          </div>
        ))}
      </div>
      <p className="text-[8px] font-medium text-gray-400 italic px-2">
        *URL aset dikunci. Ganti file fisik di server dengan nama yang sama untuk memperbarui visual.
      </p>
    </div>
  );
};

export default LogoSettings;