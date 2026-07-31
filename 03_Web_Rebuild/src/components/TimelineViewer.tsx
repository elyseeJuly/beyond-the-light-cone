import React, { useEffect, useState } from 'react';
import { GameInstance } from '../core/Game';
import timelineData from '../data/timeline.json';
import { Clock, BookOpen, Flag } from 'lucide-react';
import { t } from "../utils/i18n";

export const TimelineViewer: React.FC = () => {
  const [playerTimeline, setPlayerTimeline] = useState<Array<{year: number, event: string}>>([]);
  const [currentYear, setCurrentYear] = useState(0);

  useEffect(() => {
    const updateTimeline = () => {
      const game = GameInstance.get();
      setPlayerTimeline([...game.playerTimeline]);
      setCurrentYear(game.year);
    };

    updateTimeline();
    window.addEventListener('game-turn-complete', updateTimeline);
    window.addEventListener('epoch-changed', updateTimeline);

    return () => {
      window.removeEventListener('game-turn-complete', updateTimeline);
      window.removeEventListener('epoch-changed', updateTimeline);
    };
  }, []);

  return (
    <div className="h-full w-full p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <div className="flex items-center gap-4 border-b border-[var(--color-primary)]/30 pb-4">
          <Clock className="text-[var(--color-primary)] w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-primary)] tracking-wider">{t("编年史观测")}</h1>
            <p className="text-[var(--text-secondary)] mt-1 tracking-wide text-sm">{t("对比当前时间线进展与《三体》宇宙官方纪元事件")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 官方编年史 */}
          <div className="glass-panel p-6 border border-white/5 relative">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
              <BookOpen size={20} className="text-blue-400" />
              {t("官方原著纪元")}</h2>
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
              {timelineData.map((epoch, idx) => {
                const isActive = currentYear >= epoch.gameYearRange[0] && currentYear <= epoch.gameYearRange[1];
                const isPassed = currentYear > epoch.gameYearRange[1];
                
                return (
                  <div key={idx} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active ${isActive ? 'opacity-100' : isPassed ? 'opacity-60' : 'opacity-30'}`}>
                    {/* Icon */}
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-[var(--bg-main)] ${isActive ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : isPassed ? 'bg-white/20' : 'bg-white/5'} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors`}>
                      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-transparent'}`} />
                    </div>
                    {/* Content */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-white/5 bg-black/20 group-hover:bg-black/40 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-bold text-lg ${isActive ? 'text-blue-400' : 'text-[var(--text-primary)]'}`}>{epoch.epoch}</h3>
                        <span className="text-xs font-mono text-[var(--text-secondary)]">{epoch.yearRange}</span>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{epoch.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 玩家履历 */}
          <div className="glass-panel p-6 border border-[var(--color-primary)]/30 relative">
            <h2 className="text-xl font-bold text-[var(--color-primary)] mb-6 flex items-center gap-2">
              <Flag size={20} />
              {t("本局发展履历 (当前: 危机纪元")}{currentYear} {t("年)")}</h2>
            <div className="space-y-4">
              {playerTimeline.length === 0 ? (
                <p className="text-center text-[var(--text-secondary)] py-10 italic">{t("尚无重大历史事件发生...")}</p>
              ) : (
                [...playerTimeline].reverse().map((evt, idx) => (
                  <div key={idx} className="flex gap-4 p-3 rounded bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/10 transition-colors">
                    <div className="w-16 shrink-0 text-right">
                      <span className="text-[var(--color-primary)] font-mono text-sm font-bold opacity-80">{t("第")}{evt.year} {t("年")}</span>
                    </div>
                    <div className="w-px bg-[var(--color-primary)]/30" />
                    <div className="flex-1">
                      <p className="text-[var(--text-primary)] text-sm">{evt.event}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
