import React, { useState, useEffect } from 'react';
import { X, Rocket, Wrench, Shield, ArrowRight, Zap } from 'lucide-react';
import { GameInstance } from '../core/Game';
import { createFleet, Fleet } from '../core/Fleet';
import weaponsData from '../data/weapons.json';
import { STAR_INDEX } from '../config/starIndices';

interface FleetModalProps {
  onClose: () => void;
}

export const FleetModal: React.FC<FleetModalProps> = ({ onClose }) => {
  const [, forceUpdate] = useState(0);
  const game = GameInstance.get();
  const earth = game.earthCivi;

  useEffect(() => {
    const handleUpdate = () => forceUpdate(n => n + 1);
    window.addEventListener('game-turn-complete', handleUpdate);
    return () => {
      window.removeEventListener('game-turn-complete', handleUpdate);
    };
  }, []);

  const handleBuildFleet = () => {
    if (earth.economy >= 100) {
      earth.economy -= 100;
      const earthStar = game.starManager.getStar(STAR_INDEX.EARTH);
      const fleet = createFleet(`第${earth.fleets.length + 1}舰队`, "地球", STAR_INDEX.EARTH, 0, 0);
      fleet.weapons.push({ weaponName: "恒星级战舰", currentBuild: 10 });
      fleet.weapons.push({ weaponName: "恒星级战舰", currentBuild: 10 });
      fleet.weapons.push({ weaponName: "恒星级战舰", currentBuild: 10 });
      earth.fleets.push(fleet);
      game.addHistory(`在 ${earthStar?.name || '地球'} 开始建造恒星级战舰编队（3艘，消耗 100 经济）。`);
      forceUpdate(n => n + 1);
      window.dispatchEvent(new CustomEvent('game-turn-complete'));
    } else {
      alert("经济不足 100 点！");
    }
  };

  const handleDispatch = (fleet: Fleet, targetIdxStr: string) => {
    const targetIdx = parseInt(targetIdxStr);
    if (isNaN(targetIdx)) return;
    
    // Estimate ETA based on basic distance calculation (placeholder logic)
    const source = game.starManager.getStar(fleet.sourceStarIndex);
    const target = game.starManager.getStar(targetIdx);
    
    if (source && target) {
      fleet.targetStarIndex = targetIdx;
      
      let baseEta = 3;
      if (targetIdx > STAR_INDEX.PLUTO) {
        // Interstellar travel
        if (game.earthCivi.tecTreeManager.isTecFinishedAnywhere("光速飞船")) {
          baseEta = 1;
        } else if (game.earthCivi.tecTreeManager.isTecFinishedAnywhere("99%光速飞船")) {
          baseEta = 2;
        } else if (game.earthCivi.tecTreeManager.isTecFinishedAnywhere("50%光速飞船")) {
          baseEta = 4;
        } else if (game.earthCivi.tecTreeManager.isTecFinishedAnywhere("10%光速飞船")) {
          baseEta = 8;
        } else {
          baseEta = 15;
        }
      } else {
        // Intra-solar travel
        if (game.earthCivi.tecTreeManager.isTecFinishedAnywhere("10%光速飞船") || 
            game.earthCivi.tecTreeManager.isTecFinishedAnywhere("50%光速飞船") || 
            game.earthCivi.tecTreeManager.isTecFinishedAnywhere("99%光速飞船") || 
            game.earthCivi.tecTreeManager.isTecFinishedAnywhere("光速飞船")) {
          baseEta = 1;
        } else {
          baseEta = 3;
        }
      }
      fleet.eta = baseEta;
      fleet.totalEta = fleet.eta;
      
      game.addHistory(`【出征】${fleet.name} 离开 ${source.name}，目标 ${target.name}，预计 ${fleet.eta} 回合后抵达。`);
      forceUpdate(n => n + 1);
      window.dispatchEvent(new CustomEvent('game-turn-complete'));
    }
  };

  // Get known stars for dispatch targets
  const knownStars = Array.from(earth.starIndices).map(idx => game.starManager.getStar(idx)).filter(Boolean);
  
  // 1. Add all Solar System planets (indices 0 to 10) by default to make them reachable/colonizable
  const solarSystemIndices = [
    STAR_INDEX.MERCURY, STAR_INDEX.VENUS, STAR_INDEX.EARTH, STAR_INDEX.MOON,
    STAR_INDEX.MARS, STAR_INDEX.JUPITER, STAR_INDEX.SATURN, STAR_INDEX.URANUS,
    STAR_INDEX.NEPTUNE, STAR_INDEX.PLUTO
  ];
  solarSystemIndices.forEach(idx => {
    if (!earth.starIndices.has(idx)) {
      const s = game.starManager.getStar(idx);
      if (s && !knownStars.find(item => item && item.index === idx)) {
        knownStars.push(s);
      }
    }
  });

  // 2. Check if advanced propulsion/observatory technologies are completed, to unlock nearby star systems (indices 11 to 17)
  const isInterstellarUnlocked = 
    game.earthCivi.tecTreeManager.isTecFinishedAnywhere("50光年远镜") ||
    game.earthCivi.tecTreeManager.isTecFinishedAnywhere("10%光速飞船") ||
    game.earthCivi.tecTreeManager.isTecFinishedAnywhere("太阳波放大器50光年");

  if (isInterstellarUnlocked) {
    for (let idx = 11; idx <= 17; idx++) {
      if (!earth.starIndices.has(idx)) {
        const s = game.starManager.getStar(idx);
        if (s && !knownStars.find(item => item && item.index === idx)) {
          knownStars.push(s);
        }
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-4xl h-[560px] bg-[#070B14] border border-[#243245] shadow-[0_0_50px_rgba(0,184,255,0.15)] flex flex-col rounded overflow-hidden select-none">
        
        {/* Glow corner decorations */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-[var(--color-primary)]/50 pointer-events-none" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-[var(--color-primary)]/50 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-[var(--color-primary)]/50 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-[var(--color-primary)]/50 pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#243245]/40 bg-[#070B14] shrink-0">
          <div className="flex items-center gap-3">
            <Rocket className="text-[var(--color-primary)]" size={20} />
            <div>
              <h2 className="text-sm font-title font-bold text-white tracking-widest uppercase">地球联合舰队指挥与建造中心</h2>
              <div className="text-[10px] text-[var(--color-primary)]/60 font-mono uppercase tracking-widest mt-0.5">Fleet Command & Construction Archive</div>
            </div>
          </div>
          <button onClick={onClose} className="fleet-modal-close-btn p-1.5 text-[var(--text-secondary)] hover:text-white hover:bg-white/5 rounded transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-4 border-b border-[#243245]/20 shrink-0 bg-[#070B14]/30 flex justify-between items-center">
          <div className="text-[10px] font-mono text-[var(--text-secondary)]">
            可用拨款预算：<span className="text-white font-bold">{earth.economy} 经济单位</span>
          </div>
          <button 
            onClick={handleBuildFleet}
            className="flex items-center gap-2 px-4 py-2 bg-[rgba(var(--color-primary-rgb),0.1)] hover:bg-[rgba(var(--color-primary-rgb),0.2)] border border-[var(--color-primary)]/40 rounded text-[var(--color-primary)] font-bold text-xs transition-all tracking-wider uppercase cursor-pointer"
          >
            <Zap size={14} />
            建造恒星级战舰编队 (100 经济)
          </button>
        </div>

        {/* Fleet List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-xs text-[var(--text-secondary)]">
          {earth.fleets.length === 0 ? (
            <div className="text-center py-20 text-white/20 border border-[#243245]/30 rounded border-dashed">
              <Shield size={36} className="mx-auto mb-3 opacity-20" />
              <p className="tracking-wide">防空指挥部报告：当前星域内暂无现役舰队，请先建造。</p>
            </div>
          ) : (
            earth.fleets.map(fleet => {
              const isTraveling = fleet.eta > 0;
              const source = game.starManager.getStar(fleet.sourceStarIndex);
              const target = game.starManager.getStar(fleet.targetStarIndex);

              return (
                <div key={fleet.id} className="bg-[#070B14]/40 border border-[#243245]/30 rounded p-4 hover:border-[var(--color-primary)]/50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    
                    {/* Left: Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-bold text-white tracking-wider">{fleet.name}</h3>
                        {isTraveling ? (
                          <span className="px-2 py-0.5 rounded-[2px] text-[9px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/25">
                            深空航行中
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-[2px] text-[9px] font-bold bg-green-500/10 text-green-400 border border-green-500/25">
                            驻防中 · {source?.name || '未知'}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                        <span>指挥官：</span>
                        <select
                          value={fleet.leaderName || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              const p = game.personManager.getPerson(val);
                              if (p) {
                                fleet.leaderName = val;
                                forceUpdate(n => n + 1);
                              }
                            } else {
                              fleet.leaderName = null;
                              forceUpdate(n => n + 1);
                            }
                          }}
                          className="bg-[#070B14] border border-[#243245]/60 text-white text-[11px] outline-none rounded px-2 py-1 focus:border-[var(--color-primary)] disabled:opacity-50"
                          disabled={isTraveling} // Cannot change leader while traveling
                        >
                          <option value="">未指派</option>
                          {Array.from(game.personManager.availablePersons).map(name => {
                            const p = game.personManager.getPerson(name);
                            if (p && p.army > 0) return <option key={name} value={name}>{name}</option>;
                            return null;
                          })}
                          {/* Always show current leader even if no longer in available list */}
                          {fleet.leaderName && !game.personManager.availablePersons.has(fleet.leaderName) && (
                            <option value={fleet.leaderName}>{fleet.leaderName}</option>
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Right: Dispatch / Status */}
                    <div className="text-right">
                      {isTraveling ? (
                        <div className="flex flex-col items-end space-y-1">
                          <div className="flex items-center gap-2 text-[11px] text-orange-400 font-bold">
                            <span>{source?.name}</span>
                            <ArrowRight size={12} className="animate-pulse" />
                            <span>{target?.name}</span>
                          </div>
                          <div className="text-[10px] text-white/40">预计抵达：还剩 {fleet.eta} 回合</div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <select 
                            id={`dispatch-target-${fleet.id}`}
                            className="bg-[#070B14] border border-[#243245]/60 text-white text-[11px] outline-none rounded px-2 py-1.5 focus:border-[var(--color-primary)]"
                            defaultValue=""
                          >
                            <option value="" disabled>选择折跃目标星系...</option>
                            {knownStars.map(s => (
                              s && s.index !== fleet.sourceStarIndex && (
                                <option key={s.index} value={s.index}>{s.name} ({s.belongToCivi || '无主'})</option>
                              )
                            ))}
                          </select>
                          <button 
                            onClick={() => {
                              const select = document.getElementById(`dispatch-target-${fleet.id}`) as HTMLSelectElement;
                              if (select && select.value) {
                                handleDispatch(fleet, select.value);
                              } else {
                                alert("请先选择目标星系！");
                              }
                            }}
                            className="px-4 py-1.5 bg-cyan-950/20 hover:bg-cyan-950/40 border border-[var(--color-primary)]/50 text-[var(--color-primary)] font-bold text-xs rounded transition-colors cursor-pointer"
                          >
                            派遣
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Weapons Build Progress */}
                  <div className="mt-4 pt-4 border-t border-[#243245]/20 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Wrench size={11} className="text-white/30" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white/30 font-title">舰载战术武器序列与维护指数</span>
                    </div>
                    {fleet.weapons.map((wp, wi) => {
                      const proto = (weaponsData as any[]).find((w: any) => w.name === wp.weaponName);
                      const totalBuild = proto?.totalBuild ?? 100;
                      const pct = Math.min((wp.currentBuild / totalBuild) * 100, 100);
                      const isFinished = wp.currentBuild >= totalBuild;
                      return (
                        <div key={wi} className="flex items-center gap-3 text-[11px]">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isFinished ? 'bg-[var(--color-primary)]' : 'bg-amber-500'}`} />
                          <span className="text-white/70 w-28 flex-shrink-0 truncate">{wp.weaponName}</span>
                          <div className="flex-1 h-1 bg-white/5 border border-white/5 rounded overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${isFinished ? 'bg-[var(--color-primary)]' : 'bg-amber-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={`font-bold w-12 text-right ${isFinished ? 'text-[var(--color-primary)]' : 'text-amber-500'}`}>
                            {isFinished ? '就绪' : `${Math.floor(pct)}%`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
