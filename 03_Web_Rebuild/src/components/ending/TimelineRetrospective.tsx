/**
 * TimelineRetrospective.tsx — Phase 3: 时间线回顾
 *
 * 基于 playerTimeline 和 historyLogs 自动生成滚动式时间线回顾。
 * 每条事件以卡片形式依次浮现，附带统计总结卡。
 */

import React, { useState, useEffect, useRef } from 'react';
import { GameInstance } from '../../core/Game';
import { EndingConfig } from '../../config/endingConfig';
import timelineData from '../../data/timeline.json';

interface Props {
  config: EndingConfig;
  onComplete: () => void;
}

interface TimelineEntry {
  year: number;
  event: string;
  type: 'player' | 'epoch' | 'summary';
}

export const TimelineRetrospective: React.FC<Props> = ({ config, onComplete }) => {
  const game = GameInstance.get();
  const [visibleCount, setVisibleCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build combined timeline
  const entries: TimelineEntry[] = [];

  // Add player timeline events
  game.playerTimeline.forEach(evt => {
    entries.push({ year: evt.year, event: evt.event, type: 'player' });
  });

  // Add epoch transitions from timeline data
  timelineData.forEach(epoch => {
    if (game.year >= epoch.gameYearRange[0]) {
      entries.push({
        year: epoch.gameYearRange[0],
        event: `【纪元】进入${epoch.epoch}`,
        type: 'epoch',
      });
    }
  });

  // Sort by year
  entries.sort((a, b) => a.year - b.year);

  // Add final summary card
  const e = game.earthCivi;
  const epochNames = ['危机纪元', '威慑纪元', '广播纪元', '掩体纪元', '银河纪元'];
  entries.push({
    year: game.year,
    event: `历时 ${game.year} 年 · ${epochNames[game.epoch] || '未知纪元'} · 人口 ${Math.max(0, e.population).toLocaleString()} · 经济 ${Math.max(0, e.economy)} · 文化 ${Math.max(0, e.culture)} · 军力 ${Math.max(0, e.army)} · 文明等级 ${e.getCiviLevelLabel ? e.getCiviLevelLabel() : '未知'}`,
    type: 'summary',
  });

  // Reveal entries one by one
  useEffect(() => {
    if (visibleCount >= entries.length) {
      // All entries shown, wait then proceed
      const t = setTimeout(onComplete, 4000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisibleCount(v => v + 1), 1200);
    return () => clearTimeout(t);
  }, [visibleCount, entries.length, onComplete]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [visibleCount]);

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${config.gradientFrom}F0 0%, #050A1F 100%)`,
      }}
    >
      {/* Header */}
      <div className="w-full max-w-3xl px-8 pt-8 pb-4 z-10">
        <p
          className="text-xs tracking-[0.5em] uppercase mb-2 font-bold"
          style={{ color: config.accentColor + '66' }}
        >
          Civilization Retrospective
        </p>
        <h2
          className="text-3xl font-black tracking-tight"
          style={{ color: config.accentColor }}
        >
          岁月回溯
        </h2>
        <p className="text-white/30 text-sm mt-1">
          记录下你带领人类文明走过的每一个重要时刻
        </p>
      </div>

      {/* Timeline scroll container */}
      <div
        ref={containerRef}
        className="flex-1 w-full max-w-3xl overflow-y-auto px-8 pb-8 custom-scrollbar"
      >
        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-5 top-0 bottom-0 w-px"
            style={{ backgroundColor: config.accentColor + '30' }}
          />

          {entries.slice(0, visibleCount).map((entry, idx) => (
            <div
              key={idx}
              className="relative flex items-start gap-4 mb-6 animate-in fade-in slide-in-from-bottom-3 duration-700"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Dot */}
              <div
                className="w-3 h-3 rounded-full mt-1.5 shrink-0 z-10 relative left-[14px]"
                style={{
                  backgroundColor:
                    entry.type === 'summary'
                      ? config.accentColor
                      : entry.type === 'epoch'
                      ? '#60A5FA'
                      : config.accentColor + '99',
                  boxShadow: entry.type === 'summary' ? `0 0 12px ${config.accentColor}88` : 'none',
                }}
              />

              {/* Card */}
              <div
                className={`flex-1 ml-4 p-4 rounded border transition-all ${
                  entry.type === 'summary'
                    ? 'border-' + config.accentColor + '/40 bg-white/5'
                    : entry.type === 'epoch'
                    ? 'border-blue-500/30 bg-blue-500/5'
                    : 'border-white/10 bg-white/[0.02]'
                }`}
                style={{
                  borderColor:
                    entry.type === 'summary'
                      ? config.accentColor + '66'
                      : entry.type === 'epoch'
                      ? 'rgba(96,165,250,0.3)'
                      : 'rgba(255,255,255,0.1)',
                }}
              >
                <div className="flex items-center gap-3 mb-1">
                  <span
                    className="text-xs font-mono font-bold"
                    style={{ color: config.accentColor + '99' }}
                  >
                    第 {entry.year} 年
                  </span>
                  {entry.type === 'epoch' && (
                    <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-sm uppercase tracking-wider">
                      Epoch
                    </span>
                  )}
                  {entry.type === 'summary' && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-wider"
                      style={{
                        backgroundColor: config.accentColor + '22',
                        color: config.accentColor,
                      }}
                    >
                      Final Report
                    </span>
                  )}
                </div>
                <p
                  className={`text-sm leading-relaxed ${
                    entry.type === 'summary' ? 'font-bold text-white/90' : 'text-white/60'
                  }`}
                >
                  {entry.event}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skip */}
      <button
        onClick={onComplete}
        className="absolute bottom-8 right-8 text-white/20 hover:text-white/50 text-xs tracking-widest uppercase transition-colors z-20"
      >
        Skip →
      </button>
    </div>
  );
};
