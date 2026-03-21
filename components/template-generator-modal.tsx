'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, LayoutTemplate, Loader2, Download, Sparkles } from 'lucide-react';
import type { Project, EvolutionImage } from '@/lib/storage';
import {
  exportClinicTemplate,
  generateClinicTemplatePreview,
  type ClinicTemplateId,
  type ClinicTemplateParams,
} from '@/lib/export-utils';

interface TemplateGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  isPremiumUser: boolean;
}

type TemplateOption = {
  id: ClinicTemplateId;
  label: string;
  description: string;
};

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: 'before-after',
    label: 'Antes | Depois',
    description: 'Comparação horizontal clássica entre duas imagens.',
  },
  {
    id: 'before-30-90',
    label: 'Antes | 30 dias | 90 dias',
    description: 'Três marcos de evolução lado a lado.',
  },
  {
    id: 'vertical-compare',
    label: 'Comparação vertical',
    description: 'Antes e depois empilhados verticalmente.',
  },
  {
    id: 'before-after-clinic-brand',
    label: 'Antes e Depois com nome/logo da clínica',
    description: 'Layout com branding da clínica em destaque.',
  },
  {
    id: 'timeline-summary',
    label: 'Timeline resumida',
    description: 'Sequência visual de até 5 marcos do tratamento.',
  },
];

type ImageSourceKind = 'before' | 'after' | 'evolution';

interface ImageOption {
  id: string;
  label: string;
  base64: string;
  kind: ImageSourceKind;
  meta?: EvolutionImage;
}

