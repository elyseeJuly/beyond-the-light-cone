import React, { useState, useEffect, useMemo } from 'react';
import { GameInstance } from '../core/Game';
import timelineData from '../data/timeline.json';
import { Clock, BookOpen, Flag, Cpu, Globe, Award, Sparkles, AlertCircle } from 'lucide-react';
import { EndingForecastPanel } from './ending/EndingForecastPanel';

type ArchiveTab = 'timeline' | 'major_events' | 'unlocked_techs' | 'discovered_civs' | 'endings' | 'achievements';

export const CivilizationArchive: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ArchiveTab>('timeline');
  const [playerTimeline, setPlayerTimeline] = useState<Array<{year: number, event: string}>>([]);
  const [currentYear, setCurrentYear] = useState(0);

  const game = GameInstance.get();
  const earth = game.earthCivi;

  const updateArchive = () => {
    setPlayerTimeline([...game.playerTimeline]);
    setCurrentYear(game.year);
  };

  useEffect(() => {
    updateArchive();
    window.addEventListener('game-turn-complete', updateArchive);
    window.addEventListener('game-loaded', updateArchive);
    return () => {
      window.removeEventListener('game-turn-complete', updateArchive);
      window.removeEventListener('game-loaded', updateArchive);
    };
  }, []);

  // Filter for Major Events (includes epoch transitions and CG events)
  const majorEvents = useMemo(() => {
    return playerTimeline.filter(evt => 
      evt.event.includes('【文明升级】') || 
      evt.event.includes('【面壁计划】') || 
      evt.event.includes('【破壁人降临】') || 
      evt.event.includes('【数字永生】') || 
      evt.event.includes('【黑暗森林广播】') || 
      evt.event.includes('【高维坍缩】') || 
      evt.event.includes('已完全部署就绪') ||
      evt.event.includes('【纪元更替】') ||
      evt.event.includes('【黑暗森林打击】') ||
      evt.event.includes('【二向箔】') ||
      evt.event.includes('【维度打击】') ||
      evt.event.includes('【威慑】') ||
      evt.event.includes('【征服】') ||
      evt.event.includes('【流浪地球】') ||
      evt.event.includes('【胜利】') ||
      evt.event.includes('【失败】') ||
      evt.event.includes('【结局】')
    );
  }, [playerTimeline]);

  // Researched Tech Nodes
  const finishedTechs = useMemo(() => {
    const list: Array<{ name: string; desc: string }> = [];
    if (!earth || !earth.tecTreeManager) return list;
    for (const tree of earth.tecTreeManager.trees.values()) {
      for (const node of tree.nodes.values()) {
        if (node.finished) {
          list.push({
            name: node.name,
            desc: node.tip
          });
        }
      }
    }
    return list;
  }, [earth?.tecTreeManager, currentYear]);

  // Discovered Civs
  const discoveredCivs = useMemo(() => {
    if (!game.alienCiviManager) return [];
    return Array.from(game.alienCiviManager.aliens.values())
      .filter(alien => alien.unlocked)
      .map(alien => ({
      name: alien.name,
      friendship: alien.friendshipType,
      isDead: alien.isDieOut(),
      population: alien.population
    }));
  }, [game.alienCiviManager, currentYear]);

  // Achievements based on flags
  const achievements = useMemo(() => {
    const list = [
      { id: 'wallfacer', name: '面壁壁障', desc: '启动旨在欺骗三体的面壁计划', unlocked: game.hasFlag('wallfacer_project') },
      { id: 'swordholder', name: '执剑守护者', desc: '任命终极核阻断执剑人', unlocked: game.hasFlag('swordholder_appointed') },
      { id: 'exodus', name: '掩体避难所', desc: '在木星群轨道建立星港城市', unlocked: game.hasFlag('galaxy_exodus_seen') },
      { id: 'wandering', name: '光速宣言', desc: '实施流浪逃亡计划并达成光速推进', unlocked: game.hasFlag('wandering_completed') },
      { id: 'digital', name: '数字永生者', desc: '主意识备份并上传至数字方舟中', unlocked: game.hasFlag('digital_ark_upgrade') },
      { id: 'safety', name: '安全回声', desc: '发布宇宙安全声明，构建星系黑域', unlocked: game.hasFlag('safety_declaration') || game.hasFlag('black_domain_completed') }
    ];
    return list;
  }, [playerTimeline]);

  const getTabStyle = (tab: ArchiveTab) => {
    return activeTab === tab
      ? 'border-[var(--color-primary)] text-white bg-white/5 font-bold'
      : 'border-transparent text-[var(--text-secondary)] hover:text-white';
  };

  const getFriendshipLabel = (friendship: number) => {
    const labels = ["极度敌对", "敌对", "冷淡", "友好", "亲密"];
    return labels[friendship] || "未知";
  };

  return (
    <div className="h-full w-full p-6 flex flex-col overflow-hidden select-none">
      {/* Header */}
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-extrabold text-[var(--color-primary)] tracking-wide flex items-center gap-2">
          <BookOpen size={24} />
          银河文明档案馆
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-mono">
          GALACTIC CIVILIZATION ARCHIVE | SECURE RECORD OF HUMANITY AND OTHER CIVILIZATIONS
        </p>
      </div>

      {/* Panels */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 overflow-hidden">
        {/* Left Archive Tabs */}
        <div className="w-full md:w-48 flex flex-row md:flex-col gap-1.5 shrink-0 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`w-auto md:w-full shrink-0 whitespace-nowrap flex items-center gap-2.5 px-3 py-2.5 rounded border-l-2 text-xs font-title uppercase tracking-wider transition-all cursor-pointer ${getTabStyle('timeline')}`}
          >
            <Clock size={14} /> 文明时间线
          </button>
          
          <button
            onClick={() => setActiveTab('major_events')}
            className={`w-auto md:w-full shrink-0 whitespace-nowrap flex items-center gap-2.5 px-3 py-2.5 rounded border-l-2 text-xs font-title uppercase tracking-wider transition-all cursor-pointer ${getTabStyle('major_events')}`}
          >
            <Flag size={14} /> 重大事件
          </button>
          
          <button
            onClick={() => setActiveTab('unlocked_techs')}
            className={`w-auto md:w-full shrink-0 whitespace-nowrap flex items-center gap-2.5 px-3 py-2.5 rounded border-l-2 text-xs font-title uppercase tracking-wider transition-all cursor-pointer ${getTabStyle('unlocked_techs')}`}
          >
            <Cpu size={14} /> 已解锁科技
          </button>
          
          <button
            onClick={() => setActiveTab('discovered_civs')}
            className={`w-auto md:w-full shrink-0 whitespace-nowrap flex items-center gap-2.5 px-3 py-2.5 rounded border-l-2 text-xs font-title uppercase tracking-wider transition-all cursor-pointer ${getTabStyle('discovered_civs')}`}
          >
            <Globe size={14} /> 已发现文明
          </button>
          
          <button
            onClick={() => setActiveTab('endings')}
            className={`w-auto md:w-full shrink-0 whitespace-nowrap flex items-center gap-2.5 px-3 py-2.5 rounded border-l-2 text-xs font-title uppercase tracking-wider transition-all cursor-pointer ${getTabStyle('endings')}`}
          >
            <AlertCircle size={14} /> 结局预测
          </button>
          
          <button
            onClick={() => setActiveTab('achievements')}
            className={`w-auto md:w-full shrink-0 whitespace-nowrap flex items-center gap-2.5 px-3 py-2.5 rounded border-l-2 text-xs font-title uppercase tracking-wider transition-all cursor-pointer ${getTabStyle('achievements')}`}
          >
            <Award size={14} /> 成就馆
          </button>
        </div>

        {/* Right side content */}
        <div className="flex-1 bg-[#070B14]/40 border border-[#243245]/30 rounded p-5 flex flex-col overflow-hidden relative">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[size:100%_4px] opacity-10 pointer-events-none" />

          {activeTab === 'timeline' && (
            <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-y-auto md:overflow-hidden">
              {/* Official Era */}
              <div className="flex-1 border-b md:border-b-0 md:border-r border-[#243245]/30 pb-4 md:pb-0 md:pr-4 flex flex-col shrink-0 md:shrink md:overflow-hidden">
                <div className="text-[10px] font-title font-bold text-[var(--color-primary)] mb-3 shrink-0">
                  官方原著纪元进程
                </div>
                <div className="flex-1 overflow-y-visible md:overflow-y-auto space-y-3 pr-1">
                  {timelineData.map((epoch, idx) => {
                    const isActive = currentYear >= epoch.gameYearRange[0] && currentYear <= epoch.gameYearRange[1];
                    const isPassed = currentYear > epoch.gameYearRange[1];
                    return (
                      <div key={idx} className={`p-2.5 rounded border border-[#243245]/20 bg-[#070B14]/50 ${isActive ? 'border-[var(--color-primary)]' : isPassed ? 'opacity-50' : 'opacity-20'}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-xs font-bold ${isActive ? 'text-[var(--color-primary)]' : 'text-white'}`}>{epoch.epoch}</span>
                          <span className="text-[10px] font-mono text-[var(--text-secondary)]">{epoch.yearRange}</span>
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">{epoch.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Player Log */}
              <div className="flex-1 md:pl-2 pt-2 md:pt-0 flex flex-col shrink-0 md:shrink md:overflow-hidden">
                <div className="text-[10px] font-title font-bold text-[var(--color-primary)] mb-3 shrink-0">
                  本局发展履历 (已运行 {currentYear} 年)
                </div>
                <div className="flex-1 overflow-y-visible md:overflow-y-auto space-y-2.5 pr-1 font-mono text-xs">
                  {playerTimeline.length === 0 ? (
                    <div className="text-center py-10 text-[var(--text-secondary)] italic">无重大档案建立...</div>
                  ) : (
                    [...playerTimeline].reverse().map((evt, idx) => (
                      <div key={idx} className="flex gap-2.5 p-2 bg-white/5 border border-white/5 rounded">
                        <span className="text-[var(--color-primary)] font-bold shrink-0">第 {evt.year} 年:</span>
                        <span className="text-slate-100">{evt.event}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'major_events' && (
            <div className="h-full flex flex-col overflow-hidden">
              <div className="text-[10px] font-title font-bold text-[var(--color-primary)] mb-3 shrink-0 uppercase tracking-wider">
                文明史重大碑石记录 (当前共 {majorEvents.length} 条)
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {majorEvents.length === 0 ? (
                  <div className="text-center py-12 text-xs text-[var(--text-secondary)] italic">暂无列入银河档案馆的重大文明事件。</div>
                ) : (
                  [...majorEvents].reverse().map((evt, idx) => (
                    <div key={idx} className="p-3 bg-[#070B14]/80 border-l-2 border-red-500 rounded-r border-y border-r border-[#243245]/20 font-mono text-xs space-y-1">
                      <div className="text-[var(--color-primary)] font-bold">纪元历史档案 第 {evt.year} 年</div>
                      <div className="text-slate-100 leading-relaxed">{evt.event}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'unlocked_techs' && (
            <div className="h-full flex flex-col overflow-hidden">
              <div className="text-[10px] font-title font-bold text-[var(--color-primary)] mb-3 shrink-0 uppercase tracking-wider">
                已解码并投入使用的科学技术 (共 {finishedTechs.length} 项)
              </div>
              <div className="flex-1 overflow-y-auto pr-1">
                {finishedTechs.length === 0 ? (
                  <div className="text-center py-12 text-xs text-[var(--text-secondary)] italic">基础物理被锁死中，尚无已解锁的高级科技。</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {finishedTechs.map((tech, idx) => (
                      <div key={idx} className="p-3 bg-[#070B14]/60 border border-[#243245]/30 rounded">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                          {tech.name}
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 leading-relaxed font-mono">{tech.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'discovered_civs' && (
            <div className="h-full flex flex-col overflow-hidden">
              <div className="text-[10px] font-title font-bold text-[var(--color-primary)] mb-3 shrink-0 uppercase tracking-wider">
                雷达已锁定的异星文明目录
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {discoveredCivs.length === 0 ? (
                  <div className="text-center py-12 text-xs text-[var(--text-secondary)] italic">全频段宁静。尚未发现任何地外文明踪迹。</div>
                ) : (
                  discoveredCivs.map((civ, idx) => (
                    <div key={idx} className="p-3.5 bg-[#070B14]/60 border border-[#243245]/30 rounded flex justify-between items-center font-mono text-xs">
                      <div>
                        <div className="font-bold text-white text-sm">{civ.name} 文明</div>
                        <div className="text-[10px] text-[var(--text-secondary)] mt-1">
                          常驻人口: {civ.population} 点 | 外交友好度: {getFriendshipLabel(civ.friendship)}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${civ.isDead ? 'bg-red-950/30 text-red-500 border border-red-500/30' : 'bg-emerald-950/30 text-emerald-400 border border-emerald-500/30'}`}>
                        {civ.isDead ? '已毁灭' : '存活中'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'endings' && (
            <div className="h-full flex flex-col overflow-hidden justify-between">
              <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                <div className="text-[10px] font-title font-bold text-[var(--color-primary)] uppercase tracking-wider border-b border-[#243245]/20 pb-2">
                  文明归宿概率计算谱
                </div>
                <EndingForecastPanel />
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="h-full flex flex-col overflow-hidden">
              <div className="text-[10px] font-title font-bold text-[var(--color-primary)] mb-3 shrink-0 uppercase tracking-wider">
                执政官纪元功勋馆 (文明印记)
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {achievements.map((ach) => (
                    <div 
                      key={ach.id} 
                      className={`p-3 rounded border transition-all flex items-start gap-3 ${
                        ach.unlocked 
                          ? 'bg-amber-950/10 border-amber-500/30 text-amber-300' 
                          : 'bg-white/5 border-white/5 opacity-40'
                      }`}
                    >
                      <Sparkles className={`w-5 h-5 shrink-0 ${ach.unlocked ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
                      <div>
                        <div className="text-xs font-bold">{ach.name}</div>
                        <p className="text-[10px] text-[var(--text-secondary)] mt-1 font-mono leading-relaxed">{ach.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
