'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Save, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { saveProject } from '@/lib/storage';
import { NavigationHeader } from '@/components/navigation-header';
import { Footer } from '@/components/footer';
import Image from 'next/image';

export default function NewProjectPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState('');
  const [projectDate, setProjectDate] = useState('');
  const [beforeImages, setBeforeImages] = useState<File[]>([]);
  const [afterImages, setAfterImages] = useState<File[]>([]);
  const [beforePreviewUrls, setBeforePreviewUrls] = useState<string[]>([]);
  const [afterPreviewUrls, setAfterPreviewUrls] = useState<string[]>([]);
  const [beforeCurrentIndex, setBeforeCurrentIndex] = useState(0);
  const [afterCurrentIndex, setAfterCurrentIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const checkUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
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

  const handleBeforeFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setBeforeImages(files);
    // Comprimir e converter para data URLs (base64) para preview
    const compressedUrls = await Promise.all(files.map(file => compressImage(file, 1920, 0.85)));
    setBeforePreviewUrls(compressedUrls);
  };

  const handleAfterFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
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
    setBeforeImages([]);
    setAfterImages([]);
    setBeforePreviewUrls([]);
    setAfterPreviewUrls([]);
    setShowPreview(false);
    setBeforeCurrentIndex(0);
    setAfterCurrentIndex(0);
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

      // Re-comprimir com qualidade menor para economizar espaço ao salvar
      const beforeBase64 = await Promise.all(
        beforeImages.map(file => compressImage(file, 1920, 0.75))
      );
      const afterBase64 = await Promise.all(
        afterImages.map(file => compressImage(file, 1920, 0.75))
      );
      
      // Criar projeto
      const project = {
        id: Date.now().toString(),
        name: projectName,
        date: projectDate,
        beforeImages: beforeBase64,
        afterImages: afterBase64,
        createdAt: new Date().toISOString(),
      };

      // Salvar projeto (tenta IndexedDB primeiro, depois localStorage)
      try {
        await saveProject(project);
        document.body.removeChild(processingMessage);
        alert('Projeto salvo com sucesso no seu dispositivo!');
        // NÃO limpar o formulário - o usuário decide quando iniciar novo projeto
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

        {/* Upload de Imagens */}
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
              className="flex flex-col items-center justify-center gap-2 p-4 sm:p-5 rounded-lg border-2 border-dashed cursor-pointer transition-all hover:opacity-80"
              style={{ 
                backgroundColor: 'rgba(232, 220, 192, 0.03)', 
                borderColor: 'rgba(232, 220, 192, 0.1)' 
              }}
            >
              <Camera className="w-6 h-6" style={{ color: '#E8DCC0', opacity: 0.7 }} />
              <span 
                className="text-xs sm:text-sm text-center" 
                style={{ color: '#E8DCC0', opacity: 0.8 }}
              >
                Clique ou arraste imagens
              </span>
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
                  {beforeImages.map((file, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                      style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)' }}
                    >
                      <span style={{ color: '#E8DCC0' }} className="truncate max-w-[100px]">
                        {file.name}
                      </span>
                      <button 
                        onClick={() => removeBeforeImage(index)} 
                        className="hover:opacity-80"
                        style={{ color: '#E8DCC0' }}
                      >
                        ×
                      </button>
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
              className="flex flex-col items-center justify-center gap-2 p-4 sm:p-5 rounded-lg border-2 border-dashed cursor-pointer transition-all hover:opacity-80"
              style={{ 
                backgroundColor: 'rgba(232, 220, 192, 0.03)', 
                borderColor: 'rgba(232, 220, 192, 0.1)' 
              }}
            >
              <Camera className="w-6 h-6" style={{ color: '#E8DCC0', opacity: 0.7 }} />
              <span 
                className="text-xs sm:text-sm text-center" 
                style={{ color: '#E8DCC0', opacity: 0.8 }}
              >
                Clique ou arraste imagens
              </span>
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
                  {afterImages.map((file, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                      style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)' }}
                    >
                      <span style={{ color: '#E8DCC0' }} className="truncate max-w-[100px]">
                        {file.name}
                      </span>
                      <button 
                        onClick={() => removeAfterImage(index)} 
                        className="hover:opacity-80"
                        style={{ color: '#E8DCC0' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6">
          <button
            onClick={() => setShowPreview(!showPreview)}
            disabled={beforePreviewUrls.length === 0 || afterPreviewUrls.length === 0}
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
            disabled={!projectName || !projectDate || beforeImages.length === 0 || afterImages.length === 0}
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
        {showPreview && beforePreviewUrls.length > 0 && afterPreviewUrls.length > 0 && (
          <div 
            className="rounded-lg p-4 sm:p-6 border mb-6" 
              style={{ 
                backgroundColor: 'rgba(232, 220, 192, 0.05)', 
                borderColor: 'rgba(232, 220, 192, 0.1)' 
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
                <div className="relative rounded-lg overflow-hidden" style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)' }}>
                  {beforePreviewUrls.length > 0 && (
                    <>
                      <Image
                        src={beforePreviewUrls[beforeCurrentIndex]}
                        alt={`Antes ${beforeCurrentIndex + 1}`}
                        width={1200}
                        height={900}
                        unoptimized
                        style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'contain' }}
                      />
                      {beforePreviewUrls.length > 1 && (
                        <>
                          <button
                            onClick={prevBeforeImage}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-white/20 transition-colors"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#E8DCC0' }}
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={nextBeforeImage}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-white/20 transition-colors"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#E8DCC0' }}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                            <span 
                              className="text-xs px-2 py-1 rounded"
                              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#E8DCC0' }}
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
                <div className="relative rounded-lg overflow-hidden" style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)' }}>
                  {afterPreviewUrls.length > 0 && (
                    <>
                      <Image
                        src={afterPreviewUrls[afterCurrentIndex]}
                        alt={`Depois ${afterCurrentIndex + 1}`}
                        width={1200}
                        height={900}
                        unoptimized
                        style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'contain' }}
                      />
                      {afterPreviewUrls.length > 1 && (
                        <>
                          <button
                            onClick={prevAfterImage}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-white/20 transition-colors"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#E8DCC0' }}
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={nextAfterImage}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-white/20 transition-colors"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#E8DCC0' }}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                            <span 
                              className="text-xs px-2 py-1 rounded"
                              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#E8DCC0' }}
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
                <div className="relative rounded-lg overflow-hidden" style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)' }}>
                  {beforePreviewUrls.length > 0 && (
                    <>
                      <Image
                        src={beforePreviewUrls[beforeCurrentIndex]}
                        alt={`Antes ${beforeCurrentIndex + 1}`}
                        width={1200}
                        height={900}
                        unoptimized
                        style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'contain' }}
                      />
                      {beforePreviewUrls.length > 1 && (
                        <>
                          <button
                            onClick={prevBeforeImage}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-white/20 transition-colors"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#E8DCC0' }}
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={nextBeforeImage}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-white/20 transition-colors"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#E8DCC0' }}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                            <span 
                              className="text-xs px-2 py-1 rounded"
                              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#E8DCC0' }}
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
                <div className="relative rounded-lg overflow-hidden" style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)' }}>
                  {afterPreviewUrls.length > 0 && (
                    <>
                      <Image
                        src={afterPreviewUrls[afterCurrentIndex]}
                        alt={`Depois ${afterCurrentIndex + 1}`}
                        width={1200}
                        height={900}
                        unoptimized
                        style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'contain' }}
                      />
                      {afterPreviewUrls.length > 1 && (
                        <>
                          <button
                            onClick={prevAfterImage}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-white/20 transition-colors"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#E8DCC0' }}
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={nextAfterImage}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-white/20 transition-colors"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#E8DCC0' }}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                            <span 
                              className="text-xs px-2 py-1 rounded"
                              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#E8DCC0' }}
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
      </main>
      <Footer />
    </div>
  );
}

