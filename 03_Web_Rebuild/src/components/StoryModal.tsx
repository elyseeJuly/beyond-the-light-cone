import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameEventPayload } from '../types/narrative';
import { ChevronRight } from 'lucide-react';

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

      <div className="relative w-full max-w-5xl glass-panel overflow-hidden flex flex-col md:flex-row min-h-[500px] border-primary/20 shadow-[0_0_50px_rgba(0,0,0,1)] animate-ink-spread">
        
        {/* Left: Avatar Section with Holographic Effects */}
        <div className="w-full md:w-2/5 bg-[#050A1F] flex items-end justify-center relative overflow-hidden border-r border-primary/10 group">
          {/* Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,229,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,229,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
          
          {/* Scanning Line Effect */}
          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="w-full h-1 bg-primary/40 shadow-[0_0_15px_var(--color-primary)] absolute top-0 animate-scan-line" />
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
          
          {currentNode.avatarUrl && (
            <div className="relative w-full h-[110%] gongbi-portrait">
              <img 
                src={currentNode.avatarUrl} 
                alt={currentNode.speakerName} 
                className="w-full h-full object-cover object-center transition-all duration-1000 group-hover:scale-105 filter contrast-110 saturate-125"
              />
              {/* Paper Texture and Ink Vignette */}
              <div className="paper-texture" />
              <div className="ink-vignette" />
            </div>
          )}

          {/* Character Label Overlay */}
          <div className="absolute bottom-10 left-0 z-30 px-6 py-2 bg-primary/20 border-r-2 border-primary backdrop-blur-md animate-holographic">
            <p className="text-xs tracking-[0.3em] text-primary-foreground font-bold uppercase mb-1">Speaker Identification</p>
            <h3 className="text-2xl font-black text-white tracking-tighter italic">
              {currentNode.speakerName}
            </h3>
          </div>
        </div>

        {/* Right: Content Section */}
        <div className="flex-1 p-10 flex flex-col justify-between bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.03)_0%,transparent_100%)]">
          <div className="space-y-8">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-primary/40 tracking-[0.4em] uppercase">Narrative Sequence Node</p>
                <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                  <span className="w-2 h-6 bg-primary" />
                  {event.title.includes('事件_') ? event.title : `【 ${event.title} 】`}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-white/20 tracking-widest uppercase">System Status</p>
                <p className="text-xs font-mono text-primary animate-pulse">● INTERACTIVE</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -left-6 top-0 bottom-0 w-[1px] bg-white/5" />
              <p className="text-2xl leading-relaxed font-light text-white/90 font-sans min-h-[160px] tracking-wide">
                {displayedText}
                {isTyping && <span className="inline-block w-2 h-6 ml-1 bg-primary shadow-[0_0_10px_var(--color-primary)] animate-pulse" />}
              </p>
            </div>
          </div>

          <div className="flex justify-end items-center gap-6 pt-8 border-t border-white/5">
            {!showChoices ? (
              <button 
                onClick={handleNext}
                className="group relative flex items-center gap-4 px-8 py-4 bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-primary/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                <span className="relative z-10 text-primary font-black uppercase tracking-[0.2em] text-sm">
                  {isTyping ? "Bypass Sync" : "Proceed"}
                </span>
                <ChevronRight size={20} className="relative z-10 text-primary group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <div className="flex flex-col gap-3 w-full">
                <p className="text-[10px] font-bold text-white/30 tracking-[0.5em] uppercase mb-1 text-center">Directive Decision Required</p>
                <div className="flex flex-wrap gap-4 justify-center w-full">
                  {event.choices && event.choices.length > 0 ? (
                    event.choices.map((choice, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          choice.action();
                          onClose();
                        }}
                        className="flex-1 min-w-[200px] px-6 py-4 bg-primary/10 hover:bg-primary/30 border border-primary/40 text-white transition-all hover:border-primary hover:shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.2)] text-left group relative"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-primary/60 group-hover:text-primary transition-colors">0{idx + 1}</span>
                          <span className="font-bold text-sm tracking-wide">{choice.label}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <button
                      onClick={onClose}
                      className="px-12 py-4 bg-primary text-black font-black uppercase tracking-[0.3em] text-sm hover:bg-cyan-300 transition-all shadow-[0_0_30px_rgba(var(--color-primary-rgb),0.4)] active:scale-95"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
