import React, { useState, useEffect, useCallback } from 'react';
import { Map, Cpu, Swords, BarChart3, Users2, Building2, AlertOctagon, Globe, Atom, Rocket, Zap, Telescope, FlaskConical, Microscope, Clock } from 'lucide-react';
import { GameInstance } from '../core/Game';
import { DepartmentType } from '../types/enums';
import { wallfacerPanel } from '../ui/WallfacerPanel';
import { DepartmentPanel } from '../ui/DepartmentPanel';

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
}

// Singleton department panel for legacy bridge
const deptPanel = new DepartmentPanel();

export const LeftHub: React.FC<LeftHubProps> = ({ activeView, setActiveView }) => {
  const [sophonBlocked, setSophonBlocked] = useState(false);

  useEffect(() => {
    const check = () => {
      try {
        setSophonBlocked(GameInstance.get().isSophonBlocked());
      } catch { /* ignore */ }
    };
    check();
    window.addEventListener('game-turn-complete', check);
    return () => window.removeEventListener('game-turn-complete', check);
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

      {/* Bottom: Emergency Alerts */}
      {sophonBlocked && (
        <div className="p-4 mt-auto">
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
