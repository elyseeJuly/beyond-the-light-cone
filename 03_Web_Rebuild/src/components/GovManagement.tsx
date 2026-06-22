import React, { useState, useEffect } from 'react';
import { GameInstance } from '../core/Game';
import { DepartmentType } from '../types/enums';
import { wallfacerPanel } from '../ui/WallfacerPanel';
import { DepartmentPanel } from '../ui/DepartmentPanel';
import { DiplomacyPanel } from './DiplomacyPanel';
import { Landmark as GovIcon, DollarSign, Shield, Cpu, Heart, AlertOctagon, Globe } from 'lucide-react';

type GovTab = 'finance' | 'military' | 'tech' | 'social' | 'security' | 'diplomacy';

const deptPanel = new DepartmentPanel();

export const GovManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GovTab>('finance');
  const [, forceUpdate] = useState(0);

  const game = GameInstance.get();
  const earth = game.earthCivi;

  useEffect(() => {
    const handleRefresh = () => forceUpdate(n => n + 1);
    const handleSetGovTab = (e: Event) => {
      const customEvent = e as CustomEvent<GovTab>;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };

    window.addEventListener('game-turn-complete', handleRefresh);
    window.addEventListener('game-loaded', handleRefresh);
    window.addEventListener('tutorial:set-gov-tab', handleSetGovTab);
    return () => {
      window.removeEventListener('game-turn-complete', handleRefresh);
      window.removeEventListener('game-loaded', handleRefresh);
      window.removeEventListener('tutorial:set-gov-tab', handleSetGovTab);
    };
  }, []);

  const openLegacyDept = (type: DepartmentType, label: string) => {
    deptPanel.open(type, label);
  };

  const getTabStyle = (tab: GovTab) => {
    return activeTab === tab 
      ? 'border-[var(--color-primary)] text-white bg-white/5 font-bold'
      : 'border-transparent text-[var(--text-secondary)] hover:text-white';
  };

  return (
    <div className="h-full w-full p-6 flex flex-col overflow-hidden select-none">
      {/* Title */}
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-extrabold text-[var(--color-primary)] tracking-wide flex items-center gap-2">
          <GovIcon size={24} />
          执政官政府内阁总署
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-mono">
          GOVERNMENT DIVISION | CIVILIZATION GOVERNANCE MATRIX & EXECUTIVE CONTROL
        </p>
      </div>

      {/* Government Panels */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Side Cabinets */}
        <div data-tutorial-id="gov-cabinets-sidebar" className="w-48 flex flex-col gap-1.5 shrink-0">
          <button
            onClick={() => setActiveTab('finance')}
            data-tutorial-id="gov-tab-finance"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded border-l-2 text-xs font-title uppercase tracking-wider transition-all cursor-pointer ${getTabStyle('finance')}`}
          >
            <DollarSign size={14} /> 财政部
          </button>
          
          <button
            onClick={() => setActiveTab('military')}
            data-tutorial-id="gov-tab-military"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded border-l-2 text-xs font-title uppercase tracking-wider transition-all cursor-pointer ${getTabStyle('military')}`}
          >
            <Shield size={14} /> 军事部
          </button>
          
          <button
            onClick={() => setActiveTab('tech')}
            data-tutorial-id="gov-tab-tech"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded border-l-2 text-xs font-title uppercase tracking-wider transition-all cursor-pointer ${getTabStyle('tech')}`}
          >
            <Cpu size={14} /> 科技部
          </button>
          
          <button
            onClick={() => setActiveTab('social')}
            data-tutorial-id="gov-tab-social"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded border-l-2 text-xs font-title uppercase tracking-wider transition-all cursor-pointer ${getTabStyle('social')}`}
          >
            <Heart size={14} /> 社会部
          </button>
          
          <button
            onClick={() => setActiveTab('security')}
            data-tutorial-id="gov-tab-security"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded border-l-2 text-xs font-title uppercase tracking-wider transition-all cursor-pointer ${getTabStyle('security')}`}
          >
            <AlertOctagon size={14} /> 安全部
          </button>
          
          <button
            onClick={() => setActiveTab('diplomacy')}
            data-tutorial-id="gov-tab-diplomacy"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded border-l-2 text-xs font-title uppercase tracking-wider transition-all cursor-pointer ${getTabStyle('diplomacy')}`}
          >
            <Globe size={14} /> 外交委员会
          </button>
        </div>

        {/* Right side display card */}
        <div className="flex-1 bg-[#070B14]/40 border border-[#243245]/30 rounded p-5 flex flex-col overflow-hidden relative">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[size:100%_4px] opacity-10 pointer-events-none" />

          {activeTab === 'finance' && (
            <div className="h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-sm font-bold text-white border-b border-[#243245]/20 pb-2 flex justify-between items-center">
                  <span>财政及宏观经济总览</span>
                  <span className="text-xs text-[var(--color-primary)] font-mono">CODE: FIN-DEPT</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-[#070B14]/60 border border-[#243245]/20 rounded font-mono">
                    <div className="text-[10px] text-[var(--text-secondary)]">当前总产值 / 经济</div>
                    <div className="text-lg font-bold text-white mt-1">{Math.floor(earth.economy)} 点</div>
                  </div>
                  <div className="p-3 bg-[#070B14]/60 border border-[#243245]/20 rounded font-mono">
                    <div className="text-[10px] text-[var(--text-secondary)]">矿产储备 / 资源</div>
                    <div className="text-lg font-bold text-white mt-1">{earth.resource} 点</div>
                  </div>
                </div>
                <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  财政部负责统筹调配行星重工业、太空采矿业以及联合政府的资源供给。如果矿产或经济枯竭，所有在建 of 太空城及太空设施都将面临停滞危险。
                </div>
              </div>
              
              <button 
                onClick={() => openLegacyDept(DepartmentType.ECONOMY, "经济部")}
                data-tutorial-id="btn-gov-finance-dept"
                className="w-full py-2.5 rounded border border-[var(--color-primary)] bg-[rgba(var(--color-primary-rgb),0.1)] hover:bg-[rgba(var(--color-primary-rgb),0.2)] text-[var(--color-primary)] text-xs font-bold font-title tracking-wider uppercase transition-all cursor-pointer text-center"
              >
                进入中央计划局 (分配与扩产)
              </button>
            </div>
          )}

          {activeTab === 'military' && (
            <div className="h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-sm font-bold text-white border-b border-[#243245]/20 pb-2 flex justify-between items-center">
                  <span>战略司令部与军事投射力量</span>
                  <span className="text-xs text-orange-400 font-mono">CODE: MIL-DEPT</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-[#070B14]/60 border border-[#243245]/20 rounded font-mono">
                    <div className="text-[10px] text-[var(--text-secondary)]">地球常备兵力</div>
                    <div className="text-lg font-bold text-white mt-1">{earth.army} 指数</div>
                  </div>
                  <div className="p-3 bg-[#070B14]/60 border border-[#243245]/20 rounded font-mono">
                    <div className="text-[10px] text-[var(--text-secondary)]">现役舰队数量</div>
                    <div className="text-lg font-bold text-white mt-1">{earth.fleets.length} 支编制</div>
                  </div>
                </div>
                <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  军事部掌控第一至第五太空防卫编队。在黑暗森林宇宙中，威慑度是保护恒星免遭打击的核心指标。当太空城遭到外星文明入侵时，舰队将自动编入防御作战。
                </div>
              </div>
              
              <button 
                onClick={() => openLegacyDept(DepartmentType.ARMY, "军事部")}
                data-tutorial-id="btn-gov-military-dept"
                className="w-full py-2.5 rounded border border-orange-500 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-xs font-bold font-title tracking-wider uppercase transition-all cursor-pointer text-center"
              >
                进入联合作战值班室
              </button>
            </div>
          )}

          {activeTab === 'tech' && (
            <div className="h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-sm font-bold text-white border-b border-[#243245]/20 pb-2 flex justify-between items-center">
                  <span>科研项目与核心技术监控</span>
                  <span className="text-xs text-blue-400 font-mono">CODE: TEC-DEPT</span>
                </div>
                <div className="p-3 bg-[#070B14]/60 border border-[#243245]/20 rounded font-mono text-xs text-[var(--text-secondary)] leading-relaxed">
                  目前科技部重点监控三大前沿：天体物理、航天动力学、核技术。通过文化（即科学信息值）积累来冲破智子封锁。
                </div>
              </div>
              
              <button 
                onClick={() => openLegacyDept(DepartmentType.ASTROPHYSICS, "前沿研究所")}
                data-tutorial-id="btn-gov-tech-dept"
                className="w-full py-2.5 rounded border border-blue-500 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold font-title tracking-wider uppercase transition-all cursor-pointer text-center"
              >
                对接前沿高能物理研究所
              </button>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-sm font-bold text-white border-b border-[#243245]/20 pb-2 flex justify-between items-center">
                  <span>社会部与文明文化发展</span>
                  <span className="text-xs text-purple-400 font-mono">CODE: SOC-DEPT</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-[#070B14]/60 border border-[#243245]/20 rounded font-mono">
                    <div className="text-[10px] text-[var(--text-secondary)]">文化产出总量</div>
                    <div className="text-lg font-bold text-white mt-1">{Math.floor(earth.culture)}</div>
                  </div>
                  <div className="p-3 bg-[#070B14]/60 border border-[#243245]/20 rounded font-mono">
                    <div className="text-[10px] text-[var(--text-secondary)]">民意逃亡指数</div>
                    <div className="text-lg font-bold text-red-400 mt-1">{earth.treachery}%</div>
                  </div>
                </div>
                <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  社会部负责引导大众民意并遏制极端的“逃亡主义”蔓延。逃亡倾向一旦超过临界点（80%），不仅会导致社会崩溃，还可能诱发人类舰队强行私奔。
                </div>
              </div>
              
              <button 
                onClick={() => openLegacyDept(DepartmentType.CULTURE, "文化部")}
                data-tutorial-id="btn-gov-social-dept"
                className="w-full py-2.5 rounded border border-purple-500 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-bold font-title tracking-wider uppercase transition-all cursor-pointer text-center"
              >
                查阅社会心理与舆论监控制度
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-sm font-bold text-white border-b border-[#243245]/20 pb-2 flex justify-between items-center">
                  <span>战略特勤安全与面壁计划</span>
                  <span className="text-xs text-red-500 font-mono">CODE: SEC-DEPT</span>
                </div>
                <div className="p-3 bg-[#070B14]/60 border border-[#243245]/20 rounded">
                  <div className="text-[10px] text-[var(--text-secondary)] mb-2 font-mono uppercase">当前面壁者阵营：</div>
                  {earth.wallfacers.size === 0 ? (
                    <div className="text-xs text-red-400 italic font-mono">-- 无活跃面壁者 --</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {Array.from(earth.wallfacers).map(name => (
                        <span key={name} className="px-2 py-0.5 bg-red-950/30 border border-red-500/30 rounded text-[10px] text-red-400 font-mono">
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  面壁者安全总署负责阻断破壁人。所有面壁者都在面壁者最高委员会的庇护下拥有极高的调兵权，但这也增加了欺骗概率。
                </div>
              </div>
              
              <button 
                onClick={() => wallfacerPanel.open()}
                data-tutorial-id="btn-open-wallfacer-hearings"
                className="w-full py-2.5 rounded border border-red-500 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold font-title tracking-wider uppercase transition-all cursor-pointer text-center"
              >
                召开面壁计划战略听证会
              </button>
            </div>
          )}

          {activeTab === 'diplomacy' && (
            <div className="h-full flex flex-col overflow-hidden">
              <DiplomacyPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
