'use client';

import React, { useState, useEffect } from 'react';
import { X, Instagram, Download, Loader2 } from 'lucide-react';
import { exportForSocialMedia, generateSocialMediaPreview, getSocialMediaFormats, type SocialMediaFormat } from '@/lib/export-utils';

interface SocialMediaExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  beforeImage: string;
  afterImage: string;
  projectName: string;
}

export function SocialMediaExportModal({
  isOpen,
  onClose,
  beforeImage,
  afterImage,
  projectName,
}: SocialMediaExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<SocialMediaFormat>('instagram-feed-1x1');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [includeLogo, setIncludeLogo] = useState(true);

  const formats = getSocialMediaFormats();

  // Gerar preview quando formato mudar
  useEffect(() => {
    if (isOpen && beforeImage && afterImage) {
      generatePreview();
    }
  }, [selectedFormat, isOpen, beforeImage, afterImage]);

  const generatePreview = async () => {
    try {
      setGeneratingPreview(true);
      const preview = await generateSocialMediaPreview(beforeImage, afterImage, selectedFormat);
      setPreviewUrl(preview);
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
    } finally {
      setGeneratingPreview(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportForSocialMedia(
        beforeImage,
        afterImage,
        projectName,
        selectedFormat,
        {
          includeLogo,
          includeInfo: false,
        }
      );
      // Pequeno delay para feedback visual
      setTimeout(() => {
        setExporting(false);
        onClose();
      }, 500);
    } catch (error: any) {
      console.error('Erro ao exportar:', error);
      alert(error.message || 'Erro ao exportar imagem. Tente novamente.');
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  const selectedFormatInfo = formats.find(f => f.id === selectedFormat);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-0 sm:p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-none sm:rounded-lg shadow-2xl flex flex-col"
        style={{
          backgroundColor: '#1A2B32',
          border: '1px solid rgba(232, 220, 192, 0.2)',
          minHeight: '100vh',
          maxHeight: '100vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixo */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0 sticky top-0 z-10" style={{ backgroundColor: '#1A2B32', borderColor: 'rgba(232, 220, 192, 0.1)' }}>
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <Instagram className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" style={{ color: '#E8DCC0' }} />
            <h2 className="text-base sm:text-xl md:text-2xl font-medium truncate" style={{ color: '#E8DCC0' }}>
              Publicar nas Redes Sociais
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-white/10 flex-shrink-0"
            style={{ color: '#E8DCC0' }}
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Com Scroll */}
        <div className="p-4 overflow-y-auto flex-1 min-h-0" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Seleção de Formato */}
            <div className="space-y-3 sm:space-y-4 order-2 lg:order-1">
              <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4" style={{ color: '#E8DCC0' }}>
                Escolha o formato:
              </h3>
              
              <div className="space-y-2">
                {formats.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    className={`w-full p-3 sm:p-4 rounded-lg text-left transition-all ${
                      selectedFormat === format.id
                        ? 'ring-2'
                        : 'hover:bg-white/5'
                    }`}
                    style={{
                      backgroundColor: selectedFormat === format.id ? 'rgba(0, 168, 143, 0.2)' : 'rgba(232, 220, 192, 0.05)',
                      border: selectedFormat === format.id ? '2px solid #00A88F' : '1px solid rgba(232, 220, 192, 0.1)',
                      color: '#E8DCC0',
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium mb-1 text-sm sm:text-base">{format.name}</div>
                        <div className="text-xs sm:text-sm opacity-80">{format.description}</div>
                        <div className="text-xs opacity-60 mt-1">
                          {format.width} × {format.height}px
                        </div>
                      </div>
                      {selectedFormat === format.id && (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#00A88F' }}>
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FFFFFF' }} />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Opções */}
              <div className="pt-3 sm:pt-4 border-t" style={{ borderColor: 'rgba(232, 220, 192, 0.1)' }}>
                <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeLogo}
                    onChange={(e) => setIncludeLogo(e.target.checked)}
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded flex-shrink-0"
                    style={{ accentColor: '#00A88F' }}
                  />
                  <span className="text-sm sm:text-base" style={{ color: '#E8DCC0' }}>Incluir marca d&apos;água Revela</span>
                </label>
              </div>

              {selectedFormatInfo?.layout === 'separate' && (
                <div className="mt-3 p-2 sm:p-3 rounded-lg" style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)' }}>
                  <p className="text-xs sm:text-sm" style={{ color: '#E8DCC0', opacity: 0.9 }}>
                    <strong>Nota:</strong> Este formato gerará duas imagens separadas (uma para ANTES e outra para DEPOIS), ideais para Stories consecutivos.
                  </p>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="space-y-3 sm:space-y-4 order-1 lg:order-2">
              <h3 className="text-base sm:text-lg font-medium" style={{ color: '#E8DCC0' }}>
                Preview:
              </h3>
              
              <div
                className="relative rounded-lg overflow-hidden border-2 max-h-[300px] sm:max-h-[400px]"
                style={{
                  backgroundColor: '#000000',
                  borderColor: 'rgba(232, 220, 192, 0.2)',
                  aspectRatio: selectedFormatInfo
                    ? `${selectedFormatInfo.width} / ${selectedFormatInfo.height}`
                    : '1 / 1',
                  width: '100%',
                }}
              >
                {generatingPreview ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#00A88F' }} />
                  </div>
                ) : previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p style={{ color: '#E8DCC0', opacity: 0.5 }}>Carregando preview...</p>
                  </div>
                )}
              </div>

              <div className="text-xs opacity-60" style={{ color: '#E8DCC0' }}>
                * Preview aproximado. A imagem final terá qualidade máxima.
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixo e Sticky */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 p-3 sm:p-4 md:p-6 border-t flex-shrink-0 sticky bottom-0" style={{ backgroundColor: '#1A2B32', borderColor: 'rgba(232, 220, 192, 0.1)' }}>
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
            style={{
              backgroundColor: 'rgba(232, 220, 192, 0.1)',
              color: '#E8DCC0',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || generatingPreview}
            className="px-4 sm:px-6 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm sm:text-base"
            style={{
              backgroundColor: '#00A88F',
              color: '#FFFFFF',
            }}
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gerando...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Gerar e Baixar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

