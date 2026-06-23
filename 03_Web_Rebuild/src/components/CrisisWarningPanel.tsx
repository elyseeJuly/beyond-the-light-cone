import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { GameInstance } from '../core/Game';
import { EpochType, TecTreeType } from '../types/enums';

export const CrisisWarningPanel: React.FC = () => {
  const [warnings, setWarnings] = useState<string[]>([]);

  const checkWarnings = () => {
    const game = GameInstance.get();
    if (!game) return;

    const activeList: string[] = [];
    const earth = game.earthCivi;
    if (!earth) return;

    // Defeat Condition 1: Extinction (population <= 0)
    if (earth.population > 0 && earth.population <= 25) {
      activeList.push(`⚠️ 人口危机：地球文明人口仅存 ${earth.population} 点！若人口归零将触发文明灭绝灭亡！`);
    }

    // Defeat Condition 2: Treachery (treachery >= 100)
    if (earth.treachery >= 80) {
      activeList.push(`⚠️ 逃亡失控：逃亡主义倾向已达 ${earth.treachery}%！达到 100% 将导致社会崩溃与灭亡！`);
    }

    // Defeat Condition 3: Helium Flash / Dimension Strike (year > 350)
    if (game.year >= 280) {
      const isSafe = earth.tecTreeManager.isTecFinishedAnywhere("黑域生成") ||
                     earth.tecTreeManager.isTecFinishedAnywhere("数字方舟") ||
                     game.hasFlag("dimensional_defense") ||
                     game.hasFlag("wandering_completed");
      if (!isSafe) {
        const remaining = 350 - game.year;
        if (remaining > 0) {
          activeList.push(`🚨 毁灭倒计时：距离氦闪/二向箔打击降临仅剩 ${remaining} 回合！需尽快完成“黑域”或“数字生命”！`);
        }
      }
    }

    // Alien Fleet Invasion Warnings
    if (game.alienCiviManager && game.alienCiviManager.aliens) {
      for (const alien of game.alienCiviManager.aliens.values()) {
        if (alien.fleets) {
          alien.fleets.forEach((fleet: any) => {
            if (fleet.eta > 0 && fleet.eta <= 5) {
              activeList.push(`🛸 警报：发现【${fleet.belongToCivi}】所属「${fleet.name}」正驶向太阳系，预计 ${fleet.eta} 回合后抵达！`);
            }
          });
        }
      }
    }

    // Victory Condition 1: Wandering Proximity
    const tm = earth.tecTreeManager;
    const hasEngine3 = tm.isTecFinished(TecTreeType.AEROSPACE, "行星发动机Ⅲ型");
    const hasNewHome = tm.isTecFinished(TecTreeType.INTERSTELLAR, "新家园选址");
    if (hasEngine3 && !hasNewHome) {
      activeList.push(`💡 流浪计划：行星发动机已建毕！请尽快完成‘新家园选址’科技以启航流浪！`);
    } else if (!hasEngine3 && hasNewHome) {
      activeList.push(`💡 流浪计划：新星系移居地已锁定！请尽快完成‘行星发动机Ⅲ型’以逃离太阳系！`);
    }

    // Victory Condition 2: Deterrence Proximity
    if (game.epoch >= EpochType.DETERRENCE) {
      if (earth.swordholder === null) {
        activeList.push(`🗡️ 威慑失效：威慑纪元已开启，但执剑人席位空缺！`);
      } else if (earth.deterrenceValue < 80) {
        activeList.push(`🗡️ 威慑危机：执剑人 ${earth.swordholder} 在位，但当前威慑度仅 ${Math.floor(earth.deterrenceValue)}%，不足以维持和平（需 >=80%）！`);
      }
    }

    setWarnings(activeList);
  };

  useEffect(() => {
    checkWarnings();
    window.addEventListener('game-turn-complete', checkWarnings);
    window.addEventListener('game-loaded', checkWarnings);
    return () => {
      window.removeEventListener('game-turn-complete', checkWarnings);
      window.removeEventListener('game-loaded', checkWarnings);
    };
  }, []);

  if (warnings.length === 0) return null;

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-50 bg-red-950/80 backdrop-blur-md border border-red-500/40 rounded-lg p-3.5 shadow-[0_0_20px_rgba(239,68,68,0.25)] select-none pointer-events-auto flex flex-col gap-2.5 animate-in slide-in-from-top duration-300">
      {/* Scanline pattern overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[size:100%_4px] opacity-20" />

      {/* Title */}
      <div className="flex items-center gap-2 text-red-400 border-b border-red-500/20 pb-1.5 shrink-0">
        <AlertTriangle className="w-4 h-4 animate-bounce" />
        <span className="text-xs font-black font-mono tracking-widest uppercase">
          PDC CIVILIZATION RISK WARNING // 人类文明安全监视哨
        </span>
      </div>

      {/* Warnings List */}
      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-red-500/30 scrollbar-track-transparent">
        {warnings.map((warn, idx) => (
          <div 
            key={idx} 
            className="text-[11px] leading-relaxed text-red-200 font-mono tracking-wide"
          >
            {warn}
          </div>
        ))}
      </div>
    </div>
  );
};
