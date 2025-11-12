'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BeforeAfterViewerProps {
  beforeImage: string;
  afterImage: string;
  title?: string;
  description?: string;
}

export function BeforeAfterViewer({ 
  beforeImage, 
  afterImage, 
  title,
  description 
}: BeforeAfterViewerProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      setSliderPosition(Math.max(0, Math.min(100, percentage)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="w-full space-y-4">
      {title && (
        <div>
          <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
          {description && (
            <p className="text-slate-600 mt-2">{description}</p>
          )}
        </div>
      )}
      
      <div 
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-lg shadow-lg cursor-ew-resize group"
        onMouseDown={(e) => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const percentage = (x / rect.width) * 100;
          setSliderPosition(Math.max(0, Math.min(100, percentage)));
          setIsDragging(true);
        }}
      >
        {/* After Image */}
        <div className="relative w-full pb-[75%] bg-slate-200">
          <Image 
            src={afterImage} 
            alt="After"
            fill
            unoptimized
            className="object-cover"
          />
        </div>

        {/* Before Image */}
        <div 
          className="absolute top-0 left-0 w-full h-full overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <div className="relative w-full h-full bg-slate-200">
            <Image 
              src={beforeImage} 
              alt="Before"
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        </div>

        {/* Slider */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg transition-opacity group-hover:opacity-100"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="flex flex-col items-center gap-1">
              <svg
                className="w-8 h-8 text-white drop-shadow-lg"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8.5 12l4-4 4 4-4 4-4-4zm7-1h2v2h-2v-2zm-14 0h12v2H1.5v-2z" />
              </svg>
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-6">
            <svg
              className="w-8 h-8 text-white drop-shadow-lg"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8.5 12l4 4 4-4-4-4-4 4zm7-1h2v2h-2v-2zm-14 0h12v2H1.5v-2z" />
            </svg>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-md text-sm font-semibold">
          ANTES
        </div>
        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-md text-sm font-semibold">
          DEPOIS
        </div>
      </div>

      {/* Instructions */}
      <p className="text-center text-sm text-slate-500">
        Arraste a linha para comparar as imagens
      </p>
    </div>
  );
}
