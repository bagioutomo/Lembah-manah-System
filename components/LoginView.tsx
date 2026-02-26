
import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight, 
  ChevronRight, 
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserRole } from '../types';
import { storage } from '../services/storageService';

interface Props {
  onLogin: (role: UserRole) => void;
}

const LoginView: React.FC<Props> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Security: Brute Force Protection
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isLocked && lockTimer > 0) {
      interval = setInterval(() => {
        setLockTimer(prev => prev - 1);
      }, 1000);
    } else if (lockTimer === 0) {
      setIsLocked(false);
      setAttempts(0);
    }
    return () => clearInterval(interval);
  }, [isLocked, lockTimer]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const inputPin = password.trim();
    if (isLocked || !inputPin) return;

    setLoading(true);
    setError('');

    // Secure verification delay
    setTimeout(() => {
      const passwords = storage.getRolePasswords();
      const roles: UserRole[] = ['OWNER', 'ADMIN', 'PURCHASING', 'SUPERVISOR', 'MANAGER'];
      
      // Strict password checking to avoid bypass
      const foundRole = roles.find(role => {
        const rolePin = (passwords[role] || "").toString().trim();
        return rolePin !== "" && rolePin === inputPin;
      });

      if (foundRole) {
        onLogin(foundRole);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          setIsLocked(true);
          setLockTimer(60); // Locked for 1 minute on failure
          setError('Akses Diblokir: Terlalu banyak percobaan.');
        } else {
          setError(`PIN SALAH! Sisa ${3 - newAttempts} percobaan.`);
        }
        
        setLoading(false);
        setPassword('');
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-50 font-sans">
      
      {/* CLEAN BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-100 via-white to-gray-200">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
      </div>

      {/* TOP NAVIGATION STYLE */}
      <div className="absolute top-8 left-8 z-20 hidden sm:block">
         <button className="flex items-center gap-2 text-gray-400 font-bold text-[11px] uppercase tracking-widest hover:text-gray-900 transition-colors">
            <ChevronRight className="rotate-180" size={16} /> Home page
         </button>
      </div>

      {/* MAIN LOGIN CARD */}
      <div className="relative z-10 w-full max-w-[480px] px-6 animate-slide-up">
        
        {/* BRAND TEXT AREA */}
        <div className="flex flex-col items-center mb-8">
           <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-[0.4em] text-gray-400 uppercase">Lembah Manah</span>
           </div>
        </div>

        {/* THE WHITE CARD */}
        <div className="bg-white rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] p-10 sm:p-14 border border-white">
           
           {/* TEXT HEADER */}
           <div className="text-center mb-10">
              <p className="text-[10px] font-black text-green-700 uppercase tracking-[0.3em] mb-3">
                 Lembah Manah Management System
              </p>
              <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-2">
                 Selamat Datang!
              </h1>
              <p className="text-sm text-gray-400 font-medium leading-relaxed">
                 Silakan masukkan kode PIN akses Anda untuk melanjutkan ke dashboard.
              </p>
           </div>

           {/* FORM AREA */}
           <form onSubmit={handleLogin} className="space-y-8">
              
              {/* PIN INPUT GROUP */}
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Authentication PIN</label>
                 <div className="relative group">
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      autoFocus
                      disabled={isLocked || loading}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isLocked ? `WAIT ${lockTimer}s` : "Masukkan PIN Anda"}
                      className={`w-full bg-gray-50 border-2 rounded-2xl px-6 py-4.5 outline-none font-bold text-sm transition-all shadow-inner placeholder:text-gray-300 ${
                        isLocked 
                        ? 'border-red-500/20 text-red-500' 
                        : 'border-gray-100 focus:border-green-700 focus:bg-white text-gray-900'
                      }`}
                    />
                    <button 
                       type="button"
                       onClick={() => setShowPassword(!showPassword)}
                       className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
                    >
                       {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                 </div>
                 
                 {error && (
                    <div className="flex items-center gap-2 mt-2 px-2 text-[10px] font-bold text-red-500 uppercase animate-pulse">
                       <AlertCircle size={14} />
                       {error}
                    </div>
                 )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="space-y-4">
                 <button 
                   type="submit"
                   disabled={loading || isLocked || !password.trim()}
                   className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.15em] text-[11px] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30 group ${
                     isLocked ? 'bg-red-600 text-white' : 'bg-green-700 text-white hover:bg-green-800 hover:shadow-green-700/30'
                   }`}
                 >
                   {loading ? (
                     <Loader2 size={18} className="animate-spin" />
                   ) : isLocked ? (
                     'SISTEM TERKUNCI'
                   ) : (
                     <>
                       Masuk Dashboard <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                     </>
                   )}
                 </button>
              </div>
           </form>
        </div>

        {/* SECURITY INFO (Floating below card) */}
        <div className="mt-10 flex flex-col items-center gap-4 opacity-40">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5">
                 <ShieldCheck size={14} className="text-gray-900" />
                 <span className="text-[8px] font-black uppercase tracking-widest text-gray-900">Encrypted</span>
              </div>
              <div className="flex items-center gap-1.5">
                 <CheckCircle2 size={14} className="text-gray-900" />
                 <span className="text-[8px] font-black uppercase tracking-widest text-gray-900">Secure Node</span>
              </div>
           </div>
           <p className="text-[7px] font-bold text-gray-400 uppercase tracking-[0.5em]">
              LEMBAH MANAH DIGITAL INFRASTRUCTURE v2.5.0
           </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
