import React, { useMemo } from 'react';
import { motion, useMotionValue } from 'framer-motion';

interface Props {
  type: string;
  quantity?: number;
  isExpanded?: boolean;
  isActive?: boolean;
}

export const Virtual3DModel: React.FC<Props> = ({
  type,
  quantity = 1,
  isExpanded = false,
  isActive = true
}) => {
  const normalizedType = type.toLowerCase();
  const isLaptopLike = normalizedType.includes('laptop') || normalizedType.includes('macbook');

  const colors = useMemo(() => {
    if (normalizedType.includes('laptop') || normalizedType.includes('macbook')) {
      return { primary: '#e3e3e3', secondary: '#8e8e93', accent: '#1d1d1f', glow: 'rgba(0,122,255,0.3)' };
    }
    if (normalizedType.includes('projector')) {
      return { primary: '#f5f5f7', secondary: '#d2d2d7', accent: '#000000', glow: 'rgba(255,255,255,0.5)' };
    }
    if (normalizedType.includes('tablet') || normalizedType.includes('ipad')) {
      return { primary: '#1d1d1f', secondary: '#3a3a3c', accent: '#007aff', glow: 'rgba(0,122,255,0.4)' };
    }
    if (normalizedType.includes('computer') || normalizedType.includes('desktop')) {
      return { primary: '#3a3a3c', secondary: '#1c1c1e', accent: '#5e5ce6', glow: 'rgba(94,92,230,0.4)' };
    }
    if (normalizedType.includes('camera')) {
       return { primary: '#2c2c2e', secondary: '#1c1c1e', accent: '#ff3b30', glow: 'rgba(255,59,48,0.3)' };
    }
    if (normalizedType.includes('access') || normalizedType.includes('cable') || normalizedType.includes('charger')) {
       return { primary: '#ffffff', secondary: '#f5f5f7', accent: '#8e8e93', glow: 'rgba(142,142,147,0.2)' };
    }
    return { primary: '#f5f5f7', secondary: '#8e8e93', accent: '#1d1d1f', glow: 'rgba(0,0,0,0.1)' };
  }, [normalizedType]);

  const renderModel = () => {
    if (normalizedType.includes('computer')) {
      return (
        <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
          {/* Monitor */}
          <div className="w-48 h-32 rounded-xl border-4 shadow-2xl relative flex items-center justify-center" style={{ backgroundColor: colors.secondary, borderColor: colors.primary, transformStyle: 'preserve-3d' }}>
            <div className="absolute inset-2 rounded-lg bg-gradient-to-br from-indigo-500/10 via-slate-900 to-black overflow-hidden">
              <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,122,255,0.1),transparent)]" />
              <div className="absolute bottom-2 left-2 right-2 h-0.5 bg-indigo-500/20" />
            </div>
            {/* Stand */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-8 h-8" style={{ backgroundColor: colors.primary, transform: 'rotateX(-20deg)' }}>
              <div className="absolute -bottom-2 -left-4 w-16 h-2 rounded-full" style={{ backgroundColor: colors.primary }} />
            </div>
          </div>
        </div>
      );
    }

    if (normalizedType.includes('laptop') || normalizedType.includes('macbook')) {
      return (
        <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
          <div className="absolute w-40 h-2 rounded-sm" style={{ backgroundColor: colors.primary, transform: 'translateY(10px) rotateX(90deg)', transformStyle: 'preserve-3d' }}>
            <div className="absolute inset-0" style={{ backgroundColor: colors.secondary, transform: 'translateZ(-28px)' }} />
          </div>
          <motion.div
            className="absolute w-40 h-28 rounded-md border-2 shadow-2xl"
            style={{
              backgroundColor: colors.accent,
              borderColor: colors.primary,
              transformOrigin: 'bottom',
              transform: 'translateY(-14px) rotateX(-10deg)',
              transformStyle: 'preserve-3d'
            }}
          >
            <div className="absolute inset-2 bg-cyan-400/20 animate-pulse rounded-sm overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20" />
            </div>
            <div className="absolute inset-0 rounded-md" style={{ backgroundColor: colors.primary, transform: 'translateZ(-1px)' }} />
          </motion.div>
        </div>
      );
    }

    if (normalizedType.includes('projector')) {
      return (
        <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
          <div className="w-32 h-20 rounded-lg shadow-xl relative" style={{ backgroundColor: colors.primary, transformStyle: 'preserve-3d' }}>
            <div className="absolute -right-2 top-4 w-8 h-8 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: colors.accent, borderColor: colors.secondary, borderWidth: 2, transform: 'rotateY(90deg)' }}>
              <div className="w-4 h-4 rounded-full bg-cyan-400/50 shadow-[0_0_10px_cyan]" />
            </div>
            <div className="absolute inset-0 rounded-lg" style={{ backgroundColor: colors.secondary, transform: 'translateZ(-10px)' }} />
            <div className="absolute h-full w-10" style={{ right: 0, backgroundColor: colors.accent, transform: 'rotateY(90deg) translateZ(16px)' }} />
          </div>
        </div>
      );
    }

    if (normalizedType.includes('tablet') || normalizedType.includes('ipad') || normalizedType.includes('phone')) {
      return (
        <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
          <div className="w-32 h-44 rounded-2xl border-[3px] shadow-2xl relative" style={{ backgroundColor: colors.primary, borderColor: colors.secondary, transformStyle: 'preserve-3d' }}>
            <div className="absolute inset-1 rounded-xl bg-black overflow-hidden">
               <div className="w-full h-full bg-gradient-to-tr from-blue-600/20 via-transparent to-purple-600/20 animate-pulse" />
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-white/10" />
            </div>
            {/* Camera */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-slate-800" />
            <div className="absolute inset-0 rounded-2xl" style={{ backgroundColor: colors.secondary, transform: 'translateZ(-4px)' }} />
          </div>
        </div>
      );
    }

    if (normalizedType.includes('access') || normalizedType.includes('cable') || normalizedType.includes('charger')) {
        return (
          <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
            <div className="w-16 h-16 rounded-xl shadow-xl relative" style={{ backgroundColor: colors.primary, transformStyle: 'preserve-3d' }}>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-2 h-12 bg-slate-300 rounded-full" />
              <div className="absolute inset-0 rounded-xl" style={{ backgroundColor: colors.secondary, transform: 'translateZ(-8px)' }} />
            </div>
          </div>
        );
    }

    if (normalizedType.includes('camera')) {
        return (
          <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
            <div className="w-32 h-20 rounded-lg shadow-2xl relative" style={{ backgroundColor: colors.primary, transformStyle: 'preserve-3d' }}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-4 shadow-inner" style={{ backgroundColor: '#1c1c1e', borderColor: colors.secondary }}>
                 <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-500/40 to-black" />
              </div>
              <div className="absolute -top-2 left-4 w-8 h-2 bg-red-600 rounded-sm" />
              <div className="absolute inset-0 rounded-lg" style={{ backgroundColor: colors.secondary, transform: 'translateZ(-12px)' }} />
            </div>
          </div>
        );
    }

    return (
      <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
        <div className="w-32 h-32 rounded-lg shadow-2xl relative border-2" style={{ backgroundColor: colors.primary, borderColor: colors.secondary, transformStyle: 'preserve-3d' }}>
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
             <div className="w-12 h-12 border-2 border-slate-400 rotate-45" />
          </div>
          <div className="absolute inset-0 rounded-lg" style={{ backgroundColor: colors.secondary, transform: 'translateZ(-20px)' }} />
          <div className="absolute h-full w-20" style={{ right: -10, backgroundColor: colors.primary, transform: 'rotateY(90deg) translateZ(10px)' }} />
          <div className="absolute w-full h-20" style={{ bottom: -10, backgroundColor: colors.secondary, transform: 'rotateX(90deg) translateZ(10px)' }} />
        </div>
      </div>
    );
  };

  const renderStack = () => {
    if (isExpanded) {
      return (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          {renderModel()}
        </div>
      );
    }

    if (!isActive && !isExpanded) {
      return (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          {renderModel()}
        </div>
      );
    }

    const displayCount = isLaptopLike ? 1 : Math.min(quantity || 1, 3);
    const stack = [];

    for (let i = 0; i < displayCount; i++) {
      stack.push(
        <div
          key={i}
          className="absolute inset-0 flex items-center justify-center p-4"
          style={{
            transform: `translateZ(${i * 12}px)`,
            transformStyle: 'preserve-3d',
            opacity: 1 - (i * 0.2)
          }}
        >
          {renderModel()}
        </div>
      );
    }
    return stack;
  };

  const rotateY = useMotionValue(0);
  const rotateX = useMotionValue(0);

  const handlePan = (_: any, info: any) => {
    rotateY.set(rotateY.get() + info.delta.x * 0.8);
    rotateX.set(rotateX.get() - info.delta.y * 0.8);
  };

  return (
    <div className="w-full h-full relative flex items-center justify-center perspective-[1000px] cursor-grab active:cursor-grabbing touch-none">
      <motion.div
        onPan={handlePan}
        style={{
          transformStyle: 'preserve-3d',
          width: isExpanded ? '300px' : '180px',
          height: isExpanded ? '300px' : '180px',
          rotateY,
          rotateX
        }}
        whileHover={{ scale: 1.05 }}
      >
        <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
          {renderStack()}
        </div>
      </motion.div>

      <div className="absolute bottom-4 w-32 h-6 bg-slate-400/20 blur-xl rounded-full pointer-events-none" />

      {isExpanded && (
        <div className="absolute -bottom-2 text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em] opacity-40 select-none pointer-events-none">
          DRAG TO SPIN
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}} />
    </div>
  );
};
