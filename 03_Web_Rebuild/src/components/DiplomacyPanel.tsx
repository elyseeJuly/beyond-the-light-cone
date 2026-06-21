import React, { useState, useEffect } from 'react';
import { GameInstance } from '../core/Game';
import { 
  Users, 
  MessageSquare, 
  ArrowLeftRight, 
  Flame, 
  Handshake, 
  ShieldAlert,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { FriendshipType } from '../types/enums';
import { t } from '../utils/i18n';

export const DiplomacyPanel: React.FC = () => {
  const [aliens, setAliens] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [selectedAlien, setSelectedAlien] = useState<string>('');

  const loadDiplomacyState = () => {
    const game = GameInstance.get();
    if (game && game.alienCiviManager && game.alienCiviManager.aliens) {
      const list = Array.from(game.alienCiviManager.aliens.entries()).map(([name, data]) => ({
        name,
        friendship: data.friendshipType,
        cooldown: data.diplomacyCooldown || 0,
        isBund: data.isBund || false,
        isDead: data.isDieOut(),
        unlocked: (data as any).unlocked || false
      }));
      setAliens(list);
      if (list.length > 0 && !selectedAlien) {
        setSelectedAlien(list[0].name);
      }
    }
  };

  useEffect(() => {
    loadDiplomacyState();
    window.addEventListener('game-turn-complete', loadDiplomacyState);
    window.addEventListener('game-loaded', loadDiplomacyState);
    return () => {
      window.removeEventListener('game-turn-complete', loadDiplomacyState);
      window.removeEventListener('game-loaded', loadDiplomacyState);
    };
  }, [selectedAlien]);

  const handleAction = (alienName: string, action: string) => {
    const game = GameInstance.get();
    if (!game) return;

    const result = game.conductDiplomacy(alienName, action);
    setFeedback(result);
    loadDiplomacyState();
    
    // Dispatch game state update event
    window.dispatchEvent(new CustomEvent('game-state-updated'));
  };

  const getFriendshipLabel = (type: number) => {
    switch (type) {
      case FriendshipType.VERYFRIEND: return { text: "极度友好 (战略同盟)", color: "text-emerald-400 border-emerald-500/30 bg-emerald-950/20" };
      case FriendshipType.FRIEND: return { text: "比较友好", color: "text-green-400 border-green-500/20 bg-green-950/10" };
      case FriendshipType.NORMAL: return { text: "中立温和", color: "text-slate-400 border-slate-700 bg-slate-800/20" };
      case FriendshipType.ANGRY: return { text: "警惕敌视", color: "text-amber-400 border-amber-500/20 bg-amber-950/10" };
      case FriendshipType.VERYANGRY: return { text: "极度敌对 (全面交战)", color: "text-red-400 border-red-500/30 bg-red-950/20" };
      default: return { text: "未知状态", color: "text-slate-500 border-slate-800" };
    }
  };

  const activeAlienData = aliens.find(a => a.name === selectedAlien);

  return (
    <div className="w-full bg-slate-900/40 border border-cyan-500/15 rounded p-4 flex flex-col gap-4 font-mono select-none relative shadow-[inset_0_0_15px_rgba(6,182,212,0.03)]">
      
      {/* Sci-fi Title bar */}
      <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-400 font-bold text-xs uppercase tracking-wider">
            PDC 黑暗森林外交联络中心
          </span>
        </div>
        <button 
          onClick={loadDiplomacyState} 
          className="text-cyan-500/70 hover:text-cyan-400 cursor-pointer p-1 rounded transition-all hover:bg-cyan-950/40"
          title="刷新数据"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Civilization list selector */}
        <div className="md:col-span-1 border-r border-cyan-500/10 pr-2 space-y-2.5 max-h-72 overflow-y-auto">
          {aliens.filter(a => a.unlocked).map((alien) => {
            return (
              <button
                key={alien.name}
                disabled={alien.isDead}
                onClick={() => {
                  setSelectedAlien(alien.name);
                  setFeedback('');
                }}
                className={`w-full text-left p-2.5 rounded border transition-all flex flex-col gap-1.5 ${
                  alien.isDead ? 'border-slate-800 bg-slate-950/20 opacity-30 cursor-not-allowed' :
                  selectedAlien === alien.name 
                    ? 'border-cyan-500/50 bg-cyan-950/20 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.15)] cursor-pointer' 
                    : 'border-cyan-500/10 bg-slate-950/30 text-slate-400 hover:border-cyan-500/30 hover:bg-slate-900/40 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs">
                    {alien.name}
                  </span>
                  {alien.isBund && <Handshake className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </div>
                <div className={`text-[10px] px-1.5 py-0.5 rounded border inline-block max-w-max font-bold ${
                  getFriendshipLabel(alien.friendship).color
                }`}>
                  {alien.isDead ? "文明已灭绝" : getFriendshipLabel(alien.friendship).text}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Civilzation Action details */}
        <div className="md:col-span-2 flex flex-col justify-between gap-4 h-full min-h-[16rem]">
          {activeAlienData ? (
            <div className="flex-1 flex flex-col gap-3.5">
              <div className="bg-slate-950/60 border border-cyan-500/10 p-3 rounded flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">CIVILIZATION TELEMETRY</span>
                <span className="text-cyan-200 text-sm font-bold">{activeAlienData.name}</span>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span>当前状态:</span>
                  <span className="font-bold text-slate-200">{getFriendshipLabel(activeAlienData.friendship).text}</span>
                </div>
                 {activeAlienData.cooldown > 0 && (
                  <div className="mt-2 space-y-1.5 bg-amber-500/5 p-2 rounded border border-amber-500/10">
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-500 font-bold uppercase">
                      <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                      {t('cooldown') || '外交冷却中'}: {t('wait_turns', { turns: activeAlienData.cooldown }) || `需等待 ${activeAlienData.cooldown} 回合`}
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                        style={{ width: `${(activeAlienData.cooldown / 3) * 100}%` }} 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  disabled={activeAlienData.cooldown > 0}
                  onClick={() => handleAction(activeAlienData.name, 'negotiate')}
                  className="p-2.5 bg-cyan-950/20 hover:bg-cyan-900/30 text-cyan-300 border border-cyan-500/20 hover:border-cyan-500/40 rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  战略外交谈判
                </button>
                
                <button
                  disabled={activeAlienData.cooldown > 0}
                  onClick={() => handleAction(activeAlienData.name, 'trade')}
                  className="p-2.5 bg-cyan-950/20 hover:bg-cyan-900/30 text-cyan-300 border border-cyan-500/20 hover:border-cyan-500/40 rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowLeftRight className="w-4 h-4 shrink-0" />
                  黑暗森林贸易 (-30金)
                </button>

                <button
                  disabled={activeAlienData.cooldown > 0}
                  onClick={() => handleAction(activeAlienData.name, 'provoke')}
                  className="p-2.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Flame className="w-4 h-4 shrink-0 animate-pulse" />
                  广播坐标威慑
                </button>

                <button
                  disabled={activeAlienData.cooldown > 0 || activeAlienData.isBund}
                  onClick={() => handleAction(activeAlienData.name, 'alliance')}
                  className="p-2.5 bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Handshake className="w-4 h-4 shrink-0" />
                  请求和平结盟
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs italic">
              请选择一个有效的异星文明进行分析...
            </div>
          )}

          {/* Feedback Output Console */}
          {feedback && (
            <div className="bg-slate-950 border border-cyan-500/10 p-2.5 rounded text-[11px] leading-relaxed text-cyan-400 flex items-start gap-2 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] animate-fade-in">
              <ChevronRight className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
              <div>{feedback}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
