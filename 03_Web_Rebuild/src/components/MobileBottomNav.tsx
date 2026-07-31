/**
 * MobileBottomNav - 移动端底部导航栏
 *
 * 替代桌面端的 LeftHub 侧边栏，在移动端（< 768px）显示为底部固定导航。
 * 包含 5 个核心视图切换按钮 + 快捷操作。
 * 适配 iPhone safe-area-inset-bottom。
 */

import React, { useState, useEffect } from 'react';
import { Map, Cpu, Landmark, Archive, Radio, Settings } from 'lucide-react';
import type { ActiveViewType } from './LeftHub';
import { Badge } from './common/Badge';
import { BgmPlayer } from './BgmPlayer';
import { GameInstance } from '../core/Game';
import { t } from "../utils/i18n";

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
  { view: 'starmap', icon: <Map size={20} className="stroke-[1.5]" />, label: t("星图") },
  { view: 'intelligence', icon: <Radio size={20} className="stroke-[1.5]" />, label: t("情报") },
  { view: 'techtree', icon: <Cpu size={20} className="stroke-[1.5]" />, label: t("科技") },
  { view: 'government', icon: <Landmark size={20} className="stroke-[1.5]" />, label: t("政府") },
  { view: 'archive', icon: <Archive size={20} className="stroke-[1.5]" />, label: t("档案") },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeView, setActiveView }) => {
  const [hasNewArchive, setHasNewArchive] = useState(false);
  const [hasNewIntelligence, setHasNewIntelligence] = useState(false);
  const [epoch, setEpoch] = useState(0);

  useEffect(() => {
    const check = () => {
      try {
        const game = GameInstance.get();
        setEpoch(game.epoch);
      } catch { /* ignore */ }
    };
    check();
    window.addEventListener('game-turn-complete', check);
    window.addEventListener('game-loaded', check);
    return () => {
      window.removeEventListener('game-turn-complete', check);
      window.removeEventListener('game-loaded', check);
    };
  }, []);

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

  // Clear badge when view is active
  useEffect(() => {
    if (activeView === 'archive') setHasNewArchive(false);
    if (activeView === 'intelligence') setHasNewIntelligence(false);
  }, [activeView]);

  return (
    <nav data-tutorial-id="mobile-bottom-nav" className="mobile-bottom-nav">
      {/* 音乐播放控制（紧凑模式） */}
      <BgmPlayer isGameOver={false} epoch={epoch} compact />

      {navItems.map((item) => {
        const isActive = activeView === item.view;
        const showBadge = (item.view === 'archive' && hasNewArchive) ||
                          (item.view === 'intelligence' && hasNewIntelligence);

        return (
          <button
            key={item.view}
            onClick={() => setActiveView(item.view)}
            data-tutorial-id={`mobile-nav-${item.view}`}
            className={`
              flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-all duration-200 cursor-pointer relative
              ${isActive
                ? 'text-[var(--color-primary)]'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'
              }
            `}
            style={isActive ? { textShadow: '0 0 8px rgba(var(--color-primary-rgb), 0.5)' } : undefined}
          >
            {item.icon}
            {showBadge && <Badge />}
            <span className="text-[9px] font-bold tracking-wider uppercase">{item.label}</span>
            {isActive && (
              <span className="absolute bottom-1 w-4 h-0.5 bg-[var(--color-primary)] rounded-full" />
            )}
          </button>
        );
      })}

      {/* 系统设置按钮 */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('open-settings'))}
        className="flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-all duration-200 cursor-pointer text-[var(--text-secondary)] hover:text-white hover:bg-white/5"
        title={t("系统设置")}
      >
        <Settings size={20} className="stroke-[1.5]" />
        <span className="text-[9px] font-bold tracking-wider uppercase">{t("设置")}</span>
      </button>
    </nav>
  );
};