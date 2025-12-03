// Utilitários para armazenamento local (IndexedDB e localStorage)

// Helper para verificar se localStorage está disponível
function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

// Helper para obter item do localStorage de forma segura
function getLocalStorageItem(key: string): string | null {
  if (!isLocalStorageAvailable()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

// Helper para definir item no localStorage de forma segura
function setLocalStorageItem(key: string, value: string): boolean {
  if (!isLocalStorageAvailable()) return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export interface Folder {
  id: string;
  name: string;
  color?: string; // Cor opcional para identificação visual
  createdAt: string;
}

export interface Measurement {
  id: string;
  imageType: 'before' | 'after'; // Tipo de imagem (antes ou depois)
  imageIndex: number; // Índice da imagem no array
  startX: number; // Coordenada X inicial (em pixels)
  startY: number; // Coordenada Y inicial (em pixels)
  endX: number; // Coordenada X final (em pixels)
  endY: number; // Coordenada Y final (em pixels)
  length?: number; // Comprimento em pixels (calculado)
  label?: string; // Rótulo opcional para a medida
  unit?: string; // Unidade de medida (cm, mm, etc.)
  scale?: number; // Escala de conversão (pixels por unidade)
}

export interface Project {
  id: string;
  name: string;
  date: string;
  beforeImages: string[];
  afterImages: string[];
  notes?: string; // Campo opcional para notas/observações
  folderId?: string; // ID da pasta/categoria (null = sem pasta)
  measurements?: Measurement[]; // Medidas anotadas nas imagens
  createdAt: string;
}

// Salvar projeto no IndexedDB
export const saveProjectToIndexedDB = (project: Project): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('RevelaDB', 1);
    
    // Criar backup automático após salvar (se habilitado)
    const createAutoBackupAfterSave = () => {
      if (isAutoBackupEnabled()) {
        exportBackup().then(backup => {
          setLocalStorageItem('revela_last_backup', JSON.stringify(backup));
          setLocalStorageItem('revela_backup_date', new Date().toISOString());
        }).catch(error => {
          console.warn('Erro ao criar backup automático após salvar:', error);
        });
      }
    };

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id', autoIncrement: false });
      }
      
      const transaction = db.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const putRequest = store.put(project);

      putRequest.onsuccess = () => {
        // Salvar também no localStorage como fallback
        try {
          const stored = getLocalStorageItem('revela_projects');
          const projects = stored ? JSON.parse(stored) : [];
          const index = projects.findIndex((p: Project) => p.id === project.id);
          if (index >= 0) {
            projects[index] = project;
          } else {
            projects.push(project);
          }
          setLocalStorageItem('revela_projects', JSON.stringify(projects));
        } catch (error) {
          console.warn('Erro ao salvar no localStorage:', error);
        }
        
        // Criar backup automático
        createAutoBackupAfterSave();
        resolve();
      };
      
      putRequest.onerror = () => {
        // Tentar localStorage como fallback
        try {
          const stored = getLocalStorageItem('revela_projects');
          const projects = stored ? JSON.parse(stored) : [];
          const index = projects.findIndex((p: Project) => p.id === project.id);
          if (index >= 0) {
            projects[index] = project;
          } else {
            projects.push(project);
          }
          setLocalStorageItem('revela_projects', JSON.stringify(projects));
          createAutoBackupAfterSave();
          resolve();
        } catch (error) {
          reject(error);
        }
      };
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('projects')) {
        const objectStore = db.createObjectStore('projects', { keyPath: 'id', autoIncrement: false });
        objectStore.createIndex('name', 'name', { unique: false });
        objectStore.createIndex('date', 'date', { unique: false });
        objectStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
};

// Obter todos os projetos do IndexedDB
export const getAllProjectsFromIndexedDB = (): Promise<Project[]> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('RevelaDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('projects')) {
        resolve([]);
        return;
      }

      const transaction = db.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('projects')) {
        const objectStore = db.createObjectStore('projects', { keyPath: 'id', autoIncrement: false });
        objectStore.createIndex('name', 'name', { unique: false });
        objectStore.createIndex('date', 'date', { unique: false });
        objectStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
};

