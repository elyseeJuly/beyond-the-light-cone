import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, Circle, MapPin } from 'lucide-react';
import { GameInstance } from '../core/Game';
import { STAR_INDEX } from '../config/starIndices';

interface TaskDef {
  id: string;
  label: string;
  navigateTo: string;
  check: () => boolean;
}

/**
 * 可折叠新手任务清单：教程完成后显示，不阻断游戏。
 * 点击任务切换到对应界面。任务全部完成后可手动关闭。
 */
export const BeginnerTasks: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('beginner-tasks-dismissed') === 'true');
  const [, forceTick] = useState(0);

  useEffect(() => {
    const refresh = () => forceTick(t => t + 1);
    window.addEventListener('game-turn-complete', refresh);
    window.addEventListener('game-state-changed', refresh);
    window.addEventListener('ap-changed', refresh);
    const interval = setInterval(refresh, 1000);
    return () => {
      window.removeEventListener('game-turn-complete', refresh);
      window.removeEventListener('game-state-changed', refresh);
      window.removeEventListener('ap-changed', refresh);
      clearInterval(interval);
    };
  }, []);

  const game = GameInstance.get();
  const earth = game.earthCivi;

  const tasks: TaskDef[] = [
    {
      id: 'finish-tech',
      label: '完成第一项科技',
      navigateTo: 'techtree',
      check: () => {
        for (const tree of earth.tecTreeManager.trees.values()) {
          for (const node of tree.nodes.values()) {
            if (node.finished) return true;
          }
        }
        return false;
      },
    },
    {
      id: 'appoint-minister',
      label: '任命一位部长',
      navigateTo: 'government',
      check: () => {
        for (const dept of earth.departments.values()) {
          if (dept.leaderName) return true;
        }
        return false;
      },
    },
    {
      id: 'has-stope',
      label: '拥有采矿场',
      navigateTo: 'starmap',
      check: () => {
        const star = game.starManager.getStar(STAR_INDEX.EARTH);
        return !!star?.hasStope;
      },
    },
    {
      id: 'has-factory',
      label: '拥有加工厂',
      navigateTo: 'starmap',
      check: () => {
        const star = game.starManager.getStar(STAR_INDEX.EARTH);
        return !!star?.hasFactory;
      },
    },
    {
      id: 'resolve-event',
      label: '处理一次剧情事件',
      navigateTo: 'starmap',
      check: () => game.playerTimeline.length > 0,
    },
  ];

  const completedCount = tasks.filter(t => t.check()).length;
  const allDone = completedCount === tasks.length;

  if (dismissed) return null;

  const handleNavigate = (view: string) => {
    window.dispatchEvent(new CustomEvent('change-active-view', { detail: view }));
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('beginner-tasks-dismissed', 'true');
  };

  return (
    <div className="fixed bottom-4 right-4 z-[500] w-64 max-w-[calc(100vw-32px)] select-none">
      <div className="bg-[#070B14]/90 backdrop-blur-md border border-[var(--color-primary)]/30 rounded shadow-[0_0_20px_rgba(0,184,255,0.1)]">
        {/* 头部 */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-full flex items-center justify-between px-3 py-2 text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <MapPin size={12} className="text-[var(--color-primary)]" />
            <span className="text-[10px] font-title font-bold text-[var(--color-primary)] uppercase tracking-wider">
              新手任务 {completedCount}/{tasks.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {allDone && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                className="text-[var(--text-secondary)] hover:text-white text-[10px] cursor-pointer"
              >
                ✕
              </button>
            )}
            {collapsed ? <ChevronUp size={12} className="text-[var(--text-secondary)]" /> : <ChevronDown size={12} className="text-[var(--text-secondary)]" />}
          </div>
        </button>

        {/* 进度条 */}
        <div className="h-0.5 bg-[#243245]/40 overflow-hidden">
          <div
            className="h-full bg-[var(--color-primary)] transition-all duration-500"
            style={{ width: `${(completedCount / tasks.length) * 100}%` }}
          />
        </div>

        {/* 任务列表 */}
        {!collapsed && (
          <div className="flex flex-col gap-0.5 p-2 max-h-[240px] overflow-y-auto">
            {tasks.map(task => {
              const done = task.check();
              return (
                <button
                  key={task.id}
                  onClick={() => handleNavigate(task.navigateTo)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors cursor-pointer ${
                    done ? 'opacity-50' : 'hover:bg-white/5'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  ) : (
                    <Circle size={14} className="text-[var(--text-secondary)] shrink-0" />
                  )}
                  <span className={`text-[11px] ${done ? 'text-emerald-400/70 line-through' : 'text-[var(--text-secondary)]'}`}>
                    {task.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
