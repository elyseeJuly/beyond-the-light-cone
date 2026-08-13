/**
 * MobileLandscapeHub - 移动端横屏左侧图标栏
 *
 * 在移动端横屏（width < 768 且 landscape 且 height <= 500）时，
 * 替代 MobileBottomNav，提供左侧垂直图标导航。
 *
 * 设计要点：
 * - 宽度 56px，给中央星图留足横向空间
 * - 48×48px 触控区域，符合移动端最小触控规范
 * - 当前激活项用左侧 2px 高亮条 + 主色图标标识
 * - 沿用 MobileBottomNav 的 data-tutorial-id，tutorial 坐标逻辑可复用
 */

import React, { useState, useEffect } from 'react';
import { Map, Cpu, Landmark, Archive, Radio, Settings } from 'lucide-react';
import type { ActiveViewType } from './LeftHub';
import { t } from "../utils/i18n";

interface MobileLandscapeHubProps {
  activeView: ActiveViewType;
  setActiveView: (view: ActiveViewType) => void;
}

interface NavItemConfig {
  view: ActiveViewType;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItemConfig[] = [
  { view: 'starmap', icon: <Map size={22} className="stroke-[1.5]" />, label: t("星图") },
  { view: 'intelligence', icon: <Radio size={22} className="stroke-[1.5]" />, label: t("情报") },
  { view: 'techtree', icon: <Cpu size={22} className="stroke-[1.5]" />, label: t("科技") },
  { view: 'government', icon: <Landmark size={22} className="stroke-[1.5]" />, label: t("政府") },
  { view: 'archive', icon: <Archive size={22} className="stroke-[1.5]" />, label: t("档案") },
];

export const MobileLandscapeHub: React.FC<MobileLandscapeHubProps> = ({
  activeView,
  setActiveView,
}) => {
  const [hasNewArchive, setHasNewArchive] = useState(false);
  const [hasNewIntelligence, setHasNewIntelligence] = useState(false);

  useEffect(() => {
    const handleTurnComplete = () => {
      if (activeView !== 'archive') setHasNewArchive(true);
      if (activeView !== 'intelligence') setHasNewIntelligence(true);
    };

    window.addEventListener('game-turn-complete', handleTurnComplete);
    window.addEventListener('game-event-triggered', handleTurnComplete);

    return () => {
      window.removeEventListener('game-turn-complete', handleTurnComplete);
      window.removeEventListener('game-event-triggered', handleTurnComplete);
    };
  }, [activeView]);

  useEffect(() => {
    if (activeView === 'archive') setHasNewArchive(false);
    if (activeView === 'intelligence') setHasNewIntelligence(false);
  }, [activeView]);

  return (
    <aside
      data-tutorial-id="mobile-landscape-hub"
      className="mobile-landscape-hub"
      style={{ 
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        width: 'calc(56px + env(safe-area-inset-left, 0px))'
      }}
    >
      <div className="flex flex-col items-center gap-2">
        {navItems.map((item) => {
          const isActive = activeView === item.view;
          const showBadge =
            (item.view === 'archive' && hasNewArchive) ||
            (item.view === 'intelligence' && hasNewIntelligence);

          return (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              data-tutorial-id={`mobile-nav-${item.view}`}
              className={`
                mobile-landscape-hub-item relative
                ${isActive ? 'active' : ''}
              `}
              title={item.label}
            >
              {isActive && <span className="mobile-landscape-hub-indicator" />}
              <span
                className={`
                  mobile-landscape-hub-icon
                  ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--text-secondary)]'}
                `}
                style={
                  isActive
                    ? { filter: 'drop-shadow(0 0 6px rgba(var(--color-primary-rgb), 0.5))' }
                    : undefined
                }
              >
                {item.icon}
              </span>
              {showBadge && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col items-center gap-2">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-settings'))}
          className="mobile-landscape-hub-item"
          title={t("系统设置")}
        >
          <span className="mobile-landscape-hub-icon text-[var(--text-secondary)]">
            <Settings size={22} className="stroke-[1.5]" />
          </span>
        </button>
      </div>
    </aside>
  );
};
