import React, { useState, useEffect, useMemo } from 'react';
import { GameInstance } from '../core/Game';
import { Terminal, Shield, RefreshCw, Cpu, Globe } from 'lucide-react';

export const BottomEventBar: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const updateMessages = () => {
    const game = GameInstance.get();
    if (game && game.tickerMessages) {
      setMessages([...game.tickerMessages]);
    }
  };

  useEffect(() => {
    updateMessages();
    window.addEventListener('ticker-message-added', updateMessages);
    window.addEventListener('game-turn-complete', updateMessages);
    window.addEventListener('game-loaded', updateMessages);

    return () => {
      window.removeEventListener('ticker-message-added', updateMessages);
      window.removeEventListener('game-turn-complete', updateMessages);
      window.removeEventListener('game-loaded', updateMessages);
    };
  }, []);

  // Automatically rotate messages every 4 seconds
  useEffect(() => {
    if (messages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [messages]);

  // Reset current index when new turn adds messages
  useEffect(() => {
    if (messages.length > 0) {
      setCurrentIndex(messages.length - 1); // Focus on the latest
    }
  }, [messages.length]);

  const activeMessage = useMemo(() => {
    if (messages.length === 0) return "银河深空遥测监测中... 文明档案数据链正常。";
    return messages[currentIndex] || messages[messages.length - 1];
  }, [messages, currentIndex]);

  const getIcon = (text: string) => {
    if (text.includes('👥') || text.includes('人员') || text.includes('人口') || text.includes('人物')) {
      return <Terminal className="w-4 h-4 text-[var(--color-primary)] shrink-0" />;
    }
    if (text.includes('警报') || text.includes('威胁') || text.includes('三体') || text.includes('危机')) {
      return <Shield className="w-4 h-4 text-red-500 shrink-0 animate-pulse" />;
    }
    if (text.includes('外交') || text.includes('联络') || text.includes('友好')) {
      return <Globe className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (text.includes('科技') || text.includes('研发') || text.includes('物理') || text.includes('推进器')) {
      return <Cpu className="w-4 h-4 text-blue-400 shrink-0" />;
    }
    return <Terminal className="w-4 h-4 text-amber-400 shrink-0" />;
  };

  const cleanMessage = (text: string) => {
    const icons = ['👥', '📢', '🚀', '⚠️', '◇', '⚔', '⬢', '◎', '▤'];
    return icons.reduce((t, icon) => t.split(icon).join(''), text).trim();
  };

  return (
    <div className="h-10 w-full bg-[#070B14]/90 border-t border-[#243245] flex items-center justify-between px-6 z-40 select-none overflow-hidden relative">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(0,184,255,0.03)_0%,_transparent_100%)] pointer-events-none" />
      
      {/* Left Prefix */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-ping" />
        <span className="text-[11px] font-title font-bold text-[var(--color-primary)] tracking-widest uppercase">
          LOG TELEMETRY
        </span>
      </div>

      {/* Center Scrolling Stream */}
      <div className="flex-1 mx-8 overflow-hidden relative h-full flex items-center justify-center">
        <div 
          key={currentIndex + '-' + activeMessage.length} 
          className="flex items-center gap-2.5 text-xs text-[var(--text-primary)] font-mono animate-fade-slide-up"
        >
          {getIcon(activeMessage)}
          <span>{cleanMessage(activeMessage)}</span>
        </div>
      </div>

      {/* Right Index & Switcher */}
      <div className="flex items-center gap-3 shrink-0">
        {messages.length > 0 && (
          <span className="text-[10px] font-mono text-[var(--text-secondary)]">
            {currentIndex + 1} / {messages.length}
          </span>
        )}
        <button 
          onClick={() => setCurrentIndex((prev) => (prev + 1) % Math.max(1, messages.length))}
          className="p-1 hover:bg-white/5 rounded text-[var(--text-secondary)] hover:text-white transition-colors cursor-pointer"
          title="切换下一条通知"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          0% { opacity: 0; transform: translateY(8px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-8px); }
        }
        .animate-fade-slide-up {
          animation: fadeSlideUp 4s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
      `}</style>
    </div>
  );
};
