import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { fetchWithRetry } from './retry-fetch';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Função para criar cliente Supabase de forma segura
function createSupabaseClient(): SupabaseClient | null {
  // Verificar se estamos no cliente (browser)
  if (typeof window === 'undefined') {
    // No servidor, retornar null se variáveis não estiverem definidas
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase: Variáveis de ambiente não configuradas no servidor');
      return null;
    }
  }

  // Validação das variáveis de ambiente
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      'Supabase: Variáveis de ambiente não configuradas. ' +
      'Por favor, crie um arquivo .env.local com suas credenciais do Supabase.'
    );
    // Em vez de lançar erro, retornar null e permitir que a aplicação continue
    // O erro será tratado quando tentar usar o cliente
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'sb-auth-token',
      },
      global: {
        headers: {
          'x-client-info': 'revela-web',
        },
        // Usar fetch com retry para lidar com problemas de conexão
        fetch: async (url, options = {}) => {
          try {
            return await fetchWithRetry(url.toString(), options as RequestInit, {
              maxRetries: 2,
              retryDelay: 1000,
              timeout: 30000,
            });
          } catch (error: any) {
            // Se ainda falhar após retries, logar e relançar
            console.error('Erro ao fazer requisição para Supabase:', error);
            throw error;
          }
        },
      },
    });
  } catch (error) {
    console.error('Erro ao criar cliente Supabase:', error);
    return null;
  }
}

// Criar cliente Supabase
let supabaseClient: SupabaseClient | null = null;

// Função para obter o cliente Supabase (lazy initialization)
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient();
    
    if (!supabaseClient) {
      // Se ainda não conseguir criar, lançar erro apenas quando tentar usar
      throw new Error(
        'Supabase não está configurado. ' +
        'Por favor, verifique as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      );
    }
  }
  
  return supabaseClient;
}

// Exportar cliente diretamente (para compatibilidade com código existente)
// Mas com verificação de segurança
export const supabase = (() => {
  try {
    return getSupabaseClient();
  } catch (error) {
    // Retornar um objeto mock que não quebra a aplicação
    console.error('Supabase não disponível:', error);
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: null, error: { message: 'Supabase não configurado' } }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Supabase não configurado' } }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: { message: 'Supabase não configurado' } }) }),
        delete: () => ({ eq: () => Promise.resolve({ data: null, error: { message: 'Supabase não configurado' } }) }),
      }),
    } as any;
  }
})();

export type Database = {
  public: {
    Tables: {
      before_after_photos: {
        Row: {
          id: string;
          user_id: string;
          before_image_url: string;
          after_image_url: string;
          title: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          before_image_url: string;
          after_image_url: string;
          title: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          before_image_url?: string;
          after_image_url?: string;
          title?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
