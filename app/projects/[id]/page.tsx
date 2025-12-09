'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Edit2, Save, X, Plus, Trash2, Download, Image as ImageIcon, FileText, Maximize2, Minimize2, ArrowLeft, SlidersHorizontal } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { getProjectFromIndexedDB, updateProject, type Project } from '@/lib/storage';
import { NavigationHeader } from '@/components/navigation-header';
import { Footer } from '@/components/footer';
import { useAuth } from '@/hooks/useAuth';
import { SafeBase64Image } from '@/components/safe-image';
import { ZoomableImage } from '@/components/zoomable-image';
import { ComparisonSlider } from '@/components/comparison-slider';
import { errorLogger } from '@/lib/error-logger';
import { exportComparisonImage } from '@/lib/export-utils';

export default function ViewProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [projectLoading, setProjectLoading] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [beforeCurrentIndex, setBeforeCurrentIndex] = useState(0);
  const [afterCurrentIndex, setAfterCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editingBeforeImages, setEditingBeforeImages] = useState<string[]>([]);
  const [editingAfterImages, setEditingAfterImages] = useState<string[]>([]);
  const [editingNotes, setEditingNotes] = useState<string>('');
  const [newBeforeFiles, setNewBeforeFiles] = useState<File[]>([]);
  const [newAfterFiles, setNewAfterFiles] = useState<File[]>([]);
  const [draggedBeforeIndex, setDraggedBeforeIndex] = useState<number | null>(null);
  const [draggedAfterIndex, setDraggedAfterIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [tempNotes, setTempNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isSliderMode, setIsSliderMode] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [viewerHeight, setViewerHeight] = useState<number | null>(null);
  const [stackedSectionHeight, setStackedSectionHeight] = useState<number | null>(null);
  const beforeInputRef = React.useRef<HTMLInputElement>(null);
  const afterInputRef = React.useRef<HTMLInputElement>(null);
  const loadProjectRef = React.useRef(false);

  // Detectar orientação e calcular dimensões responsivas
  useEffect(() => {
    const updateLayoutMetrics = () => {
      const width = window.innerWidth;
      const height = typeof window !== 'undefined' && window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;
      
      // Detectar se é tablet (768px - 1023px) ou mobile (< 768px)
      const isTablet = width >= 768 && width < 1024;
      const isMobile = width < 768;
      
      const landscape = width > height;
      setIsLandscape(landscape);

      const header = document.querySelector('header');
      const headerHeight = landscape ? 0 : header ? header.getBoundingClientRect().height : 0;
      const mainMarginTop = landscape ? 0 : 36;
      const extraPadding = landscape ? 0 : (isTablet ? 20 : 24);
      
      // Em landscape, usar toda a altura disponível menos pequenos espaços
      // Em tablets landscape, deixar mais espaço para controles
      const landscapePadding = isTablet ? 12 : 8;
      const availableHeight = landscape 
        ? height - (header ? header.getBoundingClientRect().height : 0) - landscapePadding
        : height - headerHeight - mainMarginTop - extraPadding;
      
      setViewerHeight(Math.max(availableHeight, 0));

      // Para modo empilhado (portrait), calcular altura de cada seção
      // Tablets precisam de mais espaço para labels
      const labelAllowance = landscape 
        ? (isTablet ? 40 : 36) 
        : (isMobile ? 52 : isTablet ? 64 : 68);
      const computedStacked = Math.max((availableHeight - labelAllowance) / 2, 160);
      setStackedSectionHeight(computedStacked);
    };

    updateLayoutMetrics();
    
    // Usar timeout para garantir que o visualViewport está atualizado após mudança de orientação
    const handleOrientationChange = () => {
      setTimeout(updateLayoutMetrics, 150);
    };
    
    // Debounce para resize em desktop
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateLayoutMetrics, 100);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Visual Viewport API para melhor suporte mobile
    if (typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateLayoutMetrics);
      window.visualViewport.addEventListener('scroll', updateLayoutMetrics);
    }

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (typeof window !== 'undefined' && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateLayoutMetrics);
        window.visualViewport.removeEventListener('scroll', updateLayoutMetrics);
      }
    };
  }, []);

  // Usar imagens de edição quando estiver editando
  const displayBeforeImages = isEditing ? editingBeforeImages : (project?.beforeImages || []);
  const displayAfterImages = isEditing ? editingAfterImages : (project?.afterImages || []);

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    
    // Prevenir múltiplas chamadas simultâneas (race condition)
    if (loadProjectRef.current) {
      errorLogger.warn('loadProject já em execução, ignorando chamada duplicada', { projectId });
      return;
    }
    
    loadProjectRef.current = true;
    
    try {
      setProjectLoading(true);
      errorLogger.info('Iniciando carregamento de projeto', { projectId });
      
      // Adicionar timeout geral para evitar travamentos
      let timeoutId: NodeJS.Timeout | null = null;
      let timeoutResolved = false;
      
      const loadPromise = (async () => {
        // Tentar IndexedDB primeiro (já tem timeout interno de 5s)
        let loadedProject: Project | null = null;
        try {
          loadedProject = await getProjectFromIndexedDB(projectId);
          if (loadedProject) {
            errorLogger.info('Projeto carregado do IndexedDB', { projectId });
            // Cancelar timeout se projeto foi carregado
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
              timeoutResolved = true;
            }
            return loadedProject;
          }
        } catch (indexedDBError) {
          errorLogger.warn('Erro ao carregar do IndexedDB, tentando localStorage', { 
            projectId, 
            error: indexedDBError 
          });
        }
      
        // Se não encontrar, tentar localStorage (com verificação de disponibilidade)
        if (!loadedProject && typeof window !== 'undefined' && window.localStorage) {
          try {
            const stored = localStorage.getItem('revela_projects');
            if (stored) {
              const projects = JSON.parse(stored);
              loadedProject = projects.find((p: Project) => p.id === projectId) || null;
              if (loadedProject) {
                errorLogger.info('Projeto carregado do localStorage', { projectId });
                // Cancelar timeout se projeto foi carregado
                if (timeoutId) {
                  clearTimeout(timeoutId);
                  timeoutId = null;
                  timeoutResolved = true;
                }
                return loadedProject;
              }
            }
          } catch (storageError) {
            errorLogger.warn('Erro ao acessar localStorage', { 
              projectId, 
              error: storageError 
            });
            // Continuar mesmo se localStorage falhar
          }
        }
        
        return loadedProject;
      })();
      
      // Timeout geral de 10 segundos (só dispara se não foi resolvido)
      const timeoutPromise = new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => {
          if (!timeoutResolved) {
            errorLogger.warn('Timeout ao carregar projeto', { projectId });
            timeoutResolved = true;
            resolve(null);
          } else {
            // Se já foi resolvido, não fazer nada
            resolve(null);
          }
        }, 10000);
      });
      
      const loadedProject = await Promise.race([loadPromise, timeoutPromise]);
      
      // Limpar timeout se ainda estiver ativo (caso o loadPromise tenha vencido primeiro)
      if (timeoutId && !timeoutResolved) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      if (loadedProject) {
        // Validar estrutura do projeto
        if (!loadedProject.beforeImages || !Array.isArray(loadedProject.beforeImages)) {
          errorLogger.warn('Projeto com estrutura inválida: beforeImages', { projectId });
          loadedProject.beforeImages = [];
        }
        if (!loadedProject.afterImages || !Array.isArray(loadedProject.afterImages)) {
          errorLogger.warn('Projeto com estrutura inválida: afterImages', { projectId });
          loadedProject.afterImages = [];
        }
        
        // Validar que as imagens não estão corrompidas
        loadedProject.beforeImages = loadedProject.beforeImages.filter(img => 
          img && typeof img === 'string' && img.length > 0
        );
        loadedProject.afterImages = loadedProject.afterImages.filter(img => 
          img && typeof img === 'string' && img.length > 0
        );
        
        setProject(loadedProject);
        setEditingBeforeImages([...loadedProject.beforeImages]);
        setEditingAfterImages([...loadedProject.afterImages]);
        setEditingNotes(loadedProject.notes || '');
        errorLogger.info('Projeto carregado com sucesso', { 
          projectId, 
          beforeCount: loadedProject.beforeImages.length,
          afterCount: loadedProject.afterImages.length
        });
      } else {
        errorLogger.warn('Projeto não encontrado ou timeout', { projectId });
        router.push('/projects');
      }
    } catch (error) {
      errorLogger.error('Erro ao carregar projeto', { 
        projectId, 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      router.push('/projects');
    } finally {
      setProjectLoading(false);
      loadProjectRef.current = false;
    }
  }, [projectId, router]);

  // Usar hook de autenticação customizado (sem redirecionamento automático)
  const { user: authUser, loading: authLoading } = useAuth(false);
  
  useEffect(() => {
    setUser(authUser);
  }, [authUser]);

  useEffect(() => {
    // Carregar projeto independente de autenticação (dados locais)
    if (projectId && !authLoading) {
      loadProject();
    }
  }, [projectId, authLoading, loadProject]);

  // Loading geral combina autenticação e projeto
  const isLoading = authLoading || projectLoading;

  const nextBeforeImage = () => {
    if (displayBeforeImages.length > 0) {
      setBeforeCurrentIndex((prev) => (prev + 1) % displayBeforeImages.length);
    }
  };

  const prevBeforeImage = () => {
    if (displayBeforeImages.length > 0) {
      setBeforeCurrentIndex((prev) => (prev - 1 + displayBeforeImages.length) % displayBeforeImages.length);
    }
  };

  const nextAfterImage = () => {
    if (displayAfterImages.length > 0) {
      setAfterCurrentIndex((prev) => (prev + 1) % displayAfterImages.length);
    }
  };

  const prevAfterImage = () => {
    if (displayAfterImages.length > 0) {
      setAfterCurrentIndex((prev) => (prev - 1 + displayAfterImages.length) % displayAfterImages.length);
    }
  };

  // Comprimir imagem antes de converter para base64
  const compressImage = (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = document.createElement('img') as HTMLImageElement;
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

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

  const handleEdit = () => {
    if (project) {
      setIsEditing(true);
      setEditingBeforeImages([...project.beforeImages]);
      setEditingAfterImages([...project.afterImages]);
      setEditingNotes(project.notes || '');
      setNewBeforeFiles([]);
      setNewAfterFiles([]);
    }
  };

  const handleOpenNotes = () => {
    if (project) {
      setTempNotes(project.notes || '');
      setShowNotesModal(true);
    }
  };

  const handleCloseNotes = () => {
    setShowNotesModal(false);
    setTempNotes('');
  };

  const handleSaveNotes = async () => {
    if (!project) return;

    try {
      setSavingNotes(true);
      
      const updatedProject: Project = {
        ...project,
        notes: tempNotes.trim() || undefined,
      };

      await updateProject(updatedProject);
      setProject(updatedProject);
      setShowNotesModal(false);
      alert('Notas salvas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar notas:', error);
      alert('Erro ao salvar notas. Tente novamente.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleEnterPresentationMode = () => {
    setIsPresentationMode(true);
    setIsSliderMode(false); // Desativar slider ao entrar em apresentação
    // Tentar entrar em fullscreen se suportado
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {
        // Ignora erro se não conseguir entrar em fullscreen
      });
    }
  };

  const handleToggleSliderMode = () => {
    setIsSliderMode(!isSliderMode);
    setIsPresentationMode(false); // Desativar apresentação ao ativar slider
  };

  const handleExitPresentationMode = () => {
    setIsPresentationMode(false);
    // Sair do fullscreen se estiver
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {
        // Ignora erro se não conseguir sair
      });
    }
  };

  // Navegação por teclado no modo apresentação
  useEffect(() => {
    if (!isPresentationMode) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleExitPresentationMode();
      } else if (e.key === 'ArrowLeft' && !e.shiftKey) {
        // ← : Navegar imagem ANTES para trás
        if (displayBeforeImages.length > 0) {
          setBeforeCurrentIndex((prev) => (prev - 1 + displayBeforeImages.length) % displayBeforeImages.length);
        }
      } else if (e.key === 'ArrowRight' && !e.shiftKey) {
        // → : Navegar imagem ANTES para frente
        if (displayBeforeImages.length > 0) {
          setBeforeCurrentIndex((prev) => (prev + 1) % displayBeforeImages.length);
        }
      } else if (e.key === 'ArrowLeft' && e.shiftKey) {
        // Shift + ← : Navegar imagem DEPOIS para trás
        if (displayAfterImages.length > 0) {
          setAfterCurrentIndex((prev) => (prev - 1 + displayAfterImages.length) % displayAfterImages.length);
        }
      } else if (e.key === 'ArrowRight' && e.shiftKey) {
        // Shift + → : Navegar imagem DEPOIS para frente
        if (displayAfterImages.length > 0) {
          setAfterCurrentIndex((prev) => (prev + 1) % displayAfterImages.length);
        }
      } else if (e.key === 'f' || e.key === 'F') {
        // Toggle fullscreen com F
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPresentationMode, displayBeforeImages.length, displayAfterImages.length]);

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (project) {
      setEditingBeforeImages([...project.beforeImages]);
      setEditingAfterImages([...project.afterImages]);
    }
    setNewBeforeFiles([]);
    setNewAfterFiles([]);
    if (beforeInputRef.current) beforeInputRef.current.value = '';
    if (afterInputRef.current) afterInputRef.current.value = '';
  };

  const handleAddBeforeFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;

    try {
      const compressedUrls = await Promise.all(
        files.map(file => compressImage(file, 1920, 0.85))
      );

      setNewBeforeFiles(prev => [...prev, ...files]);
      setEditingBeforeImages(prev => [...prev, ...compressedUrls]);
    } catch (error) {
      console.error('Erro ao processar imagens antes:', error);
      alert('Não foi possível adicionar algumas imagens. Tente novamente.');
    }
  };

  const handleAddAfterFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;

    try {
      const compressedUrls = await Promise.all(
        files.map(file => compressImage(file, 1920, 0.85))
      );

      setNewAfterFiles(prev => [...prev, ...files]);
      setEditingAfterImages(prev => [...prev, ...compressedUrls]);
    } catch (error) {
      console.error('Erro ao processar imagens depois:', error);
      alert('Não foi possível adicionar algumas imagens. Tente novamente.');
    }
  };

  const handleRemoveBeforeImage = (index: number) => {
    setEditingBeforeImages(prev => {
      const updated = prev.filter((_, i) => i !== index);

      if (beforeCurrentIndex >= updated.length && updated.length > 0) {
        setBeforeCurrentIndex(updated.length - 1);
      } else if (updated.length === 0) {
        setBeforeCurrentIndex(0);
      }

      return updated;
    });

    const existingCount = editingBeforeImages.length - newBeforeFiles.length;
    if (index >= existingCount) {
      const newIndex = index - existingCount;
      setNewBeforeFiles(prev => prev.filter((_, i) => i !== newIndex));
    }
  };

  const handleRemoveAfterImage = (index: number) => {
    setEditingAfterImages(prev => {
      const updated = prev.filter((_, i) => i !== index);

      if (afterCurrentIndex >= updated.length && updated.length > 0) {
        setAfterCurrentIndex(updated.length - 1);
      } else if (updated.length === 0) {
        setAfterCurrentIndex(0);
      }

      return updated;
    });

    const existingCount = editingAfterImages.length - newAfterFiles.length;
    if (index >= existingCount) {
      const newIndex = index - existingCount;
      setNewAfterFiles(prev => prev.filter((_, i) => i !== newIndex));
    }
  };

  // Drag and Drop para reordenar imagens ANTES
  const handleBeforeDragStart = (index: number) => {
    setDraggedBeforeIndex(index);
  };

  const handleBeforeDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedBeforeIndex === null || draggedBeforeIndex === index) return;

    setEditingBeforeImages(prev => {
      const newImages = [...prev];
      const draggedItem = newImages[draggedBeforeIndex];
      newImages.splice(draggedBeforeIndex, 1);
      newImages.splice(index, 0, draggedItem);
      return newImages;
    });

    setDraggedBeforeIndex(index);
  };

  const handleBeforeDragEnd = () => {
    setDraggedBeforeIndex(null);
  };

  // Drag and Drop para reordenar imagens DEPOIS
  const handleAfterDragStart = (index: number) => {
    setDraggedAfterIndex(index);
  };

  const handleAfterDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedAfterIndex === null || draggedAfterIndex === index) return;

    setEditingAfterImages(prev => {
      const newImages = [...prev];
      const draggedItem = newImages[draggedAfterIndex];
      newImages.splice(draggedAfterIndex, 1);
      newImages.splice(index, 0, draggedItem);
      return newImages;
    });

    setDraggedAfterIndex(index);
  };

  const handleAfterDragEnd = () => {
    setDraggedAfterIndex(null);
  };

  const handleExportImage = async () => {
    if (!project || displayBeforeImages.length === 0 || displayAfterImages.length === 0) {
      alert('É necessário ter pelo menos uma imagem antes e uma depois para exportar.');
      return;
    }

    try {
      setExporting(true);
      
      const beforeImage = displayBeforeImages[beforeCurrentIndex];
      const afterImage = displayAfterImages[afterCurrentIndex];

      await exportComparisonImage(
        beforeImage,
        afterImage,
        project.name,
        project.date,
        {
          format: 'png',
          quality: 0.95,
          layout: 'side-by-side',
          includeLabels: true,
          includeInfo: true,
        }
      );

      // Pequeno delay para mostrar feedback
      setTimeout(() => {
        setExporting(false);
      }, 500);
    } catch (error: any) {
      console.error('Erro ao exportar imagem:', error);
      alert(error.message || 'Erro ao exportar imagem. Tente novamente.');
      setExporting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!project) return;

    try {
      setSaving(true);
      
      const existingBeforeCount = project.beforeImages.length;
      const existingAfterCount = project.afterImages.length;
      
      // Re-comprimir novas imagens com qualidade menor para salvar
      const newBeforeCompressed = await Promise.all(
        newBeforeFiles.map(file => compressImage(file, 1920, 0.75))
      );
      const newAfterCompressed = await Promise.all(
        newAfterFiles.map(file => compressImage(file, 1920, 0.75))
      );

      // Construir arrays finais: imagens existentes mantidas + novas comprimidas
      // As imagens existentes que foram mantidas estão em editingBeforeImages/editingAfterImages
      // até o índice que corresponde às imagens originais (mas podem ter sido removidas algumas)
      const beforeToSave: string[] = [];
      const afterToSave: string[] = [];

      // Para imagens antes: usar as que estão em editingBeforeImages (já incluem existentes mantidas)
      // Mas precisamos substituir as novas (que estão no final) pelas versões re-comprimidas
      const beforeExisting = editingBeforeImages.slice(0, editingBeforeImages.length - newBeforeFiles.length);
      beforeToSave.push(...beforeExisting, ...newBeforeCompressed);

      // Para imagens depois: mesma lógica
      const afterExisting = editingAfterImages.slice(0, editingAfterImages.length - newAfterFiles.length);
      afterToSave.push(...afterExisting, ...newAfterCompressed);

      const updatedProject: Project = {
        ...project,
        beforeImages: beforeToSave,
        afterImages: afterToSave,
        notes: editingNotes.trim() || undefined,
      };

      await updateProject(updatedProject);
      setProject(updatedProject);
      setIsEditing(false);
      setNewBeforeFiles([]);
      setNewAfterFiles([]);
      setBeforeCurrentIndex(0);
      setAfterCurrentIndex(0);
      alert('Projeto atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar edição:', error);
      alert(error.message || 'Erro ao salvar alterações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
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

  if (!project) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center" 
        style={{ backgroundColor: '#1A2B32' }}
      >
        <div className="text-center">
          <p style={{ color: '#E8DCC0' }}>Projeto não encontrado</p>
          <Link href="/projects">
            <button
              className="mt-4 px-6 py-3 rounded-lg text-sm sm:text-base font-medium"
              style={{ backgroundColor: '#00A88F', color: '#FFFFFF' }}
            >
              Voltar para Projetos
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Modo Apresentação - Tela Cheia
  if (isPresentationMode && displayBeforeImages.length > 0 && displayAfterImages.length > 0) {
    return (
      <div 
        className="fixed inset-0 flex flex-col overflow-hidden z-50" 
        style={{ backgroundColor: '#000000' }}
      >
        {/* Controles de Navegação (aparecem ao passar o mouse) */}
        <div className="group relative w-full h-full flex items-center">
          {/* Botão Sair (canto superior direito) */}
          <button
            onClick={handleExitPresentationMode}
            className="absolute top-4 right-4 z-10 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
            style={{ color: '#FFFFFF' }}
            title="Sair (ESC)"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Controles para Imagem ANTES (lado esquerdo) */}
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {beforeCurrentIndex > 0 && (
              <button
                onClick={prevBeforeImage}
                className="p-3 rounded-full bg-black/50 hover:bg-black/70 transition-all"
                style={{ color: '#FFFFFF' }}
                title="Anterior ANTES (←)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {beforeCurrentIndex < displayBeforeImages.length - 1 && (
              <button
                onClick={nextBeforeImage}
                className="p-3 rounded-full bg-black/50 hover:bg-black/70 transition-all"
                style={{ color: '#FFFFFF' }}
                title="Próximo ANTES (→)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Controles para Imagem DEPOIS (lado direito) */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {afterCurrentIndex > 0 && (
              <button
                onClick={prevAfterImage}
                className="p-3 rounded-full bg-black/50 hover:bg-black/70 transition-all"
                style={{ color: '#FFFFFF' }}
                title="Anterior DEPOIS (Shift + ←)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {afterCurrentIndex < displayAfterImages.length - 1 && (
              <button
                onClick={nextAfterImage}
                className="p-3 rounded-full bg-black/50 hover:bg-black/70 transition-all"
                style={{ color: '#FFFFFF' }}
                title="Próximo DEPOIS (Shift + →)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Imagens em Tela Cheia */}
          <div className="w-full h-full flex items-center justify-center gap-4 p-4">
            {/* Imagem Antes */}
            <div className="flex-1 h-full flex items-center justify-center relative">
              <SafeBase64Image
                src={displayBeforeImages[beforeCurrentIndex]}
                alt={`Antes ${beforeCurrentIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
              <div 
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: '#FFFFFF' }}
              >
                <span className="text-sm font-medium">ANTES ({beforeCurrentIndex + 1}/{displayBeforeImages.length})</span>
              </div>
            </div>

            {/* Separador */}
            <div className="w-px h-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Imagem Depois */}
            <div className="flex-1 h-full flex items-center justify-center relative">
              <ZoomableImage
                src={displayAfterImages[afterCurrentIndex]}
                alt={`Depois ${afterCurrentIndex + 1}`}
                className="w-full h-full"
                style={{ maxWidth: '100%', maxHeight: '100%' }}
              />
              <div 
                className="absolute bottom-4 right-1/2 transform translate-x-1/2 px-4 py-2 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: '#FFFFFF' }}
              >
                <span className="text-sm font-medium">DEPOIS ({afterCurrentIndex + 1}/{displayAfterImages.length})</span>
              </div>
            </div>
          </div>

          {/* Indicador de Teclas (canto inferior esquerdo) */}
          <div 
            className="absolute bottom-4 left-4 px-4 py-2 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
            style={{ color: '#FFFFFF' }}
          >
            <div>← → ANTES | Shift+← → DEPOIS | ESC Sair | F Fullscreen</div>
          </div>
        </div>
      </div>
    );
  }

  const shouldHideChrome = isLandscape || isPresentationMode;

  const mainClassName = shouldHideChrome
    ? 'flex-1 w-full px-0 py-0 flex flex-col overflow-y-auto'
    : 'flex-1 container mx-auto px-2 sm:px-3 py-0 sm:py-8 max-w-6xl flex flex-col overflow-y-auto';

  return (
    <div className={`fixed inset-0 flex flex-col ${isLandscape ? 'overflow-y-auto' : 'overflow-hidden'}`} style={{ backgroundColor: '#1A2B32' }}>
      {!shouldHideChrome && <NavigationHeader />}

      {/* Main Content */}
      <main
        className={mainClassName}
        style={{ marginTop: shouldHideChrome ? '0px' : '36px' }}
      >
        {/* Botão Voltar - Escondido no mobile portrait (já está no menu) */}
        {!isLandscape && (
          <div className="mb-2 sm:mb-6 hidden sm:block">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 border"
              style={{ 
                backgroundColor: 'rgba(232, 220, 192, 0.05)', 
                color: '#E8DCC0', 
                borderColor: 'rgba(232, 220, 192, 0.1)' 
              }}
              title="Voltar para página anterior"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
          </div>
        )}
        {isLandscape && (
          <div className="mb-2 sm:mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90 border"
              style={{ 
                backgroundColor: 'rgba(232, 220, 192, 0.05)', 
                color: '#E8DCC0', 
                borderColor: 'rgba(232, 220, 192, 0.1)' 
              }}
              title="Voltar"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </button>
          </div>
        )}

        {/* Informações do Projeto - Escondido no mobile */}
        {!isLandscape && (
          <div 
            className="hidden sm:block rounded-lg p-1 sm:p-6 mb-1 sm:mb-6 border" 
            style={{ 
              backgroundColor: 'rgba(232, 220, 192, 0.05)', 
              borderColor: 'rgba(232, 220, 192, 0.1)' 
            }}
          >
            <div className="flex justify-between items-start mb-0.5">
              <div>
                <h1 
                  className="text-sm sm:text-2xl font-light mb-0.5" 
                  style={{ color: '#E8DCC0' }}
                >
                  {project.name}
                </h1>
                <p 
                  className="text-[10px] sm:text-base" 
                  style={{ color: '#E8DCC0', opacity: 0.8 }}
                >
                  Data: {new Date(project.date).toLocaleDateString('pt-BR')}
                </p>
                {!isEditing && project.notes && (
                  <div 
                    className="mt-3 p-3 rounded-lg border"
                    style={{ 
                      backgroundColor: 'rgba(232, 220, 192, 0.05)', 
                      borderColor: 'rgba(232, 220, 192, 0.1)' 
                    }}
                  >
                    <p 
                      className="text-xs font-medium mb-1" 
                      style={{ color: '#E8DCC0', opacity: 0.9 }}
                    >
                      Notas / Observações:
                    </p>
                    <p 
                      className="text-xs sm:text-sm whitespace-pre-wrap" 
                      style={{ color: '#E8DCC0', opacity: 0.8 }}
                    >
                      {project.notes}
                    </p>
                  </div>
                )}
              </div>
              {!isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {displayBeforeImages.length > 0 && displayAfterImages.length > 0 && (
                    <>
                      <button
                        onClick={handleExportImage}
                        disabled={exporting}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 flex items-center gap-2 border disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ 
                          backgroundColor: 'rgba(232, 220, 192, 0.05)', 
                          color: '#E8DCC0', 
                          borderColor: 'rgba(232, 220, 192, 0.1)' 
                        }}
                        title="Exportar comparação atual como imagem"
                      >
                        <ImageIcon className="w-4 h-4" />
                        {exporting ? 'Exportando...' : 'Exportar'}
                      </button>
                      <button
                        onClick={handleEnterPresentationMode}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 flex items-center gap-2 border"
                        style={{ 
                          backgroundColor: 'rgba(232, 220, 192, 0.05)', 
                          color: '#E8DCC0', 
                          borderColor: 'rgba(232, 220, 192, 0.1)' 
                        }}
                        title="Modo Apresentação (F11 ou F para fullscreen)"
                      >
                        <Maximize2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Apresentação</span>
                      </button>
                      <button
                        onClick={handleToggleSliderMode}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 flex items-center gap-2 border ${
                          isSliderMode ? 'ring-2' : ''
                        }`}
                        style={{ 
                          backgroundColor: isSliderMode 
                            ? 'rgba(0, 168, 143, 0.2)' 
                            : 'rgba(232, 220, 192, 0.05)', 
                          color: '#E8DCC0', 
                          borderColor: isSliderMode 
                            ? '#00A88F' 
                            : 'rgba(232, 220, 192, 0.1)',
                          ...(isSliderMode && { boxShadow: '0 0 0 2px #00A88F' })
                        }}
                        title="Modo Comparação com Slider"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span className="hidden sm:inline">Slider</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleOpenNotes}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 flex items-center gap-2 border"
                    style={{ 
                      backgroundColor: 'rgba(232, 220, 192, 0.05)', 
                      color: '#E8DCC0', 
                      borderColor: 'rgba(232, 220, 192, 0.1)' 
                    }}
                    title="Ver/Editar anotações do projeto"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Notas</span>
                    {project.notes && (
                      <span 
                        className="ml-1 px-1.5 py-0.5 rounded-full text-xs"
                        style={{ 
                          backgroundColor: '#00A88F', 
                          color: '#FFFFFF' 
                        }}
                      >
                        •
                      </span>
                    )}
                  </button>
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 flex items-center gap-2 border"
                  style={{ 
                    backgroundColor: 'rgba(232, 220, 192, 0.05)', 
                    color: '#E8DCC0', 
                    borderColor: 'rgba(232, 220, 192, 0.1)' 
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 flex items-center gap-2 border disabled:opacity-50"
                    style={{ 
                      backgroundColor: 'rgba(232, 220, 192, 0.05)', 
                      color: '#E8DCC0', 
                      borderColor: 'rgba(232, 220, 192, 0.1)' 
                    }}
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving || displayBeforeImages.length === 0 || displayAfterImages.length === 0}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{ backgroundColor: '#00A88F', color: '#FFFFFF' }}
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modo de Edição - Controles de Upload */}
        {isEditing && (
          <div 
            className="rounded-lg p-4 sm:p-6 mb-6 border" 
            style={{ 
              backgroundColor: 'rgba(232, 220, 192, 0.05)', 
              borderColor: 'rgba(232, 220, 192, 0.1)' 
            }}
          >
            <h2 
              className="text-lg sm:text-xl font-light mb-4" 
              style={{ color: '#E8DCC0' }}
            >
              Editar Fotos
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Upload Fotos Antes */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#E8DCC0' }}>
                  Adicionar Fotos Antes
                </label>
                <input
                  ref={beforeInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAddBeforeFiles}
                  className="hidden"
                  id="before-upload"
                />
                <label
                  htmlFor="before-upload"
                  className="block w-full p-4 rounded-lg border-2 border-dashed cursor-pointer hover:bg-white/5 transition-colors text-center"
                  style={{ 
                    borderColor: 'rgba(232, 220, 192, 0.1)',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}
                >
                  <Plus className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm">Clique para adicionar fotos</span>
                </label>
                {displayBeforeImages.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {displayBeforeImages.length} foto(s) antes
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {displayBeforeImages.map((img, index) => (
                        <div
                          key={index}
                          draggable={isEditing}
                          onDragStart={() => handleBeforeDragStart(index)}
                          onDragOver={(e) => handleBeforeDragOver(e, index)}
                          onDragEnd={handleBeforeDragEnd}
                          className={`relative group transition-all ${
                            draggedBeforeIndex === index ? 'opacity-50 scale-95' : 'hover:scale-105'
                          }`}
                          style={{
                            cursor: draggedBeforeIndex === index ? 'grabbing' : (isEditing ? 'grab' : 'default')
                          }}
                        >
                          <SafeBase64Image
                            src={img}
                            alt={`Antes ${index + 1}`}
                            className="w-16 h-16 object-cover rounded-lg pointer-events-none"
                          />
                          {isEditing && (
                            <div 
                              className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <span className="text-xs text-white font-medium">Arrastar</span>
                            </div>
                          )}
                          <button
                            onClick={() => handleRemoveBeforeImage(index)}
                            className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            style={{ backgroundColor: '#ef4444' }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <div 
                            className="absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ 
                              backgroundColor: '#00A88F', 
                              color: '#FFFFFF' 
                            }}
                          >
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Fotos Depois */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#E8DCC0' }}>
                  Adicionar Fotos Depois
                </label>
                <input
                  ref={afterInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAddAfterFiles}
                  className="hidden"
                  id="after-upload"
                />
                <label
                  htmlFor="after-upload"
                  className="block w-full p-4 rounded-lg border-2 border-dashed cursor-pointer hover:bg-white/5 transition-colors text-center"
                  style={{ 
                    borderColor: 'rgba(232, 220, 192, 0.1)',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}
                >
                  <Plus className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm">Clique para adicionar fotos</span>
                </label>
                {displayAfterImages.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {displayAfterImages.length} foto(s) depois
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {displayAfterImages.map((img, index) => (
                        <div
                          key={index}
                          draggable={isEditing}
                          onDragStart={() => handleAfterDragStart(index)}
                          onDragOver={(e) => handleAfterDragOver(e, index)}
                          onDragEnd={handleAfterDragEnd}
                          className={`relative group transition-all ${
                            draggedAfterIndex === index ? 'opacity-50 scale-95' : 'hover:scale-105'
                          }`}
                          style={{
                            cursor: draggedAfterIndex === index ? 'grabbing' : (isEditing ? 'grab' : 'default')
                          }}
                        >
                          <SafeBase64Image
                            src={img}
                            alt={`Depois ${index + 1}`}
                            className="w-16 h-16 object-cover rounded-lg pointer-events-none"
                          />
                          {isEditing && (
                            <div 
                              className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <span className="text-xs text-white font-medium">Arrastar</span>
                            </div>
                          )}
                          <button
                            onClick={() => handleRemoveAfterImage(index)}
                            className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            style={{ backgroundColor: '#ef4444' }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <div 
                            className="absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ 
                              backgroundColor: '#00A88F', 
                              color: '#FFFFFF' 
                            }}
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

            {/* Campo de Notas/Observações */}
            <div className="mt-4">
              <label 
                htmlFor="edit-notes" 
                className="block text-sm font-medium mb-2"
                style={{ color: '#E8DCC0' }}
              >
                Notas / Observações <span className="text-xs opacity-70">(opcional)</span>
              </label>
              <textarea
                id="edit-notes"
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
                placeholder="Adicione observações sobre o tratamento, procedimento, resultados, etc..."
                rows={4}
                className="w-full px-4 py-2 rounded-lg text-sm bg-transparent border border-gray-600 text-white placeholder:text-gray-500 focus:border-[#00A88F] resize-y"
                style={{ 
                  minHeight: '100px',
                  borderColor: 'rgba(232, 220, 192, 0.1)'
                }}
              />
              <p className="text-xs mt-1" style={{ color: '#E8DCC0', opacity: 0.7 }}>
                {editingNotes.length} caracteres
              </p>
            </div>
          </div>
        )}

        {/* Visualização Antes e Depois */}
        {displayBeforeImages.length > 0 && displayAfterImages.length > 0 && (
          <div 
            className={`flex-1 flex flex-col ${isLandscape ? 'overflow-y-auto' : 'overflow-hidden'} ${isLandscape ? '' : 'rounded-lg border'}`} 
            style={{ 
              backgroundColor: isLandscape ? 'transparent' : 'rgba(232, 220, 192, 0.05)', 
              borderColor: isLandscape ? 'transparent' : 'rgba(232, 220, 192, 0.1)',
              padding: isLandscape ? '0px' : '12px',
              marginBottom: isLandscape ? 0 : '1.5rem',
              minHeight: isLandscape ? 'auto' : '600px'
            }}
          >
            <div className="flex justify-between items-center mb-2">
            <h2 
                className="hidden lg:block text-sm sm:text-xl font-semibold text-center flex-1" 
              style={{ color: '#FFFFFF', opacity: 0.9 }}
            >
              Visualização Antes e Depois
            </h2>
              {/* Botão de Notas para Mobile (quando header está escondido) */}
              {!isEditing && isLandscape && (
                <button
                  onClick={handleOpenNotes}
                  className="p-2 rounded-lg transition-all hover:opacity-90 border lg:hidden"
                  style={{ 
                    backgroundColor: 'rgba(232, 220, 192, 0.05)', 
                    color: '#E8DCC0', 
                    borderColor: 'rgba(232, 220, 192, 0.1)' 
                  }}
                  title="Ver/Editar anotações"
                >
                  <FileText className="w-5 h-5" />
                  {project.notes && (
                    <span 
                      className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                      style={{ backgroundColor: '#00A88F' }}
                    />
                  )}
                </button>
              )}
            </div>
            
            {/* Modo Slider - Comparação Side-by-Side */}
            {isSliderMode && displayBeforeImages.length > 0 && displayAfterImages.length > 0 ? (
              <div className="relative w-full h-[500px] sm:h-[600px] lg:h-[700px] rounded-lg overflow-hidden" style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)' }}>
                <ComparisonSlider
                  beforeImage={displayBeforeImages[beforeCurrentIndex]}
                  afterImage={displayAfterImages[afterCurrentIndex]}
                  beforeLabel="ANTES"
                  afterLabel="DEPOIS"
                  className="w-full h-full"
                />
                {/* Navegação de imagens no modo slider */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col sm:flex-row gap-2 sm:gap-4 items-center z-20">
                  {/* Navegação ANTES */}
                  {displayBeforeImages.length > 1 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
                      <button
                        onClick={prevBeforeImage}
                        className="p-1 rounded hover:bg-white/20 transition-colors"
                        style={{ color: '#E8DCC0' }}
                        aria-label="Imagem anterior (Antes)"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs px-2" style={{ color: '#E8DCC0' }}>
                        Antes: {beforeCurrentIndex + 1}/{displayBeforeImages.length}
                      </span>
                      <button
                        onClick={nextBeforeImage}
                        className="p-1 rounded hover:bg-white/20 transition-colors"
                        style={{ color: '#E8DCC0' }}
                        aria-label="Próxima imagem (Antes)"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {/* Navegação DEPOIS */}
                  {displayAfterImages.length > 1 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
                      <button
                        onClick={prevAfterImage}
                        className="p-1 rounded hover:bg-white/20 transition-colors"
                        style={{ color: '#E8DCC0' }}
                        aria-label="Imagem anterior (Depois)"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs px-2" style={{ color: '#E8DCC0' }}>
                        Depois: {afterCurrentIndex + 1}/{displayAfterImages.length}
                      </span>
                      <button
                        onClick={nextAfterImage}
                        className="p-1 rounded hover:bg-white/20 transition-colors"
                        style={{ color: '#E8DCC0' }}
                        aria-label="Próxima imagem (Depois)"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
            {/* Desktop grande: Lado a lado */}
            <div className="hidden lg:grid lg:grid-cols-2 gap-4 lg:gap-6" style={{ minHeight: '600px' }}>
              {/* Carrossel Antes */}
              <div className="relative flex flex-col">
                <div className="text-center mb-3 flex-shrink-0">
                  <span 
                    className="text-sm font-medium" 
                    style={{ color: '#E8DCC0' }}
                  >
                    ANTES
                  </span>
                </div>
                <div className="relative rounded-lg overflow-hidden flex-1 flex items-center justify-center min-h-0" style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)' }}>
                  <ZoomableImage
                    src={displayBeforeImages[beforeCurrentIndex]}
                    alt={`Antes ${beforeCurrentIndex + 1}`}
                    className="w-full h-full max-w-full max-h-full"
                    style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)', objectFit: 'contain' }}
                  />
                  {displayBeforeImages.length > 1 && (
                    <>
                      <button
                        onClick={prevBeforeImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-white/20 transition-colors"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#E8DCC0' }}
                        aria-label="Imagem anterior"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextBeforeImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-white/20 transition-colors"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#E8DCC0' }}
                        aria-label="Próxima imagem"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                        <span 
                          className="text-xs px-2 py-1 rounded"
                          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#E8DCC0' }}
                        >
                          {beforeCurrentIndex + 1} / {displayBeforeImages.length}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Carrossel Depois */}
              <div className="relative flex flex-col">
                <div className="text-center mb-3 flex-shrink-0">
                  <span 
                    className="text-sm font-medium" 
                    style={{ color: '#E8DCC0' }}
                  >
                    DEPOIS
                  </span>
                </div>
                <div className="relative rounded-lg overflow-hidden flex-1 flex items-center justify-center min-h-0" style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)' }}>
                  <ZoomableImage
                    src={displayAfterImages[afterCurrentIndex]}
                    alt={`Depois ${afterCurrentIndex + 1}`}
                    className="w-full h-full max-w-full max-h-full"
                    style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)', objectFit: 'contain' }}
                  />
                  {displayAfterImages.length > 1 && (
                    <>
                      <button
                        onClick={prevAfterImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-white/20 transition-colors"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#E8DCC0' }}
                        aria-label="Imagem anterior"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextAfterImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-white/20 transition-colors"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#E8DCC0' }}
                        aria-label="Próxima imagem"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                        <span 
                          className="text-xs px-2 py-1 rounded"
                          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#E8DCC0' }}
                        >
                          {afterCurrentIndex + 1} / {displayAfterImages.length}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Dispositivos móveis e tablets */}
            <div
              className="lg:hidden relative flex-1 flex flex-col min-h-0"
              style={viewerHeight ? { height: `${viewerHeight}px` } : undefined}
            >
              {isLandscape ? (
                <div
                  className="flex flex-1 gap-2 min-h-0 w-full"
                  style={{
                    minHeight: viewerHeight ?? 'auto',
                    height: viewerHeight ? `${viewerHeight}px` : 'auto',
                    maxHeight: viewerHeight ? `${viewerHeight}px` : 'none'
                  }}
                >
                  <div
                    className="flex-1 basis-1/2 flex flex-col min-h-0 min-w-0"
                    style={{ 
                      minHeight: viewerHeight ? `${viewerHeight}px` : 'auto',
                      maxHeight: viewerHeight ? `${viewerHeight}px` : 'none'
                    }}
                  >
                    <div className="text-center py-1 flex-shrink-0">
                      <span 
                        className="text-[10px] sm:text-xs font-medium tracking-wide" 
                        style={{ color: '#E8DCC0' }}
                      >
                        ANTES
                      </span>
                    </div>
                    <div 
                      className="flex-1 flex items-center justify-center rounded-lg overflow-hidden min-h-0"
                      style={{ 
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        minHeight: 0,
                        maxHeight: viewerHeight ? `${(viewerHeight ?? 0) - 60}px` : 'none'
                      }}
                    >
                      <ZoomableImage
                        src={displayBeforeImages[beforeCurrentIndex]}
                        alt={`Antes ${beforeCurrentIndex + 1}`}
                        className="w-full h-full"
                        style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                      />
                    </div>
                    {displayBeforeImages.length > 1 && (
                      <div className="flex items-center justify-center gap-3 py-2">
                        <button
                          onClick={prevBeforeImage}
                          className="flex items-center justify-center w-8 h-8 rounded-full border border-white/20 hover:bg-white/10 transition-colors"
                          style={{ color: '#E8DCC0' }}
                          aria-label="Imagem anterior antes"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                          style={{ color: '#E8DCC0', backgroundColor: 'rgba(0,0,0,0.45)' }}>
                          {beforeCurrentIndex + 1}/{displayBeforeImages.length}
                        </span>
                        <button
                          onClick={nextBeforeImage}
                          className="flex items-center justify-center w-8 h-8 rounded-full border border-white/20 hover:bg-white/10 transition-colors"
                          style={{ color: '#E8DCC0' }}
                          aria-label="Próxima imagem antes"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div
                    className="flex-1 basis-1/2 flex flex-col min-h-0 min-w-0"
                    style={{ 
                      minHeight: viewerHeight ? `${viewerHeight}px` : 'auto',
                      maxHeight: viewerHeight ? `${viewerHeight}px` : 'none'
                    }}
                  >
                    <div className="text-center py-1 flex-shrink-0">
                      <span 
                        className="text-[10px] sm:text-xs font-medium tracking-wide" 
                        style={{ color: '#E8DCC0' }}
                      >
                        DEPOIS
                      </span>
                    </div>
                    <div 
                      className="flex-1 flex items-center justify-center rounded-lg overflow-hidden min-h-0"
                      style={{ 
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        minHeight: 0,
                        maxHeight: viewerHeight ? `${(viewerHeight ?? 0) - 60}px` : 'none'
                      }}
                    >
                      <ZoomableImage
                        src={displayAfterImages[afterCurrentIndex]}
                        alt={`Depois ${afterCurrentIndex + 1}`}
                        className="w-full h-full"
                        style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                      />
                    </div>
                    {displayAfterImages.length > 1 && (
                      <div className="flex items-center justify-center gap-3 py-2">
                        <button
                          onClick={prevAfterImage}
                          className="flex items-center justify-center w-8 h-8 rounded-full border border-white/20 hover:bg-white/10 transition-colors"
                          style={{ color: '#E8DCC0' }}
                          aria-label="Imagem anterior depois"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                          style={{ color: '#E8DCC0', backgroundColor: 'rgba(0,0,0,0.45)' }}>
                          {afterCurrentIndex + 1}/{displayAfterImages.length}
                        </span>
                        <button
                          onClick={nextAfterImage}
                          className="flex items-center justify-center w-8 h-8 rounded-full border border-white/20 hover:bg-white/10 transition-colors"
                          style={{ color: '#E8DCC0' }}
                          aria-label="Próxima imagem depois"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col flex-1 min-h-0 gap-1" style={{ height: '100%' }}>
                  <div
                    className="relative flex-1 basis-1/2 flex flex-col min-h-0"
                    style={stackedSectionHeight ? { height: `${stackedSectionHeight}px` } : undefined}
                  >
                    <div className="text-center py-0.5 flex-shrink-0">
                      <span 
                        className="text-[9px] sm:text-xs font-medium" 
                        style={{ color: '#E8DCC0' }}
                      >
                        ANTES
                      </span>
                    </div>
                    <div className="relative rounded overflow-hidden flex-1 min-h-0">
                      <ZoomableImage
                        src={displayBeforeImages[beforeCurrentIndex]}
                        alt={`Antes ${beforeCurrentIndex + 1}`}
                        className="w-full h-full"
                        style={{ width: '100%', height: '100%' }}
                      />
                      {displayBeforeImages.length > 1 && (
                        <>
                          <button
                            onClick={prevBeforeImage}
                            className="absolute left-1 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', color: '#E8DCC0' }}
                            aria-label="Imagem anterior"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={nextBeforeImage}
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', color: '#E8DCC0' }}
                            aria-label="Próxima imagem"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                            <span 
                              className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', color: '#E8DCC0' }}
                            >
                              {beforeCurrentIndex + 1}/{displayBeforeImages.length}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div
                    className="relative flex-1 basis-1/2 flex flex-col min-h-0"
                    style={stackedSectionHeight ? { height: `${stackedSectionHeight}px` } : undefined}
                  >
                    <div className="text-center py-0.5 flex-shrink-0">
                      <span 
                        className="text-[9px] sm:text-xs font-medium" 
                        style={{ color: '#E8DCC0' }}
                      >
                        DEPOIS
                      </span>
                    </div>
                    <div className="relative rounded overflow-hidden flex-1 min-h-0">
                      <ZoomableImage
                        src={displayAfterImages[afterCurrentIndex]}
                        alt={`Depois ${afterCurrentIndex + 1}`}
                        className="w-full h-full"
                        style={{ width: '100%', height: '100%' }}
                      />
                      {displayAfterImages.length > 1 && (
                        <>
                          <button
                            onClick={prevAfterImage}
                            className="absolute left-1 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', color: '#E8DCC0' }}
                            aria-label="Imagem anterior"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={nextAfterImage}
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', color: '#E8DCC0' }}
                            aria-label="Próxima imagem"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                            <span 
                              className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', color: '#E8DCC0' }}
                            >
                              {afterCurrentIndex + 1}/{displayAfterImages.length}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Botões Flutuantes - Mobile Portrait: Menu Compacto */}
        {!isEditing && !isLandscape && (
          <div className="fixed bottom-4 right-4 z-50">
            {/* Menu Principal (botão hambúrguer) */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2.5 rounded-full shadow-lg transition-all active:scale-95"
              style={{ 
                backgroundColor: 'rgba(232, 220, 192, 0.15)', 
                color: '#E8DCC0',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(10px)'
              }}
              title="Menu"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Menu Expandido */}
            {showMobileMenu && (
              <>
                {/* Overlay para fechar ao clicar fora */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowMobileMenu(false)}
                />
                <div className="absolute bottom-14 right-0 flex flex-col gap-2 mb-2 z-50">
                  {/* Botão Voltar */}
                  <button
                    onClick={() => {
                      router.back();
                      setShowMobileMenu(false);
                    }}
                    className="px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 flex items-center gap-2 shadow-lg"
                    style={{ 
                      backgroundColor: 'rgba(232, 220, 192, 0.15)', 
                      color: '#E8DCC0',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                      backdropFilter: 'blur(10px)'
                    }}
                    title="Voltar"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>
              {displayBeforeImages.length > 0 && displayAfterImages.length > 0 && (
                <>
                  <button
                    onClick={() => {
                      handleExportImage();
                      setShowMobileMenu(false);
                    }}
                    disabled={exporting}
                    className="px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 flex items-center gap-2 shadow-lg disabled:opacity-50"
                    style={{ 
                      backgroundColor: 'rgba(232, 220, 192, 0.15)', 
                      color: '#E8DCC0',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                      backdropFilter: 'blur(10px)'
                    }}
                    title="Exportar"
                  >
                    {exporting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                    <span>Exportar</span>
                  </button>
                  <button
                    onClick={() => {
                      handleEnterPresentationMode();
                      setShowMobileMenu(false);
                    }}
                    className="px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 flex items-center gap-2 shadow-lg"
                    style={{ 
                      backgroundColor: 'rgba(232, 220, 192, 0.15)', 
                      color: '#E8DCC0',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                      backdropFilter: 'blur(10px)'
                    }}
                    title="Apresentação"
                  >
                    <Maximize2 className="w-4 h-4" />
                    <span>Apresentação</span>
                  </button>
                  <button
                    onClick={() => {
                      handleToggleSliderMode();
                      setShowMobileMenu(false);
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 flex items-center gap-2 shadow-lg ${
                      isSliderMode ? 'ring-2 ring-[#00A88F]' : ''
                    }`}
                    style={{ 
                      backgroundColor: isSliderMode 
                        ? 'rgba(0, 168, 143, 0.25)' 
                        : 'rgba(232, 220, 192, 0.15)', 
                      color: '#E8DCC0',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                      backdropFilter: 'blur(10px)'
                    }}
                    title="Slider"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Slider</span>
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  handleOpenNotes();
                  setShowMobileMenu(false);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 flex items-center gap-2 shadow-lg ${
                  project.notes ? 'ring-2 ring-[#00A88F]' : ''
                }`}
                style={{ 
                  backgroundColor: 'rgba(232, 220, 192, 0.15)', 
                  color: '#E8DCC0',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(10px)'
                }}
                title="Notas"
              >
                <FileText className="w-4 h-4" />
                <span>Notas</span>
              </button>
              <button
                onClick={() => {
                  handleEdit();
                  setShowMobileMenu(false);
                }}
                className="px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 flex items-center gap-2 shadow-lg"
                style={{ 
                  backgroundColor: 'rgba(232, 220, 192, 0.15)', 
                  color: '#E8DCC0',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(10px)'
                }}
                title="Editar"
              >
                <Edit2 className="w-4 h-4" />
                <span>Editar</span>
              </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Botões Flutuantes - Landscape: Mantém estilo original mas menor */}
        {!isEditing && isLandscape && (
          <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {/* Botão Voltar */}
            <button
              onClick={() => router.back()}
              className="p-2.5 rounded-full shadow-lg transition-all active:scale-95"
              style={{ 
                backgroundColor: 'rgba(232, 220, 192, 0.15)', 
                color: '#E8DCC0',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(10px)'
              }}
              title="Voltar"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            {displayBeforeImages.length > 0 && displayAfterImages.length > 0 && (
              <>
                <button
                  onClick={handleExportImage}
                  disabled={exporting}
                  className="p-2.5 rounded-full shadow-lg transition-all active:scale-95 disabled:opacity-50"
                  style={{ 
                    backgroundColor: 'rgba(232, 220, 192, 0.15)', 
                    color: '#E8DCC0',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(10px)'
                  }}
                  title="Exportar"
                >
                  {exporting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={handleEnterPresentationMode}
                  className="p-2.5 rounded-full shadow-lg transition-all active:scale-95"
                  style={{ 
                    backgroundColor: 'rgba(232, 220, 192, 0.15)', 
                    color: '#E8DCC0',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(10px)'
                  }}
                  title="Apresentação"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleToggleSliderMode}
                  className={`p-2.5 rounded-full shadow-lg transition-all active:scale-95 ${
                    isSliderMode ? 'ring-2 ring-[#00A88F]' : ''
                  }`}
                  style={{ 
                    backgroundColor: isSliderMode 
                      ? 'rgba(0, 168, 143, 0.25)' 
                      : 'rgba(232, 220, 192, 0.15)', 
                    color: '#E8DCC0',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(10px)'
                  }}
                  title="Slider"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={handleOpenNotes}
              className={`p-2.5 rounded-full shadow-lg transition-all active:scale-95 ${
                project.notes ? 'ring-2 ring-[#00A88F]' : ''
              }`}
              style={{ 
                backgroundColor: 'rgba(232, 220, 192, 0.15)', 
                color: '#E8DCC0',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(10px)'
              }}
              title="Notas"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={handleEdit}
              className="p-2.5 rounded-full shadow-lg transition-all active:scale-95"
              style={{ 
                backgroundColor: 'rgba(232, 220, 192, 0.15)', 
                color: '#E8DCC0',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(10px)'
              }}
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Modal de Notas */}
        {showNotesModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
            onClick={handleCloseNotes}
          >
            <div 
              className="rounded-lg border max-w-2xl w-full max-h-[80vh] flex flex-col"
              style={{ 
                backgroundColor: '#1B3C45', 
                borderColor: 'rgba(232, 220, 192, 0.1)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header do Modal */}
              <div 
                className="flex justify-between items-center p-4 border-b"
                style={{ borderColor: 'rgba(232, 220, 192, 0.1)' }}
              >
                <h2 
                  className="text-lg sm:text-xl font-medium"
                  style={{ color: '#E8DCC0' }}
                >
                  Anotações do Projeto
                </h2>
                <button
                  onClick={handleCloseNotes}
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                  style={{ color: '#E8DCC0' }}
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Conteúdo do Modal */}
              <div className="flex-1 overflow-y-auto p-4">
                <textarea
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  placeholder="Digite suas anotações sobre este projeto...&#10;&#10;Exemplo:&#10;- Detalhes do procedimento&#10;- Observações importantes&#10;- Resultados esperados&#10;- Próximos passos"
                  rows={12}
                  className="w-full px-4 py-3 rounded-lg text-sm bg-transparent border resize-y"
                  style={{ 
                    minHeight: '200px',
                    borderColor: 'rgba(232, 220, 192, 0.1)',
                    color: '#E8DCC0'
                  }}
                />
                <p className="text-xs mt-2" style={{ color: '#E8DCC0', opacity: 0.7 }}>
                  {tempNotes.length} caracteres
                </p>
              </div>

              {/* Footer do Modal */}
              <div 
                className="flex justify-end gap-2 p-4 border-t"
                style={{ borderColor: 'rgba(232, 220, 192, 0.1)' }}
              >
                <button
                  onClick={handleCloseNotes}
                  disabled={savingNotes}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 border disabled:opacity-50"
                  style={{ 
                    backgroundColor: 'rgba(232, 220, 192, 0.05)', 
                    color: '#E8DCC0', 
                    borderColor: 'rgba(232, 220, 192, 0.1)' 
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  style={{ backgroundColor: '#00A88F', color: '#FFFFFF' }}
                >
                  {savingNotes ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      {!shouldHideChrome && <Footer className="hidden sm:block" />}
    </div>
  );
}

