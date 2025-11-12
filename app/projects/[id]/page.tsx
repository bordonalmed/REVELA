'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { getProjectFromIndexedDB, updateProject, type Project } from '@/lib/storage';
import { NavigationHeader } from '@/components/navigation-header';
import { Footer } from '@/components/footer';
import Image from 'next/image';

export default function ViewProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [beforeCurrentIndex, setBeforeCurrentIndex] = useState(0);
  const [afterCurrentIndex, setAfterCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editingBeforeImages, setEditingBeforeImages] = useState<string[]>([]);
  const [editingAfterImages, setEditingAfterImages] = useState<string[]>([]);
  const [newBeforeFiles, setNewBeforeFiles] = useState<File[]>([]);
  const [newAfterFiles, setNewAfterFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [viewerHeight, setViewerHeight] = useState<number | null>(null);
  const [stackedSectionHeight, setStackedSectionHeight] = useState<number | null>(null);
  const beforeInputRef = React.useRef<HTMLInputElement>(null);
  const afterInputRef = React.useRef<HTMLInputElement>(null);

  // Detectar orientação
  useEffect(() => {
    const updateLayoutMetrics = () => {
      const landscape = window.innerWidth > window.innerHeight;
      setIsLandscape(landscape);

      const viewportHeight = typeof window !== 'undefined' && window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;

      const header = document.querySelector('header');
      const headerHeight = landscape ? 0 : header ? header.getBoundingClientRect().height : 0;
      const mainMarginTop = landscape ? 0 : 36;
      const extraPadding = landscape ? 0 : 24;
      const availableHeight = viewportHeight - headerHeight - mainMarginTop - extraPadding;
      setViewerHeight(Math.max(availableHeight, 0));

      const labelAllowance = landscape ? 36 : (window.innerWidth < 768 ? 52 : 68);
      const computedStacked = Math.max((availableHeight - labelAllowance) / 2, 160);
      setStackedSectionHeight(computedStacked);
    };

    updateLayoutMetrics();
    window.addEventListener('resize', updateLayoutMetrics);
    window.addEventListener('orientationchange', updateLayoutMetrics);

    return () => {
      window.removeEventListener('resize', updateLayoutMetrics);
      window.removeEventListener('orientationchange', updateLayoutMetrics);
    };
  }, []);

  // Usar imagens de edição quando estiver editando
  const displayBeforeImages = isEditing ? editingBeforeImages : (project?.beforeImages || []);
  const displayAfterImages = isEditing ? editingAfterImages : (project?.afterImages || []);

  const checkUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (!session) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      // Tentar IndexedDB primeiro
      let loadedProject = await getProjectFromIndexedDB(projectId);
      
      // Se não encontrar, tentar localStorage
      if (!loadedProject) {
        const stored = localStorage.getItem('revela_projects');
        if (stored) {
          const projects = JSON.parse(stored);
          loadedProject = projects.find((p: Project) => p.id === projectId) || null;
        }
      }
      
      if (loadedProject) {
        setProject(loadedProject);
        setEditingBeforeImages([...loadedProject.beforeImages]);
        setEditingAfterImages([...loadedProject.afterImages]);
      } else {
        alert('Projeto não encontrado');
        router.push('/projects');
      }
    } catch (error) {
      console.error('Erro ao carregar projeto:', error);
      alert('Erro ao carregar projeto');
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        router.push('/login');
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user && projectId) {
      loadProject();
    }
  }, [user, projectId, loadProject]);

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
      setNewBeforeFiles([]);
      setNewAfterFiles([]);
    }
  };

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

  const shouldHideChrome = isLandscape;

  const mainClassName = shouldHideChrome
    ? 'flex-1 w-full px-0 py-0 flex flex-col overflow-hidden'
    : 'flex-1 container mx-auto px-2 sm:px-3 py-0 sm:py-8 max-w-6xl flex flex-col overflow-hidden';

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: '#1A2B32' }}>
      {!shouldHideChrome && <NavigationHeader />}

      {/* Main Content */}
      <main
        className={mainClassName}
        style={{ marginTop: shouldHideChrome ? '0px' : '36px' }}
      >
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
              </div>
              {!isEditing ? (
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
                        <div key={index} className="relative group">
                          <Image
                            src={img}
                            alt={`Antes ${index + 1}`}
                            width={64}
                            height={64}
                            unoptimized
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => handleRemoveBeforeImage(index)}
                            className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ backgroundColor: '#ef4444' }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
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
                        <div key={index} className="relative group">
                          <Image
                            src={img}
                            alt={`Depois ${index + 1}`}
                            width={64}
                            height={64}
                            unoptimized
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => handleRemoveAfterImage(index)}
                            className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ backgroundColor: '#ef4444' }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Visualização Antes e Depois */}
        {displayBeforeImages.length > 0 && displayAfterImages.length > 0 && (
          <div 
            className={`flex-1 flex flex-col overflow-hidden ${isLandscape ? '' : 'rounded-lg border'}`} 
            style={{ 
              backgroundColor: isLandscape ? 'transparent' : 'rgba(232, 220, 192, 0.05)', 
              borderColor: isLandscape ? 'transparent' : 'rgba(232, 220, 192, 0.1)',
              padding: isLandscape ? '0px' : '12px',
              marginBottom: isLandscape ? 0 : '1.5rem'
            }}
          >
            <h2 
              className="hidden lg:block text-sm sm:text-xl font-semibold mb-2 text-center" 
              style={{ color: '#FFFFFF', opacity: 0.9 }}
            >
              Visualização Antes e Depois
            </h2>
            
            {/* Desktop grande: Lado a lado */}
            <div className="hidden lg:grid lg:grid-cols-2 gap-4">
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
                <div className="relative rounded-lg overflow-hidden" style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)' }}>
                  <Image
                    src={displayBeforeImages[beforeCurrentIndex]}
                    alt={`Antes ${beforeCurrentIndex + 1}`}
                    width={1200}
                    height={900}
                    unoptimized
                    className="w-full h-auto max-h-[500px] object-contain"
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
              <div className="relative">
                <div className="text-center mb-2">
                  <span 
                    className="text-sm font-medium" 
                    style={{ color: '#E8DCC0' }}
                  >
                    DEPOIS
                  </span>
                </div>
                <div className="relative rounded-lg overflow-hidden" style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)' }}>
                  <Image
                    src={displayAfterImages[afterCurrentIndex]}
                    alt={`Depois ${afterCurrentIndex + 1}`}
                    width={1200}
                    height={900}
                    unoptimized
                    className="w-full h-auto max-h-[500px] object-contain"
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
                  className="flex flex-1 gap-2 min-h-0"
                  style={{
                    minHeight: viewerHeight ?? 'auto',
                    height: viewerHeight ? `${viewerHeight}px` : 'auto'
                  }}
                >
                  <div
                    className="flex-1 basis-1/2 flex flex-col min-h-0"
                    style={{ minHeight: viewerHeight ?? 'auto', minWidth: 0 }}
                  >
                    <div className="text-center py-1 flex-shrink-0">
                      <span 
                        className="text-[10px] font-medium tracking-wide" 
                        style={{ color: '#E8DCC0' }}
                      >
                        ANTES
                      </span>
                    </div>
                    <div className="flex-1 flex items-center justify-center rounded-lg overflow-hidden"
                      style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                      <Image
                        src={displayBeforeImages[beforeCurrentIndex]}
                        alt={`Antes ${beforeCurrentIndex + 1}`}
                        width={1200}
                        height={900}
                        unoptimized
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
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
                    className="flex-1 basis-1/2 flex flex-col min-h-0"
                    style={{ minHeight: viewerHeight ?? 'auto', minWidth: 0 }}
                  >
                    <div className="text-center py-1 flex-shrink-0">
                      <span 
                        className="text-[10px] font-medium tracking-wide" 
                        style={{ color: '#E8DCC0' }}
                      >
                        DEPOIS
                      </span>
                    </div>
                    <div className="flex-1 flex items-center justify-center rounded-lg overflow-hidden"
                      style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                      <Image
                        src={displayAfterImages[afterCurrentIndex]}
                        alt={`Depois ${afterCurrentIndex + 1}`}
                        width={1200}
                        height={900}
                        unoptimized
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
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
                      <Image
                        src={displayBeforeImages[beforeCurrentIndex]}
                        alt={`Antes ${beforeCurrentIndex + 1}`}
                        width={1200}
                        height={900}
                        unoptimized
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
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
                      <Image
                        src={displayAfterImages[afterCurrentIndex]}
                        alt={`Depois ${afterCurrentIndex + 1}`}
                        width={1200}
                        height={900}
                        unoptimized
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
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
          </div>
        )}
      </main>
      {!shouldHideChrome && <Footer className="hidden sm:block" />}
    </div>
  );
}

