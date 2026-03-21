'use client';

import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { EvolutionImage } from '@/lib/storage';

export interface EvolutionSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEvolution: EvolutionImage[];
  onSave: (evolution: EvolutionImage[]) => void;
}

interface EditableMilestone {
  id: string;
  label: string;
  date: string;
  file?: File | null;
  preview?: string | null;
}

const MAX_MILESTONES = 4;

export function EvolutionSetupModal({
  isOpen,
  onClose,
  initialEvolution,
  onSave,
}: EvolutionSetupModalProps) {
  const [milestones, setMilestones] = useState<EditableMilestone[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const sorted = [...(initialEvolution || [])].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const mapped: EditableMilestone[] = sorted.map((evo) => ({
      id: evo.id,
      label: evo.label || '',
      date: evo.date.slice(0, 10),
      file: null,
      preview: evo.image,
    }));
    if (!mapped.length) {
      const today = new Date().toISOString().slice(0, 10);
      setMilestones([
        { id: crypto.randomUUID(), label: '0 dias (inicial)', date: today, file: null, preview: null },
      ]);
    } else {
      setMilestones(mapped);
    }
  }, [isOpen, initialEvolution]);

  const handleAddMilestone = () => {
    if (milestones.length >= MAX_MILESTONES) return;
    const today = new Date().toISOString().slice(0, 10);
    setMilestones((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label: '',
        date: today,
        file: null,
        preview: null,
      },
    ]);
  };

  const handleRemoveMilestone = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  const handleChangeLabel = (id: string, label: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, label } : m)),
    );
  };

  const handleChangeDate = (id: string, date: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, date } : m)),
    );
  };

  const handleFileChange = (id: string, file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Envie apenas arquivos de imagem.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setMilestones((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, file, preview: reader.result as string } : m,
        ),
      );
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!milestones.length) {
      alert('Adicione pelo menos um marco.');
      return;
    }
    if (milestones.some((m) => !m.preview)) {
      alert('Envie uma foto para cada marco antes de salvar.');
      return;
    }
    setSaving(true);
    try {
      const evolution: EvolutionImage[] = milestones.map((m, index) => ({
        id: m.id,
        image: m.preview!,
        date: m.date,
        label: m.label || `Marco ${index + 1}`,
        momentType: m.label || undefined,
      }));
      onSave(evolution);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-lg shadow-2xl flex flex-col"
        style={{ backgroundColor: '#0f172a', border: '1px solid rgba(56,189,248,0.6)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: 'rgba(56,189,248,0.5)' }}
        >
          <div>
            <h2 className="text-sm sm:text-base md:text-lg font-semibold" style={{ color: '#e5e7eb' }}>
              Configurar evolução do tratamento
            </h2>
            <p className="text-[11px] sm:text-xs" style={{ color: '#94a3b8' }}>
              Defina até 4 marcos (ex.: 0, 30, 60, 90 dias) e envie uma foto para cada momento.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800/70"
            style={{ color: '#e5e7eb' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {milestones.map((m, index) => (
            <div
              key={m.id}
              className="rounded-lg border p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4"
              style={{ borderColor: 'rgba(51,65,85,0.9)', backgroundColor: 'rgba(15,23,42,0.9)' }}
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: 'rgba(56,189,248,0.2)', color: '#e5e7eb' }}
                  >
                    {index + 1}
                  </span>
                  {milestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestone(m.id)}
                      className="p-1.5 rounded-md border border-red-500/60 text-red-300 text-xs"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] sm:text-xs" style={{ color: '#94a3b8' }}>
                    Rótulo do marco
                  </label>
                  <input
                    type="text"
                    value={m.label}
                    onChange={(e) => handleChangeLabel(m.id, e.target.value)}
                    placeholder="Ex.: 0 dias, 30 dias, 3 meses, sessão final"
                    className="w-full px-3 py-2 rounded-lg text-xs sm:text-sm bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-sky-400/70 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] sm:text-xs" style={{ color: '#94a3b8' }}>
                    Data do marco
                  </label>
                  <input
                    type="date"
                    value={m.date}
                    onChange={(e) => handleChangeDate(m.id, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs sm:text-sm bg-slate-900 border border-slate-700 text-slate-100 focus:border-sky-400/70 focus:outline-none"
                  />
                </div>
              </div>
              <div className="w-full sm:w-40 flex flex-col items-center gap-2">
                <div
                  className="w-full aspect-[4/5] rounded-lg border flex items-center justify-center overflow-hidden"
                  style={{ borderColor: 'rgba(51,65,85,0.9)', backgroundColor: '#020617' }}
                >
                  {m.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.preview} alt={m.label || 'Marco'} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[11px] sm:text-xs text-slate-500 text-center px-2">
                      Nenhuma foto enviada
                    </span>
                  )}
                </div>
                <label className="w-full">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleFileChange(
                        m.id,
                        e.target.files && e.target.files.length ? e.target.files[0] : null,
                      )
                    }
                  />
                  <span
                    className="block w-full text-center px-2 py-1.5 rounded-md text-[11px] sm:text-xs border cursor-pointer"
                    style={{
                      backgroundColor: 'rgba(15,23,42,0.9)',
                      borderColor: 'rgba(56,189,248,0.7)',
                      color: '#e5e7eb',
                    }}
                  >
                    {m.preview ? 'Trocar foto' : 'Enviar foto'}
                  </span>
                </label>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddMilestone}
            disabled={milestones.length >= MAX_MILESTONES}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-medium border disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'rgba(15,23,42,0.95)',
              borderColor: 'rgba(148,163,184,0.6)',
              color: '#e5e7eb',
            }}
          >
            <Plus className="w-3 h-3" />
            Adicionar marco (máx. 4)
          </button>
        </div>

        <div
          className="flex items-center justify-end gap-2 px-4 py-3 border-t"
          style={{ borderColor: 'rgba(56,189,248,0.5)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium"
            style={{ color: '#94a3b8', backgroundColor: 'transparent' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#0ea5e9', color: '#0b1120' }}
          >
            {saving ? 'Salvando...' : 'Salvar evolução'}
          </button>
        </div>
      </div>
    </div>
  );
}

