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

// Avisa o app (ex.: Cofre Revela) que um projeto mudou. Não dispara em gravações
// feitas pela própria sincronização, para não criar um vai-e-volta.
export const PROJECT_CHANGED_EVENT = 'revela:project-changed';
// deleted = foi para a lixeira; purged = apagado de vez (da lixeira)
export type ProjectChangedDetail = { id: string; deleted?: boolean; purged?: boolean };

// Exclusões ainda não registradas no Cofre (ex.: cofre trancado ou sem internet).
// O Cofre lê esta lista na próxima sincronização para avisar os outros aparelhos.
const PENDING_DELETES_KEY = 'revela_pending_deletes';

export function getPendingDeletes(): Record<string, string> {
  try {
    return JSON.parse(getLocalStorageItem(PENDING_DELETES_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

export function clearPendingDelete(id: string): void {
  const map = getPendingDeletes();
  if (!(id in map)) return;
  delete map[id];
  setLocalStorageItem(PENDING_DELETES_KEY, JSON.stringify(map));
}

function markPendingDelete(id: string, deletedAt: string): void {
  const map = getPendingDeletes();
  const limit = Date.now() - 2 * TRASH_DAYS * 24 * 60 * 60 * 1000;
  Object.keys(map).forEach((k) => {
    if (new Date(map[k]).getTime() < limit) delete map[k];
  });
  map[id] = deletedAt;
  setLocalStorageItem(PENDING_DELETES_KEY, JSON.stringify(map));
}

// Projetos apagados de vez (da lixeira) ainda não avisados ao Cofre.
const PENDING_PURGES_KEY = 'revela_pending_purges';

export function getPendingPurges(): Record<string, string> {
  try {
    return JSON.parse(getLocalStorageItem(PENDING_PURGES_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

export function clearPendingPurge(id: string): void {
  const map = getPendingPurges();
  if (!(id in map)) return;
  delete map[id];
  setLocalStorageItem(PENDING_PURGES_KEY, JSON.stringify(map));
}

function markPendingPurge(id: string, purgedAt: string): void {
  const map = getPendingPurges();
  const limit = Date.now() - 2 * TRASH_DAYS * 24 * 60 * 60 * 1000;
  Object.keys(map).forEach((k) => {
    if (new Date(map[k]).getTime() < limit) delete map[k];
  });
  map[id] = purgedAt;
  setLocalStorageItem(PENDING_PURGES_KEY, JSON.stringify(map));
}

function emitProjectChanged(detail: ProjectChangedDetail) {
  if (typeof window === 'undefined') return;
  if (detail.purged) markPendingPurge(detail.id, new Date().toISOString());
  else if (detail.deleted) markPendingDelete(detail.id, new Date().toISOString());
  else {
    clearPendingDelete(detail.id);
    clearPendingPurge(detail.id);
  }
  try {
    window.dispatchEvent(new CustomEvent<ProjectChangedDetail>(PROJECT_CHANGED_EVENT, { detail }));
  } catch {
    /* ignore */
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
  unit?: string; // Unidade de medida (cm, mm, etc.) — legado
  scale?: number; // Escala de conversão (pixels por unidade) — legado
  // 'normalized' = coordenadas de 0 a 1 em relação à largura/altura da foto
  // (independe do tamanho da tela e sobrevive à recompressão do backup na nuvem).
  // Ausente = medida antiga, salva em pixels da tela.
  coordSpace?: 'normalized';
  // Linha de calibração: um objeto de tamanho conhecido na foto (ex.: régua de papel)
  isCalibration?: boolean;
  calibrationCm?: number; // Tamanho real da linha de calibração, em cm
}

// Marco de evolução do tratamento (Revela Premium)
export interface EvolutionImage {
  id: string;
  image: string; // Imagem em base64 ou URL
  date: string; // ISO string (YYYY-MM-DD ou completa)
  label?: string; // Título opcional (ex: "30 dias", "Sessão 2")
  notes?: string; // Observação opcional
  momentType?: string; // Tipo de momento (ex: 'antes', '30d', '60d', '90d', 'final')
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
  // Imagens de evolução ao longo do tempo (Premium)
  evolutionImages?: EvolutionImage[];
  createdAt: string;
  // Última alteração (ISO). Usado pela nuvem para não sobrescrever uma versão mais nova.
  // Projetos antigos não têm; nesse caso vale createdAt.
  updatedAt?: string;
  ownerEmail?: string; // Email do usuário que criou o projeto (escopo por conta)
  // Na lixeira desde esta data (ISO). Fica guardado só neste aparelho por TRASH_DAYS dias.
  deletedAt?: string;
}

export const TRASH_DAYS = 30;

// Salvar projeto no IndexedDB
export const saveProjectToIndexedDB = (project: Project): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('RevelaDB', 1);

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
export const getAllProjectsFromIndexedDB = (options: { includeTrash?: boolean } = {}): Promise<Project[]> => {
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
        const all: Project[] = getAllRequest.result || [];
        resolve(options.includeTrash ? all : all.filter((p) => !p.deletedAt));
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

// ─── Lixeira ─────────────────────────────────────────────────────────────

/** Move para a lixeira (some da lista, mas pode ser restaurado por TRASH_DAYS dias). */
export const moveProjectToTrash = async (id: string, options: { silent?: boolean; deletedAt?: string } = {}): Promise<void> => {
  const project = await getProjectFromIndexedDB(id);
  if (!project) return;
  // updatedAt não muda: a lixeira é só deste aparelho e não conta como edição
  await updateProjectInIndexedDB({ ...project, deletedAt: options.deletedAt || new Date().toISOString() });
  if (!options.silent) emitProjectChanged({ id, deleted: true });
};

/** Tira da lixeira. Conta como alteração, então volta também para o Cofre e os outros aparelhos. */
export const restoreProjectFromTrash = async (id: string): Promise<void> => {
  const project = await getProjectFromIndexedDB(id);
  if (!project) return;
  const { deletedAt: _removed, ...rest } = project;
  await updateProject(rest as Project);
};

export const getTrashedProjects = async (ownerEmail: string | null): Promise<Project[]> => {
  const all = await getAllProjectsFromIndexedDB({ includeTrash: true });
  return all
    .filter((p) => p.deletedAt && (!ownerEmail || p.ownerEmail === ownerEmail))
    .sort((a, b) => (b.deletedAt || '').localeCompare(a.deletedAt || ''));
};

export const trashDaysLeft = (p: Project): number => {
  const ms = new Date(p.deletedAt || 0).getTime() + TRASH_DAYS * 24 * 60 * 60 * 1000 - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
};

/** Apagar para sempre (da lixeira): some deste aparelho e, com o Cofre, de todos os aparelhos. */
export const purgeProjectFromTrash = async (id: string): Promise<void> => {
  await deleteProjectFromIndexedDB(id, { silent: true });
  emitProjectChanged({ id, deleted: true, purged: true });
};

/** Apaga de vez o que está na lixeira há mais de TRASH_DAYS dias. */
export const purgeExpiredTrash = async (): Promise<number> => {
  const all = await getAllProjectsFromIndexedDB({ includeTrash: true });
  const expired = all.filter((p) => p.deletedAt && trashDaysLeft(p) === 0);
  for (const p of expired) await deleteProjectFromIndexedDB(p.id, { silent: true });
  return expired.length;
};

// Deletar projeto do IndexedDB (definitivo)
export const deleteProjectFromIndexedDB = async (id: string, options: { silent?: boolean } = {}): Promise<void> => {
  if (!options.silent) emitProjectChanged({ id, deleted: true });
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
export const saveProject = async (input: Project): Promise<void> => {
  await saveProjectInner(input);
  emitProjectChanged({ id: input.id });
};

const saveProjectInner = async (input: Project): Promise<void> => {
  const project: Project = { ...input, updatedAt: new Date().toISOString() };
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
export const updateProject = async (input: Project): Promise<void> => {
  await updateProjectInner(input);
  emitProjectChanged({ id: input.id });
};

const updateProjectInner = async (input: Project): Promise<void> => {
  const project: Project = { ...input, updatedAt: new Date().toISOString() };
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
        if (!projectIds.has(project.id) && !project.deletedAt) {
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

// Obter todos os projetos de um usuário específico (ou todos, se ownerEmail for null)
export const getAllProjectsForUser = async (ownerEmail: string | null): Promise<Project[]> => {
  const all = await getAllProjects();
  if (!ownerEmail) return all;
  return all.filter((p) => p.ownerEmail === ownerEmail);
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

// O antigo "Backup automático" guardava uma cópia no próprio navegador — não protegia
// contra perda do aparelho e ocupava o pouco espaço do localStorage. Foi retirado;
// isto apaga o que tenha ficado de quem usava. Backup de verdade = Exportar backup ou Cofre.
export const retireAutoBackup = (): void => {
  if (typeof window === 'undefined') return;
  try {
    ['revela_auto_backup', 'revela_last_backup', 'revela_backup_failed', 'revela_backup_date'].forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
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

