import React, { useEffect, useState, useRef } from 'react';
import { Users, Landmark, Swords, Gem, AlertTriangle, SkipForward, Brain, Zap } from 'lucide-react';
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
  const [showStabilityDropdown, setShowStabilityDropdown] = useState(false);
  const [showStabilityDropdownMobile, setShowStabilityDropdownMobile] = useState(false);
  const [, forceUpdate] = useState({});

  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownRefMobile = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => forceUpdate({});
    window.addEventListener('game-turn-complete', update);
    window.addEventListener('game-state-changed', update);
    window.addEventListener('ap-changed', update);
    window.addEventListener('ai-brain-toggled', update);
    return () => {
      window.removeEventListener('game-turn-complete', update);
      window.removeEventListener('game-state-changed', update);
      window.removeEventListener('ap-changed', update);
      window.removeEventListener('ai-brain-toggled', update);
    };
  }, []);

  const game = GameInstance.get();
  const earth = game.earthCivi;
  const epochNames = ["黄金岁月", "危机纪元", "威慑纪元", "广播纪元", "掩体纪元", "银河纪元", "星屑纪元"];
  const epochNamesEn = ["GOLDEN ERA", "CRISIS ERA", "DETERRENCE ERA", "BROADCAST ERA", "BUNKER ERA", "GALACTIC ERA", "STARDUST ERA"];
  
  const pop = earth.population;
  const eco = Math.floor(earth.economy);
  const cul = Math.floor(earth.culture);
  const army = earth.army;
  const res = earth.resource;
  const treachery = earth.treachery;
  const deterrence = Math.floor(earth.deterrenceValue);
  const apMax = earth.apMax;
  const apCurrent = earth.apCurrent;
  const isAiBrainEnabled = earth.isAiBrainEnabled;
  const isTutorialActive = typeof window !== 'undefined' && (window as any).isTutorialActive;
  const turnBlockers = (isAiBrainEnabled || isTutorialActive) ? [] : game.getTurnBlockers();

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

  const stats = {
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
    apMax,
    apCurrent,
    isAiBrainEnabled,
    turnBlockers,
    civiLevel: earth.civiLevel,
    civiLevelLabel: earth.getCiviLevelLabel(),
    stability,
    techProgress,
    hasEvent: game.currentEvent !== null || game.eventQueue.length > 0,
    isGameOver: game.victoryType !== null || game.defeatType !== null
  };

  const getStabilityColorText = (s: number) => {
    if (s >= 80) return "text-emerald-400";
    if (s >= 60) return "text-cyan-400";
    if (s >= 30) return "text-amber-500";
    return "text-red-500 animate-pulse";
  };
  const stabilityColor = getStabilityColorText(stats.stability);

  const handleNextTurn = () => {
    GameInstance.get().runARound();
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowStabilityDropdown(false);
      }
      if (dropdownRefMobile.current && !dropdownRefMobile.current.contains(e.target as Node)) {
        setShowStabilityDropdownMobile(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const toggleAiBrain = () => {
    const game = GameInstance.get();
    game.earthCivi.isAiBrainEnabled = !game.earthCivi.isAiBrainEnabled;
    window.dispatchEvent(new CustomEvent('ai-brain-toggled'));
    window.dispatchEvent(new CustomEvent('game-state-changed'));
  };

  return (
    <header data-tutorial-id="top-hud" className="h-auto md:h-[72px] w-full bg-[#070B14]/80 backdrop-blur-[12px] border-b border-[#243245]/50 flex items-center justify-between px-3 md:px-6 z-50 select-none relative py-1.5 md:py-0 shrink-0">
      {/* Dynamic scanline overlay for Top HUD */}
      <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[rgba(var(--color-primary-rgb),0.3)] to-transparent" />

      {/* MOBILE / TABLET LAYOUT */}
      <div data-testid="tophud-mobile-layout" className="flex md:hidden flex-col w-full gap-2 p-1">
        {/* Row 1: Epoch/Year & Next Turn Buttons */}
        <div className="flex items-center justify-between w-full">
          {/* Epoch & Year Display */}
          <div data-tutorial-id="top-hud-epoch" className="flex flex-col items-start font-title">
            <span className="text-[8px] font-bold text-[var(--color-primary)] tracking-wider uppercase opacity-90">
              {stats.epochNameEn}
            </span>
            <span className="text-xs sm:text-sm font-extrabold tracking-wide text-[var(--text-primary)]">
              {stats.epochName} · 第 {stats.year} 年
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* AI Brain Toggle */}
            <button
              onClick={toggleAiBrain}
              data-tutorial-id="btn-ai-brain"
              className={`flex items-center gap-1 px-2 py-1 rounded border text-[10px] transition-colors cursor-pointer ${
                stats.isAiBrainEnabled
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                  : 'bg-gray-800/50 border-gray-600/50 text-gray-400'
              }`}
              title={stats.isAiBrainEnabled ? 'AI智脑托管中 - 点击切换手动模式' : '手动模式 - 点击切换AI托管'}
            >
              <Brain className="w-3 h-3 stroke-[1.5]" />
              <span className="font-title font-bold">
                {stats.isAiBrainEnabled ? '智脑' : '手动'}
              </span>
            </button>

            {/* Next Turn Button */}
            <button 
              onClick={handleNextTurn} 
              disabled={stats.hasEvent || stats.isGameOver || (!stats.isAiBrainEnabled && stats.turnBlockers.length > 0)}
              data-tutorial-id="btn-next-turn"
              className={`btn-next-turn flex items-center gap-1 px-3 py-1 rounded text-[10px] cursor-pointer ${
                (stats.hasEvent || stats.isGameOver || (!stats.isAiBrainEnabled && stats.turnBlockers.length > 0))
                  ? 'opacity-40 cursor-not-allowed pointer-events-none'
                  : 'cursor-pointer'
              }`}
              title={!stats.isAiBrainEnabled && stats.turnBlockers.length > 0 ? stats.turnBlockers[0] : ''}
            >
              <span className="font-title font-bold tracking-wider">
                {stats.hasEvent ? "同步中" : (!stats.isAiBrainEnabled && stats.turnBlockers.length > 0) ? "有阻断" : "下一回合"}
              </span>
              <SkipForward size={12} className="stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Row 2: Civilization Stats bar */}
        <div className="flex items-center justify-between w-full border-t border-[#243245]/20 pt-1.5 gap-0.5 overflow-x-auto scrollbar-none">
          {/* Stability with click dropdown */}
          <div data-tutorial-id="top-hud-stability" className="relative" ref={dropdownRefMobile}>
            <div 
              onClick={() => setShowStabilityDropdownMobile(!showStabilityDropdownMobile)}
              className={`flex items-center gap-0.5 sm:gap-1 px-1 py-0.5 rounded cursor-pointer select-none hover:bg-white/5 ${showStabilityDropdownMobile ? "bg-white/5" : ""}`}
            >
              <Landmark className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[var(--text-secondary)]" />
              <span className="text-[9px] sm:text-[10px] text-[var(--text-secondary)] font-title">稳定:</span>
              <span className={`text-[10px] sm:text-[11px] font-mono font-bold ${stabilityColor}`}>
                {stats.stability}%
              </span>
            </div>
            {showStabilityDropdownMobile && (
              <div className="absolute top-[28px] left-0 w-44 bg-[#070B14]/95 border border-[#243245] rounded p-2.5 shadow-2xl z-[100] backdrop-blur-md text-[10px] font-mono space-y-1.5">
                <div className="text-[9px] font-title font-bold text-[var(--color-primary)] mb-1 uppercase tracking-wider">
                  指标详情
                </div>
                <div className="flex justify-between border-b border-[#243245]/20 pb-0.5">
                  <span className="text-[var(--text-secondary)]">经济</span>
                  <span className="text-white font-bold">{stats.eco}</span>
                </div>
                <div className="flex justify-between border-b border-[#243245]/20 pb-0.5">
                  <span className="text-[var(--text-secondary)]">文化</span>
                  <span className="text-white font-bold">{stats.cul}</span>
                </div>
                <div className="flex justify-between border-b border-[#243245]/20 pb-0.5">
                  <span className="text-[var(--text-secondary)]">科技</span>
                  <span className="text-white font-bold">{stats.techProgress}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">逃亡</span>
                  <span className="text-white font-bold">{stats.treachery}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Population */}
          <div className="flex items-center gap-0.5 sm:gap-1 px-0.5 sm:px-1 py-0.5">
            <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[var(--text-secondary)]" />
            <span className="text-[9px] sm:text-[10px] text-[var(--text-secondary)] font-title">人口:</span>
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-white">
              {stats.pop}M
            </span>
          </div>

          {/* Resources */}
          <div className="flex items-center gap-0.5 sm:gap-1 px-0.5 sm:px-1 py-0.5">
            <Gem className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[var(--text-secondary)]" />
            <span className="text-[9px] sm:text-[10px] text-[var(--text-secondary)] font-title">资源:</span>
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-white">
              {stats.res}
            </span>
          </div>

          {/* Army */}
          <div className="flex items-center gap-0.5 sm:gap-1 px-0.5 sm:px-1 py-0.5">
            <Swords className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[var(--text-secondary)]" />
            <span className="text-[9px] sm:text-[10px] text-[var(--text-secondary)] font-title">军力:</span>
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-white">
              {stats.army}
            </span>
          </div>

          {/* Deterrence */}
          <div className="flex items-center gap-0.5 sm:gap-1 px-0.5 sm:px-1 py-0.5">
            <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400" />
            <span className="text-[9px] sm:text-[10px] text-[var(--text-secondary)] font-title">威慑:</span>
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-red-400">
              {stats.deterrence}
            </span>
          </div>

          {/* AP */}
          <div data-tutorial-id="top-hud-ap" className="flex items-center gap-1 px-1.5 py-0.5 bg-[rgba(138,43,226,0.1)] border border-[rgba(138,43,226,0.3)] rounded">
            <Zap className="w-2.5 h-2.5 text-purple-400" />
            <span className={`text-[11px] font-mono font-bold ${stats.apCurrent < 20 ? 'text-red-400' : 'text-purple-300'}`}>
              {stats.apCurrent}/{stats.apMax}
            </span>
          </div>
        </div>
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden md:flex w-full items-center justify-between h-full relative">
        {/* Left: Civilization Attributes */}
        <div className="flex items-center gap-1.5">
          {/* Stability with click dropdown */}
          <div data-tutorial-id="top-hud-stability" className="relative" ref={dropdownRef}>
            <TopHUDStatItem 
              icon={<Landmark className="w-3.5 h-3.5 stroke-[1.5]" />}
              label="稳定度"
              value={`${stats.stability}%`}
              colorClass={stabilityColor}
              onClick={() => setShowStabilityDropdown(!showStabilityDropdown)}
              className={`${showStabilityDropdown ? "bg-white/5" : ""} px-4`}
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
            className="px-4"
          />

          <TopHUDStatItem 
            icon={<Gem className="w-3.5 h-3.5 stroke-[1.5]" />}
            label="资源"
            value={stats.res}
            className="px-4"
          />

          <TopHUDStatItem 
            icon={<Swords className="w-3.5 h-3.5 stroke-[1.5]" />}
            label="军力"
            value={stats.army}
            className="px-4"
          />

          <TopHUDStatItem 
            icon={<AlertTriangle className="w-3.5 h-3.5 stroke-[1.5]" />}
            label="威慑度"
            value={stats.deterrence}
            colorClass="text-red-400"
            className="px-4"
          />
        </div>

        {/* Center: Prominent Era and Year Display */}
        <div data-tutorial-id="top-hud-epoch" className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center font-title text-center pointer-events-none">
          <span className="text-[9px] font-bold text-[var(--color-primary)] tracking-[0.35em] uppercase opacity-90">
            {stats.epochNameEn}
          </span>
          <span className="text-lg font-extrabold tracking-widest text-[var(--text-primary)] mt-0">
            {stats.epochName} · 第 {stats.year} 年
          </span>
        </div>

        {/* Right: Operations Block */}
        <div className="flex items-center gap-2">
          {/* AP Display */}
          <div data-tutorial-id="top-hud-ap" className="flex items-center gap-1 px-3 py-1 bg-[rgba(138,43,226,0.1)] border border-[rgba(138,43,226,0.3)] rounded">
            <Zap className="w-3.5 h-3.5 text-purple-400 stroke-[1.5]" />
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-purple-400/70 font-title font-bold uppercase tracking-wider">AP</span>
              <span className={`text-sm font-data font-bold ${stats.apCurrent < 20 ? 'text-red-400' : 'text-purple-300'}`}>
                {stats.apCurrent}/{stats.apMax}
              </span>
            </div>
          </div>

          {/* AI Brain Toggle */}
          <button
            onClick={toggleAiBrain}
            data-tutorial-id="btn-ai-brain"
            className={`flex items-center gap-1 px-3 py-1.5 rounded border text-xs transition-colors cursor-pointer ${
              stats.isAiBrainEnabled
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                : 'bg-gray-800/50 border-gray-600/50 text-gray-400'
            }`}
            title={stats.isAiBrainEnabled ? 'AI智脑托管中 - 点击切换手动模式' : '手动模式 - 点击切换AI托管'}
          >
            <Brain className="w-3.5 h-3.5 stroke-[1.5]" />
            <span className="font-title font-bold">
              {stats.isAiBrainEnabled ? '智脑托管' : '手动'}
            </span>
          </button>

          {/* Next Turn Button */}
          <button 
            onClick={handleNextTurn} 
            disabled={stats.hasEvent || stats.isGameOver || (!stats.isAiBrainEnabled && stats.turnBlockers.length > 0)}
            data-tutorial-id="btn-next-turn"
            className={`btn-next-turn flex items-center gap-2 px-6 py-2 text-xs ${
              (stats.hasEvent || stats.isGameOver || (!stats.isAiBrainEnabled && stats.turnBlockers.length > 0))
                ? 'opacity-40 cursor-not-allowed pointer-events-none'
                : 'cursor-pointer'
            }`}
            title={!stats.isAiBrainEnabled && stats.turnBlockers.length > 0 ? stats.turnBlockers[0] : ''}
          >
            <span className="font-title font-bold tracking-wider">
              {stats.hasEvent ? "同步中" : (!stats.isAiBrainEnabled && stats.turnBlockers.length > 0) ? "有阻断" : "下一回合"}
            </span>
            <SkipForward size={14} className="stroke-[2.5]" />
          </button>
        </div>
      </div>
    </header>
  );
};
