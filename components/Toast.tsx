
import React from 'react';

interface ToastProps {
  message: string | null;
}

const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] animate-bounce-in pointer-events-none">
       <div className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl shadow-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-white/10 dark:border-black/10 backdrop-blur-md">
          {message}
       </div>
    </div>
  );
};

export default Toast;
