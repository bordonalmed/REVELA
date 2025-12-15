'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, LogOut, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SafeImage } from '@/components/safe-image';
import { LanguageSelector } from '@/components/language-selector';

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
      <div className="container mx-auto px-3 py-1.5 sm:py-3">
        <div className="flex items-center justify-between">
          {/* Logotipo à esquerda */}
          <Link href="/dashboard">
            <div className="relative w-[40px] sm:w-[70px] h-auto">
              <SafeImage 
                src="/revela3.png" 
                alt="Revela Logo" 
                width={70} 
                height={40} 
                className="w-full h-auto object-contain" 
                priority
                unoptimized
              />
            </div>
          </Link>

          {/* Ícones à direita */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Seletor de Idioma */}
            <LanguageSelector />
            
            {/* Na dashboard: botão Configurações e botão Sair */}
            {/* Nas demais páginas: botão Dashboard e botão Sair */}
            {isDashboard ? (
              <button
                onClick={() => router.push('/settings')}
                className="p-1 sm:p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Configurações"
                style={{ color: '#E8DCC0' }}
              >
                <Settings className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </button>
            ) : (
              <button
                onClick={() => router.push('/dashboard')}
                className="p-1 sm:p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Dashboard"
                style={{ color: '#E8DCC0' }}
              >
                <Home className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* Botão Sair */}
            <button
              onClick={handleLogout}
                className="p-1 sm:p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Sair"
                style={{ color: '#E8DCC0' }}
            >
              <LogOut className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

