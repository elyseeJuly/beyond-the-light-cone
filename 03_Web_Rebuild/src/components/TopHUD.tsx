import React, { useEffect, useState, useRef } from 'react';
import { Users, Landmark, Swords, Gem, AlertTriangle, SkipForward, Brain, Zap, BookOpen } from 'lucide-react';
import { GameInstance } from '../core/Game';
import { useTranslation } from '../utils/i18n';

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
  const { t, lang } = useTranslation();
  const [showStabilityDropdown, setShowStabilityDropdown] = useState(false);
  const [showDeterrenceDropdown, setShowDeterrenceDropdown] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const deterrenceDropdownRef = useRef<HTMLDivElement>(null);

  // ── 双保险更新机制：轮询兜底 + 事件加速 ──
  const [tick, setTick] = useState(0);

  // 保险 1：每 500ms 定时轮询，无论事件链是否中断都能刷新
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // 保险 2：事件驱动立即刷新（比轮询更快响应，0~500ms 的感知差）
  useEffect(() => {
    const immediate = () => setTick(t => t + 1);
    window.addEventListener('game-turn-complete', immediate);
    window.addEventListener('game-state-changed', immediate);
    window.addEventListener('ap-changed', immediate);
    window.addEventListener('ai-brain-toggled', immediate);
    return () => {
      window.removeEventListener('game-turn-complete', immediate);
      window.removeEventListener('game-state-changed', immediate);
      window.removeEventListener('ap-changed', immediate);
      window.removeEventListener('ai-brain-toggled', immediate);
    };
  }, []);

  const game = GameInstance.get();
  const earth = game.earthCivi;
  const epochNames = [t("黄金岁月"), t("危机纪元"), t("威慑纪元"), t("广播纪元"), t("掩体纪元"), t("银河纪元"), t("星屑纪元")];
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
  const currentTutorialStepId = typeof window !== 'undefined' && (window as any).currentTutorialStepId;
  const turnBlockers = (isAiBrainEnabled || isTutorialActive) ? [] : game.getTurnBlockers();
  const turnWarnings = (isAiBrainEnabled || isTutorialActive) ? [] : game.getTurnWarnings();

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
  const popFactor = Math.min(25, (pop / 80) * 25);
  const techFactor = Math.min(25, (finishedTechs / Math.max(1, totalTechs)) * 25);
  const cultureFactor = Math.min(25, (cul / 100) * 25);
  
  let stability = Math.max(5, Math.min(100, Math.floor(econFactor + armyFactor + popFactor + techFactor + cultureFactor + (40 - treacheryPenalty))));
  if (game.victoryType !== null || game.defeatType !== null) {
    stability = 0;
  }

  const stats = {
    year: game.year,
    epoch: game.epoch,
    epochName: t(epochNames[game.epoch] || t("未知纪元")),
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
    turnWarnings,
    civiLevel: earth.civiLevel,
    civiLevelLabel: earth.getCiviLevelLabel(),
    stability,
    techProgress,
    swordholder: earth.swordholder,
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
      if (deterrenceDropdownRef.current && !deterrenceDropdownRef.current.contains(e.target as Node)) {
        setShowDeterrenceDropdown(false);
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
    <header data-tutorial-id="top-hud" data-tick={tick} className="h-[56px] md:h-[72px] w-full bg-[#070B14]/80 backdrop-blur-[12px] border-b border-[#243245]/50 flex items-center justify-between px-3 md:px-6 z-50 select-none relative shrink-0">
      {/* Dynamic scanline overlay for Top HUD */}
      <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[rgba(var(--color-primary-rgb),0.3)] to-transparent" />

      {/* Left: Civilization Attributes — responsive visibility */}
      <div className="flex items-center gap-1 md:gap-1.5">
        {/* Stability with click dropdown — always visible */}
        <div data-tutorial-id="top-hud-stability" className="relative" ref={dropdownRef}>
          <TopHUDStatItem 
            icon={<Landmark className="w-3 h-3 md:w-3.5 md:h-3.5 stroke-[1.5]" />}
            label={t("稳定度")}
            value={`${stats.stability}%`}
            colorClass={stabilityColor}
            onClick={() => setShowStabilityDropdown(!showStabilityDropdown)}
            className={showStabilityDropdown ? "bg-white/5" : ""}
          />
          {showStabilityDropdown && (
            <div className="absolute top-[52px] left-0 w-52 bg-[#070B14]/95 border border-[#243245] rounded p-4 shadow-2xl z-[100] backdrop-blur-md animate-fade-in">
              <div className="text-[10px] font-title font-bold text-[var(--color-primary)] mb-2 uppercase tracking-wider">
                {t("文明发展指标详情")}
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between border-b border-[#243245]/30 pb-1">
                  <span className="text-[var(--text-secondary)]">{t("经济指数")}</span>
                  <span className="text-white font-bold">{stats.eco}</span>
                </div>
                <div className="flex justify-between border-b border-[#243245]/30 pb-1">
                  <span className="text-[var(--text-secondary)]">{t("文化资产")}</span>
                  <span className="text-white font-bold">{stats.cul}</span>
                </div>
                <div className="flex justify-between border-b border-[#243245]/30 pb-1">
                  <span className="text-[var(--text-secondary)]">{t("科技研发度")}</span>
                  <span className="text-white font-bold">{stats.techProgress}%</span>
                </div>
                <div className="flex justify-between border-b border-[#243245]/30 pb-1">
                  <span className="text-[var(--text-secondary)]">{t("逃亡系数")}</span>
                  <span className={`${stats.treachery > 50 ? 'text-red-400' : 'text-white'} font-bold`}>
                    {stats.treachery}%
                  </span>
                </div>
              </div>
              <div className="text-[9px] text-[var(--text-secondary)] leading-relaxed mt-2.5 italic border-t border-[#243245]/40 pt-2">
                {t("1. 稳定度代表你文明生命线的健康度，低于 30% 时面临极高崩溃风险。")}
              </div>
            </div>
          )}
        </div>

        {/* Population — always visible */}
        <TopHUDStatItem 
          icon={<Users className="w-3.5 h-3.5 stroke-[1.5]" />}
          label={t("人口")}
          value={`${stats.pop}M`}
        />

        {/* Resources — always visible */}
        <TopHUDStatItem 
          icon={<Gem className="w-3.5 h-3.5 stroke-[1.5]" />}
          label={t("资源")}
          value={stats.res}
        />

        {/* Army — always visible */}
        <TopHUDStatItem 
          icon={<Swords className="w-3.5 h-3.5 stroke-[1.5]" />}
          label={t("军力")}
          value={stats.army}
        />

        {/* Deterrence with click dropdown — always visible */}
        <div className="relative" ref={deterrenceDropdownRef}>
          <TopHUDStatItem 
            icon={<AlertTriangle className="w-3 h-3 md:w-3.5 md:h-3.5 stroke-[1.5]" />}
            label={t("威慑度")}
            value={`${stats.deterrence}%`}
            colorClass="text-red-400"
            onClick={() => setShowDeterrenceDropdown(!showDeterrenceDropdown)}
            className={showDeterrenceDropdown ? "bg-white/5" : ""}
          />
          {showDeterrenceDropdown && (
            <div className="absolute top-[52px] right-0 w-52 bg-[#070B14]/95 border border-[#243245] rounded p-4 shadow-2xl z-[100] backdrop-blur-md animate-fade-in">
              <div className="text-[10px] font-title font-bold text-[var(--color-primary)] mb-2 uppercase tracking-wider">
                {t("全息战略威慑指标详情")}
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between border-b border-[#243245]/30 pb-1">
                  <span className="text-[var(--text-secondary)]">{t("防卫军力")}</span>
                  <span className="text-white font-bold">{stats.army}</span>
                </div>
                <div className="flex justify-between border-b border-[#243245]/30 pb-1">
                  <span className="text-[var(--text-secondary)]">{t("在位执剑人")}</span>
                  <span className="text-white font-bold">{t(stats.swordholder || t("空缺"))}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Prominent Era and Year Display */}
      <div data-tutorial-id="top-hud-epoch" className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center font-title text-center pointer-events-none">
        <span className="text-[7px] md:text-[9px] font-bold text-[var(--color-primary)] tracking-[0.25em] md:tracking-[0.35em] uppercase opacity-90">
          {stats.epochNameEn}
        </span>
        <span className="text-xs md:text-lg font-extrabold tracking-widest text-[var(--text-primary)] mt-0.5">
          {stats.epochName} · {lang === 'en' ? `Year ${stats.year}` : t("第 {param0} 年", { param0: stats.year })}
        </span>
      </div>

      {/* Right: Operations Block */}
      <div className="flex items-center gap-1.5 md:gap-3">
        {/* AP Display — always visible */}
        <div data-tutorial-id="top-hud-ap" className="flex items-center gap-0.5 md:gap-1 px-1.5 md:px-3 py-0.5 md:py-1 bg-[rgba(138,43,226,0.1)] border border-[rgba(138,43,226,0.3)] rounded">
          <Zap className="w-3 h-3 md:w-3.5 md:h-3.5 text-purple-400 stroke-[1.5]" />
          <div className="flex flex-col items-center">
            <span className="text-[6px] md:text-[8px] text-purple-400/70 font-title font-bold uppercase tracking-wider">AP</span>
            <span className={`text-[10px] md:text-sm font-data font-bold ${stats.apCurrent < 20 ? 'text-red-400' : 'text-purple-300'}`}>
              {stats.apCurrent}/{stats.apMax}
            </span>
          </div>
        </div>

        {/* AI Advisor Button — always visible */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-advisor-panel'))}
          data-tutorial-id="btn-ai-advisor"
          className="flex items-center gap-1 px-1.5 md:px-2.5 py-1 md:py-1.5 rounded border border-cyan-500/40 bg-cyan-950/30 hover:bg-cyan-500/20 text-cyan-300 text-[10px] md:text-xs transition-colors cursor-pointer"
          title={t("智脑顾问")}
        >
          <BookOpen className="w-3 h-3 md:w-3.5 md:h-3.5 stroke-[1.5] text-cyan-400" />
          <span className="font-title font-bold hidden md:inline">{t("智脑顾问")}</span>
        </button>

        {/* AI Brain Toggle — always visible (教程期间禁用，避免智脑与教程状态机冲突) */}
        <button
          onClick={toggleAiBrain}
          disabled={isTutorialActive}
          data-tutorial-id="btn-ai-brain"
          className={`flex items-center justify-center gap-1 px-1.5 md:px-2.5 py-1 md:py-1.5 rounded border text-[10px] md:text-xs transition-colors ${
            isTutorialActive ? 'opacity-40 cursor-not-allowed pointer-events-none border-gray-700/50 text-gray-600' :
            stats.isAiBrainEnabled
              ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 cursor-pointer'
              : 'bg-gray-800/50 border-gray-600/50 text-gray-400 cursor-pointer'
          }`}
          title={isTutorialActive ? t("教程期间不可切换智脑托管") : (stats.isAiBrainEnabled ? t("智脑托管") : t("手动"))}
        >
          <Brain className={`w-3 h-3 md:w-3.5 md:h-3.5 stroke-[1.5] ${
            isTutorialActive ? 'text-gray-600 opacity-60' :
            stats.isAiBrainEnabled ? 'text-purple-400' : 'text-gray-400 opacity-80'
          }`} />
          <span className="font-title font-bold hidden md:inline">
            {isTutorialActive ? t("教程中") : (stats.isAiBrainEnabled ? t("智脑托管") : t("手动"))}
          </span>
        </button>

        {/* Next Turn Button — always visible */}
        <button
          onClick={handleNextTurn}
          disabled={stats.hasEvent || stats.isGameOver || (!stats.isAiBrainEnabled && stats.turnBlockers.length > 0) || (isTutorialActive && currentTutorialStepId !== 'next-turn')}
          data-tutorial-id="btn-next-turn"
          title={
            stats.isGameOver ? t("游戏已结束") :
            stats.hasEvent ? t("请先处理完当前的事件或决策") :
            (isTutorialActive && currentTutorialStepId !== 'next-turn') ? t("请跟随教程指引操作") :
            (!stats.isAiBrainEnabled && stats.turnBlockers.length > 0)
              ? t("{param0}\n{param1}", { param0: t("无法推进回合，存在以下阻断事务："), param1: stats.turnBlockers.map(b => `• ${t(b)}`).join('\n') })
              : stats.turnWarnings.length > 0
                ? t("{param0}\n{param1}", { param0: t("警告（不影响回合推进）："), param1: stats.turnWarnings.map(w => `• ${t(w)}`).join('\n') })
                : t("进入下一回合")
          }
          className={`btn-next-turn flex items-center gap-1 md:gap-2 text-[10px] md:text-xs ${
            (stats.hasEvent || stats.isGameOver || (!stats.isAiBrainEnabled && stats.turnBlockers.length > 0) || (isTutorialActive && currentTutorialStepId !== 'next-turn'))
              ? 'opacity-40 cursor-not-allowed pointer-events-none'
              : stats.turnWarnings.length > 0
                ? 'cursor-pointer text-amber-400 animate-pulse'
                : 'cursor-pointer'
          }`}
        >
          <span className="font-title font-bold tracking-wider">
            {stats.hasEvent ? t("同步逻辑中") : 
             (!stats.isAiBrainEnabled && stats.turnBlockers.length > 0) ? t("有阻断") : 
             (isTutorialActive && currentTutorialStepId !== 'next-turn') ? t("教程指引中") : t("下一回合")}
          </span>
          <SkipForward size={12} className="md:size-[14] stroke-[2.5]" />
        </button>
      </div>
    </header>
  );
};