export function TemplateGeneratorModal({
  isOpen,
  onClose,
  project,
  isPremiumUser,
}: TemplateGeneratorModalProps) {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<ClinicTemplateId>('before-after');
  const [slotA, setSlotA] = useState<string>('');
  const [slotB, setSlotB] = useState<string>('');
  const [slotC, setSlotC] = useState<string>('');
  const [clinicName, setClinicName] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [subtitle, setSubtitle] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [clinicLogo, setClinicLogo] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<'png' | 'jpg' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const imageOptions: ImageOption[] = useMemo(() => {
    const opts: ImageOption[] = [];

    project.beforeImages.forEach((img, index) => {
      opts.push({
        id: `before-${index}`,
        label: `Antes ${index + 1}`,
        base64: img,
        kind: 'before',
      });
    });

    project.afterImages.forEach((img, index) => {
      opts.push({
        id: `after-${index}`,
        label: `Depois ${index + 1}`,
        base64: img,
        kind: 'after',
      });
    });

    (project.evolutionImages || []).forEach((evo, index) => {
      opts.push({
        id: `evolution-${evo.id || index}`,
        label:
          evo.label ||
          evo.momentType ||
          `Sessão ${index + 1} (${new Date(evo.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })})`,
        base64: evo.image,
        kind: 'evolution',
        meta: evo,
      });
    });

    return opts;
  }, [project]);

  // Carregar logo da clínica (se houver) do localStorage
  useEffect(() => {
    if (!isOpen) return;
    if (typeof window === 'undefined') return;
    try {
      const storedLogo = window.localStorage.getItem('revela_clinic_logo');
      if (storedLogo) {
        setClinicLogo(storedLogo);
      } else {
        setClinicLogo(null);
      }
    } catch {
      setClinicLogo(null);
    }
  }, [isOpen]);

  // Preencher campos padrão quando abrir
  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);
    setTitle(project.name || 'Comparação de resultado');
    setSubtitle('Documentação clínica visual');
    setClinicName(clinicName || '');
    setDate(project.date?.slice(0, 10) || new Date().toISOString().slice(0, 10));

    // Seleções padrão de imagens
    if (project.beforeImages.length > 0) {
      setSlotA(`before-0`);
    }
    if (project.afterImages.length > 0) {
      setSlotB(`after-0`);
    }
    if ((project.evolutionImages || []).length > 0) {
      setSlotC(`evolution-${(project.evolutionImages || [])[0].id || 0}`);
    }
  }, [isOpen, project, clinicName]);

  const resolveImageById = (id: string | undefined | null): ImageOption | undefined =>
    imageOptions.find((opt) => opt.id === id);

  const buildTemplateParams = (): ClinicTemplateParams | null => {
    const base: ClinicTemplateParams = {
      templateId: selectedTemplate,
      images: [],
      labels: [],
      clinicName: clinicName || undefined,
      clinicLogoBase64: clinicLogo || undefined,
      title: title || undefined,
      subtitle: subtitle || undefined,
      date: date || undefined,
    };

    if (selectedTemplate === 'before-after' || selectedTemplate === 'before-after-clinic-brand') {
      const a = resolveImageById(slotA);
      const b = resolveImageById(slotB);
      if (!a || !b) {
        setErrorMessage('Selecione as imagens de Antes e Depois.');
        return null;
      }
      base.images = [a.base64, b.base64];
      base.labels = ['Antes', 'Depois'];
    } else if (selectedTemplate === 'before-30-90') {
      const a = resolveImageById(slotA);
      const b = resolveImageById(slotB);
      const c = resolveImageById(slotC);
      if (!a || !b || !c) {
        setErrorMessage('Selecione as três imagens (Antes, 30 dias, 90 dias).');
        return null;
      }
      base.images = [a.base64, b.base64, c.base64];
      base.labels = ['Antes', '30 dias', '90 dias'];
    } else if (selectedTemplate === 'vertical-compare') {
      const a = resolveImageById(slotA);
      const b = resolveImageById(slotB);
      if (!a || !b) {
        setErrorMessage('Selecione duas imagens para a comparação vertical.');
        return null;
      }
      base.images = [a.base64, b.base64];
      base.labels = ['Antes', 'Depois'];
    } else if (selectedTemplate === 'timeline-summary') {
      const evoImages = (project.evolutionImages || []).slice(0, 5);
      if (evoImages.length === 0) {
        setErrorMessage('Adicione ao menos um marco de evolução para usar a timeline resumida.');
        return null;
      }
      base.images = evoImages.map((e) => e.image);
      base.labels = evoImages.map(
        (e, i) => e.label || e.momentType || `Sessão ${i + 1}`
      );
    }

    if (!base.images.length) {
      setErrorMessage('Selecione as imagens para o template.');
      return null;
    }

    setErrorMessage(null);
    return base;
  };

  const regeneratePreview = async () => {
    if (!isPremiumUser) return;
    const params = buildTemplateParams();
    if (!params) {
      setPreviewUrl(null);
      return;
    }

    try {
      setPreviewLoading(true);
      const dataUrl = await generateClinicTemplatePreview(params);
      setPreviewUrl(dataUrl);
    } catch (error) {
      console.error('Erro ao gerar preview do template:', error);
      setErrorMessage('Erro ao gerar o preview. Tente novamente.');
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !isPremiumUser) return;
    regeneratePreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedTemplate, slotA, slotB, slotC, clinicName, title, subtitle, date, clinicLogo]);

  const handleExport = async (format: 'png' | 'jpg') => {
    if (!isPremiumUser) {
      router.push('/planos');
      return;
    }
    const params = buildTemplateParams();
    if (!params) return;

    try {
      setExportingFormat(format);
      const safeName =
        project.name?.replace(/[^a-z0-9]/gi, '_') || 'revela_template_clinico';
      await exportClinicTemplate(params, format, safeName);
    } catch (error) {
      console.error('Erro ao exportar template clínico:', error);
      setErrorMessage('Erro ao exportar a imagem. Tente novamente.');
    } finally {
      setExportingFormat(null);
    }
  };

  if (!isOpen) return null;

  const selectedTemplateInfo = TEMPLATE_OPTIONS.find((t) => t.id === selectedTemplate);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-0 sm:p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl rounded-none sm:rounded-lg shadow-2xl flex flex-col"
        style={{
          backgroundColor: '#020617',
          border: '1px solid rgba(148, 163, 184, 0.6)',
          minHeight: '100vh',
          maxHeight: '100vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b flex-shrink-0 sticky top-0 z-10"
          style={{
            background: 'linear-gradient(90deg, #020617, #0f172a)',
            borderColor: 'rgba(148, 163, 184, 0.5)',
          }}
        >
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-sky-500/10 border border-sky-500/40">
              <LayoutTemplate className="w-5 h-5 text-sky-300" />
            </div>
            <div className="min-w-0">
              <h2
                className="text-base sm:text-xl md:text-2xl font-medium truncate"
                style={{ color: '#E5E7EB' }}
              >
                Gerar template clínico
              </h2>
              <p className="text-xs sm:text-sm" style={{ color: '#9CA3AF' }}>
                Composições visuais profissionais para apresentações e documentação.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-white/10 flex-shrink-0"
            style={{ color: '#E5E7EB' }}
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div
          className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0"
          style={{ maxHeight: 'calc(100vh - 140px)' }}
        >
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-5 lg:gap-7">
            {/* Coluna de controles */}
            <div className="space-y-4 order-2 lg:order-1">
              {!isPremiumUser && (
                <div
                  className="rounded-lg p-3 sm:p-4 border flex items-start gap-3"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(30,64,175,0.8), rgba(2,6,23,0.95))',
                    borderColor: 'rgba(234,179,8,0.6)',
                  }}
                >
                  <Sparkles className="w-5 h-5 mt-0.5 text-yellow-300" />
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm" style={{ color: '#E5E7EB' }}>
                      Templates automáticos são exclusivos do plano{' '}
                      <span className="font-semibold">Revela Premium</span>.
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push('/planos')}
                      className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: '#facc15',
                        color: '#111827',
                      }}
                    >
                      Ver planos Premium
                    </button>
                  </div>
                </div>
              )}

              {/* Seleção de template */}
              <div className="space-y-2">
                <h3
                  className="text-sm sm:text-base font-medium"
                  style={{ color: '#E5E7EB' }}
                >
                  Modelo visual
                </h3>
                <div className="space-y-2">
                  {TEMPLATE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedTemplate(opt.id)}
                      className={`w-full p-3 sm:p-4 rounded-lg text-left transition-all ${
                        selectedTemplate === opt.id ? 'ring-2' : 'hover:bg-slate-800/50'
                      }`}
                      style={{
                        backgroundColor:
                          selectedTemplate === opt.id
                            ? 'rgba(15,23,42,0.95)'
                            : 'rgba(15,23,42,0.8)',
                        border:
                          selectedTemplate === opt.id
                            ? '2px solid rgba(56,189,248,0.9)'
                            : '1px solid rgba(51,65,85,0.9)',
                        color: '#E5E7EB',
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm sm:text-base mb-0.5">
                            {opt.label}
                          </div>
                          <div className="text-xs sm:text-sm opacity-80">
                            {opt.description}
                          </div>
                        </div>
                        {selectedTemplate === opt.id && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] bg-sky-500/20 text-sky-200 border border-sky-400/60">
                            Selecionado
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Imagens */}
              <div className="space-y-3">
                <h3
                  className="text-sm sm:text-base font-medium"
                  style={{ color: '#E5E7EB' }}
                >
                  Imagens do template
                </h3>

                {(selectedTemplate === 'before-after' ||
                  selectedTemplate === 'before-after-clinic-brand' ||
                  selectedTemplate === 'vertical-compare' ||
                  selectedTemplate === 'before-30-90') && (
                  <>
                    <div className="space-y-1">
                      <label
                        className="text-xs sm:text-sm"
                        style={{ color: '#E5E7EB' }}
                      >
                        Imagem A (Antes)
                      </label>
                      <select
                        value={slotA}
                        onChange={(e) => setSlotA(e.target.value)}
                        className="w-full bg-slate-900/80 border border-slate-600 rounded-md px-2 py-1.5 text-xs sm:text-sm text-slate-100"
                      >
                        <option value="">Selecione</option>
                        {imageOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label
                        className="text-xs sm:text-sm"
                        style={{ color: '#E5E7EB' }}
                      >
                        Imagem B (Depois / sessão seguinte)
                      </label>
                      <select
                        value={slotB}
                        onChange={(e) => setSlotB(e.target.value)}
                        className="w-full bg-slate-900/80 border border-slate-600 rounded-md px-2 py-1.5 text-xs sm:text-sm text-slate-100"
                      >
                        <option value="">Selecione</option>
                        {imageOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {selectedTemplate === 'before-30-90' && (
                  <div className="space-y-1">
                    <label
                      className="text-xs sm:text-sm"
                      style={{ color: '#E5E7EB' }}
                    >
                      Imagem C (90 dias)
                    </label>
                    <select
                      value={slotC}
                      onChange={(e) => setSlotC(e.target.value)}
                      className="w-full bg-slate-900/80 border border-slate-600 rounded-md px-2 py-1.5 text-xs sm:text-sm text-slate-100"
                    >
                      <option value="">Selecione</option>
                      {imageOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedTemplate === 'timeline-summary' && (
                  <p className="text-xs sm:text-sm" style={{ color: '#9CA3AF' }}>
                    A timeline resumida usará automaticamente até 5 marcos da evolução do
                    tratamento deste projeto.
                  </p>
                )}
              </div>

              {/* Informações da clínica */}
              <div className="space-y-3">
                <h3
                  className="text-sm sm:text-base font-medium"
                  style={{ color: '#E5E7EB' }}
                >
                  Informações e branding
                </h3>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm" style={{ color: '#E5E7EB' }}>
                      Nome da clínica
                    </label>
                    <input
                      type="text"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      placeholder="Ex.: Clínica Exemplo"
                      className="w-full bg-slate-900/80 border border-slate-600 rounded-md px-2 py-1.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm" style={{ color: '#E5E7EB' }}>
                      Título
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex.: Evolução do tratamento"
                      className="w-full bg-slate-900/80 border border-slate-600 rounded-md px-2 py-1.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm" style={{ color: '#E5E7EB' }}>
                      Subtítulo
                    </label>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="Ex.: Comparação clínica antes e depois"
                      className="w-full bg-slate-900/80 border border-slate-600 rounded-md px-2 py-1.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm" style={{ color: '#E5E7EB' }}>
                      Data
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-900/80 border border-slate-600 rounded-md px-2 py-1.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                  {clinicLogo && (
                    <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
                      O logo da clínica salvo nas configurações será usado automaticamente no
                      cabeçalho do template.
                    </p>
                  )}
                </div>
              </div>

              {errorMessage && (
                <div
                  className="p-2.5 rounded-md border text-xs"
                  style={{
                    backgroundColor: 'rgba(220,38,38,0.1)',
                    borderColor: 'rgba(220,38,38,0.5)',
                    color: '#fecaca',
                  }}
                >
                  {errorMessage}
                </div>
              )}
            </div>

            {/* Coluna de preview */}
            <div className="space-y-3 order-1 lg:order-2">
              <h3
                className="text-sm sm:text-base font-medium flex items-center justify-between gap-2"
                style={{ color: '#E5E7EB' }}
              >
                Preview em tempo real
                {selectedTemplateInfo && (
                  <span className="text-[11px] sm:text-xs font-normal text-slate-400">
                    {selectedTemplateInfo.label}
                  </span>
                )}
              </h3>

              <div
                className="relative rounded-lg overflow-hidden border-2 max-h-[320px] sm:max-h-[420px]"
                style={{
                  backgroundColor: '#020617',
                  borderColor: 'rgba(56,189,248,0.4)',
                  aspectRatio: '16 / 9',
                  width: '100%',
                }}
              >
                {previewLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
                    <p className="text-xs sm:text-sm" style={{ color: '#9CA3AF' }}>
                      Gerando preview do template...
                    </p>
                  </div>
                ) : previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview do template clínico"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <p className="text-xs sm:text-sm" style={{ color: '#9CA3AF' }}>
                      Configure o template e as imagens para visualizar o preview.
                    </p>
                  </div>
                )}
              </div>

              <p className="text-[11px] sm:text-xs" style={{ color: '#6B7280' }}>
                * O preview é uma aproximação. A exportação final mantém a qualidade máxima das
                imagens originais.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 md:p-5 border-t flex-shrink-0 sticky bottom-0"
          style={{
            backgroundColor: '#020617',
            borderColor: 'rgba(30,64,175,0.6)',
          }}
        >
          <div className="text-[11px] sm:text-xs" style={{ color: '#9CA3AF' }}>
            Exporte composições clínicas elegantes em PNG ou JPG para apresentações, laudos e
            materiais de divulgação.
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => handleExport('png')}
              disabled={!isPremiumUser || !!exportingFormat}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#0ea5e9',
                color: '#0b1120',
              }}
            >
              <Download className="w-4 h-4" />
              {exportingFormat === 'png' ? 'Exportando PNG...' : 'Baixar PNG'}
            </button>
            <button
              type="button"
              onClick={() => handleExport('jpg')}
              disabled={!isPremiumUser || !!exportingFormat}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed border"
              style={{
                backgroundColor: 'transparent',
                color: '#E5E7EB',
                borderColor: 'rgba(148,163,184,0.8)',
              }}
            >
              <Download className="w-4 h-4" />
              {exportingFormat === 'jpg' ? 'Exportando JPG...' : 'Baixar JPG'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

