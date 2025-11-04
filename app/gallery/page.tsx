'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BeforeAfterViewer } from '@/components/before-after-viewer';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';

interface BeforeAfterPhoto {
  id: string;
  title: string;
  description: string | null;
  before_image_url: string;
  after_image_url: string;
  created_at: string;
}

export default function GalleryPage() {
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

  useEffect(() => {
    if (user) {
      fetchPhotos();
    }
  }, [user]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (!session) {
      router.push('/login');
    }
    setLoading(false);
  };

  const fetchPhotos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('before_after_photos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

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
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
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
            Minha Galeria
          </h2>
          <p className="text-slate-600">
            Visualize seus casos de antes e depois
          </p>
        </div>

        {photos.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-slate-600 mb-4">
                  Nenhum caso adicionado ainda
                </p>
                <Link href="/dashboard">
                  <Button>Voltar ao Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8">
            {photos.map((photo) => (
              <Card key={photo.id}>
                <CardHeader>
                  <CardTitle>{photo.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <BeforeAfterViewer
                    beforeImage={photo.before_image_url}
                    afterImage={photo.after_image_url}
                    description={photo.description || undefined}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
