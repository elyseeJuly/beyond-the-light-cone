import React, { useEffect } from 'react';
import { Cpu, Award } from 'lucide-react';
import { GameInstance } from '../core/Game';
import { t } from '../utils/i18n';

interface TechUnlockModalProps {
  tech: {
    name: string;
    treeType: string;
  };
  onClose: () => void;
}

export const TechUnlockModal: React.FC<TechUnlockModalProps> = ({ tech, onClose }) => {
  const game = GameInstance.get();

  // Find description of the technology
  let desc = "";
  if (game && game.earthCivi && game.earthCivi.tecTreeManager) {
    for (const tree of game.earthCivi.tecTreeManager.trees.values()) {
      const node = tree.nodes.get(tech.name);
      if (node) {
        desc = node.tip;
        break;
      }
    }
  }

  // Play milestone sound on mount
  useEffect(() => {
    if (game && game.audioManager) {
      try {
        game.audioManager.init(); // ensure initialized
        game.audioManager.playMilestone();
      } catch (e) {
        console.warn("AudioManager playMilestone failed:", e);
      }
    }
  }, [game]);

  const getTreeLabel = (treeType: string) => {
    switch (treeType) {
      case "physics": return t("基础物理 / Theoretical Physics");
      case "aerospace": return t("核能与航天 / Nuclear & Aerospace");
      case "military": return t("深空战略与军工 / Space Military");
      case "information": return t("信息理论与人机 / Information Science");
      case "interstellar": return t("星际探索 / Interstellar Exploration");
      default: return treeType;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[700] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tech-unlock-title"
    >
      {/* Glow effect in background */}
      <div className="absolute w-96 h-96 rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#070b12] border-2 border-cyan-500/30 rounded-xl p-6 shadow-[0_0_30px_rgba(6,182,212,0.2)] flex flex-col items-center gap-4 relative overflow-hidden select-none">
        {/* Sci-fi Scanline Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[size:100%_4px] opacity-20" />

        {/* Top bar */}
        <div className="w-full flex justify-between items-center text-[10px] text-cyan-500/50 font-mono tracking-widest border-b border-cyan-500/10 pb-2">
          <span>{t("PDC_RESEARCH_LOG // 科技部记录")}</span>
          <span>ONLINE</span>
        </div>

        {/* Icon with spin/glow */}
        <div className="relative p-4 rounded-full bg-cyan-950/30 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)] mt-2">
          <Cpu className="w-10 h-10 text-cyan-400 animate-pulse" />
          <Award className="w-5 h-5 text-yellow-400 absolute bottom-1.5 right-1.5" />
        </div>

        {/* Titles */}
        <div className="text-center space-y-1 mt-2">
          <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest">
            {getTreeLabel(tech.treeType)}
          </div>
          <h2 id="tech-unlock-title" className="text-2xl font-black text-white tracking-wider filter drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
            {tech.name}
          </h2>
          <div className="text-xs text-cyan-500 font-semibold uppercase tracking-widest">
            {t('unlocked_tech') || t("科技研发完成")}
          </div>
        </div>

        {/* Description */}
        <div className="w-full bg-slate-900/40 border border-cyan-500/10 p-4 rounded-lg text-center mt-2 min-h-[4.5rem] flex items-center justify-center">
          <p className="text-sm text-cyan-100/80 leading-relaxed font-sans font-medium">
            {desc || t("基础研究已突破，开启全新技术篇章。")}
          </p>
        </div>

        {/* Actions */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 bg-cyan-950/20 hover:bg-cyan-500 hover:text-black border border-cyan-500/40 hover:border-cyan-400 rounded-lg text-cyan-300 font-black tracking-widest text-xs transition-all duration-300 shadow-[inset_0_0_10px_rgba(6,182,212,0.1)] active:scale-[0.98] cursor-pointer"
        >
          {t("ACKNOWLEDGE / 确认")}</button>
      </div>
    </div>
  );
};
