import React, { useState, useEffect } from 'react';
import { Target, ArrowUpCircle, Rocket, Factory, Pickaxe, Building } from 'lucide-react';
import { GameInstance } from '../core/Game';
import { Star } from '../core/Star';
import { STAR_INDEX } from '../config/starIndices';
import { EndingForecastPanel } from './ending/EndingForecastPanel';

type TabType = 'overview' | 'build' | 'fleet' | 'history';

export const RightInspector: React.FC = () => {
  const [selectedStar, setSelectedStar] = useState<Star | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const handleStarSelect = (e: Event) => {
      const customEvent = e as CustomEvent<Star>;
      setSelectedStar(customEvent.detail);
      setActiveTab('overview');
    };
    const handleTurnComplete = () => forceUpdate(n => n + 1);
    const handleLangChange = () => forceUpdate(n => n + 1);

    window.addEventListener('star-selected', handleStarSelect);
    window.addEventListener('game-turn-complete', handleTurnComplete);
    window.addEventListener('game-language-changed', handleLangChange);
    return () => {
      window.removeEventListener('star-selected', handleStarSelect);
      window.removeEventListener('game-turn-complete', handleTurnComplete);
      window.removeEventListener('game-language-changed', handleLangChange);
    };
  }, []);

  const game = GameInstance.get();
  const star = selectedStar || (() => {
    const earth = game.starManager.getStar(STAR_INDEX.EARTH);
    return earth || null;
  })();

  if (!star) {
    return (
      <aside className="w-[320px] h-full bg-[#070B14]/75 backdrop-blur-[12px] border-l border-[#243245]/50 flex flex-col p-6 select-none shrink-0">
        <p className="text-[var(--text-secondary)] text-sm font-mono">选择一颗星球以查看详情</p>
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

  return (
    <aside className="w-[320px] h-full bg-[#070B14]/75 backdrop-blur-[12px] border-l border-[#243245]/50 flex flex-col p-5 animate-in slide-in-from-right duration-300 select-none shrink-0">
      {/* Target Title Block */}
      <div className="flex flex-col gap-1 mb-4 shrink-0">
        <div className="text-[10px] font-title font-bold text-[var(--color-primary)] uppercase tracking-[0.2em]">
          ARCHIVE DATA
        </div>
        <h2 className="text-xl font-extrabold text-white tracking-wide">{star.name}</h2>
        <div className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1 font-mono">
          <Target size={10} className="stroke-[1.5]" />
          <span>所属: {star.belongToCivi || "无主星域"} | 资源: {star.currentResource}/{star.totalResource}</span>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-[#243245]/40 mb-4 shrink-0">
        {(['overview', 'build', 'fleet', 'history'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-center py-2 text-[11px] font-title font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
              activeTab === tab 
                ? 'border-[var(--color-primary)] text-white' 
                : 'border-transparent text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            {tab === 'overview' && '概况'}
            {tab === 'build' && '建设'}
            {tab === 'fleet' && '舰队'}
            {tab === 'history' && '历史'}
          </button>
        ))}
      </div>

      {/* Dynamic Tab Body */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <section className="space-y-2.5">
              <div className="text-[10px] font-title font-bold text-[var(--color-primary)] uppercase tracking-wider">
                天体数据概要
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-[#070B14]/40 p-2.5 rounded border border-[#243245]/30">
                  <div className="text-[9px] text-[var(--text-secondary)] uppercase">人口承载限额</div>
                  <div className="text-sm font-bold font-data mt-0.5">{star.populationLimit} 万</div>
                </div>
                <div className="bg-[#070B14]/40 p-2.5 rounded border border-[#243245]/30">
                  <div className="text-[9px] text-[var(--text-secondary)] uppercase">常驻殖民人口</div>
                  <div className="text-sm font-bold font-data mt-0.5">{star.currentPopulation} 万</div>
                </div>
              </div>
            </section>

            {isEarth && (
              <>
                <section className="space-y-2.5">
                  <div className="text-[10px] font-title font-bold text-[var(--color-primary)] uppercase tracking-wider">
                    行政管理比重
                  </div>
                  {(() => {
                    let stopeCount = 0;
                    let factoryCount = 0;
                    for (const idx of earth.starIndices) {
                      const s = game.starManager.getStar(idx);
                      if (s) {
                        if (s.hasStope) stopeCount++;
                        if (s.hasFactory) factoryCount++;
                      }
                    }
                    const totalPop = earth.population || 1;
                    const actualMiningPct = Math.round((earth.miningWorkers / totalPop) * 100);
                    const actualFactoryPct = Math.round((earth.factoryWorkers / totalPop) * 100);
                    const actualCulturePct = Math.round((earth.cultureWorkers / totalPop) * 100);

                    const miningShortage = stopeCount > 0 && earth.miningWorkers < stopeCount * 5;
                    const factoryShortage = factoryCount > 0 && earth.factoryWorkers < factoryCount * 5;

                    return (
                      <div className="space-y-3 bg-[#070B14]/40 p-3 rounded border border-[#243245]/30">
                        {/* Mining */}
                        <div className={`space-y-1 p-1 rounded transition-colors ${miningShortage ? 'border border-orange-500/20 bg-orange-500/5' : ''}`}>
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className={`${miningShortage ? 'text-orange-400 font-bold animate-pulse' : 'text-[var(--text-secondary)]'}`}>
                              采矿占比: {earth.miningRatio}% (实际: {actualMiningPct}%)
                              {miningShortage && ' (缺工)'}
                            </span>
                            <span className={`font-bold font-data ${miningShortage ? 'text-orange-400' : 'text-[var(--color-primary)]'}`}>{earth.miningWorkers}万人</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={earth.miningRatio} 
                            onChange={(ev) => {
                              earth.miningRatio = parseInt(ev.target.value, 10);
                              earth.allocateWorkers();
                              forceUpdate(n => n + 1);
                            }}
                            className={`w-full h-1 rounded appearance-none cursor-pointer ${miningShortage ? 'bg-orange-950 accent-orange-500' : 'bg-cyan-950 accent-[var(--color-primary)]'}`}
                          />
                        </div>
                        {/* Factory */}
                        <div className={`space-y-1 p-1 rounded transition-colors ${factoryShortage ? 'border border-orange-500/20 bg-orange-500/5' : ''}`}>
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className={`${factoryShortage ? 'text-orange-400 font-bold animate-pulse' : 'text-[var(--text-secondary)]'}`}>
                              加工占比: {earth.factoryRatio}% (实际: {actualFactoryPct}%)
                              {factoryShortage && ' (缺工)'}
                            </span>
                            <span className={`font-bold font-data ${factoryShortage ? 'text-orange-400' : 'text-emerald-400'}`}>{earth.factoryWorkers}万人</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={earth.factoryRatio} 
                            onChange={(ev) => {
                              earth.factoryRatio = parseInt(ev.target.value, 10);
                              earth.allocateWorkers();
                              forceUpdate(n => n + 1);
                            }}
                            className={`w-full h-1 rounded appearance-none cursor-pointer ${factoryShortage ? 'bg-orange-950 accent-orange-500' : 'bg-emerald-950 accent-emerald-400'}`}
                          />
                        </div>
                        {/* Culture */}
                        <div className="space-y-1 p-1 rounded">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-[var(--text-secondary)]">文化占比: {earth.cultureRatio}% (实际: {actualCulturePct}%)</span>
                            <span className="font-bold text-amber-400 font-data">{earth.cultureWorkers}万人</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={earth.cultureRatio} 
                            onChange={(ev) => {
                              earth.cultureRatio = parseInt(ev.target.value, 10);
                              earth.allocateWorkers();
                              forceUpdate(n => n + 1);
                            }}
                            className="w-full h-1 bg-amber-950 rounded appearance-none cursor-pointer accent-amber-400"
                          />
                        </div>
                        {/* Idle workers */}
                        <div className="flex justify-between text-[10px] font-mono pt-1.5 border-t border-[#243245]/20 px-1">
                          <span className="text-[var(--text-secondary)]">闲置科研与劳动力</span>
                          <span className="font-bold text-slate-300 font-data">{earth.idleWorkers}万人</span>
                        </div>
                      </div>
                    );
                  })()}
                </section>

                <section className="space-y-2.5">
                  <EndingForecastPanel />
                </section>
              </>
            )}
          </div>
        )}

        {activeTab === 'build' && (
          <div className="space-y-3">
            <div className="text-[10px] font-title font-bold text-[var(--color-primary)] uppercase tracking-wider">
              轨道基础设施计划
            </div>
            
            <button onClick={handleBuildStope} className="w-full flex flex-col p-3 rounded bg-[#070B14]/40 border border-[#243245]/30 hover:border-[var(--color-primary)] hover:bg-[#070B14]/60 transition-all group cursor-pointer text-left">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <Pickaxe className={star.hasStope ? "text-[var(--color-primary)]" : "text-[var(--text-secondary)]"} size={16} />
                  <div>
                    <div className="text-xs font-bold text-white">{star.hasStope ? '✅ 资源采矿场 已就绪' : star.buildingProgress?.stope ? '🔨 采矿场建造中' : '➕ 筹建采矿场'}</div>
                    {!star.hasStope && !star.buildingProgress?.stope && <div className="text-[9px] text-[var(--text-secondary)] mt-0.5">消耗 30 经济 | 预估 5 回合</div>}
                  </div>
                </div>
                {!star.hasStope && !star.buildingProgress?.stope && <ArrowUpCircle className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-primary)]" size={14} />}
              </div>
              {star.buildingProgress?.stope && !star.hasStope && (
                <div className="w-full mt-2">
                  <div className="h-1 bg-white/10 rounded overflow-hidden">
                    <div className="h-full bg-[var(--color-primary)] transition-all" style={{ width: `${(star.buildingProgress.stope.currentBuild / star.buildingProgress.stope.totalBuild) * 100}%` }} />
                  </div>
                  <div className="text-[8px] text-[var(--text-secondary)] mt-0.5 font-mono">建造进度 {Math.floor((star.buildingProgress.stope.currentBuild / star.buildingProgress.stope.totalBuild) * 100)}%</div>
                </div>
              )}
            </button>

            <button onClick={handleBuildFactory} className="w-full flex flex-col p-3 rounded bg-[#070B14]/40 border border-[#243245]/30 hover:border-[var(--color-primary)] hover:bg-[#070B14]/60 transition-all group cursor-pointer text-left">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <Factory className={star.hasFactory ? "text-[var(--color-primary)]" : "text-[var(--text-secondary)]"} size={16} />
                  <div>
                    <div className="text-xs font-bold text-white">{star.hasFactory ? '✅ 工业加工厂 已就绪' : star.buildingProgress?.factory ? '🔨 加工厂建造中' : '➕ 筹建加工厂'}</div>
                    {!star.hasFactory && !star.buildingProgress?.factory && <div className="text-[9px] text-[var(--text-secondary)] mt-0.5">消耗 50 经济 | 预估 6 回合</div>}
                  </div>
                </div>
                {!star.hasFactory && !star.buildingProgress?.factory && <ArrowUpCircle className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-primary)]" size={14} />}
              </div>
              {star.buildingProgress?.factory && !star.hasFactory && (
                <div className="w-full mt-2">
                  <div className="h-1 bg-white/10 rounded overflow-hidden">
                    <div className="h-full bg-[var(--color-primary)] transition-all" style={{ width: `${(star.buildingProgress.factory.currentBuild / star.buildingProgress.factory.totalBuild) * 100}%` }} />
                  </div>
                  <div className="text-[8px] text-[var(--text-secondary)] mt-0.5 font-mono">建造进度 {Math.floor((star.buildingProgress.factory.currentBuild / star.buildingProgress.factory.totalBuild) * 100)}%</div>
                </div>
              )}
            </button>

            <button onClick={handleBuildCity} className="w-full flex flex-col p-3 rounded bg-[#070B14]/40 border border-[#243245]/30 hover:border-[var(--color-primary)] hover:bg-[#070B14]/60 transition-all group cursor-pointer text-left">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <Building className={star.hasCity ? "text-[var(--color-primary)]" : "text-[var(--text-secondary)]"} size={16} />
                  <div>
                    <div className="text-xs font-bold text-white">{star.hasCity ? '✅ 太空星港城市 已就绪' : star.buildingProgress?.city ? '🔨 城市工程推进中' : '➕ 筹建太空城市'}</div>
                    {!star.hasCity && !star.buildingProgress?.city && <div className="text-[9px] text-[var(--text-secondary)] mt-0.5">消耗 80 经济 | 预估 7 回合</div>}
                  </div>
                </div>
                {!star.hasCity && !star.buildingProgress?.city && <ArrowUpCircle className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-primary)]" size={14} />}
              </div>
              {star.buildingProgress?.city && !star.hasCity && (
                <div className="w-full mt-2">
                  <div className="h-1 bg-white/10 rounded overflow-hidden">
                    <div className="h-full bg-[var(--color-primary)] transition-all" style={{ width: `${(star.buildingProgress.city.currentBuild / star.buildingProgress.city.totalBuild) * 100}%` }} />
                  </div>
                  <div className="text-[8px] text-[var(--text-secondary)] mt-0.5 font-mono">建造进度 {Math.floor((star.buildingProgress.city.currentBuild / star.buildingProgress.city.totalBuild) * 100)}%</div>
                </div>
              )}
            </button>
          </div>
        )}

        {activeTab === 'fleet' && (
          <div className="space-y-3">
            <div className="text-[10px] font-title font-bold text-[var(--color-primary)] uppercase tracking-wider">
              驻防与轨道防御力量
            </div>
            
            <div className="bg-[#070B14]/40 p-3 rounded border border-[#243245]/30 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[var(--text-secondary)]">驻守舰队数量</span>
                <span className="text-white font-bold">{earth.fleets.filter(f => f.targetStarIndex === star.index || f.sourceStarIndex === star.index).length} 支</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[var(--text-secondary)]">当前总威慑度</span>
                <span className="text-red-400 font-bold">{Math.floor(earth.deterrenceValue)}%</span>
              </div>
            </div>

            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-fleet-modal'))}
              className="w-full flex items-center justify-between p-3 rounded bg-[rgba(var(--color-primary-rgb),0.1)] border border-[var(--color-primary)] hover:bg-[rgba(var(--color-primary-rgb),0.2)] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Rocket className="text-[var(--color-primary)]" size={16} />
                <div className="text-left">
                  <div className="text-xs font-bold text-white">进入舰队指挥中心</div>
                  <div className="text-[9px] text-[var(--text-secondary)] mt-0.5">调配、部署及补充战斗编制</div>
                </div>
              </div>
            </button>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3 text-xs font-mono text-[var(--text-secondary)] leading-relaxed">
            <div className="text-[10px] font-title font-bold text-[var(--color-primary)] uppercase tracking-wider">
              文明观测与档案纪实
            </div>
            {isEarth ? (
              <div className="bg-[#070B14]/40 p-3 rounded border border-[#243245]/30 space-y-2">
                <div className="text-white font-bold">【母星历史记录】</div>
                <p>自大低谷期与公元纪元结束以来，地球作为人类文明的绝对摇篮与联合政府心脏，已进入「危机纪元」。</p>
                <p>本行政星拥有人类最古老的遗存，也是各大面壁工程与防御阵地的战术中枢。</p>
              </div>
            ) : (
              <div className="bg-[#070B14]/40 p-3 rounded border border-[#243245]/30 space-y-2">
                <div className="text-white font-bold">【殖民档案记载】</div>
                <p>探测并建立该星港的前哨基地。根据银河星图指令，此星球已被划分为人类太空防御战术外围支点。</p>
                <p>随着人口迁徙工程（当前人口：{star.currentPopulation}万），它将为联合政府提供充足的深空矿物输出。</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mini Bottom Tracker */}
      <div className="mt-auto pt-4 border-t border-[#243245]/30 shrink-0">
        <div className="flex justify-between items-center mb-2 font-mono">
          <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">执政舰队规模</span>
          <span className="text-xs font-data font-bold text-white">{earth.fleets.length} 支</span>
        </div>
        <div className="h-1 w-full bg-white/10 rounded overflow-hidden">
          <div className="h-full bg-[var(--color-primary)] transition-all" style={{ width: `${Math.min(earth.deterrenceValue, 100)}%` }} />
        </div>
        <div className="text-[9px] font-mono text-right text-[var(--text-secondary)] mt-1">全局战略威慑平衡: {Math.floor(earth.deterrenceValue)}%</div>
      </div>
    </aside>
  );
};
