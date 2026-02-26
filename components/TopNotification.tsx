import React, { useEffect, useState, useRef } from 'react';
import { X, Zap, BellRing, AlertCircle, Volume2 } from 'lucide-react';
import { DashboardTask } from '../types';

interface Props {
  task: DashboardTask | null;
  onClose: () => void;
}

const TopNotification: React.FC<Props> = ({ task, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (task) {
      // Menggunakan suara sirene yang lebih berisik/nyaring
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3');
      audio.loop = true;
      audio.volume = 1.0; // Volume maksimal
      audioRef.current = audio;

      const openTimer = setTimeout(() => {
        setIsVisible(true);
        audio.play().catch(() => {
          console.log("Autoplay diblokir browser. Bapak harus interaksi (klik) layar dulu sekali.");
        });
      }, 100);

      // Trigger Getar pada HP (jika didukung)
      if ('vibrate' in navigator) {
        navigator.vibrate([500, 200, 500, 200, 500, 200, 500]); 
      }

      // Sembunyikan otomatis setelah 15 detik jika tidak direspon
      const hideTimer = setTimeout(() => {
        handleDismiss();
      }, 15000);

      return () => {
        clearTimeout(openTimer);
        clearTimeout(hideTimer);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      };
    }
  }, [task]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    // Beri jeda animasi sebelum benar-benar null di parent
    setTimeout(onClose, 500);
  };

  if (!task) return null;

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[10000] w-[94%] max-w-lg transition-all duration-700 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-60 opacity-0 scale-90'}`}>
      <div className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-3xl border-b-8 border-red-600 shadow-[0_40px_100px_-15px_rgba(220,38,38,0.7)] rounded-[3rem] p-8 flex items-center gap-6 relative overflow-hidden group">
        
        {/* Layer Background Danger Pulse */}
        <div className="absolute inset-0 bg-red-600/10 animate-pulse"></div>
        
        {/* Animated Icon Container */}
        <div className="w-16 h-16 bg-red-600 text-white rounded-3xl flex items-center justify-center shrink-0 shadow-2xl shadow-red-500/40 relative z-10 animate-shake-strong">
           <BellRing size={32} />
        </div>

        <div className="flex-1 min-w-0 relative z-10">
          <div className="flex items-center gap-3 mb-2">
             <div className="px-3 py-1 bg-red-600 text-white text-[8px] font-black uppercase tracking-[0.3em] rounded-full animate-pulse shadow-sm">
                INSTRUKSI DARURAT
             </div>
             <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></div>
          </div>
          <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase truncate tracking-tighter leading-none mb-1">
            {task.text}
          </h4>
          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2 italic">
            <Volume2 size={12} className="text-red-500 animate-pulse"/> SEGERA TINDAK LANJUTI & SELESAIKAN!
          </p>
        </div>

        <button 
          onClick={handleDismiss}
          className="p-4 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full text-gray-400 hover:text-red-600 transition-all relative z-10 active:scale-90"
        >
          <X size={24} strokeWidth={3} />
        </button>
      </div>

      <style>{`
        @keyframes shake-strong {
          0%, 100% { transform: rotate(0deg) scale(1); }
          10% { transform: rotate(15deg) scale(1.1); }
          20% { transform: rotate(-15deg) scale(1.1); }
          30% { transform: rotate(15deg) scale(1.1); }
          40% { transform: rotate(-15deg) scale(1.1); }
          50% { transform: rotate(0deg) scale(1); }
        }
        .animate-shake-strong {
          animation: shake-strong 0.8s infinite;
        }
      `}</style>
    </div>
  );
};

export default TopNotification;