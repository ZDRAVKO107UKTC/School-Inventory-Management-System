import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Rotate3d } from 'lucide-react';
import { Virtual3DModel } from './Virtual3DModel';
import { ExplosionEffect } from './ExplosionEffect';
import type { Equipment } from '@/types/auth';

interface Props {
  item: Equipment;
  onExpand: (item: Equipment) => void;
  isActive?: boolean;
}

export const EquipmentCard: React.FC<Props> = ({ item, onExpand, isActive = true }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const [isExploding, setIsExploding] = useState(false);
  const prevQuantityRef = useRef<number>(item.quantity);

  useEffect(() => {
    if (prevQuantityRef.current !== 0 && item.quantity === 0) {
      setIsExploding(true);
    }
    prevQuantityRef.current = item.quantity;
  }, [item.quantity]);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['10deg', '-10deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-10deg', '10deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const conditionColors = {
    new: 'bg-[#f5f5f7] text-[#0066cc] border-[#d2d2d7]',
    good: 'bg-[#f5f5f7] text-[#1d1d1f] border-[#d2d2d7]',
    fair: 'bg-[#fff4e5] text-[#b26a00] border-[#ffd180]',
    damaged: 'bg-[#fff1f0] text-[#cf1322] border-[#ffa39e]'
  };

  const conditionClass = conditionColors[item.condition as keyof typeof conditionColors] || conditionColors.good;

  return (
    <ExplosionEffect
      isExploding={isExploding}
      onComplete={() => setIsExploding(false)}
    >
      <motion.div
        layoutId={`equipment-card-${item.id}`}
        ref={cardRef}
        className="relative h-[480px] rounded-[40px] cursor-pointer perspective-1000 origin-center group"
        onClick={() => onExpand(item)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d"
        }}
        whileHover={{ scale: 1.05, zIndex: 10 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div
          className="absolute inset-0 rounded-[32px] overflow-hidden border border-[#d2d2d7] dark:border-[#303030] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] bg-white dark:bg-[#1d1d1f] transition-shadow duration-500 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
        >
          <div className="h-2/3 relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[#f5f5f7]/50 dark:bg-black/20" />
            <div className="relative z-10 w-full h-full transform scale-95 group-hover:scale-105 transition-transform duration-700 ease-out">
              <Virtual3DModel type={item.type} quantity={item.quantity} isActive={isActive} />
            </div>
            <div className="absolute top-5 left-5 bg-white/80 dark:bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-black/5 dark:border-white/10 flex items-center gap-2 z-30">
              <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'available' ? 'bg-[#0066cc]' : 'bg-[#86868b]'}`} />
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#1d1d1f] dark:text-[#f5f5f7]">
                {(item as any).availableQuantity ?? item.quantity} UNITS
              </span>
            </div>
          </div>

          <div className="p-6 flex flex-col justify-between h-1/3">
            <div className="space-y-1">
              <h3 className="font-black text-xl text-slate-900 dark:text-white leading-none tracking-tight">
                {item.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest opacity-70">
                {item.type}
              </p>
            </div>
            <div className="flex items-center justify-between mt-auto">
              <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${conditionClass}`}>
                {item.condition}
              </span>
              <span className="flex items-center gap-1 text-[9px] font-bold text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] transition-colors">
                VIEW DETAIL <Rotate3d className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </ExplosionEffect>
  );
};

export default EquipmentCard;
