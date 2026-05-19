/**
 * EndingDeclaration.tsx — Phase 1: 结局宣言
 * 
 * 全屏展示结局标题、宣言独白，带打字机效果
 * 持续约 8 秒后自动进入下一阶段
 */

import React, { useState, useEffect, useRef } from 'react';
import { EndingConfig } from '../../config/endingConfig';

interface Props {
  config: EndingConfig;
  onComplete: () => void;
}

export const EndingDeclaration: React.FC<Props> = ({ config, onComplete }) => {
  const [phase, setPhase] = useState<'icon' | 'title' | 'declaration'>('icon');
  const [displayedText, setDisplayedText] = useState('');
  const typeRef = useRef(0);

  // Phase transition: icon → title → declaration
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('title'), 1500);
    const t2 = setTimeout(() => setPhase('declaration'), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Typewriter effect for declaration
  useEffect(() => {
    if (phase !== 'declaration') return;
    typeRef.current = 0;
    setDisplayedText('');
    const content = config.declaration;
    const timer = setInterval(() => {
      if (typeRef.current < content.length) {
        setDisplayedText(content.slice(0, typeRef.current + 1));
        typeRef.current++;
      } else {
        clearInterval(timer);
        setTimeout(onComplete, 2500);
      }
    }, 50);
    return () => clearInterval(timer);
  }, [phase, config.declaration, onComplete]);

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center overflow-hidden transition-all duration-1000"
      style={{
        background: `linear-gradient(135deg, ${config.gradientFrom} 0%, ${config.gradientTo} 100%)`,
      }}
    >
      {/* Subtle animated grid */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(${config.accentColor}22 1px, transparent 1px), linear-gradient(90deg, ${config.accentColor}22 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Icon */}
      <div
        className={`text-8xl mb-8 transition-all duration-1000 ${
          phase === 'icon' ? 'opacity-100 scale-100' : 'opacity-60 scale-75'
        }`}
      >
        {config.iconSymbol}
      </div>

      {/* Title */}
      <div
        className={`text-center transition-all duration-1000 ease-out ${
          phase === 'icon' ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'
        }`}
      >
        <p
          className="text-sm tracking-[0.5em] uppercase mb-3 font-bold"
          style={{ color: config.accentColor + '99' }}
        >
          {config.isVictory ? 'VICTORY ACHIEVED' : 'CIVILIZATION LOST'}
        </p>
        <h1
          className="text-5xl md:text-7xl font-black tracking-tight mb-4"
          style={{
            color: config.accentColor,
            textShadow: `0 0 60px ${config.accentColor}66`,
          }}
        >
          {config.title}
        </h1>
        <p className="text-lg tracking-[0.2em] text-white/40 italic">
          {config.subtitle}
        </p>
      </div>

      {/* Declaration Text */}
      <div
        className={`max-w-3xl mt-12 px-8 transition-all duration-500 ${
          phase === 'declaration' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="relative">
          <div
            className="absolute -left-4 top-0 bottom-0 w-1 rounded-full"
            style={{ backgroundColor: config.accentColor + '40' }}
          />
          <p
            className="text-xl md:text-2xl leading-relaxed font-light tracking-wide"
            style={{ color: config.isVictory ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.7)' }}
          >
            {displayedText}
            {typeRef.current < config.declaration.length && (
              <span
                className="inline-block w-2 h-6 ml-1 animate-pulse"
                style={{ backgroundColor: config.accentColor }}
              />
            )}
          </p>
        </div>
      </div>

      {/* Skip hint */}
      <button
        onClick={onComplete}
        className="absolute bottom-8 right-8 text-white/20 hover:text-white/50 text-xs tracking-widest uppercase transition-colors"
      >
        Skip →
      </button>
    </div>
  );
};
