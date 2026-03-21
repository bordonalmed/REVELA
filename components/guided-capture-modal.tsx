'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, Loader2 } from 'lucide-react';

interface GuidedCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  overlayImage: string | null;
  onCapture: (capturedBase64: string) => void;
  isPremiumUser: boolean;
}

export function GuidedCaptureModal({
  isOpen,
  onClose,
  overlayImage,
  onCapture,
  isPremiumUser,
}: GuidedCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.4);
  const [loadingCamera, setLoadingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      if (!isOpen || !isPremiumUser) return;
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Câmera não suportada neste dispositivo/navegador.');
        return;
      }

      try {
        setLoadingCamera(true);
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error('Erro ao acessar câmera:', err);
        setCameraError('Não foi possível acessar a câmera. Verifique permissões e tente novamente.');
      } finally {
        setLoadingCamera(false);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, isPremiumUser]);

  const handleCapture = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onCapture(dataUrl);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-lg shadow-2xl flex flex-col"
        style={{ backgroundColor: '#020617', border: '1px solid rgba(30,64,175,0.7)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: 'rgba(30,64,175,0.7)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center border border-sky-400/70 bg-sky-500/10">
              <Camera className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base md:text-lg font-semibold" style={{ color: '#e5e7eb' }}>
                Captura guiada
              </h2>
              <p className="text-[11px] sm:text-xs" style={{ color: '#9ca3af' }}>
                Alinhe a nova foto com o contorno anterior para padronizar o enquadramento.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800/80"
            style={{ color: '#e5e7eb' }}
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-4 space-y-3">
          {!isPremiumUser && (
            <p className="text-sm" style={{ color: '#f87171' }}>
              Captura guiada é exclusiva do plano Revela Premium.
            </p>
          )}

          {cameraError && (
            <div
              className="p-3 rounded-md text-xs sm:text-sm"
              style={{
                backgroundColor: 'rgba(220,38,38,0.12)',
                border: '1px solid rgba(220,38,38,0.6)',
                color: '#fecaca',
              }}
            >
              {cameraError}
            </div>
          )}

          <div className="w-full aspect-[4/3] max-h-[480px] mx-auto relative rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(30,64,175,0.7)' }}>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            {overlayImage && (
              <img
                src={overlayImage}
                alt="Overlay"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={{
                  opacity: overlayOpacity,
                  mixBlendMode: 'screen',
                }}
              />
            )}
            {/* Guias de alinhamento */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-y-0 left-1/2 w-px" style={{ backgroundColor: 'rgba(148,163,184,0.5)' }} />
              <div className="absolute inset-x-0 top-1/2 h-px" style={{ backgroundColor: 'rgba(148,163,184,0.5)' }} />
              <div className="absolute inset-6 border border-dashed" style={{ borderColor: 'rgba(148,163,184,0.4)' }} />
            </div>
            {loadingCamera && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] sm:text-xs" style={{ color: '#9ca3af' }}>
            <span>Alinhe a nova foto com o contorno anterior.</span>
            <div className="flex items-center gap-2">
              <span>Opacidade do overlay</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(overlayOpacity * 100)}
                onChange={(e) => setOverlayOpacity(Number(e.target.value) / 100)}
                className="w-32"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t" style={{ borderColor: 'rgba(30,64,175,0.7)' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium"
            style={{ color: '#9ca3af', backgroundColor: 'transparent' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCapture}
            disabled={!isPremiumUser || !!cameraError || loadingCamera}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#0ea5e9', color: '#0b1120' }}
          >
            <Camera className="w-4 h-4" />
            Capturar
          </button>
        </div>
      </div>
    </div>
  );
}

