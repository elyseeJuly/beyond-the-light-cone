import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Gift, Target } from 'lucide-react';
import { GameInstance } from '../core/Game';
import { STAR_INDEX } from '../config/starIndices';
import missionData from '../data/mission_log.json';

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

  // Logic to evaluate whether a mission objective has been met
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
      case 'finish-tech': {
        for (const tree of earth.tecTreeManager.trees.values()) {
          for (const node of tree.nodes.values()) {
            if (node.finished) return true;
          }
        }
        return false;
      }
      case 'appoint-minister': {
        for (const dept of earth.departments.values()) {
          if (dept.leaderName) return true;
        }
        return false;
      }
      case 'resolve-event':
        return game.playerTimeline.length > 0;
      case 'reach-deterrence':
        return earth.deterrenceValue >= 50;
      case 'appoint-wallfacer':
        return earth.wallfacers.size > 0;
      case 'appoint-swordholder':
        return !!earth.swordholder;
      case 'tier4-tech': {
        for (const tree of earth.tecTreeManager.trees.values()) {
          for (const node of tree.nodes.values()) {
            if (node.finished && ((node as any).tier >= 4 || node.cost >= 40)) return true;
          }
        }
        return false;
      }
      case 'resource-reserve':
        return earth.population >= 100 && earth.resource >= 300;
      default:
        return false;
    }
  }, [game, earth]);

  // Claim reward for completed mission
  const claimReward = (mission: MissionDef) => {
    if (claimedMissions.includes(mission.id)) return;

    // Grant reward
    const reward = mission.reward;
    if (reward.type === 'resource' && reward.amount) {
      earth.resource += reward.amount;
    } else if (reward.type === 'economy' && reward.amount) {
      earth.economy += reward.amount;
    } else if (reward.type === 'culture' && reward.amount) {
      earth.culture += reward.amount;
    } else if (reward.type === 'army' && reward.amount) {
      earth.army += reward.amount;
    } else if (reward.type === 'ap' && reward.amount) {
      earth.apMax += reward.amount;
      earth.apCurrent += reward.amount;
    }

    const updated = [...claimedMissions, mission.id];
    setClaimedMissions(updated);
    localStorage.setItem('session:mission-log-claimed', JSON.stringify(updated));

    // Toast notification
    window.dispatchEvent(new CustomEvent('game:toast:message', {
      detail: { text: `智脑目标完成！解锁奖励：${reward.text}`, category: '【智脑重赏】' },
    }));
    window.dispatchEvent(new CustomEvent('game-state-changed'));
  };

  if (dismissed) return null;

  const handleNavigate = (view: string) => {
    window.dispatchEvent(new CustomEvent('change-active-view', { detail: view }));
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('session:mission-log-dismissed', 'true');
  };

  const currentMissions = currentEpochMissions.missions as MissionDef[];
  const completedCount = currentMissions.filter(m => checkMissionCompleted(m.id)).length;
  const claimedCount = currentMissions.filter(m => claimedMissions.includes(m.id)).length;
  const allClaimed = claimedCount === currentMissions.length;

  return (
    <div className="fixed bottom-4 right-4 z-[500] w-72 max-w-[calc(100vw-32px)] select-none animate-fade-in">
      <div className="bg-[#070B14]/95 backdrop-blur-md border border-[var(--color-primary)]/40 rounded-lg shadow-[0_0_25px_rgba(0,184,255,0.15)] overflow-hidden">
        
        {/* Header */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/15 border-b border-[var(--color-primary)]/20 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Target size={14} className="text-[var(--color-primary)] animate-pulse" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-title font-bold text-[var(--color-primary)] uppercase tracking-wider">
                智脑推演目标 · {currentEpochMissions.epochName}
              </span>
              <span className="text-[9px] text-gray-400 font-mono">
                完成: {completedCount}/{currentMissions.length} ({claimedCount}已领)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {allClaimed && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                className="text-gray-400 hover:text-white text-xs px-1"
                title="隐藏任务板"
              >
                ✕
              </button>
            )}
            {collapsed ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
          </div>
        </button>

        {/* Progress Bar */}
        <div className="h-1 bg-[#243245]/50 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--color-primary)] to-cyan-300 transition-all duration-500 shadow-[0_0_10px_var(--color-primary)]"
            style={{ width: `${(claimedCount / currentMissions.length) * 100}%` }}
          />
        </div>

        {/* Missions List */}
        {!collapsed && (
          <div className="flex flex-col gap-1.5 p-2.5 max-h-[280px] overflow-y-auto bg-black/30">
            <div className="text-[9px] font-mono text-cyan-400/80 px-1 mb-0.5">
              {currentEpochMissions.subtitle}
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
                        {mission.label}
                      </span>
                    </button>

                    {isDone && !isClaimed ? (
                      <button
                        onClick={() => claimReward(mission)}
                        className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 rounded text-[10px] text-amber-300 font-bold tracking-wider animate-pulse cursor-pointer"
                      >
                        领取奖励
                      </button>
                    ) : (
                      <span className="text-[9px] text-gray-400 font-mono">
                        {mission.reward.text}
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-gray-400 pl-5 leading-tight">
                    {mission.description}
                  </p>

                  {!isDone && (
                    <div className="text-[9px] text-cyan-300/70 pl-5 italic">
                      智脑提示：{mission.tip}
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
