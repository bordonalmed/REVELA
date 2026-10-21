'use client';

import { useTr } from '@/contexts/language-context';

import { notify, confirmDialog } from '@/lib/notify';

import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import {
  X, RotateCw, RotateCcw, Crop, Check, Loader2, Square, Circle, Trash2, Pencil, Type, Hand, Undo2, Redo2,
  ZoomIn, ZoomOut, Maximize, ArrowUpRight, CircleDashed, Grid3x3, History, Sun,
} from 'lucide-react';
import ReactCrop, { Crop as ReactCropType, makeAspectCrop, centerCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  ANNOTATION_COLORS,
  adjustTones,
  annotationColor,
  applyImageTransformations,
  arrowHeadPoints,
  getCroppedImg,
  pixelateImage,
  rotateImage,
  rasterizeClinicalAnnotationsOnSource,
  tonesCssFilter,
  type AnnotationShape,
  type AnnotationStroke,
  type AnnotationTextBox,
  type AnnotationStrokeColor,
  type PrivacyMask,
  type PrivacyMaskShape,
} from '@/lib/image-editor-utils';

/** Mesmo giro e recorte para aplicar na foto correspondente (antes ↔ depois). */
export interface PairTransform {
  quarterTurns: number;
  fineAngle: number;
  /** Recorte em % da foto já girada + proporção (largura/altura em pixels) */
  crop?: { x: number; y: number; width: number; height: number; aspect: number };
}

export interface EditorSaveOptions {
  restoredOriginal?: boolean;
  pair?: PairTransform;
}

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (editedImage: string, options?: EditorSaveOptions) => void;
  imageSrc: string;
  imageLabel?: string;
  /** Premium: lápis, setas, círculos e texto (clinical_markings) */
  allowClinicalAnnotations?: boolean;
  /** Versão original desta foto (se ela já foi editada) */
  originalSrc?: string;
  /** Nome da foto correspondente (ex.: "DEPOIS #1"), para aplicar o mesmo enquadramento */
  pairLabel?: string;
}

/**
 * Editor de foto. Regra principal: o que o usuário vê é o que é salvo.
 * - A rotação é aplicada na própria foto de trabalho (não é só visual).
 * - Tarjas, traços, formas e textos ficam em coordenadas da foto (0–1) e são gravados antes do recorte.
 * - O recorte só acontece se o usuário escolher um formato ou desenhar o quadro.
 * - Mouse, caneta e dedo funcionam do mesmo jeito (Pointer Events); pinça aproxima.
 */

type CropAspect = number | 'free' | null; // null = sem recorte
type Tool = 'move' | 'pencil' | 'arrow' | 'ellipse' | 'text';
type Rect = { left: number; top: number; width: number; height: number };

interface EditState {
  quarterTurns: number;
  fineAngle: number;
  brightness: number;
  contrast: number;
  cropAspect: CropAspect;
  crop: ReactCropType | undefined;
  masks: PrivacyMask[];
  strokes: AnnotationStroke[];
  shapes: AnnotationShape[];
  textBoxes: AnnotationTextBox[];
}

const EMPTY: EditState = {
  quarterTurns: 0,
  fineAngle: 0,
  brightness: 0,
  contrast: 0,
  cropAspect: null,
  crop: undefined,
  masks: [],
  strokes: [],
  shapes: [],
  textBoxes: [],
};

const CREAM = '#E8DCC0';
const TEAL = '#00A88F';
const MAX_ZOOM = 4;

/** Gira coordenadas normalizadas em passos de 90° (sentido horário quando turns > 0). */
function rotatePoint(p: { x: number; y: number }, turns: number) {
  const t = ((turns % 4) + 4) % 4;
  if (t === 1) return { x: 1 - p.y, y: p.x };
  if (t === 2) return { x: 1 - p.x, y: 1 - p.y };
  if (t === 3) return { x: p.y, y: 1 - p.x };
  return p;
}

function rotateBox<T extends { x: number; y: number; width: number; height: number }>(b: T, turns: number): T {
  const t = ((turns % 4) + 4) % 4;
  if (t === 1) return { ...b, x: 1 - (b.y + b.height), y: b.x, width: b.height, height: b.width };
  if (t === 2) return { ...b, x: 1 - b.x - b.width, y: 1 - b.y - b.height };
  if (t === 3) return { ...b, x: b.y, y: 1 - (b.x + b.width), width: b.height, height: b.width };
  return b;
}

function rotateShape(sh: AnnotationShape, turns: number): AnnotationShape {
  const a = rotatePoint({ x: sh.x1, y: sh.y1 }, turns);
  const b = rotatePoint({ x: sh.x2, y: sh.y2 }, turns);
  return { ...sh, x1: a.x, y1: a.y, x2: b.x, y2: b.y };
}

