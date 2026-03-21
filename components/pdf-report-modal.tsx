'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, FileBarChart, Loader2, Sparkles } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import type { Project } from '@/lib/storage';
import { generateProjectReportPdf } from '@/lib/pdf-report';
import { supabase } from '@/lib/supabase';
import { readClinicProfileSettings } from '@/lib/clinic-profile';
import { readBrandingSettings } from '@/lib/branding';

interface PdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  isPremiumUser: boolean;
  /** Ativo quando o usuário está em um projeto Revela Evolução Premium */
  evolutionMode?: boolean;
  /** Seleção atual da timeline (Revela A/B) */
  evolutionSelection?: { leftId: string | null; rightId: string | null };
}

function formatDateInput(iso: string): string {
  return iso.slice(0, 10);
}

export function PdfReportModal({
  isOpen,
  onClose,
  project,
  isPremiumUser,
  evolutionMode = false,
  evolutionSelection,
}: PdfReportModalProps) {
  const router = useRouter();
  const [reportTitle, setReportTitle] = useState('');
  const [patientName, setPatientName] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinicLogo, setClinicLogo] = useState<string | null>(null);
  const [includeBeforeAfter, setIncludeBeforeAfter] = useState(true);
  const [includeTimeline, setIncludeTimeline] = useState(true);
  const [includeEvolutionABComparison, setIncludeEvolutionABComparison] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasSavedNotes = !!project?.notes?.trim();
  const showNotesWarning = isPremiumUser && includeNotes && !hasSavedNotes;

  const evolutionLeftId = evolutionSelection?.leftId ?? null;
  const evolutionRightId = evolutionSelection?.rightId ?? null;
  const showEvolutionSelectionWarning =
    evolutionMode &&
    includeEvolutionABComparison &&
    evolutionLeftId &&
    !evolutionRightId;

  useEffect(() => {
    if (!isOpen) return;
    if (typeof window === 'undefined') return;
    setError(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !project) return;
    setReportTitle(project.name || 'Relatório de evolução');
    setPatientName('');
    setDateStart(project.date ? formatDateInput(project.date) : formatDateInput(new Date().toISOString()));
    const evo = (project.evolutionImages || []);
    const lastDate = evo.length > 0
      ? evo.map((e) => e.date).sort().reverse()[0]
      : null;
    setDateEnd(lastDate ? formatDateInput(lastDate) : formatDateInput(new Date().toISOString()));
    setClinicName('');
    setClinicAddress('');
    setClinicPhone('');
    setIncludeBeforeAfter(!evolutionMode);
    setIncludeTimeline(true);
    setIncludeNotes(true);
  }, [isOpen, project, evolutionMode]);

  useEffect(() => {
    if (!isOpen) return;
    if (evolutionMode) {
      // Em Revela Evolução não existe “ANTES/DEPOIS” no PDF; apenas revelas selecionadas.
      setIncludeBeforeAfter(false);
      // No modo evolução, comparação A/B é controlada por checkbox.
    }
  }, [evolutionMode, isOpen]);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    let active = true;
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      if (!active) return;
      const branding = readBrandingSettings(session?.user?.email || null);
      if (branding.selectedLogo === 'custom' && branding.customLogoDataUrl) {
        setClinicLogo(branding.customLogoDataUrl);
      } else {
        // Fallback padrão para marca Revela.
        setClinicLogo('/revela3-transparent-processed.png');
      }
      const profile = readClinicProfileSettings(session?.user?.email || null);
      setClinicName(profile.clinicName);
      setClinicAddress(profile.clinicAddress);
      setClinicPhone(profile.clinicPhone);
    });
    return () => {
      active = false;
    };
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!isPremiumUser) {
      router.push('/planos');
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const blob = await generateProjectReportPdf(project, {
        reportTitle: reportTitle || project.name || 'Relatório',
        patientName: patientName || undefined,
        projectName: project.name,
        dateStart: dateStart || project.date || new Date().toISOString(),
        dateEnd: dateEnd || new Date().toISOString(),
        clinicName: clinicName || undefined,
        clinicAddress: clinicAddress || undefined,
        clinicPhone: clinicPhone || undefined,
        clinicLogoBase64: clinicLogo || undefined,
        includeBeforeAfter,
        includeTimeline,
        includeNotes,
        evolutionMode,
        evolutionSelection: {
          leftId: evolutionLeftId,
          rightId: evolutionRightId,
        },
        includeEvolutionABComparison,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeName = (project.name || 'relatorio').replace(/[^a-z0-9]/gi, '_');
      link.download = `Revela_Relatorio_${safeName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      setError('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-lg shadow-xl flex flex-col my-4 max-h-[85vh] overflow-hidden"
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid rgba(148, 163, 184, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'rgba(148, 163, 184, 0.2)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.4)' }}
            >
              <FileBarChart className="w-5 h-5" style={{ color: '#facc15' }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: '#f1f5f9' }}>
                Gerar relatório PDF
              </h2>
              <p className="text-xs" style={{ color: '#94a3b8' }}>
                Relatório clínico visual do paciente/projeto
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: '#e2e8f0' }}
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto min-h-0">
          {!isPremiumUser && (
            <div
              className="rounded-lg p-4 border flex items-start gap-3"
              style={{
                backgroundColor: 'rgba(30, 64, 175, 0.15)',
                borderColor: 'rgba(234, 179, 8, 0.5)',
              }}
            >
              <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: '#facc15' }} />
              <div>
                <p className="text-sm" style={{ color: '#e2e8f0' }}>
                  Relatório em PDF é exclusivo do plano <strong>Revela Premium</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/planos')}
                  className="mt-2 px-3 py-1.5 rounded-md text-sm font-medium"
                  style={{ backgroundColor: '#facc15', color: '#0f172a' }}
                >
                  Ver planos Premium
                </button>
              </div>
            </div>
          )}

          {isPremiumUser && (
            <>
              <div className="space-y-2">
                <label className="block text-xs font-medium" style={{ color: '#94a3b8' }}>
                  Título do relatório
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Ex.: Relatório de evolução"
                  className="w-full px-3 py-2 rounded-lg text-sm bg-slate-800/80 border border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium" style={{ color: '#94a3b8' }}>
                  Nome do paciente
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Opcional"
                  className="w-full px-3 py-2 rounded-lg text-sm bg-slate-800/80 border border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-xs font-medium" style={{ color: '#94a3b8' }}>
                    Data inicial
                  </label>
                  <input
                    type="date"
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-slate-800/80 border border-slate-600 text-slate-100 focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium" style={{ color: '#94a3b8' }}>
                    Data final
                  </label>
                  <input
                    type="date"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-slate-800/80 border border-slate-600 text-slate-100 focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium" style={{ color: '#94a3b8' }}>
                  Nome da clínica
                </label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Opcional"
                  className="w-full px-3 py-2 rounded-lg text-sm bg-slate-800/80 border border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none"
                />
                {clinicLogo && (
                  <p className="text-[11px]" style={{ color: '#64748b' }}>
                    O logo salvo nas configurações será usado no cabeçalho do PDF.
                  </p>
                )}
                {(clinicAddress || clinicPhone) && (
                  <p className="text-[11px]" style={{ color: '#64748b' }}>
                    Endereço e telefone serão incluídos automaticamente com os dados da clínica.
                  </p>
                )}
              </div>

              <div className="pt-2 space-y-2 border-t" style={{ borderColor: 'rgba(148, 163, 184, 0.2)' }}>
                <span className="block text-xs font-medium" style={{ color: '#94a3b8' }}>
                  Incluir no relatório
                </span>
                {!evolutionMode && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeBeforeAfter}
                      onChange={(e) => setIncludeBeforeAfter(e.target.checked)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: '#f59e0b' }}
                    />
                    <span className="text-sm" style={{ color: '#e2e8f0' }}>Comparação antes e depois</span>
                  </label>
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTimeline}
                    onChange={(e) => setIncludeTimeline(e.target.checked)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: '#f59e0b' }}
                  />
                  <span className="text-sm" style={{ color: '#e2e8f0' }}>Timeline de evolução</span>
                </label>
                {evolutionMode && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeEvolutionABComparison}
                      onChange={(e) => setIncludeEvolutionABComparison(e.target.checked)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: '#f59e0b' }}
                    />
                    <span className="text-sm" style={{ color: '#e2e8f0' }}>
                      Comparação A/B das revelas selecionadas
                    </span>
                  </label>
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeNotes}
                    onChange={(e) => setIncludeNotes(e.target.checked)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: '#f59e0b' }}
                  />
                  <span className="text-sm" style={{ color: '#e2e8f0' }}>Observações</span>
                </label>
              </div>

              {evolutionMode && includeEvolutionABComparison && (
                <>
                  {!evolutionLeftId && !evolutionRightId && (
                    <div
                      className="p-3 rounded-lg text-sm border"
                      style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.12)',
                        color: '#fde68a',
                        borderColor: 'rgba(245, 158, 11, 0.35)',
                      }}
                    >
                      Selecione pelo menos <strong>Revela A</strong> na timeline para as imagens entrarem no PDF.
                    </div>
                  )}
                  {evolutionLeftId && !evolutionRightId && showEvolutionSelectionWarning && (
                    <div
                      className="p-3 rounded-lg text-sm border"
                      style={{
                        backgroundColor: 'rgba(56, 189, 248, 0.12)',
                        color: '#7dd3fc',
                        borderColor: 'rgba(56, 189, 248, 0.35)',
                      }}
                    >
                      Para habilitar a <strong>comparação</strong> no PDF, selecione também <strong>Revela B</strong>.
                    </div>
                  )}
                </>
              )}

              {showNotesWarning && (
                <div
                  className="p-3 rounded-lg text-sm border"
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    color: '#fde68a',
                    borderColor: 'rgba(245, 158, 11, 0.35)',
                  }}
                >
                  Você marcou Observações, mas este projeto não possui notas salvas.
                </div>
              )}

              {error && (
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#fecaca', border: '1px solid rgba(220, 38, 38, 0.3)' }}
                >
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        <div
          className="flex items-center justify-end gap-2 p-3 border-t shrink-0"
          style={{ borderColor: 'rgba(148, 163, 184, 0.2)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ color: '#94a3b8', backgroundColor: 'transparent' }}
          >
            Cancelar
          </button>
          {isPremiumUser && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#f59e0b', color: '#0f172a' }}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <FileBarChart className="w-4 h-4" />
                  Gerar relatório PDF
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
