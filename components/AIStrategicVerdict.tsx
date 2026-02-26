
import React from 'react';
import { BrainCircuit, Loader2, ShieldCheck, Zap } from 'lucide-react';

interface Props {
  isLoading: boolean;
  analysis: string;
}

const AIStrategicVerdict: React.FC<Props> = ({ isLoading, analysis }) => {
  return (
    <div className="bg-gray-900 rounded-[4rem] p-12 lg:p-16 text-white shadow-2xl relative overflow-hidden group border-4 border-emerald-500/30">
      <div className="absolute top-0 right-0 p-16 opacity-10 rotate-12 transition-transform duration-1000 group-hover:scale-150 group-hover:rotate-[25deg]"><BrainCircuit size={300} className="text-emerald-500" /></div>
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-12">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-[2.5rem] flex items-center justify-center text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <Zap size={36} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-4xl font-black uppercase tracking-tighter leading-none mb-2">Audit Strategis AI</h3>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">Analisis Neural Aktif</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic leading-none">Didukung oleh Gemini 3 Flash</span>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center gap-6 animate-pulse">
            <Loader2 size={64} className="animate-spin text-emerald-500 opacity-40" />
            <p className="text-xs font-black uppercase tracking-[0.8em] text-emerald-500">Memproses Data Besar...</p>
          </div>
        ) : (
          <div className="text-xl font-medium leading-relaxed italic text-gray-200 border-l-4 border-emerald-500/50 pl-10 space-y-6">
            {analysis.split('\n').filter(l => l.trim()).map((line, i) => (
              <p key={i} className="animate-fade-in" style={{ animationDelay: `${i * 200}ms` }}>{line}</p>
            ))}
          </div>
        )}

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 text-emerald-400">
            <ShieldCheck size={20}/>
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Saran Finansial Mandiri</span>
          </div>
          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">Mesin Kecerdasan v2.5.0</p>
        </div>
      </div>
    </div>
  );
};

export default AIStrategicVerdict;
