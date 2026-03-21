'use client';

import type { ReactNode } from 'react';
import { useBranding } from '@/hooks/useBranding';

export function WatermarkedContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const branding = useBranding();

  return (
    <div className={`relative ${className ?? ''}`}>
      {children}

      {branding.watermarkEnabled && (
        <img
          src={branding.watermarkLogoDataUrl}
          alt="Marca d'água Revela"
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '0.5rem', // ~bottom-2
            right: '0.5rem', // ~right-2
            width: '18%',
            height: 'auto',
            opacity: 0.75,
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
}

