import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Room, createRoom } from '../../services/spatialService';

interface FloorPlanMapProps {
  floorId: number;
  rooms: Room[];
  isAdmin: boolean;
  token: string;
  onRoomSelect: (roomId: number | null) => void;
  selectedRoomId: number | null;
  onRefresh: () => void;
  mode: 'select' | 'draw';
}

export const FloorPlanMap: React.FC<FloorPlanMapProps> = ({
  floorId,
  rooms,
  isAdmin,
  token,
  onRoomSelect,
  selectedRoomId,
  onRefresh,
  mode
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);

  const getMousePos = (e: React.MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    return {
      x: (e.clientX - CTM.e) / CTM.a,
      y: (e.clientY - CTM.f) / CTM.d
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode !== 'draw' || !isAdmin) return;
    setIsDrawing(true);
    const pos = getMousePos(e);
    setStartPos(pos);
    setCurrentRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentRect) return;
    const pos = getMousePos(e);
    setCurrentRect({
      x: Math.min(pos.x, startPos.x),
      y: Math.min(pos.y, startPos.y),
      w: Math.abs(pos.x - startPos.x),
      h: Math.abs(pos.y - startPos.y)
    });
  };

  const handleMouseUp = async () => {
    if (!isDrawing || !isAdmin || !currentRect) return;
    setIsDrawing(false);
    
    if (floorId <= 0) {
      alert('Please select or create a floor first!');
      setCurrentRect(null);
      return;
    }

    if (currentRect.w > 10 && currentRect.h > 10) {
      const name = prompt('Enter Room Name:', `Room ${rooms.length + 1}`);
      if (name) {
        const res = await createRoom(token, {
          floor_id: floorId,
          name,
          x: Math.round(currentRect.x),
          y: Math.round(currentRect.y),
          width: Math.round(currentRect.w),
          height: Math.round(currentRect.h)
        });
        if (res.success) {
          onRefresh();
        } else {
          alert(`Failed to save room: ${res.error || 'Server error'}`);
        }
      }
    }
    setCurrentRect(null);
  };

  return (
    <div className="relative w-full aspect-[16/9] bg-white dark:bg-[#1d1d1f] rounded-2xl border border-[#d2d2d7] dark:border-[#303030] overflow-hidden shadow-sm">
      {/* Toolbar - Only Zoom for all users */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-md p-1.5 rounded-xl border border-[#d2d2d7] dark:border-[#303030] flex flex-col gap-1 shadow-lg">
          <button onClick={() => setZoom(z => Math.min(z + 0.2, 3))} className="p-2 hover:bg-[#f5f5f7] dark:hover:bg-[#2c2c2e] rounded-lg transition-all">
            <ZoomIn size={18} />
          </button>
          <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="p-2 hover:bg-[#f5f5f7] dark:hover:bg-[#2c2c2e] rounded-lg transition-all">
            <ZoomOut size={18} />
          </button>
        </div>
      </div>

      <svg 
        ref={svgRef}
        viewBox={`0 0 ${800 / zoom} ${450 / zoom}`}
        className={`w-full h-full touch-none ${mode === 'draw' ? 'cursor-crosshair' : 'cursor-default'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <g transform={`scale(${zoom})`}>
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#86868b" strokeWidth="0.5" opacity="0.1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Rooms */}
          {rooms.map(room => (
            <motion.g 
              key={room.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => mode === 'select' && onRoomSelect(room.id)}
              className="cursor-pointer group"
            >
              <rect 
                x={room.x || 0}
                y={room.y || 0}
                width={room.width || 0}
                height={room.height || 0}
                fill={selectedRoomId === room.id ? '#0066cc' : '#f5f5f7'}
                fillOpacity={selectedRoomId === room.id ? 0.2 : 0.4}
                stroke={selectedRoomId === room.id ? '#0066cc' : '#86868b'}
                strokeWidth={selectedRoomId === room.id ? 2 : 1}
                rx={4}
                className="transition-all duration-300"
              />
              <text 
                x={(room.x || 0) + (room.width || 0) / 2}
                y={(room.y || 0) + (room.height || 0) / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className={`text-[8px] font-bold select-none pointer-events-none fill-[#1d1d1f] dark:fill-[#f5f5f7] ${selectedRoomId === room.id ? 'opacity-100' : 'opacity-60'}`}
              >
                {room.name}
              </text>
            </motion.g>
          ))}

          {/* Current drawing rect */}
          {currentRect && (
            <rect 
              x={currentRect.x}
              y={currentRect.y}
              width={currentRect.w}
              height={currentRect.h}
              fill="#0066cc"
              fillOpacity={0.1}
              stroke="#0066cc"
              strokeWidth={2}
              strokeDasharray="4 2"
              rx={4}
            />
          )}
        </g>
      </svg>

      {/* Role Indicator */}
      <div className="absolute bottom-4 right-4 px-3 py-1 bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-md rounded-full border border-[#d2d2d7] dark:border-[#303030] text-[10px] font-bold text-[#86868b]">
        {isAdmin ? 'Admin View: Design Active' : 'Viewer Mode: Selective Filtering'}
      </div>
    </div>
  );
};
