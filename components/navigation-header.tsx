'use client';

import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Home, LogOut, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function NavigationHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const isDashboard = pathname === '/dashboard';

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      alert('Erro ao sair. Tente novamente.');
    }
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 border-b" 
      style={{ 
        backgroundColor: 'rgba(26, 43, 50, 0.95)', 
        backdropFilter: 'blur(10px)', 
        borderColor: 'rgba(232, 220, 192, 0.1)' 
      }}
    >
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logotipo à esquerda */}
          <Link href="/dashboard">
            <div className="relative w-[60px] sm:w-[80px] h-auto">
              <Image 
                src="/revela3.png" 
                alt="Revela Logo" 
                width={80} 
                height={46} 
                className="w-full h-auto object-contain" 
                priority 
              />
            </div>
          </Link>

          {/* Ícones à direita */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Na dashboard: botão Configurações e botão Sair */}
            {/* Nas demais páginas: botão Dashboard e botão Sair */}
            {isDashboard ? (
              <button
                onClick={() => router.push('/settings')}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Configurações"
                style={{ color: '#E8DCC0' }}
              >
                <Settings className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Dashboard"
                style={{ color: '#E8DCC0' }}
              >
                <Home className="w-5 h-5" />
              </button>
            )}

            {/* Botão Sair */}
            <button
              onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Sair"
                style={{ color: '#E8DCC0' }}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

