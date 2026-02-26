
import React from 'react';
import { X, ChevronLeft, Key, LogOut } from 'lucide-react';
import { UserRole } from '../types';

interface UserModalProps {
  show: boolean;
  onClose: () => void;
  userRole: UserRole;
  authTarget: UserRole | null;
  setAuthTarget: (role: UserRole | null) => void;
  passAttempt: string;
  setPassAttempt: (val: string) => void;
  confirmSwitchUser: (target: UserRole) => void;
  onLogout: () => void;
}

const UserModal: React.FC<UserModalProps> = ({
  show, onClose, userRole, authTarget, setAuthTarget, 
  passAttempt, setPassAttempt, confirmSwitchUser, onLogout
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 animate-fade-in">
       <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
       <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-[3rem] p-10 animate-scale-in border-t-8 border-green-700 shadow-2xl text-center">
          
          {!authTarget ? (
             <div className="text-center">
                <h3 className="text-2xl font-extrabold uppercase tracking-tight mb-8 dark:text-white">Pilih Terminal</h3>
                <div className="space-y-3">
                   {(['OWNER', 'ADMIN', 'SUPERVISOR', 'PURCHASING', 'MANAGER'] as UserRole[]).map(role => (
                      <button 
                        key={role} 
                        onClick={() => setAuthTarget(role)} 
                        className={`w-full p-4.5 rounded-2xl font-bold text-[12px] uppercase tracking-widest transition-all shadow-sm active:scale-95 ${userRole === role ? 'bg-green-700 text-white' : 'bg-gray-50 dark:bg-gray-800 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-gray-700'}`}
                      >
                         {role}
                      </button>
                   ))}
                   <div className="pt-6 mt-6 border-t dark:border-gray-800">
                      <button onClick={onLogout} className="w-full p-4.5 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 font-bold text-[12px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2">
                         <LogOut size={18}/> Logout System
                      </button>
                   </div>
                </div>
             </div>
          ) : (
             <div className="animate-fade-in text-left">
                <button onClick={() => { setAuthTarget(null); setPassAttempt(''); }} className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase mb-6 hover:text-green-700 transition-colors">
                   <ChevronLeft size={16}/> Kembali
                </button>
                <div className="text-center mb-8">
                   <div className="w-16 h-16 bg-green-50 dark:bg-green-900/30 text-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                      <Key size={32}/>
                   </div>
                   <h3 className="text-xl font-extrabold uppercase tracking-tight text-gray-900 dark:text-white">PIN Keamanan</h3>
                   <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mt-1">Terminal: {authTarget}</p>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); confirmSwitchUser(authTarget); }} className="space-y-6">
                   <input 
                      type="password" 
                      autoFocus
                      placeholder="••••"
                      value={passAttempt}
                      onChange={(e) => setPassAttempt(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-green-700 rounded-2xl px-6 py-4 outline-none font-bold text-center tracking-[0.5em] transition-all text-xl dark:text-white"
                   />
                   <button type="submit" className="w-full py-4.5 bg-green-700 text-white rounded-2xl font-bold uppercase tracking-wider text-[11px] shadow-xl hover:bg-green-800 active:scale-95 transition-all">Verifikasi & Masuk</button>
                </form>
             </div>
          )}

       </div>
    </div>
  );
};

export default UserModal;
