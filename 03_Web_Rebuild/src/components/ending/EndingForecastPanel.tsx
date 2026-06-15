import React, { useEffect, useState } from 'react';
import { GameInstance } from '../../core/Game';
import { AlertTriangle, Shield } from 'lucide-react';

export const EndingForecastPanel: React.FC = () => {
  const [forecast, setForecast] = useState<Array<{ name: string; progress: number; isThreat: boolean }>>([]);
  const [criticalAlert, setCriticalAlert] = useState<string | null>(null);

  const updateForecast = () => {
    const game = GameInstance.get();
    if (!game) return;
    const f = game.getEndingForecast();
    setForecast(f);

    // Check for critical warnings (progress >= 85%)
    let alertMsg: string | null = null;
    const threatItem = f.find(item => item.isThreat && item.progress >= 85);
    const victoryItem = f.find(item => !item.isThreat && item.progress >= 85);

    if (threatItem) {
      alertMsg = `🚨 警告：${threatItem.name} 临界度已达 ${threatItem.progress}%！文明即将毁灭！`;
    } else if (victoryItem) {
      alertMsg = `✨ 契机：${victoryItem.name} 完成度已达 ${victoryItem.progress}%！胜利在此一举！`;
    }

    // Special check for final 3 turns of Helium flash (approx year 347+)
    if (game.year >= 347 && game.year < 350) {
      const isSafe = game.earthCivi.tecTreeManager.isTecFinishedAnywhere("黑域生成") ||
                     game.earthCivi.tecTreeManager.isTecFinishedAnywhere("数字方舟") ||
                     game.hasFlag("dimensional_defense") ||
                     game.hasFlag("wandering_completed");
      if (!isSafe) {
        alertMsg = `🚨 PDC终极警报：太阳氦闪/二向箔打击将在 ${350 - game.year} 回合内降临太阳系！无生还记录！`;
      }
    }

    setCriticalAlert(alertMsg);
  };

  useEffect(() => {
    updateForecast();
    window.addEventListener('game-turn-complete', updateForecast);
    window.addEventListener('game-loaded', updateForecast);
    return () => {
      window.removeEventListener('game-turn-complete', updateForecast);
      window.removeEventListener('game-loaded', updateForecast);
    };
  }, []);

  if (forecast.length === 0) return null;

  return (
    <div className="space-y-4">
      {criticalAlert && (
        <div className="p-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 text-xs font-mono tracking-wide animate-pulse flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{criticalAlert}</span>
        </div>
      )}

      <div className="bg-black/10 dark:bg-white/5 p-3 rounded-lg border border-white/5 space-y-3">
        <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">结局趋势雷达</span>
          <span className="text-[9px] font-mono text-[var(--text-secondary)]">FORECAST CENTER</span>
        </div>

        <div className="space-y-2.5">
          {forecast.map((item, idx) => {
            const isThreat = item.isThreat;
            const progress = Math.min(Math.max(item.progress, 0), 100);
            
            let color = 'bg-cyan-500';
            if (isThreat) {
              color = progress >= 85 ? 'bg-red-500' : 'bg-orange-500';
            } else {
              color = progress >= 85 ? 'bg-green-500' : 'bg-cyan-500';
            }

            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                    {isThreat ? (
                      <AlertTriangle className="w-3 h-3 text-orange-400 animate-pulse" />
                    ) : (
                      <Shield className="w-3 h-3 text-cyan-400" />
                    )}
                    {item.name}
                  </span>
                  <span className={isThreat ? 'text-orange-400' : 'text-cyan-400'}>
                    {progress}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
