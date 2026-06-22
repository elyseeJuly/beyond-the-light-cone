import React, { useState, useMemo } from 'react';
import { GameInstance } from '../core/Game';
import { Radio, AlertTriangle, Shield, Cpu, Users, BookOpen, Globe } from 'lucide-react';

type IntelCategory = 'crisis' | 'diplomacy' | 'research' | 'military' | 'livelihood' | 'history';

export const IntelligenceCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<IntelCategory>('crisis');
  
  const game = GameInstance.get();
  
  const intelLogs = useMemo(() => {
    const rawLogs = [...game.historyLogs].reverse(); // Latest logs first
    
    return rawLogs.map((log, index) => {
      let category: IntelCategory = 'history';
      
      const text = log.trim();
      
      if (text.includes('警报') || text.includes('死神') || text.includes('二向箔') || text.includes('破壁人') || text.includes('坍缩') || text.includes('崩溃') || text.includes('威胁') || text.includes('警告') || text.includes('资源枯竭')) {
        category = 'crisis';
      } else if (text.includes('外交') || text.includes('联络') || text.includes('友好') || text.includes('同盟') || text.includes('广播') || text.includes('援助')) {
        category = 'diplomacy';
      } else if (text.includes('科技') || text.includes('研发') || text.includes('科研') || text.includes('数字生命') || text.includes('意识') || text.includes('永生')) {
        category = 'research';
      } else if (text.includes('战报') || text.includes('后勤') || text.includes('舰队') || text.includes('水滴') || text.includes('击退') || text.includes('防御') || text.includes('兵力') || text.includes('侦测')) {
        category = 'military';
      } else if (text.includes('人口') || text.includes('民生') || text.includes('城市') || text.includes('逃亡') || text.includes('经济') || text.includes('采矿') || text.includes('资源')) {
        category = 'livelihood';
      }
      
      return {
        text,
        category,
        timestamp: `CY-${game.year - Math.floor(index / 10)}` // Mock cypher-cycle timestamp
      };
    });
  }, [game.historyLogs, game.year]);

  const filteredLogs = useMemo(() => {
    if (activeTab === 'history') return intelLogs;
    return intelLogs.filter(log => log.category === activeTab);
  }, [intelLogs, activeTab]);

  const counts = useMemo(() => {
    const c = { crisis: 0, diplomacy: 0, research: 0, military: 0, livelihood: 0, history: intelLogs.length };
    intelLogs.forEach(log => {
      if (log.category !== 'history') {
        c[log.category]++;
      }
    });
    return c;
  }, [intelLogs]);

  const getTabStyle = (tab: IntelCategory) => {
    if (activeTab !== tab) return 'text-[var(--text-secondary)] hover:text-white border-transparent';
    
    switch (tab) {
      case 'crisis': return 'border-red-500 text-red-400 bg-red-950/10';
      case 'diplomacy': return 'border-emerald-500 text-emerald-400 bg-emerald-950/10';
      case 'research': return 'border-blue-500 text-blue-400 bg-blue-950/10';
      case 'military': return 'border-orange-500 text-orange-400 bg-orange-950/10';
      case 'livelihood': return 'border-yellow-500 text-yellow-400 bg-yellow-950/10';
      default: return 'border-[var(--color-primary)] text-white bg-white/5';
    }
  };

  const getLogDotStyle = (cat: IntelCategory) => {
    switch (cat) {
      case 'crisis': return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]';
      case 'diplomacy': return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]';
      case 'research': return 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]';
      case 'military': return 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]';
      case 'livelihood': return 'bg-yellow-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="h-full w-full p-6 flex flex-col overflow-hidden select-none">
      {/* Title */}
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-extrabold text-[var(--color-primary)] tracking-wide flex items-center gap-2">
          <Radio className="animate-pulse" size={24} />
          情报防御与战略监控中心
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-mono">
          STATUS: ONLINE | MONITORING GALACTIC BROADCASTS AND LOCAL SYSTEM LOGS
        </p>
      </div>

      {/* Main content grid */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left tabs selector */}
        <div data-tutorial-id="intel-sidebar" className="w-48 flex flex-col gap-1.5 shrink-0">
          <button
            onClick={() => setActiveTab('crisis')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded border-l-2 text-xs font-title font-bold uppercase tracking-wider transition-all cursor-pointer ${getTabStyle('crisis')}`}
          >
            <span className="flex items-center gap-2">
              <AlertTriangle size={14} /> 危机报告
            </span>
            <span className="font-data bg-red-950/30 px-1.5 py-0.5 rounded text-[10px]">{counts.crisis}</span>
          </button>
          
          <button
            onClick={() => setActiveTab('diplomacy')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded border-l-2 text-xs font-title font-bold uppercase tracking-wider transition-all cursor-pointer ${getTabStyle('diplomacy')}`}
          >
            <span className="flex items-center gap-2">
              <Globe size={14} /> 外交互动
            </span>
            <span className="font-data bg-emerald-950/30 px-1.5 py-0.5 rounded text-[10px]">{counts.diplomacy}</span>
          </button>
          
          <button
            onClick={() => setActiveTab('research')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded border-l-2 text-xs font-title font-bold uppercase tracking-wider transition-all cursor-pointer ${getTabStyle('research')}`}
          >
            <span className="flex items-center gap-2">
              <Cpu size={14} /> 科研观测
            </span>
            <span className="font-data bg-blue-950/30 px-1.5 py-0.5 rounded text-[10px]">{counts.research}</span>
          </button>
          
          <button
            onClick={() => setActiveTab('military')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded border-l-2 text-xs font-title font-bold uppercase tracking-wider transition-all cursor-pointer ${getTabStyle('military')}`}
          >
            <span className="flex items-center gap-2">
              <Shield size={14} /> 军事调配
            </span>
            <span className="font-data bg-orange-950/30 px-1.5 py-0.5 rounded text-[10px]">{counts.military}</span>
          </button>
          
          <button
            onClick={() => setActiveTab('livelihood')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded border-l-2 text-xs font-title font-bold uppercase tracking-wider transition-all cursor-pointer ${getTabStyle('livelihood')}`}
          >
            <span className="flex items-center gap-2">
              <Users size={14} /> 民生物资
            </span>
            <span className="font-data bg-yellow-950/30 px-1.5 py-0.5 rounded text-[10px]">{counts.livelihood}</span>
          </button>
          
          <div className="h-px bg-[#243245]/20 my-2" />
          
          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded border-l-2 text-xs font-title font-bold uppercase tracking-wider transition-all cursor-pointer ${getTabStyle('history')}`}
          >
            <span className="flex items-center gap-2">
              <BookOpen size={14} /> 历史全卷
            </span>
            <span className="font-data bg-white/5 px-1.5 py-0.5 rounded text-[10px]">{counts.history}</span>
          </button>
        </div>

        {/* Right lists panel */}
        <div className="flex-1 bg-[#070B14]/40 border border-[#243245]/30 rounded p-4 flex flex-col overflow-hidden relative">
          {/* Scanline element */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[size:100%_4px] opacity-10 pointer-events-none" />
          
          <div className="text-[10px] font-title font-bold text-[var(--color-primary)] uppercase tracking-widest mb-3 shrink-0 flex items-center justify-between border-b border-[#243245]/20 pb-2">
            <span>SECURE REPORTS STREAM ({filteredLogs.length} RECORDS FOUND)</span>
            <span className="font-mono text-[9px] text-[var(--text-secondary)]">DECRYPT LEVEL: HIGH</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-xs text-[var(--text-secondary)] font-mono italic">
                -- NO INTEL DATA DECODED IN THIS CATEGORY YET --
              </div>
            ) : (
              filteredLogs.map((log, index) => (
                <div 
                  key={index}
                  className="p-3 bg-[#070B14]/60 border border-[#243245]/20 rounded hover:border-[var(--color-primary)]/40 transition-colors flex items-start gap-3 animate-fade-in font-mono"
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${getLogDotStyle(log.category)}`} />
                  <div className="flex-1 text-xs text-slate-100 leading-relaxed">
                    {log.text}
                  </div>
                  <div className="text-[9px] text-[var(--text-secondary)] select-all shrink-0">
                    {log.timestamp}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
