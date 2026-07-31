import React, { useEffect, useRef } from 'react';
import { GameInstance } from '../core/Game';
import { t } from "../utils/i18n";

/**
 * 智脑情境提示组件：监听游戏事件与回合状态，
 * 在特定情境（AP缺乏、威慑危急、资源赤字）下通过 Toast 派发【智脑警告】或【智脑提示】。
 * 具备冷却时间机制，避免高频打扰，同时确保重度危机时给予提醒。
 */
const STORAGE_PREFIX = 'session:tip-shown:';

function showTipOnce(key: string, text: string, category = t("【智脑提示】")): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(STORAGE_PREFIX + key) === 'true') return;
  localStorage.setItem(STORAGE_PREFIX + key, 'true');
  window.dispatchEvent(new CustomEvent('game:toast:message', {
    detail: { text, category },
  }));
}

function showTipWithCooldown(key: string, text: string, currentTurn: number, cooldownTurns: number, category = t("【智脑警告】")): void {
  if (typeof window === 'undefined') return;
  const lastShownKey = `session:tip-last-turn:${key}`;
  const lastTurn = parseInt(localStorage.getItem(lastShownKey) || '-999', 10);
  if (currentTurn - lastTurn < cooldownTurns) return;

  localStorage.setItem(lastShownKey, currentTurn.toString());
  window.dispatchEvent(new CustomEvent('game:toast:message', {
    detail: { text, category },
  }));
}

export const ContextualTips: React.FC = () => {
  const prevEpochRef = useRef<number>(-1);
  const prevResourceRef = useRef<number>(-1);
  const resourceDropTurnsRef = useRef<number>(0);

  useEffect(() => {
    const game = GameInstance.get();
    prevEpochRef.current = game.epoch;
    prevResourceRef.current = game.earthCivi.resource;

    // ── AP 不足警告（5回合冷却） ──
    const handleApInsufficient = () => {
      const g = GameInstance.get();
      showTipWithCooldown('ap-insufficient', t("AP 是本回合指令点。可在内阁任命更多部长以加快 AP 恢复。"), g.year, 5, t("【智脑提示】"));
    };

    // ── 界面首次切换 ──
    const handleViewChange = (e: Event) => {
      const view = (e as CustomEvent).detail;
      if (view === 'techtree') {
        showTipOnce('enter-techtree', t("选择可研究的科技节点，科研会随着回合推进自动积累。"));
      } else if (view === 'government') {
        showTipOnce('enter-government', t("任命官员可强化对应部门产出并提供 AP 回复加成。"));
      }
    };

    // ── 回合阻断 ──
    const handleTurnBlocked = () => {
      const g = GameInstance.get();
      showTipWithCooldown('turn-blocked', t("当前存在未处理事项（如科研停滞或未解决事件）。"), g.year, 3, t("【智脑提示】"));
    };

    // ── 回合完成：检查资源赤字与威慑报警 ──
    const handleTurnComplete = () => {
      const g = GameInstance.get();
      const earth = g.earthCivi;
      const turn = g.year;

      // 1. 矿产连续下降检查
      if (earth.resource < prevResourceRef.current) {
        resourceDropTurnsRef.current += 1;
        if (resourceDropTurnsRef.current >= 3) {
          showTipWithCooldown('resource-decay', t("检测到矿产储备连续 3 回合下降！建议调高采矿比例或新建采矿场。"), turn, 8, t("【智脑警告】"));
          resourceDropTurnsRef.current = 0;
        }
      } else {
        resourceDropTurnsRef.current = 0;
      }
      prevResourceRef.current = earth.resource;

      // 2. 威慑度危急检查（威慑纪元及以后）
      if (g.epoch >= 1 && earth.deterrenceValue < 30) {
        showTipWithCooldown('deterrence-low', t("战略威慑度处于极危险低位！三体舰队进攻风险剧增。"), turn, 5, t("【智脑警告】"));
      }

      // 3. 稳定度低警告
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

      if (stability < 40) {
        showTipWithCooldown('stability-low', t("社会稳定度已降至 40% 以下！稳定度归零将导致政权崩溃。"), turn, 6, t("【智脑警告】"));
      }

      // 4. 纪元切换
      if (prevEpochRef.current !== -1 && g.epoch !== prevEpochRef.current) {
        showTipOnce(`epoch-${g.epoch}`, t("已跨入新纪元。解锁全新战略目标与智脑数据库。"), t("【纪元新篇】"));
        prevEpochRef.current = g.epoch;
      }
    };

    window.addEventListener('ap-insufficient', handleApInsufficient);
    window.addEventListener('change-active-view', handleViewChange);
    window.addEventListener('turn-blocked', handleTurnBlocked);
    window.addEventListener('game-turn-complete', handleTurnComplete);

    return () => {
      window.removeEventListener('ap-insufficient', handleApInsufficient);
      window.removeEventListener('change-active-view', handleViewChange);
      window.removeEventListener('turn-blocked', handleTurnBlocked);
      window.removeEventListener('game-turn-complete', handleTurnComplete);
    };
  }, []);

  return null;
};
