// Utilitários para armazenamento local (IndexedDB e localStorage)

export interface Project {
  id: string;
  name: string;
  date: string;
  beforeImages: string[];
  afterImages: string[];
  createdAt: string;
}

// Salvar projeto no IndexedDB
export const saveProjectToIndexedDB = (project: Project): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('RevelaDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const addRequest = store.add(project);

      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
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

// Obter um projeto específico do IndexedDB
export const getProjectFromIndexedDB = (id: string): Promise<Project | null> => {
  return new Promise((resolve) => {
    const request = indexedDB.open('RevelaDB', 1);

    request.onerror = () => {
      // Se IndexedDB falhar, tentar localStorage
      try {
        const stored = localStorage.getItem('revela_projects');
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
    };
    
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('projects')) {
        // Se não existir no IndexedDB, tentar localStorage
        try {
          const stored = localStorage.getItem('revela_projects');
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
        return;
      }

      const transaction = db.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        if (getRequest.result) {
          resolve(getRequest.result);
        } else {
          // Se não encontrar no IndexedDB, tentar localStorage
          try {
            const stored = localStorage.getItem('revela_projects');
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
        }
      };
      getRequest.onerror = () => {
        // Se erro, tentar localStorage
        try {
          const stored = localStorage.getItem('revela_projects');
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

// Deletar projeto do IndexedDB
export const deleteProjectFromIndexedDB = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('RevelaDB', 1);

    request.onerror = () => {
      // Se IndexedDB falhar, tentar localStorage
      try {
        const stored = localStorage.getItem('revela_projects');
        if (stored) {
          const projects = JSON.parse(stored);
          const filtered = projects.filter((p: Project) => p.id !== id);
          localStorage.setItem('revela_projects', JSON.stringify(filtered));
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
          const stored = localStorage.getItem('revela_projects');
          if (stored) {
            const projects = JSON.parse(stored);
            const filtered = projects.filter((p: Project) => p.id !== id);
            localStorage.setItem('revela_projects', JSON.stringify(filtered));
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
          const stored = localStorage.getItem('revela_projects');
          if (stored) {
            const projects = JSON.parse(stored);
            const filtered = projects.filter((p: Project) => p.id !== id);
            localStorage.setItem('revela_projects', JSON.stringify(filtered));
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

    const existingProjects = localStorage.getItem('revela_projects');
    const projects = existingProjects ? JSON.parse(existingProjects) : [];
    projects.push(project);
    
    try {
      localStorage.setItem('revela_projects', JSON.stringify(projects));
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
        const stored = localStorage.getItem('revela_projects');
        if (stored) {
          const projects = JSON.parse(stored);
          const index = projects.findIndex((p: Project) => p.id === project.id);
          if (index !== -1) {
            projects[index] = project;
            localStorage.setItem('revela_projects', JSON.stringify(projects));
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
          const stored = localStorage.getItem('revela_projects');
          if (stored) {
            const projects = JSON.parse(stored);
            const index = projects.findIndex((p: Project) => p.id === project.id);
            if (index !== -1) {
              projects[index] = project;
              localStorage.setItem('revela_projects', JSON.stringify(projects));
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
          const stored = localStorage.getItem('revela_projects');
          if (stored) {
            const projects = JSON.parse(stored);
            const index = projects.findIndex((p: Project) => p.id === project.id);
            if (index !== -1) {
              projects[index] = project;
              localStorage.setItem('revela_projects', JSON.stringify(projects));
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

    const existingProjects = localStorage.getItem('revela_projects');
    const projects = existingProjects ? JSON.parse(existingProjects) : [];
    const index = projects.findIndex((p: Project) => p.id === project.id);
    
    if (index !== -1) {
      projects[index] = project;
    } else {
      projects.push(project);
    }
    
    try {
      localStorage.setItem('revela_projects', JSON.stringify(projects));
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
    const stored = localStorage.getItem('revela_projects');
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

