import React, { useEffect, useRef } from 'react';
import { GameInstance } from '../core/Game';

/**
 * 一次性情境提示组件：监听游戏事件，在特定情境首次出现时通过 Toast 显示简短提示。
 * 每条提示每设备只出现一次（通过 localStorage 标记）。
 * 不渲染任何 UI，仅负责事件监听与 Toast 派发。
 */
const STORAGE_PREFIX = 'tip-shown:';

function showTipOnce(key: string, text: string): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(STORAGE_PREFIX + key) === 'true') return;
  localStorage.setItem(STORAGE_PREFIX + key, 'true');
  window.dispatchEvent(new CustomEvent('game:toast:message', {
    detail: { text, category: '【新手提示】' },
  }));
}

export const ContextualTips: React.FC = () => {
  const stabilityWarnedRef = useRef(false);
  const prevEpochRef = useRef<number>(-1);

  useEffect(() => {
    const game = GameInstance.get();
    prevEpochRef.current = game.epoch;

    // ── AP 首次不足 ──
    const handleApInsufficient = () => {
      showTipOnce('ap-insufficient', 'AP 是本回合的行动力，下一回合会重新恢复。');
    };

    // ── 首次进入科技树 ──
    const handleViewChange = (e: Event) => {
      const view = (e as CustomEvent).detail;
      if (view === 'techtree') {
        showTipOnce('enter-techtree', '选择可研究的节点，科研会随回合推进。');
      } else if (view === 'government') {
        showTipOnce('enter-government', '任命合适人员可以提升部门效率。');
      }
    };

    // ── 首次被回合阻断 ──
    const handleTurnBlocked = () => {
      showTipOnce('turn-blocked', '还有事务没有处理，点击提示可以前往对应界面。');
    };

    // ── 回合完成：检查稳定度与纪元切换 ──
    const handleTurnComplete = () => {
      const g = GameInstance.get();
      const earth = g.earthCivi;

      // 稳定度首次低于 50%
      let finishedTechs = 0;
      let totalTechs = 0;
      for (const tree of earth.tecTreeManager.trees.values()) {
        for (const node of tree.nodes.values()) {
          totalTechs++;
          if (node.finished) finishedTechs++;
        }
      }
      const eco = Math.floor(earth.economy);
      const army = earth.army;
      const cul = Math.floor(earth.culture);
      const pop = earth.population;
      const treachery = earth.treachery;
      const econFactor = Math.min(25, (eco / 120) * 25);
      const armyFactor = Math.min(25, (army / 25) * 25);
      const treacheryPenalty = treachery * 0.4;
      const popFactor = Math.min(25, (pop / 80) * 25);
      const techFactor = Math.min(25, (finishedTechs / Math.max(1, totalTechs)) * 25);
      const cultureFactor = Math.min(25, (cul / 100) * 25);
      const stability = Math.max(5, Math.min(100, Math.floor(econFactor + armyFactor + popFactor + techFactor + cultureFactor + (40 - treacheryPenalty))));

      if (stability < 50 && !stabilityWarnedRef.current) {
        stabilityWarnedRef.current = true;
        showTipOnce('stability-low', '稳定度归零将导致失败。');
      }

      // 纪元首次切换
      if (prevEpochRef.current !== -1 && g.epoch !== prevEpochRef.current) {
        showTipOnce('epoch-changed', '新纪元会带来新的事件、科技和生存问题。');
        prevEpochRef.current = g.epoch;
      }
    };

    // ── 纪元切换事件 ──
    const handleEpochChanged = () => {
      const g = GameInstance.get();
      if (prevEpochRef.current !== -1 && g.epoch !== prevEpochRef.current) {
        showTipOnce('epoch-changed', '新纪元会带来新的事件、科技和生存问题。');
        prevEpochRef.current = g.epoch;
      }
    };

    window.addEventListener('ap-insufficient', handleApInsufficient);
    window.addEventListener('change-active-view', handleViewChange);
    window.addEventListener('turn-blocked', handleTurnBlocked);
    window.addEventListener('game-turn-complete', handleTurnComplete);
    window.addEventListener('epoch-changed', handleEpochChanged);

    return () => {
      window.removeEventListener('ap-insufficient', handleApInsufficient);
      window.removeEventListener('change-active-view', handleViewChange);
      window.removeEventListener('turn-blocked', handleTurnBlocked);
      window.removeEventListener('game-turn-complete', handleTurnComplete);
      window.removeEventListener('epoch-changed', handleEpochChanged);
    };
  }, []);

  return null;
};