// Obter um projeto específico do IndexedDB com timeout
export const getProjectFromIndexedDB = (id: string, timeout: number = 5000): Promise<Project | null> => {
  return new Promise((resolve) => {
    let resolved = false;
    
    // Timeout para evitar travamentos
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn('Timeout ao acessar IndexedDB, tentando localStorage');
        // Tentar localStorage como fallback
        if (isLocalStorageAvailable()) {
          try {
            const stored = getLocalStorageItem('revela_projects');
            if (stored) {
              const projects = JSON.parse(stored);
              const project = projects.find((p: Project) => p.id === id);
              resolve(project || null);
              return;
            }
          } catch (error) {
            console.warn('Erro ao acessar localStorage após timeout:', error);
          }
        }
        resolve(null);
      }
    }, timeout);

    const request = indexedDB.open('RevelaDB', 1);

    request.onerror = () => {
      clearTimeout(timeoutId);
      if (resolved) return;
      resolved = true;
      
      // Se IndexedDB falhar, tentar localStorage
      if (isLocalStorageAvailable()) {
        try {
          const stored = getLocalStorageItem('revela_projects');
          if (stored) {
            const projects = JSON.parse(stored);
            const project = projects.find((p: Project) => p.id === id);
            resolve(project || null);
          } else {
            resolve(null);
          }
        } catch (error) {
          console.warn('Erro ao acessar localStorage:', error);
          resolve(null);
        }
      } else {
        resolve(null);
      }
    };
    
    request.onsuccess = () => {
      clearTimeout(timeoutId);
      if (resolved) return;
      
      const db = request.result;
      if (!db.objectStoreNames.contains('projects')) {
        resolved = true;
        // Se não existir no IndexedDB, tentar localStorage
        if (isLocalStorageAvailable()) {
          try {
            const stored = getLocalStorageItem('revela_projects');
            if (stored) {
              const projects = JSON.parse(stored);
              const project = projects.find((p: Project) => p.id === id);
              resolve(project || null);
            } else {
              resolve(null);
            }
          } catch (error) {
            console.warn('Erro ao acessar localStorage:', error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
        return;
      }

      try {
        const transaction = db.transaction(['projects'], 'readonly');
        const store = transaction.objectStore('projects');
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
          if (resolved) return;
          clearTimeout(timeoutId);
          resolved = true;
          
          if (getRequest.result) {
            resolve(getRequest.result);
          } else {
            // Se não encontrar no IndexedDB, tentar localStorage
            if (isLocalStorageAvailable()) {
              try {
                const stored = getLocalStorageItem('revela_projects');
                if (stored) {
                  const projects = JSON.parse(stored);
                  const project = projects.find((p: Project) => p.id === id);
                  resolve(project || null);
                } else {
                  resolve(null);
                }
              } catch (error) {
                resolve(null);
              }
            } else {
              resolve(null);
            }
          }
        };
        
        getRequest.onerror = () => {
          if (resolved) return;
          clearTimeout(timeoutId);
          resolved = true;
          
          // Se erro, tentar localStorage
          if (isLocalStorageAvailable()) {
            try {
              const stored = getLocalStorageItem('revela_projects');
              if (stored) {
                const projects = JSON.parse(stored);
                const project = projects.find((p: Project) => p.id === id);
                resolve(project || null);
              } else {
                resolve(null);
              }
            } catch (error) {
              console.warn('Erro ao acessar localStorage:', error);
              resolve(null);
            }
          } else {
            resolve(null);
          }
        };
      } catch (error) {
        if (resolved) return;
        clearTimeout(timeoutId);
        resolved = true;
        console.warn('Erro na transação IndexedDB:', error);
        resolve(null);
      }
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('projects')) {
        const objectStore = db.createObjectStore('projects', { keyPath: 'id', autoIncrement: false });
        objectStore.createIndex('name', 'name', { unique: false });
        objectStore.createIndex('date', 'date', { unique: false });
        objectStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
};

// Deletar projeto do IndexedDB
export const deleteProjectFromIndexedDB = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('RevelaDB', 1);

    request.onerror = () => {
      // Se IndexedDB falhar, tentar localStorage
      try {
        const stored = getLocalStorageItem('revela_projects');
        if (stored) {
          const projects = JSON.parse(stored);
          const filtered = projects.filter((p: Project) => p.id !== id);
          setLocalStorageItem('revela_projects', JSON.stringify(filtered));
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('projects')) {
        // Se não existir no IndexedDB, tentar localStorage
        try {
          const stored = getLocalStorageItem('revela_projects');
          if (stored) {
            const projects = JSON.parse(stored);
            const filtered = projects.filter((p: Project) => p.id !== id);
            setLocalStorageItem('revela_projects', JSON.stringify(filtered));
          }
        } catch (error) {
          // Ignorar erro
        }
        resolve();
        return;
      }

      const transaction = db.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const deleteRequest = store.delete(id);

      deleteRequest.onsuccess = () => {
        // Também remover do localStorage se existir
        try {
          const stored = getLocalStorageItem('revela_projects');
          if (stored) {
            const projects = JSON.parse(stored);
            const filtered = projects.filter((p: Project) => p.id !== id);
            setLocalStorageItem('revela_projects', JSON.stringify(filtered));
          }
        } catch (error) {
          // Ignorar erro
        }
        resolve();
      };
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('projects')) {
        const objectStore = db.createObjectStore('projects', { keyPath: 'id', autoIncrement: false });
        objectStore.createIndex('name', 'name', { unique: false });
        objectStore.createIndex('date', 'date', { unique: false });
        objectStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
};

// Função para salvar projeto (tenta IndexedDB primeiro, depois localStorage)
export const saveProject = async (project: Project): Promise<void> => {
  try {
    // Tentar IndexedDB primeiro
    await saveProjectToIndexedDB(project);
  } catch (indexedDBError) {
    // Se IndexedDB falhar, usar localStorage
    console.warn('IndexedDB não disponível, usando localStorage:', indexedDBError);
    
    const projectSize = JSON.stringify(project).length;
    const maxSize = 4 * 1024 * 1024; // 4MB
    
    if (projectSize > maxSize) {
      throw new Error('As imagens são muito grandes. Por favor, reduza o número ou tamanho das imagens.');
    }

    const existingProjects = getLocalStorageItem('revela_projects');
    const projects = existingProjects ? JSON.parse(existingProjects) : [];
    projects.push(project);
    
    try {
      if (!setLocalStorageItem('revela_projects', JSON.stringify(projects))) {
        throw new Error('Não foi possível salvar no localStorage');
      }
    } catch (storageError: any) {
      if (storageError.name === 'QuotaExceededError') {
        throw new Error('Espaço de armazenamento insuficiente. Por favor, exclua alguns projetos antigos ou reduza o número de imagens.');
      }
      throw storageError;
    }
  }
};

// Atualizar projeto existente no IndexedDB
export const updateProjectInIndexedDB = (project: Project): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('RevelaDB', 1);

    request.onerror = () => {
      // Se IndexedDB falhar, tentar localStorage
      try {
        const stored = getLocalStorageItem('revela_projects');
        if (stored) {
          const projects = JSON.parse(stored);
          const index = projects.findIndex((p: Project) => p.id === project.id);
          if (index !== -1) {
            projects[index] = project;
            setLocalStorageItem('revela_projects', JSON.stringify(projects));
          }
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('projects')) {
        // Se não existir no IndexedDB, tentar localStorage
        try {
          const stored = getLocalStorageItem('revela_projects');
          if (stored) {
            const projects = JSON.parse(stored);
            const index = projects.findIndex((p: Project) => p.id === project.id);
            if (index !== -1) {
              projects[index] = project;
              setLocalStorageItem('revela_projects', JSON.stringify(projects));
            }
          }
        } catch (error) {
          // Ignorar erro
        }
        resolve();
        return;
      }

      const transaction = db.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const updateRequest = store.put(project);

      updateRequest.onsuccess = () => {
        // Também atualizar no localStorage se existir
        try {
          const stored = getLocalStorageItem('revela_projects');
          if (stored) {
            const projects = JSON.parse(stored);
            const index = projects.findIndex((p: Project) => p.id === project.id);
            if (index !== -1) {
              projects[index] = project;
              setLocalStorageItem('revela_projects', JSON.stringify(projects));
            }
          }
        } catch (error) {
          // Ignorar erro
        }
        
        // Criar backup automático
        if (isAutoBackupEnabled()) {
          exportBackup().then(backup => {
            setLocalStorageItem('revela_last_backup', JSON.stringify(backup));
            setLocalStorageItem('revela_backup_date', new Date().toISOString());
          }).catch(error => {
            console.warn('Erro ao criar backup automático após atualizar:', error);
          });
        }
        
        resolve();
      };
      updateRequest.onerror = () => reject(updateRequest.error);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('projects')) {
        const objectStore = db.createObjectStore('projects', { keyPath: 'id', autoIncrement: false });
        objectStore.createIndex('name', 'name', { unique: false });
        objectStore.createIndex('date', 'date', { unique: false });
        objectStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
};

// Função para atualizar projeto (tenta IndexedDB primeiro, depois localStorage)
export const updateProject = async (project: Project): Promise<void> => {
  try {
    // Tentar IndexedDB primeiro
    await updateProjectInIndexedDB(project);
  } catch (indexedDBError) {
    // Se IndexedDB falhar, usar localStorage
    console.warn('IndexedDB não disponível, usando localStorage:', indexedDBError);
    
    const projectSize = JSON.stringify(project).length;
    const maxSize = 4 * 1024 * 1024; // 4MB
    
    if (projectSize > maxSize) {
      throw new Error('As imagens são muito grandes. Por favor, reduza o número ou tamanho das imagens.');
    }

    const existingProjects = getLocalStorageItem('revela_projects');
    const projects = existingProjects ? JSON.parse(existingProjects) : [];
    const index = projects.findIndex((p: Project) => p.id === project.id);
    
    if (index !== -1) {
      projects[index] = project;
    } else {
      projects.push(project);
    }
    
    try {
      if (!setLocalStorageItem('revela_projects', JSON.stringify(projects))) {
        throw new Error('Não foi possível salvar no localStorage');
      }
    } catch (storageError: any) {
      if (storageError.name === 'QuotaExceededError') {
        throw new Error('Espaço de armazenamento insuficiente. Por favor, exclua alguns projetos antigos ou reduza o número de imagens.');
      }
      throw storageError;
    }
  }
};

// Função para obter todos os projetos (tenta IndexedDB primeiro, depois localStorage)
export const getAllProjects = async (): Promise<Project[]> => {
  const allProjects: Project[] = [];
  const projectIds = new Set<string>();

  // Tentar IndexedDB primeiro
  try {
    const indexedProjects = await getAllProjectsFromIndexedDB();
    indexedProjects.forEach(project => {
      if (!projectIds.has(project.id)) {
        allProjects.push(project);
        projectIds.add(project.id);
      }
    });
  } catch (error) {
    console.warn('Erro ao ler do IndexedDB, tentando localStorage:', error);
  }

  // Também buscar do localStorage e combinar
  try {
    const stored = getLocalStorageItem('revela_projects');
    if (stored) {
      const localProjects = JSON.parse(stored);
      localProjects.forEach((project: Project) => {
        if (!projectIds.has(project.id)) {
          allProjects.push(project);
          projectIds.add(project.id);
        }
      });
    }
  } catch (error) {
    console.error('Erro ao ler do localStorage:', error);
  }

  // Ordenar por data de criação (mais recentes primeiro)
  return allProjects.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

// Interface para backup
export interface BackupData {
  version: string;
  exportDate: string;
  projects: Project[];
  metadata?: {
    totalProjects: number;
    totalBeforeImages: number;
    totalAfterImages: number;
  };
}

// Exportar todos os projetos como backup (JSON)
export const exportBackup = async (): Promise<BackupData> => {
  const projects = await getAllProjects();
  
  // Calcular metadados
  const totalBeforeImages = projects.reduce((sum, p) => sum + p.beforeImages.length, 0);
  const totalAfterImages = projects.reduce((sum, p) => sum + p.afterImages.length, 0);
  
  const backup: BackupData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    projects,
    metadata: {
      totalProjects: projects.length,
      totalBeforeImages,
      totalAfterImages,
    },
  };
  
  return backup;
};

// Importar backup e restaurar projetos
export const importBackup = async (backupData: BackupData): Promise<{ success: number; failed: number; errors: string[] }> => {
  const results = { success: 0, failed: 0, errors: [] as string[] };
  
  if (!backupData.projects || !Array.isArray(backupData.projects)) {
    throw new Error('Formato de backup inválido: projetos não encontrados');
  }
  
  // Validar e importar cada projeto
  for (const project of backupData.projects) {
    try {
      // Validar estrutura do projeto
      if (!project.id || !project.name || !project.date || !project.createdAt) {
        results.failed++;
        results.errors.push(`Projeto inválido: ${project.name || 'sem nome'}`);
        continue;
      }
      
      // Garantir que arrays de imagens existem
      const validProject: Project = {
        id: project.id,
        name: project.name,
        date: project.date,
        createdAt: project.createdAt,
        beforeImages: Array.isArray(project.beforeImages) ? project.beforeImages : [],
        afterImages: Array.isArray(project.afterImages) ? project.afterImages : [],
        notes: project.notes || undefined,
      };
      
      // Salvar projeto (substitui se já existir)
      await saveProjectToIndexedDB(validProject);
      results.success++;
    } catch (error) {
      results.failed++;
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      results.errors.push(`Erro ao importar ${project.name || 'projeto'}: ${errorMessage}`);
    }
  }
  
  return results;
};

// Backup automático (salva no localStorage como fallback)
export const enableAutoBackup = (): void => {
  if (typeof window === 'undefined') return;
  
  // Salvar preferência
  setLocalStorageItem('revela_auto_backup', 'enabled');
  
  // Criar backup inicial
  exportBackup().then(backup => {
    setLocalStorageItem('revela_last_backup', JSON.stringify(backup));
    setLocalStorageItem('revela_backup_date', new Date().toISOString());
  }).catch(error => {
    console.error('Erro ao criar backup automático:', error);
  });
};

// Desabilitar backup automático
export const disableAutoBackup = (): void => {
  if (typeof window === 'undefined') return;
  setLocalStorageItem('revela_auto_backup', 'disabled');
};

// Verificar se backup automático está habilitado
export const isAutoBackupEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return getLocalStorageItem('revela_auto_backup') === 'enabled';
};

// Obter último backup automático
export const getLastAutoBackup = (): BackupData | null => {
  if (typeof window === 'undefined') return null;
  const backupStr = getLocalStorageItem('revela_last_backup');
  if (!backupStr) return null;
  try {
    return JSON.parse(backupStr) as BackupData;
  } catch {
    return null;
  }
};

// ========== GERENCIAMENTO DE PASTAS ==========

// Obter todas as pastas
export const getAllFolders = (): Promise<Folder[]> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve([]);
      return;
    }

    try {
      const stored = getLocalStorageItem('revela_folders');
      if (stored) {
        const folders = JSON.parse(stored) as Folder[];
        resolve(folders.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
      } else {
        resolve([]);
      }
    } catch (error) {
      console.error('Erro ao ler pastas:', error);
      resolve([]);
    }
  });
};

