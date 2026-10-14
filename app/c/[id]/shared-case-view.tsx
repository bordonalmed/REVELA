'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { GripVertical } from 'lucide-react';

export interface SharedCaseData {
  before_image_url: string;
  after_image_url: string;
  watermark_enabled: boolean;
  watermark_logo_url: string | null;
}

export function SharedCaseView({ data }: { data: SharedCaseData }) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const updateFromClientX = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updateFromClientX(e.clientX);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    updateFromClientX(e.clientX);
  };
  const handlePointerUp = () => {
    draggingRef.current = false;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#1A2B32' }}>
      <header className="px-4 py-4 flex items-center justify-center">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-light" style={{ color: '#E8DCC0' }}>
            Revela
          </span>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-4 sm:py-8">
        <div
          ref={containerRef}
          className="relative w-full max-w-xl aspect-[3/4] rounded-xl overflow-hidden select-none touch-none"
          style={{ border: '1px solid rgba(232, 220, 192, 0.15)' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.after_image_url}
            alt="Depois"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.before_image_url}
              alt="Antes"
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />
          </div>

          <div
            className="absolute top-0 bottom-0 w-0.5 pointer-events-none"
            style={{ left: `${position}%`, backgroundColor: '#E8DCC0' }}
          >
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#E8DCC0' }}
            >
              <GripVertical className="w-4 h-4" style={{ color: '#1A2B32' }} />
            </div>
          </div>

          <span
            className="absolute top-3 left-3 px-2 py-1 rounded text-[10px] font-semibold tracking-wide"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#E8DCC0' }}
          >
            ANTES
          </span>
          <span
            className="absolute top-3 right-3 px-2 py-1 rounded text-[10px] font-semibold tracking-wide"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#E8DCC0' }}
          >
            DEPOIS
          </span>

          {data.watermark_enabled && data.watermark_logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.watermark_logo_url}
              alt=""
              aria-hidden
              className="absolute bottom-3 right-3 pointer-events-none"
              style={{ width: '18%', height: 'auto', opacity: 0.75 }}
            />
          )}
        </div>

        <p className="mt-4 text-xs sm:text-sm text-center" style={{ color: '#E8DCC0', opacity: 0.6 }}>
          Arraste a linha pra comparar.
        </p>
      </main>

      <footer className="px-4 py-6 text-center">
        <p className="text-xs sm:text-sm mb-3" style={{ color: '#E8DCC0', opacity: 0.7 }}>
          Feito com Revela — comparação de fotos antes e depois para profissionais da saúde.
        </p>
        <Link
          href="/signup"
          className="inline-block px-5 py-2.5 rounded-lg text-sm font-medium"
          style={{ backgroundColor: '#00A88F', color: '#FFFFFF' }}
        >
          Crie o seu grátis
        </Link>
      </footer>
    </div>
  );
}
