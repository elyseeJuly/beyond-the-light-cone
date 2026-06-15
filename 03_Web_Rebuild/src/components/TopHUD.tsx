import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Users, TrendingUp, Landmark, Shield, AlertTriangle, Settings, Save, SkipForward, Gem, Skull, HelpCircle, Contrast } from 'lucide-react';
import { GameInstance } from '../core/Game';
import { systemMenuPanel } from '../ui/SystemMenuPanel';
import { t, setLanguage, getLanguage } from '../utils/i18n';
import { useFloatingText, FloatingLayer } from './FloatingText';
import { BgmPlayer } from './BgmPlayer';

interface ResourceItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  colorClass?: string;
  delta?: number;
  floaters: any[];
}

const ResourceItem: React.FC<ResourceItemProps> = ({ icon, label, value, colorClass = "", delta = 0, floaters }) => {
  const isHighLoss = delta < -value * 0.2 && value > 0;
  
  return (
    <div className={`relative flex flex-col items-center justify-center px-4 border-r border-white/5 last:border-r-0 transition-colors duration-500 ${isHighLoss ? 'bg-red-500/10 animate-pulse border-red-500/50' : ''}`}>
      <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] uppercase font-bold tracking-tight">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`text-xl font-data font-bold ${colorClass}`}>
        {value}
      </div>
      <FloatingLayer floaters={floaters} />
    </div>
  );
};

