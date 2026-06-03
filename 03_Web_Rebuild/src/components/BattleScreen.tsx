import React, { useState, useEffect } from 'react';
import { GameInstance } from '../core/Game';
import { 
  Shield, 
  Swords, 
  Flame, 
  Cpu, 
  Bomb, 
  Compass, 
  Sparkles, 
  X,
  Volume2,
  VolumeX
} from 'lucide-react';

export const BattleScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [battleReport, setBattleReport] = useState<any>(null);
  const [currentRoundIdx, setCurrentRoundIdx] = useState<number>(0);
  const [displayedRounds, setDisplayedRounds] = useState<any[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [battleFinished, setBattleFinished] = useState<boolean>(false);

  useEffect(() => {
    const game = GameInstance.get();
    if (game && (game as any).lastBattleReport) {
      setBattleReport((game as any).lastBattleReport);
      setCurrentRoundIdx(0);
      setDisplayedRounds([]);
      setBattleFinished(false);
    }
  }, []);

  if (!battleReport) {
    return null;
  }

  const {
    attackerName,
    defenderName,
    planetName,
    attackerPower,
    defenderPower,
    rounds = [],
    winner,
    outcomeLog,
    attackerRemainingHp = 0,
    defenderRemainingHp = 0
  } = battleReport;

  const handleNextRound = () => {
    if (currentRoundIdx < rounds.length) {
      const nextRound = rounds[currentRoundIdx];
      setDisplayedRounds([...displayedRounds, nextRound]);
      setCurrentRoundIdx(currentRoundIdx + 1);
      
      // Play a synthetic pulse beep for combat rounds
      if (soundEnabled && typeof window !== 'undefined') {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          if (nextRound.log.includes('SUPERBOMB') || nextRound.log.includes('二向箔')) {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(80, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.6);
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.6);
          } else {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
          }
        } catch (err) {
          // Fallback if audio context is blocked
        }
      }
    } else {
      setBattleFinished(true);
    }
  };

  const handleSkipAll = () => {
    setDisplayedRounds(rounds);
    setCurrentRoundIdx(rounds.length);
    setBattleFinished(true);
  };

  const getWeaponIcon = (type: string) => {
    switch (type) {
      case 'SUPERBOMB':
        return <Bomb className="w-4 h-4 text-red-500 shrink-0" />;
      case 'SPY':
        return <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />;
      case 'EXPENDABLE':
        return <Flame className="w-4 h-4 text-amber-500 shrink-0" />;
      default:
        return <Compass className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 overflow-y-auto">
      {/* Retro sci-fi background scanline */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] opacity-25"></div>

      <div className="w-full max-w-4xl bg-slate-900 border border-cyan-500/30 rounded-lg shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col overflow-hidden relative select-none">
        
        {/* Header Row */}
        <div className="bg-slate-950 border-b border-cyan-500/20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-4 bg-cyan-400 rounded-sm shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse"></div>
            <span className="text-cyan-400 font-mono font-bold tracking-widest text-sm uppercase">
              PDC 全息战术演练系统 · 星际遭遇战
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-cyan-500/70 hover:text-cyan-400 p-1.5 rounded transition-all hover:bg-cyan-950/40"
              title={soundEnabled ? "静音" : "开启声音"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button 
              onClick={onClose}
              className="text-slate-500 hover:text-red-400 p-1.5 rounded transition-all hover:bg-slate-800"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-6 max-h-[80vh] overflow-y-auto">
          
          {/* Battle Location banner */}
          <div className="text-center bg-cyan-950/20 border border-cyan-500/10 p-3 rounded font-mono">
            <span className="text-cyan-500/60 text-[10px] tracking-widest block uppercase">BATTLEZONE COORD</span>
            <span className="text-cyan-200 text-lg font-bold">星系 [{planetName}] 边缘空间对决</span>
          </div>

          {/* Dueling Parties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Attacker Panel */}
            <div className="bg-slate-950/60 border border-red-500/20 p-4 rounded flex flex-col gap-2 shadow-[inset_0_0_15px_rgba(239,68,68,0.05)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rotate-45 transform translate-x-12 -translate-y-12"></div>
              <div className="text-red-400 font-mono text-[10px] tracking-wider uppercase font-bold">ATTACK FORCES / 攻方</div>
              <div className="text-slate-100 text-lg font-bold truncate">{attackerName}</div>
              <div className="flex justify-between items-center mt-2 border-t border-red-500/10 pt-2 font-mono">
                <span className="text-slate-500 text-xs">初始威慑强度:</span>
                <span className="text-red-400 text-sm font-bold">{attackerPower}</span>
              </div>
              <div className="flex justify-between items-center font-mono">
                <span className="text-slate-500 text-xs">实时剩余结构:</span>
                <span className="text-slate-200 text-sm font-bold">
                  {Math.max(0, currentRoundIdx === rounds.length ? attackerRemainingHp : Math.max(1, attackerPower - (currentRoundIdx * (attackerPower / (rounds.length + 1)))))}
                </span>
              </div>
            </div>

            {/* Defender Panel */}
            <div className="bg-slate-950/60 border border-cyan-500/20 p-4 rounded flex flex-col gap-2 shadow-[inset_0_0_15px_rgba(6,182,212,0.05)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rotate-45 transform translate-x-12 -translate-y-12"></div>
              <div className="text-cyan-400 font-mono text-[10px] tracking-wider uppercase font-bold">DEFEND FORCES / 守方</div>
              <div className="text-slate-100 text-lg font-bold truncate">{defenderName}</div>
              <div className="flex justify-between items-center mt-2 border-t border-cyan-500/10 pt-2 font-mono">
                <span className="text-slate-500 text-xs">初始工事强度:</span>
                <span className="text-cyan-400 text-sm font-bold">{defenderPower}</span>
              </div>
              <div className="flex justify-between items-center font-mono">
                <span className="text-slate-500 text-xs">实时剩余结构:</span>
                <span className="text-slate-200 text-sm font-bold">
                  {Math.max(0, currentRoundIdx === rounds.length ? defenderRemainingHp : Math.max(1, defenderPower - (currentRoundIdx * (defenderPower / (rounds.length + 1)))))}
                </span>
              </div>
            </div>
          </div>

          {/* Dueling Visual Logs */}
          <div className="flex-1 bg-slate-950 border border-cyan-500/15 rounded p-4 h-64 overflow-y-auto space-y-2.5 font-mono scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
            {displayedRounds.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs italic gap-2 py-8">
                <Swords className="w-8 h-8 text-cyan-500/30 animate-bounce" />
                <span>全息微观战术交锋已就位，请点击【下一轮交锋】或【跳过动画】开始解密战斗序列。</span>
              </div>
            ) : (
              displayedRounds.map((rnd, idx) => (
                <div 
                  key={idx}
                  className="bg-cyan-950/10 border border-cyan-500/5 p-3 rounded hover:bg-cyan-950/20 transition-all duration-200 flex flex-col gap-1.5 animate-fade-in"
                >
                  <div className="flex items-center justify-between text-[10px] text-cyan-500/60 border-b border-cyan-500/5 pb-1">
                    <span className="font-bold">ENGAGEMENT PHASE {rnd.round}</span>
                    <span className="flex items-center gap-1.5 font-bold uppercase">
                      {getWeaponIcon(rnd.attackerType)} {rnd.attackerType} vs {rnd.defenderType}
                    </span>
                  </div>
                  <div className="text-xs text-slate-200 leading-relaxed pl-1.5 border-l-2 border-cyan-500/30">
                    {rnd.log}
                  </div>
                  {rnd.atkDamage > 0 || rnd.defDamage > 0 ? (
                    <div className="flex gap-4 text-[10px] text-slate-500 pl-1.5">
                      {rnd.atkDamage > 0 && <span className="text-red-400/90 font-bold">攻方输出: -{rnd.atkDamage}HP</span>}
                      {rnd.defDamage > 0 && <span className="text-cyan-400/90 font-bold">守方输出: -{rnd.defDamage}HP</span>}
                    </div>
                  ) : null}
                </div>
              ))
            )}
            
            {/* Show final battle result card */}
            {(battleFinished || currentRoundIdx >= rounds.length) && rounds.length > 0 && (
              <div className="bg-cyan-950/20 border border-cyan-500/35 p-4 rounded flex flex-col gap-2 items-center text-center animate-scale-in">
                <div className="w-9 h-9 rounded-full bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.5)]">
                  {winner.includes(attackerName) ? <Flame className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                </div>
                <div className="text-cyan-300 text-sm font-bold tracking-widest uppercase mt-1">【最终战报结算】</div>
                <div className="text-xs text-slate-200 font-sans px-4 max-w-lg leading-relaxed mt-1">
                  {outcomeLog}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-cyan-400/70 uppercase tracking-widest mt-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  WINNER: {winner}
                </div>
              </div>
            )}
          </div>

          {/* Interactive controls */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4 shrink-0">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              STEP: {currentRoundIdx} / {rounds.length} SEQS
            </span>
            <div className="flex items-center gap-3">
              {currentRoundIdx < rounds.length ? (
                <>
                  <button
                    onClick={handleSkipAll}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-xs cursor-pointer border border-slate-700 transition-all active:scale-95"
                  >
                    跳过动画
                  </button>
                  <button
                    onClick={handleNextRound}
                    className="px-5 py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 font-bold rounded font-mono text-xs cursor-pointer border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)] transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Swords className="w-3.5 h-3.5 animate-pulse" />
                    下一轮交锋
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded font-mono text-xs cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all active:scale-95"
                >
                  关闭终端
                </button>
              )}
            </div>
          </div>
          
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.15);
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.3);
        }
      `}</style>
    </div>
  );
};
