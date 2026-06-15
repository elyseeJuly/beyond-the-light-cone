import React from 'react';
import { BookOpen, X, Clock } from 'lucide-react';
import { EndingCollectionGrid } from './ending/EndingCollectionGrid';
import { SaveManager } from '../core/SaveManager';

interface Props {
  onClose: () => void;
}

export const MuseumGallery: React.FC<Props> = ({ onClose }) => {
  const history = SaveManager.getEndingHistory();

  return (
    <div className="fixed inset-0 z-[250] bg-slate-950/98 overflow-y-auto flex justify-center p-6 md:p-12 animate-in fade-in duration-300">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />

      <div className="w-full max-w-6xl relative z-10 flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-widest text-white uppercase italic">
                岁月史书 · 独立画廊
              </h1>
              <p className="text-white/40 text-sm tracking-wide mt-1">
                Museum Gallery // 记录平行宇宙中人类文明的纪元终章与属性馈赠
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

        {/* Ending Collection Grid */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-white/80 font-mono text-sm uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>结局收集与加成契约</span>
          </div>
          <EndingCollectionGrid />
        </section>

        {/* Ending Chronicles History List */}
        <section className="space-y-4 pb-12">
          <div className="flex items-center gap-2 text-white/80 font-mono text-sm uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span>历史编年通关履历</span>
          </div>

          {history.length === 0 ? (
            <div className="p-8 border border-white/5 bg-white/[0.01] rounded-xl text-center">
              <Clock className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-white/40 text-sm italic">暂无历史通关记录，请带领先驱们完成首个结局。</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...history].reverse().map((record, idx) => {
                const epochLabels = ['危机纪元', '威慑纪元', '广播纪元', '掩体纪元', '银河纪元'];
                const epochName = epochLabels[record.epoch] || '未知纪元';
                const isVic = record.victoryType !== null;

                return (
                  <div 
                    key={idx} 
                    className="flex flex-col md:flex-row md:items-center justify-between p-4.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold border ${
                        isVic 
                          ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                          : 'bg-red-500/10 border-red-500/30 text-red-400'
                      }`}>
                        {isVic ? '✓' : '✗'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{record.label}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-normal ${
                            isVic ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                          }`}>
                            {isVic ? 'VICTORY' : 'DEFEAT'}
                          </span>
                        </div>
                        <div className="text-[10px] text-white/40 mt-1 font-mono">
                          达成时间：{new Date(record.timestamp).toLocaleString()} | 纪元历程：{epochName} {record.year} 年
                        </div>
                      </div>
                    </div>

                    {record.keyFlags && record.keyFlags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {record.keyFlags.map((flag, fIdx) => (
                          <span 
                            key={fIdx} 
                            className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/5 text-white/50"
                          >
                            {flag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
