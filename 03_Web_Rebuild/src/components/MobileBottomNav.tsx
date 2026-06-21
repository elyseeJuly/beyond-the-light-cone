/**
 * MobileBottomNav - 移动端底部导航栏
 *
 * 替代桌面端的 LeftHub 侧边栏，在移动端（< 768px）显示为底部固定导航。
 * 包含 5 个核心视图切换按钮 + 快捷操作。
 * 适配 iPhone safe-area-inset-bottom。
 */

import React from 'react';
import { Map, Cpu, Landmark, Archive, Radio } from 'lucide-react';
import type { ActiveViewType } from './LeftHub';

interface MobileBottomNavProps {
  activeView: ActiveViewType;
  setActiveView: (view: ActiveViewType) => void;
}

interface NavItemConfig {
  view: ActiveViewType;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItemConfig[] = [
  { view: 'starmap', icon: <Map size={20} className="stroke-[1.5]" />, label: '星图' },
  { view: 'intelligence', icon: <Radio size={20} className="stroke-[1.5]" />, label: '情报' },
  { view: 'techtree', icon: <Cpu size={20} className="stroke-[1.5]" />, label: '科技' },
  { view: 'government', icon: <Landmark size={20} className="stroke-[1.5]" />, label: '政府' },
  { view: 'archive', icon: <Archive size={20} className="stroke-[1.5]" />, label: '档案' },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeView, setActiveView }) => {
  return (
    <nav className="mobile-bottom-nav">
      {navItems.map((item) => {
        const isActive = activeView === item.view;
        return (
          <button
            key={item.view}
            onClick={() => setActiveView(item.view)}
            className={`
              flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-all duration-200 cursor-pointer
              ${isActive
                ? 'text-[var(--color-primary)]'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'
              }
            `}
            style={isActive ? { textShadow: '0 0 8px rgba(var(--color-primary-rgb), 0.5)' } : undefined}
          >
            {item.icon}
            <span className="text-[9px] font-bold tracking-wider uppercase">{item.label}</span>
            {isActive && (
              <span className="absolute bottom-1 w-4 h-0.5 bg-[var(--color-primary)] rounded-full" />
            )}
          </button>
        );
      })}
    </nav>
  );
};