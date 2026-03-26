import React, { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Save, RotateCcw, Trash2, Plus } from 'lucide-react';
import { Room, createRoom, updateRoom, deleteRoom } from '../../services/spatialService';
// @ts-ignore
import PolyBool from 'polybooljs';

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

const ROOM_COLORS: Record<string, { fill: string; stroke: string }> = {
  active: { fill: '#0066cc', stroke: '#0066cc' },
  storage: { fill: '#f59e0b', stroke: '#d97706' },
  inactive: { fill: '#64748b', stroke: '#475569' },
};

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
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [zoom, setZoom] = useState(1);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [tempType, setTempType] = useState<'active' | 'storage' | 'inactive'>('active');
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Load points for editing when selected and in draw mode
  React.useEffect(() => {
    if (mode === 'draw' && selectedRoomId) {
      const room = rooms.find(r => r.id === selectedRoomId);
      if (room?.path_data) {
        try {
          setPoints(JSON.parse(room.path_data));
        } catch (e) { console.error('Failed to parse path_data', e); }
      }
    } else if (mode === 'select') {
      setPoints([]);
    }
  }, [selectedRoomId, mode, rooms]);

  const getEventPos = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const getRelativePos = (clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    
    // Get raw coordinate relative to SVG element
    const x = (clientX - CTM.e) / CTM.a;
    const y = (clientY - CTM.f) / CTM.d;

    // Adjust for the <g> transform: translate(panX, panY) scale(zoom)
    // Point_in_world = (Point_on_screen - translate) / scale
    return {
      x: (x - panOffset.x) / zoom,
      y: (y - panOffset.y) / zoom
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (draggingIdx !== null) return;
    
    // Check if we hit a vertex first (for touch)
    if ('touches' in e && mode === 'draw' && isAdmin) {
      const pos = getRelativePos(e.touches[0].clientX, e.touches[0].clientY);
      // Small hit test for vertices
      const idx = points.findIndex(p => Math.abs(p.x - pos.x) < 15 && Math.abs(p.y - pos.y) < 15);
      if (idx !== -1) {
        setDraggingIdx(idx);
        return;
      }
    }

    const pos = getEventPos(e);
    setIsDragging(true);
    lastPos.current = pos;
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getEventPos(e);

    if (draggingIdx !== null && isAdmin) {
      const relPos = getRelativePos(pos.x, pos.y);
      setPoints(prev => {
        const next = [...prev];
        next[draggingIdx] = relPos;
        return next;
      });
      return;
    }

    if (isDragging) {
      const dx = pos.x - lastPos.current.x;
      const dy = pos.y - lastPos.current.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPos.current = pos;
    }
  };

  const handleEnd = () => {
    setDraggingIdx(null);
    setIsDragging(false);
  };

  const handleSvgClick = (e: React.MouseEvent) => {
    if (mode !== 'draw' || !isAdmin || draggingIdx !== null || isDragging) return;
    const pos = getRelativePos(e.clientX, e.clientY);
    setPoints(prev => [...prev, pos]);
  };

  const checkOverlap = (newPoints: {x: number, y: number}[]) => {
    const poly1 = {
      regions: [newPoints.map(p => [p.x, p.y])],
      inverted: false
    };

    for (const room of rooms) {
      if (room.id === selectedRoomId) continue;
      try {
        const otherPts = JSON.parse(room.path_data || '[]');
        if (otherPts.length < 3) continue;
        
        const poly2 = {
          regions: [otherPts.map((p: any) => [p.x, p.y])],
          inverted: false
        };

        const intersection = PolyBool.intersect(poly1, poly2);
        if (intersection.regions.length > 0) return true;
      } catch (e) {
        console.error("Overlap check failed for room", room.id, e);
      }
    }
    return false;
  };

  const handleSaveRoom = async () => {
    if (points.length < 3) return alert('Click at least 3 points to form a room!');

    if (checkOverlap(points)) {
      return alert('Error: Zones cannot overlap! Please adjust the boundaries.');
    }

    const path_data = JSON.stringify(points);

    if (selectedRoomId) {
      // UPDATE EXISTING
      const res = await updateRoom(token, selectedRoomId, { path_data });
      if (res.success) {
        setPoints([]);
        onRoomSelect(null);
        onRefresh();
      } else alert(res.error || 'Failed to update room');
    } else {
      // CREATE NEW
      const name = prompt('Enter Room Name:', `Zone ${rooms.length + 1}`);
      if (!name) return;

      const res = await createRoom(token, {
        floor_id: floorId,
        name,
        path_data,
        type: tempType
      });
      if (res.success) {
        setPoints([]);
        setTempType('active');
        onRoomSelect(null);
        onRefresh();
      } else alert(res.error || 'Failed to save room');
    }
  };

  const handleUpdateEditingRoom = async (updates: Partial<Room>) => {
    if (!editingRoom) return;
    const res = await updateRoom(token, editingRoom.id, updates);
    if (res.success) {
      setEditingRoom(null);
      onRefresh();
    } else alert(res.error || 'Update failed');
  };

  const calculateCentroid = (pathData: string | null) => {
    if (!pathData) return { x: 0, y: 0 };
    try {
      const pts = JSON.parse(pathData);
      if (!Array.isArray(pts) || pts.length === 0) return { x: 0, y: 0 };
      const x = pts.reduce((sum, p) => sum + p.x, 0) / pts.length;
      const y = pts.reduce((sum, p) => sum + p.y, 0) / pts.length;
      return { x, y };
    } catch { return { x: 0, y: 0 }; }
  };

  const renderRooms = useMemo(() => {
    return rooms.map(room => {
      let pts = '';
      try {
        const parsed = room.path_data ? JSON.parse(room.path_data) : [];
        pts = parsed.map((p: any) => `${p.x},${p.y}`).join(' ');
      } catch { return null; }

      const center = calculateCentroid(room.path_data);
      const isSelected = selectedRoomId === room.id;
      const colorSet = ROOM_COLORS[room.type] || ROOM_COLORS.active;

      return (
        <motion.g
          key={room.id}
          whileHover={{ scale: 1.005 }}
          onClick={() => mode === 'select' && onRoomSelect(room.id)}
          className="cursor-pointer group"
        >
          <polygon
            points={pts}
            fill={colorSet.fill}
            fillOpacity={isSelected ? 0.5 : 0.25}
            stroke={isSelected ? colorSet.stroke : colorSet.stroke}
            strokeOpacity={isSelected ? 1 : 0.5}
            strokeWidth={isSelected ? 3 : 1.5}
            className="transition-all duration-300"
          />
          <text
            x={center.x}
            y={center.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className={`text-[9px] font-black pointer-events-none select-none tracking-widest uppercase transition-opacity duration-300 ${isSelected ? 'fill-slate-900 dark:fill-white opacity-100' : 'fill-slate-600 dark:fill-slate-300 opacity-60'}`}
          >
            {room.name}
            {room.type === 'storage' && ' (STORAGE)'}
            {room.type === 'inactive' && ' (INACTIVE)'}
          </text>
        </motion.g>
      );
    });
  }, [rooms, selectedRoomId, mode]);

  return (
    <div className="relative w-full h-full min-h-[400px] bg-[#f8fbff] dark:bg-[#0f172a] rounded-[2rem] border border-[#d2d2d7] dark:border-[#1e293b] overflow-hidden shadow-2xl">
      {/* HUD Toolbar */}
      <div className="absolute top-6 left-6 z-20 space-y-3">
        <div className="flex bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-xl">
          <button onClick={() => setZoom(Math.min(zoom + 0.2, 3))} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"><ZoomIn size={20} /></button>
          <button onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"><ZoomOut size={20} /></button>
        </div>

        {mode === 'draw' && isAdmin && (
          <div className="flex flex-col gap-2 p-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl">
            <button
              onClick={() => {
                onRoomSelect(null);
                setPoints([]);
              }}
              className="p-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 rounded-xl transition-all"
              title="Start New Room"
            >
              <Plus size={20} />
            </button>
            <button
              onClick={() => {
                if (points.length > 0) {
                  setPoints(prev => prev.slice(0, -1));
                }
              }}
              className="p-2.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 rounded-xl transition-all"
              title="Undo Last Point"
            >
              <RotateCcw size={20} />
            </button>
            <button
              onClick={() => {
                if (selectedRoomId) {
                  const room = rooms.find(r => r.id === selectedRoomId);
                  if (room?.path_data) setPoints(JSON.parse(room.path_data));
                } else {
                  setPoints([]);
                }
              }}
              className="p-2.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 rounded-xl transition-all"
              title="Clear Canvas / Revert"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={handleSaveRoom}
              className={`p-2.5 rounded-xl transition-all ${points.length >= 3 ? 'bg-emerald-600 text-white shadow-lg scale-110' : 'text-slate-400'}`}
              title={selectedRoomId ? "Update existing room boundaries" : "Save new custom room"}
            >
              <Save size={20} />
            </button>

            {(selectedRoomId || points.length >= 3) && (
              <div className="flex items-center gap-1.5 ml-2 pl-4 border-l border-slate-200 dark:border-slate-800">
                {(['active', 'storage', 'inactive'] as const).map(t => {
                  const isCurrent = selectedRoomId
                    ? rooms.find(r => r.id === selectedRoomId)?.type === t
                    : tempType === t;

                  return (
                    <button
                      key={t}
                      onClick={() => {
                        if (selectedRoomId) {
                          handleUpdateEditingRoom({ id: selectedRoomId, type: t } as any);
                        } else {
                          setTempType(t);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${isCurrent ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                      title={`${t.charAt(0).toUpperCase() + t.slice(1)} Room`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid meet"
        className={`w-full h-full touch-none ${mode === 'draw' ? 'cursor-crosshair' : (isDragging ? 'cursor-grabbing' : 'cursor-grab')}`}
        onClick={(e) => {
          if (!isDragging) handleSvgClick(e);
        }}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onContextMenu={(e) => { e.preventDefault(); }}
      >
        <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoom})`}>
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#64748b" strokeWidth="0.5" opacity="0.1" />
            </pattern>
            <pattern id="dotGrid" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#64748b" opacity="0.05" />
            </pattern>
          </defs>
          <rect width="2000" height="2000" fill="url(#dotGrid)" />
          <rect width="2000" height="2000" fill="url(#grid)" />

          {renderRooms}

          {points.length > 0 && (
            <g>
              <polyline
                points={points.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#0066cc"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
              {points.map((p, i) => (
                <React.Fragment key={`v-${i}`}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={draggingIdx === i ? 7 : 5}
                    fill={draggingIdx === i ? "#fff" : "#0066cc"}
                    stroke="#fff"
                    strokeWidth="2"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      if (mode === 'draw' && isAdmin) {
                        if (e.altKey) {
                          setPoints(prev => prev.filter((_, k) => k !== i));
                        } else {
                          setDraggingIdx(i);
                        }
                      }
                    }}
                    className="cursor-move shadow-xl transition-all"
                  />
                  {points.length > 1 && draggingIdx === null && (
                    <circle
                      cx={(p.x + points[(i + 1) % points.length].x) / 2}
                      cy={(p.y + points[(i + 1) % points.length].y) / 2}
                      r="3"
                      fill="#fff"
                      stroke="#0066cc"
                      strokeWidth="1"
                      fillOpacity="0.5"
                      className="cursor-pointer hover:fill-[#0066cc] hover:fill-opacity-100 transition-all opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = [...points];
                        const midX = (p.x + points[(i + 1) % points.length].x) / 2;
                        const midY = (p.y + points[(i + 1) % points.length].y) / 2;
                        next.splice(i + 1, 0, { x: midX, y: midY });
                        setPoints(next);
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </g>
          )}
        </g>
      </svg>

      <div className="absolute bottom-6 right-6 px-4 py-2 bg-slate-900/5 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full animate-pulse ${mode === 'draw' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
          {mode === 'draw' ? 'Vector Engine: Live' : 'Precision Selector: Active'}
        </span>
      </div>

    </div>
  );
};
