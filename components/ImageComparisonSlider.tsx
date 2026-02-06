
import React, { useState, useRef, useEffect } from 'react';

interface ImageComparisonSliderProps {
  original: string;
  enhanced: string;
}

export const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({ original, enhanced }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handleMove = (clientX: number) => {
    if (!containerRef.current || isPanning) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      if (isPanning) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      } else {
        handleMove(e.clientX);
      }
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (isPanning) {
      const dx = e.touches[0].clientX - lastMousePos.current.x;
      const dy = e.touches[0].clientY - lastMousePos.current.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoom * delta, 1), 5);
    setZoom(newZoom);
    if (newZoom === 1) setOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Determine if we are clicking near the slider handle
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const handleX = (sliderPos / 100) * rect.width;
    const clickX = e.clientX - rect.left;
    
    // If zoomed and not clicking the handle, start panning
    if (zoom > 1 && Math.abs(clickX - handleX) > 20) {
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const resetZoom = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // Shared transform style to keep images in sync
  const sharedImageStyle: React.CSSProperties = {
    transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
    transition: isPanning ? 'none' : 'transform 0.1s ease-out'
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden rounded-xl bg-slate-900 select-none group ${zoom > 1 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-ew-resize'}`}
      onMouseMove={onMouseMove}
      onTouchMove={onTouchMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onDoubleClick={resetZoom}
    >
      {/* Before Image (Original) */}
      <img 
        src={original} 
        alt="Original" 
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        style={sharedImageStyle}
      />
      
      {/* After Image (Enhanced with dynamic clip) */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        <img 
          src={enhanced} 
          alt="Enhanced" 
          className="w-full h-full object-contain"
          style={sharedImageStyle}
        />
      </div>

      {/* Comparison Line & Handle */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-white z-10 pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-2xl rounded-full border-4 border-slate-900 flex items-center justify-center transition-transform group-hover:scale-110 pointer-events-auto cursor-ew-resize">
          <div className="flex gap-1">
            <div className="w-1 h-3 bg-slate-900 rounded-full" />
            <div className="w-1 h-3 bg-slate-900 rounded-full" />
          </div>
        </div>
      </div>

      {/* Persistent Visible Badges */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none flex gap-2">
        <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-lg border border-white/20 uppercase tracking-[0.2em] shadow-lg">
          Original
        </span>
        {zoom > 1 && (
          <span className="bg-cyan-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg">
            {Math.round(zoom * 100)}% Zoom
          </span>
        )}
      </div>
      <div className="absolute top-4 right-4 z-20 pointer-events-none">
        <span className="bg-cyan-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)] uppercase tracking-[0.2em]">
          AI Result
        </span>
      </div>

      {/* Interaction Hint (Bottom) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <span className="bg-black/60 backdrop-blur-sm text-white/70 text-[10px] px-3 py-1 rounded-full border border-white/10 uppercase font-medium">
          {zoom > 1 ? 'Drag image to pan • Drag handle to slide • Double-click to reset' : 'Scroll to zoom • Slide to compare'}
        </span>
      </div>
    </div>
  );
};
