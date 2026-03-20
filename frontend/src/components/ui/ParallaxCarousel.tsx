import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EquipmentCard } from './EquipmentCard';

interface Props {
  items: any[];
  onExpand: (item: any) => void;
}

export const ParallaxCarousel: React.FC<Props> = ({ items, onExpand }) => {
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setIndex(0);
  }, [items.length, items[0]?.id]);

  const handleNext = () => {
    if (index < items.length - 1) setIndex(index + 1);
  };

  const handlePrev = () => {
    if (index > 0) setIndex(index - 1);
  };

  const handlePanEnd = (_: any, info: any) => {
    const threshold = 30;
    if (info.offset.x < -threshold) handleNext();
    else if (info.offset.x > threshold) handlePrev();
  };

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden perspective-2000"
      onPanEnd={handlePanEnd}
      onWheel={(e) => {
        if (e.deltaY > 0) handleNext();
        else handlePrev();
      }}
    >

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            backgroundColor: items[index]?.status === 'available' ? 'rgba(0, 102, 204, 0.05)' : 'rgba(142, 142, 147, 0.05)',
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] blur-[120px] rounded-full"
        />
      </div>

      <div className="relative w-full h-[600px] flex items-center justify-center preserve-3d">
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((item, i) => {
            const position = i - index;
            const absPosition = Math.abs(position);

            const isRendered = absPosition <= 2;
            if (!isRendered) return null;

            return (
              <motion.div
                key={`${item.name}-${item.type}`}
                initial={{ opacity: 0, scale: 0.5, z: -1000, x: position * 400 }}
                animate={{
                  opacity: absPosition > 2 ? 0 : 1 - (absPosition * 0.3),
                  scale: 1 - (absPosition * 0.15),
                  x: position * 220 + (Math.sign(position) * position * position * 15),
                  z: absPosition * -500,
                  rotateY: position * -40,
                  filter: `blur(${Math.max(0, absPosition * 2)}px)`,
                  zIndex: items.length - absPosition,
                }}
                exit={{ opacity: 0, scale: 0.5, z: -1000 }}
                transition={{
                  type: "spring",
                  stiffness: 120,
                  damping: 20,
                  mass: 1.5,
                  filter: { type: "tween", ease: "easeInOut", duration: 0.3 }
                }}
                style={{
                  position: 'absolute',
                  transformStyle: 'preserve-3d',
                }}
                className="w-72 sm:w-80"
              >
                <EquipmentCard
                  item={item}
                  onExpand={onExpand}
                  isActive={absPosition === 0}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-30">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-1 rounded-full transition-all duration-500 ${i === index ? 'bg-[#1d1d1f] dark:bg-[#f5f5f7] w-6' : 'bg-[#d2d2d7] dark:bg-[#303030] w-1'
              }`}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default ParallaxCarousel;
