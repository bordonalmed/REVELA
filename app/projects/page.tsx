'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, Trash2, Calendar, Search, Filter, ArrowUpDown, X, ArrowLeft, Download, Upload, Database, Settings, ChevronDown, FolderPlus, Folder as FolderIcon, FolderOpen, MoreVertical, Edit2, Trash2 as TrashIcon, Move } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { getAllProjects, deleteProjectFromIndexedDB, type Project, exportBackup, importBackup, enableAutoBackup, disableAutoBackup, isAutoBackupEnabled, getLastAutoBackup, type BackupData, getAllFolders, createFolder, updateFolder, deleteFolder, moveProjectToFolder, type Folder } from '@/lib/storage';
import { NavigationHeader } from '@/components/navigation-header';
import { Footer } from '@/components/footer';
import { SafeBase64Image } from '@/components/safe-image';
import { trackDeleteProject, trackExportBackup, trackImportBackup, trackCreateFolder, trackUpdateFolder, trackDeleteFolder } from '@/lib/analytics';

type SortOption = 'recent' | 'oldest' | 'name-asc' | 'name-desc';
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year';

export default function ProjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  
  // Estados para busca e filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para backup
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [autoBackup, setAutoBackup] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [showBackupMenu, setShowBackupMenu] = useState(false);
  
  // Estados para pastas
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>('all');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [projectToMove, setProjectToMove] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [newFolderName, setNewFolderName] = useState('');

  const checkUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (!session) {
      router.push('/login');
    }
    setLoading(false);
  }, [router]);

  const loadProjects = useCallback(async () => {
    try {
      setLoadingProjects(true);
      const allProjects = await getAllProjects();
      setProjects(allProjects);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  // Filtrar e ordenar projetos
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects];

    // Filtro por pasta primeiro
    if (selectedFolderId === null) {
      // Mostrar apenas projetos sem pasta
      filtered = filtered.filter(p => !p.folderId);
    } else if (selectedFolderId !== 'all') {
      // Mostrar projetos da pasta selecionada
      filtered = filtered.filter(p => p.folderId === selectedFolderId);
    }
    // Se selectedFolderId === 'all', mostrar todos

    // Filtro por busca (nome)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(query)
      );
    }

    // Filtro por data
    if (dateFilter !== 'all') {
      const now = new Date();
      
      filtered = filtered.filter(project => {
        const projectDateObj = new Date(project.date);
        
        switch (dateFilter) {
          case 'today':
            return projectDateObj.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return projectDateObj >= weekAgo;
          case 'month':
            const monthAgo = new Date(now);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return projectDateObj >= monthAgo;
          case 'year':
            const yearAgo = new Date(now);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            return projectDateObj >= yearAgo;
          default:
            return true;
        }
      });
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name-asc':
          return a.name.localeCompare(b.name, 'pt-BR');
        case 'name-desc':
          return b.name.localeCompare(a.name, 'pt-BR');
        default:
          return 0;
      }
    });

    return filtered;
  }, [projects, searchQuery, sortOption, dateFilter, selectedFolderId]);

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setUser(session?.user ?? null);
      if (!session) router.push('/login');
    });
    return () => subscription.unsubscribe();
  }, [router, checkUser]);

  useEffect(() => {
    if (user) {
      loadProjects();
      loadFolders();
      // Verificar backup automático
      setAutoBackup(isAutoBackupEnabled());
      const lastBackup = getLastAutoBackup();
      if (lastBackup) {
        setLastBackupDate(lastBackup.exportDate);
      }
    }
  }, [user, loadProjects]);

  const loadFolders = useCallback(async () => {
    try {
      const allFolders = await getAllFolders();
      setFolders(allFolders);
    } catch (error) {
      console.error('Erro ao carregar pastas:', error);
    }
  }, []);

  // Fechar menu de backup ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showBackupMenu && !target.closest('.backup-menu-container')) {
        setShowBackupMenu(false);
      }
    };

    if (showBackupMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showBackupMenu]);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este projeto?')) {
      return;
    }

    try {
      // Encontrar projeto antes de deletar para tracking
      const projectToDelete = projects.find(p => p.id === id);
      
      await deleteProjectFromIndexedDB(id);
      await loadProjects();
      
      // Trackear deleção de projeto
      if (user && projectToDelete) {
        trackDeleteProject(id, projectToDelete.name);
      }
      
      alert('Projeto excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      alert('Erro ao excluir projeto. Tente novamente.');
    }
  };

  const handleExportBackup = async () => {
    try {
      setExporting(true);
      const backup = await exportBackup();
      
      // Criar arquivo JSON
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Criar link de download
      const link = document.createElement('a');
      link.href = url;
      link.download = `revela-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Se backup automático estiver ativo, atualizar
      if (autoBackup) {
        enableAutoBackup();
        setLastBackupDate(backup.exportDate);
      }
      
      // Trackear exportação de backup
      if (user) {
        trackExportBackup(backup.metadata?.totalProjects || 0);
      }
      
      alert(`Backup exportado com sucesso! ${backup.metadata?.totalProjects || 0} projeto(s) exportado(s).`);
    } catch (error) {
      console.error('Erro ao exportar backup:', error);
      alert('Erro ao exportar backup. Tente novamente.');
    } finally {
      setExporting(false);
    }
  };

  const handleImportBackup = async (file: File) => {
    try {
      setImporting(true);
      const text = await file.text();
      const backupData: BackupData = JSON.parse(text);
      
      // Validar formato
      if (!backupData.projects || !Array.isArray(backupData.projects)) {
        throw new Error('Formato de backup inválido');
      }
      
      // Confirmar importação
      const confirmMsg = `Deseja importar ${backupData.projects.length} projeto(s) do backup?\n\n` +
        `Atenção: Projetos com o mesmo ID serão substituídos.`;
      
      if (!confirm(confirmMsg)) {
        return;
      }
      
      // Importar
      const results = await importBackup(backupData);
      
      // Recarregar projetos
      await loadProjects();
      
      // Trackear importação de backup
      if (user) {
        trackImportBackup(backupData.projects.length);
      }
      
      // Mostrar resultados
      let message = `Importação concluída!\n\n`;
      message += `✓ ${results.success} projeto(s) importado(s) com sucesso`;
      if (results.failed > 0) {
        message += `\n✗ ${results.failed} projeto(s) falharam`;
        if (results.errors.length > 0) {
          message += `\n\nErros:\n${results.errors.slice(0, 5).join('\n')}`;
          if (results.errors.length > 5) {
            message += `\n... e mais ${results.errors.length - 5} erro(s)`;
          }
        }
      }
      
      alert(message);
      setShowImportModal(false);
    } catch (error) {
      console.error('Erro ao importar backup:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao importar backup: ${errorMsg}`);
    } finally {
      setImporting(false);
    }
  };

  const handleToggleAutoBackup = () => {
    const newValue = !autoBackup;
    setAutoBackup(newValue);
    
    if (newValue) {
      enableAutoBackup();
      // Criar backup imediatamente
      exportBackup().then(backup => {
        setLastBackupDate(backup.exportDate);
        alert('Backup automático ativado! Um backup foi criado automaticamente.');
      }).catch(error => {
        console.error('Erro ao criar backup automático:', error);
        alert('Erro ao criar backup automático inicial.');
      });
    } else {
      disableAutoBackup();
      alert('Backup automático desativado.');
    }
  };

  // Funções de gerenciamento de pastas
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Digite um nome para a pasta');
      return;
    }

    try {
      const folderName = newFolderName.trim();
      await createFolder(folderName);
      await loadFolders();
      setNewFolderName('');
      setShowFolderModal(false);
      
      // Trackear criação de pasta
      if (user) {
        trackCreateFolder(folderName);
      }
      
      alert('Pasta criada com sucesso!');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao criar pasta: ${errorMsg}`);
    }
  };

  const handleEditFolder = async (folder: Folder) => {
    if (!newFolderName.trim()) {
      alert('Digite um nome para a pasta');
      return;
    }

    try {
      const folderName = newFolderName.trim();
      await updateFolder(folder.id, { name: folderName });
      await loadFolders();
      setNewFolderName('');
      setEditingFolder(null);
      setShowFolderModal(false);
      
      // Trackear atualização de pasta
      if (user) {
        trackUpdateFolder(folder.id, folderName);
      }
      
      alert('Pasta atualizada com sucesso!');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao atualizar pasta: ${errorMsg}`);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pasta? Os projetos serão movidos para "Sem Pasta".')) {
      return;
    }

    try {
      await deleteFolder(folderId);
      await loadFolders();
      await loadProjects();
      if (selectedFolderId === folderId) {
        setSelectedFolderId('all');
      }
      alert('Pasta excluída com sucesso!');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao excluir pasta: ${errorMsg}`);
    }
  };

  const handleMoveProject = async (folderId: string | undefined) => {
    if (!projectToMove) return;

    try {
      await moveProjectToFolder(projectToMove, folderId);
      await loadProjects();
      setShowMoveModal(false);
      setProjectToMove(null);
      alert('Projeto movido com sucesso!');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao mover projeto: ${errorMsg}`);
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

        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h1 
              className="text-2xl sm:text-3xl font-light" 
              style={{ color: '#E8DCC0' }}
            >
              Projetos Armazenados
            </h1>
            <div className="text-sm" style={{ color: '#E8DCC0', opacity: 0.7 }}>
              {filteredAndSortedProjects.length} de {projects.length} projeto{projects.length !== 1 ? 's' : ''}
            </div>
          </div>
          
        </div>

        {/* Seção de Pastas */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium" style={{ color: '#E8DCC0', opacity: 0.8 }}>
              Pastas
            </h2>
            <button
              onClick={() => {
                setEditingFolder(null);
                setNewFolderName('');
                setShowFolderModal(true);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90 flex items-center gap-1.5 border"
              style={{ 
                backgroundColor: 'rgba(232, 220, 192, 0.05)', 
                color: '#E8DCC0', 
                borderColor: 'rgba(232, 220, 192, 0.1)' 
              }}
              title="Criar nova pasta"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nova Pasta</span>
            </button>
          </div>

          {/* Lista de Pastas */}
          <div className="flex flex-wrap gap-2">
            {/* Opção "Todos" */}
            <button
              onClick={() => setSelectedFolderId('all')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90 flex items-center gap-1.5 border"
              style={{
                backgroundColor: selectedFolderId === 'all' ? '#00A88F' : 'rgba(232, 220, 192, 0.05)',
                borderColor: selectedFolderId === 'all' ? '#00A88F' : 'rgba(232, 220, 192, 0.1)',
                color: selectedFolderId === 'all' ? '#FFFFFF' : '#E8DCC0'
              }}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Todos
            </button>

            {/* Opção "Sem Pasta" */}
            <button
              onClick={() => setSelectedFolderId(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90 flex items-center gap-1.5 border"
              style={{
                backgroundColor: selectedFolderId === null ? '#00A88F' : 'rgba(232, 220, 192, 0.05)',
                borderColor: selectedFolderId === null ? '#00A88F' : 'rgba(232, 220, 192, 0.1)',
                color: selectedFolderId === null ? '#FFFFFF' : '#E8DCC0'
              }}
            >
              <FolderIcon className="w-3.5 h-3.5" />
              Sem Pasta
            </button>

            {/* Pastas criadas */}
            {folders.map((folder) => {
              const projectCount = projects.filter(p => p.folderId === folder.id).length;
              return (
                <div key={folder.id} className="relative group">
                  <button
                    onClick={() => setSelectedFolderId(folder.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90 flex items-center gap-1.5 border"
                    style={{
                      backgroundColor: selectedFolderId === folder.id ? '#00A88F' : 'rgba(232, 220, 192, 0.05)',
                      borderColor: selectedFolderId === folder.id ? '#00A88F' : 'rgba(232, 220, 192, 0.1)',
                      color: selectedFolderId === folder.id ? '#FFFFFF' : '#E8DCC0'
                    }}
                  >
                    <FolderIcon className="w-3.5 h-3.5" />
                    {folder.name}
                    <span className="ml-1 opacity-60">({projectCount})</span>
                  </button>
                  
                  {/* Menu de ações da pasta */}
                  <div className="absolute right-0 top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <div 
                      className="rounded-lg border shadow-lg"
                      style={{
                        backgroundColor: '#1B3C45',
                        borderColor: 'rgba(232, 220, 192, 0.2)',
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFolder(folder);
                          setNewFolderName(folder.name);
                          setShowFolderModal(true);
                        }}
                        className="w-full px-3 py-2 rounded-t text-xs transition-all hover:bg-white/10 flex items-center gap-2"
                        style={{ color: '#E8DCC0' }}
                      >
                        <Edit2 className="w-3 h-3" />
                        Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder.id);
                        }}
                        className="w-full px-3 py-2 rounded-b text-xs transition-all hover:bg-white/10 flex items-center gap-2"
                        style={{ color: '#E8DCC0' }}
                      >
                        <TrashIcon className="w-3 h-3" />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="mb-6 space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#E8DCC0', opacity: 0.5 }} />
            <input
              type="text"
              placeholder="Buscar por nome do projeto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm sm:text-base"
              style={{
                backgroundColor: 'rgba(232, 220, 192, 0.05)',
                borderColor: 'rgba(232, 220, 192, 0.1)',
                color: '#E8DCC0',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#00A88F';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(232, 220, 192, 0.1)';
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
                style={{ color: '#E8DCC0' }}
                aria-label="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Controles de Filtro e Ordenação */}
          <div className="flex flex-wrap gap-3">
            {/* Botão Toggle Filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 flex items-center gap-2 border"
              style={{
                backgroundColor: showFilters ? '#00A88F' : 'rgba(232, 220, 192, 0.05)',
                borderColor: showFilters ? '#00A88F' : 'rgba(232, 220, 192, 0.1)',
                color: showFilters ? '#FFFFFF' : '#E8DCC0'
              }}
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>

            {/* Dropdown de Ordenação */}
            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="px-4 py-2 rounded-lg text-sm font-medium border appearance-none pr-8 cursor-pointer"
                style={{
                  backgroundColor: 'rgba(232, 220, 192, 0.05)',
                  borderColor: 'rgba(232, 220, 192, 0.1)',
                  color: '#E8DCC0',
                  outline: 'none'
                }}
              >
                <option value="recent">Mais Recentes</option>
                <option value="oldest">Mais Antigos</option>
                <option value="name-asc">Nome A-Z</option>
                <option value="name-desc">Nome Z-A</option>
              </select>
              <ArrowUpDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#E8DCC0', opacity: 0.5 }} />
            </div>

            {/* Botão de Menu de Backup */}
            <div className="relative backup-menu-container">
              <button
                onClick={() => setShowBackupMenu(!showBackupMenu)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 flex items-center gap-2 border"
                style={{
                  backgroundColor: showBackupMenu ? '#00A88F' : 'rgba(232, 220, 192, 0.05)',
                  borderColor: showBackupMenu ? '#00A88F' : 'rgba(232, 220, 192, 0.1)',
                  color: showBackupMenu ? '#FFFFFF' : '#E8DCC0'
                }}
                title="Opções de Backup"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Backup</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showBackupMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Menu Dropdown de Backup */}
              {showBackupMenu && (
                <div 
                  className="absolute right-0 top-full mt-2 w-56 rounded-lg border shadow-lg z-50"
                  style={{
                    backgroundColor: '#1B3C45',
                    borderColor: 'rgba(232, 220, 192, 0.2)',
                  }}
                >
                  <div className="p-2 space-y-1">
                    {/* Exportar */}
                    <button
                      onClick={() => {
                        handleExportBackup();
                        setShowBackupMenu(false);
                      }}
                      disabled={exporting || projects.length === 0}
                      className="w-full px-3 py-2 rounded text-sm transition-all hover:bg-white/10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ color: '#E8DCC0' }}
                    >
                      <Download className="w-4 h-4" />
                      <span>Exportar Backup</span>
                    </button>

                    {/* Importar */}
                    <button
                      onClick={() => {
                        setShowImportModal(true);
                        setShowBackupMenu(false);
                      }}
                      disabled={importing}
                      className="w-full px-3 py-2 rounded text-sm transition-all hover:bg-white/10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ color: '#E8DCC0' }}
                    >
                      <Upload className="w-4 h-4" />
                      <span>Importar Backup</span>
                    </button>

                    {/* Divisor */}
                    <div className="h-px my-1" style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)' }} />

                    {/* Backup Automático */}
                    <div className="px-3 py-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4" style={{ color: '#E8DCC0', opacity: 0.7 }} />
                          <span className="text-sm" style={{ color: '#E8DCC0' }}>
                            Backup Automático
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={autoBackup}
                            onChange={handleToggleAutoBackup}
                            className="sr-only peer"
                          />
                          <div 
                            className="w-9 h-5 rounded-full peer transition-colors"
                            style={{
                              backgroundColor: autoBackup ? '#00A88F' : 'rgba(232, 220, 192, 0.2)',
                            }}
                          >
                            <div 
                              className="w-4 h-4 rounded-full transition-transform mt-0.5 ml-0.5"
                              style={{
                                backgroundColor: '#FFFFFF',
                                transform: autoBackup ? 'translateX(16px)' : 'translateX(0)',
                              }}
                            />
                          </div>
                        </label>
                      </div>
                      {lastBackupDate && (
                        <div className="mt-1 text-xs" style={{ color: '#E8DCC0', opacity: 0.5 }}>
                          Último: {new Date(lastBackupDate).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Painel de Filtros Expandido */}
          {showFilters && (
            <div 
              className="p-4 rounded-lg border space-y-3"
              style={{
                backgroundColor: 'rgba(232, 220, 192, 0.05)',
                borderColor: 'rgba(232, 220, 192, 0.1)'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium" style={{ color: '#E8DCC0' }}>
                  Filtrar por Data
                </h3>
                {dateFilter !== 'all' && (
                  <button
                    onClick={() => setDateFilter('all')}
                    className="text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
                    style={{ color: '#00A88F' }}
                  >
                    Limpar filtro
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {(['all', 'today', 'week', 'month', 'year'] as DateFilter[]).map((filter) => {
                  const labels: Record<DateFilter, string> = {
                    all: 'Todos',
                    today: 'Hoje',
                    week: 'Última Semana',
                    month: 'Último Mês',
                    year: 'Último Ano'
                  };
                  
                  return (
                    <button
                      key={filter}
                      onClick={() => setDateFilter(filter)}
                      className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all hover:opacity-90"
                      style={{
                        backgroundColor: dateFilter === filter ? '#00A88F' : 'rgba(232, 220, 192, 0.1)',
                        color: dateFilter === filter ? '#FFFFFF' : '#E8DCC0'
                      }}
                    >
                      {labels[filter]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {loadingProjects ? (
          <div className="text-center py-12">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
              style={{ borderColor: '#00A88F', borderTopColor: 'transparent' }}
            ></div>
            <p style={{ color: '#E8DCC0' }}>Carregando projetos...</p>
          </div>
        ) : filteredAndSortedProjects.length === 0 ? (
          <div 
            className="rounded-lg p-8 sm:p-12 text-center border" 
            style={{ 
              backgroundColor: 'rgba(232, 220, 192, 0.05)', 
              borderColor: 'rgba(232, 220, 192, 0.1)' 
            }}
          >
            {projects.length === 0 ? (
              <>
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
              </>
            ) : (
              <>
                <p 
                  className="text-base sm:text-lg mb-4" 
                  style={{ color: '#E8DCC0', opacity: 0.8 }}
                >
                  Nenhum projeto encontrado com os filtros aplicados
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setDateFilter('all');
                    setSortOption('recent');
                  }}
                  className="px-6 py-3 rounded-2xl text-sm sm:text-base font-medium transition-all hover:opacity-90"
                  style={{ backgroundColor: '#00A88F', color: '#FFFFFF' }}
                >
                  Limpar Filtros
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredAndSortedProjects.map((project) => (
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
                  {project.beforeImages.length > 0 && project.beforeImages[0] ? (
                    <div className="relative rounded-lg overflow-hidden" style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)' }}>
                      <SafeBase64Image
                        src={project.beforeImages[0]}
                        alt="Antes"
                        className="w-full h-24 sm:h-32 object-cover"
                        style={{ minHeight: '96px' }}
                      />
                      <div 
                        className="absolute bottom-1 left-1 px-2 py-0.5 rounded text-xs"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', color: '#E8DCC0' }}
                      >
                        Antes ({project.beforeImages.length})
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-lg overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)', minHeight: '96px' }}>
                      <span className="text-xs" style={{ color: '#E8DCC0', opacity: 0.5 }}>Sem imagem</span>
                    </div>
                  )}
                  {project.afterImages.length > 0 && project.afterImages[0] ? (
                    <div className="relative rounded-lg overflow-hidden" style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)' }}>
                      <SafeBase64Image
                        src={project.afterImages[0]}
                        alt="Depois"
                        className="w-full h-24 sm:h-32 object-cover"
                        style={{ minHeight: '96px' }}
                      />
                      <div 
                        className="absolute bottom-1 left-1 px-2 py-0.5 rounded text-xs"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', color: '#E8DCC0' }}
                      >
                        Depois ({project.afterImages.length})
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-lg overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)', minHeight: '96px' }}>
                      <span className="text-xs" style={{ color: '#E8DCC0', opacity: 0.5 }}>Sem imagem</span>
                    </div>
                  )}
                </div>

                {/* Botões de ação */}
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all hover:opacity-80 flex items-center justify-center gap-2"
                    style={{ backgroundColor: 'rgba(232, 220, 192, 0.05)', color: '#E8DCC0', borderColor: 'rgba(232, 220, 192, 0.1)' }}
                  >
                    <Eye className="w-4 h-4" />
                    Visualizar
                  </button>
                  <button
                    onClick={() => {
                      setProjectToMove(project.id);
                      setShowMoveModal(true);
                    }}
                    className="px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all hover:opacity-80 border"
                    style={{ 
                      backgroundColor: 'rgba(232, 220, 192, 0.05)', 
                      color: '#E8DCC0', 
                      borderColor: 'rgba(232, 220, 192, 0.1)' 
                    }}
                    title="Mover para pasta"
                    aria-label="Mover projeto"
                  >
                    <Move className="w-4 h-4" />
                  </button>
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

      {/* Modal de Criar/Editar Pasta */}
      {showFolderModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => setShowFolderModal(false)}
        >
          <div 
            className="rounded-lg p-6 max-w-md w-full"
            style={{ backgroundColor: '#1B3C45' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ color: '#E8DCC0', fontSize: '1.25rem', fontWeight: 600 }}>
                {editingFolder ? 'Editar Pasta' : 'Nova Pasta'}
              </h2>
              <button
                onClick={() => {
                  setShowFolderModal(false);
                  setEditingFolder(null);
                  setNewFolderName('');
                }}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                style={{ color: '#E8DCC0' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-2" style={{ color: '#E8DCC0', opacity: 0.8 }}>
                Nome da Pasta
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    editingFolder ? handleEditFolder(editingFolder) : handleCreateFolder();
                  }
                }}
                className="w-full px-4 py-2 rounded-lg border text-sm"
                style={{
                  backgroundColor: 'rgba(232, 220, 192, 0.05)',
                  borderColor: 'rgba(232, 220, 192, 0.1)',
                  color: '#E8DCC0',
                  outline: 'none'
                }}
                placeholder="Digite o nome da pasta"
                autoFocus
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowFolderModal(false);
                  setEditingFolder(null);
                  setNewFolderName('');
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 border"
                style={{ 
                  backgroundColor: 'rgba(232, 220, 192, 0.05)', 
                  color: '#E8DCC0', 
                  borderColor: 'rgba(232, 220, 192, 0.1)' 
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => editingFolder ? handleEditFolder(editingFolder) : handleCreateFolder()}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: '#00A88F', color: '#FFFFFF' }}
              >
                {editingFolder ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Mover Projeto */}
      {showMoveModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => {
            setShowMoveModal(false);
            setProjectToMove(null);
          }}
        >
          <div 
            className="rounded-lg p-6 max-w-md w-full"
            style={{ backgroundColor: '#1B3C45' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ color: '#E8DCC0', fontSize: '1.25rem', fontWeight: 600 }}>
                Mover Projeto
              </h2>
              <button
                onClick={() => {
                  setShowMoveModal(false);
                  setProjectToMove(null);
                }}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                style={{ color: '#E8DCC0' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              <button
                onClick={() => handleMoveProject(undefined)}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 flex items-center gap-2 border text-left"
                  style={{ 
                    backgroundColor: 'rgba(232, 220, 192, 0.05)', 
                    color: '#E8DCC0', 
                    borderColor: 'rgba(232, 220, 192, 0.1)' 
                  }}
                >
                  <FolderIcon className="w-4 h-4" />
                  Sem Pasta
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => handleMoveProject(folder.id)}
                    className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 flex items-center gap-2 border text-left"
                    style={{ 
                      backgroundColor: 'rgba(232, 220, 192, 0.05)', 
                      color: '#E8DCC0', 
                      borderColor: 'rgba(232, 220, 192, 0.1)' 
                    }}
                  >
                    <FolderIcon className="w-4 h-4" />
                  {folder.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importação de Backup */}
      {showImportModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => !importing && setShowImportModal(false)}
        >
          <div 
            className="rounded-lg p-6 max-w-md w-full"
            style={{ backgroundColor: '#1B3C45' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ color: '#E8DCC0', fontSize: '1.25rem', fontWeight: 600 }}>
                Importar Backup
              </h2>
              <button
                onClick={() => setShowImportModal(false)}
                disabled={importing}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                style={{ color: '#E8DCC0' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm mb-4" style={{ color: '#E8DCC0', opacity: 0.8 }}>
                Selecione o arquivo JSON de backup para importar. Projetos com o mesmo ID serão substituídos.
              </p>
              
              <label className="block">
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImportBackup(file);
                    }
                  }}
                  disabled={importing}
                  className="hidden"
                />
                <div 
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-opacity-50"
                  style={{ 
                    borderColor: importing ? 'rgba(232, 220, 192, 0.3)' : 'rgba(232, 220, 192, 0.5)',
                    backgroundColor: importing ? 'rgba(232, 220, 192, 0.05)' : 'transparent'
                  }}
                >
                  {importing ? (
                    <>
                      <div 
                        className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" 
                        style={{ borderColor: '#00A88F', borderTopColor: 'transparent' }}
                      ></div>
                      <p style={{ color: '#E8DCC0' }}>Importando...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: '#E8DCC0', opacity: 0.7 }} />
                      <p style={{ color: '#E8DCC0' }}>Clique ou arraste o arquivo aqui</p>
                      <p className="text-xs mt-1" style={{ color: '#E8DCC0', opacity: 0.5 }}>
                        Arquivo JSON (.json)
                      </p>
                    </>
                  )}
                </div>
              </label>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowImportModal(false)}
                disabled={importing}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 border disabled:opacity-50"
                style={{ 
                  backgroundColor: 'rgba(232, 220, 192, 0.05)', 
                  color: '#E8DCC0', 
                  borderColor: 'rgba(232, 220, 192, 0.1)' 
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
