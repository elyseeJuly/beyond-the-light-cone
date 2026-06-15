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
import { motion } from 'framer-motion';

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

  const lastRound = displayedRounds[displayedRounds.length - 1];
  const isAttackerHit = lastRound && lastRound.defDamage > 0;
  const isDefenderHit = lastRound && lastRound.atkDamage > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      {/* 2-second hologram scan line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        <div className="absolute inset-x-0 h-[2px] bg-[var(--color-primary)]/10 opacity-30 shadow-[0_0_15px_var(--color-primary)] animate-[hologram-sweep_2s_linear_infinite]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-4xl h-[560px] bg-[#070B14] border border-[#243245] shadow-[0_0_50px_rgba(0,184,255,0.15)] flex flex-col rounded overflow-hidden select-none"
      >
        {/* Glow corner decorations */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-[var(--color-primary)]/50 pointer-events-none" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-[var(--color-primary)]/50 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-[var(--color-primary)]/50 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-[var(--color-primary)]/50 pointer-events-none" />

        {/* Header Row */}
        <div className="bg-[#070B14] border-b border-[#243245]/40 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Swords className="text-[var(--color-primary)] w-4 h-4" />
            <span className="text-[var(--color-primary)] font-title font-bold tracking-widest text-xs uppercase">
              PDC 战术演练系统 · 星际遭遇战档案
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-[var(--text-secondary)] hover:text-white p-1 rounded transition-colors cursor-pointer hover:bg-white/5"
              title={soundEnabled ? "静音" : "开启声音"}
            >
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
            <button 
              onClick={onClose}
              className="text-[var(--text-secondary)] hover:text-white p-1 rounded transition-colors cursor-pointer hover:bg-white/5"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col gap-4 p-6 overflow-hidden">
          
          {/* Battle Location banner */}
          <div className="text-center bg-[#070B14]/40 border border-[#243245]/30 p-2.5 rounded font-mono shrink-0">
            <span className="text-[var(--text-secondary)]/50 text-[9px] tracking-widest block uppercase">BATTLEZONE COORD</span>
            <span className="text-white text-sm font-bold tracking-wider">星系 [{planetName}] 边缘空间对决</span>
          </div>

          {/* Dueling Parties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0 font-mono text-xs">
            {/* Attacker Panel */}
            <motion.div 
              key={`atk_${displayedRounds.length}`}
              animate={isAttackerHit ? {
                x: [0, -4, 4, -3, 3, -2, 2, 0],
                borderColor: ["#243245", "#FF5252", "#243245"],
                backgroundColor: ["rgba(7, 11, 20, 0.4)", "rgba(255, 82, 82, 0.1)", "rgba(7, 11, 20, 0.4)"]
              } : {}}
              transition={{ duration: 0.4 }}
              className="bg-[#070B14]/40 border border-[#243245]/30 p-3.5 rounded flex flex-col gap-1.5 relative overflow-hidden"
            >
              <div className="text-[#FF5252] text-[9px] tracking-wider uppercase font-bold">ATTACK FORCES / 攻方</div>
              <div className="text-white text-sm font-bold truncate">{attackerName}</div>
              <div className="flex justify-between items-center mt-1 border-t border-[#243245]/20 pt-1.5">
                <span className="text-[var(--text-secondary)]/60">初始威慑强度:</span>
                <span className="text-[#FF5252] font-bold">{attackerPower}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]/60">实时剩余结构:</span>
                <span className="text-slate-200 font-bold">
                  {Math.max(0, currentRoundIdx === rounds.length ? attackerRemainingHp : Math.max(1, attackerPower - (currentRoundIdx * (attackerPower / (rounds.length + 1)))))}
                </span>
              </div>
            </motion.div>

            {/* Defender Panel */}
            <motion.div 
              key={`def_${displayedRounds.length}`}
              animate={isDefenderHit ? {
                x: [0, -4, 4, -3, 3, -2, 2, 0],
                borderColor: ["#243245", "[var(--color-primary)]", "#243245"],
                backgroundColor: ["rgba(7, 11, 20, 0.4)", "rgba(0, 184, 255, 0.1)", "rgba(7, 11, 20, 0.4)"]
              } : {}}
              transition={{ duration: 0.4 }}
              className="bg-[#070B14]/40 border border-[#243245]/30 p-3.5 rounded flex flex-col gap-1.5 relative overflow-hidden"
            >
              <div className="text-[var(--color-primary)] text-[9px] tracking-wider uppercase font-bold">DEFEND FORCES / 守方</div>
              <div className="text-white text-sm font-bold truncate">{defenderName}</div>
              <div className="flex justify-between items-center mt-1 border-t border-[#243245]/20 pt-1.5">
                <span className="text-[var(--text-secondary)]/60">初始工事强度:</span>
                <span className="text-[var(--color-primary)] font-bold">{defenderPower}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]/60">实时剩余结构:</span>
                <span className="text-slate-200 font-bold">
                  {Math.max(0, currentRoundIdx === rounds.length ? defenderRemainingHp : Math.max(1, defenderPower - (currentRoundIdx * (defenderPower / (rounds.length + 1)))))}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Dueling Visual Logs */}
          <div className="flex-1 bg-[#070B14]/60 border border-[#243245]/30 rounded p-4 overflow-y-auto space-y-2.5 font-mono scrollbar-thin scrollbar-thumb-[var(--color-primary)]/20 scrollbar-track-transparent">
            {displayedRounds.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)]/40 text-[11px] italic gap-2 py-8 text-center">
                <Swords className="w-8 h-8 text-[var(--color-primary)]/20 animate-pulse" />
                <span>全息微观战术交锋已就位，请开始解密战斗序列。</span>
              </div>
            ) : (
              displayedRounds.map((rnd, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                  className="bg-[#070B14]/40 border border-[#243245]/20 p-2.5 rounded hover:bg-white/5 transition-colors flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between text-[9px] text-[var(--color-primary)]/60 border-b border-[#243245]/20 pb-1">
                    <span className="font-bold">ENGAGEMENT PHASE {rnd.round}</span>
                    <span className="flex items-center gap-1.5 font-bold uppercase">
                      {getWeaponIcon(rnd.attackerType)} {rnd.attackerType} vs {rnd.defenderType}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-200 leading-relaxed pl-1.5 border-l border-[var(--color-primary)]/40">
                    {rnd.log}
                  </div>
                  {rnd.atkDamage > 0 || rnd.defDamage > 0 ? (
                    <div className="flex gap-4 text-[9px] text-slate-500 pl-1.5 font-bold">
                      {rnd.atkDamage > 0 && <span className="text-red-400">攻方输出: -{rnd.atkDamage}HP</span>}
                      {rnd.defDamage > 0 && <span className="text-cyan-400">守方输出: -{rnd.defDamage}HP</span>}
                    </div>
                  ) : null}
                </motion.div>
              ))
            )}
            
            {/* Show final battle result card */}
            {(battleFinished || currentRoundIdx >= rounds.length) && rounds.length > 0 && (
              <div className="bg-[#070B14] border border-[#243245]/50 p-4 rounded flex flex-col gap-2 items-center text-center animate-scale-in">
                <div className="w-9 h-9 rounded-full bg-[#070B14] border border-[var(--color-primary)] flex items-center justify-center text-[var(--color-primary)] shadow-[0_0_12px_rgba(0,184,255,0.3)]">
                  {winner.includes(attackerName) ? <Flame className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                </div>
                <div className="text-[var(--color-primary)] text-xs font-bold tracking-widest uppercase mt-1">【最终战报结算】</div>
                <div className="text-[11px] text-slate-300 font-sans px-4 max-w-lg leading-relaxed mt-1">
                  {outcomeLog}
                </div>
                <div className="flex items-center gap-2 text-[9px] text-[var(--color-primary)]/70 uppercase tracking-widest mt-2 font-mono">
                  <Sparkles className="w-3 h-3" />
                  WINNER: {winner}
                </div>
              </div>
            )}
          </div>

          {/* Interactive controls */}
          <div className="flex items-center justify-between border-t border-[#243245]/20 pt-4 shrink-0 font-mono">
            <span className="text-[9px] text-[var(--text-secondary)]/50 uppercase tracking-widest">
              SEQS: {currentRoundIdx} / {rounds.length}
            </span>
            <div className="flex items-center gap-3">
              {currentRoundIdx < rounds.length ? (
                <>
                  <button
                    onClick={handleSkipAll}
                    className="px-3.5 py-1.5 bg-[#070B14] hover:bg-white/5 text-[var(--text-secondary)] rounded text-xs cursor-pointer border border-[#243245] transition-colors"
                  >
                    跳过动画
                  </button>
                  <button
                    onClick={handleNextRound}
                    className="px-4 py-1.5 bg-[rgba(var(--color-primary-rgb),0.1)] hover:bg-[rgba(var(--color-primary-rgb),0.2)] text-[var(--color-primary)] font-bold rounded text-xs cursor-pointer border border-[var(--color-primary)]/40 shadow-[0_0_10px_rgba(0,184,255,0.15)] transition-colors flex items-center gap-1.5"
                  >
                    <Swords className="w-3.5 h-3.5 animate-pulse" />
                    下一轮交锋
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className="px-5 py-1.5 bg-[var(--color-primary)] hover:brightness-110 text-black font-extrabold rounded text-xs cursor-pointer shadow-[0_0_12px_rgba(0,184,255,0.4)] transition-all"
                >
                  关闭终端
                </button>
              )}
            </div>
          </div>
          
        </div>
      </motion.div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(0, 184, 255, 0.15);
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 184, 255, 0.3);
        }
      `}</style>
    </div>
  );
};
