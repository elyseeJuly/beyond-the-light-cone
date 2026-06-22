import React, { useState, useEffect, useRef } from 'react';
import { GameInstance } from '../core/Game';
import { Terminal, Shield, Bell, Users, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

export const AnnouncementBoard: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll to the bottom of the log when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const getIcon = (text: string) => {
    if (text.includes('👥') || text.includes('人员') || text.includes('人物')) {
      return <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    }
    if (text.includes('警报') || text.includes('威胁') || text.includes('三体')) {
      return <Shield className="w-3.5 h-3.5 text-red-400 shrink-0 animate-pulse" />;
    }
    if (text.includes('大事记') || text.includes('更替')) {
      return <Bell className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    }
    return <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
  };

  const getCleanText = (text: string) => {
    // Remove the emojis since we render a beautiful icon
    const icons = ['👥', '📢', '🚀', '⚠️'];
    return icons.reduce((t, icon) => t.split(icon).join(''), text).trim();
  };

  return (
    <div className="w-full bg-slate-950/80 backdrop-blur-md border-y border-cyan-500/20 p-3 flex flex-col relative z-10 shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_0_15px_rgba(6,182,212,0.15)] overflow-hidden select-none">
      {/* Sci-fi Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] opacity-35"></div>

      {/* Board Header Row */}
      <div className="flex items-center justify-between border-b border-cyan-500/10 pb-1.5 mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-3 bg-cyan-400 rounded-sm animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
          <span className="text-cyan-400 text-xs font-bold font-mono tracking-widest uppercase">
            PDC 战略防御指挥部 · 战术情报公告板
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-mono text-cyan-500/60 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            STATUS: ACTIVE MONITORING
          </div>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-cyan-500 hover:text-cyan-300 transition-colors p-1 rounded hover:bg-cyan-900/30 cursor-pointer pointer-events-auto"
            title={isExpanded ? "收起" : "展开"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Announcement List Body */}
      <div 
        ref={containerRef}
        className={`flex-1 overflow-y-auto space-y-1.5 pr-2 transition-all duration-300 ${isExpanded ? 'max-h-64' : 'max-h-24'} scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent pointer-events-auto`}
      >
        {messages.length === 0 ? (
          <div className="flex items-center gap-2 text-cyan-400/40 text-xs font-mono py-1.5 pl-1 italic">
            <ChevronRight className="w-3.5 h-3.5 animate-pulse" />
            <span>PDC DEEP SPACE TELEMETRY ONLINE. WAITING FOR SECURE STRATEGIC BROADCAST...</span>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div 
              key={idx}
              className="flex items-start gap-2 bg-cyan-950/20 border border-cyan-500/5 hover:bg-cyan-950/30 px-2.5 py-1.5 rounded text-[11px] font-mono transition-all duration-200 animate-fade-in"
            >
              {getIcon(msg)}
              <div className="flex-1 text-cyan-200/90 leading-relaxed tracking-wide">
                {getCleanText(msg)}
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        /* Custom scrollbar */
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.2);
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.4);
        }
      `}</style>
    </div>
  );
};