export const TopHUD: React.FC = () => {
  const [updateCount, setUpdateCount] = useState(0);
  const prevStatsRef = useRef<any>(null);
  
  const [lang, setLangState] = useState(getLanguage());
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('high-contrast') === 'true');

  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    localStorage.setItem('high-contrast', String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    const handleLangChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setLangState(detail);
      setUpdateCount(n => n + 1);
    };
    const handleContrastChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setHighContrast(detail);
    };
    window.addEventListener('game-language-changed', handleLangChange);
    window.addEventListener('high-contrast-changed', handleContrastChange);
    return () => {
      window.removeEventListener('game-language-changed', handleLangChange);
      window.removeEventListener('high-contrast-changed', handleContrastChange);
    };
  }, []);
  
  const { addFloater: addPopFloater, floaters: popFloaters } = useFloatingText();
  const { addFloater: addEcoFloater, floaters: ecoFloaters } = useFloatingText();
  const { addFloater: addCulFloater, floaters: culFloaters } = useFloatingText();
  const { addFloater: addArmyFloater, floaters: armyFloaters } = useFloatingText();
  const { addFloater: addResFloater, floaters: resFloaters } = useFloatingText();
  const { addFloater: addTreacheryFloater, floaters: treacheryFloaters } = useFloatingText();
  const { addFloater: addDetFloater, floaters: detFloaters } = useFloatingText();

  const stats = useMemo(() => {
    const game = GameInstance.get();
    const earth = game.earthCivi;
    const epochNames = ["危机纪元", "威慑纪元", "广播纪元", "掩体纪元", "银河纪元", "星屑纪元"];
    return {
      year: game.year,
      epoch: game.epoch,
      epochName: epochNames[game.epoch] || "未知纪元",
      pop: earth.population,
      eco: Math.floor(earth.economy),
      cul: Math.floor(earth.culture),
      army: earth.army,
      res: earth.resource,
      treachery: earth.treachery,
      deterrence: Math.floor(earth.deterrenceValue),
      isGameOver: game.victoryType !== null || game.defeatType !== null
    };
  }, [updateCount]);

  useEffect(() => {
    const prev = prevStatsRef.current;
    if (prev) {
      if (stats.pop !== prev.pop) addPopFloater(stats.pop - prev.pop);
      if (stats.eco !== prev.eco) addEcoFloater(stats.eco - prev.eco);
      if (stats.cul !== prev.cul) addCulFloater(stats.cul - prev.cul);
      if (stats.army !== prev.army) addArmyFloater(stats.army - prev.army);
      if (stats.res !== prev.res) addResFloater(stats.res - prev.res);
      if (stats.treachery !== prev.treachery) addTreacheryFloater(stats.treachery - prev.treachery);
      if (stats.deterrence !== prev.deterrence) addDetFloater(stats.deterrence - prev.deterrence);
    }
    prevStatsRef.current = stats;
  }, [stats.year, stats.pop, stats.eco, stats.cul, stats.army, stats.res, stats.treachery, stats.deterrence, addPopFloater, addEcoFloater, addCulFloater, addArmyFloater, addResFloater, addTreacheryFloater, addDetFloater]);

  const handleNextTurn = () => {
    GameInstance.get().runARound();
    setUpdateCount(n => n + 1);
    window.dispatchEvent(new CustomEvent('game-turn-complete'));
  };

  const handleSave = () => {
    GameInstance.saveGame();
    alert(t("saving_success") || "游戏存档成功！");
  };

  const handleSettings = () => {
    systemMenuPanel.open();
  };

  // Listen for external game state changes (load, etc.)
  useEffect(() => {
    const refresh = () => setUpdateCount(n => n + 1);
    window.addEventListener('game-loaded', refresh);
    window.addEventListener('game-over', refresh);
    window.addEventListener('game-turn-complete', refresh);
    return () => {
      window.removeEventListener('game-loaded', refresh);
      window.removeEventListener('game-over', refresh);
      window.removeEventListener('game-turn-complete', refresh);
    };
  }, []);

  const getDelta = (key: string) => {
    if (!prevStatsRef.current) return 0;
    return (stats as any)[key] - (prevStatsRef.current as any)[key];
  };

  const handleSyncState = () => {
    const game = GameInstance.get();
    game.isProcessing = false;
    game.currentEvent = null;
    // @ts-ignore
    game.eventQueue = [];
    game.addHistory("【系统自愈】已强制同步逻辑状态，解除所有交互锁定。");
    setUpdateCount(n => n + 1);
    window.dispatchEvent(new CustomEvent('game-turn-complete'));
  };

  return (
    <header className="h-16 w-full glass-panel flex items-center justify-between px-6 z-50">
      {/* Left: Era Display */}
      <div 
        className="flex items-center gap-4 cursor-pointer group relative"
        onClick={handleSyncState}
        title="点击强制同步状态"
      >
        <div className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] group-hover:text-[var(--color-primary)] transition-colors">
          Current Era
        </div>
        <div className="text-2xl font-bold tracking-tighter text-[var(--color-primary)] group-hover:scale-105 transition-transform">
          {stats.epochName} <span className="text-sm ml-1 opacity-70">YEAR {stats.year}</span>
        </div>
        <div className="absolute top-full left-0 mt-1 p-2 bg-black/80 backdrop-blur-md rounded border border-white/10 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          如遇死锁请点击同步状态
        </div>
      </div>

      {/* Center: Core Resources */}
      <div className="flex h-full">
        <ResourceItem 
          icon={<Users size={14} />} 
          label="人口" 
          value={stats.pop} 
          delta={getDelta('pop')}
          floaters={popFloaters} 
        />
        <ResourceItem 
          icon={<TrendingUp size={14} />} 
          label="经济" 
          value={stats.eco} 
          delta={getDelta('eco')}
          floaters={ecoFloaters} 
        />
        <ResourceItem 
          icon={<Landmark size={14} />} 
          label="文化" 
          value={stats.cul} 
          delta={getDelta('cul')}
          floaters={culFloaters} 
        />
        <ResourceItem 
          icon={<Shield size={14} />} 
          label="军力" 
          value={stats.army} 
          delta={getDelta('army')}
          floaters={armyFloaters} 
        />
        <ResourceItem 
          icon={<Gem size={14} />} 
          label="资源" 
          value={stats.res} 
          delta={getDelta('res')}
          floaters={resFloaters} 
        />
        <ResourceItem 
          icon={<Skull size={14} />} 
          label="逃亡" 
          value={stats.treachery} 
          delta={getDelta('treachery')}
          colorClass={stats.treachery > 80 ? "text-[var(--color-danger)]" : ""}
          floaters={treacheryFloaters}
        />
        <ResourceItem 
          icon={<AlertTriangle size={14} />} 
          label="威慑度" 
          value={stats.deterrence} 
          delta={getDelta('deterrence')}
          colorClass="text-[var(--color-danger)]" 
          floaters={detFloaters}
        />
      </div>

      {/* Right: System Operations */}
      <div className="flex items-center gap-3">
        <BgmPlayer isGameOver={stats.isGameOver} epoch={stats.epoch} />
        
        <button onClick={() => setHighContrast(v => !v)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-[var(--text-secondary)] cursor-pointer" title={t('high_contrast') || "高对比度模式"}>
          <Contrast size={20} />
        </button>
        <button 
          onClick={() => setLanguage(lang === 'zh' ? 'en' : 'zh')} 
          className="px-2.5 py-1 hover:bg-black/5 dark:hover:bg-white/5 rounded border border-white/10 text-xs font-bold font-mono text-[var(--text-secondary)] cursor-pointer" 
          title="切换语言 / Switch Language"
        >
          {lang === 'zh' ? 'EN' : '中文'}
        </button>

        <button onClick={() => window.dispatchEvent(new CustomEvent('open-tutorial'))} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-[var(--text-secondary)] cursor-pointer" title={t('help') || "帮助教程"}>
          <HelpCircle size={20} />
        </button>
        <button onClick={handleSave} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-[var(--text-secondary)] cursor-pointer" title={t('save_game') || "保存存档"}>
          <Save size={20} />
        </button>
        <button onClick={handleSettings} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-[var(--text-secondary)] cursor-pointer" title={t('settings') || "系统设置"}>
          <Settings size={20} />
        </button>
        <button 
          onClick={handleNextTurn} 
          disabled={GameInstance.get().currentEvent !== null || GameInstance.get().eventQueue.length > 0}
          className={`btn-next-turn flex items-center gap-2 ${(GameInstance.get().currentEvent !== null || GameInstance.get().eventQueue.length > 0) ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
        >
          <span>{(GameInstance.get().currentEvent !== null || GameInstance.get().eventQueue.length > 0) ? (t('processing') || "处理中...") : (t('next_turn') || "下一回合")}</span>
          <SkipForward size={18} />
        </button>
      </div>
    </header>
  );
};

