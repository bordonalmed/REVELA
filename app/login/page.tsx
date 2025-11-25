'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SafeImage } from '@/components/safe-image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Footer } from '@/components/footer';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8"
      style={{ backgroundColor: '#1A2B32' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6 sm:mb-8">
                <div className="relative w-[200px] sm:w-[240px] md:w-[280px] h-auto">
                  <SafeImage
                    src="/revela3.png"
                    alt="Revela Logo"
                    width={280}
                    height={160}
                    className="w-full h-auto object-contain"
                    priority
                    unoptimized
                    sizes="(max-width: 640px) 200px, (max-width: 768px) 240px, 280px"
                    onError={() => {
                      console.error('Erro ao carregar logo na página de login');
                    }}
                  />
                </div>
        </div>

        {/* Card do Formulário */}
        <div 
          className="w-full rounded-lg p-6 sm:p-8"
          style={{ 
            backgroundColor: 'rgba(232, 220, 192, 0.05)', 
            border: '1px solid rgba(232, 220, 192, 0.1)' 
          }}
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-light mb-2" style={{ color: '#E8DCC0' }}>
              Entrar
            </h1>
            <p className="text-sm sm:text-base" style={{ color: '#E8DCC0', opacity: 0.8 }}>
              Entre com seu email e senha
            </p>
          </div>

          <form onSubmit={handleLogin}>
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

              <div className="space-y-2">
                <Label htmlFor="email" style={{ color: '#E8DCC0' }}>
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-transparent border-gray-600 text-white placeholder:text-gray-500 focus:border-[#00A88F]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" style={{ color: '#E8DCC0' }}>
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-transparent border-gray-600 text-white placeholder:text-gray-500 focus:border-[#00A88F]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg px-4 py-3 text-sm sm:text-base font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: '#00A88F',
                  color: '#FFFFFF'
                }}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>

              <div className="text-center space-y-3 pt-4">
                <p className="text-sm" style={{ color: '#E8DCC0', opacity: 0.8 }}>
                  Não tem uma conta?{' '}
                  <Link 
                    href="/signup" 
                    className="hover:opacity-80 transition-opacity underline"
                    style={{ color: '#00A88F' }}
                  >
                    Criar conta
                  </Link>
                </p>
                <Link 
                  href="/" 
                  className="text-sm hover:opacity-80 transition-opacity inline-block"
                  style={{ color: '#E8DCC0', opacity: 0.7 }}
                >
                  ← Voltar para início
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
