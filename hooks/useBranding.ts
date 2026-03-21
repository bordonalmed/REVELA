import { useEffect, useMemo, useState } from 'react';
import { resolveEffectiveBranding, type EffectiveBranding } from '@/lib/branding';
import { usePlan } from '@/hooks/usePlan';

export function useBranding(ownerEmail?: string | null): EffectiveBranding {
  const { hasProAccess } = usePlan();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key.startsWith('revela_branding:') || e.key === 'revela_clinic_logo') {
        setTick((t) => t + 1);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return useMemo(() => {
    // tick forces recalculation after updates
    void tick;
    return resolveEffectiveBranding({ ownerEmail, hasProAccess });
  }, [ownerEmail, hasProAccess, tick]);
}

