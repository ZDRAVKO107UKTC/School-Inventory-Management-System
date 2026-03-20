import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isExploding: boolean;
  onComplete: () => void;
  children: React.ReactNode;
}

export const ExplosionEffect: React.FC<Props> = ({ isExploding, onComplete, children }) => {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    if (isExploding) {
      const newParticles = Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 600,
        y: (Math.random() - 0.5) * 600,
        scale: Math.random() * 2.5 + 0.5,
        rotation: Math.random() * 360,
      }));
      setParticles(newParticles);
      
      const timer = setTimeout(() => {
        onComplete();
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setParticles([]);
    }
  }, [isExploding, onComplete]);

  return (
    <div className="relative w-full">
      <AnimatePresence>
        {!isExploding && (
          <motion.div
            key="content"
            initial={{ opacity: 1, scale: 1 }}
            exit={{ 
              opacity: 0, 
              scale: 1.2, 
              filter: 'blur(8px)',
              rotate: (Math.random() - 0.5) * 10
            }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
      
      {isExploding && particles.map((p) => (
        <motion.div
          key={`particle-${p.id}`}
          className="absolute inset-0 m-auto w-4 h-4 rounded-full z-[100] pointer-events-none mix-blend-overlay"
          initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, scale: p.scale, opacity: [1, 0.8, 0], rotate: p.rotation }}
          transition={{ duration: 0.6 + Math.random() * 0.4, ease: "easeOut" }}
          style={{ 
            backgroundColor: ['#ef4444', '#f97316', '#eab308', '#dc2626'][Math.floor(Math.random() * 4)],
            boxShadow: '0 0 20px 2px currentColor'
          }}
        />
      ))}
    </div>
  );
};
