import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  checkSession: () => Promise<void>;
}

/**
 * Hook customizado para gerenciar autenticação
 * Previne race conditions e melhora o tratamento de erros
 */
export function useAuth(redirectToLogin = true): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Usar refs para prevenir race conditions
  const isCheckingRef = useRef(false);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const mountedRef = useRef(true);

  const checkSession = useCallback(async () => {
    // Prevenir múltiplas chamadas simultâneas
    if (isCheckingRef.current) {
      return;
    }

    isCheckingRef.current = true;
    setError(null);

    try {
      // Adicionar timeout para evitar travamentos
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao verificar sessão')), 10000);
      });

      const sessionPromise = supabase.auth.getSession();
      const { data: { session }, error: sessionError } = await Promise.race([
        sessionPromise,
        timeoutPromise,
      ]) as any;
      
      if (!mountedRef.current) return;

      if (sessionError) {
        console.error('Erro ao verificar sessão:', sessionError);
        setError(sessionError.message);
        setUser(null);
        // Não redirecionar imediatamente em caso de erro de rede
        // Permitir que o usuário tente novamente
        if (redirectToLogin && !sessionError.message.includes('network') && !sessionError.message.includes('fetch')) {
          router.push('/login');
        }
        return;
      }

      setUser(session?.user ?? null);
      
      // Só redirecionar se realmente não houver sessão (não em caso de erro)
      if (!session && redirectToLogin) {
        // Pequeno delay para evitar loops
        setTimeout(() => {
          if (mountedRef.current && !user) {
            router.push('/login');
          }
        }, 100);
      }
    } catch (err: any) {
      console.error('Erro inesperado ao verificar autenticação:', err);
      if (mountedRef.current) {
        const errorMessage = err.message || 'Erro ao verificar autenticação';
        setError(errorMessage);
        setUser(null);
        // Não redirecionar em caso de timeout ou erro de rede
        if (redirectToLogin && !errorMessage.includes('Timeout') && !errorMessage.includes('network') && !errorMessage.includes('fetch')) {
          setTimeout(() => {
            if (mountedRef.current && !user) {
              router.push('/login');
            }
          }, 100);
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        isCheckingRef.current = false;
      }
    }
  }, [router, redirectToLogin]); // Removido 'user' das dependências para evitar loops

  useEffect(() => {
    mountedRef.current = true;
    
    // Verificar sessão inicial
    checkSession();

    // Configurar listener de mudanças de autenticação
    try {
      const { data: { subscription }, error: subscriptionError } = supabase.auth.onAuthStateChange(
        async (event: string, session: Session | null) => {
          if (!mountedRef.current) return;

          // Prevenir atualizações durante verificação
          if (isCheckingRef.current) {
            return;
          }

          try {
            setUser(session?.user ?? null);
            
            // Só redirecionar se realmente não houver sessão e não for um erro de rede
            if (!session && redirectToLogin && event !== 'TOKEN_REFRESHED') {
              // Pequeno delay para evitar loops
              setTimeout(() => {
                if (mountedRef.current && !user) {
                  router.push('/login');
                }
              }, 100);
            } else if (session && event === 'SIGNED_IN') {
              // Recarregar sessão após login
              await checkSession();
            }
          } catch (err) {
            console.error('Erro no listener de autenticação:', err);
          }
        }
      );

      if (subscriptionError) {
        console.error('Erro ao criar subscription de autenticação:', subscriptionError);
      } else {
        subscriptionRef.current = subscription;
      }
    } catch (err) {
      console.error('Erro ao configurar listener de autenticação:', err);
    }

    return () => {
      mountedRef.current = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [checkSession, router, redirectToLogin]);

  return {
    user,
    loading,
    error,
    checkSession,
  };
}

