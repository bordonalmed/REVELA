'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { User } from '@supabase/supabase-js';

interface BeforeAfterPhoto {
  id: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [photos, setPhotos] = useState<BeforeAfterPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (!session) {
      router.push('/login');
    } else {
      fetchPhotos();
    }
    setLoading(false);
  };

  const fetchPhotos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('before_after_photos')
        .select('id')
        .eq('user_id', user.id);

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard">
            <h1 className="text-2xl font-bold text-slate-900 hover:text-primary transition-colors">
              Revela
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/gallery">
              <Button variant="ghost">Galeria</Button>
            </Link>
            <span className="text-sm text-slate-600">{user?.email}</span>
            <Button variant="outline" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Bem-vindo ao Revela
          </h2>
          <p className="text-slate-600">
            Gerencie suas fotos de antes e depois
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/gallery">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle>Meus Casos</CardTitle>
                <CardDescription>Visualize todos os seus casos</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary">{photos.length}</p>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>Uploads</CardTitle>
              <CardDescription>Adicione novos antes e depois</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>Em breve</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
              <CardDescription>Gerencie sua conta</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>Em breve</Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Instruções</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-slate-600">
                1. Configure suas credenciais do Supabase no arquivo .env.local
              </p>
              <p className="text-sm text-slate-600">
                2. Faça o deploy no Netlify conectando seu repositório GitHub
              </p>
              <p className="text-sm text-slate-600">
                3. Adicione suas variáveis de ambiente no Netlify
              </p>
              <p className="text-sm text-slate-600">
                4. Crie a tabela "before_after_photos" no Supabase
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
