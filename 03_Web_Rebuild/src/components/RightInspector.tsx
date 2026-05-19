import React, { useState, useEffect } from 'react';
import { Target, Zap, ArrowUpCircle, Rocket, Factory, Pickaxe, Building, Gem, Skull, Crown, Anchor, Wrench } from 'lucide-react';
import { GameInstance } from '../core/Game';
import { Star } from '../core/Star';
import { createFleet } from '../core/Fleet';
import weaponsData from '../data/weapons.json';
import { STAR_INDEX } from '../config/starIndices';

export const RightInspector: React.FC = () => {
  const [selectedStar, setSelectedStar] = useState<Star | null>(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const handleStarSelect = (e: Event) => {
      const customEvent = e as CustomEvent<Star>;
      setSelectedStar(customEvent.detail);
    };
    const handleTurnComplete = () => forceUpdate(n => n + 1);

    window.addEventListener('star-selected', handleStarSelect);
    window.addEventListener('game-turn-complete', handleTurnComplete);
    return () => {
      window.removeEventListener('star-selected', handleStarSelect);
      window.removeEventListener('game-turn-complete', handleTurnComplete);
    };
  }, []);

  const game = GameInstance.get();
  const star = selectedStar || (() => {
    const earth = game.starManager.getStar(STAR_INDEX.EARTH);
    return earth || null;
  })();

  if (!star) {
    return (
      <aside className="w-80 h-full glass-panel border-l border-white/5 flex flex-col p-6">
        <p className="text-[var(--text-secondary)]">选择一颗星球以查看详情</p>
      </aside>
    );
  }

  const isEarth = star.belongToCivi === "地球";
  const earth = game.earthCivi;

  const handleBuildStope = () => {
    if (!star.hasStope && !star.buildingProgress?.stope && earth.economy >= 30) {
      earth.economy -= 30;
      star.buildingProgress = star.buildingProgress || {};
      star.buildingProgress.stope = { currentBuild: 0, totalBuild: 100, buildPerRound: 20 };
      game.addHistory(`在 ${star.name} 开始建造采矿场（预计5回合完成），消耗 30 经济。`);
      forceUpdate(n => n + 1);
    } else if (star.buildingProgress?.stope) {
      alert("该星球正在建造采矿场！");
    } else if (!star.hasStope) {
      alert("经济不足 30 点！");
    }
  };
  const handleBuildFactory = () => {
    if (!star.hasFactory && !star.buildingProgress?.factory && earth.economy >= 50) {
      earth.economy -= 50;
      star.buildingProgress = star.buildingProgress || {};
      star.buildingProgress.factory = { currentBuild: 0, totalBuild: 150, buildPerRound: 25 };
      game.addHistory(`在 ${star.name} 开始建造加工厂（预计6回合完成），消耗 50 经济。`);
      forceUpdate(n => n + 1);
    } else if (star.buildingProgress?.factory) {
      alert("该星球正在建造加工厂！");
    } else if (!star.hasFactory) {
      alert("经济不足 50 点！");
    }
  };
  const handleBuildCity = () => {
    if (!star.hasCity && !star.buildingProgress?.city && earth.economy >= 80) {
      earth.economy -= 80;
      star.buildingProgress = star.buildingProgress || {};
      star.buildingProgress.city = { currentBuild: 0, totalBuild: 200, buildPerRound: 30 };
      game.addHistory(`在 ${star.name} 开始建造太空城市（预计7回合完成），消耗 80 经济。`);
      forceUpdate(n => n + 1);
    } else if (star.buildingProgress?.city) {
      alert("该星球正在建造太空城市！");
    } else if (!star.hasCity) {
      alert("经济不足 80 点！");
    }
  };
  const handleBuildFleet = () => {
    if (earth.economy >= 100) {
      earth.economy -= 100;
      const fleet = createFleet("地球舰队", "地球", star.index, 0, 0);
      fleet.weapons.push({ weaponName: "恒星级战舰", currentBuild: 10 });
      fleet.weapons.push({ weaponName: "恒星级战舰", currentBuild: 10 });
      fleet.weapons.push({ weaponName: "恒星级战舰", currentBuild: 10 });
      fleet.leaderName = "章北海";
      earth.fleets.push(fleet);
      game.addHistory(`在 ${star.name} 开始建造恒星级战舰编队（3艘，消耗 100 经济），舰队已就绪等待出击。`);
      forceUpdate(n => n + 1);
      window.dispatchEvent(new CustomEvent('game-turn-complete'));
    } else {
      alert("经济不足 100 点！");
    }
  };
  const handleDispatchFleet = () => {
    const fleet = createFleet("地球第一舰队", "地球", star.index, STAR_INDEX.MARS, 3);
    fleet.leaderName = "章北海";
    fleet.weapons.push({ weaponName: "恒星级战舰", currentBuild: 10 });
    earth.fleets.push(fleet);
    game.addHistory(`【出征】组建 ${fleet.name} 离开 ${star.name}，目标火星，预计 3 回合后抵达。`);
    forceUpdate(n => n + 1);
    window.dispatchEvent(new CustomEvent('game-turn-complete'));
  };

  return (
    <aside className="w-80 h-full glass-panel border-l border-white/5 flex flex-col p-6 animate-in slide-in-from-right duration-300">
      <div className="flex flex-col gap-1 mb-6">
        <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">
          Current Selection
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-primary)]">{star.name}</h2>
        <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
          <Target size={12} />
          <span>所属: {star.belongToCivi || "无"} | 资源: {star.currentResource}/{star.totalResource}</span>
        </div>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto pr-2">
        <section className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">星球概况</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/5 dark:bg-white/5 p-2.5 rounded border border-white/5">
              <div className="text-[10px] text-[var(--text-secondary)] uppercase">人口上限</div>
              <div className="text-sm font-bold font-data">{star.populationLimit}</div>
            </div>
            <div className="bg-black/5 dark:bg-white/5 p-2.5 rounded border border-white/5">
              <div className="text-[10px] text-[var(--text-secondary)] uppercase">当前人口</div>
              <div className="text-sm font-bold font-data">{star.currentPopulation}</div>
            </div>
          </div>
        </section>

        {isEarth && (
          <>
            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">文明状态</h3>
              <div className="space-y-3">
                <div className="bg-black/5 dark:bg-white/5 p-2.5 rounded border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Crown size={11} className="text-yellow-400" />
                      <span className="text-[10px] text-[var(--text-secondary)] uppercase">文明等级</span>
                    </div>
                    <span className="text-xs font-bold text-yellow-400">{earth.getCiviLevelLabel()}</span>
                  </div>
                </div>
                <div className="bg-black/5 dark:bg-white/5 p-2.5 rounded border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Gem size={11} className="text-cyan-400" />
                      <span className="text-[10px] text-[var(--text-secondary)] uppercase">资源储备</span>
                    </div>
                    <span className="text-xs font-bold text-cyan-400">{earth.resource}</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Skull size={11} className={earth.treachery > 80 ? "text-red-500" : "text-[var(--text-secondary)]"} />
                      <span className="text-[10px] text-[var(--text-secondary)] uppercase">逃亡主义</span>
                    </div>
                    <span className={`text-xs font-bold ${earth.treachery > 80 ? "text-red-500" : ""}`}>{earth.treachery}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${earth.treachery > 80 ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(earth.treachery, 100)}%` }} />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">工人分配</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[var(--text-secondary)]">采矿工人</span>
                  <span className="font-bold">{earth.miningWorkers}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[var(--text-secondary)]">工厂工人</span>
                  <span className="font-bold">{earth.factoryWorkers}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[var(--text-secondary)]">文化工人</span>
                  <span className="font-bold">{earth.cultureWorkers}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[var(--text-secondary)]">闲置工人</span>
                  <span className="font-bold">{earth.idleWorkers}</span>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">基建设施</h3>
              <div className="space-y-2">
                <button onClick={handleBuildStope} className="w-full flex flex-col p-3 rounded-lg border border-white/10 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all group">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <Pickaxe className={star.hasStope ? "text-[var(--color-primary)]" : "text-[var(--text-secondary)]"} size={18} />
                      <div className="text-left">
                        <div className="text-sm font-bold">{star.hasStope ? '✅' : star.buildingProgress?.stope ? '🔨' : '➕'} 采矿场</div>
                        {!star.hasStope && !star.buildingProgress?.stope && <div className="text-[10px] text-[var(--text-secondary)]">消耗 30 经济 (5回合)</div>}
                      </div>
                    </div>
                    {!star.hasStope && !star.buildingProgress?.stope && <ArrowUpCircle className="opacity-0 group-hover:opacity-100 transition-opacity" size={16} />}
                  </div>
                  {star.buildingProgress?.stope && !star.hasStope && (
                    <div className="w-full mt-2">
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500 rounded-full transition-all" style={{ width: `${(star.buildingProgress.stope.currentBuild / star.buildingProgress.stope.totalBuild) * 100}%` }} />
                      </div>
                      <div className="text-[9px] text-[var(--text-secondary)] mt-0.5">建造中 {Math.floor((star.buildingProgress.stope.currentBuild / star.buildingProgress.stope.totalBuild) * 100)}%</div>
                    </div>
                  )}
                </button>
                <button onClick={handleBuildFactory} className="w-full flex flex-col p-3 rounded-lg border border-white/10 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all group">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <Factory className={star.hasFactory ? "text-[var(--color-primary)]" : "text-[var(--text-secondary)]"} size={18} />
                      <div className="text-left">
                        <div className="text-sm font-bold">{star.hasFactory ? '✅' : star.buildingProgress?.factory ? '🔨' : '➕'} 加工厂</div>
                        {!star.hasFactory && !star.buildingProgress?.factory && <div className="text-[10px] text-[var(--text-secondary)]">消耗 50 经济 (6回合)</div>}
                      </div>
                    </div>
                    {!star.hasFactory && !star.buildingProgress?.factory && <ArrowUpCircle className="opacity-0 group-hover:opacity-100 transition-opacity" size={16} />}
                  </div>
                  {star.buildingProgress?.factory && !star.hasFactory && (
                    <div className="w-full mt-2">
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500 rounded-full transition-all" style={{ width: `${(star.buildingProgress.factory.currentBuild / star.buildingProgress.factory.totalBuild) * 100}%` }} />
                      </div>
                      <div className="text-[9px] text-[var(--text-secondary)] mt-0.5">建造中 {Math.floor((star.buildingProgress.factory.currentBuild / star.buildingProgress.factory.totalBuild) * 100)}%</div>
                    </div>
                  )}
                </button>
                <button onClick={handleBuildCity} className="w-full flex flex-col p-3 rounded-lg border border-white/10 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all group">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <Building className={star.hasCity ? "text-[var(--color-primary)]" : "text-[var(--text-secondary)]"} size={18} />
                      <div className="text-left">
                        <div className="text-sm font-bold">{star.hasCity ? '✅' : star.buildingProgress?.city ? '🔨' : '➕'} 太空城市</div>
                        {!star.hasCity && !star.buildingProgress?.city && <div className="text-[10px] text-[var(--text-secondary)]">消耗 80 经济 (7回合)</div>}
                      </div>
                    </div>
                    {!star.hasCity && !star.buildingProgress?.city && <ArrowUpCircle className="opacity-0 group-hover:opacity-100 transition-opacity" size={16} />}
                  </div>
                  {star.buildingProgress?.city && !star.hasCity && (
                    <div className="w-full mt-2">
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500 rounded-full transition-all" style={{ width: `${(star.buildingProgress.city.currentBuild / star.buildingProgress.city.totalBuild) * 100}%` }} />
                      </div>
                      <div className="text-[9px] text-[var(--text-secondary)] mt-0.5">建造中 {Math.floor((star.buildingProgress.city.currentBuild / star.buildingProgress.city.totalBuild) * 100)}%</div>
                    </div>
                  )}
                </button>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">军工与舰队</h3>
              <div className="space-y-2">
                <button onClick={handleBuildFleet} className="w-full flex items-center justify-between p-3 rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10 transition-all">
                  <div className="flex items-center gap-3">
                    <Zap className="text-[var(--color-primary)]" size={18} />
                    <div className="text-left">
                      <div className="text-sm font-bold">建造战舰 (3 艘)</div>
                      <div className="text-[10px] text-[var(--text-secondary)]">消耗 100 经济</div>
                    </div>
                  </div>
                </button>
                <button onClick={handleDispatchFleet} className="w-full flex items-center justify-between p-3 rounded-lg border border-orange-500/30 hover:bg-orange-500/10 transition-all">
                  <div className="flex items-center gap-3">
                    <Rocket className="text-orange-500" size={18} />
                    <div className="text-left">
                      <div className="text-sm font-bold text-orange-400">🚀 派遣舰队</div>
                      <div className="text-[10px] text-[var(--text-secondary)]">目标: 木星</div>
                    </div>
                  </div>
                </button>
              </div>

              {earth.fleets.filter(f => f.weapons.length > 0).length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Wrench size={12} className="text-[var(--text-secondary)]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">武器建造进度</span>
                  </div>
                  {earth.fleets.filter(f => f.weapons.length > 0).map((fleet) => (
                    <div key={fleet.id} className="bg-black/5 dark:bg-white/5 rounded-lg border border-white/5 p-2.5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Anchor size={12} className="text-[var(--color-primary)]" />
                          <span className="text-[11px] font-bold truncate max-w-[140px]">{fleet.name}</span>
                        </div>
                        <span className="text-[9px] text-[var(--text-secondary)]">
                          {fleet.leaderName || '未指派'}
                        </span>
                      </div>
                      {fleet.weapons.map((wp, wi) => {
                        const proto = (weaponsData as any[]).find((w: any) => w.name === wp.weaponName);
                        const totalBuild = proto?.totalBuild ?? 100;
                        const pct = Math.min((wp.currentBuild / totalBuild) * 100, 100);
                        const isFinished = wp.currentBuild >= totalBuild;
                        return (
                          <div key={wi} className="flex items-center gap-2 mb-1 last:mb-0">
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isFinished ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            <span className="text-[10px] text-[var(--text-secondary)] flex-shrink-0 w-14 truncate">{wp.weaponName}</span>
                            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${isFinished ? 'bg-green-500' : 'bg-yellow-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={`text-[9px] font-bold flex-shrink-0 w-8 text-right ${isFinished ? 'text-green-500' : 'text-[var(--text-secondary)]'}`}>
                              {isFinished ? '✓' : `${Math.floor(pct)}%`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <div className="mt-auto pt-6 border-t border-white/5">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-bold uppercase text-[var(--text-secondary)]">舰队数</span>
          <span className="text-xs font-data font-bold">{earth.fleets.length}</span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[var(--color-primary)] rounded-full" style={{ width: `${Math.min(earth.deterrenceValue, 100)}%` }} />
        </div>
        <div className="text-[10px] text-right text-[var(--text-secondary)] mt-1">威慑度: {Math.floor(earth.deterrenceValue)}%</div>
      </div>
    </aside>
  );
};
