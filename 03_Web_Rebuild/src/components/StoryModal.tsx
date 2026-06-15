import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GameEventPayload } from '../types/narrative';
import { ChevronRight, FileText, CheckSquare } from 'lucide-react';
import { GameInstance } from '../core/Game';

interface StoryModalProps {
  event: GameEventPayload;
  onClose: () => void;
}

export const StoryModal: React.FC<StoryModalProps> = ({ event, onClose }) => {
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [signingChoice, setSigningChoice] = useState<number | null>(null);
  const typeIndexRef = useRef(0);

  const currentNode = event.dialogQueue[currentNodeIndex];

  // Reset state when a new event arrives
  useEffect(() => {
    setCurrentNodeIndex(0);
    setDisplayedText("");
    setShowChoices(false);
    setIsTyping(false);
    setSigningChoice(null);
    typeIndexRef.current = 0;
  }, [event.id]);

  // Typewriter effect
  useEffect(() => {
    if (!currentNode || !currentNode.content) return;
    
    setDisplayedText("");
    setIsTyping(true);
    typeIndexRef.current = 0;
    
    const content = currentNode.content;
    const timer = setInterval(() => {
      const currentIndex = typeIndexRef.current;
      
      if (currentIndex < content.length) {
        const char = content[currentIndex];
        if (char !== undefined) {
          setDisplayedText((prev) => prev + char);
        }
        typeIndexRef.current += 1;
      } else {
        clearInterval(timer);
        setIsTyping(false);
        if (currentNodeIndex === event.dialogQueue.length - 1) {
          setShowChoices(true);
        }
      }
    }, 20);

    return () => clearInterval(timer);
  }, [currentNode, currentNodeIndex, event.id]);

  const handleNext = useCallback(() => {
    if (isTyping) {
      setDisplayedText(currentNode.content);
      setIsTyping(false);
      if (currentNodeIndex === event.dialogQueue.length - 1) {
        setShowChoices(true);
      }
      return;
    }

    if (currentNodeIndex < event.dialogQueue.length - 1) {
      setCurrentNodeIndex(prev => prev + 1);
    }
  }, [isTyping, currentNode, currentNodeIndex, event.dialogQueue.length]);

  // Generate a mock archive number from event ID/title
  const archiveNumber = useMemo(() => {
    let hash = 0;
    const key = event.title + event.id;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    return String(Math.abs(hash) % 100000).padStart(5, '0');
  }, [event.title, event.id]);

  const game = GameInstance.get();
  const epochNames = ["危机纪元", "威慑纪元", "广播纪元", "掩体纪元", "银河纪元", "星屑纪元"];
  const currentEraName = epochNames[game.epoch] || "未知纪元";

  const handleSelectChoice = (choice: any, idx: number) => {
    setSigningChoice(idx);
    
    // Simulate electronic signature scan before proceeding
    setTimeout(() => {
      choice.action();
      onClose();
    }, 1200);
  };

  const handleAcknowledge = () => {
    setSigningChoice(-1);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  if (!currentNode) return null;

  // Render standardized 720x560 civilization archive layout
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all duration-300 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      {/* 2-second hologram scan line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        <div className="absolute inset-x-0 h-[2px] bg-[var(--color-primary)]/10 opacity-30 shadow-[0_0_15px_var(--color-primary)] animate-[hologram-sweep_2s_linear_infinite]" />
      </div>

      {/* Main card box (720px width, 560px height) */}
      <div 
        className="relative w-[720px] h-[560px] bg-[#070B14]/90 border border-[var(--color-primary)]/30 shadow-[0_0_40px_rgba(0,184,255,0.15)] flex flex-col justify-between p-6 rounded select-none animate-[card-unseal_0.5s_cubic-bezier(0.16,1,0.3,1)] overflow-hidden"
      >
        {/* Glow corner decorations */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-[var(--color-primary)]/50" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-[var(--color-primary)]/50" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-[var(--color-primary)]/50" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-[var(--color-primary)]/50" />

        {/* 1. Header Metadata block */}
        <div className="flex items-center justify-between border-b border-[#243245]/40 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="text-[var(--color-primary)] w-4 h-4" />
            <span className="text-xs font-title font-bold text-[var(--color-primary)] tracking-widest uppercase">
              银河文明重要战略档案
            </span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px] text-[var(--text-secondary)]">
            <span>档案编号: ARC-{archiveNumber}</span>
            <span>时间节点: {currentEraName} 第 {game.year} 年</span>
          </div>
        </div>

        {/* 2. Main Title */}
        <div className="my-4 shrink-0 text-center">
          <h2 className="text-xl font-extrabold text-white tracking-widest font-title">
            《 {event.title.trim().replace(/^【|】$/g, '')} 》
          </h2>
        </div>

        {/* 3. Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#243245] to-transparent shrink-0 mb-4" />

        {/* 4. Text Body (Scrollable if text is very long) */}
        <div className="flex-1 overflow-y-auto px-4 space-y-4 mb-4 flex flex-col justify-center">
          {/* Speaker label if speaking */}
          {currentNode.speakerName && (
            <div className="flex flex-col items-center shrink-0">
              <span className="text-[11px] font-title font-bold text-[var(--color-primary)] tracking-widest uppercase border border-[var(--color-primary)]/30 px-2.5 py-0.5 rounded bg-[var(--color-primary)]/5">
                {currentNode.speakerName} {currentNode.speakerTitle ? ` [ ${currentNode.speakerTitle} ]` : ''}
              </span>
            </div>
          )}

          {/* Typing log */}
          <div className="text-sm font-mono leading-relaxed text-slate-100 text-center tracking-wide px-2 select-text">
            {displayedText}
            {isTyping && <span className="inline-block w-1.5 h-4 ml-1 bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)] animate-pulse" />}
          </div>
        </div>

        {/* 5. Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#243245] to-transparent shrink-0 mb-4" />

        {/* 6. Signature / Choice Actions block */}
        <div className="shrink-0 flex justify-center pb-2 relative z-20">
          {signingChoice !== null ? (
            <div className="flex flex-col items-center gap-2 text-xs font-mono text-[var(--color-primary)] animate-pulse">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 animate-spin" />
                <span>正在执行电子指纹与意识授权签名...</span>
              </div>
              <div className="w-48 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent mt-1" />
            </div>
          ) : !showChoices ? (
            <button 
              onClick={handleNext}
              className="story-proceed-btn px-8 py-3 bg-[rgba(var(--color-primary-rgb),0.15)] border border-[var(--color-primary)]/40 hover:border-[var(--color-primary)] hover:bg-[rgba(var(--color-primary-rgb),0.3)] text-[var(--color-primary)] hover:text-white font-bold uppercase tracking-[0.25em] text-xs transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,184,255,0.1)] active:scale-95"
            >
              <span>{isTyping ? "快速解密" : "下一页档案"}</span>
              <ChevronRight size={14} className="stroke-[2.5]" />
            </button>
          ) : (
            <div className="flex flex-col gap-3 w-full px-8">
              <div className="text-[9px] font-title font-bold text-[var(--text-secondary)]/40 tracking-[0.3em] uppercase mb-1 text-center">
                执政官指令签署授权区
              </div>
              <div className="flex flex-col gap-2 w-full max-h-36 overflow-y-auto">
                {event.choices && event.choices.length > 0 ? (
                  event.choices.map((choice, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectChoice(choice, idx)}
                      className="story-choice-btn w-full px-4 py-2.5 bg-[#070B14]/80 border border-[#243245] hover:border-[var(--color-primary)] hover:bg-[rgba(var(--color-primary-rgb),0.05)] hover:shadow-[0_0_15px_rgba(0,184,255,0.15)] text-slate-100 transition-all text-left text-xs flex justify-between items-center group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-[var(--text-secondary)]/50 group-hover:text-[var(--color-primary)] shrink-0">
                          指令 {idx + 1}
                        </span>
                        <span className="font-bold tracking-wide">{choice.label}</span>
                      </div>
                      <span className="text-[9px] font-mono text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                        [ 签署决策 ]
                      </span>
                    </button>
                  ))
                ) : (
                  <button
                    onClick={handleAcknowledge}
                    className="story-acknowledge-btn w-full py-3 bg-[var(--color-primary)] text-blue-950 font-black uppercase tracking-[0.3em] text-xs hover:brightness-110 transition-all shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.3)] active:scale-95 text-center cursor-pointer"
                  >
                    签署并归档
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes card-unseal {
          from { transform: scale(0.95); opacity: 0; box-shadow: 0 0 0 transparent; }
          to { transform: scale(1); opacity: 1; box-shadow: 0 0 40px rgba(0,184,255,0.15); }
        }
        @keyframes hologram-sweep {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
};
