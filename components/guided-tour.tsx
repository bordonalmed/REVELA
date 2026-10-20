'use client';

/**
 * Tour rápido de primeiro uso: destaca um elemento da tela e mostra um balão explicando.
 * Cada tour aparece uma vez por navegador (localStorage). Os alvos são achados por
 * seletor CSS (ex.: [data-tour="new-project"]); passo sem alvo visível é pulado.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useTr } from '@/contexts/language-context';

export interface TourStep {
  target: string;
  title: string;
  text: string;
}

const PREFIX = 'revela_tour_';

export function isTourDone(id: string): boolean {
  try {
    return localStorage.getItem(PREFIX + id) === 'done';
  } catch {
    return true;
  }
}

function markDone(id: string) {
  try {
    localStorage.setItem(PREFIX + id, 'done');
  } catch {
    /* ignore */
  }
}

/** Faz todos os tours aparecerem de novo (Configurações › Rever o tour). */
export function resetTours() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

function findVisible(selector: string): HTMLElement | null {
  const list = Array.from(document.querySelectorAll<HTMLElement>(selector));
  return (
    list.find((el) => {
      const r = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none';
    }) || null
  );
}

type Rect = { top: number; left: number; width: number; height: number };

export function GuidedTour({ id, steps, delay = 700, enabled = true }: { id: string; steps: TourStep[]; delay?: number; enabled?: boolean }) {
  const tr = useTr();
  const [active, setActive] = useState<TourStep[] | null>(null);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  // Começa depois que a tela montou, só com os passos cujo alvo está visível
  useEffect(() => {
    if (!enabled || isTourDone(id)) return;
    const timer = setTimeout(() => {
      const visible = stepsRef.current.filter((s) => findVisible(s.target));
      if (visible.length) setActive(visible);
    }, delay);
    return () => clearTimeout(timer);
  }, [id, delay, enabled]);

  const step = active?.[index];

  const measure = useCallback(() => {
    if (!step) return;
    const el = findVisible(step.target);
    if (!el) return setRect(null);
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  useLayoutEffect(() => {
    if (!step) return;
    const el = findVisible(step.target);
    el?.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step, measure]);

  const finish = useCallback(() => {
    markDone(id);
    setActive(null);
  }, [id]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && finish();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, finish]);

  if (!active || !step || !rect) return null;

  const last = index === active.length - 1;
  const pad = 6;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 400;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const cardW = Math.min(320, vw - 24);
  const below = rect.top + rect.height + 180 < vh || rect.top < 200;
  const cardTop = below ? rect.top + rect.height + pad + 10 : undefined;
  const cardBottom = below ? undefined : vh - rect.top + pad + 10;
  const cardLeft = Math.min(Math.max(12, rect.left + rect.width / 2 - cardW / 2), vw - cardW - 12);

  return (
    <div className="fixed inset-0 z-[95]" role="dialog" aria-modal="true" aria-label={step.title} data-testid="guided-tour">
      {/* Fundo escuro com "buraco" no elemento destacado */}
      <div
        className="absolute rounded-xl transition-all duration-200 pointer-events-none"
        style={{
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.62)',
          outline: '2px solid #00A88F',
        }}
      />
      {/* Clique fora não fecha sem querer: só os botões */}
      <div className="absolute inset-0" />
      <div
        className="absolute rounded-2xl border p-4 shadow-2xl"
        style={{ top: cardTop, bottom: cardBottom, left: cardLeft, width: cardW, backgroundColor: '#1A2B32', borderColor: 'rgba(0,168,143,0.6)' }}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-base font-medium" style={{ color: '#E8DCC0' }}>{step.title}</p>
          <button onClick={finish} className="p-1 -m-1 rounded-lg hover:bg-white/10" style={{ color: '#94a3b8' }} aria-label={tr('Fechar tour', 'Close tour')}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm mt-1.5" style={{ color: '#E8DCC0', opacity: 0.85 }}>{step.text}</p>
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs" style={{ color: '#94a3b8' }}>
            {active.length > 1 ? `${index + 1} ${tr('de', 'of')} ${active.length}` : ''}
          </span>
          <div className="flex gap-2">
            {!last && (
              <button onClick={finish} className="px-3 py-1.5 rounded-lg text-sm hover:bg-white/10" style={{ color: '#94a3b8' }}>
                {tr('Pular', 'Skip')}
              </button>
            )}
            <button
              onClick={() => (last ? finish() : setIndex(index + 1))}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: '#00A88F', color: '#fff' }}
              autoFocus
            >
              {last ? tr('Entendi', 'Got it') : tr('Próximo', 'Next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
