'use client';

import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { X, RotateCw, RotateCcw, Crop, Check, Loader2, Square, Circle, Trash2, Pencil, Type } from 'lucide-react';
import ReactCrop, { Crop as ReactCropType, PixelCrop, makeAspectCrop, centerCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  applyImageTransformations,
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

type CropAspectRatio = number | undefined;
type ActiveTool = 'crop' | 'mask-rect' | 'mask-circle' | 'pencil';

function clientToNaturalNorm(
  clientX: number,
  clientY: number,
  img: HTMLImageElement | null
): { x: number; y: number } | null {
  if (!img || !img.naturalWidth) return null;
  const rect = img.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width;
  const y = (clientY - rect.top) / rect.height;
  if (x < 0 || x > 1 || y < 0 || y > 1) return null;
  return { x, y };
}

function textBoxOverlayStyle(
  tb: AnnotationTextBox,
  img: HTMLImageElement,
  overlay: HTMLElement
): React.CSSProperties {
  const ir = img.getBoundingClientRect();
  const or = overlay.getBoundingClientRect();
  return {
    position: 'absolute',
    left: ir.left - or.left + overlay.scrollLeft + tb.x * ir.width,
    top: ir.top - or.top + overlay.scrollTop + tb.y * ir.height,
    width: Math.max(tb.width * ir.width, 72),
    height: Math.max(tb.height * ir.height, 44),
    zIndex: 25,
  };
}

function imageOverlayRect(
  img: HTMLImageElement,
  overlay: HTMLElement
): { left: number; top: number; width: number; height: number } {
  const ir = img.getBoundingClientRect();
  const or = overlay.getBoundingClientRect();
  return {
    left: ir.left - or.left + overlay.scrollLeft,
    top: ir.top - or.top + overlay.scrollTop,
    width: ir.width,
    height: ir.height,
  };
}

export function ImageEditorModal({
  isOpen,
  onClose,
  onSave,
  imageSrc,
  imageLabel = 'Imagem',
  allowClinicalAnnotations = false,
}: ImageEditorModalProps) {
  const [crop, setCrop] = useState<ReactCropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<CropAspectRatio>(undefined);
  const [processing, setProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [activeTool, setActiveTool] = useState<ActiveTool>('crop');
  const [masks, setMasks] = useState<PrivacyMask[]>([]);
  const [strokes, setStrokes] = useState<AnnotationStroke[]>([]);
  const [textBoxes, setTextBoxes] = useState<AnnotationTextBox[]>([]);
  const [pencilColor, setPencilColor] = useState<AnnotationStrokeColor>('black');
  const [pencilWidthRel, setPencilWidthRel] = useState(0.004);
  const [pendingTextPlacement, setPendingTextPlacement] = useState(false);
  const drawingPencilRef = useRef(false);
  const [draggingTextId, setDraggingTextId] = useState<string | null>(null);
  const textDragRef = useRef<{
    mouseX: number;
    mouseY: number;
    x: number;
    y: number;
  } | null>(null);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [draggingMaskIndex, setDraggingMaskIndex] = useState<number | null>(null);
  const [resizingMaskIndex, setResizingMaskIndex] = useState<number | null>(null);
  const dragStateRef = useRef<{
    mouseX: number;
    mouseY: number;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Inicializar crop quando a imagem carregar
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImageLoaded(true);
    
    // Criar crop inicial centralizado (80% da imagem)
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 80,
          height: 80,
        },
        aspectRatio || naturalWidth / naturalHeight,
        naturalWidth,
        naturalHeight
      ),
      naturalWidth,
      naturalHeight
    );
    
    setCrop(initialCrop);
  }, [aspectRatio]);

  useEffect(() => {
    if (!isOpen) return;
    setStrokes([]);
    setTextBoxes([]);
    setPendingTextPlacement(false);
    setActiveTool('crop');
  }, [isOpen, imageSrc]);

  // Atualizar crop quando aspect ratio mudar
  React.useEffect(() => {
    if (imageLoaded && imgRef.current) {
      const { naturalWidth, naturalHeight } = imgRef.current;
      const newCrop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 80,
            height: 80,
          },
          aspectRatio || naturalWidth / naturalHeight,
          naturalWidth,
          naturalHeight
        ),
        naturalWidth,
        naturalHeight
      );
      setCrop(newCrop);
    }
  }, [aspectRatio, imageLoaded]);

  const handleRotate = (degrees: number) => {
    setRotation((prev) => (prev + degrees) % 360);
  };

  const handleReset = () => {
    if (imgRef.current) {
      const { naturalWidth, naturalHeight } = imgRef.current;
      const resetCrop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 80,
            height: 80,
          },
          aspectRatio || naturalWidth / naturalHeight,
          naturalWidth,
          naturalHeight
        ),
        naturalWidth,
        naturalHeight
      );
      setCrop(resetCrop);
    }
    setRotation(0);
    setZoom(1);
    setCompletedCrop(undefined);
    setMasks([]);
    setStrokes([]);
    setTextBoxes([]);
    setPendingTextPlacement(false);
    setActiveTool('crop');
  };

  const handleApply = async () => {
    const hasMasks = masks.length > 0;
    const hasAnnotations =
      allowClinicalAnnotations && (strokes.length > 0 || textBoxes.length > 0);
    if (!completedCrop && rotation === 0 && !hasMasks && !hasAnnotations) {
      onClose();
      return;
    }

    try {
      setProcessing(true);

      if (!imgRef.current) {
        throw new Error('Imagem não carregada');
      }

      const img = imgRef.current;
      const { naturalWidth, naturalHeight } = img;
      
      // Obter dimensões da imagem exibida (com zoom)
      const displayedWidth = img.clientWidth;
      const displayedHeight = img.clientHeight;
      
      // Calcular escala entre imagem exibida e imagem original
      const scaleX = naturalWidth / displayedWidth;
      const scaleY = naturalHeight / displayedHeight;

      // Converter PixelCrop (coordenadas da imagem exibida) para coordenadas da imagem original
      const pixelCrop = completedCrop ? {
        x: Math.round(completedCrop.x * scaleX),
        y: Math.round(completedCrop.y * scaleY),
        width: Math.round(completedCrop.width * scaleX),
        height: Math.round(completedCrop.height * scaleY),
      } : null;

      // Debug
      if (pixelCrop) {
        console.log('Crop aplicado (original):', pixelCrop);
        console.log('Escala:', { scaleX, scaleY, displayedWidth, displayedHeight, naturalWidth, naturalHeight });
      }

      let src = imageSrc;
      if (hasAnnotations) {
        src = await rasterizeClinicalAnnotationsOnSource(imageSrc, strokes, textBoxes);
      }

      const editedImage = await applyImageTransformations(
        src,
        rotation,
        pixelCrop,
        masks
      );

      onSave(editedImage);
      onClose();
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      alert('Erro ao processar imagem. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  const bumpLayout = useCallback(() => {
    setLayoutVersion((v) => v + 1);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    bumpLayout();
  }, [isOpen, zoom, rotation, crop, imageLoaded, bumpLayout]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const onResize = () => bumpLayout();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isOpen, bumpLayout]);

  useEffect(() => {
    if (!isOpen) return;
    const onMove = (e: MouseEvent) => {
      if (!drawingPencilRef.current || activeTool !== 'pencil' || !allowClinicalAnnotations) return;
      const p = clientToNaturalNorm(e.clientX, e.clientY, imgRef.current);
      if (!p) return;
      setStrokes((prev) => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        const last = next[next.length - 1];
        if (!last) return prev;
        next[next.length - 1] = {
          ...last,
          points: [...last.points, p],
        };
        return next;
      });
    };
    const onUp = () => {
      drawingPencilRef.current = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isOpen, activeTool, allowClinicalAnnotations]);

  useEffect(() => {
    if (draggingTextId === null) return;
    const onMove = (e: MouseEvent) => {
      const st = textDragRef.current;
      if (!st || !imgRef.current) return;
      const ir = imgRef.current.getBoundingClientRect();
      const dx = (e.clientX - st.mouseX) / ir.width;
      const dy = (e.clientY - st.mouseY) / ir.height;
      setTextBoxes((prev) =>
        prev.map((t) => {
          if (t.id !== draggingTextId) return t;
          const nx = Math.min(Math.max(st.x + dx, 0), 1 - t.width);
          const ny = Math.min(Math.max(st.y + dy, 0), 1 - t.height);
          return { ...t, x: nx, y: ny };
        })
      );
    };
    const onUp = () => {
      textDragRef.current = null;
      setDraggingTextId(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [draggingTextId]);

  if (!isOpen) return null;

  const startNewMask = (shape: PrivacyMaskShape) => {
    setPendingTextPlacement(false);
    setActiveTool(shape === 'rect' ? 'mask-rect' : 'mask-circle');
    // máscara padrão centralizada
    const defaultMask: PrivacyMask = {
      x: 0.3,
      y: 0.3,
      width: 0.4,
      height: 0.2,
      shape,
    };
    setMasks((prev) => [...prev, defaultMask]);
  };

  const handleMaskMouseDown = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    e.stopPropagation();
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const mask = masks[index];
    dragStateRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      x: mask.x,
      y: mask.y,
      width: mask.width,
      height: mask.height,
    };
    setDraggingMaskIndex(index);
  };

  const handleResizeHandleMouseDown = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    e.stopPropagation();
    if (!overlayRef.current) return;
    const mask = masks[index];
    dragStateRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      x: mask.x,
      y: mask.y,
      width: mask.width,
      height: mask.height,
    };
    setResizingMaskIndex(index);
  };

  const handleOverlayMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!overlayRef.current || !dragStateRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const dragState = dragStateRef.current;
    if (!dragState) return;
    const dx = (e.clientX - dragState.mouseX) / rect.width;
    const dy = (e.clientY - dragState.mouseY) / rect.height;

    if (draggingMaskIndex !== null) {
      setMasks((prev) => {
        const next = [...prev];
        const m = next[draggingMaskIndex];
        if (!m) return prev;
        const newX = Math.min(Math.max(dragState.x + dx, 0), 1 - m.width);
        const newY = Math.min(Math.max(dragState.y + dy, 0), 1 - m.height);
        next[draggingMaskIndex] = { ...m, x: newX, y: newY };
        return next;
      });
    } else if (resizingMaskIndex !== null) {
      setMasks((prev) => {
        const next = [...prev];
        const m = next[resizingMaskIndex];
        if (!m) return prev;
        const minSize = 0.05;
        let newWidth = Math.max(dragState.width + dx, minSize);
        let newHeight = Math.max(dragState.height + dy, minSize);
        newWidth = Math.min(newWidth, 1 - m.x);
        newHeight = Math.min(newHeight, 1 - m.y);
        next[resizingMaskIndex] = { ...m, width: newWidth, height: newHeight };
        return next;
      });
    }
  };

  const handleOverlayMouseUp = () => {
    setDraggingMaskIndex(null);
    setResizingMaskIndex(null);
    dragStateRef.current = null;
  };

  const handleRemoveMask = (index: number) => {
    setMasks((prev) => prev.filter((_, i) => i !== index));
  };

  const interactionLayerStyle = (): React.CSSProperties => {
    void layoutVersion;
    const img = imgRef.current;
    const overlay = overlayRef.current;
    if (!img || !overlay) {
      return { display: 'none' };
    }
    const ir = img.getBoundingClientRect();
    const or = overlay.getBoundingClientRect();
    const active = allowClinicalAnnotations && (activeTool === 'pencil' || pendingTextPlacement);
    return {
      position: 'absolute',
      left: ir.left - or.left + overlay.scrollLeft,
      top: ir.top - or.top + overlay.scrollTop,
      width: ir.width,
      height: ir.height,
      zIndex: 15,
      pointerEvents: active ? 'auto' : 'none',
      cursor: active ? 'crosshair' : 'default',
      touchAction: 'none',
    };
  };

  const drawingPreviewStyle = (): React.CSSProperties => {
    void layoutVersion;
    const img = imgRef.current;
    const overlay = overlayRef.current;
    if (!img || !overlay) return { display: 'none' };
    const r = imageOverlayRect(img, overlay);
    return {
      position: 'absolute',
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
      zIndex: 30,
      pointerEvents: 'none',
    };
  };

  const handlePencilMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!allowClinicalAnnotations || activeTool !== 'pencil' || !imgRef.current) return;
    const p = clientToNaturalNorm(e.clientX, e.clientY, imgRef.current);
    if (!p) return;
    drawingPencilRef.current = true;
    setStrokes((prev) => [
      ...prev,
      { points: [p], color: pencilColor, widthRel: pencilWidthRel },
    ]);
  };

  const handleTextPlaceClick = (e: React.MouseEvent) => {
    if (!pendingTextPlacement || !allowClinicalAnnotations || !imgRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    const p = clientToNaturalNorm(e.clientX, e.clientY, imgRef.current);
    if (!p) return;
    const defaultW = 0.3;
    const defaultH = 0.14;
    const id = `tb-${Date.now()}`;
    setTextBoxes((prev) => [
      ...prev,
      {
        id,
        x: Math.max(0, Math.min(p.x, 1 - defaultW)),
        y: Math.max(0, Math.min(p.y, 1 - defaultH)),
        width: defaultW,
        height: defaultH,
        text: 'Texto',
      },
    ]);
    setPendingTextPlacement(false);
    setActiveTool('crop');
  };

  const handleTextDragMouseDown = (e: React.MouseEvent, tb: AnnotationTextBox) => {
    e.stopPropagation();
    e.preventDefault();
    textDragRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      x: tb.x,
      y: tb.y,
    };
    setDraggingTextId(tb.id);
  };

  const handleRemoveTextBox = (id: string) => {
    setTextBoxes((prev) => prev.filter((t) => t.id !== id));
  };

  const handleRemoveLastStroke = () => {
    setStrokes((prev) => prev.slice(0, -1));
  };

  const handleClearAllStrokes = () => {
    setStrokes([]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl rounded-none sm:rounded-lg shadow-2xl flex flex-col"
        style={{
          backgroundColor: '#1A2B32',
          border: '1px solid rgba(232, 220, 192, 0.2)',
          maxHeight: '95vh',
          minHeight: 'min-content',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(232, 220, 192, 0.1)' }}>
          <div className="flex items-center gap-3">
            <Crop className="w-5 h-5" style={{ color: '#E8DCC0' }} />
            <h2 className="text-lg sm:text-xl font-medium" style={{ color: '#E8DCC0' }}>
              Editar {imageLabel}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: '#E8DCC0' }}
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0" style={{ maxHeight: 'calc(95vh - 140px)' }}>
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4">
            {/* Área de Crop + Tarjas */}
            <div className="lg:col-span-2 order-1">
              <div className="space-y-2">
                <div
                  className="relative rounded-lg overflow-hidden"
                  style={{
                    backgroundColor: '#000000',
                    width: '100%',
                    minHeight: '400px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    ref={overlayRef}
                    className="relative w-full h-full"
                    onMouseMove={handleOverlayMouseMove}
                    onMouseUp={handleOverlayMouseUp}
                  >
                    {/* @ts-ignore - react-image-crop type issue */}
                    <ReactCrop
                      crop={crop}
                      onChange={(_: ReactCropType | undefined, percentCrop: ReactCropType) => setCrop(percentCrop)}
                      onComplete={(c: PixelCrop) => setCompletedCrop(c)}
                      aspect={aspectRatio}
                      className="max-w-full"
                      locked={false}
                      disabled={activeTool === 'pencil' || pendingTextPlacement}
                    >
                      <img
                        ref={imgRef}
                        src={imageSrc}
                        alt="Crop"
                        onLoad={(e) => {
                          onImageLoad(e);
                          bumpLayout();
                        }}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '70vh',
                          transform: `rotate(${rotation}deg) scale(${zoom})`,
                          objectFit: 'contain',
                          transformOrigin: 'center center',
                        }}
                      />
                    </ReactCrop>

                    {/* Tarjas existentes */}
                    {masks.map((mask, index) => (
                      <div
                        key={index}
                        className="absolute border border-white/40 cursor-move group"
                        style={{
                          left: `${mask.x * 100}%`,
                          top: `${mask.y * 100}%`,
                          width: `${mask.width * 100}%`,
                          height: `${mask.height * 100}%`,
                          backgroundColor: 'rgba(0,0,0,0.9)',
                          borderRadius: mask.shape === 'circle' ? '9999px' : '4px',
                        }}
                        onMouseDown={(e) => handleMaskMouseDown(e, index)}
                      >
                        <div
                          className="absolute right-0 bottom-0 w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full border border-black/40 cursor-se-resize opacity-80 group-hover:opacity-100"
                          onMouseDown={(e) => handleResizeHandleMouseDown(e, index)}
                        />
                      </div>
                    ))}

                    {allowClinicalAnnotations && (
                      <div
                        role="presentation"
                        style={interactionLayerStyle()}
                        onMouseDown={activeTool === 'pencil' ? handlePencilMouseDown : undefined}
                        onClick={pendingTextPlacement ? handleTextPlaceClick : undefined}
                      />
                    )}

                    {allowClinicalAnnotations && strokes.length > 0 && (
                      <svg
                        style={drawingPreviewStyle()}
                        viewBox="0 0 1 1"
                        preserveAspectRatio="none"
                      >
                        {strokes.map((stroke, i) => {
                          if (!stroke.points.length) return null;
                          const color = stroke.color === 'white' ? '#ffffff' : '#000000';
                          const strokeWidth = Math.max(0.002, stroke.widthRel * 2.2);
                          if (stroke.points.length === 1) {
                            const p = stroke.points[0];
                            return (
                              <circle
                                key={`dot-${i}`}
                                cx={p.x}
                                cy={p.y}
                                r={strokeWidth}
                                fill={color}
                                opacity={0.95}
                              />
                            );
                          }
                          const d = stroke.points
                            .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                            .join(' ');
                          return (
                            <path
                              key={`path-${i}`}
                              d={d}
                              fill="none"
                              stroke={color}
                              strokeWidth={strokeWidth}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              opacity={0.95}
                            />
                          );
                        })}
                      </svg>
                    )}

                    {allowClinicalAnnotations &&
                      layoutVersion >= 0 &&
                      imgRef.current &&
                      overlayRef.current &&
                      textBoxes.map((tb) => (
                        <div
                          key={tb.id}
                          className="rounded-md border flex flex-col overflow-hidden shadow-lg"
                          style={{
                            ...textBoxOverlayStyle(tb, imgRef.current!, overlayRef.current!),
                            borderColor: 'rgba(0, 168, 143, 0.55)',
                            backgroundColor: 'rgba(15, 23, 42, 0.92)',
                          }}
                        >
                          <div
                            className="flex items-center justify-between px-1 py-0.5 cursor-grab active:cursor-grabbing text-[10px] shrink-0"
                            style={{
                              backgroundColor: 'rgba(0, 168, 143, 0.25)',
                              color: '#E8DCC0',
                            }}
                            onMouseDown={(e) => handleTextDragMouseDown(e, tb)}
                          >
                            <span>Arrastar</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTextBox(tb.id);
                              }}
                              className="p-0.5 rounded hover:bg-white/10"
                              aria-label="Remover caixa de texto"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <textarea
                            value={tb.text}
                            onChange={(e) =>
                              setTextBoxes((prev) =>
                                prev.map((t) =>
                                  t.id === tb.id ? { ...t, text: e.target.value } : t
                                )
                              )
                            }
                            className="flex-1 min-h-[32px] w-full text-[11px] leading-snug p-1.5 resize-none border-0 focus:outline-none focus:ring-1 focus:ring-[#00A88F]/50"
                            style={{
                              backgroundColor: 'rgba(2, 6, 23, 0.95)',
                              color: '#f1f5f9',
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                          />
                        </div>
                      ))}
                  </div>
                </div>
                <p className="text-xs text-center" style={{ color: '#E8DCC0', opacity: 0.7 }}>
                  💡 Crop: arraste para mover / redimensionar • Tarja: clique no botão para criar, depois arraste a tarja ou o círculo para ajustar
                </p>
              </div>
            </div>

            {/* Controles */}
            <div className="space-y-4 order-2 lg:order-2">
              {/* Rotação */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium" style={{ color: '#E8DCC0' }}>
                  Rotação:
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleRotate(-90)}
                    className="px-3 py-2 rounded-lg text-sm transition-all hover:opacity-90 flex items-center gap-2"
                    style={{
                      backgroundColor: 'rgba(232, 220, 192, 0.1)',
                      color: '#E8DCC0',
                    }}
                    title="Rotacionar 90° anti-horário"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>90°</span>
                  </button>
                  <button
                    onClick={() => handleRotate(90)}
                    className="px-3 py-2 rounded-lg text-sm transition-all hover:opacity-90 flex items-center gap-2"
                    style={{
                      backgroundColor: 'rgba(232, 220, 192, 0.1)',
                      color: '#E8DCC0',
                    }}
                    title="Rotacionar 90° horário"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>90°</span>
                  </button>
                  <button
                    onClick={() => handleRotate(180)}
                    className="px-3 py-2 rounded-lg text-sm transition-all hover:opacity-90"
                    style={{
                      backgroundColor: 'rgba(232, 220, 192, 0.1)',
                      color: '#E8DCC0',
                    }}
                    title="Rotacionar 180°"
                  >
                    180°
                  </button>
                </div>
                <div className="space-y-1">
                  <label className="text-xs" style={{ color: '#E8DCC0', opacity: 0.8 }}>
                    Rotação Livre: {rotation}°
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: '#00A88F' }}
                  />
                </div>
              </div>

              {/* Privacidade - Tarjas */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium" style={{ color: '#E8DCC0' }}>
                  Privacidade (tarjas):
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startNewMask('rect')}
                    className={`px-3 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-2 transition-all ${
                      activeTool === 'mask-rect'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[rgba(232,220,192,0.1)] text-[rgba(232,220,192,0.9)] hover:opacity-90'
                    }`}
                  >
                    <Square className="w-4 h-4" />
                    Tarja retangular
                  </button>
                  <button
                    type="button"
                    onClick={() => startNewMask('circle')}
                    className={`px-3 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-2 transition-all ${
                      activeTool === 'mask-circle'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[rgba(232,220,192,0.1)] text-[rgba(232,220,192,0.9)] hover:opacity-90'
                    }`}
                  >
                    <Circle className="w-4 h-4" />
                    Tarja circular
                  </button>
                </div>
                {masks.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs" style={{ color: '#E8DCC0', opacity: 0.7 }}>
                      Tarjas aplicadas (serão “gravadas” na imagem ao salvar):
                    </p>
                    <ul className="space-y-1 max-h-24 overflow-y-auto pr-1">
                      {masks.map((mask, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between text-xs rounded-md px-2 py-1 bg-[rgba(232,220,192,0.05)] border border-[rgba(232,220,192,0.15)]"
                          style={{ color: '#E8DCC0' }}
                        >
                          <span>
                            {mask.shape === 'circle' ? 'Tarja circular' : 'Tarja retangular'} #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMask(index)}
                            className="p-1 rounded hover:bg-white/10"
                            aria-label="Remover tarja"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {allowClinicalAnnotations && (
                <div className="space-y-2 border-t pt-3" style={{ borderColor: 'rgba(232, 220, 192, 0.15)' }}>
                  <h3 className="text-sm font-medium flex items-center gap-2" style={{ color: '#E8DCC0' }}>
                    <Pencil className="w-4 h-4" style={{ color: '#00A88F' }} />
                    Anotações (Premium)
                  </h3>
                  <p className="text-[11px]" style={{ color: '#E8DCC0', opacity: 0.65 }}>
                    Lápis e texto são gravados na imagem ao salvar. Use crop/tarjas depois, se precisar.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPendingTextPlacement(false);
                        setActiveTool('crop');
                      }}
                      className={`px-3 py-2 rounded-lg text-xs flex items-center gap-1 transition-all ${
                        activeTool === 'crop' && !pendingTextPlacement
                          ? 'ring-2 ring-[#00A88F]'
                          : ''
                      }`}
                      style={{
                        backgroundColor: 'rgba(232, 220, 192, 0.1)',
                        color: '#E8DCC0',
                      }}
                    >
                      <Crop className="w-3.5 h-3.5" />
                      Crop
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPendingTextPlacement(false);
                        setActiveTool('pencil');
                      }}
                      className={`px-3 py-2 rounded-lg text-xs flex items-center gap-1 transition-all ${
                        activeTool === 'pencil' ? 'bg-emerald-600 text-white' : 'bg-[rgba(232,220,192,0.1)] text-[rgba(232,220,192,0.9)]'
                      }`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Lápis
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTool('crop');
                        setPendingTextPlacement(true);
                      }}
                      className={`px-3 py-2 rounded-lg text-xs flex items-center gap-1 transition-all ${
                        pendingTextPlacement ? 'bg-emerald-600 text-white' : 'bg-[rgba(232,220,192,0.1)] text-[rgba(232,220,192,0.9)]'
                      }`}
                    >
                      <Type className="w-3.5 h-3.5" />
                      Caixa de texto
                    </button>
                  </div>
                  {activeTool === 'pencil' && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-xs" style={{ color: '#E8DCC0', opacity: 0.8 }}>
                        Cor:
                      </span>
                      <button
                        type="button"
                        onClick={() => setPencilColor('black')}
                        className={`px-2 py-1 rounded text-xs ${pencilColor === 'black' ? 'ring-2 ring-[#00A88F]' : ''}`}
                        style={{ backgroundColor: '#111', color: '#fff' }}
                      >
                        Preta
                      </button>
                      <button
                        type="button"
                        onClick={() => setPencilColor('white')}
                        className={`px-2 py-1 rounded text-xs ${pencilColor === 'white' ? 'ring-2 ring-[#00A88F]' : ''}`}
                        style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}
                      >
                        Branca
                      </button>
                      <label className="text-xs flex items-center gap-2 ml-1" style={{ color: '#E8DCC0', opacity: 0.85 }}>
                        Traço
                        <input
                          type="range"
                          min={0.0015}
                          max={0.012}
                          step={0.0005}
                          value={pencilWidthRel}
                          onChange={(e) => setPencilWidthRel(Number(e.target.value))}
                          className="w-20"
                          style={{ accentColor: '#00A88F' }}
                        />
                      </label>
                    </div>
                  )}
                  {pendingTextPlacement && (
                    <p className="text-[11px]" style={{ color: '#fde68a' }}>
                      Toque na imagem para posicionar a caixa de texto.
                    </p>
                  )}
                  {(strokes.length > 0 || textBoxes.length > 0) && (
                    <div className="space-y-1 text-[11px]" style={{ color: '#E8DCC0', opacity: 0.85 }}>
                      <p>Traços: {strokes.length} · Textos: {textBoxes.length}</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleRemoveLastStroke}
                          disabled={strokes.length === 0}
                          className="px-2 py-1 rounded bg-white/10 disabled:opacity-40"
                        >
                          Desfazer último traço
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAllStrokes}
                          disabled={strokes.length === 0}
                          className="px-2 py-1 rounded bg-white/10 disabled:opacity-40"
                        >
                          Limpar traços
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Zoom */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium" style={{ color: '#E8DCC0' }}>
                  Zoom:
                </h3>
                <div className="space-y-1">
                  <label className="text-xs" style={{ color: '#E8DCC0', opacity: 0.8 }}>
                    {Math.round(zoom * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: '#00A88F' }}
                  />
                </div>
              </div>

              {/* Proporções de Crop */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium" style={{ color: '#E8DCC0' }}>
                  Proporções:
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setAspectRatio(undefined)}
                    className={`px-3 py-2 rounded-lg text-xs transition-all ${
                      aspectRatio === undefined
                        ? 'ring-2'
                        : ''
                    }`}
                    style={{
                      backgroundColor: aspectRatio === undefined
                        ? 'rgba(0, 168, 143, 0.2)'
                        : 'rgba(232, 220, 192, 0.1)',
                      border: aspectRatio === undefined
                        ? '2px solid #00A88F'
                        : '1px solid rgba(232, 220, 192, 0.1)',
                      color: '#E8DCC0',
                    }}
                  >
                    Livre
                  </button>
                  <button
                    onClick={() => setAspectRatio(1)}
                    className={`px-3 py-2 rounded-lg text-xs transition-all ${
                      aspectRatio === 1
                        ? 'ring-2'
                        : ''
                    }`}
                    style={{
                      backgroundColor: aspectRatio === 1
                        ? 'rgba(0, 168, 143, 0.2)'
                        : 'rgba(232, 220, 192, 0.1)',
                      border: aspectRatio === 1
                        ? '2px solid #00A88F'
                        : '1px solid rgba(232, 220, 192, 0.1)',
                      color: '#E8DCC0',
                    }}
                  >
                    1:1
                  </button>
                  <button
                    onClick={() => setAspectRatio(4 / 3)}
                    className={`px-3 py-2 rounded-lg text-xs transition-all ${
                      aspectRatio === 4 / 3
                        ? 'ring-2'
                        : ''
                    }`}
                    style={{
                      backgroundColor: aspectRatio === 4 / 3
                        ? 'rgba(0, 168, 143, 0.2)'
                        : 'rgba(232, 220, 192, 0.1)',
                      border: aspectRatio === 4 / 3
                        ? '2px solid #00A88F'
                        : '1px solid rgba(232, 220, 192, 0.1)',
                      color: '#E8DCC0',
                    }}
                  >
                    4:3
                  </button>
                  <button
                    onClick={() => setAspectRatio(16 / 9)}
                    className={`px-3 py-2 rounded-lg text-xs transition-all ${
                      aspectRatio === 16 / 9
                        ? 'ring-2'
                        : ''
                    }`}
                    style={{
                      backgroundColor: aspectRatio === 16 / 9
                        ? 'rgba(0, 168, 143, 0.2)'
                        : 'rgba(232, 220, 192, 0.1)',
                      border: aspectRatio === 16 / 9
                        ? '2px solid #00A88F'
                        : '1px solid rgba(232, 220, 192, 0.1)',
                      color: '#E8DCC0',
                    }}
                  >
                    16:9
                  </button>
                  <button
                    onClick={() => setAspectRatio(3 / 4)}
                    className={`px-3 py-2 rounded-lg text-xs transition-all ${
                      aspectRatio === 3 / 4
                        ? 'ring-2'
                        : ''
                    }`}
                    style={{
                      backgroundColor: aspectRatio === 3 / 4
                        ? 'rgba(0, 168, 143, 0.2)'
                        : 'rgba(232, 220, 192, 0.1)',
                      border: aspectRatio === 3 / 4
                        ? '2px solid #00A88F'
                        : '1px solid rgba(232, 220, 192, 0.1)',
                      color: '#E8DCC0',
                    }}
                  >
                    3:4
                  </button>
                </div>
              </div>

              {/* Reset */}
              <button
                onClick={handleReset}
                className="w-full px-3 py-2 rounded-lg text-sm transition-all hover:opacity-90"
                style={{
                  backgroundColor: 'rgba(232, 220, 192, 0.1)',
                  color: '#E8DCC0',
                }}
              >
                Resetar Alterações
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t flex-shrink-0" style={{ borderColor: 'rgba(232, 220, 192, 0.1)' }}>
          <button
            onClick={onClose}
            disabled={processing}
            className="px-4 py-2 rounded-lg transition-colors text-sm disabled:opacity-50"
            style={{
              backgroundColor: 'rgba(232, 220, 192, 0.1)',
              color: '#E8DCC0',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            disabled={processing || !imageLoaded}
            className="px-6 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            style={{
              backgroundColor: '#00A88F',
              color: '#FFFFFF',
            }}
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
