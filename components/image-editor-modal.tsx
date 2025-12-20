'use client';

import React, { useState, useCallback } from 'react';
import { X, RotateCw, RotateCcw, Crop, Check, Loader2 } from 'lucide-react';
import Cropper, { Area } from 'react-easy-crop';
import { applyImageTransformations } from '@/lib/image-editor-utils';
import 'react-easy-crop/react-easy-crop.css';

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (editedImage: string) => void;
  imageSrc: string;
  imageLabel?: string;
}

type CropAspectRatio = number | undefined;

export function ImageEditorModal({
  isOpen,
  onClose,
  onSave,
  imageSrc,
  imageLabel = 'Imagem',
}: ImageEditorModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [aspectRatio, setAspectRatio] = useState<CropAspectRatio>(undefined);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleRotate = (degrees: number) => {
    setRotation((prev) => (prev + degrees) % 360);
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setAspectRatio(undefined);
    setCroppedAreaPixels(null);
  };

  const handleApply = async () => {
    // Se não há alterações, apenas fechar
    if (!croppedAreaPixels && rotation === 0) {
      onClose();
      return;
    }

    try {
      setProcessing(true);

      // Debug: verificar se croppedAreaPixels está sendo capturado
      if (croppedAreaPixels) {
        console.log('Crop aplicado:', croppedAreaPixels);
      }

      const editedImage = await applyImageTransformations(
        imageSrc,
        rotation,
        croppedAreaPixels || null
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

  if (!isOpen) return null;

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
            {/* Área de Crop */}
            <div className="lg:col-span-2 order-1">
              <div className="space-y-2">
                <div
                  className="relative rounded-lg overflow-hidden"
                  style={{
                    backgroundColor: '#000000',
                    width: '100%',
                    height: '400px',
                    minHeight: '350px',
                  }}
                >
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={aspectRatio}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onRotationChange={setRotation}
                    onCropComplete={onCropComplete}
                    cropShape="rect"
                    showGrid={true}
                    restrictPosition={false}
                    style={{
                      containerStyle: {
                        width: '100%',
                        height: '100%',
                      },
                      cropAreaStyle: {
                        border: '2px solid #00A88F',
                      },
                    }}
                  />
                </div>
                <p className="text-xs text-center" style={{ color: '#E8DCC0', opacity: 0.7 }}>
                  💡 Arraste para mover • Arraste os cantos para redimensionar
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
                    min="1"
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
            disabled={processing}
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
                <span>Aplicar Alterações</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

