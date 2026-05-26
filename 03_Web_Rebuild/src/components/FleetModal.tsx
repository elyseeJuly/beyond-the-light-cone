import React, { useState, useEffect } from 'react';
import { X, Rocket, Crosshair, Wrench, Shield, ArrowRight, Zap, Target } from 'lucide-react';
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
      // Simple ETA: 3 turns for intra-solar, more for deep space.
      fleet.eta = targetIdx > STAR_INDEX.OORT_CLOUD ? 15 : 3; 
      fleet.totalEta = fleet.eta;
      
      game.addHistory(`【出征】${fleet.name} 离开 ${source.name}，目标 ${target.name}，预计 ${fleet.eta} 回合后抵达。`);
      forceUpdate(n => n + 1);
      window.dispatchEvent(new CustomEvent('game-turn-complete'));
    }
  };

  // Get known stars for dispatch targets
  const knownStars = Array.from(earth.starIndices).map(idx => game.starManager.getStar(idx)).filter(Boolean);
  // Add some default uncolonized but known targets (like Mars, Jupiter) if not already colonized
  [STAR_INDEX.MARS, STAR_INDEX.JUPITER, STAR_INDEX.SATURN].forEach(idx => {
    if (!earth.starIndices.has(idx)) {
      const s = game.starManager.getStar(idx);
      if (s) knownStars.push(s);
    }
  });

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[85vh] bg-[#0a0f16] border border-cyan-900/50 rounded-xl shadow-2xl shadow-cyan-900/20 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-900/50 bg-gradient-to-r from-cyan-950/40 to-transparent">
          <div className="flex items-center gap-3">
            <Rocket className="text-cyan-400" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white tracking-widest">地球联合舰队指挥中心</h2>
              <div className="text-xs text-cyan-400/60 uppercase tracking-widest mt-0.5">Fleet Command Center</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-6 pb-2">
          <button 
            onClick={handleBuildFleet}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-900/30 hover:bg-cyan-800/50 border border-cyan-700/50 rounded-lg text-cyan-300 font-bold transition-all shadow-lg hover:shadow-cyan-900/50"
          >
            <Zap size={18} />
            建造恒星级战舰编队 (消耗 100 经济)
          </button>
        </div>

        {/* Fleet List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {earth.fleets.length === 0 ? (
            <div className="text-center py-20 text-white/30 border border-white/5 rounded-xl border-dashed">
              <Shield size={48} className="mx-auto mb-4 opacity-20" />
              <p>暂无现役舰队，请先拨款建造。</p>
            </div>
          ) : (
            earth.fleets.map(fleet => {
              const isTraveling = fleet.eta > 0;
              const source = game.starManager.getStar(fleet.sourceStarIndex);
              const target = game.starManager.getStar(fleet.targetStarIndex);

              return (
                <div key={fleet.id} className="bg-black/40 border border-white/10 rounded-xl p-5 hover:border-cyan-500/30 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    
                    {/* Left: Info */}
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-white">{fleet.name}</h3>
                        {isTraveling ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/20">
                            航行中
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/20">
                            驻防在 {source?.name || '未知'}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-white/50">
                        <div className="flex items-center gap-1.5">
                          <Target size={14} />
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
                            className="bg-black/50 border border-white/20 text-white text-xs outline-none rounded px-2 py-1 focus:border-cyan-500"
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
                    </div>

                    {/* Right: Dispatch / Status */}
                    <div className="text-right">
                      {isTraveling ? (
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2 text-sm text-orange-400 font-bold mb-1">
                            <span>{source?.name}</span>
                            <ArrowRight size={14} className="animate-pulse" />
                            <span>{target?.name}</span>
                          </div>
                          <div className="text-xs text-white/40">预计 {fleet.eta} 回合后抵达</div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <select 
                            id={`dispatch-target-${fleet.id}`}
                            className="bg-black/50 border border-white/20 text-white text-xs outline-none rounded px-2 py-1.5"
                            defaultValue=""
                          >
                            <option value="" disabled>选择目标星系...</option>
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
                            className="px-4 py-1.5 bg-orange-500/20 hover:bg-orange-500/40 border border-orange-500/50 text-orange-400 font-bold text-xs rounded transition-colors"
                          >
                            派遣
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Weapons Build Progress */}
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Wrench size={12} className="text-white/40" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">舰船建造与维护进度</span>
                    </div>
                    {fleet.weapons.map((wp, wi) => {
                      const proto = (weaponsData as any[]).find((w: any) => w.name === wp.weaponName);
                      const totalBuild = proto?.totalBuild ?? 100;
                      const pct = Math.min((wp.currentBuild / totalBuild) * 100, 100);
                      const isFinished = wp.currentBuild >= totalBuild;
                      return (
                        <div key={wi} className="flex items-center gap-3 text-xs">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isFinished ? 'bg-cyan-500' : 'bg-amber-500'}`} />
                          <span className="text-white/70 w-24 flex-shrink-0 truncate">{wp.weaponName}</span>
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${isFinished ? 'bg-cyan-500' : 'bg-amber-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={`font-bold w-10 text-right ${isFinished ? 'text-cyan-500' : 'text-amber-500'}`}>
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
