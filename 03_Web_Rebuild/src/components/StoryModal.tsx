import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameEventPayload } from '../types/narrative';
import { ChevronRight } from 'lucide-react';
import { getImageUrl } from '../utils/assetUrl';

interface StoryModalProps {
  event: GameEventPayload;
  onClose: () => void;
}

export const StoryModal: React.FC<StoryModalProps> = ({ event, onClose }) => {
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const typeIndexRef = useRef(0);

  // Reset state when a new event arrives
  useEffect(() => {
    setCurrentNodeIndex(0);
    setDisplayedText("");
    setShowChoices(false);
    setIsTyping(false);
    typeIndexRef.current = 0;
  }, [event.id]);

  const currentNode = event.dialogQueue[currentNodeIndex];

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
    }, 30);

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

  if (!currentNode) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md transition-all duration-500 animate-in fade-in">
      {/* Background Scanning Lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      </div>

      <div className={`relative w-full max-w-5xl glass-panel overflow-hidden flex flex-col md:flex-row min-h-[500px] border-[var(--color-primary)]/20 shadow-[0_0_50px_rgba(0,0,0,0.3)] animate-ink-spread ${currentNode.isCG ? 'bg-black/80' : ''}`}>
        
        {/* === MODE: FULL-SCREEN CG === */}
        {currentNode.isCG && currentNode.avatarUrl && (
          <>
            {/* Full-width Background Image with Parallax Zoom */}
            <div className="absolute inset-0 z-0">
              <img 
                src={currentNode.avatarUrl} 
                alt="CG"
                className="w-full h-full object-cover opacity-90 animate-[pan-zoom_30s_linear_infinite]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="paper-texture" />
            </div>

            {/* Letterbox UI Content (Bottom) */}
            <div className="relative z-10 flex flex-col justify-end w-full p-8 md:p-12 min-h-[500px]">
              <div className="mb-6">
                <h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter italic drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                  {currentNode.speakerName}
                </h3>
                {currentNode.speakerTitle && (
                  <p className="text-sm tracking-[0.3em] text-[var(--color-primary)] font-bold uppercase mt-2 drop-shadow-md">
                    {currentNode.speakerTitle}
                  </p>
                )}
              </div>
              <div className="relative bg-black/60 backdrop-blur-md border border-[var(--color-primary)]/30 p-6 md:p-8">
                <p className="text-xl md:text-2xl leading-relaxed font-light text-white/95 font-sans min-h-[100px] tracking-wide">
                  {displayedText}
                  {isTyping && <span className="inline-block w-2 h-6 ml-1 bg-[var(--color-primary)] animate-pulse" />}
                </p>
                
                {/* Actions */}
                <div className="mt-8 flex justify-end">
                  {!showChoices ? (
                    <button onClick={handleNext} className="text-[var(--color-primary)] font-black uppercase tracking-[0.2em] text-sm hover:text-white transition-colors flex items-center gap-2">
                      {isTyping ? "Bypass Sync" : "Proceed"} <ChevronRight size={20} />
                    </button>
                  ) : (
                    <div className="flex flex-wrap gap-4 justify-end w-full">
                      {event.choices && event.choices.length > 0 ? (
                        event.choices.map((choice, idx) => (
                          <button
                            key={idx}
                            onClick={() => { choice.action(); onClose(); }}
                            className="px-6 py-3 bg-black/50 border border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/20 hover:border-[var(--color-primary)] text-white transition-all text-sm font-bold tracking-wider"
                          >
                            {choice.label}
                          </button>
                        ))
                      ) : (
                        <button onClick={onClose} className="px-8 py-3 bg-[var(--color-primary)] text-black font-black uppercase tracking-widest text-sm hover:brightness-110">
                          Acknowledge
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* === MODE: STANDARD PORTRAIT === */}
        {!currentNode.isCG && (
          <>
            {/* Left: Avatar Section with Holographic Effects */}
            <div className="w-full md:w-2/5 bg-[var(--bg-main)] flex items-end justify-center relative overflow-hidden border-r border-black/5 dark:border-white/5 group">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-primary),transparent_1px),linear-gradient(to_bottom,var(--color-primary),transparent_1px)] bg-[size:20px_20px] opacity-5" />
              <div className="absolute inset-0 pointer-events-none z-20">
                <div className="w-full h-1 bg-primary/40 shadow-[0_0_15px_var(--color-primary)] absolute top-0 animate-scan-line" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10" />
              
              {currentNode.avatarUrl && (
                <div className="relative w-full h-[110%] gongbi-portrait">
                  <img 
                    src={currentNode.avatarUrl} 
                    alt={currentNode.speakerName} 
                    className="w-full h-full object-cover object-center transition-all duration-1000 group-hover:scale-105 filter contrast-110 saturate-125"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes('character_default.png')) {
                        target.src = getImageUrl('character_default.png');
                      }
                    }}
                  />
                  <div className="paper-texture" />
                  <div className="ink-vignette" />
                </div>
              )}

              {/* Character Label Overlay */}
              <div className="absolute bottom-10 left-0 z-30 px-6 py-2 bg-[var(--color-primary)]/20 border-r-2 border-[var(--color-primary)] backdrop-blur-md animate-holographic">
                <p className="text-xs tracking-[0.3em] text-[var(--text-primary)]/60 font-bold uppercase mb-1">
                  {currentNode.speakerTitle || "Speaker Identification"}
                </p>
                <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tighter italic">
                  {currentNode.speakerName}
                </h3>
              </div>
            </div>

            {/* Right: Content Section */}
            <div className="flex-1 p-10 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-primary),transparent_100%)] opacity-[0.03] pointer-events-none" />
              <div className="relative z-10 space-y-8">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-[var(--text-secondary)]/40 tracking-[0.4em] uppercase">Narrative Sequence Node</p>
                    <h2 className="text-2xl font-black tracking-tight text-[var(--text-primary)] flex items-center gap-3">
                      <span className="w-2 h-6 bg-[var(--color-primary)]" />
                      {(() => {
                        if (event.title.includes('事件_')) return event.title;
                        let cleanTitle = event.title.trim();
                        if (cleanTitle.startsWith('【') && cleanTitle.endsWith('】')) {
                          cleanTitle = cleanTitle.slice(1, -1).trim();
                        }
                        return `【 ${cleanTitle} 】`;
                      })()}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-[var(--text-secondary)]/20 tracking-widest uppercase">System Status</p>
                    <p className="text-xs font-mono text-[var(--color-primary)] animate-pulse">● INTERACTIVE</p>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute -left-6 top-0 bottom-0 w-[1px] bg-black/5 dark:bg-white/5" />
                  <p className="text-2xl leading-relaxed font-light text-[var(--text-primary)]/90 font-sans min-h-[160px] tracking-wide">
                    {displayedText}
                    {isTyping && <span className="inline-block w-2 h-6 ml-1 bg-[var(--color-primary)] shadow-[0_0_10px_var(--color-primary)] animate-pulse" />}
                  </p>
                </div>
              </div>

              <div className="relative z-10 flex justify-end items-center gap-6 pt-8 border-t border-black/5 dark:border-white/5">
                {!showChoices ? (
                  <button 
                    onClick={handleNext}
                    className="group relative flex items-center gap-4 px-8 py-4 bg-[var(--color-primary-glass)] hover:bg-[var(--color-primary-glass-hover)] border border-[var(--color-primary)]/30 transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-[var(--color-primary-glass)] -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                    <span className="relative z-10 text-[var(--color-primary)] font-black uppercase tracking-[0.2em] text-sm">
                      {isTyping ? "Bypass Sync" : "Proceed"}
                    </span>
                    <ChevronRight size={20} className="relative z-10 text-[var(--color-primary)] group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <div className="flex flex-col gap-3 w-full">
                    <p className="text-[10px] font-bold text-[var(--text-secondary)]/30 tracking-[0.5em] uppercase mb-1 text-center">Directive Decision Required</p>
                    <div className="flex flex-wrap gap-4 justify-center w-full">
                      {event.choices && event.choices.length > 0 ? (
                        event.choices.map((choice, idx) => (
                          <button
                            key={idx}
                            onClick={() => { choice.action(); onClose(); }}
                            className="flex-1 min-w-[200px] px-6 py-4 bg-[var(--color-primary-glass)] hover:bg-[var(--color-primary-glass-hover)] border border-[var(--color-primary)]/40 text-[var(--text-primary)] transition-all hover:border-[var(--color-primary)] hover:shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.2)] text-left group relative"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono text-[var(--text-secondary)]/60 group-hover:text-[var(--color-primary)] transition-colors shrink-0">0{idx + 1}</span>
                              <span className="font-bold text-sm tracking-wide">{choice.label}</span>
                            </div>
                            {(choice as any).effects && (choice as any).effects.length > 0 && (
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {(choice as any).effects.map((eff: any, i: number) => {
                                  const val = Number(eff.value) || 0;
                                  const isPositive = val > 0;
                                  const isNeutral = val === 0;
                                  const colorClass = isNeutral
                                    ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
                                    : isPositive
                                      ? 'text-green-400 border-green-500/30 bg-green-500/10'
                                      : 'text-red-400 border-red-500/30 bg-red-500/10';
                                  return (
                                    <span key={i} className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${colorClass}`}>
                                      {eff.target}{val !== 0 ? ` ${val > 0 ? '+' : ''}${val}` : ''}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </button>
                        ))
                      ) : (
                        <button
                          onClick={onClose}
                          className="px-12 py-4 bg-[var(--color-primary)] text-white dark:text-blue-950 font-black uppercase tracking-[0.3em] text-sm hover:brightness-110 transition-all shadow-[0_0_30px_rgba(var(--color-primary-rgb),0.4)] active:scale-95"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
