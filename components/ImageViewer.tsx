
import React, { useState, useRef, useEffect } from 'react';
import { DownloadIcon } from './Icons';

interface ImageViewerProps {
  title: string;
  src: string;
  isEnhanced?: boolean;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ title, src, isEnhanced = false }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoom * delta, 1), 5);
    setZoom(newZoom);
    if (newZoom === 1) setOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetZoom = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full group overflow-hidden rounded-xl bg-slate-900/50 ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={resetZoom}
    >
      <img 
        src={src} 
        alt={title} 
        className="w-full h-full object-contain pointer-events-none transition-transform duration-75 ease-out" 
        style={{ 
          transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)` 
        }}
      />
      
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-center justify-center">
        {isEnhanced && (
          <a
            href={src}
            download="enhanced-image.jpg"
            className="flex items-center gap-2 bg-cyan-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-cyan-600 transition-colors pointer-events-auto"
          >
            <DownloadIcon className="w-5 h-5" />
            Download
          </a>
        )}
      </div>

      <div className="absolute top-2 left-2 flex gap-2 pointer-events-none">
        <div className="bg-slate-900/50 text-white text-xs font-semibold px-2 py-1 rounded-full backdrop-blur-sm">
          {title}
        </div>
        {zoom > 1 && (
          <div className="bg-cyan-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
            {Math.round(zoom * 100)}% Zoom
          </div>
        )}
      </div>

      {zoom > 1 && (
        <div className="absolute bottom-2 right-2 bg-slate-900/80 text-[10px] text-white/50 px-2 py-1 rounded-full backdrop-blur-sm pointer-events-none">
          Double-click to reset
        </div>
      )}
    </div>
  );
};
