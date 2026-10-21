'use client';

import { useTr } from '@/contexts/language-context';

import { notify, confirmDialog } from '@/lib/notify';

import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { X, RotateCw, RotateCcw, Crop, Check, Loader2, Square, Circle, Trash2, Pencil, Type, Hand, Undo2 } from 'lucide-react';
import ReactCrop, { Crop as ReactCropType, makeAspectCrop, centerCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  applyImageTransformations,
  getCroppedImg,
  rotateImage,
  rasterizeClinicalAnnotationsOnSource,
  type PrivacyMask,
  type PrivacyMaskShape,
  type AnnotationStroke,
  type AnnotationTextBox,
  type AnnotationStrokeColor,
} from '@/lib/image-editor-utils';

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (editedImage: string) => void;
  imageSrc: string;
  imageLabel?: string;
  /** Premium: lápis + caixa de texto (clinical_markings) */
  allowClinicalAnnotations?: boolean;
}

/**
 * Editor de foto. Regra principal: o que o usuário vê é o que é salvo.
 * - A rotação é aplicada na própria foto de trabalho (não é só visual).
 * - Tarjas, traços e textos ficam em coordenadas da foto (0–1) e são gravados antes do recorte.
 * - O recorte só acontece se o usuário escolher um formato ou desenhar o quadro.
 * - Mouse, caneta e dedo funcionam do mesmo jeito (Pointer Events).
 */

type CropAspect = number | 'free' | null; // null = sem recorte
type Tool = 'move' | 'pencil' | 'text';

type Rect = { left: number; top: number; width: number; height: number };

const CREAM = '#E8DCC0';
const TEAL = '#00A88F';

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

