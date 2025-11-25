/**
 * Utilitário para coletar informações de debug do navegador/dispositivo
 * Ajuda a identificar problemas de compatibilidade
 */

'use client';

export interface DebugInfo {
  timestamp: string;
  userAgent: string;
  platform: string;
  language: string;
  cookieEnabled: boolean;
  onLine: boolean;
  screen: {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
    colorDepth: number;
    pixelDepth: number;
  };
  window: {
    innerWidth: number;
    innerHeight: number;
    outerWidth: number;
    outerHeight: number;
  };
  storage: {
    localStorage: boolean;
    sessionStorage: boolean;
    indexedDB: boolean;
  };
  features: {
    serviceWorker: boolean;
    webGL: boolean;
    canvas: boolean;
    webAudio: boolean;
  };
  errors: string[];
  warnings: string[];
}

/**
 * Coleta informações de debug do navegador/dispositivo
 */
export function collectDebugInfo(): DebugInfo {
  const info: DebugInfo = {
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    platform: typeof navigator !== 'undefined' ? navigator.platform : 'N/A',
    language: typeof navigator !== 'undefined' ? navigator.language : 'N/A',
    cookieEnabled: typeof navigator !== 'undefined' ? navigator.cookieEnabled : false,
    onLine: typeof navigator !== 'undefined' ? navigator.onLine : false,
    screen: {
      width: typeof screen !== 'undefined' ? screen.width : 0,
      height: typeof screen !== 'undefined' ? screen.height : 0,
      availWidth: typeof screen !== 'undefined' ? screen.availWidth : 0,
      availHeight: typeof screen !== 'undefined' ? screen.availHeight : 0,
      colorDepth: typeof screen !== 'undefined' ? screen.colorDepth : 0,
      pixelDepth: typeof screen !== 'undefined' ? screen.pixelDepth : 0,
    },
    window: {
      innerWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
      innerHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
      outerWidth: typeof window !== 'undefined' ? window.outerWidth : 0,
      outerHeight: typeof window !== 'undefined' ? window.outerHeight : 0,
    },
    storage: {
      localStorage: checkLocalStorage(),
      sessionStorage: checkSessionStorage(),
      indexedDB: checkIndexedDB(),
    },
    features: {
      serviceWorker: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
      webGL: checkWebGL(),
      canvas: checkCanvas(),
      webAudio: typeof window !== 'undefined' && 'AudioContext' in window,
    },
    errors: [],
    warnings: [],
  };

  return info;
}

function checkLocalStorage(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

function checkSessionStorage(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const test = '__sessionStorage_test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

function checkIndexedDB(): boolean {
  try {
    return typeof window !== 'undefined' && 'indexedDB' in window && !!window.indexedDB;
  } catch {
    return false;
  }
}

function checkWebGL(): boolean {
  try {
    if (typeof document === 'undefined') return false;
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

function checkCanvas(): boolean {
  try {
    if (typeof document === 'undefined') return false;
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext && canvas.getContext('2d'));
  } catch {
    return false;
  }
}

/**
 * Exporta informações de debug como string JSON
 */
export function exportDebugInfo(): string {
  const info = collectDebugInfo();
  return JSON.stringify(info, null, 2);
}

/**
 * Copia informações de debug para clipboard (se disponível)
 */
export async function copyDebugInfoToClipboard(): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return false;
    }
    const info = exportDebugInfo();
    await navigator.clipboard.writeText(info);
    return true;
  } catch {
    return false;
  }
}

/**
 * Detecta problemas comuns e retorna lista de avisos
 */
export function detectCommonIssues(): string[] {
  const issues: string[] = [];
  const info = collectDebugInfo();

  if (!info.storage.localStorage) {
    issues.push('⚠️ localStorage não está disponível - pode causar problemas ao salvar projetos');
  }

  if (!info.storage.indexedDB) {
    issues.push('⚠️ IndexedDB não está disponível - armazenamento limitado ao localStorage');
  }

  if (!info.storage.sessionStorage) {
    issues.push('⚠️ sessionStorage não está disponível');
  }

  if (!info.onLine) {
    issues.push('⚠️ Dispositivo está offline');
  }

  if (!info.features.canvas) {
    issues.push('⚠️ Canvas não está disponível - compressão de imagens pode falhar');
  }

  // Verificar memória (se disponível)
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    const usedMB = memory.usedJSHeapSize / 1048576;
    const limitMB = memory.jsHeapSizeLimit / 1048576;
    const percentage = (usedMB / limitMB) * 100;
    
    if (percentage > 90) {
      issues.push(`⚠️ Uso de memória muito alto: ${percentage.toFixed(1)}% (${usedMB.toFixed(0)}MB / ${limitMB.toFixed(0)}MB)`);
    }
  }

  return issues;
}

