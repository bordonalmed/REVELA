'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

interface ComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function ComparisonSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'ANTES',
  afterLabel = 'DEPOIS',
  className = '',
  style = {},
}: ComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50); // 0-100%
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateSliderPosition(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      updateSliderPosition(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      updateSliderPosition(e.touches[0].clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      e.preventDefault();
      updateSliderPosition(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const updateSliderPosition = (clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  // Adicionar event listeners globais para mouse
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        updateSliderPosition(e.clientX);
      };
      
      const handleGlobalMouseUp = () => {
        setIsDragging(false);
      };

      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Imagem DEPOIS (fundo) */}
      <div className="absolute inset-0">
        <img
          src={afterImage}
          alt={afterLabel}
          className="w-full h-full object-contain"
          draggable={false}
        />
        {/* Label DEPOIS */}
        <div 
          className="absolute top-2 right-2 px-3 py-1 rounded-lg bg-black/50 text-sm font-medium"
          style={{ color: '#FFFFFF' }}
        >
          {afterLabel}
        </div>
      </div>

      {/* Imagem ANTES (sobreposta, cortada pelo slider) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
        }}
      >
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="w-full h-full object-contain"
          draggable={false}
        />
        {/* Label ANTES */}
        <div 
          className="absolute top-2 left-2 px-3 py-1 rounded-lg bg-black/50 text-sm font-medium"
          style={{ color: '#FFFFFF' }}
        >
          {beforeLabel}
        </div>
      </div>

      {/* Slider Handle */}
      <div
        ref={sliderRef}
        className="absolute top-0 bottom-0 w-1 cursor-ew-resize z-10"
        style={{
          left: `${sliderPosition}%`,
          transform: 'translateX(-50%)',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Linha vertical */}
        <div 
          className="absolute inset-y-0 left-1/2 w-0.5"
          style={{ 
            backgroundColor: '#FFFFFF',
            boxShadow: '0 0 4px rgba(0, 0, 0, 0.5)'
          }}
        />
        
        {/* Handle circular */}
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}
        >
          <GripVertical className="w-5 h-5" style={{ color: '#1A2B32' }} />
        </div>
      </div>

      {/* Instrução (aparece ao passar o mouse) */}
      <div 
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg bg-black/50 opacity-0 hover:opacity-100 transition-opacity text-xs pointer-events-none"
        style={{ color: '#FFFFFF' }}
      >
        Arraste a barra para comparar
      </div>
    </div>
  );
}

