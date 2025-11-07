'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { NavigationHeader } from '@/components/navigation-header';
import { Footer } from '@/components/footer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) router.push('/login');
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (session?.user) {
      setEmail(session.user.email || '');
    }
    if (!session) {
      router.push('/login');
    }
    setLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      setUpdating(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setUpdating(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccess('Senha atualizada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setError(error.message || 'Erro ao atualizar senha');
    } finally {
      setUpdating(false);
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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#1A2B32' }}>
      <NavigationHeader />
      
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8 max-w-2xl pt-20 sm:pt-24">
        <h1 
          className="text-2xl sm:text-3xl font-light mb-6" 
          style={{ color: '#E8DCC0' }}
        >
          Configurações da Conta
        </h1>

        {/* Informações da Conta */}
        <div 
          className="rounded-lg p-4 sm:p-6 mb-6 border" 
          style={{ 
            backgroundColor: 'rgba(232, 220, 192, 0.05)', 
            borderColor: 'rgba(232, 220, 192, 0.1)' 
          }}
        >
          <h2 
            className="text-lg sm:text-xl font-light mb-4" 
            style={{ color: '#E8DCC0' }}
          >
            Informações da Conta
          </h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label style={{ color: '#E8DCC0' }}>Email</Label>
              <Input
                type="email"
                value={email}
                disabled
                className="bg-transparent border-gray-600 text-white placeholder:text-gray-500"
              />
              <p className="text-xs" style={{ color: '#E8DCC0', opacity: 0.7 }}>
                O email não pode ser alterado
              </p>
            </div>
          </div>
        </div>

        {/* Alterar Senha */}
        <div 
          className="rounded-lg p-4 sm:p-6 border" 
          style={{ 
            backgroundColor: 'rgba(232, 220, 192, 0.05)', 
            borderColor: 'rgba(232, 220, 192, 0.1)' 
          }}
        >
          <h2 
            className="text-lg sm:text-xl font-light mb-4" 
            style={{ color: '#E8DCC0' }}
          >
            Alterar Senha
          </h2>

          <form onSubmit={handleUpdatePassword}>
            <div className="space-y-4">
              {error && (
                <div 
                  className="p-3 text-sm rounded-md border"
                  style={{ 
                    backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5'
                  }}
                >
                  {error}
                </div>
              )}

              {success && (
                <div 
                  className="p-3 text-sm rounded-md border"
                  style={{ 
                    backgroundColor: 'rgba(0, 168, 143, 0.1)', 
                    borderColor: 'rgba(0, 168, 143, 0.3)',
                    color: '#00A88F'
                  }}
                >
                  {success}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword" style={{ color: '#E8DCC0' }}>
                  Nova Senha
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={updating}
                  className="bg-transparent border-gray-600 text-white placeholder:text-gray-500 focus:border-[#00A88F]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" style={{ color: '#E8DCC0' }}>
                  Confirmar Nova Senha
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={updating}
                  className="bg-transparent border-gray-600 text-white placeholder:text-gray-500 focus:border-[#00A88F]"
                />
              </div>

              <button
                type="submit"
                disabled={updating}
                className="w-full rounded-lg px-4 py-3 text-sm sm:text-base font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: '#00A88F',
                  color: '#FFFFFF'
                }}
              >
                {updating ? 'Atualizando...' : 'Atualizar Senha'}
              </button>
            </div>
          </form>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}


