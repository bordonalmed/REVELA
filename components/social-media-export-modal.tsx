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
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl my-4 rounded-lg shadow-2xl flex flex-col"
        style={{
          backgroundColor: '#1A2B32',
          border: '1px solid rgba(232, 220, 192, 0.2)',
          maxHeight: 'calc(100vh - 2rem)',
          minHeight: 'min-content',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixo */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b flex-shrink-0" style={{ borderColor: 'rgba(232, 220, 192, 0.1)' }}>
          <div className="flex items-center gap-3">
            <Instagram className="w-6 h-6" style={{ color: '#E8DCC0' }} />
            <h2 className="text-xl sm:text-2xl font-medium" style={{ color: '#E8DCC0' }}>
              Publicar nas Redes Sociais
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

        {/* Content - Com Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
            {/* Seleção de Formato */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-4" style={{ color: '#E8DCC0' }}>
                Escolha o formato:
              </h3>
              
              <div className="space-y-2 pr-2">
                {formats.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    className={`w-full p-4 rounded-lg text-left transition-all ${
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
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-medium mb-1">{format.name}</div>
                        <div className="text-sm opacity-80">{format.description}</div>
                        <div className="text-xs opacity-60 mt-1">
                          {format.width} × {format.height}px
                        </div>
                      </div>
                      {selectedFormat === format.id && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00A88F' }}>
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FFFFFF' }} />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Opções */}
              <div className="pt-4 border-t" style={{ borderColor: 'rgba(232, 220, 192, 0.1)' }}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeLogo}
                    onChange={(e) => setIncludeLogo(e.target.checked)}
                    className="w-5 h-5 rounded"
                    style={{ accentColor: '#00A88F' }}
                  />
                  <span style={{ color: '#E8DCC0' }}>Incluir marca d&apos;água Revela</span>
                </label>
              </div>

              {selectedFormatInfo?.layout === 'separate' && (
                <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)' }}>
                  <p className="text-sm" style={{ color: '#E8DCC0', opacity: 0.9 }}>
                    <strong>Nota:</strong> Este formato gerará duas imagens separadas (uma para ANTES e outra para DEPOIS), ideais para Stories consecutivos.
                  </p>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium" style={{ color: '#E8DCC0' }}>
                Preview:
              </h3>
              
              <div
                className="relative rounded-lg overflow-hidden border-2"
                style={{
                  backgroundColor: '#000000',
                  borderColor: 'rgba(232, 220, 192, 0.2)',
                  aspectRatio: selectedFormatInfo
                    ? `${selectedFormatInfo.width} / ${selectedFormatInfo.height}`
                    : '1 / 1',
                  maxHeight: '500px',
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

        {/* Footer - Fixo */}
        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t flex-shrink-0" style={{ borderColor: 'rgba(232, 220, 192, 0.1)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg transition-colors"
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
            className="px-6 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

