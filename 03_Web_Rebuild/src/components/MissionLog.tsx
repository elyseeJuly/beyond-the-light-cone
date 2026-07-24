import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Gift, Target } from 'lucide-react';
import { GameInstance } from '../core/Game';
import { STAR_INDEX } from '../config/starIndices';
import missionData from '../data/mission_log.json';
import { useTranslation } from '../utils/i18n';

interface MissionDef {
  id: string;
  label: string;
  description: string;
  tip: string;
  navigateTo: string;
  reward: {
    type: string;
    amount?: number;
    text: string;
  };
}

export const MissionLog: React.FC = () => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('session:mission-log-dismissed') === 'true');
  const [claimedMissions, setClaimedMissions] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('session:mission-log-claimed') || '[]');
    } catch (_) {
      return [];
    }
  });
  const [, forceTick] = useState(0);

  useEffect(() => {
    const refresh = () => forceTick(t => t + 1);
    window.addEventListener('game-turn-complete', refresh);
    window.addEventListener('game-state-changed', refresh);
    window.addEventListener('ap-changed', refresh);
    const interval = setInterval(refresh, 1000);
    return () => {
      window.removeEventListener('game-turn-complete', refresh);
      window.removeEventListener('game-state-changed', refresh);
      window.removeEventListener('ap-changed', refresh);
      clearInterval(interval);
    };
  }, []);

  const game = GameInstance.get();
  const earth = game.earthCivi;
  const currentEpochIndex = Math.min(game.epoch || 0, missionData.epochs.length - 1);
  const currentEpochMissions = missionData.epochs[currentEpochIndex] || missionData.epochs[0];

  const checkMissionCompleted = useCallback((id: string): boolean => {
    switch (id) {
      case 'has-stope': {
        const star = game.starManager.getStar(STAR_INDEX.EARTH);
        return !!star?.hasStope;
      }
      case 'has-factory': {
        const star = game.starManager.getStar(STAR_INDEX.EARTH);
        return !!star?.hasFactory;
      }
      case 'has-research-base': {
        const star = game.starManager.getStar(STAR_INDEX.EARTH);
        return !!star?.hasCity;
      }
      case 'has-first-tech': {
        let count = 0;
        if (earth.tecTreeManager?.trees) {
          for (const tree of earth.tecTreeManager.trees.values()) {
            for (const node of tree.nodes.values()) {
              if (node.finished) count++;
            }
          }
        }
        return count >= 1;
      }
      case 'has-fleet': {
        return (earth.fleets?.length || 0) >= 1;
      }
      case 'has-wallfacer': {
        return (earth.wallfacers?.size || 0) >= 1;
      }
      case 'has-deterrence-tech': {
        let count = 0;
        if (earth.tecTreeManager?.trees) {
          for (const tree of earth.tecTreeManager.trees.values()) {
            for (const node of tree.nodes.values()) {
              if (node.finished) count++;
            }
          }
        }
        return count >= 3;
      }
      default:
        return false;
    }
  }, [earth, game]);

  const currentMissions: MissionDef[] = (currentEpochMissions.missions || []) as MissionDef[];
  const completedCount = currentMissions.filter(m => checkMissionCompleted(m.id)).length;
  const claimedCount = currentMissions.filter(m => claimedMissions.includes(m.id)).length;
  const allClaimed = claimedCount >= currentMissions.length;

  const claimReward = (mission: MissionDef) => {
    if (claimedMissions.includes(mission.id)) return;

    if (mission.reward.amount) {
      if (mission.reward.type === 'AP' || mission.reward.type === 'ap') {
        earth.apCurrent = Math.min(earth.apMax, earth.apCurrent + mission.reward.amount);
      } else if (mission.reward.type === 'MINERAL' || mission.reward.type === 'resource') {
        earth.resource += mission.reward.amount;
      } else if (mission.reward.type === 'CULTURE' || mission.reward.type === 'culture') {
        earth.culture += mission.reward.amount;
      }
    }

    const next = [...claimedMissions, mission.id];
    setClaimedMissions(next);
    localStorage.setItem('session:mission-log-claimed', JSON.stringify(next));
    window.dispatchEvent(new Event('game-state-changed'));
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('session:mission-log-dismissed', 'true');
  };

  const handleNavigate = (target: string) => {
    if (target === 'build-stope' || target === 'build-factory') {
      window.dispatchEvent(new CustomEvent('ui-switch-view', { detail: { view: 'starmap', tab: 'build' } }));
    } else if (target === 'techtree') {
      window.dispatchEvent(new CustomEvent('ui-switch-view', { detail: { view: 'techtree' } }));
    } else if (target === 'fleet') {
      window.dispatchEvent(new CustomEvent('open-fleet-modal'));
    } else if (target === 'wallfacer') {
      window.dispatchEvent(new CustomEvent('open-wallfacer-panel'));
    }
  };

  if (dismissed) return null;

  return (
    <div className="fixed bottom-14 left-4 z-40 w-72 md:w-80 select-none animate-slide-up">
      <div className="bg-[#070B14]/95 border border-[var(--color-primary)]/40 rounded-lg shadow-[0_0_20px_rgba(0,184,255,0.15)] overflow-hidden backdrop-blur-md">
        
        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/15 border-b border-[var(--color-primary)]/20 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Target size={14} className="text-[var(--color-primary)] animate-pulse" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-title font-bold text-[var(--color-primary)] uppercase tracking-wider">
                {t("智脑推演目标")} · {t(currentEpochMissions.epochName)}
              </span>
              <span className="text-[9px] text-gray-400 font-mono">
                {t("完成")}: {completedCount}/{currentMissions.length} ({claimedCount}{t("已领")})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {allClaimed && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                className="text-gray-400 hover:text-white text-xs px-1"
                title={t("隐藏任务板")}
              >
                ✕
              </button>
            )}
            {collapsed ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
          </div>
        </button>

        <div className="h-1 bg-[#243245]/50 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--color-primary)] to-cyan-300 transition-all duration-500 shadow-[0_0_10px_var(--color-primary)]"
            style={{ width: `${(claimedCount / currentMissions.length) * 100}%` }}
          />
        </div>

        {!collapsed && (
          <div className="flex flex-col gap-1.5 p-2.5 max-h-[280px] overflow-y-auto bg-black/30">
            <div className="text-[9px] font-mono text-cyan-400/80 px-1 mb-0.5">
              {t(currentEpochMissions.subtitle)}
            </div>

            {currentMissions.map(mission => {
              const isDone = checkMissionCompleted(mission.id);
              const isClaimed = claimedMissions.includes(mission.id);

              return (
                <div
                  key={mission.id}
                  className={`p-2 rounded border transition-all flex flex-col gap-1 ${
                    isClaimed
                      ? 'bg-emerald-950/20 border-emerald-500/20 opacity-60'
                      : isDone
                      ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]/40 shadow-[0_0_10px_rgba(0,184,255,0.1)]'
                      : 'bg-black/40 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleNavigate(mission.navigateTo)}
                      className="flex items-center gap-2 text-left cursor-pointer group"
                    >
                      {isClaimed ? (
                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      ) : isDone ? (
                        <Gift size={14} className="text-amber-400 shrink-0 animate-bounce" />
                      ) : (
                        <Circle size={14} className="text-gray-500 shrink-0 group-hover:text-[var(--color-primary)]" />
                      )}
                      <span className={`text-xs font-bold ${isClaimed ? 'text-emerald-400/80 line-through' : isDone ? 'text-amber-200' : 'text-gray-200 group-hover:text-white'}`}>
                        {t(mission.label)}
                      </span>
                    </button>

                    {isDone && !isClaimed ? (
                      <button
                        onClick={() => claimReward(mission)}
                        className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 rounded text-[10px] text-amber-300 font-bold tracking-wider animate-pulse cursor-pointer"
                      >
                        {t("领取奖励")}
                      </button>
                    ) : (
                      <span className="text-[9px] text-gray-400 font-mono">
                        {t(mission.reward.text)}
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-gray-400 pl-5 leading-tight">
                    {t(mission.description)}
                  </p>

                  {!isDone && (
                    <div className="text-[9px] text-cyan-300/70 pl-5 italic">
                      {t("智脑提示")}：{t(mission.tip)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
