import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Users, Landmark, Swords, Gem, AlertTriangle, SkipForward } from 'lucide-react';
import { GameInstance } from '../core/Game';

interface TopHUDStatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  colorClass?: string;
  onClick?: () => void;
  className?: string;
}

const TopHUDStatItem: React.FC<TopHUDStatItemProps> = ({ icon, label, value, colorClass = "", onClick, className = "" }) => {
  return (
    <div 
      onClick={onClick}
      className={`flex flex-col items-center justify-center px-4 py-1.5 transition-colors cursor-pointer select-none rounded hover:bg-white/5 ${className}`}
    >
      <div className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] font-title font-bold tracking-wider uppercase">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`text-base font-data font-bold tracking-tight mt-0.5 ${colorClass}`}>
        {value}
      </div>
    </div>
  );
};

export const TopHUD: React.FC = () => {
  const [updateCount, setUpdateCount] = useState(0);
  const [showStabilityDropdown, setShowStabilityDropdown] = useState(false);

  const stats = useMemo(() => {
    const game = GameInstance.get();
    const earth = game.earthCivi;
    const epochNames = ["危机纪元", "威慑纪元", "广播纪元", "掩体纪元", "银河纪元", "星屑纪元"];
    const epochNamesEn = ["CRISIS ERA", "DETERRENCE ERA", "BROADCAST ERA", "BUNKER ERA", "GALACTIC ERA", "STARDUST ERA"];
    
    const pop = earth.population;
    const eco = Math.floor(earth.economy);
    const cul = Math.floor(earth.culture);
    const army = earth.army;
    const res = earth.resource;
    const treachery = earth.treachery;
    const deterrence = Math.floor(earth.deterrenceValue);

    // Dynamic Stability calculation
    let finishedTechs = 0;
    let totalTechs = 0;
    for (const tree of earth.tecTreeManager.trees.values()) {
      for (const node of tree.nodes.values()) {
        totalTechs++;
        if (node.finished) {
          finishedTechs++;
        }
      }
    }
    const techProgress = Math.floor((finishedTechs / Math.max(1, totalTechs)) * 100);

    const econFactor = Math.min(25, (eco / 120) * 25);
    const armyFactor = Math.min(25, (army / 25) * 25);
    const treacheryPenalty = treachery * 0.4;
    const techFactor = Math.min(25, (finishedTechs / Math.max(1, totalTechs)) * 25);
    const cultureFactor = Math.min(25, (cul / 100) * 25);
    
    let stability = Math.max(5, Math.min(100, Math.floor(econFactor + armyFactor + techFactor + cultureFactor + (40 - treacheryPenalty))));
    if (game.victoryType !== null || game.defeatType !== null) {
      stability = 0;
    }

    return {
      year: game.year,
      epoch: game.epoch,
      epochName: epochNames[game.epoch] || "未知纪元",
      epochNameEn: epochNamesEn[game.epoch] || "UNKNOWN ERA",
      pop,
      eco,
      cul,
      army,
      res,
      treachery,
      deterrence,
      civiLevel: earth.civiLevel,
      civiLevelLabel: earth.getCiviLevelLabel(),
      stability,
      techProgress,
      isGameOver: game.victoryType !== null || game.defeatType !== null
    };
  }, [updateCount]);

  const stabilityColor = useMemo(() => {
    const s = stats.stability;
    if (s >= 80) return "text-emerald-400";
    if (s >= 60) return "text-cyan-400";
    if (s >= 30) return "text-amber-500";
    return "text-red-500 animate-pulse";
  }, [stats.stability]);

  useEffect(() => {
    const refresh = () => setUpdateCount(n => n + 1);
    window.addEventListener('game-loaded', refresh);
    window.addEventListener('game-over', refresh);
    window.addEventListener('game-turn-complete', refresh);
    return () => {
      window.removeEventListener('game-loaded', refresh);
      window.removeEventListener('game-over', refresh);
      window.removeEventListener('game-turn-complete', refresh);
    };
  }, []);

  const handleNextTurn = () => {
    GameInstance.get().runARound();
    setUpdateCount(n => n + 1);
    window.dispatchEvent(new CustomEvent('game-turn-complete'));
  };

  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowStabilityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <header className="h-[72px] w-full bg-[#070B14]/80 backdrop-blur-[12px] border-b border-[#243245]/50 flex items-center justify-between px-6 z-50 select-none relative">
      {/* Dynamic scanline overlay for Top HUD */}
      <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[rgba(var(--color-primary-rgb),0.3)] to-transparent" />

      {/* Left: Civilization Attributes */}
      <div className="flex items-center gap-1.5">
        {/* Stability with click dropdown */}
        <div className="relative" ref={dropdownRef}>
          <TopHUDStatItem 
            icon={<Landmark className="w-3.5 h-3.5 stroke-[1.5]" />}
            label="稳定度"
            value={`${stats.stability}%`}
            colorClass={stabilityColor}
            onClick={() => setShowStabilityDropdown(!showStabilityDropdown)}
            className={showStabilityDropdown ? "bg-white/5" : ""}
          />
          {showStabilityDropdown && (
            <div className="absolute top-[52px] left-0 w-52 bg-[#070B14]/95 border border-[#243245] rounded p-4 shadow-2xl z-[100] backdrop-blur-md animate-fade-in">
              <div className="text-[10px] font-title font-bold text-[var(--color-primary)] mb-2 uppercase tracking-wider">
                文明发展指标详情
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between border-b border-[#243245]/30 pb-1">
                  <span className="text-[var(--text-secondary)]">经济指数</span>
                  <span className="text-white font-bold">{stats.eco}</span>
                </div>
                <div className="flex justify-between border-b border-[#243245]/30 pb-1">
                  <span className="text-[var(--text-secondary)]">文化资产</span>
                  <span className="text-white font-bold">{stats.cul}</span>
                </div>
                <div className="flex justify-between border-b border-[#243245]/30 pb-1">
                  <span className="text-[var(--text-secondary)]">科技研发度</span>
                  <span className="text-white font-bold">{stats.techProgress}%</span>
                </div>
                <div className="flex justify-between border-b border-[#243245]/30 pb-1">
                  <span className="text-[var(--text-secondary)]">逃亡系数</span>
                  <span className={`${stats.treachery > 50 ? 'text-red-400' : 'text-white'} font-bold`}>
                    {stats.treachery}%
                  </span>
                </div>
              </div>
              <div className="text-[9px] text-[var(--text-secondary)] leading-relaxed mt-2.5 italic border-t border-[#243245]/40 pt-2">
                * 稳定度决定文明生命线，当稳定度降为零时文明将被判定终结。
              </div>
            </div>
          )}
        </div>

        <TopHUDStatItem 
          icon={<Users className="w-3.5 h-3.5 stroke-[1.5]" />}
          label="人口"
          value={`${stats.pop}M`}
        />

        <TopHUDStatItem 
          icon={<Gem className="w-3.5 h-3.5 stroke-[1.5]" />}
          label="资源"
          value={stats.res}
        />

        <TopHUDStatItem 
          icon={<Swords className="w-3.5 h-3.5 stroke-[1.5]" />}
          label="军力"
          value={stats.army}
        />

        <TopHUDStatItem 
          icon={<AlertTriangle className="w-3.5 h-3.5 stroke-[1.5]" />}
          label="威慑度"
          value={stats.deterrence}
          colorClass="text-red-400"
        />
      </div>

      {/* Center: Prominent Era and Year Display */}
      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center font-title text-center">
        <span className="text-[9px] font-bold text-[var(--color-primary)] tracking-[0.35em] uppercase opacity-90">
          {stats.epochNameEn}
        </span>
        <span className="text-lg font-extrabold tracking-widest text-[var(--text-primary)] mt-0.5">
          {stats.epochName} · 第 {stats.year} 年
        </span>
      </div>

      {/* Right: Operations Block */}
      <div className="flex items-center gap-3">
        <button 
          onClick={handleNextTurn} 
          disabled={GameInstance.get().currentEvent !== null || GameInstance.get().eventQueue.length > 0 || stats.isGameOver}
          className={`btn-next-turn flex items-center gap-2 ${(GameInstance.get().currentEvent !== null || GameInstance.get().eventQueue.length > 0 || stats.isGameOver) ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}
        >
          <span className="text-xs font-title font-bold tracking-wider">
            {(GameInstance.get().currentEvent !== null || GameInstance.get().eventQueue.length > 0) ? "同步逻辑中" : "下一回合"}
          </span>
          <SkipForward size={14} className="stroke-[2.5]" />
        </button>
      </div>
    </header>
  );
};