export function ImageEditorModal({
  isOpen,
  onClose,
  onSave,
  imageSrc,
  imageLabel = 'Imagem',
  allowClinicalAnnotations = false,
}: ImageEditorModalProps) {
  const tr = useTr();
  const imgRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Foto de trabalho (com a rotação já aplicada)
  const [workSrc, setWorkSrc] = useState(imageSrc);
  const [quarterTurns, setQuarterTurns] = useState(0);
  const [fineAngle, setFineAngle] = useState(0);
  const [rotating, setRotating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const [cropAspect, setCropAspect] = useState<CropAspect>(null);
  const [crop, setCrop] = useState<ReactCropType>();

  const [tool, setTool] = useState<Tool>('move');
  const [masks, setMasks] = useState<PrivacyMask[]>([]);
  const [strokes, setStrokes] = useState<AnnotationStroke[]>([]);
  const [textBoxes, setTextBoxes] = useState<AnnotationTextBox[]>([]);
  const [pencilColor, setPencilColor] = useState<AnnotationStrokeColor>('black');
  const [pencilWidthRel, setPencilWidthRel] = useState(0.004);
  const [processing, setProcessing] = useState(false);
  const [imgRect, setImgRect] = useState<Rect | null>(null);

  const dragRef = useRef<
    | { kind: 'mask-move' | 'mask-resize'; index: number; startX: number; startY: number; orig: PrivacyMask }
    | { kind: 'text'; id: string; startX: number; startY: number; x: number; y: number }
    | { kind: 'pencil' }
    | null
  >(null);

  // Abrir: começa do zero
  useEffect(() => {
    if (!isOpen) return;
    setWorkSrc(imageSrc);
    setQuarterTurns(0);
    setFineAngle(0);
    setCropAspect(null);
    setCrop(undefined);
    setTool('move');
    setMasks([]);
    setStrokes([]);
    setTextBoxes([]);
    setImageLoaded(false);
  }, [isOpen, imageSrc]);

  const hasMarks = masks.length > 0 || strokes.length > 0 || textBoxes.length > 0;
  const hasCrop = !!crop && crop.width > 0 && crop.height > 0;
  const dirty = quarterTurns % 4 !== 0 || fineAngle !== 0 || hasCrop || hasMarks;

  // Posição da foto na tela (para tarjas/textos ficarem exatamente sobre ela)
  const measure = useCallback(() => {
    const img = imgRef.current;
    const overlay = overlayRef.current;
    if (!img || !overlay) return;
    const ir = img.getBoundingClientRect();
    const or = overlay.getBoundingClientRect();
    setImgRect({ left: ir.left - or.left, top: ir.top - or.top, width: ir.width, height: ir.height });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isOpen, measure, workSrc, imageLoaded]);

  // Rotação: gera a nova foto de trabalho
  const renderRotation = useCallback(
    async (turns: number, angle: number) => {
      const deg = (((turns % 4) + 4) % 4) * 90 + angle;
      setRotating(true);
      try {
        const next = deg === 0 ? imageSrc : await rotateImage(imageSrc, deg);
        setImageLoaded(false);
        setWorkSrc(next);
      } finally {
        setRotating(false);
      }
    },
    [imageSrc]
  );

  const rotateQuarter = async (delta: number) => {
    if (rotating) return;
    const turns = quarterTurns + delta;
    // Leva junto o que já foi marcado, para continuar no mesmo lugar da foto
    if (fineAngle === 0) {
      setMasks((prev) => prev.map((m) => rotateBox(m, delta)));
      setStrokes((prev) => prev.map((s) => ({ ...s, points: s.points.map((p) => rotatePoint(p, delta)) })));
      setTextBoxes((prev) =>
        prev.map((tb) => {
          const center = rotatePoint({ x: tb.x + tb.width / 2, y: tb.y + tb.height / 2 }, delta);
          return { ...tb, x: Math.max(0, center.x - tb.width / 2), y: Math.max(0, center.y - tb.height / 2) };
        })
      );
    }
    setCrop(undefined);
    setCropAspect(null);
    setQuarterTurns(turns);
    await renderRotation(turns, fineAngle);
  };

  // Ajuste fino: só aplica quando a pessoa solta o controle
  const commitFineAngle = async (angle: number) => {
    setCrop(undefined);
    setCropAspect(null);
    await renderRotation(quarterTurns, angle);
  };

  // Recorte
  const startCrop = (aspect: CropAspect) => {
    setCropAspect(aspect);
    const img = imgRef.current;
    if (aspect === null || !img) {
      setCrop(undefined);
      return;
    }
    const { naturalWidth: w, naturalHeight: h } = img;
    const a = aspect === 'free' ? w / h : aspect;
    setCrop(centerCrop(makeAspectCrop({ unit: '%', width: 80 }, a, w, h), w, h));
    setTool('move');
    requestAnimationFrame(() => overlayRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  };

  const showPhoto = () => requestAnimationFrame(() => overlayRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  const chooseTool = (t: Tool) => {
    setTool(t);
    if (t !== 'move') showPhoto();
  };

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

  // Arrastar (tarja, texto, lápis) com mouse ou dedo
  useEffect(() => {
    if (!isOpen) return;
    const onMove = (e: PointerEvent) => {
      const st = dragRef.current;
      const img = imgRef.current;
      if (!st || !img) return;
      const r = img.getBoundingClientRect();
      if (st.kind === 'pencil') {
        const p = toImage(e.clientX, e.clientY);
        if (!p) return;
        setStrokes((prev) => {
          if (!prev.length) return prev;
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, points: [...last.points, p] };
          return next;
        });
        return;
      }
      const dx = (e.clientX - st.startX) / r.width;
      const dy = (e.clientY - st.startY) / r.height;
      if (st.kind === 'text') {
        setTextBoxes((prev) =>
          prev.map((t) =>
            t.id === st.id
              ? { ...t, x: Math.min(Math.max(st.x + dx, 0), 1 - t.width), y: Math.min(Math.max(st.y + dy, 0), 1 - t.height) }
              : t
          )
        );
        return;
      }
      setMasks((prev) => {
        const next = [...prev];
        const m = st.orig;
        if (st.kind === 'mask-move') {
          next[st.index] = { ...m, x: Math.min(Math.max(m.x + dx, 0), 1 - m.width), y: Math.min(Math.max(m.y + dy, 0), 1 - m.height) };
        } else {
          next[st.index] = {
            ...m,
            width: Math.min(Math.max(m.width + dx, 0.03), 1 - m.x),
            height: Math.min(Math.max(m.height + dy, 0.03), 1 - m.y),
          };
        }
        return next;
      });
    };
    const onUp = () => {
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
  }, [isOpen]);

  // Fechar sem perder trabalho por engano
  const requestClose = useCallback(async () => {
    if (processing) return;
    if (dirty) {
      const ok = await confirmDialog(
        tr('Descartar as alterações desta foto?', 'Discard the changes to this photo?'),
        { confirmLabel: tr('Descartar', 'Discard'), danger: true }
      );
      if (!ok) return;
    }
    onClose();
  }, [dirty, processing, onClose, tr]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') void requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, requestClose]);

  if (!isOpen) return null;

  const addMask = (shape: PrivacyMaskShape) => {
    setTool('move');
    // No celular os botões ficam abaixo da foto: traz a foto de volta para a tela
    requestAnimationFrame(() => overlayRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
    // Começa no centro da foto; o usuário arrasta para onde quiser
    setMasks((prev) => [...prev, { x: 0.3, y: 0.4, width: 0.4, height: shape === 'circle' ? 0.4 * ((imgRect?.width || 1) / (imgRect?.height || 1)) : 0.2, shape }]);
  };

  const handleReset = async () => {
    setMasks([]);
    setStrokes([]);
    setTextBoxes([]);
    setCrop(undefined);
    setCropAspect(null);
    setTool('move');
    if (quarterTurns % 4 !== 0 || fineAngle !== 0) {
      setQuarterTurns(0);
      setFineAngle(0);
      await renderRotation(0, 0);
    }
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
      // 1) Marcações e tarjas na foto inteira (mesmas coordenadas que o usuário viu)
      if (allowClinicalAnnotations && (strokes.length || textBoxes.length)) {
        src = await rasterizeClinicalAnnotationsOnSource(src, strokes, textBoxes);
      }
      if (masks.length) {
        src = await applyImageTransformations(src, 0, null, masks);
      }
      // 2) Recorte por último
      if (hasCrop && crop) {
        const W = img.naturalWidth;
        const H = img.naturalHeight;
        const pc =
          crop.unit === '%'
            ? { x: (crop.x / 100) * W, y: (crop.y / 100) * H, width: (crop.width / 100) * W, height: (crop.height / 100) * H }
            : {
                x: crop.x * (W / img.width),
                y: crop.y * (H / img.height),
                width: crop.width * (W / img.width),
                height: crop.height * (H / img.height),
              };
        if (pc.width >= 2 && pc.height >= 2) src = await getCroppedImg(src, pc, 0);
      }
      onSave(src);
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
  const displayScale = imgRect ? imgRect.width / natW : 1;
  const textFontPx = Math.max(14, Math.min(natW, natH) * 0.028) * displayScale;

  const btn = (active: boolean) =>
    `px-3 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition-all border ${
      active ? 'text-white' : 'hover:bg-white/5'
    }`;
  const btnStyle = (active: boolean): React.CSSProperties => ({
    backgroundColor: active ? 'rgba(0,168,143,0.85)' : 'rgba(232,220,192,0.08)',
    borderColor: active ? TEAL : 'rgba(232,220,192,0.12)',
    color: active ? '#fff' : CREAM,
  });

  const cropOptions: { label: string; value: CropAspect }[] = [
    { label: tr('Sem recorte', 'No crop'), value: null },
    { label: tr('Livre', 'Free'), value: 'free' },
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '3:4', value: 3 / 4 },
    { label: '16:9', value: 16 / 9 },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
      onClick={() => void requestClose()}
    >
      <div
        className="relative w-full max-w-5xl h-full sm:h-auto sm:rounded-lg shadow-2xl flex flex-col"
        style={{ backgroundColor: '#1A2B32', border: '1px solid rgba(232, 220, 192, 0.2)', maxHeight: '100dvh' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`${tr('Editar', 'Edit')} ${imageLabel}`}
        data-testid="image-editor"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: 'rgba(232, 220, 192, 0.1)' }}>
          <h2 className="text-base sm:text-lg font-medium flex items-center gap-2" style={{ color: CREAM }}>
            <Crop className="w-5 h-5" /> {tr('Editar', 'Edit')} {imageLabel}
          </h2>
          <button onClick={() => void requestClose()} className="p-2 rounded-lg hover:bg-white/10" style={{ color: CREAM }} aria-label={tr('Fechar', 'Close')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4">
            {/* Foto */}
            <div className="lg:col-span-2">
              <div className="rounded-lg flex items-center justify-center p-2" style={{ backgroundColor: '#000', minHeight: 240 }}>
                <div ref={overlayRef} className="relative inline-block max-w-full">
                  {/* @ts-ignore - react-image-crop type issue */}
                  <ReactCrop
                    crop={crop}
                    onChange={(_: unknown, percentCrop: ReactCropType) => {
                      setCrop(percentCrop);
                      if (cropAspect === null && percentCrop.width > 0) setCropAspect('free');
                    }}
                    aspect={typeof cropAspect === 'number' ? cropAspect : undefined}
                    disabled={tool !== 'move' || rotating}
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
                      style={{ maxWidth: '100%', maxHeight: '58dvh', objectFit: 'contain', opacity: rotating ? 0.5 : 1 }}
                      draggable={false}
                    />
                  </ReactCrop>

                  {imgRect && (
                    <div
                      className="absolute"
                      style={{ left: imgRect.left, top: imgRect.top, width: imgRect.width, height: imgRect.height, pointerEvents: 'none', zIndex: 10 }}
                      data-testid="marks-layer"
                    >
                      {/* Lápis: camada que recebe o desenho */}
                      {allowClinicalAnnotations && (tool === 'pencil' || tool === 'text') && (
                        <div
                          className="absolute inset-0"
                          style={{ pointerEvents: 'auto', cursor: 'crosshair', touchAction: 'none' }}
                          onPointerDown={(e) => {
                            const p = toImage(e.clientX, e.clientY);
                            if (!p) return;
                            e.preventDefault();
                            if (tool === 'pencil') {
                              dragRef.current = { kind: 'pencil' };
                              setStrokes((prev) => [...prev, { points: [p], color: pencilColor, widthRel: pencilWidthRel }]);
                            } else {
                              const w = 0.3;
                              const h = 0.14;
                              setTextBoxes((prev) => [
                                ...prev,
                                { id: `tb-${Date.now()}`, x: Math.min(p.x, 1 - w), y: Math.min(p.y, 1 - h), width: w, height: h, text: tr('Texto', 'Text') },
                              ]);
                              setTool('move');
                            }
                          }}
                        />
                      )}

                      {/* Traços (prévia em escala real) */}
                      {allowClinicalAnnotations && strokes.length > 0 && (
                        <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${natW} ${natH}`} preserveAspectRatio="none" style={{ pointerEvents: 'none' }}>
                          {strokes.map((s, i) => {
                            const color = s.color === 'white' ? '#fff' : '#000';
                            const sw = Math.max(1, s.widthRel * Math.min(natW, natH));
                            if (s.points.length === 1) {
                              return <circle key={i} cx={s.points[0].x * natW} cy={s.points[0].y * natH} r={sw / 2} fill={color} />;
                            }
                            const d = s.points.map((p, j) => `${j ? 'L' : 'M'} ${p.x * natW} ${p.y * natH}`).join(' ');
                            return <path key={i} d={d} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />;
                          })}
                        </svg>
                      )}

                      {/* Tarjas */}
                      {masks.map((m, index) => (
                        <div
                          key={index}
                          className="absolute cursor-move"
                          data-testid="mask"
                          style={{
                            left: `${m.x * 100}%`,
                            top: `${m.y * 100}%`,
                            width: `${m.width * 100}%`,
                            height: `${m.height * 100}%`,
                            backgroundColor: '#000',
                            outline: '1px dashed rgba(255,255,255,0.6)',
                            borderRadius: m.shape === 'circle' ? '9999px' : '2px',
                            pointerEvents: tool === 'move' ? 'auto' : 'none',
                            touchAction: 'none',
                          }}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
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
                              dragRef.current = { kind: 'mask-resize', index, startX: e.clientX, startY: e.clientY, orig: m };
                            }}
                          />
                        </div>
                      ))}

                      {/* Caixas de texto (mesmo tamanho de letra do resultado) */}
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
                              backgroundColor: 'transparent',
                              pointerEvents: 'auto',
                            }}
                          >
                            <div
                              className="flex items-center justify-between px-1 cursor-grab text-[10px] shrink-0"
                              style={{ backgroundColor: 'rgba(0,168,143,0.85)', color: '#fff', touchAction: 'none' }}
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                dragRef.current = { kind: 'text', id: tb.id, startX: e.clientX, startY: e.clientY, x: tb.x, y: tb.y };
                              }}
                            >
                              <span className="flex items-center gap-1"><Hand className="w-3 h-3" /> {tr('Arrastar', 'Drag')}</span>
                              <button
                                type="button"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={() => setTextBoxes((prev) => prev.filter((t) => t.id !== tb.id))}
                                className="p-0.5 rounded hover:bg-white/20"
                                aria-label={tr('Remover caixa de texto', 'Remove text box')}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <textarea
                              value={tb.text}
                              onChange={(e) => setTextBoxes((prev) => prev.map((t) => (t.id === tb.id ? { ...t, text: e.target.value } : t)))}
                              className="flex-1 w-full p-1 resize-none border-0 bg-transparent focus:outline-none"
                              rows={Math.max(1, tb.text.split('\n').length)}
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
                  : tool === 'text'
                    ? tr('Toque na foto onde quer colocar o texto.', 'Tap the photo where you want the text.')
                    : tr('Arraste a tarja para onde quiser; o círculo branco muda o tamanho. O que você vê aqui é o que será salvo.', 'Drag the mask wherever you want; the white circle resizes it. What you see here is what will be saved.')}
              </p>
            </div>

            {/* Controles */}
            <div className="space-y-5">
              {/* Girar */}
              <section className="space-y-2">
                <h3 className="text-sm font-medium" style={{ color: CREAM }}>{tr('Girar', 'Rotate')}</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => void rotateQuarter(-1)} disabled={rotating} className={btn(false)} style={btnStyle(false)} title={tr('Girar 90° para a esquerda', 'Rotate 90° left')}>
                    <RotateCcw className="w-4 h-4" /> 90°
                  </button>
                  <button onClick={() => void rotateQuarter(1)} disabled={rotating} className={btn(false)} style={btnStyle(false)} title={tr('Girar 90° para a direita', 'Rotate 90° right')}>
                    <RotateCw className="w-4 h-4" /> 90°
                  </button>
                  <button onClick={() => void rotateQuarter(2)} disabled={rotating} className={btn(false)} style={btnStyle(false)} title={tr('Girar 180°', 'Rotate 180°')}>
                    180°
                  </button>
                </div>
                <label className="block text-xs" style={{ color: CREAM, opacity: 0.8 }}>
                  {tr('Endireitar', 'Straighten')}: {fineAngle > 0 ? '+' : ''}{fineAngle}°
                  <input
                    type="range"
                    min={-45}
                    max={45}
                    step={1}
                    value={fineAngle}
                    disabled={hasMarks || rotating}
                    onChange={(e) => setFineAngle(Number(e.target.value))}
                    onPointerUp={(e) => void commitFineAngle(Number((e.target as HTMLInputElement).value))}
                    onKeyUp={(e) => void commitFineAngle(Number((e.target as HTMLInputElement).value))}
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
              </section>

              {/* Tarjas */}
              <section className="space-y-2">
                <h3 className="text-sm font-medium" style={{ color: CREAM }}>{tr('Tarjas de privacidade', 'Privacy masks')}</h3>
                <p className="text-[11px]" style={{ color: CREAM, opacity: 0.6 }}>
                  {tr('Você escolhe o que cobrir (olhos, rosto, tatuagens…). A tarja é gravada na foto ao salvar.', 'You choose what to cover (eyes, face, tattoos…). The mask is burned into the photo when you save.')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => addMask('rect')} className={btn(false)} style={btnStyle(false)}>
                    <Square className="w-4 h-4" /> {tr('Tarja retangular', 'Rectangular mask')}
                  </button>
                  <button type="button" onClick={() => addMask('circle')} className={btn(false)} style={btnStyle(false)}>
                    <Circle className="w-4 h-4" /> {tr('Tarja circular', 'Circular mask')}
                  </button>
                </div>
                {masks.length > 0 && (
                  <ul className="space-y-1 max-h-28 overflow-y-auto">
                    {masks.map((m, i) => (
                      <li key={i} className="flex items-center justify-between text-xs rounded-md px-2 py-1 border" style={{ color: CREAM, borderColor: 'rgba(232,220,192,0.15)' }}>
                        <span>{m.shape === 'circle' ? tr('Tarja circular', 'Circular mask') : tr('Tarja retangular', 'Rectangular mask')} #{i + 1}</span>
                        <button type="button" onClick={() => setMasks((prev) => prev.filter((_, j) => j !== i))} className="p-1 rounded hover:bg-white/10" aria-label={tr('Remover tarja', 'Remove mask')}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Anotações Premium */}
              {allowClinicalAnnotations && (
                <section className="space-y-2 border-t pt-4" style={{ borderColor: 'rgba(232, 220, 192, 0.15)' }}>
                  <h3 className="text-sm font-medium flex items-center gap-2" style={{ color: CREAM }}>
                    <Pencil className="w-4 h-4" style={{ color: TEAL }} /> {tr('Marcações (Premium)', 'Annotations (Premium)')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setTool('move')} className={btn(tool === 'move')} style={btnStyle(tool === 'move')}>
                      <Hand className="w-4 h-4" /> {tr('Mover', 'Move')}
                    </button>
                    <button type="button" onClick={() => chooseTool('pencil')} className={btn(tool === 'pencil')} style={btnStyle(tool === 'pencil')}>
                      <Pencil className="w-4 h-4" /> {tr('Lápis', 'Pen')}
                    </button>
                    <button type="button" onClick={() => chooseTool('text')} className={btn(tool === 'text')} style={btnStyle(tool === 'text')}>
                      <Type className="w-4 h-4" /> {tr('Texto', 'Text')}
                    </button>
                  </div>
                  {tool === 'pencil' && (
                    <div className="flex flex-wrap gap-2 items-center text-xs" style={{ color: CREAM }}>
                      <span style={{ opacity: 0.8 }}>{tr('Cor:', 'Color:')}</span>
                      {(['black', 'white'] as AnnotationStrokeColor[]).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setPencilColor(c)}
                          className={`w-7 h-7 rounded-full border-2 ${pencilColor === c ? 'ring-2 ring-offset-2 ring-offset-[#1A2B32] ring-[#00A88F]' : ''}`}
                          style={{ backgroundColor: c === 'black' ? '#000' : '#fff', borderColor: 'rgba(232,220,192,0.4)' }}
                          aria-label={c === 'black' ? tr('Preto', 'Black') : tr('Branco', 'White')}
                        />
                      ))}
                      <label className="flex items-center gap-2 ml-1" style={{ opacity: 0.85 }}>
                        {tr('Espessura', 'Thickness')}
                        <input type="range" min={0.0015} max={0.012} step={0.0005} value={pencilWidthRel} onChange={(e) => setPencilWidthRel(Number(e.target.value))} className="w-24" style={{ accentColor: TEAL }} />
                      </label>
                    </div>
                  )}
                  {(strokes.length > 0 || textBoxes.length > 0) && (
                    <div className="flex flex-wrap gap-2 text-xs" style={{ color: CREAM }}>
                      <button type="button" onClick={() => setStrokes((prev) => prev.slice(0, -1))} disabled={!strokes.length} className="px-2 py-1 rounded bg-white/10 disabled:opacity-40 flex items-center gap-1">
                        <Undo2 className="w-3.5 h-3.5" /> {tr('Desfazer traço', 'Undo stroke')}
                      </button>
                      <button type="button" onClick={() => setStrokes([])} disabled={!strokes.length} className="px-2 py-1 rounded bg-white/10 disabled:opacity-40">
                        {tr('Apagar traços', 'Clear strokes')}
                      </button>
                    </div>
                  )}
                </section>
              )}

              <button onClick={() => void handleReset()} disabled={!dirty || rotating} className="w-full px-3 py-2 rounded-lg text-sm disabled:opacity-40 hover:bg-white/5 border" style={{ color: CREAM, borderColor: 'rgba(232,220,192,0.15)' }}>
                {tr('Desfazer tudo', 'Undo everything')}
              </button>
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
