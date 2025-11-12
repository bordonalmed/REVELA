'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { NavigationHeader } from '@/components/navigation-header';
import { Footer } from '@/components/footer';



function Hero({ onNew, onStored }: { onNew: () => void; onStored: () => void }) {
  return (
    <section className="px-4 py-8 sm:py-12 md:py-16 animate-in fade-in duration-500">
      <div className="container mx-auto max-w-4xl text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-light mb-3 sm:mb-4" style={{ color: '#E8DCC0' }}>Bem-vindo ao Revela</h1>
        <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8" style={{ color: '#E8DCC0', opacity: 0.8 }}>Cada imagem Revela uma Evolução</p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center max-w-md mx-auto">
          <button onClick={onNew} className="w-full sm:flex-1 rounded-lg px-4 py-3 text-sm sm:text-base font-medium transition-opacity hover:opacity-90" style={{ backgroundColor: '#00A88F', color: '#FFFFFF' }}>Novo projeto</button>
          <button onClick={onStored} className="w-full sm:flex-1 rounded-lg px-4 py-3 text-sm sm:text-base font-medium transition-opacity hover:opacity-90 flex items-center justify-center gap-2 border" style={{ backgroundColor: 'rgba(232, 220, 192, 0.05)', color: '#E8DCC0', borderColor: 'rgba(232, 220, 192, 0.1)' }}><FolderOpen className="w-4 h-4" />Armazenados</button>
        </div>
      </div>
    </section>
  );
}


export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (!session) router.push('/login');
    setLoading(false);
  }, [router]);

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) router.push('/login');
    });
    return () => subscription.unsubscribe();
  }, [router, checkUser]);

  const handleNew = () => {
    router.push('/new-project');
  };
  const handleStored = () => {
    router.push('/projects');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1A2B32' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#00A88F', borderTopColor: 'transparent' }}></div>
          <p style={{ color: '#E8DCC0' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#1A2B32' }}>
      <NavigationHeader />
      <div className="flex-1 pt-20 sm:pt-24">
        <Hero onNew={handleNew} onStored={handleStored} />
      </div>
      <Footer />
    </div>
  );
}
