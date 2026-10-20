'use client';

/**
 * Barra de ações do projeto aberto.
 * - Celular: fixa embaixo, com as 4 ações principais + "Mais".
 * - Computador/tablet: barra flutuante com todas as ações e seus nomes.
 */

import React, { useEffect, useState } from 'react';
import { MoreHorizontal, X } from 'lucide-react';
import { useTr } from '@/contexts/language-context';

export interface ToolbarAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  /** Aparece direto na barra do celular (as demais vão para "Mais") */
  primary?: boolean;
  active?: boolean;
  disabled?: boolean;
  /** Pontinho indicando conteúdo (ex.: projeto com notas) */
  dot?: boolean;
  hint?: string;
}

const TEAL = '#00A88F';
const CREAM = '#E8DCC0';

export function ProjectToolbar({ actions }: { actions: ToolbarAction[] }) {
  const tr = useTr();
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = actions.filter((a) => a.primary);
  const secondary = actions.filter((a) => !a.primary);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMoreOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  const run = (a: ToolbarAction) => {
    setMoreOpen(false);
    a.onClick();
  };

  return (
    <>
      {/* Espaço para a barra não cobrir o fim da página */}
      <div className="h-24 sm:h-20" aria-hidden />

      {/* Computador / tablet */}
      <nav
        className="hidden sm:flex fixed bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-2rem)] overflow-x-auto items-center gap-1 p-1.5 rounded-2xl border shadow-2xl"
        style={{ backgroundColor: 'rgba(20, 34, 40, 0.92)', borderColor: 'rgba(232,220,192,0.15)', backdropFilter: 'blur(12px)' }}
        aria-label={tr('Ações do projeto', 'Project actions')}
        data-testid="project-toolbar"
        data-tour="project-toolbar"
      >
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => run(a)}
            disabled={a.disabled}
            title={a.hint || a.label}
            className="relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors hover:bg-white/10 disabled:opacity-40"
            style={{ color: a.active ? '#fff' : CREAM, backgroundColor: a.active ? 'rgba(0,168,143,0.35)' : undefined }}
          >
            {a.icon}
            <span>{a.label}</span>
            {a.dot && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TEAL }} />}
          </button>
        ))}
      </nav>

      {/* Celular */}
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t grid"
        style={{
          gridTemplateColumns: `repeat(${primary.length + (secondary.length ? 1 : 0)}, minmax(0, 1fr))`,
          backgroundColor: 'rgba(20, 34, 40, 0.97)',
          borderColor: 'rgba(232,220,192,0.15)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          backdropFilter: 'blur(12px)',
        }}
        aria-label={tr('Ações do projeto', 'Project actions')}
        data-tour="project-toolbar"
      >
        {primary.map((a) => (
          <button
            key={a.id}
            onClick={() => run(a)}
            disabled={a.disabled}
            className="relative flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium active:bg-white/10 disabled:opacity-40"
            style={{ color: a.active ? TEAL : CREAM }}
          >
            {a.icon}
            <span className="truncate max-w-full px-1">{a.label}</span>
          </button>
        ))}
        {secondary.length > 0 && (
          <button
            onClick={() => setMoreOpen(true)}
            className="relative flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium active:bg-white/10"
            style={{ color: CREAM }}
            aria-haspopup="dialog"
            data-tour="toolbar-more"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span>{tr('Mais', 'More')}</span>
            {secondary.some((a) => a.dot || a.active) && <span className="absolute top-2 right-[30%] w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TEAL }} />}
          </button>
        )}
      </nav>

      {/* Folha "Mais" (celular) */}
      {moreOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex items-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setMoreOpen(false)}>
          <div
            role="dialog"
            aria-label={tr('Mais ações', 'More actions')}
            className="w-full rounded-t-2xl border-t p-3"
            style={{ backgroundColor: '#1A2B32', borderColor: 'rgba(232,220,192,0.15)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2 pb-2">
              <span className="text-sm font-medium" style={{ color: CREAM }}>{tr('Mais ações', 'More actions')}</span>
              <button onClick={() => setMoreOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: '#94a3b8' }} aria-label={tr('Fechar', 'Close')}>
                <X className="w-5 h-5" />
              </button>
            </div>
            {secondary.map((a) => (
              <button
                key={a.id}
                onClick={() => run(a)}
                disabled={a.disabled}
                className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-left active:bg-white/10 disabled:opacity-40"
                style={{ color: a.active ? TEAL : CREAM }}
              >
                {a.icon}
                <span className="flex-1">
                  <span className="block text-sm">{a.label}</span>
                  {a.hint && <span className="block text-xs mt-0.5" style={{ color: '#94a3b8' }}>{a.hint}</span>}
                </span>
                {a.dot && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TEAL }} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
