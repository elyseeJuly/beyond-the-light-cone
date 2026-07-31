import React from 'react';
import { GameInstance } from '../core/Game';
import timelineData from '../data/timeline.json';
import { BookOpen, Flag } from 'lucide-react';
import { t } from "../utils/i18n";

export const TimelineComparisonPanel: React.FC = () => {
  const game = GameInstance.get();
  const playerTimeline = game.playerTimeline;
  const currentYear = game.year;

  return (
    <div className="w-full max-w-6xl mt-8 mb-12">
      <h2 className="text-2xl font-bold text-center text-[var(--color-primary)] mb-8 tracking-widest">
        {t("双轨纪元：命运的偏离度分析")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
        
        {/* 官方时间线 */}
        <div className="glass-panel p-6 border border-white/10 overflow-y-auto custom-scrollbar relative">
          <div className="sticky top-0 bg-[#050A1F]/90 backdrop-blur-md pb-4 z-10 border-b border-white/5 mb-4">
            <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
              <BookOpen size={18} />
              {t("官方《三体》编年史")}</h3>
          </div>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-white/10">
            {timelineData.map((epoch, idx) => {
              const isReached = currentYear >= epoch.gameYearRange[0];
              return (
                <div key={idx} className={`relative flex items-start gap-4 ${isReached ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 z-10 ${isReached ? 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]' : 'bg-white/20'}`} />
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-[var(--text-primary)]">{epoch.epoch}</span>
                      <span className="text-xs font-mono text-[var(--text-secondary)]">{epoch.yearRange}</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{epoch.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 玩家履历 */}
        <div className="glass-panel p-6 border border-[var(--color-primary)]/30 overflow-y-auto custom-scrollbar relative bg-[var(--color-primary)]/5">
          <div className="sticky top-0 bg-[#050A1F]/90 backdrop-blur-md pb-4 z-10 border-b border-[var(--color-primary)]/20 mb-4">
            <h3 className="text-lg font-bold text-[var(--color-primary)] flex items-center gap-2">
              <Flag size={18} />
              {t("本局真实发展履历")}</h3>
          </div>
          <div className="space-y-4">
            {playerTimeline.length === 0 ? (
              <p className="text-center text-[var(--text-secondary)] py-10 italic">{t("您的文明在历史的长河中未曾留下痕迹...")}</p>
            ) : (
              [...playerTimeline].reverse().map((evt, idx) => (
                <div key={idx} className="flex gap-4 p-3 rounded bg-black/40 border border-[var(--color-primary)]/20">
                  <div className="w-16 shrink-0">
                    <span className="text-[var(--color-primary)] font-mono text-sm font-bold opacity-80">
                      {t("第")}{evt.year} {t("年")}</span>
                  </div>
                  <div className="w-px bg-[var(--color-primary)]/30" />
                  <div className="flex-1">
                    <p className="text-sm text-[var(--text-primary)] leading-relaxed">{evt.event}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
