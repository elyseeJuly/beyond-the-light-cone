/**
 * EndingCinematic.tsx — Phase 2: 结局专属演绎
 *
 * 展示结局配图（或占位渐变），结局后记文字，
 * 以及结局专属的粒子效果动画。
 * 持续约 12 秒后自动进入下一阶段。
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EndingConfig } from '../../config/endingConfig';
import { getPerformanceConfig } from './particlePerformance';

interface Props {
  config: EndingConfig;
  onComplete: () => void;
}

export const EndingCinematic: React.FC<Props> = ({ config, onComplete }) => {
  const [showEpilogue, setShowEpilogue] = useState(false);
  const [displayedEpilogue, setDisplayedEpilogue] = useState('');
  const [imgSrc, setImgSrc] = useState(config.sceneImage);
  const [imageError, setImageError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const typeRef = useRef(0);
  const animRef = useRef<number>(0);

  useEffect(() => {
    setImgSrc(config.sceneImage);
    setImageError(false);
  }, [config.sceneImage]);

  // Show epilogue after delay
  useEffect(() => {
    const t = setTimeout(() => setShowEpilogue(true), 2000);
    return () => clearTimeout(t);
  }, []);

  // Typewriter for epilogue
  useEffect(() => {
    if (!showEpilogue) return;
    typeRef.current = 0;
    setDisplayedEpilogue('');
    const content = config.epilogue;
    const timer = setInterval(() => {
      if (typeRef.current < content.length) {
        setDisplayedEpilogue(content.slice(0, typeRef.current + 1));
        typeRef.current++;
      } else {
        clearInterval(timer);
        setTimeout(onComplete, 3000);
      }
    }, 40);
    return () => clearInterval(timer);
  }, [showEpilogue, config.epilogue, onComplete]);

  // Particle effect on canvas
  const drawParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      size: number; alpha: number;
      life: number; maxLife: number;
    }

    const particles: Particle[] = [];
    const pColor = config.particleColor;

    // Generate particles based on effect type
    const spawnParticle = (): Particle => {
      const effect = config.particleEffect;
      switch (effect) {
        case 'starfield':
          return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 3 - 1,
            size: Math.random() * 3 + 1,
            alpha: Math.random(),
            life: 0,
            maxLife: 120 + Math.random() * 120,
          };
        case 'ripple': {
          const cx = canvas.width / 2;
          const cy = canvas.height / 2;
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 1.5 + 0.5;
          return {
            x: cx, y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 2 + 1,
            alpha: 1,
            life: 0,
            maxLife: 120 + Math.random() * 120,
          };
        }
        case 'thrust':
          return {
            x: canvas.width / 2 + (Math.random() - 0.5) * 100,
            y: canvas.height,
            vx: (Math.random() - 0.5) * 1,
            vy: -Math.random() * 4 - 2,
            size: Math.random() * 4 + 2,
            alpha: 1,
            life: 0,
            maxLife: 100,
          };
        case 'matrix':
          return {
            x: Math.random() * canvas.width,
            y: -10,
            vx: 0,
            vy: Math.random() * 3 + 1,
            size: Math.random() * 2 + 1,
            alpha: Math.random() * 0.8 + 0.2,
            life: 0,
            maxLife: canvas.height / 2,
          };
        case 'shatter':
          return {
            x: canvas.width / 2,
            y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            size: Math.random() * 5 + 2,
            alpha: 1,
            life: 0,
            maxLife: 150,
          };
        case 'ember':
          return {
            x: Math.random() * canvas.width,
            y: canvas.height + 10,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -Math.random() * 1 - 0.3,
            size: Math.random() * 3 + 1,
            alpha: Math.random() * 0.6 + 0.2,
            life: 0,
            maxLife: 300,
          };
        case 'flash':
          return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            size: Math.random() * 6 + 3,
            alpha: 1,
            life: 0,
            maxLife: 60,
          };
        case 'kaleidoscope': {
          const ka = Math.random() * Math.PI * 2;
          const kr = Math.random() * 200;
          return {
            x: canvas.width / 2 + Math.cos(ka) * kr,
            y: canvas.height / 2 + Math.sin(ka) * kr,
            vx: Math.cos(ka + 0.5) * 0.8,
            vy: Math.sin(ka + 0.5) * 0.8,
            size: Math.random() * 3 + 1,
            alpha: Math.random() * 0.8 + 0.2,
            life: 0,
            maxLife: 200,
          };
        }
        default: // collapse
          return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (canvas.width / 2 - Math.random() * canvas.width) * 0.005,
            vy: (canvas.height / 2 - Math.random() * canvas.height) * 0.005,
            size: Math.random() * 2 + 1,
            alpha: 0.6,
            life: 0,
            maxLife: 300,
          };
      }
    };

    const perfConfig = getPerformanceConfig();
    const maxParticles = perfConfig.maxParticles;
    const enableGlow = perfConfig.enableGlow;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn new particles
      if (particles.length < maxParticles) {
        particles.push(spawnParticle());
      }

      // Update and draw
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        if (p.life >= p.maxLife || p.x < -20 || p.x > canvas.width + 20 || p.y < -20 || p.y > canvas.height + 20) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = pColor + Math.floor(p.alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();

        // Glow effect
        if (enableGlow) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = pColor + Math.floor(p.alpha * 40).toString(16).padStart(2, '0');
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, [config.particleColor, config.particleEffect]);

  useEffect(() => {
    const cleanup = drawParticles();
    return () => { if (cleanup) cleanup(); };
  }, [drawParticles]);

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-between overflow-hidden bg-black"
    >
      {/* Background Image (Full Viewport with pan-zoom) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {!imageError ? (
          <img
            src={imgSrc}
            alt={config.title}
            className="w-full h-full object-cover opacity-95 animate-[pan-zoom_30s_linear_infinite] transition-opacity duration-1000"
            onError={() => {
              if (imgSrc.includes('ending_')) {
                setImgSrc(imgSrc.replace('ending_', 'cg_'));
              } else {
                setImageError(true);
              }
            }}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${config.gradientFrom}E6, ${config.accentColor}22, ${config.gradientTo}E6)`,
            }}
          />
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Particle canvas (Overlaying image) */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

      {/* Cinematic Content overlay */}
      <div className="relative z-20 flex flex-col items-center justify-between h-full w-full py-16 px-6 pointer-events-none">
        {/* Top Header */}
        <div className="text-center space-y-1 select-none animate-in fade-in slide-in-from-top-4 duration-1000">
          <p
            className="text-[10px] md:text-xs font-mono font-bold tracking-[0.4em] uppercase"
            style={{ color: config.accentColor + 'CC' }}
          >
            {config.isVictory ? 'VICTORY ACHIEVED' : 'CIVILIZATION LOST'}
          </p>
          <h1
            className="text-3xl md:text-5xl font-black tracking-widest text-white uppercase italic"
            style={{ textShadow: `0 0 20px ${config.accentColor}44` }}
          >
            {config.title}
          </h1>
        </div>

        {/* Center/Bottom Epilogue */}
        <div
          className={`max-w-2xl w-full p-8 rounded border transition-all duration-1000 ${
            showEpilogue ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
          }`}
          style={{
            borderColor: config.accentColor + '22',
            background: 'rgba(5, 10, 31, 0.45)',
            backdropFilter: 'blur(12px)',
            boxShadow: `0 0 30px rgba(0, 0, 0, 0.5), inset 0 0 20px ${config.accentColor}11`,
          }}
        >
          <p className="text-base md:text-lg leading-relaxed text-white/90 italic text-center font-light tracking-wide font-sans">
            {displayedEpilogue}
            {showEpilogue && typeRef.current < config.epilogue.length && (
              <span
                className="inline-block w-1.5 h-5 ml-1 animate-pulse"
                style={{ backgroundColor: config.accentColor }}
              />
            )}
          </p>
        </div>

        {/* Spacer for bottom button alignment */}
        <div className="h-8" />
      </div>

      {/* Skip */}
      <button
        onClick={onComplete}
        className="absolute bottom-8 right-8 text-white/20 hover:text-white/50 text-xs tracking-widest uppercase transition-colors z-30"
      >
        Skip →
      </button>
    </div>
  );
};
