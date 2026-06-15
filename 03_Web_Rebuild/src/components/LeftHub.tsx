import React, { useState, useEffect, useCallback } from 'react';
import { Map, Cpu, Swords, BarChart3, Users2, Building2, AlertOctagon, Globe, Atom, Rocket, Zap, Telescope, FlaskConical, Microscope, Clock, BookOpen } from 'lucide-react';
import { GameInstance } from '../core/Game';
import { DepartmentType } from '../types/enums';
import { wallfacerPanel } from '../ui/WallfacerPanel';
import { DepartmentPanel } from '../ui/DepartmentPanel';
import { t } from '../utils/i18n';

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
    <span className="text-sm tracking-wide">{label}</span>
  </div>
);

interface LeftHubProps {
  activeView: 'starmap' | 'techtree' | 'timeline' | 'diplomacy';
  setActiveView: (view: 'starmap' | 'techtree' | 'timeline' | 'diplomacy') => void;
  onOpenMuseum?: () => void;
}

// Singleton department panel for legacy bridge
const deptPanel = new DepartmentPanel();

export const LeftHub: React.FC<LeftHubProps> = ({ activeView, setActiveView, onOpenMuseum }) => {
  const [sophonBlocked, setSophonBlocked] = useState(false);
  const [diversity, setDiversity] = useState({ triggered: 0, total: 0, percentage: 0 });
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const check = () => {
      try {
        setSophonBlocked(GameInstance.get().isSophonBlocked());
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
    window.addEventListener('game-loaded', updateStats);
    window.addEventListener('game-language-changed', updateStats);

    return () => {
      window.removeEventListener('game-turn-complete', check);
      window.removeEventListener('game-turn-complete', updateStats);
      window.removeEventListener('game-loaded', updateStats);
      window.removeEventListener('game-language-changed', updateStats);
    };
  }, []);

  const handleDeptClick = useCallback((deptType: number, deptName: string) => {
    if (deptType === DepartmentType.ASTROSOCIOLOGY) {
      wallfacerPanel.open();
    } else {
      deptPanel.open(deptType, deptName);
    }
  }, []);

  const departments = [
    { type: DepartmentType.ECONOMY, icon: <BarChart3 size={18} />, label: "经济部" },
    { type: DepartmentType.ARMY, icon: <Swords size={18} />, label: "军事部" },
    { type: DepartmentType.CULTURE, icon: <Users2 size={18} />, label: "文化部" },
    { type: DepartmentType.HUMANRES, icon: <Building2 size={18} />, label: "人力资源部" },
    { type: DepartmentType.ASTROSOCIOLOGY, icon: <Globe size={18} />, label: "宇宙社会学" },
    { type: DepartmentType.NUCLEAR, icon: <Atom size={18} />, label: "核技术" },
    { type: DepartmentType.SPACEFIGHT, icon: <Rocket size={18} />, label: "航天技术" },
    { type: DepartmentType.PROTON, icon: <Zap size={18} />, label: "质子技术" },
    { type: DepartmentType.ASTROPHYSICS, icon: <Telescope size={18} />, label: "天体物理" },
    { type: DepartmentType.CULTURETEC, icon: <FlaskConical size={18} />, label: "文化研究所" },
    { type: DepartmentType.ECONOMYTEC, icon: <Microscope size={18} />, label: "经济研究所" },
  ];

  return (
    <aside className="w-64 h-full glass-panel flex flex-col border-r border-white/5">
      {/* Top: Global Viewport Switch */}
      <div className="p-4 flex flex-col gap-1">
        <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2 px-4">
          Global Viewport
        </div>
        <NavItem 
          icon={<Map size={18} />} 
          label="战略星图" 
          active={activeView === 'starmap'} 
          onClick={() => setActiveView('starmap')}
        />
        <NavItem 
          icon={<Cpu size={18} />} 
          label="科技研发" 
          active={activeView === 'techtree'} 
          onClick={() => setActiveView('techtree')}
        />
        <NavItem 
          icon={<Clock size={18} />} 
          label="编年史观测" 
          active={activeView === 'timeline'} 
          onClick={() => setActiveView('timeline')}
        />
        <NavItem 
          icon={<Users2 size={18} />} 
          label="战略外交" 
          active={activeView === 'diplomacy'} 
          onClick={() => setActiveView('diplomacy')}
        />
        <div className="h-px bg-white/5 my-2" />
        <NavItem 
          icon={<BookOpen size={18} className="text-cyan-400" />} 
          label="岁月史书" 
          onClick={onOpenMuseum}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1 border-t border-white/5">
        <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2 px-4">
          Government Departments
        </div>
        {departments.map(dept => (
          <NavItem 
            key={dept.type}
            icon={dept.icon} 
            label={dept.label} 
            onClick={() => handleDeptClick(dept.type, dept.label)}
          />
        ))}
      </div>

      {/* Event Diversity Stats */}
      <div className="p-4 border-t border-white/5 bg-black/5">
        <div 
          className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-1.5 flex justify-between items-center cursor-pointer select-none hover:text-white transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <span className="flex items-center gap-1">
            <span className="text-[9px] transition-transform duration-300" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▼</span>
            {t('event_diversity') || '事件多样性观测'}
          </span>
          <span className="text-[var(--color-primary)] font-data">{diversity.triggered} / {diversity.total}</span>
        </div>
        {!isCollapsed && (
          <div className="mt-2 transition-all duration-300 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-1">
              <div className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500" style={{ width: `${diversity.percentage}%` }} />
            </div>
            <div className="flex justify-between text-[9px] text-[var(--text-secondary)] font-mono">
              <span>{t('unique_trigger_rate') || '独特事件触发率'}</span>
              <span>{diversity.percentage}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom: Emergency Alerts */}
      {sophonBlocked && (
        <div className="p-4">
          <div className="bg-orange-500/10 dark:bg-orange-500/10 border border-orange-500/30 p-3 rounded-lg flex gap-3 items-start animate-pulse">
            <AlertOctagon className="text-orange-500 shrink-0" size={18} />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">智子干扰提示</span>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                基础物理研究进度已锁定，当前科研产出效率 -40%。
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
