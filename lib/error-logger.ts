/**
 * Utilitário para logging de erros e diagnóstico
 * Ajuda a identificar problemas de instabilidade
 */

interface ErrorLog {
  timestamp: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  details?: any;
  userAgent?: string;
  url?: string;
  stack?: string;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 50; // Limitar quantidade de logs para não consumir muita memória

  /**
   * Log de erro
   */
  error(message: string, details?: any) {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      type: 'error',
      message,
      details,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      stack: new Error().stack,
    };

    this.addLog(log);
    console.error(`[ErrorLogger] ${message}`, details);
  }

  /**
   * Log de warning
   */
  warn(message: string, details?: any) {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      type: 'warning',
      message,
      details,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    this.addLog(log);
    console.warn(`[ErrorLogger] ${message}`, details);
  }

  /**
   * Log de informação
   */
  info(message: string, details?: any) {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      type: 'info',
      message,
      details,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    this.addLog(log);
    console.info(`[ErrorLogger] ${message}`, details);
  }

  /**
   * Adiciona log à lista
   */
  private addLog(log: ErrorLog) {
    this.logs.push(log);
    
    // Manter apenas os últimos N logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Em desenvolvimento, salvar no localStorage para debug
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      try {
        localStorage.setItem('revela_error_logs', JSON.stringify(this.logs));
      } catch (e) {
        // Ignorar erro se localStorage estiver cheio
      }
    }
  }

  /**
   * Obtém todos os logs
   */
  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  /**
   * Limpa os logs
   */
  clearLogs() {
    this.logs = [];
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('revela_error_logs');
      } catch (e) {
        // Ignorar erro
      }
    }
  }

  /**
   * Obtém logs do localStorage (útil para debug)
   */
  getStoredLogs(): ErrorLog[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem('revela_error_logs');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Erro ao ler logs do localStorage:', e);
    }
    
    return [];
  }

  /**
   * Exporta logs para string (útil para reportar problemas)
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Verifica problemas comuns e loga
   */
  checkCommonIssues() {
    if (typeof window === 'undefined') return;

    // Verificar se IndexedDB está disponível
    if (!window.indexedDB) {
      this.warn('IndexedDB não está disponível neste navegador');
    }

    // Verificar se localStorage está disponível
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
    } catch (e) {
      this.warn('localStorage não está disponível', e);
    }

    // Verificar se há problemas de memória
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1048576;
      const limitMB = memory.jsHeapSizeLimit / 1048576;
      
      if (usedMB / limitMB > 0.9) {
        this.warn('Uso de memória alto', { usedMB, limitMB, percentage: (usedMB / limitMB * 100).toFixed(2) + '%' });
      }
    }
  }
}

// Singleton
export const errorLogger = new ErrorLogger();

// Logar problemas comuns na inicialização
if (typeof window !== 'undefined') {
  errorLogger.checkCommonIssues();
  
  // Capturar erros não tratados
  window.addEventListener('error', (event) => {
    errorLogger.error('Erro não tratado', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });
  });

  // Capturar promessas rejeitadas não tratadas
  window.addEventListener('unhandledrejection', (event) => {
    errorLogger.error('Promessa rejeitada não tratada', {
      reason: event.reason,
    });
  });
}

