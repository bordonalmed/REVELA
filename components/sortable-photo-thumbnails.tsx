'use client';

import { useTr } from '@/contexts/language-context';

import Image from 'next/image';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { useState } from 'react';

interface SortablePhotoThumbnailsProps {
  previews: string[];
  uploadInputId: string;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove: (index: number) => void;
  altPrefix: string;
}

export function SortablePhotoThumbnails({
  previews,
  uploadInputId,
  onReorder,
  onRemove,
  altPrefix,
}: SortablePhotoThumbnailsProps) {
  const tr = useTr();
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const moveOne = (index: number, delta: number) => {
    const toIndex = index + delta;
    if (toIndex < 0 || toIndex >= previews.length) return;
    onReorder(index, toIndex);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragIndex !== null && dragIndex !== toIndex) {
      onReorder(dragIndex, toIndex);
    }
    setDragIndex(null);
  };

  if (previews.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs sm:text-sm" style={{ color: '#E8DCC0', opacity: 0.8 }}>
        {previews.length} {tr('foto(s) selecionada(s)', 'photo(s) selected')}
      </p>
      <div className="flex flex-wrap gap-2">
        {previews.map((src, index) => (
          <div
            key={`${src.slice(0, 32)}-${index}`}
            className={`relative group transition-all ${
              dragIndex === index ? 'opacity-50 scale-95' : ''
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, index)}
          >
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={() => setDragIndex(null)}
              className="cursor-grab active:cursor-grabbing"
              title={tr('Arrastar para reordenar', 'Drag to reorder')}
            >
              <Image
                src={src}
                alt={`${altPrefix} ${index + 1}`}
                width={80}
                height={80}
                unoptimized
                draggable={false}
                className="w-16 h-16 rounded-lg object-cover pointer-events-none select-none"
                style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
              />
              <div
                className="absolute bottom-0 left-0 right-0 flex justify-center py-0.5 rounded-b-lg opacity-70 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
              >
                <GripVertical className="w-3.5 h-3.5" style={{ color: '#E8DCC0' }} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRemove(index)}
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold z-10"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.95)', color: '#fff' }}
              aria-label={tr(`Remover foto ${index + 1}`, `Remove photo ${index + 1}`)}
              title={tr('Remover', 'Remove')}
            >
              ×
            </button>
            <div
              className="absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold z-10"
              style={{ backgroundColor: '#00A88F', color: '#FFFFFF' }}
            >
              {index + 1}
            </div>
            {previews.length > 1 && (
              <div
                className="absolute -bottom-7 left-0 right-0 flex justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveOne(index, -1)}
                  className="p-0.5 rounded disabled:opacity-30 hover:bg-white/10"
                  style={{ color: '#E8DCC0' }}
                  aria-label={tr(`Mover foto ${index + 1} para a esquerda`, `Move photo ${index + 1} left`)}
                  title={tr('Mover para trás', 'Move back')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={index === previews.length - 1}
                  onClick={() => moveOne(index, 1)}
                  className="p-0.5 rounded disabled:opacity-30 hover:bg-white/10"
                  style={{ color: '#E8DCC0' }}
                  aria-label={tr(`Mover foto ${index + 1} para a direita`, `Move photo ${index + 1} right`)}
                  title={tr('Mover para frente', 'Move forward')}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
        <label
          htmlFor={uploadInputId}
          className="w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
          style={{ borderColor: 'rgba(232, 220, 192, 0.3)', backgroundColor: 'rgba(232, 220, 192, 0.03)' }}
          title={tr('Adicionar mais fotos', 'Add more photos')}
        >
          <span className="text-2xl font-light" style={{ color: '#E8DCC0', opacity: 0.7 }}>
            +
          </span>
        </label>
      </div>
      {previews.length > 1 && (
        <p className="text-[10px] mt-6" style={{ color: '#E8DCC0', opacity: 0.5 }}>
          {tr('Arraste a foto ou use as setas ao passar o mouse para reordenar', 'Drag the photo, or hover and use the arrows, to reorder')}
        </p>
      )}
    </div>
  );
}
