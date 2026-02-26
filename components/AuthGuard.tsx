
import React from 'react';
import LoginView from './LoginView';
import { UserRole } from '../types';
import { storage } from '../services/storageService';

interface Props {
  userRole: UserRole | null;
  setUserRole: (role: UserRole | null) => void;
  isDataLoaded: boolean;
  children: React.ReactNode;
}

const AuthGuard: React.FC<Props> = ({ userRole, setUserRole, isDataLoaded, children }) => {
  if (!userRole) {
    return (
      <LoginView 
        onLogin={(role) => { 
          setUserRole(role); 
          storage.setUserRole(role); 
        }} 
      />
    );
  }

  if (!isDataLoaded) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-black p-10 text-center">
         <div className="w-20 h-20 border-4 border-emerald-600 rounded-full animate-spin border-t-transparent mb-8"></div>
         <h1 className="text-2xl font-black uppercase tracking-[0.4em] text-gray-900 dark:text-white">Sinkronisasi Awan</h1>
         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4 animate-pulse italic">Menghubungkan ke 5 titik cadangan...</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
