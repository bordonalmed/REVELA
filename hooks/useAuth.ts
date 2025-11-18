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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (!mountedRef.current) return;

      if (sessionError) {
        console.error('Erro ao verificar sessão:', sessionError);
        setError(sessionError.message);
        setUser(null);
        if (redirectToLogin) {
          router.push('/login');
        }
        return;
      }

      setUser(session?.user ?? null);
      
      if (!session && redirectToLogin) {
        router.push('/login');
      }
    } catch (err: any) {
      console.error('Erro inesperado ao verificar autenticação:', err);
      if (mountedRef.current) {
        setError(err.message || 'Erro ao verificar autenticação');
        setUser(null);
        if (redirectToLogin) {
          router.push('/login');
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        isCheckingRef.current = false;
      }
    }
  }, [router, redirectToLogin]);

  useEffect(() => {
    mountedRef.current = true;
    
    // Verificar sessão inicial
    checkSession();

    // Configurar listener de mudanças de autenticação
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event: string, session: Session | null) => {
          if (!mountedRef.current) return;

          // Prevenir atualizações durante verificação
          if (isCheckingRef.current) {
            return;
          }

          setUser(session?.user ?? null);
          
          if (!session && redirectToLogin) {
            router.push('/login');
          } else if (session && event === 'SIGNED_IN') {
            // Recarregar sessão após login
            await checkSession();
          }
        }
      );

      subscriptionRef.current = subscription;

      return () => {
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
        }
      };
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

