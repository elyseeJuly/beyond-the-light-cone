import React from 'react';
import { BookOpen, X } from 'lucide-react';
import { TimelineComparisonPanel } from './TimelineComparisonPanel';

interface Props {
  onClose: () => void;
}

export const ChroniclesModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[250] bg-slate-950/98 overflow-y-auto flex justify-center p-6 md:p-12 animate-in fade-in duration-300">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />

      <div className="w-full max-w-6xl relative z-10 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-widest text-white uppercase italic">
                岁月史书
              </h1>
              <p className="text-white/40 text-sm tracking-wide mt-1">
                Chronicles of Time // 双轨纪元：原著编年史与本局真实发展履历对照
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-3 bg-white/5 border border-white/10 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer pointer-events-auto"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pb-12 flex justify-center">
          <TimelineComparisonPanel />
        </div>
      </div>
    </div>
  );
};
