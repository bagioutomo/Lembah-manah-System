import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff } from 'lucide-react';

interface Props {
  rolePasswords: Record<string, string>;
  setRolePasswords: (data: Record<string, string>) => void;
}

const PasswordSettings: React.FC<Props> = ({ rolePasswords, setRolePasswords }) => {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const toggleVisibility = (role: string) => {
    setShowPasswords(prev => ({ ...prev, [role]: !prev[role] }));
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-xl p-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 rounded-2xl shadow-sm"><KeyRound size={24}/></div>
        <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">PIN Akses Terminal</h3>
      </div>
      <div className="space-y-3">
        {Object.keys(rolePasswords).map((role) => (
          <div key={role} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-transparent hover:border-amber-200 transition-all">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{role}</span>
            <div className="relative">
              <input 
                type={showPasswords[role] ? "text" : "password"}
                value={rolePasswords[role]}
                onChange={(e) => setRolePasswords({...rolePasswords, [role]: e.target.value})}
                className="bg-transparent border-none outline-none font-black text-right tracking-widest w-24 text-gray-900 dark:text-white" 
              />
              <button onClick={() => toggleVisibility(role)} className="absolute -right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-amber-500">
                {showPasswords[role] ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordSettings;