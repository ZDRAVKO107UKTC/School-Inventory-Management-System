/**
 * Interactive Background Component
 * Mouse-tracking glow, parallax blobs, click ripples, particle drift
 * Design: Dark (black->purple) & Light (white->cyan) modes
 */

import React, { useEffect, useRef, useState } from 'react';

export interface InteractiveBackgroundProps {
  theme?: 'light' | 'dark';
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

// Stable random particle positions (computed once, not on every render)
const PARTICLE_COUNT = 22;
const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  left: parseFloat((Math.random() * 100).toFixed(2)),
  top: parseFloat((Math.random() * 100).toFixed(2)),
  duration: parseFloat((20 + Math.random() * 20).toFixed(1)),
  delay: parseFloat((Math.random() * 8).toFixed(1)),
  size: Math.random() > 0.7 ? 2 : 1,
}));

export const InteractiveBackground: React.FC<InteractiveBackgroundProps> = ({
  theme = 'dark',
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 600;
  const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 400;
  const mouseRef   = useRef({ x: centerX, y: centerY });
  const currentPos = useRef({ x: centerX, y: centerY });
  const glowRef    = useRef<HTMLDivElement>(null);
  const blob1Ref   = useRef<HTMLDivElement>(null);
  const blob2Ref   = useRef<HTMLDivElement>(null);
  const blob3Ref   = useRef<HTMLDivElement>(null);
  const rafRef     = useRef<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onClick = (e: MouseEvent) => {
      const id = Date.now();
      setRipples(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 900);
    };

    const animate = () => {
      // Smooth lerp toward mouse
      currentPos.current.x += (mouseRef.current.x - currentPos.current.x) * 0.06;
      currentPos.current.y += (mouseRef.current.y - currentPos.current.y) * 0.06;

      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = currentPos.current.x - cx;
      const dy = currentPos.current.y - cy;

      // Move cursor-glow to follow mouse (offset by half its own size so it's centred)
      if (glowRef.current) {
        glowRef.current.style.transform =
          `translate(${currentPos.current.x - 280}px, ${currentPos.current.y - 280}px)`;
      }

      // Parallax — blobs drift in the opposite direction of the mouse at different depths
      if (blob1Ref.current)
        blob1Ref.current.style.transform = `translate(${dx * -0.04}px, ${dy * -0.04}px)`;
      if (blob2Ref.current)
        blob2Ref.current.style.transform = `translate(${dx * -0.07}px, ${dy * -0.07}px)`;
      if (blob3Ref.current)
        blob3Ref.current.style.transform = `translate(${dx * -0.025}px, ${dy * -0.025}px)`;

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('click', onClick);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('click', onClick);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const isDark = theme === 'dark';

  return (
    <div
      className={`
        fixed inset-0 z-0 overflow-hidden transition-colors duration-500 ease-out
        ${isDark ? 'bg-black' : 'bg-[#f5f5f7]'}
      `}
    >
      {/* ── Layer 1: Mesh pulse ── */}
      <div
        className={`
          absolute inset-0 opacity-20 transition-colors duration-500 ease-out
          ${isDark
            ? 'bg-gradient-to-br from-[#1d1d1f] to-black'
            : 'bg-gradient-to-br from-white to-[#f5f5f7]'}
        `}
        style={{ animation: `meshPulse 15s ease-in-out infinite` }}
      />

      {/* ── Layer 2: Parallax floating blobs ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Blob 1 – top-left */}
        <div
          ref={blob1Ref}
          className={`
            absolute top-10 left-20 w-80 h-80 rounded-full blur-3xl opacity-10
            will-change-transform transition-colors duration-500 ease-out
            ${isDark ? 'bg-blue-600' : 'bg-blue-400'}
          `}
        />
        {/* Blob 2 – bottom-right */}
        <div
          ref={blob2Ref}
          className={`
            absolute bottom-20 right-32 w-64 h-64 rounded-full blur-3xl opacity-10
            will-change-transform transition-colors duration-500 ease-out
            ${isDark ? 'bg-slate-700' : 'bg-slate-300'}
          `}
        />
        {/* Blob 3 – top-right */}
        <div
          ref={blob3Ref}
          className={`
            absolute top-40 right-20 w-96 h-96 rounded-full blur-3xl opacity-5
            will-change-transform transition-colors duration-500 ease-out
            ${isDark ? 'bg-blue-900' : 'bg-blue-100'}
          `}
        />
      </div>

      {/* ── Layer 3: Mouse-following glow ── */}
      <div
        ref={glowRef}
        className={`
          absolute top-0 left-0
          w-[560px] h-[560px] rounded-full blur-3xl
          pointer-events-none will-change-transform transition-colors duration-300 ease-out
          ${isDark ? 'bg-purple-500/50' : 'bg-lime-300/45'}
        `}
        style={{ animation: 'glowPulse 3s ease-in-out infinite' }}
      />

      {/* ── Layer 4: Stable particle drift ── */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map(p => (
          <div
            key={p.id}
            className={`absolute rounded-full ${isDark ? 'bg-purple-400/40' : 'bg-lime-400/35'}`}
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              animation: `particleDrift ${p.duration}s linear infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* ── Layer 5: Click ripples ── */}
      {ripples.map(r => (
        <div
          key={r.id}
          className={`
            absolute rounded-full pointer-events-none
            border ${isDark ? 'border-purple-400/50' : 'border-lime-400/60'}
          `}
          style={{
            left: r.x,
            top: r.y,
            width: 0,
            height: 0,
            transform: 'translate(-50%, -50%)',
            animation: 'ripple 0.9s ease-out forwards',
          }}
        />
      ))}

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes meshPulse {
          0%, 100% { opacity: 0.4; filter: hue-rotate(0deg); }
          50%       { opacity: 0.6; filter: hue-rotate(20deg); }
        }

        @keyframes floatBlob {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25%       { transform: translateY(-20px) translateX(10px); }
          50%       { transform: translateY(0px) translateX(20px); }
          75%       { transform: translateY(20px) translateX(10px); }
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 0.8; }
          50%       { opacity: 1.0; }
        }

        @keyframes particleDrift {
          0%   { transform: translateX(0) translateY(0); opacity: 0; }
          10%  { opacity: 0.5; }
          90%  { opacity: 0.5; }
          100% { transform: translateX(80px) translateY(-120px); opacity: 0; }
        }

        @keyframes ripple {
          0%   { width: 0; height: 0; opacity: 0.8; }
          100% { width: 300px; height: 300px; opacity: 0; }
        }
      `}</style>
    </div>
  );
};
