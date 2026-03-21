'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Save, Eye, ChevronLeft, ChevronRight, ArrowLeft, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { getAllProjectsForUser, saveProject } from '@/lib/storage';
import { listLocalProjectsForCloud, syncSelectedProjectsToCloud } from '@/lib/cloud-project-backup';
import { NavigationHeader } from '@/components/navigation-header';
import { Footer } from '@/components/footer';
import Image from 'next/image';
import { trackCreateProject } from '@/lib/analytics';
import { FREE_MAX_AFTER_IMAGES, FREE_MAX_BEFORE_IMAGES, FREE_MAX_PROJECTS } from '@/lib/plans';
import { usePlan } from '@/hooks/usePlan';

type EvolutionUnit = 'days' | 'months';

interface EvolutionStepState {
  id: string;
  label: string;
  offsetValue: number;
  offsetUnit: EvolutionUnit;
  enabled: boolean;
  momentType: string;
  file: File | null;
  preview: string | null;
}

export default function NewProjectPage() {
  const router = useRouter();
  const { hasPremiumAccess, canUsePremiumFeature, hasProAccess } = usePlan();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState('');
  const [projectDate, setProjectDate] = useState('');
  const [projectNotes, setProjectNotes] = useState('');
  const [beforeImages, setBeforeImages] = useState<File[]>([]);
  const [afterImages, setAfterImages] = useState<File[]>([]);
  const [beforePreviewUrls, setBeforePreviewUrls] = useState<string[]>([]);
  const [afterPreviewUrls, setAfterPreviewUrls] = useState<string[]>([]);
  const [beforeCurrentIndex, setBeforeCurrentIndex] = useState(0);
  const [afterCurrentIndex, setAfterCurrentIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [projectMode, setProjectMode] = useState<'before-after' | 'evolution'>('before-after');
  const [evolutionSteps, setEvolutionSteps] = useState<EvolutionStepState[]>([]);

  // Sync automática da nuvem Premium (background)
  const cloudAutoSyncInFlightRef = useRef(false);
  const cloudAutoSyncPendingRef = useRef(false);

  const triggerAutoCloudSync = useCallback(async () => {
    if (!hasPremiumAccess) return;
    if (!user?.id) return;
    if (typeof window === 'undefined') return;

    const enabled = window.localStorage.getItem('revela_cloud_backup_enabled') === 'true';
    if (!enabled) return;

    if (cloudAutoSyncInFlightRef.current) {
      cloudAutoSyncPendingRef.current = true;
      return;
    }

    cloudAutoSyncInFlightRef.current = true;
    try {
      const projects = await listLocalProjectsForCloud();
      if (!projects.length) return;
      const res = await syncSelectedProjectsToCloud(user.id, projects);

      window.localStorage.setItem(
        'revela_cloud_last_auto_sync',
        JSON.stringify({
          at: new Date().toISOString(),
          uploaded: res.uploaded,
          updated: res.updated,
          skipped: res.skipped,
          failures: res.failures.length,
        })
      );
    } catch (e) {
      console.error('Auto cloud sync error:', e);
    } finally {
      cloudAutoSyncInFlightRef.current = false;
      if (cloudAutoSyncPendingRef.current) {
        cloudAutoSyncPendingRef.current = false;
        void triggerAutoCloudSync();
      }
    }
  }, [hasPremiumAccess, user?.id]);
  
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const checkUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const sessionUser = session?.user ?? null;
    setUser(sessionUser);
    if (!session) {
      router.push('/login');
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setUser(session?.user ?? null);
      if (!session) router.push('/login');
    });
    return () => subscription.unsubscribe();
  }, [router, checkUser]);

  // Inicializar passos de evolução quando o modo for ativado
  useEffect(() => {
    if (projectMode !== 'evolution') return;

    setEvolutionSteps((current) => {
      if (current.length > 0) return current;
      return [
        {
          id: 'start',
          label: 'Início (0)',
          offsetValue: 0,
          offsetUnit: 'days',
          enabled: true,
          momentType: 'antes',
          file: null,
          preview: null,
        },
        {
          id: 'step-1',
          label: 'Revela 1',
          offsetValue: 30,
          offsetUnit: 'days',
          enabled: false,
          momentType: '30d',
          file: null,
          preview: null,
        },
        {
          id: 'step-2',
          label: 'Revela 2',
          offsetValue: 90,
          offsetUnit: 'days',
          enabled: false,
          momentType: '90d',
          file: null,
          preview: null,
        },
        {
          id: 'step-3',
          label: 'Revela 3',
          offsetValue: 180,
          offsetUnit: 'days',
          enabled: false,
          momentType: '180d',
          file: null,
          preview: null,
        },
      ];
    });
  }, [projectMode]);

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center" 
        style={{ backgroundColor: '#1A2B32' }}
      >
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
            style={{ borderColor: '#00A88F', borderTopColor: 'transparent' }}
          ></div>
          <p style={{ color: '#E8DCC0' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  // Comprimir imagem antes de converter para base64
  const compressImage = (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        // Usar HTMLImageElement explicitamente para evitar conflito com Image do Next.js
        const img = document.createElement('img') as HTMLImageElement;
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionar se necessário
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Não foi possível criar contexto do canvas'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const addOffsetToDate = (base: string, value: number, unit: EvolutionUnit): string => {
    const baseDate = base || new Date().toISOString().slice(0, 10);
    const [year, month, day] = baseDate.split('-').map((v) => parseInt(v, 10));
    const date = new Date(year, (month || 1) - 1, day || 1);
    if (!Number.isNaN(value) && value > 0) {
      if (unit === 'days') {
        date.setDate(date.getDate() + value);
      } else {
        date.setMonth(date.getMonth() + value);
      }
    }
    return date.toISOString();
  };

  const handleBeforeFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!hasProAccess && files.length > FREE_MAX_BEFORE_IMAGES) {
      alert(`Limite de ${FREE_MAX_BEFORE_IMAGES} fotos ANTES no plano Free. Para adicionar mais fotos, faça upgrade para o Revela Pro ou Premium.`);
      e.target.value = '';
      return;
    }
    setBeforeImages(files);
    // Comprimir e converter para data URLs (base64) para preview
    const compressedUrls = await Promise.all(files.map(file => compressImage(file, 1920, 0.85)));
    setBeforePreviewUrls(compressedUrls);
  };

  const handleAfterFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!hasProAccess && files.length > FREE_MAX_AFTER_IMAGES) {
      alert(`Limite de ${FREE_MAX_AFTER_IMAGES} fotos DEPOIS no plano Free. Para adicionar mais fotos, faça upgrade para o Revela Pro ou Premium.`);
      e.target.value = '';
      return;
    }
    setAfterImages(files);
    // Comprimir e converter para data URLs (base64) para preview
    const compressedUrls = await Promise.all(files.map(file => compressImage(file, 1920, 0.85)));
    setAfterPreviewUrls(compressedUrls);
  };

  const removeBeforeImage = (index: number) => {
    const newImages = beforeImages.filter((_, i) => i !== index);
    const newUrls = beforePreviewUrls.filter((_, i) => i !== index);
    setBeforeImages(newImages);
    setBeforePreviewUrls(newUrls);
    if (beforeInputRef.current) {
      beforeInputRef.current.value = '';
    }
  };

  const removeAfterImage = (index: number) => {
    const newImages = afterImages.filter((_, i) => i !== index);
    const newUrls = afterPreviewUrls.filter((_, i) => i !== index);
    setAfterImages(newImages);
    setAfterPreviewUrls(newUrls);
    if (afterInputRef.current) {
      afterInputRef.current.value = '';
    }
  };

  const clearForm = () => {
    setProjectName('');
    setProjectDate('');
    setProjectNotes('');
    setBeforeImages([]);
    setAfterImages([]);
    setBeforePreviewUrls([]);
    setAfterPreviewUrls([]);
    setShowPreview(false);
    setBeforeCurrentIndex(0);
    setAfterCurrentIndex(0);
    setProjectMode('before-after');
    setEvolutionSteps([]);
    if (beforeInputRef.current) beforeInputRef.current.value = '';
    if (afterInputRef.current) afterInputRef.current.value = '';
  };

  const handleSave = async () => {
    try {
      // Mostrar mensagem de processamento
      const processingMessage = document.createElement('div');
      processingMessage.textContent = 'Salvando projeto...';
      processingMessage.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #1B3C45; color: white; padding: 20px; border-radius: 8px; z-index: 9999;';
      document.body.appendChild(processingMessage);

      // Verificar limites do plano Free antes de salvar
      if (!hasProAccess) {
        const existingProjects = await getAllProjectsForUser(user?.email || null);
        if (existingProjects.length >= FREE_MAX_PROJECTS) {
          alert(`Limite de ${FREE_MAX_PROJECTS} projetos no plano Free. Para criar novos projetos, faça upgrade para o Revela Pro ou Premium.`);
          document.body.removeChild(processingMessage);
          return;
        }
        if (beforeImages.length > FREE_MAX_BEFORE_IMAGES || afterImages.length > FREE_MAX_AFTER_IMAGES) {
          alert(`No plano Free cada projeto pode ter no máximo ${FREE_MAX_BEFORE_IMAGES} fotos ANTES e ${FREE_MAX_AFTER_IMAGES} fotos DEPOIS. Reduza a quantidade de imagens ou faça upgrade para o Revela Pro ou Premium.`);
          document.body.removeChild(processingMessage);
          return;
        }
      }

      let beforeBase64: string[] = [];
      let afterBase64: string[] = [];

      if (projectMode === 'before-after') {
        // Re-comprimir com qualidade menor para economizar espaço ao salvar (fluxo clássico)
        if (beforeImages.length > 0) {
          beforeBase64 = await Promise.all(
            beforeImages.map((file) => compressImage(file, 1920, 0.75)),
          );
        }
        if (afterImages.length > 0) {
          afterBase64 = await Promise.all(
            afterImages.map((file) => compressImage(file, 1920, 0.75)),
          );
        }
      } else {
        // Fluxo evolução: comprimir imagens dos passos (se houver)
        const enabledSteps = evolutionSteps.filter((step) => step.enabled && step.file);

        const compressedById: Record<string, string> = {};
        await Promise.all(
          enabledSteps.map(async (step) => {
            if (!step.file) return;
            const base64 = await compressImage(step.file, 1920, 0.75);
            compressedById[step.id] = base64;
          }),
        );

        // Para compatibilidade com comparador, usar primeiro e último marco como antes/depois
        const orderedSteps = evolutionSteps.filter(
          (step) => step.enabled && compressedById[step.id],
        );
        if (orderedSteps.length) {
          const first = orderedSteps[0];
          const last = orderedSteps[orderedSteps.length - 1];
          beforeBase64 = [compressedById[first.id]];
          afterBase64 = [compressedById[last.id]];
        }
      }
      
      // Construir dados de evolução (modo Premium Timeline)
      let evolutionImages:
        | { id: string; image: string; date: string; label?: string; momentType?: string }[]
        | undefined;
      if (projectMode === 'evolution') {
        const images: NonNullable<typeof evolutionImages> = [];

        // Garantir que usamos sempre a imagem comprimida salva (base64),
        // não dependendo apenas do preview em memória.
        const enabledStepsWithImage = evolutionSteps.filter(
          (step) => step.enabled && step.file,
        );

        enabledStepsWithImage.forEach((step) => {
          // Recalcular base64 para cada marco para garantir consistência
          // (caso algum preview ainda não tenha sido gerado).
          // Para evitar processamento extra desnecessário, usamos os arrays
          // antes/depois já calculados como fallback apenas para o primeiro
          // e o último marco. Aqui, sempre comprimimos novamente o arquivo.
        });

        await Promise.all(
          enabledStepsWithImage.map(async (step) => {
            if (!step.file) return;
            const base64 = await compressImage(step.file, 1920, 0.75);
            images.push({
              id: step.id,
              image: base64,
              date: addOffsetToDate(projectDate, step.offsetValue, step.offsetUnit),
              label: step.label,
              momentType: step.momentType,
            });
          }),
        );

        evolutionImages = images.length ? images : undefined;
      }

      // Criar projeto
      const project = {
        id: Date.now().toString(),
        name: projectName,
        date: projectDate,
        beforeImages: beforeBase64,
        afterImages: afterBase64,
        notes: projectNotes.trim() || undefined,
        evolutionImages,
        createdAt: new Date().toISOString(),
        ownerEmail: user?.email || undefined,
      };

      // Salvar projeto (tenta IndexedDB primeiro, depois localStorage)
      try {
        await saveProject(project);
        
        // Trackear criação de projeto
        trackCreateProject(project.name, beforeBase64.length, afterBase64.length);
        // Sync automática (Premium) após criar projeto
        void triggerAutoCloudSync();
        
        document.body.removeChild(processingMessage);
        alert('Projeto salvo com sucesso no seu dispositivo!');
        // Após salvar, limpar formulário para permitir criar um novo projeto em branco
        clearForm();
      } catch (error: any) {
        document.body.removeChild(processingMessage);
        alert(error.message || 'Erro ao salvar projeto. Tente novamente ou reduza o número de imagens.');
        return;
      }
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
      const errorMessage = document.querySelector('div[style*="position: fixed"]');
      if (errorMessage) document.body.removeChild(errorMessage);
      alert('Erro ao salvar projeto. Tente novamente ou reduza o número de imagens.');
    }
  };

  const nextBeforeImage = () => {
    setBeforeCurrentIndex((prev) => (prev + 1) % beforePreviewUrls.length);
  };

  const prevBeforeImage = () => {
    setBeforeCurrentIndex((prev) => (prev - 1 + beforePreviewUrls.length) % beforePreviewUrls.length);
  };

  const nextAfterImage = () => {
    setAfterCurrentIndex((prev) => (prev + 1) % afterPreviewUrls.length);
  };

  const prevAfterImage = () => {
    setAfterCurrentIndex((prev) => (prev - 1 + afterPreviewUrls.length) % afterPreviewUrls.length);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1B3C45' }}>
      <NavigationHeader />
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl pt-20 sm:pt-24">
        {/* Botão Voltar */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 border"
            style={{ 
              backgroundColor: 'rgba(232, 220, 192, 0.05)', 
              color: '#E8DCC0', 
              borderColor: 'rgba(232, 220, 192, 0.1)' 
            }}
            title="Voltar para dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
        </div>

        {/* Tipo de projeto: Clássico vs Evolução (Premium) */}
        <div
          className="rounded-2xl p-4 sm:p-6 mb-6 border"
          style={{
            backgroundColor: 'rgba(232, 220, 192, 0.05)',
            borderColor: 'rgba(232, 220, 192, 0.1)',
          }}
        >
          <h2
            className="text-base sm:text-lg font-light mb-3"
            style={{ color: '#E8DCC0' }}
          >
            Tipo de projeto
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Modo Antes e Depois (padrão) */}
            <button
              type="button"
              onClick={() => setProjectMode('before-after')}
              className={`w-full text-left rounded-xl p-4 border transition-all ${
                projectMode === 'before-after'
                  ? 'ring-2'
                  : ''
              }`}
              style={{
                backgroundColor:
                  projectMode === 'before-after'
                    ? 'rgba(0, 168, 143, 0.15)'
                    : 'rgba(232, 220, 192, 0.03)',
                borderColor:
                  projectMode === 'before-after'
                    ? '#00A88F'
                    : 'rgba(232, 220, 192, 0.1)',
              }}
            >
              <p
                className="text-sm font-semibold mb-1"
                style={{ color: '#E8DCC0' }}
              >
                Antes e Depois
              </p>
              <p
                className="text-xs"
                style={{ color: '#E8DCC0', opacity: 0.8 }}
              >
                Compare um conjunto de fotos antes e depois de forma rápida.
              </p>
            </button>

            {/* Modo Evolução (Premium): Premium = só botão; Free/Pro = botão + frase exclusivo */}
            <button
              type="button"
              onClick={() => {
                const canUseTimeline = hasPremiumAccess && canUsePremiumFeature('timeline');
                if (!canUseTimeline) {
                  alert('O modo Revela Evolução é exclusivo para usuários do plano Premium. Faça upgrade para ativar este recurso.');
                  return;
                }
                setProjectMode('evolution');
              }}
              className={`w-full text-left rounded-xl p-4 border transition-all ${
                projectMode === 'evolution'
                  ? 'ring-2'
                  : ''
              }`}
              style={{
                backgroundColor:
                  projectMode === 'evolution'
                    ? 'rgba(250, 204, 21, 0.12)'
                    : 'rgba(232, 220, 192, 0.03)',
                borderColor:
                  projectMode === 'evolution'
                    ? '#facc15'
                    : 'rgba(232, 220, 192, 0.1)',
              }}
            >
              <p
                className="text-sm font-semibold"
                style={{ color: '#E8DCC0' }}
              >
                Ativar modo Revela Evolução
              </p>
              {(!hasPremiumAccess || !canUsePremiumFeature('timeline')) && (
                <p
                  className="text-xs mt-1.5"
                  style={{ color: '#E8DCC0', opacity: 0.75 }}
                >
                  Exclusivo do Revela Premium
                </p>
              )}
            </button>
          </div>
        </div>

        {/* Informações do Projeto */}
        <div 
          className="rounded-2xl p-4 sm:p-6 mb-6 border" 
          style={{ 
            backgroundColor: 'rgba(232, 220, 192, 0.05)', 
            borderColor: 'rgba(232, 220, 192, 0.1)' 
          }}
        >
          <h1 
            className="text-xl sm:text-2xl font-light mb-4" 
            style={{ color: '#E8DCC0' }}
          >
            Novo Projeto
          </h1>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label 
                className="block mb-2 text-sm font-medium" 
                style={{ color: '#E8DCC0' }}
              >
                Nome do Projeto
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Digite o nome do projeto"
                className="w-full px-4 py-2 rounded-lg text-sm bg-transparent border border-gray-600 text-white placeholder:text-gray-500 focus:border-[#00A88F]"
              />
            </div>
            <div>
              <label 
                className="block mb-2 text-sm font-medium" 
                style={{ color: '#E8DCC0' }}
              >
                Data
              </label>
              <input
                type="date"
                value={projectDate}
                onChange={(e) => setProjectDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg text-sm bg-transparent border border-gray-600 text-white placeholder:text-gray-500 focus:border-[#00A88F]"
              />
            </div>
          </div>
        </div>

        {/* Upload de Imagens - fluxo clássico Antes/Depois */}
        {projectMode === 'before-after' && (
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {/* Upload Antes */}
            <div 
            className="rounded-lg p-3 sm:p-4 border" 
              style={{ 
                backgroundColor: 'rgba(232, 220, 192, 0.05)', 
                borderColor: 'rgba(232, 220, 192, 0.1)' 
              }}
          >
            <h2 
              className="text-base sm:text-lg font-light mb-3" 
              style={{ color: '#E8DCC0' }}
            >
              Fotos Antes
            </h2>
            <input
              ref={beforeInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleBeforeFiles}
              className="hidden"
              id="before-upload"
            />
            <label
              htmlFor="before-upload"
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed cursor-pointer transition-all hover:opacity-80 text-xs"
              style={{ 
                backgroundColor: 'rgba(232, 220, 192, 0.03)', 
                borderColor: 'rgba(232, 220, 192, 0.1)' 
              }}
            >
              <Camera className="w-4 h-4" style={{ color: '#E8DCC0', opacity: 0.7 }} />
              <span style={{ color: '#E8DCC0', opacity: 0.85 }}>Adicionar fotos</span>
            </label>
            {beforeImages.length > 0 && (
              <div className="mt-4 space-y-2">
                <p 
                  className="text-xs sm:text-sm" 
                  style={{ color: '#E8DCC0', opacity: 0.8 }}
                >
                  {beforeImages.length} foto(s) selecionada(s)
                </p>
                <div className="flex flex-wrap gap-2">
                  {beforePreviewUrls.map((src, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={src}
                        alt={`Antes ${index + 1}`}
                        width={80}
                        height={80}
                        unoptimized
                        className="w-16 h-16 rounded-lg object-cover"
                        style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeBeforeImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.95)', color: '#fff' }}
                        aria-label="Remover foto antes"
                        title="Remover"
                      >
                        ×
                      </button>
                      <div
                        className="absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ backgroundColor: '#00A88F', color: '#FFFFFF' }}
                      >
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>

            {/* Upload Depois */}
            <div 
            className="rounded-lg p-3 sm:p-4 border" 
              style={{ 
                backgroundColor: 'rgba(232, 220, 192, 0.05)', 
                borderColor: 'rgba(232, 220, 192, 0.1)' 
              }}
          >
            <h2 
              className="text-base sm:text-lg font-light mb-3" 
              style={{ color: '#E8DCC0' }}
            >
              Fotos Depois
            </h2>
            <input
              ref={afterInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleAfterFiles}
              className="hidden"
              id="after-upload"
            />
            <label
              htmlFor="after-upload"
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed cursor-pointer transition-all hover:opacity-80 text-xs"
              style={{ 
                backgroundColor: 'rgba(232, 220, 192, 0.03)', 
                borderColor: 'rgba(232, 220, 192, 0.1)' 
              }}
            >
              <Camera className="w-4 h-4" style={{ color: '#E8DCC0', opacity: 0.7 }} />
              <span style={{ color: '#E8DCC0', opacity: 0.85 }}>Adicionar fotos</span>
            </label>
            {afterImages.length > 0 && (
              <div className="mt-4 space-y-2">
                <p 
                  className="text-xs sm:text-sm" 
                  style={{ color: '#E8DCC0', opacity: 0.8 }}
                >
                  {afterImages.length} foto(s) selecionada(s)
                </p>
                <div className="flex flex-wrap gap-2">
                  {afterPreviewUrls.map((src, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={src}
                        alt={`Depois ${index + 1}`}
                        width={80}
                        height={80}
                        unoptimized
                        className="w-16 h-16 rounded-lg object-cover"
                        style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeAfterImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.95)', color: '#fff' }}
                        aria-label="Remover foto depois"
                        title="Remover"
                      >
                        ×
                      </button>
                      <div
                        className="absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ backgroundColor: '#00A88F', color: '#FFFFFF' }}
                      >
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
          </div>
        )}

        {/* Configuração de marcos e uploads - fluxo Evolução */}
        {projectMode === 'evolution' && (
          <div
            className="rounded-2xl p-4 sm:p-6 mb-6 border"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              borderColor: 'rgba(55, 65, 81, 0.9)',
            }}
          >
            <h2
              className="text-base sm:text-lg font-light mb-3"
              style={{ color: '#E8DCC0' }}
            >
              Registros da Revela Evolução
            </h2>
            <p
              className="text-xs sm:text-sm mb-4"
              style={{ color: '#E8DCC0', opacity: 0.8 }}
            >
              Defina até 4 momentos do tratamento (por exemplo, 0, 30, 90 e 180 dias) e adicione
              uma foto para cada registro. Eles vão alimentar o Revela Evolução visual.
            </p>

            <div className="space-y-4">
              {evolutionSteps.map((step, index) => {
                const isStart = step.id === 'start';
                return (
                  <div
                    key={step.id}
                    className="rounded-xl border px-3 py-3 sm:px-4 sm:py-4 space-y-3"
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderColor: 'rgba(55, 65, 81, 0.9)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {!isStart && (
                          <input
                            type="checkbox"
                            checked={step.enabled}
                            onChange={(e) =>
                              setEvolutionSteps((prev) =>
                                prev.map((s) =>
                                  s.id === step.id ? { ...s, enabled: e.target.checked } : s,
                                ),
                              )
                            }
                            className="h-4 w-4"
                          />
                        )}
                        <div>
                          <p
                            className="text-sm font-medium"
                            style={{ color: '#E8DCC0' }}
                          >
                            {isStart ? 'Início (0)' : step.label || `Revela ${index}`}
                          </p>
                          {!isStart && (
                            <div className="flex items-center gap-2 mt-1 text-[11px]">
                              <span style={{ color: '#E8DCC0', opacity: 0.75 }}>
                                +{' '}
                                <input
                                  type="number"
                                  min={0}
                                  value={step.offsetValue}
                                  onChange={(e) =>
                                    setEvolutionSteps((prev) =>
                                      prev.map((s) =>
                                        s.id === step.id
                                          ? {
                                              ...s,
                                              offsetValue: Number(e.target.value) || 0,
                                            }
                                          : s,
                                      ),
                                    )
                                  }
                                  className="w-14 px-1 py-0.5 rounded bg-transparent border border-gray-600 text-xs text-white"
                                />
                              </span>
                              <select
                                value={step.offsetUnit}
                                onChange={(e) =>
                                  setEvolutionSteps((prev) =>
                                    prev.map((s) =>
                                      s.id === step.id
                                        ? {
                                            ...s,
                                            offsetUnit: e.target.value as EvolutionUnit,
                                          }
                                        : s,
                                    ),
                                  )
                                }
                                className="px-2 py-0.5 rounded bg-transparent border border-gray-600 text-xs text-white"
                              >
                                <option value="days">dias</option>
                                <option value="months">meses</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Upload da imagem do marco */}
                    {(step.enabled || isStart) && (
                      <div className="mt-2">
                        <label
                          className="block mb-1 text-xs font-medium"
                          style={{ color: '#E8DCC0' }}
                        >
                          Imagem do registro
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id={`evolution-upload-${step.id}`}
                          onChange={async (e) => {
                            const file = e.target.files?.[0] || null;
                            if (!file) return;
                            const preview = await compressImage(file, 1920, 0.85);
                            setEvolutionSteps((prev) =>
                              prev.map((s) =>
                                s.id === step.id ? { ...s, file, preview } : s,
                              ),
                            );
                          }}
                        />
                        <label
                          htmlFor={`evolution-upload-${step.id}`}
                          className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed cursor-pointer transition-all hover:opacity-80"
                          style={{
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            borderColor: 'rgba(75, 85, 99, 0.9)',
                          }}
                        >
                          {step.preview ? (
                            <>
                              <Image
                                src={step.preview}
                                alt={step.label}
                                width={600}
                                height={400}
                                unoptimized
                                style={{
                                  width: '100%',
                                  height: 'auto',
                                  maxHeight: '260px',
                                  objectFit: 'contain',
                                }}
                              />
                              <span
                                className="text-[11px]"
                                style={{ color: '#E8DCC0', opacity: 0.8 }}
                              >
                                Trocar imagem
                              </span>
                            </>
                          ) : (
                            <>
                              <Camera
                                className="w-5 h-5"
                                style={{ color: '#E8DCC0', opacity: 0.7 }}
                              />
                              <span
                                className="text-[11px] text-center"
                                style={{ color: '#E8DCC0', opacity: 0.8 }}
                              >
                                Clique para escolher uma imagem para este registro
                              </span>
                            </>
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6">
          <button
            onClick={() => setShowPreview(!showPreview)}
            disabled={
              (projectMode === 'before-after' &&
                (beforePreviewUrls.length === 0 || afterPreviewUrls.length === 0)) ||
              (projectMode === 'evolution' &&
                !evolutionSteps.some((s) => s.enabled && s.preview))
            }
            className="px-6 py-3 rounded-lg text-sm sm:text-base font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border"
            style={{ 
              backgroundColor: 'rgba(232, 220, 192, 0.05)', 
              color: '#E8DCC0', 
              borderColor: 'rgba(232, 220, 192, 0.1)' 
            }}
          >
            <Eye className="w-5 h-5" />
            Visualizar Projeto
          </button>
          <button
            onClick={handleSave}
            disabled={
              !projectName ||
              !projectDate
            }
            className="px-6 py-3 rounded-lg text-sm sm:text-base font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: '#00A88F', color: '#FFFFFF' }}
          >
            <Save className="w-5 h-5" />
            Salvar Projeto
          </button>
          <button
            onClick={clearForm}
            className="px-6 py-3 rounded-2xl text-sm sm:text-base font-medium transition-all hover:opacity-90 flex items-center justify-center gap-2 border"
            style={{ 
              backgroundColor: 'rgba(232, 220, 192, 0.05)', 
              color: '#E8DCC0', 
              borderColor: 'rgba(232, 220, 192, 0.1)' 
            }}
          >
            Novo Projeto
          </button>
        </div>

        {/* Preview de Visualização */}
        {showPreview && (
          <>
            {/* Preview modo Antes e Depois */}
            {projectMode === 'before-after' &&
              beforePreviewUrls.length > 0 &&
              afterPreviewUrls.length > 0 && (
                <div
                  className="rounded-lg p-4 sm:p-6 border mb-6"
                  style={{
                    backgroundColor: 'rgba(232, 220, 192, 0.05)',
                    borderColor: 'rgba(232, 220, 192, 0.1)',
                  }}
                >
                  <h2
                    className="text-lg sm:text-xl font-light mb-4 text-center"
                    style={{ color: '#E8DCC0' }}
                  >
                    Visualização Antes e Depois
                  </h2>

                  {/* Desktop: Lado a lado */}
                  <div className="hidden sm:grid sm:grid-cols-2 gap-4">
                    {/* Carrossel Antes */}
                    <div className="relative">
                      <div className="text-center mb-2">
                        <span
                          className="text-sm font-medium"
                          style={{ color: '#E8DCC0' }}
                        >
                          ANTES
                        </span>
                      </div>
                      <div
                        className="relative rounded-lg overflow-hidden"
                        style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)' }}
                      >
                        {beforePreviewUrls.length > 0 && (
                          <>
                            <Image
                              src={beforePreviewUrls[beforeCurrentIndex]}
                              alt={`Antes ${beforeCurrentIndex + 1}`}
                              width={1200}
                              height={900}
                              unoptimized
                              style={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '500px',
                                objectFit: 'contain',
                              }}
                            />
                            {beforePreviewUrls.length > 1 && (
                              <>
                                <button
                                  onClick={prevBeforeImage}
                                  className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-white/20 transition-colors"
                                  style={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    color: '#E8DCC0',
                                  }}
                                >
                                  <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={nextBeforeImage}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-white/20 transition-colors"
                                  style={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    color: '#E8DCC0',
                                  }}
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </button>
                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                                  <span
                                    className="text-xs px-2 py-1 rounded"
                                    style={{
                                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                      color: '#E8DCC0',
                                    }}
                                  >
                                    {beforeCurrentIndex + 1} / {beforePreviewUrls.length}
                                  </span>
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Carrossel Depois */}
                    <div className="relative">
                      <div className="text-center mb-2">
                        <span
                          className="text-sm font-medium"
                          style={{ color: '#E8DCC0' }}
                        >
                          DEPOIS
                        </span>
                      </div>
                      <div
                        className="relative rounded-lg overflow-hidden"
                        style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)' }}
                      >
                        {afterPreviewUrls.length > 0 && (
                          <>
                            <Image
                              src={afterPreviewUrls[afterCurrentIndex]}
                              alt={`Depois ${afterCurrentIndex + 1}`}
                              width={1200}
                              height={900}
                              unoptimized
                              style={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '500px',
                                objectFit: 'contain',
                              }}
                            />
                            {afterPreviewUrls.length > 1 && (
                              <>
                                <button
                                  onClick={prevAfterImage}
                                  className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-white/20 transition-colors"
                                  style={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    color: '#E8DCC0',
                                  }}
                                >
                                  <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={nextAfterImage}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-white/20 transition-colors"
                                  style={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    color: '#E8DCC0',
                                  }}
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </button>
                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                                  <span
                                    className="text-xs px-2 py-1 rounded"
                                    style={{
                                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                      color: '#E8DCC0',
                                    }}
                                  >
                                    {afterCurrentIndex + 1} / {afterPreviewUrls.length}
                                  </span>
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mobile: Em cima/baixo */}
                  <div className="sm:hidden space-y-4">
                    {/* Carrossel Antes */}
                    <div className="relative">
                      <div className="text-center mb-2">
                        <span
                          className="text-sm font-medium"
                          style={{ color: '#E8DCC0' }}
                        >
                          ANTES
                        </span>
                      </div>
                      <div
                        className="relative rounded-lg overflow-hidden"
                        style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)' }}
                      >
                        {beforePreviewUrls.length > 0 && (
                          <>
                            <Image
                              src={beforePreviewUrls[beforeCurrentIndex]}
                              alt={`Antes ${beforeCurrentIndex + 1}`}
                              width={1200}
                              height={900}
                              unoptimized
                              style={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '400px',
                                objectFit: 'contain',
                              }}
                            />
                            {beforePreviewUrls.length > 1 && (
                              <>
                                <button
                                  onClick={prevBeforeImage}
                                  className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-white/20 transition-colors"
                                  style={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    color: '#E8DCC0',
                                  }}
                                >
                                  <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={nextBeforeImage}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-white/20 transition-colors"
                                  style={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    color: '#E8DCC0',
                                  }}
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </button>
                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                                  <span
                                    className="text-xs px-2 py-1 rounded"
                                    style={{
                                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                      color: '#E8DCC0',
                                    }}
                                  >
                                    {beforeCurrentIndex + 1} / {beforePreviewUrls.length}
                                  </span>
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Carrossel Depois */}
                    <div className="relative">
                      <div className="text-center mb-2">
                        <span
                          className="text-sm font-medium"
                          style={{ color: '#E8DCC0' }}
                        >
                          DEPOIS
                        </span>
                      </div>
                      <div
                        className="relative rounded-lg overflow-hidden"
                        style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)' }}
                      >
                        {afterPreviewUrls.length > 0 && (
                          <>
                            <Image
                              src={afterPreviewUrls[afterCurrentIndex]}
                              alt={`Depois ${afterCurrentIndex + 1}`}
                              width={1200}
                              height={900}
                              unoptimized
                              style={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '400px',
                                objectFit: 'contain',
                              }}
                            />
                            {afterPreviewUrls.length > 1 && (
                              <>
                                <button
                                  onClick={prevAfterImage}
                                  className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-white/20 transition-colors"
                                  style={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    color: '#E8DCC0',
                                  }}
                                >
                                  <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={nextAfterImage}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-white/20 transition-colors"
                                  style={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    color: '#E8DCC0',
                                  }}
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </button>
                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                                  <span
                                    className="text-xs px-2 py-1 rounded"
                                    style={{
                                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                      color: '#E8DCC0',
                                    }}
                                  >
                                    {afterCurrentIndex + 1} / {afterPreviewUrls.length}
                                  </span>
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {/* Preview modo Evolução */}
            {projectMode === 'evolution' && (
              <div
                className="rounded-lg p-4 sm:p-6 border mb-6"
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: 'rgba(51, 65, 85, 0.9)',
                }}
              >
                <h2
                  className="text-lg sm:text-xl font-light mb-4 text-center"
                  style={{ color: '#E8DCC0' }}
                >
                  Pré-visualização Revela Evolução
                </h2>
                {evolutionSteps.some((step) => step.enabled && step.preview) ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {evolutionSteps
                      .filter((step) => step.enabled && step.preview)
                      .map((step) => (
                        <div
                          key={step.id}
                          className="rounded-xl border overflow-hidden flex flex-col"
                          style={{
                            backgroundColor: 'rgba(15, 23, 42, 1)',
                            borderColor: 'rgba(51, 65, 85, 0.9)',
                          }}
                        >
                          <div className="px-3 py-2 border-b border-slate-700">
                            <p
                              className="text-xs font-semibold uppercase tracking-wide"
                              style={{ color: '#E8DCC0' }}
                            >
                              {step.id === 'start'
                                ? 'Início (0)'
                                : step.label || 'Revela'}
                            </p>
                            {step.id !== 'start' && (
                              <p
                                className="text-[11px]"
                                style={{ color: '#E8DCC0', opacity: 0.7 }}
                              >
                                + {step.offsetValue}{' '}
                                {step.offsetUnit === 'days' ? 'dias' : 'meses'}
                              </p>
                            )}
                          </div>
                          <div className="p-2 flex-1 flex items-center justify-center bg-slate-900">
                            <Image
                              src={step.preview as string}
                              alt={step.label}
                              width={800}
                              height={600}
                              unoptimized
                              style={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '220px',
                                objectFit: 'contain',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p
                    className="text-sm text-center"
                    style={{ color: '#E8DCC0', opacity: 0.8 }}
                  >
                    Adicione imagens aos registros da Revela Evolução para visualizar aqui.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

