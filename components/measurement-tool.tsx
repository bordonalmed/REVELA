'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Ruler, X, Save, Crosshair, AlertTriangle, CheckCircle2 } from 'lucide-react';

import type { Measurement } from '@/lib/storage';
import { formatCm as formatCmLocale } from '@/lib/measurements';
import { useLanguage } from '@/contexts/language-context';

interface MeasurementToolProps {
  imageSrc: string;
  imageType: 'before' | 'after';
  imageIndex: number;
  measurements: Measurement[];
  onMeasurementsChange: (measurements: Measurement[]) => void;
  onClose: () => void;
  className?: string;
}

type Mode = 'idle' | 'measure' | 'calibrate';
// Linha em coordenadas normalizadas (0 a 1 da largura/altura da foto)
type Line = { x1: number; y1: number; x2: number; y2: number };

const COLOR_MEASURE = '#00A88F';
const COLOR_CALIBRATION = '#FFD700';
const COLOR_DRAFT = '#FFFFFF';
const MIN_DRAG_SCREEN_PX = 8;

const panelStyle: React.CSSProperties = {
  backgroundColor: 'rgba(27, 60, 69, 0.95)',
  borderColor: 'rgba(232, 220, 192, 0.2)',
};
const inputStyle: React.CSSProperties = {
  backgroundColor: 'rgba(232, 220, 192, 0.1)',
  borderColor: 'rgba(232, 220, 192, 0.2)',
  color: '#E8DCC0',
};