// Criar nova pasta
export const createFolder = async (name: string, color?: string): Promise<Folder> => {
  if (typeof window === 'undefined') {
    throw new Error('Não é possível criar pasta no servidor');
  }

  const folders = await getAllFolders();
  
  // Verificar se já existe pasta com mesmo nome
  if (folders.some(f => f.name.toLowerCase() === name.toLowerCase())) {
    throw new Error('Já existe uma pasta com este nome');
  }

  const newFolder: Folder = {
    id: `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: name.trim(),
    color: color || undefined,
    createdAt: new Date().toISOString(),
  };

  folders.push(newFolder);
  setLocalStorageItem('revela_folders', JSON.stringify(folders));

  return newFolder;
};

// Atualizar pasta
export const updateFolder = async (folderId: string, updates: { name?: string; color?: string }): Promise<void> => {
  if (typeof window === 'undefined') {
    throw new Error('Não é possível atualizar pasta no servidor');
  }

  const folders = await getAllFolders();
  const folderIndex = folders.findIndex(f => f.id === folderId);

  if (folderIndex === -1) {
    throw new Error('Pasta não encontrada');
  }

  // Verificar se novo nome já existe (se estiver mudando o nome)
  if (updates.name && updates.name !== folders[folderIndex].name) {
    if (folders.some(f => f.id !== folderId && f.name.toLowerCase() === updates.name!.toLowerCase())) {
      throw new Error('Já existe uma pasta com este nome');
    }
  }

  folders[folderIndex] = {
    ...folders[folderIndex],
    ...updates,
  };

  setLocalStorageItem('revela_folders', JSON.stringify(folders));
};

// Deletar pasta
export const deleteFolder = async (folderId: string): Promise<void> => {
  if (typeof window === 'undefined') {
    throw new Error('Não é possível deletar pasta no servidor');
  }

  const folders = await getAllFolders();
  const filteredFolders = folders.filter(f => f.id !== folderId);

  if (filteredFolders.length === folders.length) {
    throw new Error('Pasta não encontrada');
  }

  setLocalStorageItem('revela_folders', JSON.stringify(filteredFolders));

  // Mover projetos desta pasta para "sem pasta" (folderId = undefined)
  const allProjects = await getAllProjects();
  const projectsToUpdate = allProjects.filter(p => p.folderId === folderId);
  
  for (const project of projectsToUpdate) {
    const updatedProject = { ...project, folderId: undefined };
    await updateProject(updatedProject);
  }
};

// Mover projeto para pasta
export const moveProjectToFolder = async (projectId: string, folderId: string | undefined): Promise<void> => {
  const project = await getProjectFromIndexedDB(projectId);
  if (!project) {
    throw new Error('Projeto não encontrado');
  }

  // Se folderId for fornecido, verificar se a pasta existe
  if (folderId) {
    const folders = await getAllFolders();
    if (!folders.some(f => f.id === folderId)) {
      throw new Error('Pasta não encontrada');
    }
  }

  const updatedProject = { ...project, folderId };
  await updateProject(updatedProject);
};

