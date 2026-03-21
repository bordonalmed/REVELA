'use client';

import React, { useMemo, useState } from 'react';
import { Image as ImageIcon, Columns2, SlidersHorizontal } from 'lucide-react';
import type { EvolutionImage } from '@/lib/storage';
import { SafeBase64Image } from '@/components/safe-image';
import { ComparisonSlider } from '@/components/comparison-slider';
import { WatermarkedContainer } from '@/components/watermarked-container';

type ViewMode = 'side-by-side' | 'slider';

/** Formata data no padrão dia/mês/ano (DD/MM/AAAA) */
function formatDateDMY(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export interface TreatmentTimelineProps {
  evolutionImages: EvolutionImage[];
  isPremiumUser: boolean;
  onUpgradeClick?: () => void;
  /** Revela A (id do marco selecionado no lado esquerdo) */
  selectedLeftId: string | null;
  /** Revela B (id do marco selecionado no lado direito) */
  selectedRightId: string | null;
  onSelectionChange?: (selection: { leftId: string | null; rightId: string | null }) => void;
}

export function TreatmentTimeline({
  evolutionImages,
  isPremiumUser,
  onUpgradeClick,
  selectedLeftId,
  selectedRightId,
  onSelectionChange,
}: TreatmentTimelineProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');

  const sorted = useMemo(() => {
    return [...(evolutionImages || [])].sort((a, b) => a.date.localeCompare(b.date));
  }, [evolutionImages]);

  const leftMoment = sorted.find((m) => m.id === selectedLeftId) || null;
  const rightMoment = sorted.find((m) => m.id === selectedRightId) || null;
  const bothSelected = !!(leftMoment && rightMoment);

  if (!isPremiumUser) {
    // Faixa removida; botão Revela Evolução pode ser colocado em outro lugar depois
    return null;
  }

  if (!sorted.length) {
    // Estado vazio: um botão discreto em vez da barra grande
    return (
      <div
        className="rounded-lg border px-3 py-2 inline-flex items-center gap-2"
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(148, 163, 184, 0.3)',
          color: '#E8DCC0',
        }}
      >
        <ImageIcon className="w-4 h-4 shrink-0" style={{ opacity: 0.7 }} />
        <span className="text-xs sm:text-sm" style={{ opacity: 0.9 }}>
          Revela Evolução — nenhum registro ainda. Adicione na edição do projeto.
        </span>
      </div>
    );
  }

  const selectStyles: React.CSSProperties = {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderColor: 'rgba(51, 65, 85, 0.9)',
    color: '#E8DCC0',
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Timeline visual */}
      <div
        className="rounded-xl p-4 sm:p-5 border"
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          borderColor: 'rgba(51, 65, 85, 0.9)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-sm sm:text-base font-medium tracking-wide uppercase"
            style={{ color: '#E8DCC0', letterSpacing: '0.15em' }}
          >
            Revela Evolução
          </h3>
          <span className="text-[11px] sm:text-xs" style={{ color: '#94a3b8' }}>
            {sorted.length} registro(s)
          </span>
        </div>

        {/* Timeline dots */}
        <div className="relative flex items-center justify-between py-3 px-2">
          <div
            className="absolute left-2 right-2 top-1/2 h-px -translate-y-1/2"
            style={{ backgroundColor: 'rgba(51, 65, 85, 0.8)' }}
          />
          {sorted.map((moment, idx) => {
            const isLeft = selectedLeftId === moment.id;
            const isRight = selectedRightId === moment.id;
            const isSelected = isLeft || isRight;

            const rawLabel = (moment.label || moment.momentType || '').trim();
            let displayLabel: string;
            if (!rawLabel) {
              displayLabel = `Revela ${idx + 1}`;
            } else {
              const marcoMatch = /^marco\s*(\d+)$/i.exec(rawLabel);
              displayLabel = marcoMatch ? `Revela ${marcoMatch[1]}` : rawLabel;
            }

            return (
              <div key={moment.id} className="relative flex flex-col items-center gap-1.5 z-10">
                <div
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: isSelected ? 'rgba(0, 168, 143, 0.2)' : 'rgba(15, 23, 42, 1)',
                    borderWidth: 2,
                    borderColor: isLeft ? '#22c55e' : isRight ? '#0ea5e9' : 'rgba(148, 163, 184, 0.9)',
                    boxShadow: isSelected ? '0 0 0 2px rgba(56, 189, 248, 0.3)' : 'none',
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: isLeft ? '#22c55e' : isRight ? '#0ea5e9' : '#e5e7eb',
                    }}
                  />
                </div>
                <span
                  className="text-[9px] sm:text-[10px] font-medium whitespace-nowrap"
                  style={{ color: isLeft ? '#22c55e' : isRight ? '#0ea5e9' : '#94a3b8' }}
                >
                  {displayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revela Comparação */}
      <div
        className="rounded-xl p-4 sm:p-5 border space-y-4"
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          borderColor: 'rgba(51, 65, 85, 0.9)',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3
            className="text-sm sm:text-base font-medium tracking-wide uppercase"
            style={{ color: '#E8DCC0', letterSpacing: '0.15em' }}
          >
            Revela Comparação
          </h3>

          {bothSelected && (
            <div
              className="flex items-center gap-1 p-1 rounded-lg"
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(51,65,85,0.9)' }}
            >
              <button
                type="button"
                onClick={() => setViewMode('side-by-side')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  backgroundColor: viewMode === 'side-by-side' ? 'rgba(0,168,143,0.25)' : 'transparent',
                  color: viewMode === 'side-by-side' ? '#E8DCC0' : '#64748b',
                  border: viewMode === 'side-by-side' ? '1px solid rgba(0,168,143,0.4)' : '1px solid transparent',
                }}
              >
                <Columns2 className="w-3.5 h-3.5" />
                Lado a lado
              </button>
              <button
                type="button"
                onClick={() => setViewMode('slider')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  backgroundColor: viewMode === 'slider' ? 'rgba(0,168,143,0.25)' : 'transparent',
                  color: viewMode === 'slider' ? '#E8DCC0' : '#64748b',
                  border: viewMode === 'slider' ? '1px solid rgba(0,168,143,0.4)' : '1px solid transparent',
                }}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Slider
              </button>
            </div>
          )}
        </div>

        {/* Seletores de Marco A e Marco B */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor="select-marco-a"
              className="text-xs font-medium uppercase tracking-[0.16em]"
              style={{ color: '#22c55e' }}
            >
              Revela A
            </label>
            <select
              id="select-marco-a"
              value={selectedLeftId || ''}
              onChange={(e) =>
                onSelectionChange?.({
                  leftId: e.target.value || null,
                  rightId: selectedRightId,
                })
              }
              className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
              style={selectStyles}
            >
              <option value="">Selecione um registro...</option>
              {sorted.map((m, idx) => {
                const rawLabel = (m.label || m.momentType || '').trim();
                const marcoMatch = /^marco\s*(\d+)$/i.exec(rawLabel);
                const label = rawLabel
                  ? marcoMatch
                    ? `Revela ${marcoMatch[1]}`
                    : rawLabel
                  : `Revela ${idx + 1}`;

                return (
                  <option key={m.id} value={m.id} disabled={m.id === selectedRightId}>
                    {label} — {formatDateDMY(m.date)}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="select-marco-b"
              className="text-xs font-medium uppercase tracking-[0.16em]"
              style={{ color: '#0ea5e9' }}
            >
              Revela B
            </label>
            <select
              id="select-marco-b"
              value={selectedRightId || ''}
              onChange={(e) =>
                onSelectionChange?.({
                  leftId: selectedLeftId,
                  rightId: e.target.value || null,
                })
              }
              className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
              style={selectStyles}
            >
              <option value="">Selecione um registro...</option>
              {sorted.map((m, idx) => {
                const rawLabel = (m.label || m.momentType || '').trim();
                const marcoMatch = /^marco\s*(\d+)$/i.exec(rawLabel);
                const label = rawLabel
                  ? marcoMatch
                    ? `Revela ${marcoMatch[1]}`
                    : rawLabel
                  : `Revela ${idx + 1}`;

                return (
                  <option key={m.id} value={m.id} disabled={m.id === selectedLeftId}>
                    {label} — {formatDateDMY(m.date)}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Slider mode */}
        {bothSelected && viewMode === 'slider' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs" style={{ color: '#94a3b8' }}>
              <span style={{ color: '#22c55e' }}>
                {leftMoment!.label || leftMoment!.momentType || 'Revela A'} · {formatDateDMY(leftMoment!.date)}
              </span>
              <span style={{ color: '#0ea5e9' }}>
                {rightMoment!.label || rightMoment!.momentType || 'Revela B'} · {formatDateDMY(rightMoment!.date)}
              </span>
            </div>
            <ComparisonSlider
              beforeImage={leftMoment!.image}
              afterImage={rightMoment!.image}
              beforeLabel={leftMoment!.label || leftMoment!.momentType || 'Revela A'}
              afterLabel={rightMoment!.label || rightMoment!.momentType || 'Revela B'}
              className="rounded-xl overflow-hidden"
              style={{ minHeight: 280 }}
            />
          </div>
        )}

        {/* Side-by-side mode */}
        {(!bothSelected || viewMode === 'side-by-side') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Marco A */}
            <div className="space-y-2">
              <div
                className="relative rounded-lg overflow-hidden border flex items-center justify-center"
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: leftMoment ? 'rgba(34,197,94,0.4)' : 'rgba(51, 65, 85, 0.9)',
                  minHeight: 200,
                }}
              >
                {leftMoment ? (
                  <WatermarkedContainer className="w-full h-full flex items-center justify-center">
                    <SafeBase64Image
                      src={leftMoment.image}
                      alt={leftMoment.label || 'Revela A'}
                      className="w-full h-full object-contain"
                      style={{ maxHeight: 360, display: 'block' }}
                    />
                  </WatermarkedContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <ImageIcon className="w-8 h-8 mb-2" style={{ color: '#4b5563' }} />
                    <p className="text-xs sm:text-sm" style={{ color: '#6b7280' }}>
                      Escolha o Revela A acima
                    </p>
                  </div>
                )}
              </div>
              {leftMoment && (
                <div className="text-xs sm:text-sm space-y-0.5" style={{ color: '#9ca3af' }}>
                  <div className="font-medium" style={{ color: '#E8DCC0' }}>
                    {leftMoment.label || leftMoment.momentType || 'Revela A'}
                  </div>
                  <div>{leftMoment.date.slice(0, 10)}</div>
                </div>
              )}
            </div>

            {/* Marco B */}
            <div className="space-y-2">
              <div
                className="relative rounded-lg overflow-hidden border flex items-center justify-center"
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: rightMoment ? 'rgba(14,165,233,0.4)' : 'rgba(51, 65, 85, 0.9)',
                  minHeight: 200,
                }}
              >
                {rightMoment ? (
                  <WatermarkedContainer className="w-full h-full flex items-center justify-center">
                    <SafeBase64Image
                      src={rightMoment.image}
                      alt={rightMoment.label || 'Revela B'}
                      className="w-full h-full object-contain"
                      style={{ maxHeight: 360, display: 'block' }}
                    />
                  </WatermarkedContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <ImageIcon className="w-8 h-8 mb-2" style={{ color: '#4b5563' }} />
                    <p className="text-xs sm:text-sm" style={{ color: '#6b7280' }}>
                      Escolha o Revela B acima
                    </p>
                  </div>
                )}
              </div>
              {rightMoment && (
                <div className="text-xs sm:text-sm space-y-0.5" style={{ color: '#9ca3af' }}>
                  <div className="font-medium" style={{ color: '#E8DCC0' }}>
                    {rightMoment.label || rightMoment.momentType || 'Revela B'}
                  </div>
                  <div>{formatDateDMY(rightMoment.date)}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
