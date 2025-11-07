'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, Trash2, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { getAllProjects, deleteProjectFromIndexedDB, type Project } from '@/lib/storage';
import { NavigationHeader } from '@/components/navigation-header';
import { Footer } from '@/components/footer';

export default function ProjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) router.push('/login');
    });
    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (!session) {
      router.push('/login');
    }
    setLoading(false);
  };

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const allProjects = await getAllProjects();
      // Ordenar por data de criação (mais recentes primeiro)
      allProjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setProjects(allProjects);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este projeto?')) {
      return;
    }

    try {
      await deleteProjectFromIndexedDB(id);
      await loadProjects();
      alert('Projeto excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      alert('Erro ao excluir projeto. Tente novamente.');
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1B3C45' }}>
      <NavigationHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl pt-20 sm:pt-24">
        <h1 
          className="text-2xl sm:text-3xl font-light mb-6" 
          style={{ color: '#E8DCC0' }}
        >
          Projetos Armazenados
        </h1>

        {loadingProjects ? (
          <div className="text-center py-12">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
              style={{ borderColor: '#00A88F', borderTopColor: 'transparent' }}
            ></div>
            <p style={{ color: '#E8DCC0' }}>Carregando projetos...</p>
          </div>
        ) : projects.length === 0 ? (
          <div 
            className="rounded-lg p-8 sm:p-12 text-center border" 
            style={{ 
              backgroundColor: 'rgba(232, 220, 192, 0.05)', 
              borderColor: 'rgba(232, 220, 192, 0.1)' 
            }}
          >
            <p 
              className="text-base sm:text-lg mb-4" 
              style={{ color: '#E8DCC0', opacity: 0.8 }}
            >
              Nenhum projeto salvo ainda
            </p>
            <Link href="/new-project">
              <button
                className="px-6 py-3 rounded-2xl text-sm sm:text-base font-medium transition-all hover:scale-105"
                style={{ backgroundColor: '#00A88F', color: '#FFFFFF' }}
              >
                Criar Primeiro Projeto
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="rounded-lg p-4 sm:p-5 border transition-all hover:bg-white/5"
                style={{ 
                  backgroundColor: 'rgba(232, 220, 192, 0.05)', 
                  borderColor: 'rgba(232, 220, 192, 0.1)' 
                }}
              >
                <h3 
                  className="text-base sm:text-lg font-light mb-2 truncate" 
                  style={{ color: '#E8DCC0' }}
                >
                  {project.name}
                </h3>
                <div 
                  className="flex items-center gap-2 text-xs sm:text-sm mb-3" 
                  style={{ color: '#E8DCC0', opacity: 0.8 }}
                >
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(project.date).toLocaleDateString('pt-BR')}</span>
                </div>
                
                {/* Preview das imagens */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {project.beforeImages.length > 0 && (
                    <div className="relative rounded-lg overflow-hidden" style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)' }}>
                      <img
                        src={project.beforeImages[0]}
                        alt="Antes"
                        className="w-full h-24 sm:h-32 object-cover"
                      />
                      <div 
                        className="absolute bottom-1 left-1 px-2 py-0.5 rounded text-xs"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', color: '#E8DCC0' }}
                      >
                        Antes ({project.beforeImages.length})
                      </div>
                    </div>
                  )}
                  {project.afterImages.length > 0 && (
                    <div className="relative rounded-lg overflow-hidden" style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)' }}>
                      <img
                        src={project.afterImages[0]}
                        alt="Depois"
                        className="w-full h-24 sm:h-32 object-cover"
                      />
                      <div 
                        className="absolute bottom-1 left-1 px-2 py-0.5 rounded text-xs"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', color: '#E8DCC0' }}
                      >
                        Depois ({project.afterImages.length})
                      </div>
                    </div>
                  )}
                </div>

                {/* Botões de ação */}
                <div className="flex gap-2">
                  <Link href={`/projects/${project.id}`} className="flex-1">
                    <button
                      className="w-full px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all hover:opacity-80 flex items-center justify-center gap-2"
                      style={{ backgroundColor: 'rgba(232, 220, 192, 0.05)', color: '#E8DCC0', borderColor: 'rgba(232, 220, 192, 0.1)' }}
                    >
                      <Eye className="w-4 h-4" />
                      Visualizar
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all hover:opacity-80"
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5' }}
                    aria-label="Excluir projeto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