const newId = () => `measure_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

export function MeasurementTool({
  imageSrc,
  imageType,
  imageIndex,
  measurements,
  onMeasurementsChange,
  onClose,
  className = '',
}: MeasurementToolProps) {
  const [mode, setMode] = useState<Mode>('idle');
  const [draft, setDraft] = useState<Line | null>(null);
  const [pending, setPending] = useState<{ line: Line; kind: 'measure' | 'calibrate' } | null>(null);
  const [labelInput, setLabelInput] = useState('');
  const [cmInput, setCmInput] = useState('');
  const [cmError, setCmError] = useState('');
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [displayWidth, setDisplayWidth] = useState(0);
  const imageRef = useRef<HTMLImageElement>(null);
  const { t: tr, language } = useLanguage();
  const mt = tr.measure;
  const formatCm = (cm: number) => formatCmLocale(cm, language);

  // Tamanho real da foto + largura exibida (para manter traços e textos legíveis em qualquer tela)
  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;
    setNatural(null);
    const onLoad = () => {
      setNatural({ w: image.naturalWidth, h: image.naturalHeight });
      setDisplayWidth(image.clientWidth);
    };
    if (image.complete && image.naturalWidth > 0) onLoad();
    else image.addEventListener('load', onLoad);
    const observer = new ResizeObserver(() => setDisplayWidth(image.clientWidth));
    observer.observe(image);
    return () => {
      image.removeEventListener('load', onLoad);
      observer.disconnect();
    };
  }, [imageSrc]);

  const closePending = () => {
    setPending(null);
    setLabelInput('');
    setCmInput('');
    setCmError('');
  };

  // Esc cancela a medição em andamento / fecha
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (pending) closePending();
      else if (mode !== 'idle') { setMode('idle'); setDraft(null); }
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending, mode, onClose]);

  const W = natural?.w ?? 1;
  const H = natural?.h ?? 1;
  // Fator: 1 px de tela = k unidades do desenho (pixels da foto)
  const k = displayWidth > 0 ? W / displayWidth : 1;

  const thisImage = measurements.filter(m => m.imageType === imageType && m.imageIndex === imageIndex);
  const calibration = thisImage.find(m => m.isCalibration && m.coordSpace === 'normalized');
  const lines = thisImage.filter(m => !m.isCalibration);

  // Comprimento em pixels da foto original
  const lengthPx = (l: Line) => Math.hypot((l.x2 - l.x1) * W, (l.y2 - l.y1) * H);
  const toLine = (m: Measurement): Line => ({ x1: m.startX, y1: m.startY, x2: m.endX, y2: m.endY });

  const pxPerCm =
    calibration && calibration.calibrationCm && natural
      ? lengthPx(toLine(calibration)) / calibration.calibrationCm
      : null;

  const formatLength = (l: Line) =>
    pxPerCm ? formatCm(lengthPx(l) / pxPerCm) : `${Math.round(lengthPx(l))} px`;

  const valueOf = (m: Measurement): string => {
    if (m.coordSpace !== 'normalized') return `${Math.round(m.length ?? 0)} px (${mt.legacy})`;
    return formatLength(toLine(m));
  };

  // Medidas antigas foram salvas em pixels da tela: converte para o desenho atual
  const drawLineOf = (m: Measurement): Line => {
    if (m.coordSpace === 'normalized') return toLine(m);
    return { x1: (m.startX * k) / W, y1: (m.startY * k) / H, x2: (m.endX * k) / W, y2: (m.endY * k) / H };
  };

  // ─── Desenho com dedo / caneta / mouse ───────────────────────────────

  const pointFromEvent = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    return {
      x: clamp((e.clientX - rect.left) / rect.width),
      y: clamp((e.clientY - rect.top) / rect.height),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (mode === 'idle' || !natural) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = pointFromEvent(e);
    setDraft({ x1: x, y1: y, x2: x, y2: y });
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draft) return;
    const { x, y } = pointFromEvent(e);
    setDraft({ ...draft, x2: x, y2: y });
  };

  const handlePointerUp = () => {
    if (!draft || mode === 'idle') return;
    if (lengthPx(draft) / k >= MIN_DRAG_SCREEN_PX) {
      setPending({ line: draft, kind: mode });
      setLabelInput('');
      setCmInput('');
      setCmError('');
    }
    setDraft(null);
  };

  // ─── Salvar ─────────────────────────────────────────────────────────

  const baseFromLine = (l: Line) => ({
    id: newId(),
    imageType,
    imageIndex,
    startX: l.x1,
    startY: l.y1,
    endX: l.x2,
    endY: l.y2,
    length: lengthPx(l),
    coordSpace: 'normalized' as const,
  });

  const handleSaveMeasurement = () => {
    if (!pending) return;
    const m: Measurement = { ...baseFromLine(pending.line), label: labelInput.trim() || undefined };
    onMeasurementsChange([...measurements, m]);
    closePending();
  };

  const handleSaveCalibration = () => {
    if (!pending) return;
    const cm = Number(cmInput.trim().replace(',', '.'));
    if (!Number.isFinite(cm) || cm <= 0) {
      setCmError(mt.realSizeError);
      return;
    }
    const m: Measurement = { ...baseFromLine(pending.line), isCalibration: true, calibrationCm: cm };
    // Uma calibração por foto: substitui a anterior
    const others = measurements.filter(
      x => !(x.isCalibration && x.imageType === imageType && x.imageIndex === imageIndex)
    );
    onMeasurementsChange([...others, m]);
    closePending();
    setMode('measure');
  };

  const handleDelete = (id: string) => {
    onMeasurementsChange(measurements.filter(m => m.id !== id));
  };

  const toggleMode = (target: Exclude<Mode, 'idle'>) => {
    setMode(mode === target ? 'idle' : target);
    setDraft(null);
  };

  // ─── Render ─────────────────────────────────────────────────────────

  const renderLine = (l: Line, color: string, text: string, key: string, dashed = false) => {
    const x1 = l.x1 * W, y1 = l.y1 * H, x2 = l.x2 * W, y2 = l.y2 * H;
    const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;
    // Linha mais vertical: texto ao lado (direita, ou esquerda perto da borda).
    // Mais horizontal: texto acima (ou abaixo perto do topo). Evita sobrepor medidas cruzadas.
    const isVertical = Math.abs(y2 - y1) > Math.abs(x2 - x1);
    const gap = 10 * k;
    let textX = midX, textY = midY, anchor: 'start' | 'middle' | 'end' = 'middle';
    if (isVertical) {
      const nearRight = midX > W - 120 * k;
      textX = nearRight ? midX - gap : midX + gap;
      anchor = nearRight ? 'end' : 'start';
    } else {
      textY = midY - 16 * k < 10 * k ? midY + 16 * k : midY - 16 * k;
    }
    return (
      <g key={key}>
        <line
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={color}
          strokeWidth={2.5}
          vectorEffect="non-scaling-stroke"
          strokeDasharray={dashed ? '6 4' : undefined}
        />
        <circle cx={x1} cy={y1} r={4 * k} fill={color} />
        <circle cx={x2} cy={y2} r={4 * k} fill={color} />
        {text && (
          <text
            x={textX}
            y={textY}
            fontSize={14 * k}
            fontFamily="Arial, sans-serif"
            fontWeight="bold"
            textAnchor={anchor}
            dominantBaseline="middle"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth={3 * k}
            paintOrder="stroke"
          >
            {text}
          </text>
        )}
      </g>
    );
  };

  const hint =
    mode === 'calibrate'
      ? mt.hintCalibrate
      : mode === 'measure'
        ? mt.hintMeasure
        : null;

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Controles */}
      <div className="rounded-lg p-3 border" style={panelStyle}>
        <div className="flex items-center gap-2 mb-3">
          <Ruler className="w-4 h-4" style={{ color: '#E8DCC0' }} />
          <span className="text-sm font-medium" style={{ color: '#E8DCC0' }}>
            {mt.title}
          </span>
          <button
            onClick={onClose}
            className="ml-auto p-1 rounded hover:bg-white/10 transition-colors"
            style={{ color: '#E8DCC0' }}
            aria-label={tr.common.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status da calibração */}
        {calibration && pxPerCm ? (
          <div className="flex items-start gap-2 text-xs mb-3" style={{ color: '#E8DCC0' }}>
            <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: COLOR_MEASURE }} />
            <span>{mt.calibrated(formatCm(calibration.calibrationCm!))}</span>
          </div>
        ) : (
          <div className="flex items-start gap-2 text-xs mb-3" style={{ color: '#E8DCC0' }}>
            <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: COLOR_CALIBRATION }} />
            <span>{mt.notCalibrated}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => toggleMode('calibrate')}
            className="flex-1 px-3 py-2 rounded text-sm font-medium flex items-center justify-center gap-2 transition-all"
            style={{
              backgroundColor: mode === 'calibrate' ? COLOR_CALIBRATION : 'rgba(232, 220, 192, 0.1)',
              color: mode === 'calibrate' ? '#1B3C45' : '#E8DCC0',
            }}
          >
            <Crosshair className="w-4 h-4" />
            {calibration ? mt.recalibrate : mt.calibrate}
          </button>
          <button
            onClick={() => toggleMode('measure')}
            className="flex-1 px-3 py-2 rounded text-sm font-medium flex items-center justify-center gap-2 transition-all"
            style={{
              backgroundColor: mode === 'measure' ? COLOR_MEASURE : 'rgba(232, 220, 192, 0.1)',
              color: mode === 'measure' ? '#FFFFFF' : '#E8DCC0',
            }}
          >
            <Ruler className="w-4 h-4" />
            {mode === 'measure' ? mt.measuring : mt.measure}
          </button>
        </div>

        {(hint || draft) && (
          <div className="text-xs mt-2" style={{ color: '#E8DCC0', opacity: 0.85 }}>
            {draft ? mt.lengthLive(formatLength(draft)) : hint}
          </div>
        )}

        {/* Lista de medidas */}
        {(lines.length > 0 || calibration) && (
          <div className="mt-3 pt-3 border-t max-h-48 overflow-y-auto" style={{ borderColor: 'rgba(232, 220, 192, 0.15)' }}>
            <div className="text-xs font-medium mb-1" style={{ color: '#E8DCC0', opacity: 0.8 }}>
              {mt.listTitle(lines.length)}
            </div>
            <div className="space-y-1">
              {calibration && (
                <div className="flex items-center justify-between px-2 py-1 rounded text-xs" style={{ color: COLOR_CALIBRATION }}>
                  <span>{mt.calibrationItem(formatCm(calibration.calibrationCm!))}</span>
                  <button
                    onClick={() => handleDelete(calibration.id)}
                    className="p-1 rounded hover:bg-white/10"
                    aria-label={mt.removeCalibration}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {lines.map(m => (
                <div
                  key={m.id}
                  className="flex items-center justify-between px-2 py-1 rounded text-xs hover:bg-white/5"
                  style={{ color: '#E8DCC0' }}
                >
                  <span>
                    {m.label ? <><strong>{m.label}</strong>: </> : null}
                    {valueOf(m)}
                  </span>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-1 rounded hover:bg-white/10"
                    aria-label={mt.removeMeasurement}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Foto + desenho */}
      <div className="flex justify-center">
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt={mt.imageAlt}
            className="block max-w-full max-h-[70vh] w-auto h-auto select-none"
            draggable={false}
          />
          {natural && (
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              style={{
                cursor: mode !== 'idle' ? 'crosshair' : 'default',
                touchAction: mode !== 'idle' ? 'none' : 'auto',
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={() => setDraft(null)}
            >
              {calibration && renderLine(toLine(calibration), COLOR_CALIBRATION, mt.refLabel(formatCm(calibration.calibrationCm!)), calibration.id, true)}
              {lines.map(m =>
                renderLine(drawLineOf(m), COLOR_MEASURE, m.label ? `${m.label}: ${valueOf(m)}` : valueOf(m), m.id)
              )}
              {draft && renderLine(draft, mode === 'calibrate' ? COLOR_CALIBRATION : COLOR_DRAFT, formatLength(draft), 'draft', true)}
              {pending && renderLine(pending.line, pending.kind === 'calibrate' ? COLOR_CALIBRATION : COLOR_DRAFT, '', 'pending', true)}
            </svg>
          )}
        </div>
      </div>

      {/* Confirmação da medida / calibração */}
      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={closePending}
        >
          <div
            className="rounded-lg p-4 max-w-sm w-full"
            style={{ backgroundColor: '#1B3C45' }}
            onClick={(e) => e.stopPropagation()}
          >
            {pending.kind === 'calibrate' ? (
              <div className="mb-3">
                <div className="text-sm mb-2" style={{ color: '#E8DCC0' }}>
                  {mt.askRealSize}
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={mt.realSizePlaceholder}
                  value={cmInput}
                  onChange={(e) => { setCmInput(e.target.value); setCmError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveCalibration(); }}
                  className="w-full px-3 py-2 rounded border text-sm"
                  style={inputStyle}
                  autoFocus
                />
                {cmError && <div className="text-xs mt-1" style={{ color: '#FF8A80' }}>{cmError}</div>}
              </div>
            ) : (
              <div className="mb-3">
                <div className="text-sm mb-2" style={{ color: '#E8DCC0' }}>
                  {mt.newMeasurement} <strong>{formatLength(pending.line)}</strong>
                </div>
                <input
                  type="text"
                  placeholder={mt.labelPlaceholder}
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveMeasurement(); }}
                  className="w-full px-3 py-2 rounded border text-sm"
                  style={inputStyle}
                  autoFocus
                />
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={closePending}
                className="flex-1 px-3 py-2 rounded text-sm font-medium border"
                style={{
                  backgroundColor: 'rgba(232, 220, 192, 0.05)',
                  color: '#E8DCC0',
                  borderColor: 'rgba(232, 220, 192, 0.1)',
                }}
              >
                {tr.common.cancel}
              </button>
              <button
                onClick={pending.kind === 'calibrate' ? handleSaveCalibration : handleSaveMeasurement}
                className="flex-1 px-3 py-2 rounded text-sm font-medium flex items-center justify-center gap-2"
                style={{
                  backgroundColor: pending.kind === 'calibrate' ? COLOR_CALIBRATION : COLOR_MEASURE,
                  color: pending.kind === 'calibrate' ? '#1B3C45' : '#FFFFFF',
                }}
              >
                <Save className="w-4 h-4" />
                {pending.kind === 'calibrate' ? mt.saveCalibration : tr.common.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
