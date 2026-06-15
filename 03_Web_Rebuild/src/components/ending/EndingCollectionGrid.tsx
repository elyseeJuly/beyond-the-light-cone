import React from 'react';
import { SaveManager } from '../../core/SaveManager';
import { ENDING_CONFIGS, EndingKey, NG_PLUS_BONUSES } from '../../config/endingConfig';
import { Lock, Award, Sparkles } from 'lucide-react';

export const EndingCollectionGrid: React.FC = () => {
  const history = SaveManager.getEndingHistory();
  const unlocked = SaveManager.getEndingUnlocks();

  const allKeys: EndingKey[] = [
    'HIDDEN',
    'WANDERING',
    'DIGITAL',
    'DETERRENCE',
    'CONQUEST',
    'DARK_DOMAIN',
    'DEFEAT_TREACHERY',
    'DEFEAT_EXTINCTION',
    'DEFEAT_HELIUM_FLASH',
    'DEFEAT_DIMENSION_STRIKE'
  ];

  return (
    <div className="space-y-6">
      {/* NG+ Active Buffs Summary */}
      <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 backdrop-blur-sm shadow-inner">
        <h3 className="text-sm font-bold text-yellow-400 flex items-center gap-2 mb-2 font-mono">
          <Sparkles className="w-4 h-4 animate-pulse text-yellow-400" />
          ACTIVE NEW GAME PLUS BONUSES // 当前生效的周目加成
        </h3>
        {history.length === 0 ? (
          <p className="text-xs text-white/40 italic">暂无生效的加成。通关任意胜利结局以解锁下周目全局属性加成！</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
            {Array.from(unlocked).map((unlockKey, idx) => {
              const bonus = NG_PLUS_BONUSES[unlockKey];
              if (!bonus) return null;
              return (
                <div key={idx} className="flex gap-2.5 items-start p-2.5 rounded bg-black/40 border border-white/5 animate-in fade-in duration-300">
                  <div className="w-5 h-5 rounded-full bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] text-yellow-400">★</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-yellow-300">{bonus.name}</div>
                    <div className="text-[10px] text-white/50 mt-0.5 leading-relaxed">{bonus.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid of All Endings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allKeys.map(key => {
          const config = ENDING_CONFIGS[key];
          const isUnlocked = history.some(record => {
            if (config.isVictory) {
              return record.victoryType !== null && `unlocked_victory_${record.victoryType}` === `unlocked_victory_${config.key}`;
            } else {
              return record.defeatType !== null && `DEFEAT_${record.defeatType}` === config.key;
            }
          });

          const bonusKey = `unlocked_victory_${config.key}`;
          const bonus = NG_PLUS_BONUSES[bonusKey];

          return (
            <div
              key={key}
              className={`relative rounded-xl border p-4.5 flex flex-col gap-3 transition-all duration-300 group overflow-hidden ${
                isUnlocked 
                  ? 'border-white/10 hover:border-white/20 hover:scale-[1.02]' 
                  : 'border-white/5 opacity-50 bg-neutral-900/50'
              }`}
              style={{
                background: isUnlocked 
                  ? `linear-gradient(135deg, ${config.gradientFrom}88 0%, ${config.gradientTo}44 100%)`
                  : 'rgba(255,255,255,0.01)'
              }}
            >
              {/* Scanline overlay for unlocked */}
              {isUnlocked && (
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[size:100%_4px] opacity-10" />
              )}

              {/* Title & Icon */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[9px] font-mono tracking-widest text-white/40 uppercase mb-1">
                    {config.isVictory ? 'Victory Outcome' : 'Defeat Outcome'}
                  </div>
                  <h4 className="text-base font-bold text-white tracking-wide">
                    {config.title}
                  </h4>
                  <p className="text-[10px] text-white/50 italic tracking-wider mt-0.5">
                    {config.subtitle}
                  </p>
                </div>
                <div className="text-3xl shrink-0 p-1.5 rounded-lg bg-black/20 border border-white/5 select-none">
                  {isUnlocked ? config.iconSymbol : <Lock className="w-6 h-6 text-white/20" />}
                </div>
              </div>

              {/* Description */}
              <div className="text-xs text-white/60 leading-relaxed font-light mt-1 flex-1">
                {isUnlocked ? config.declaration : '本结局尚未解锁，继续在后续周目中进行抉择以开启。'}
              </div>

              {/* NG+ Bonus description */}
              {config.isVictory && (
                <div className={`mt-2 p-2.5 rounded-lg border text-[10px] font-mono leading-relaxed flex gap-2 items-start ${
                  isUnlocked 
                    ? 'border-yellow-500/20 bg-yellow-500/5 text-yellow-300/95' 
                    : 'border-white/5 bg-black/20 text-white/30'
                }`}>
                  {isUnlocked ? (
                    <Award className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold">{isUnlocked ? '✦ 已激活加成：' : '🔒 待解锁加成：'}{bonus?.name || '新周目加成'}</span>
                    <p className="mt-0.5 text-white/50">{bonus?.desc || '通关该结局以获取独特属性。'}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
