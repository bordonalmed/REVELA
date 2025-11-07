'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { getProjectFromIndexedDB, updateProject, type Project } from '@/lib/storage';
import { NavigationHeader } from '@/components/navigation-header';
import { Footer } from '@/components/footer';

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
  const beforeInputRef = React.useRef<HTMLInputElement>(null);
  const afterInputRef = React.useRef<HTMLInputElement>(null);
  const beforeTouchRef = React.useRef<HTMLDivElement>(null);
  const afterTouchRef = React.useRef<HTMLDivElement>(null);

  // Detectar orientação
  useEffect(() => {
    const checkOrientation = () => {
      const landscape = window.innerWidth > window.innerHeight;
      console.log('Orientação:', landscape ? 'HORIZONTAL' : 'VERTICAL', `${window.innerWidth}x${window.innerHeight}`);
      setIsLandscape(landscape);
    };
    
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', () => {
      setTimeout(checkOrientation, 100); // Pequeno delay para garantir
    });
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Touch/Swipe para navegação (apenas mobile)
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent, isBeforeCarousel: boolean) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe(isBeforeCarousel);
    };

    const handleSwipe = (isBeforeCarousel: boolean) => {
      const swipeThreshold = 50; // Mínimo de 50px para ser considerado swipe
      
      if (touchStartX - touchEndX > swipeThreshold) {
        // Swipe left (próxima imagem)
        if (isBeforeCarousel) {
          nextBeforeImage();
        } else {
          nextAfterImage();
        }
      }
      
      if (touchEndX - touchStartX > swipeThreshold) {
        // Swipe right (imagem anterior)
        if (isBeforeCarousel) {
          prevBeforeImage();
        } else {
          prevAfterImage();
        }
      }
    };

    const beforeEl = beforeTouchRef.current;
    const afterEl = afterTouchRef.current;

    if (beforeEl) {
      const handleBeforeTouchEnd = (e: TouchEvent) => handleTouchEnd(e, true);
      beforeEl.addEventListener('touchstart', handleTouchStart);
      beforeEl.addEventListener('touchend', handleBeforeTouchEnd);
    }

    if (afterEl) {
      const handleAfterTouchEnd = (e: TouchEvent) => handleTouchEnd(e, false);
      afterEl.addEventListener('touchstart', handleTouchStart);
      afterEl.addEventListener('touchend', handleAfterTouchEnd);
    }

    return () => {
      if (beforeEl) {
        beforeEl.removeEventListener('touchstart', handleTouchStart);
        beforeEl.removeEventListener('touchend', () => {});
      }
      if (afterEl) {
        afterEl.removeEventListener('touchstart', handleTouchStart);
        afterEl.removeEventListener('touchend', () => {});
      }
    };
  }, [displayBeforeImages.length, displayAfterImages.length, beforeCurrentIndex, afterCurrentIndex]);

  useEffect(() => {
    checkUser();
  }, []);

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
  }, [user, projectId]);

  const checkUser = async () => {
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
  };

  const loadProject = async () => {
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
  };

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
    setNewBeforeFiles([...newBeforeFiles, ...files]);
    const compressedUrls = await Promise.all(files.map(file => compressImage(file, 1920, 0.85)));
    setEditingBeforeImages([...editingBeforeImages, ...compressedUrls]);
  };

  const handleAddAfterFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setNewAfterFiles([...newAfterFiles, ...files]);
    const compressedUrls = await Promise.all(files.map(file => compressImage(file, 1920, 0.85)));
    setEditingAfterImages([...editingAfterImages, ...compressedUrls]);
  };

  const handleRemoveBeforeImage = (index: number) => {
    const newImages = editingBeforeImages.filter((_, i) => i !== index);
    setEditingBeforeImages(newImages);
    // Ajustar índice atual se necessário
    if (beforeCurrentIndex >= newImages.length && newImages.length > 0) {
      setBeforeCurrentIndex(newImages.length - 1);
    } else if (newImages.length === 0) {
      setBeforeCurrentIndex(0);
    }
  };

  const handleRemoveAfterImage = (index: number) => {
    const newImages = editingAfterImages.filter((_, i) => i !== index);
    setEditingAfterImages(newImages);
    // Ajustar índice atual se necessário
    if (afterCurrentIndex >= newImages.length && newImages.length > 0) {
      setAfterCurrentIndex(newImages.length - 1);
    } else if (newImages.length === 0) {
      setAfterCurrentIndex(0);
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

  // Usar imagens de edição quando estiver editando
  const displayBeforeImages = isEditing ? editingBeforeImages : (project?.beforeImages || []);
  const displayAfterImages = isEditing ? editingAfterImages : (project?.afterImages || []);

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

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: '#1A2B32' }}>
      <NavigationHeader />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-2 sm:px-3 py-0 sm:py-8 max-w-6xl flex flex-col overflow-hidden" style={{ marginTop: '36px' }}>
        {/* Informações do Projeto - Escondido no mobile */}
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
                          <img
                            src={img}
                            alt={`Antes ${index + 1}`}
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
                          <img
                            src={img}
                            alt={`Depois ${index + 1}`}
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
            className="flex-1 flex flex-col overflow-hidden rounded-lg p-1 sm:p-6 border mb-0 sm:mb-6" 
            style={{ 
              backgroundColor: 'rgba(232, 220, 192, 0.05)', 
              borderColor: 'rgba(232, 220, 192, 0.1)' 
            }}
          >
            <h2 
              className="hidden sm:block text-xs sm:text-xl font-semibold mb-0.5 sm:mb-4 text-center" 
              style={{ color: '#FFFFFF' }}
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
                <div className="relative rounded-lg overflow-hidden" style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)' }}>
                  <img
                    src={displayBeforeImages[beforeCurrentIndex]}
                    alt={`Antes ${beforeCurrentIndex + 1}`}
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
                  <img
                    src={displayAfterImages[afterCurrentIndex]}
                    alt={`Depois ${afterCurrentIndex + 1}`}
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

            {/* Mobile: Vertical (altura > largura) */}
            <div className={`sm:hidden h-full overflow-hidden ${isLandscape ? 'hidden' : 'flex flex-col'}`}>
              {/* Carrossel Antes */}
              <div className="relative flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="text-center py-1 flex-shrink-0">
                  <span 
                    className="text-[9px] font-medium" 
                    style={{ color: '#E8DCC0' }}
                  >
                    ANTES {displayBeforeImages.length > 1 && `${beforeCurrentIndex + 1}/${displayBeforeImages.length}`}
                  </span>
                </div>
                <div 
                  ref={beforeTouchRef}
                  className="relative rounded overflow-hidden flex-1 min-h-0 touch-none"
                >
                  <img
                    src={displayBeforeImages[beforeCurrentIndex]}
                    alt={`Antes ${beforeCurrentIndex + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                  />
                  {/* Setas removidas do mobile - use swipe */}
                  {displayBeforeImages.length > 1 && (
                    <>
                      {/* Setas escondidas no mobile */}
                      <div className="hidden"></div>
                    </>
                  )}
                </div>
              </div>

              {/* Carrossel Depois */}
              <div className="relative flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="text-center py-1 flex-shrink-0">
                  <span 
                    className="text-[9px] font-medium" 
                    style={{ color: '#E8DCC0' }}
                  >
                    DEPOIS {displayAfterImages.length > 1 && `${afterCurrentIndex + 1}/${displayAfterImages.length}`}
                  </span>
                </div>
                <div 
                  ref={afterTouchRef}
                  className="relative rounded overflow-hidden flex-1 min-h-0 touch-none"
                >
                  <img
                    src={displayAfterImages[afterCurrentIndex]}
                    alt={`Depois ${afterCurrentIndex + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                  />
                  {/* Setas removidas do mobile - use swipe */}
                  {displayAfterImages.length > 1 && (
                    <>
                      <div className="hidden"></div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile: Horizontal (largura > altura) */}
            <div 
              className={`h-full overflow-hidden gap-1 sm:!hidden ${isLandscape ? 'flex' : 'hidden'}`}
              style={{ display: isLandscape && window.innerWidth < 1024 ? 'flex' : 'none' }}
            >
              {/* Carrossel Antes */}
              <div className="relative flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="text-center py-0.5 flex-shrink-0">
                  <span 
                    className="text-[8px] font-medium" 
                    style={{ color: '#E8DCC0' }}
                  >
                    ANTES
                  </span>
                </div>
                <div className="relative rounded overflow-hidden flex-1 min-h-0">
                  <img
                    src={displayBeforeImages[beforeCurrentIndex]}
                    alt={`Antes ${beforeCurrentIndex + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                  {displayBeforeImages.length > 1 && (
                    <>
                      <button
                        onClick={prevBeforeImage}
                        className="absolute left-0.5 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#E8DCC0' }}
                        aria-label="Imagem anterior"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <button
                        onClick={nextBeforeImage}
                        className="absolute right-0.5 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#E8DCC0' }}
                        aria-label="Próxima imagem"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2">
                        <span 
                          className="text-[8px] px-1 py-0.5 rounded"
                          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#E8DCC0' }}
                        >
                          {beforeCurrentIndex + 1}/{displayBeforeImages.length}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Carrossel Depois */}
              <div className="relative flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="text-center py-0.5 flex-shrink-0">
                  <span 
                    className="text-[8px] font-medium" 
                    style={{ color: '#E8DCC0' }}
                  >
                    DEPOIS
                  </span>
                </div>
                <div className="relative rounded overflow-hidden flex-1 min-h-0">
                  <img
                    src={displayAfterImages[afterCurrentIndex]}
                    alt={`Depois ${afterCurrentIndex + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                  {displayAfterImages.length > 1 && (
                    <>
                      <button
                        onClick={prevAfterImage}
                        className="absolute left-0.5 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#E8DCC0' }}
                        aria-label="Imagem anterior"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <button
                        onClick={nextAfterImage}
                        className="absolute right-0.5 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#E8DCC0' }}
                        aria-label="Próxima imagem"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2">
                        <span 
                          className="text-[8px] px-1 py-0.5 rounded"
                          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#E8DCC0' }}
                        >
                          {afterCurrentIndex + 1}/{displayAfterImages.length}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer className="hidden sm:block" />
    </div>
  );
}

