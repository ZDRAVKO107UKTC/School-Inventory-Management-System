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

  const colors = useMemo(() => {
    if (normalizedType.includes('laptop') || normalizedType.includes('macbook')) {
      return {
        primary: '#e3e3e3',
        secondary: '#8e8e93',
        accent: '#1d1d1f'
      };
    }
    if (normalizedType.includes('projector')) {
      return {
        primary: '#f5f5f7',
        secondary: '#d2d2d7',
        accent: '#000000'
      };
    }
    if (normalizedType.includes('tablet') || normalizedType.includes('ipad')) {
      return {
        primary: '#323232',
        secondary: '#1d1d1f',
        accent: '#8e8e93'
      };
    }
    return {
      primary: '#f5f5f7',
      secondary: '#8e8e93',
      accent: '#1d1d1f'
    };
  }, [normalizedType]);

  const renderModel = () => {
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

    return (
      <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
        <div className="w-36 h-48 rounded-2xl border-4 shadow-2xl relative" style={{ backgroundColor: colors.accent, borderColor: colors.primary, transformStyle: 'preserve-3d' }}>
          <div className="absolute inset-2 rounded-xl overflow-hidden" style={{ backgroundColor: colors.secondary }}>
            <div className="w-full h-full bg-gradient-to-tr from-cyan-500/10 to-transparent" />
          </div>
          <div className="absolute inset-0 rounded-2xl" style={{ backgroundColor: colors.primary, transform: 'translateZ(-2px)' }} />
        </div>
      </div>
    );
  };

  const renderStack = () => {
    if (!isActive && !isExpanded) {
      return (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          {renderModel()}
        </div>
      );
    }

    const displayCount = Math.min(quantity || 1, isExpanded ? 5 : 3);
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
