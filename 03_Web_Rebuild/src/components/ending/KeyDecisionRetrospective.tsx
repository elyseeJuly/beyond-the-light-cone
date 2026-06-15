import React from 'react';
import { GameInstance } from '../../core/Game';
import { GitBranch, CornerDownRight, CheckCircle2 } from 'lucide-react';

interface Props {
  accentColor?: string;
  onRollback?: () => void;
}

export const KeyDecisionRetrospective: React.FC<Props> = ({ accentColor = '#00E5FF', onRollback }) => {
  const game = GameInstance.get();
  
  // Filter key decisions from playerTimeline
  const decisions = game.playerTimeline
    .filter(evt => evt.event.includes('做出选择') || evt.event.includes('确认了重大历史事件'));

  if (decisions.length === 0) {
    return (
      <div className="text-center p-6 border border-white/5 bg-white/[0.02] rounded-lg">
        <p className="text-white/40 text-sm italic">本局中未触发关键决策事件</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <GitBranch className="w-4 h-4" style={{ color: accentColor }} />
        <h3 className="text-sm font-bold uppercase tracking-wider text-white/90">命运分歧抉择回顾</h3>
      </div>

      <div className="relative border-l border-white/10 ml-3.5 pl-6 space-y-4 py-2">
        {decisions.map((dec, idx) => {
          // Parse event name and choice label
          let eventName = '重大历史事件';
          let choiceText = '已确认';
          
          if (dec.event.includes('在「')) {
            const matches = dec.event.match(/在「(.*?)」事件中做出选择：(.*?)$/);
            if (matches && matches.length >= 3) {
              eventName = matches[1];
              choiceText = matches[2];
            }
          } else if (dec.event.includes('确认了重大历史事件「')) {
            const matches = dec.event.match(/确认了重大历史事件「(.*?)」/);
            if (matches && matches.length >= 2) {
              eventName = matches[1];
              choiceText = '已确认并执行';
            }
          }

          return (
            <div key={idx} className="relative group">
              {/* Timeline marker */}
              <div 
                className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full border border-black z-10 transition-colors bg-neutral-800 group-hover:bg-cyan-400"
                style={{ borderColor: accentColor }}
              />

              {/* Card */}
              <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
                  <span>第 {dec.year} 年</span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" style={{ color: accentColor }} />
                    DIVERGENCE POINT
                  </span>
                </div>
                <div className="text-xs font-bold text-white/80">
                  {eventName}
                </div>
                <div className="flex items-start gap-1.5 text-xs text-white/60 bg-black/20 p-2 rounded mt-1 border border-white/5">
                  <CornerDownRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    抉择结果：<span className="text-cyan-300 font-medium">{choiceText}</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {onRollback && (
        <div className="mt-2 text-center">
          <p className="text-[10px] text-white/30 mb-2">如果您对结局不满意，可使用时间穿梭回滚决策时间线。</p>
        </div>
      )}
    </div>
  );
};