export function ImageEditorModal({
  isOpen,
  onClose,
  onSave,
  imageSrc,
  imageLabel = 'Imagem',
  allowClinicalAnnotations = false,
  originalSrc,
  pairLabel,
}: ImageEditorModalProps) {
  const tr = useTr();
  const imgRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Estado que entra no desfazer/refazer
  const [st, setSt] = useState<EditState>(EMPTY);
  const stRef = useRef(st);
  stRef.current = st;
  const past = useRef<EditState[]>([]);
  const future = useRef<EditState[]>([]);
  const [, setHistoryTick] = useState(0);

  // Foto de trabalho (com a rotação já aplicada)
  const [workSrc, setWorkSrc] = useState(imageSrc);
  const [pixelSrc, setPixelSrc] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fineDraft, setFineDraft] = useState(0);
  const [tool, setTool] = useState<Tool>('move');
  const [color, setColor] = useState<AnnotationStrokeColor>('#ef4444');
  const [widthRel, setWidthRel] = useState(0.005);
  const [applyToPair, setApplyToPair] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [imgRect, setImgRect] = useState<Rect | null>(null);
  const [zoom, setZoom] = useState(1);
  const baseWidth = useRef(0);

  const dragRef = useRef<
    | { kind: 'mask-move' | 'mask-resize'; index: number; startX: number; startY: number; orig: PrivacyMask }
    | { kind: 'text'; id: string; startX: number; startY: number; x: number; y: number }
    | { kind: 'pencil' }
    | { kind: 'shape'; id: string }
    | null
  >(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const [pinching, setPinching] = useState(false);
  // Quantas ações havia quando o primeiro dedo encostou (para desfazer o que ele começou)
  const historyAtTouch = useRef(0);
  // Fica ligado durante a pinça e um instante depois de soltar (o recorte manda eventos atrasados)
  const suppressCrop = useRef(false);
  const cropAtTouch = useRef<{ crop: ReactCropType | undefined; cropAspect: CropAspect }>({ crop: undefined, cropAspect: null });

  const update = useCallback((patch: Partial<EditState> | ((s: EditState) => Partial<EditState>)) => {
    setSt((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }));
  }, []);

  /** Guarda o estado atual antes de uma ação (para poder desfazer). */
  const pushHistory = useCallback(() => {
    past.current.push(stRef.current);
    if (past.current.length > 60) past.current.shift();
    future.current = [];
    setHistoryTick((n) => n + 1);
  }, []);

  // Abrir: começa do zero
  useEffect(() => {
    if (!isOpen) return;
    setSt(EMPTY);
    past.current = [];
    future.current = [];
    setWorkSrc(imageSrc);
    setPixelSrc(null);
    setFineDraft(0);
    setTool('move');
    setZoom(1);
    setApplyToPair(false);
    setImageLoaded(false);
  }, [isOpen, imageSrc]);

  const { quarterTurns, fineAngle, brightness, contrast, cropAspect, crop, masks, strokes, shapes, textBoxes } = st;
  const hasMarks = masks.length > 0 || strokes.length > 0 || shapes.length > 0 || textBoxes.length > 0;
  const hasCrop = !!crop && crop.width > 0 && crop.height > 0;
  const hasRotation = quarterTurns % 4 !== 0 || fineAngle !== 0;
  const dirty = hasRotation || hasCrop || hasMarks || brightness !== 0 || contrast !== 0;
  const toneFilter = tonesCssFilter(brightness, contrast);

  // Rotação: gera a nova foto de trabalho sempre que o giro muda (inclusive ao desfazer)
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const deg = (((quarterTurns % 4) + 4) % 4) * 90 + fineAngle;
    setFineDraft(fineAngle);
    (async () => {
      setRotating(true);
      try {
        const next = deg === 0 ? imageSrc : await rotateImage(imageSrc, deg);
        if (cancelled) return;
        setWorkSrc((prev) => {
          if (prev !== next) setImageLoaded(false);
          return next;
        });
      } finally {
        if (!cancelled) setRotating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, imageSrc, quarterTurns, fineAngle]);

  // Mosaico pronto para as tarjas de desfoque
  const needsPixel = masks.some((m) => m.style === 'pixelate');
  useEffect(() => {
    if (!needsPixel) return;
    let cancelled = false;
    pixelateImage(workSrc).then((p) => !cancelled && setPixelSrc(p));
    return () => {
      cancelled = true;
    };
  }, [needsPixel, workSrc]);

  // Posição da foto na tela (para tarjas/marcações ficarem exatamente sobre ela)
  const measure = useCallback(() => {
    const img = imgRef.current;
    const overlay = overlayRef.current;
    if (!img || !overlay) return;
    const ir = img.getBoundingClientRect();
    const or = overlay.getBoundingClientRect();
    setImgRect({ left: ir.left - or.left, top: ir.top - or.top, width: ir.width, height: ir.height });
    if (zoom === 1) baseWidth.current = ir.width;
  }, [zoom]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isOpen, measure, workSrc, imageLoaded, zoom]);

  // ── Ações ──────────────────────────────────────────────────────────

  const showPhoto = () => requestAnimationFrame(() => overlayRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }));

  const rotateQuarter = (delta: number) => {
    if (rotating) return;
    pushHistory();
    // Leva junto o que já foi marcado, para continuar no mesmo lugar da foto
    update((s) => ({
      quarterTurns: s.quarterTurns + delta,
      crop: undefined,
      cropAspect: null,
      ...(s.fineAngle === 0
        ? {
            masks: s.masks.map((m) => rotateBox(m, delta)),
            strokes: s.strokes.map((k) => ({ ...k, points: k.points.map((p) => rotatePoint(p, delta)) })),
            shapes: s.shapes.map((sh) => rotateShape(sh, delta)),
            textBoxes: s.textBoxes.map((tb) => {
              const c = rotatePoint({ x: tb.x + tb.width / 2, y: tb.y + tb.height / 2 }, delta);
              return { ...tb, x: Math.max(0, c.x - tb.width / 2), y: Math.max(0, c.y - tb.height / 2) };
            }),
          }
        : {}),
    }));
  };

  const commitFineAngle = (angle: number) => {
    if (angle === stRef.current.fineAngle) return;
    pushHistory();
    update({ fineAngle: angle, crop: undefined, cropAspect: null });
  };

  const startCrop = (aspect: CropAspect) => {
    pushHistory();
    const img = imgRef.current;
    if (aspect === null || !img) {
      update({ cropAspect: null, crop: undefined });
      return;
    }
    const { naturalWidth: w, naturalHeight: h } = img;
    const a = aspect === 'free' ? w / h : aspect;
    update({ cropAspect: aspect, crop: centerCrop(makeAspectCrop({ unit: '%', width: 80 }, a, w, h), w, h) });
    setTool('move');
    showPhoto();
  };

  const addMask = (shape: PrivacyMaskShape, style: 'solid' | 'pixelate' = 'solid') => {
    pushHistory();
    setTool('move');
    const ratio = (imgRect?.width || 1) / (imgRect?.height || 1);
    update((s) => ({ masks: [...s.masks, { x: 0.3, y: 0.4, width: 0.4, height: shape === 'circle' ? 0.4 * ratio : 0.2, shape, style }] }));
    showPhoto();
  };

  const chooseTool = (t: Tool) => {
    setTool(t);
    if (t !== 'move') showPhoto();
  };

  const setZoomClamped = (z: number) => setZoom(Math.min(MAX_ZOOM, Math.max(1, Math.round(z * 100) / 100)));

  // Ponto da tela → coordenada 0–1 na foto
  const toImage = (clientX: number, clientY: number) => {
    const img = imgRef.current;
    if (!img) return null;
    const r = img.getBoundingClientRect();
    const x = (clientX - r.left) / r.width;
    const y = (clientY - r.top) / r.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return null;
    return { x, y };
  };

  // Arrastar (tarja, texto, lápis, formas) com mouse ou dedo
  useEffect(() => {
    if (!isOpen) return;
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      const img = imgRef.current;
      if (!d || !img || pinch.current) return;
      const r = img.getBoundingClientRect();
      if (d.kind === 'pencil') {
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        if (x < 0 || x > 1 || y < 0 || y > 1) return;
        update((s) => {
          if (!s.strokes.length) return {};
          const next = [...s.strokes];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, points: [...last.points, { x, y }] };
          return { strokes: next };
        });
        return;
      }
      if (d.kind === 'shape') {
        const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
        update((s) => ({ shapes: s.shapes.map((sh) => (sh.id === d.id ? { ...sh, x2: x, y2: y } : sh)) }));
        return;
      }
      const dx = (e.clientX - d.startX) / r.width;
      const dy = (e.clientY - d.startY) / r.height;
      if (d.kind === 'text') {
        update((s) => ({
          textBoxes: s.textBoxes.map((t) =>
            t.id === d.id ? { ...t, x: Math.min(Math.max(d.x + dx, 0), 1 - t.width), y: Math.min(Math.max(d.y + dy, 0), 1 - t.height) } : t
          ),
        }));
        return;
      }
      const m = d.orig;
      update((s) => {
        const next = [...s.masks];
        next[d.index] =
          d.kind === 'mask-move'
            ? { ...m, x: Math.min(Math.max(m.x + dx, 0), 1 - m.width), y: Math.min(Math.max(m.y + dy, 0), 1 - m.height) }
            : { ...m, width: Math.min(Math.max(m.width + dx, 0.03), 1 - m.x), height: Math.min(Math.max(m.height + dy, 0.03), 1 - m.y) };
        return { masks: next };
      });
    };
    const onUp = () => {
      const d = dragRef.current;
      // Forma sem tamanho (um toque só) é descartada
      if (d?.kind === 'shape') {
        update((s) => ({
          shapes: s.shapes.filter((sh) => sh.id !== d.id || Math.hypot(sh.x2 - sh.x1, sh.y2 - sh.y1) > 0.01),
        }));
      }
      dragRef.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isOpen, update]);

  // Desfazer / refazer
  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(stRef.current);
    setSt(prev);
    setHistoryTick((n) => n + 1);
  }, []);
  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(stRef.current);
    setSt(next);
    setHistoryTick((n) => n + 1);
  }, []);

  // Pinça (dois dedos) para aproximar
  const onPinchDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    if (pointers.current.size === 0) {
      historyAtTouch.current = past.current.length;
      cropAtTouch.current = { crop: stRef.current.crop, cropAspect: stRef.current.cropAspect };
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
      dragRef.current = null;
      suppressCrop.current = true;
      setPinching(true);
      // O primeiro dedo pode ter começado um recorte, traço ou arrasto: desfaz
      while (past.current.length > historyAtTouch.current) undo();
      future.current = [];
      update({ ...cropAtTouch.current });
    }
  };
  const onPinchMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.current.dist > 0) setZoomClamped(pinch.current.zoom * (dist / pinch.current.dist));
    }
  };
  const onPinchUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) {
      setPinching(false);
      if (suppressCrop.current) {
        setTimeout(() => {
          suppressCrop.current = false;
          // Se mesmo assim sobrou um recorte criado pelos dedos, desfaz
          while (past.current.length > historyAtTouch.current) undo();
          future.current = [];
          update({ ...cropAtTouch.current });
        }, 50);
      }
    }
  };

  // Fechar sem perder trabalho por engano
  const requestClose = useCallback(async () => {
    if (processing) return;
    if (dirty) {
      const ok = await confirmDialog(tr('Descartar as alterações desta foto?', 'Discard the changes to this photo?'), {
        confirmLabel: tr('Descartar', 'Discard'),
        danger: true,
      });
      if (!ok) return;
    }
    onClose();
  }, [dirty, processing, onClose, tr]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === 'TEXTAREA' || tag === 'INPUT';
      if (e.key === 'Escape') void requestClose();
      else if (!typing && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (!typing && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, requestClose, undo, redo]);

  if (!isOpen) return null;

  const handleReset = () => {
    if (!dirty) return;
    pushHistory();
    setSt(EMPTY);
    setTool('move');
  };

  const handleRestoreOriginal = async () => {
    if (!originalSrc) return;
    const ok = await confirmDialog(
      tr('Voltar esta foto para a versão original? Todas as edições feitas nela serão desfeitas.', 'Restore this photo to its original version? All edits made to it will be undone.'),
      { confirmLabel: tr('Restaurar original', 'Restore original') }
    );
    if (!ok) return;
    onSave(originalSrc, { restoredOriginal: true });
    onClose();
  };

  const handleApply = async () => {
    if (!dirty) {
      onClose();
      return;
    }
    const img = imgRef.current;
    if (!img) return;
    try {
      setProcessing(true);
      let src = workSrc;
      // 1) Luz (antes das marcações, para tarjas e textos não mudarem de cor)
      src = await adjustTones(src, brightness, contrast);
      // 2) Marcações e tarjas na foto inteira (mesmas coordenadas que o usuário viu)
      if (allowClinicalAnnotations && (strokes.length || textBoxes.length || shapes.length)) {
        src = await rasterizeClinicalAnnotationsOnSource(src, strokes, textBoxes, shapes);
      }
      if (masks.length) src = await applyImageTransformations(src, 0, null, masks);
      // 3) Recorte por último
      let cropPct: PairTransform['crop'];
      if (hasCrop && crop) {
        const W = img.naturalWidth;
        const H = img.naturalHeight;
        cropPct =
          crop.unit === '%'
            ? { x: crop.x, y: crop.y, width: crop.width, height: crop.height, aspect: 1 }
            : { x: (crop.x / img.width) * 100, y: (crop.y / img.height) * 100, width: (crop.width / img.width) * 100, height: (crop.height / img.height) * 100, aspect: 1 };
        const pc = { x: (cropPct.x / 100) * W, y: (cropPct.y / 100) * H, width: (cropPct.width / 100) * W, height: (cropPct.height / 100) * H };
        cropPct.aspect = pc.width / Math.max(1, pc.height);
        if (pc.width >= 2 && pc.height >= 2) src = await getCroppedImg(src, pc, 0);
      }
      const pair = applyToPair && pairLabel && (hasCrop || hasRotation) ? { quarterTurns, fineAngle, crop: cropPct } : undefined;
      onSave(src, pair ? { pair } : undefined);
      onClose();
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      notify.error((t) => t.msg.imageProcessError);
    } finally {
      setProcessing(false);
    }
  };

  // Escala da foto na tela (para a prévia de traço/texto ficar igual ao resultado)
  const natW = imgRef.current?.naturalWidth || 1;
  const natH = imgRef.current?.naturalHeight || 1;
  const minDim = Math.min(natW, natH);
  const displayScale = imgRect ? imgRect.width / natW : 1;
  const textFontPx = Math.max(14, minDim * 0.028) * displayScale;
  const annotating = allowClinicalAnnotations && tool !== 'move';

  const btn = (active: boolean) =>
    `px-3 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition-all border disabled:opacity-40 ${active ? 'text-white' : 'hover:bg-white/5'}`;
  const btnStyle = (active: boolean): React.CSSProperties => ({
    backgroundColor: active ? 'rgba(0,168,143,0.85)' : 'rgba(232,220,192,0.08)',
    borderColor: active ? TEAL : 'rgba(232,220,192,0.12)',
    color: active ? '#fff' : CREAM,
  });
  const iconBtn = 'p-2 rounded-lg hover:bg-white/10 disabled:opacity-30';

  const cropOptions: { label: string; value: CropAspect }[] = [
    { label: tr('Sem recorte', 'No crop'), value: null },
    { label: tr('Livre', 'Free'), value: 'free' },
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '3:4', value: 3 / 4 },
    { label: '16:9', value: 16 / 9 },
  ];

  const zoomedImgStyle: React.CSSProperties =
    zoom > 1 && baseWidth.current
      ? { width: baseWidth.current * zoom, maxWidth: 'none', maxHeight: 'none', height: 'auto' }
      : { maxWidth: '100%', maxHeight: '58dvh' };

  const tools: [Tool, React.ReactNode, string][] = [
    ['move', <Hand key="m" className="w-4 h-4" />, tr('Mover', 'Move')],
    ['pencil', <Pencil key="p" className="w-4 h-4" />, tr('Lápis', 'Pen')],
    ['arrow', <ArrowUpRight key="a" className="w-4 h-4" />, tr('Seta', 'Arrow')],
    ['ellipse', <CircleDashed key="e" className="w-4 h-4" />, tr('Círculo', 'Circle')],
    ['text', <Type key="t" className="w-4 h-4" />, tr('Texto', 'Text')],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }} onClick={() => void requestClose()}>
      <div
        className="relative w-full max-w-5xl h-full sm:h-auto sm:rounded-lg shadow-2xl flex flex-col"
        style={{ backgroundColor: '#1A2B32', border: '1px solid rgba(232, 220, 192, 0.2)', maxHeight: '100dvh' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`${tr('Editar', 'Edit')} ${imageLabel}`}
        data-testid="image-editor"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b flex-shrink-0" style={{ borderColor: 'rgba(232, 220, 192, 0.1)' }}>
          <h2 className="text-base sm:text-lg font-medium flex items-center gap-2 truncate" style={{ color: CREAM }}>
            <Crop className="w-5 h-5 shrink-0" /> <span className="truncate">{tr('Editar', 'Edit')} {imageLabel}</span>
          </h2>
          <div className="flex items-center gap-1 shrink-0" style={{ color: CREAM }}>
            <button onClick={undo} disabled={!past.current.length} className={iconBtn} title={tr('Desfazer (Ctrl+Z)', 'Undo (Ctrl+Z)')} aria-label={tr('Desfazer', 'Undo')} data-testid="undo">
              <Undo2 className="w-5 h-5" />
            </button>
            <button onClick={redo} disabled={!future.current.length} className={iconBtn} title={tr('Refazer (Ctrl+Shift+Z)', 'Redo (Ctrl+Shift+Z)')} aria-label={tr('Refazer', 'Redo')} data-testid="redo">
              <Redo2 className="w-5 h-5" />
            </button>
            <button onClick={() => void requestClose()} className={iconBtn} aria-label={tr('Fechar', 'Close')}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4">
            {/* Foto */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-end gap-1 mb-1.5" style={{ color: CREAM }}>
                <button onClick={() => setZoomClamped(zoom - 0.5)} disabled={zoom <= 1} className={iconBtn} aria-label={tr('Afastar', 'Zoom out')}>
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs w-12 text-center tabular-nums" data-testid="zoom-level">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoomClamped(zoom + 0.5)} disabled={zoom >= MAX_ZOOM} className={iconBtn} aria-label={tr('Aproximar', 'Zoom in')}>
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button onClick={() => setZoom(1)} disabled={zoom === 1} className={iconBtn} aria-label={tr('Ajustar à tela', 'Fit to screen')} title={tr('Ajustar à tela', 'Fit to screen')}>
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
              <div
                className="rounded-lg p-2 overflow-auto flex"
                style={{ backgroundColor: '#000', minHeight: 240, maxHeight: '62dvh', touchAction: 'pan-x pan-y' }}
                onPointerDownCapture={onPinchDown}
                onPointerMoveCapture={onPinchMove}
                onPointerUpCapture={onPinchUp}
                onPointerCancelCapture={onPinchUp}
                data-testid="photo-scroll"
              >
                <div ref={overlayRef} className="relative inline-block m-auto shrink-0">
                  {/* @ts-ignore - react-image-crop type issue */}
                  <ReactCrop
                    crop={crop}
                    onDragStart={() => {
                      if (!suppressCrop.current) pushHistory();
                    }}
                    onChange={(_: unknown, percentCrop: ReactCropType) => {
                      if (pinch.current || suppressCrop.current) return; // dois dedos = aproximar, não recortar
                      update((s) => ({ crop: percentCrop, cropAspect: s.cropAspect === null && percentCrop.width > 0 ? 'free' : s.cropAspect }));
                    }}
                    aspect={typeof cropAspect === 'number' ? cropAspect : undefined}
                    disabled={tool !== 'move' || rotating || pinching}
                    keepSelection
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      ref={imgRef}
                      src={workSrc}
                      alt={imageLabel}
                      onLoad={() => {
                        setImageLoaded(true);
                        measure();
                      }}
                      className="block select-none"
                      style={{ ...zoomedImgStyle, objectFit: 'contain', opacity: rotating ? 0.5 : 1, filter: toneFilter }}
                      draggable={false}
                    />
                  </ReactCrop>

                  {imgRect && (
                    <div
                      className="absolute"
                      style={{ left: imgRect.left, top: imgRect.top, width: imgRect.width, height: imgRect.height, pointerEvents: 'none', zIndex: 10 }}
                      data-testid="marks-layer"
                    >
                      {/* Camada de desenho (lápis, seta, círculo, texto) */}
                      {annotating && (
                        <div
                          className="absolute inset-0"
                          style={{ pointerEvents: 'auto', cursor: 'crosshair', touchAction: 'none' }}
                          data-testid="draw-layer"
                          onPointerDown={(e) => {
                            if (pinch.current) return;
                            const p = toImage(e.clientX, e.clientY);
                            if (!p) return;
                            e.preventDefault();
                            pushHistory();
                            if (tool === 'pencil') {
                              dragRef.current = { kind: 'pencil' };
                              update((s) => ({ strokes: [...s.strokes, { points: [p], color, widthRel }] }));
                            } else if (tool === 'arrow' || tool === 'ellipse') {
                              const id = `sh-${Date.now()}`;
                              dragRef.current = { kind: 'shape', id };
                              update((s) => ({ shapes: [...s.shapes, { id, kind: tool, x1: p.x, y1: p.y, x2: p.x, y2: p.y, color, widthRel }] }));
                            } else if (tool === 'text') {
                              const w = 0.3;
                              const h = 0.14;
                              update((s) => ({
                                textBoxes: [...s.textBoxes, { id: `tb-${Date.now()}`, x: Math.min(p.x, 1 - w), y: Math.min(p.y, 1 - h), width: w, height: h, text: tr('Texto', 'Text') }],
                              }));
                              setTool('move');
                            }
                          }}
                        />
                      )}

                      {/* Prévia em escala real: traços e formas */}
                      {allowClinicalAnnotations && (strokes.length > 0 || shapes.length > 0) && (
                        <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${natW} ${natH}`} preserveAspectRatio="none" style={{ pointerEvents: 'none' }}>
                          {strokes.map((s, i) => {
                            const c = annotationColor(s.color);
                            const sw = Math.max(1, s.widthRel * minDim);
                            if (s.points.length === 1) return <circle key={`s${i}`} cx={s.points[0].x * natW} cy={s.points[0].y * natH} r={sw / 2} fill={c} />;
                            const d = s.points.map((p, j) => `${j ? 'L' : 'M'} ${p.x * natW} ${p.y * natH}`).join(' ');
                            return <path key={`s${i}`} d={d} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />;
                          })}
                          {shapes.map((sh) => {
                            const c = annotationColor(sh.color);
                            const sw = Math.max(1, sh.widthRel * minDim);
                            const x1 = sh.x1 * natW;
                            const y1 = sh.y1 * natH;
                            const x2 = sh.x2 * natW;
                            const y2 = sh.y2 * natH;
                            if (sh.kind === 'ellipse') {
                              return <ellipse key={sh.id} cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} rx={Math.abs(x2 - x1) / 2} ry={Math.abs(y2 - y1) / 2} fill="none" stroke={c} strokeWidth={sw} />;
                            }
                            const [hx1, hy1, hx2, hy2] = arrowHeadPoints(x1, y1, x2, y2, sw);
                            return (
                              <path key={sh.id} d={`M ${x1} ${y1} L ${x2} ${y2} M ${hx1} ${hy1} L ${x2} ${y2} L ${hx2} ${hy2}`} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
                            );
                          })}
                        </svg>
                      )}

                      {/* Tarjas (preta ou desfoque em mosaico) */}
                      {masks.map((m, index) => {
                        const pix = m.style === 'pixelate';
                        return (
                          <div
                            key={index}
                            className="absolute cursor-move"
                            data-testid="mask"
                            style={{
                              left: `${m.x * 100}%`,
                              top: `${m.y * 100}%`,
                              width: `${m.width * 100}%`,
                              height: `${m.height * 100}%`,
                              backgroundColor: pix ? 'rgba(128,128,128,0.6)' : '#000',
                              backgroundImage: pix && pixelSrc ? `url(${pixelSrc})` : undefined,
                              backgroundSize: imgRect ? `${imgRect.width}px ${imgRect.height}px` : undefined,
                              backgroundPosition: imgRect ? `${-m.x * imgRect.width}px ${-m.y * imgRect.height}px` : undefined,
                              filter: pix ? toneFilter : undefined,
                              outline: '1px dashed rgba(255,255,255,0.7)',
                              borderRadius: m.shape === 'circle' ? '9999px' : '2px',
                              pointerEvents: tool === 'move' ? 'auto' : 'none',
                              touchAction: 'none',
                            }}
                            onPointerDown={(e) => {
                              if (pinch.current) return;
                              e.stopPropagation();
                              e.preventDefault();
                              pushHistory();
                              dragRef.current = { kind: 'mask-move', index, startX: e.clientX, startY: e.clientY, orig: m };
                            }}
                          >
                            <div
                              className="absolute -right-2.5 -bottom-2.5 w-6 h-6 rounded-full bg-white border-2 cursor-se-resize"
                              style={{ borderColor: TEAL, touchAction: 'none' }}
                              aria-label={tr('Mudar tamanho da tarja', 'Resize mask')}
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                pushHistory();
                                dragRef.current = { kind: 'mask-resize', index, startX: e.clientX, startY: e.clientY, orig: m };
                              }}
                            />
                          </div>
                        );
                      })}

                      {/* Caixas de texto (mesmo tamanho e visual do resultado) */}
                      {allowClinicalAnnotations &&
                        textBoxes.map((tb) => (
                          <div
                            key={tb.id}
                            className="absolute rounded border flex flex-col overflow-hidden"
                            style={{
                              left: `${tb.x * 100}%`,
                              top: `${tb.y * 100}%`,
                              width: `${tb.width * 100}%`,
                              minHeight: `${tb.height * 100}%`,
                              borderColor: 'rgba(0,168,143,0.9)',
                              borderStyle: 'dashed',
                              pointerEvents: tool === 'move' ? 'auto' : 'none',
                            }}
                          >
                            <div
                              className="flex items-center justify-between px-1 cursor-grab text-[10px] shrink-0"
                              style={{ backgroundColor: 'rgba(0,168,143,0.85)', color: '#fff', touchAction: 'none' }}
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                pushHistory();
                                dragRef.current = { kind: 'text', id: tb.id, startX: e.clientX, startY: e.clientY, x: tb.x, y: tb.y };
                              }}
                            >
                              <span className="flex items-center gap-1"><Hand className="w-3 h-3" /> {tr('Arrastar', 'Drag')}</span>
                              <button
                                type="button"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={() => {
                                  pushHistory();
                                  update((s) => ({ textBoxes: s.textBoxes.filter((t) => t.id !== tb.id) }));
                                }}
                                className="p-0.5 rounded hover:bg-white/20"
                                aria-label={tr('Remover caixa de texto', 'Remove text box')}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <textarea
                              value={tb.text}
                              onFocus={() => pushHistory()}
                              onChange={(e) => update((s) => ({ textBoxes: s.textBoxes.map((t) => (t.id === tb.id ? { ...t, text: e.target.value } : t)) }))}
                              rows={Math.max(1, tb.text.split('\n').length)}
                              className="flex-1 w-full p-1 resize-none border-0 bg-transparent focus:outline-none"
                              style={{
                                color: '#fff',
                                fontSize: Math.max(10, textFontPx),
                                lineHeight: 1.28,
                                fontFamily: 'sans-serif',
                                // Mesmo visual do resultado: letra branca com contorno preto
                                textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                              }}
                            />
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-center mt-2" style={{ color: CREAM, opacity: 0.7 }}>
                {tool === 'pencil'
                  ? tr('Desenhe na foto com o dedo ou o mouse.', 'Draw on the photo with your finger or mouse.')
                  : tool === 'arrow'
                    ? tr('Arraste de onde a seta começa até onde ela aponta.', 'Drag from where the arrow starts to where it points.')
                    : tool === 'ellipse'
                      ? tr('Arraste para desenhar o círculo em volta da região.', 'Drag to draw the circle around the area.')
                      : tool === 'text'
                        ? tr('Toque na foto onde quer colocar o texto.', 'Tap the photo where you want the text.')
                        : tr('Arraste a tarja para onde quiser; o círculo branco muda o tamanho. Dois dedos aproximam. O que você vê aqui é o que será salvo.', 'Drag the mask wherever you want; the white circle resizes it. Two fingers zoom. What you see here is what will be saved.')}
              </p>
            </div>

            {/* Controles */}
            <div className="space-y-5">
              {/* Girar */}
              <section className="space-y-2">
                <h3 className="text-sm font-medium" style={{ color: CREAM }}>{tr('Girar', 'Rotate')}</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => rotateQuarter(-1)} disabled={rotating} className={btn(false)} style={btnStyle(false)} title={tr('Girar 90° para a esquerda', 'Rotate 90° left')}>
                    <RotateCcw className="w-4 h-4" /> 90°
                  </button>
                  <button onClick={() => rotateQuarter(1)} disabled={rotating} className={btn(false)} style={btnStyle(false)} title={tr('Girar 90° para a direita', 'Rotate 90° right')}>
                    <RotateCw className="w-4 h-4" /> 90°
                  </button>
                  <button onClick={() => rotateQuarter(2)} disabled={rotating} className={btn(false)} style={btnStyle(false)} title={tr('Girar 180°', 'Rotate 180°')}>
                    180°
                  </button>
                </div>
                <label className="block text-xs" style={{ color: CREAM, opacity: 0.8 }}>
                  {tr('Endireitar', 'Straighten')}: {fineDraft > 0 ? '+' : ''}{fineDraft}°
                  <input
                    type="range"
                    min={-45}
                    max={45}
                    step={1}
                    value={fineDraft}
                    disabled={hasMarks || rotating}
                    onChange={(e) => setFineDraft(Number(e.target.value))}
                    onPointerUp={(e) => commitFineAngle(Number((e.target as HTMLInputElement).value))}
                    onKeyUp={(e) => commitFineAngle(Number((e.target as HTMLInputElement).value))}
                    className="w-full mt-1"
                    style={{ accentColor: TEAL }}
                    aria-label={tr('Endireitar a foto', 'Straighten the photo')}
                  />
                </label>
                {hasMarks && (
                  <p className="text-[11px]" style={{ color: CREAM, opacity: 0.6 }}>
                    {tr('Para endireitar, faça isso antes de colocar tarjas ou marcações.', 'To straighten, do it before adding masks or annotations.')}
                  </p>
                )}
              </section>

              {/* Luz */}
              <section className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-1.5" style={{ color: CREAM }}>
                  <Sun className="w-4 h-4" /> {tr('Luz', 'Light')}
                </h3>
                {([
                  ['brightness', tr('Brilho', 'Brightness')],
                  ['contrast', tr('Contraste', 'Contrast')],
                ] as const).map(([key, label]) => (
                  <label key={key} className="block text-xs" style={{ color: CREAM, opacity: 0.85 }}>
                    {label}: {st[key] > 0 ? '+' : ''}{st[key]}
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      step={1}
                      value={st[key]}
                      onPointerDown={() => pushHistory()}
                      onKeyDown={() => pushHistory()}
                      onChange={(e) => update({ [key]: Number(e.target.value) } as Partial<EditState>)}
                      className="w-full mt-1"
                      style={{ accentColor: TEAL }}
                      aria-label={label}
                      data-testid={`tone-${key}`}
                    />
                  </label>
                ))}
                <p className="text-[11px]" style={{ color: CREAM, opacity: 0.6 }}>
                  {tr('Use para deixar as fotos de antes e depois com a mesma luz.', 'Use it to give before and after photos the same lighting.')}
                </p>
              </section>

              {/* Recortar */}
              <section className="space-y-2">
                <h3 className="text-sm font-medium" style={{ color: CREAM }}>{tr('Recortar', 'Crop')}</h3>
                <div className="flex flex-wrap gap-2">
                  {cropOptions.map((o) => (
                    <button key={o.label} onClick={() => startCrop(o.value)} className={btn(cropAspect === o.value)} style={btnStyle(cropAspect === o.value)}>
                      {o.label}
                    </button>
                  ))}
                </div>
                {pairLabel && (
                  <label className="flex items-start gap-2 text-xs cursor-pointer pt-1" style={{ color: CREAM }}>
                    <input
                      type="checkbox"
                      checked={applyToPair}
                      onChange={(e) => setApplyToPair(e.target.checked)}
                      className="mt-0.5 w-4 h-4"
                      style={{ accentColor: TEAL }}
                      data-testid="apply-to-pair"
                    />
                    <span>
                      {tr(`Aplicar o mesmo giro e recorte em ${pairLabel}`, `Apply the same rotation and crop to ${pairLabel}`)}
                      <span className="block opacity-60">{tr('Deixa antes e depois com o mesmo enquadramento.', 'Gives before and after the same framing.')}</span>
                    </span>
                  </label>
                )}
              </section>

              {/* Tarjas */}
              <section className="space-y-2">
                <h3 className="text-sm font-medium" style={{ color: CREAM }}>{tr('Tarjas de privacidade', 'Privacy masks')}</h3>
                <p className="text-[11px]" style={{ color: CREAM, opacity: 0.6 }}>
                  {tr('Você escolhe o que cobrir (olhos, rosto, tatuagens…). A tarja é gravada na foto ao salvar.', 'You choose what to cover (eyes, face, tattoos…). The mask is burned into the photo when you save.')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => addMask('rect')} className={btn(false)} style={btnStyle(false)}>
                    <Square className="w-4 h-4" /> {tr('Retângulo', 'Rectangle')}
                  </button>
                  <button type="button" onClick={() => addMask('circle')} className={btn(false)} style={btnStyle(false)}>
                    <Circle className="w-4 h-4" /> {tr('Círculo', 'Circle')}
                  </button>
                  <button type="button" onClick={() => addMask('rect', 'pixelate')} className={btn(false)} style={btnStyle(false)} data-testid="mask-blur">
                    <Grid3x3 className="w-4 h-4" /> {tr('Desfoque', 'Blur')}
                  </button>
                </div>
                {masks.length > 0 && (
                  <ul className="space-y-1 max-h-28 overflow-y-auto">
                    {masks.map((m, i) => (
                      <li key={i} className="flex items-center justify-between gap-2 text-xs rounded-md px-2 py-1 border" style={{ color: CREAM, borderColor: 'rgba(232,220,192,0.15)' }}>
                        <span>
                          {m.style === 'pixelate' ? tr('Desfoque', 'Blur') : tr('Tarja', 'Mask')} {m.shape === 'circle' ? tr('circular', 'circle') : tr('retangular', 'rectangle')} #{i + 1}
                        </span>
                        <span className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              pushHistory();
                              update((s) => ({ masks: s.masks.map((x, j) => (j === i ? { ...x, shape: x.shape === 'circle' ? 'rect' : 'circle' } : x)) }));
                            }}
                            className="px-1.5 py-0.5 rounded hover:bg-white/10"
                            title={tr('Trocar formato', 'Switch shape')}
                          >
                            {m.shape === 'circle' ? <Square className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              pushHistory();
                              update((s) => ({ masks: s.masks.map((x, j) => (j === i ? { ...x, style: x.style === 'pixelate' ? 'solid' : 'pixelate' } : x)) }));
                            }}
                            className="px-1.5 py-0.5 rounded hover:bg-white/10"
                            title={m.style === 'pixelate' ? tr('Trocar para tarja preta', 'Switch to black mask') : tr('Trocar para desfoque', 'Switch to blur')}
                          >
                            {m.style === 'pixelate' ? <Square className="w-3.5 h-3.5 fill-current" /> : <Grid3x3 className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              pushHistory();
                              update((s) => ({ masks: s.masks.filter((_, j) => j !== i) }));
                            }}
                            className="p-1 rounded hover:bg-white/10"
                            aria-label={tr('Remover tarja', 'Remove mask')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Marcações Premium */}
              {allowClinicalAnnotations && (
                <section className="space-y-2 border-t pt-4" style={{ borderColor: 'rgba(232, 220, 192, 0.15)' }}>
                  <h3 className="text-sm font-medium flex items-center gap-2" style={{ color: CREAM }}>
                    <Pencil className="w-4 h-4" style={{ color: TEAL }} /> {tr('Marcações (Premium)', 'Annotations (Premium)')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tools.map(([t, icon, label]) => (
                      <button key={t} type="button" onClick={() => chooseTool(t)} className={btn(tool === t)} style={btnStyle(tool === t)} data-testid={`tool-${t}`}>
                        {icon} {label}
                      </button>
                    ))}
                  </div>
                  {(tool === 'pencil' || tool === 'arrow' || tool === 'ellipse') && (
                    <div className="space-y-2 text-xs" style={{ color: CREAM }}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span style={{ opacity: 0.8 }}>{tr('Cor:', 'Color:')}</span>
                        {ANNOTATION_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setColor(c)}
                            className={`w-7 h-7 rounded-full border-2 ${color === c ? 'ring-2 ring-offset-2 ring-offset-[#1A2B32] ring-[#00A88F]' : ''}`}
                            style={{ backgroundColor: c, borderColor: 'rgba(232,220,192,0.4)' }}
                            aria-label={c}
                          />
                        ))}
                      </div>
                      <label className="flex items-center gap-2" style={{ opacity: 0.85 }}>
                        {tr('Espessura', 'Thickness')}
                        <input type="range" min={0.0015} max={0.015} step={0.0005} value={widthRel} onChange={(e) => setWidthRel(Number(e.target.value))} className="w-28" style={{ accentColor: TEAL }} />
                      </label>
                    </div>
                  )}
                  {(strokes.length > 0 || shapes.length > 0) && (
                    <button
                      type="button"
                      onClick={() => {
                        pushHistory();
                        update({ strokes: [], shapes: [] });
                      }}
                      className="px-2 py-1 rounded bg-white/10 text-xs"
                      style={{ color: CREAM }}
                    >
                      {tr('Apagar desenhos', 'Clear drawings')}
                    </button>
                  )}
                </section>
              )}

              <div className="space-y-2">
                <button onClick={handleReset} disabled={!dirty || rotating} className="w-full px-3 py-2 rounded-lg text-sm disabled:opacity-40 hover:bg-white/5 border" style={{ color: CREAM, borderColor: 'rgba(232,220,192,0.15)' }}>
                  {tr('Desfazer tudo', 'Undo everything')}
                </button>
                {originalSrc && (
                  <>
                    <button
                      onClick={() => void handleRestoreOriginal()}
                      disabled={processing}
                      className="w-full px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-white/5 border"
                      style={{ color: CREAM, borderColor: 'rgba(232,220,192,0.15)' }}
                      data-testid="restore-original"
                    >
                      <History className="w-4 h-4" /> {tr('Restaurar foto original', 'Restore original photo')}
                    </button>
                    <p className="text-[11px] text-center" style={{ color: CREAM, opacity: 0.5 }}>
                      {tr('A versão original fica guardada só neste aparelho.', 'The original version is kept on this device only.')}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-t flex-shrink-0" style={{ borderColor: 'rgba(232, 220, 192, 0.1)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}>
          <button onClick={() => void requestClose()} disabled={processing} className="px-4 py-2.5 rounded-lg text-sm disabled:opacity-50" style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)', color: CREAM }}>
            {tr('Cancelar', 'Cancel')}
          </button>
          <button
            onClick={() => void handleApply()}
            disabled={processing || rotating || !imageLoaded}
            className="px-6 py-2.5 rounded-lg flex items-center gap-2 text-sm font-semibold disabled:opacity-50"
            style={{ backgroundColor: TEAL, color: '#fff' }}
            data-testid="editor-save"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {processing ? tr('Salvando…', 'Saving…') : tr('Salvar foto', 'Save photo')}
          </button>
        </div>
      </div>
    </div>
  );
}
