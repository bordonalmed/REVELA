'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

export function ZoomableImage({ src, alt, className = '', style = {} }: ZoomableImageProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const minScale = 1;
  const maxScale = 5;
  const zoomStep = 0.25;

  // Calcular tamanho da imagem para caber no container (object-fit: contain)
  useEffect(() => {
    const updateSizes = () => {
      if (!containerRef.current || !imageRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const img = imageRef.current;
      
      if (img.complete && img.naturalWidth && img.naturalHeight) {
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        const imageAspect = img.naturalWidth / img.naturalHeight;
        const containerAspect = containerWidth / containerHeight;

        let displayWidth: number;
        let displayHeight: number;

        if (imageAspect > containerAspect) {
          // Imagem é mais larga - ajustar pela largura
          displayWidth = containerWidth;
          displayHeight = containerWidth / imageAspect;
        } else {
          // Imagem é mais alta - ajustar pela altura
          displayHeight = containerHeight;
          displayWidth = containerHeight * imageAspect;
        }

        setContainerSize({ width: containerWidth, height: containerHeight });
        setImageSize({ width: displayWidth, height: displayHeight });
      }
    };

    const img = imageRef.current;
    if (img) {
      if (img.complete) {
        updateSizes();
      } else {
        img.onload = updateSizes;
      }
    }

    const resizeObserver = new ResizeObserver(updateSizes);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateSizes);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSizes);
      if (img) {
        img.onload = null;
      }
    };
  }, [src]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + zoomStep, maxScale));
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - zoomStep, minScale);
      if (newScale === minScale) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!containerRef.current) return;
    
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(scale + delta, minScale), maxScale);
    
    if (newScale !== scale) {
      // Zoom em direção ao cursor
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const scaleChange = newScale / scale;
      setPosition(prev => ({
        x: x - (x - prev.x) * scaleChange,
        y: y - (y - prev.y) * scaleChange,
      }));
      
      setScale(newScale);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch events para mobile
  const [touchStart, setTouchStart] = useState<{ distance: number; center: { x: number; y: number } } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };
      setTouchStart({ distance, center });
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStart) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      const scaleChange = distance / touchStart.distance;
      const newScale = Math.min(Math.max(scale * scaleChange, minScale), maxScale);
      
      if (newScale !== scale) {
        const center = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        };
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const x = center.x - rect.left;
          const y = center.y - rect.top;
          
          const scaleFactor = newScale / scale;
          setPosition(prev => ({
            x: x - (x - prev.x) * scaleFactor,
            y: y - (y - prev.y) * scaleFactor,
          }));
        }
        
        setScale(newScale);
        setTouchStart({ distance, center });
      }
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      e.preventDefault();
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchStart(null);
  };

  // Reset position when scale is 1
  useEffect(() => {
    if (scale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  // Calcular posição inicial para centralizar a imagem
  const getImageStyle = () => {
    if (!imageSize || !containerSize) {
      return {
        maxWidth: '100%',
        maxHeight: '100%',
        width: 'auto',
        height: 'auto',
        objectFit: 'contain' as const,
        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
        transformOrigin: 'center center',
        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        willChange: 'transform',
      };
    }

    const centerX = (containerSize.width - imageSize.width) / 2;
    const centerY = (containerSize.height - imageSize.height) / 2;

    return {
      width: `${imageSize.width}px`,
      height: `${imageSize.height}px`,
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`,
      transformOrigin: 'center center',
      transition: isDragging ? 'none' : 'transform 0.1s ease-out',
      willChange: 'transform',
    };
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden flex items-center justify-center ${className}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        ...style,
        cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
        touchAction: 'none',
      }}
    >
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className="select-none"
        style={getImageStyle()}
        draggable={false}
      />
      
      {/* Controles de Zoom */}
      {scale > 1 && (
        <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-all"
            style={{ color: '#FFFFFF' }}
            title="Resetar zoom"
            aria-label="Resetar zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      )}
      
      <div className="absolute bottom-2 right-2 flex flex-col gap-2 z-10">
        <button
          onClick={handleZoomIn}
          disabled={scale >= maxScale}
          className="p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ color: '#FFFFFF' }}
          title="Zoom in (+)"
          aria-label="Aumentar zoom"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          disabled={scale <= minScale}
          className="p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ color: '#FFFFFF' }}
          title="Zoom out (-)"
          aria-label="Diminuir zoom"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>
      
      {/* Indicador de Zoom */}
      {scale > 1 && (
        <div 
          className="absolute top-2 left-2 px-2 py-1 rounded bg-black/50 text-xs"
          style={{ color: '#FFFFFF' }}
        >
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  );
}

