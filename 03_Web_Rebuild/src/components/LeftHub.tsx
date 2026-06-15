import React, { useState, useEffect } from 'react';
import { Map, Cpu, Landmark, Archive, Radio, AlertTriangle, Settings } from 'lucide-react';
import { GameInstance } from '../core/Game';
import { t } from '../utils/i18n';
import { BgmPlayer } from './BgmPlayer';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
  <div 
    className={`nav-item ${active ? 'active' : ''}`}
    onClick={onClick}
  >
    {icon}
    <span className="text-sm tracking-wide font-medium">{label}</span>
  </div>
);

export type ActiveViewType = 'starmap' | 'techtree' | 'intelligence' | 'government' | 'archive';

interface LeftHubProps {
  activeView: ActiveViewType;
  setActiveView: (view: ActiveViewType) => void;
}

export const LeftHub: React.FC<LeftHubProps> = ({ activeView, setActiveView }) => {
  const [sophonBlocked, setSophonBlocked] = useState(false);
  const [diversity, setDiversity] = useState({ triggered: 0, total: 0, percentage: 0 });
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [epoch, setEpoch] = useState(0);

  useEffect(() => {
    const check = () => {
      try {
        const game = GameInstance.get();
        setSophonBlocked(game.isSophonBlocked());
        setEpoch(game.epoch);
      } catch { /* ignore */ }
    };
    const updateStats = () => {
      try {
        const game = GameInstance.get();
        if (game && game.eventManager) {
          const stats = game.eventManager.getEventDiversityStats();
          setDiversity({
            triggered: stats.triggered,
            total: stats.total,
            percentage: stats.percentage
          });
        }
      } catch { /* ignore */ }
    };

    check();
    updateStats();

    window.addEventListener('game-turn-complete', check);
    window.addEventListener('game-turn-complete', updateStats);
    window.addEventListener('game-loaded', check);
    window.addEventListener('game-loaded', updateStats);

    return () => {
      window.removeEventListener('game-turn-complete', check);
      window.removeEventListener('game-turn-complete', updateStats);
      window.removeEventListener('game-loaded', check);
      window.removeEventListener('game-loaded', updateStats);
    };
  }, []);

  return (
    <aside className="w-[240px] h-full bg-[#070B14]/75 backdrop-blur-[12px] border-r border-[#243245]/50 flex flex-col justify-between select-none">
      {/* Navigation Menu */}
      <div className="p-4 flex flex-col gap-1.5">
        <div className="text-[10px] font-title font-bold text-[var(--color-primary)] uppercase tracking-[0.2em] mb-3 px-3">
          Galactic Console
        </div>
        
        <NavItem 
          icon={<Map size={18} className="stroke-[1.5]" />} 
          label="战略星图" 
          active={activeView === 'starmap'} 
          onClick={() => setActiveView('starmap')}
        />
        
        <NavItem 
          icon={<Radio size={18} className="stroke-[1.5]" />} 
          label="情报中心" 
          active={activeView === 'intelligence'} 
          onClick={() => setActiveView('intelligence')}
        />
        
        <NavItem 
          icon={<Cpu size={18} className="stroke-[1.5]" />} 
          label="科技研发" 
          active={activeView === 'techtree'} 
          onClick={() => setActiveView('techtree')}
        />
        
        <NavItem 
          icon={<Landmark size={18} className="stroke-[1.5]" />} 
          label="政府管理" 
          active={activeView === 'government'} 
          onClick={() => setActiveView('government')}
        />
        
        <NavItem 
          icon={<Archive size={18} className="stroke-[1.5]" />} 
          label="文明档案" 
          active={activeView === 'archive'} 
          onClick={() => setActiveView('archive')}
        />
      </div>

      {/* Stats and Alerts Container */}
      <div className="flex flex-col gap-2 p-4 border-t border-[#243245]/30 bg-[#070B14]/40">
        {/* Event Diversity Stats */}
        <div className="px-1">
          <div 
            className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-1.5 flex justify-between items-center cursor-pointer select-none hover:text-white transition-colors"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <span className="flex items-center gap-1 font-mono">
              <span className="text-[8px] transition-transform duration-300" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▼</span>
              {t('event_diversity') || '档案同步率'}
            </span>
            <span className="text-[var(--color-primary)] font-data font-bold">{diversity.triggered} / {diversity.total}</span>
          </div>
          {!isCollapsed && (
            <div className="mt-2 transition-all duration-300">
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mb-1 border border-white/5">
                <div className="h-full bg-[var(--color-primary)] transition-all duration-500" style={{ width: `${diversity.percentage}%` }} />
              </div>
              <div className="flex justify-between text-[9px] text-[var(--text-secondary)] font-mono">
                <span>存档已读取比例</span>
                <span>{diversity.percentage}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Sophon Alert */}
        {sophonBlocked && (
          <div className="mt-2 bg-red-500/10 border border-red-500/35 p-3 rounded flex gap-2.5 items-start">
            <AlertTriangle className="text-red-400 shrink-0 stroke-[1.5]" size={16} />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider font-title">智子干扰中</span>
              <p className="text-[9px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                基础物理研究已被锁定，科研产出效率衰减 40%。
              </p>
            </div>
          </div>
        )}

        {/* System Toolbar */}
        <div className="flex items-center justify-between gap-1 border-t border-[#243245]/20 pt-3 mt-2 shrink-0">
          <BgmPlayer isGameOver={false} epoch={epoch} />
          
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-settings'))} 
            className="p-2 hover:bg-white/5 rounded text-[var(--text-secondary)] hover:text-white cursor-pointer transition-colors"
            title="系统设置"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
};
