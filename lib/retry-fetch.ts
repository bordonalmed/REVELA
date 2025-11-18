/**
 * Função helper para fazer requisições com retry automático
 * Útil para lidar com problemas de conexão intermitentes
 */

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
  retryableErrors: ['AbortError', 'NetworkError', 'Failed to fetch', 'Network request failed'],
};

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const opts = { ...DEFAULT_OPTIONS, ...retryOptions };
  let lastError: Error | null = null;

  // Verificar se estamos no ambiente do navegador (AbortController pode não estar disponível em todos os ambientes)
  const hasAbortController = typeof AbortController !== 'undefined';

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      let timeoutId: NodeJS.Timeout | null = null;
      let controller: AbortController | null = null;

      if (hasAbortController) {
        controller = new AbortController();
        timeoutId = setTimeout(() => controller!.abort(), opts.timeout);
      }

      const fetchOptions: RequestInit = {
        ...options,
        ...(controller ? { signal: controller.signal } : {}),
      };

      const response = await fetch(url, fetchOptions).finally(() => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      });

      // Se a resposta for OK, retornar
      if (response.ok || attempt === opts.maxRetries) {
        return response;
      }

      // Se não for OK e não for o último attempt, tentar novamente
      if (attempt < opts.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, opts.retryDelay * (attempt + 1)));
        continue;
      }

      return response;
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message || error?.toString() || '';
      const errorName = error?.name || '';

      // Verificar se é um erro que deve ser retentado
      const shouldRetry = opts.retryableErrors.some(
        (retryableError) =>
          errorMessage.includes(retryableError) || errorName.includes(retryableError)
      );

      if (!shouldRetry || attempt === opts.maxRetries) {
        throw error;
      }

      // Aguardar antes de tentar novamente (backoff exponencial)
      const delay = opts.retryDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Falha ao fazer requisição após múltiplas tentativas');
}

