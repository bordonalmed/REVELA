'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FolderOpen, Plus, Camera, Images, FileDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { NavigationHeader } from '@/components/navigation-header';
import { Footer } from '@/components/footer';
import { SafeBase64Image } from '@/components/safe-image';
import { useLanguage, useTr } from '@/contexts/language-context';
import { getAllProjectsForUser, type Project } from '@/lib/storage';
import { formatLocalDate } from '@/lib/utils';
import { GuidedTour } from '@/components/guided-tour';

const CREAM = '#E8DCC0';
const TEAL = '#00A88F';

function DashboardTour() {
  const tr = useTr();
  return (
    <GuidedTour
      id="dashboard-v1"
      steps={[
        { target: '[data-tour="new-project"]', title: tr('Comece por aqui', 'Start here'), text: tr('Crie um projeto para cada paciente ou caso, com as fotos de antes e de depois.', 'Create one project per patient or case, with the before and after photos.') },
        { target: '[data-tour="my-projects"]', title: tr('Seus projetos', 'Your projects'), text: tr('Tudo o que você salvar fica aqui, guardado neste aparelho.', 'Everything you save is here, stored on this device.') },
        { target: '[data-tour="vault"]', title: tr('Cofre Revela', 'Revela Vault'), text: tr('No Premium, o Cofre leva seus projetos para todos os seus aparelhos, trancados com uma senha só sua.', 'On Premium, the Vault brings your projects to all your devices, locked with your own password.') },
      ]}
    />
  );
}

function Hero({ onNew, onStored, t }: { onNew: () => void; onStored: () => void; t: any }) {
  return (
    <section className="px-4 pt-8 pb-6 sm:pt-12 sm:pb-8 animate-in fade-in duration-500">
      <div className="container mx-auto max-w-4xl text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-light mb-3 sm:mb-4" style={{ color: CREAM }}>{t.dashboard.welcome}</h1>
        <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8" style={{ color: CREAM, opacity: 0.8 }}>{t.dashboard.slogan}</p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center max-w-md mx-auto">
          <button onClick={onNew} data-tour="new-project" className="w-full sm:flex-1 rounded-xl px-4 py-3 text-sm sm:text-base font-semibold transition-opacity hover:opacity-90 flex items-center justify-center gap-2" style={{ backgroundColor: TEAL, color: '#FFFFFF' }}><Plus className="w-5 h-5" />{t.dashboard.newProject}</button>
          <button onClick={onStored} data-tour="my-projects" className="w-full sm:flex-1 rounded-xl px-4 py-3 text-sm sm:text-base font-medium transition-opacity hover:opacity-90 flex items-center justify-center gap-2 border" style={{ backgroundColor: 'rgba(232, 220, 192, 0.05)', color: CREAM, borderColor: 'rgba(232, 220, 192, 0.15)' }}><FolderOpen className="w-4 h-4" />{t.dashboard.storedProjects}</button>
        </div>
      </div>
    </section>
  );
}

/** Para quem ainda não tem projeto: o caminho em 3 passos. */
function HowItWorks() {
  const tr = useTr();
  const steps = [
    { icon: <Camera className="w-5 h-5" />, t: tr('Crie um projeto', 'Create a project'), d: tr('Dê um nome (ex.: nome do paciente) e a data.', 'Give it a name (e.g. the patient) and a date.') },
    { icon: <Images className="w-5 h-5" />, t: tr('Adicione as fotos', 'Add the photos'), d: tr('Escolha as fotos de antes e as de depois.', 'Pick the before photos and the after photos.') },
    { icon: <FileDown className="w-5 h-5" />, t: tr('Compare e compartilhe', 'Compare and share'), d: tr('Veja lado a lado, apresente, meça e gere o PDF.', 'See side by side, present, measure and create the PDF.') },
  ];
  return (
    <section className="px-4 pb-10">
      <div className="container mx-auto max-w-3xl">
        <h2 className="text-sm font-medium mb-3 text-center" style={{ color: CREAM, opacity: 0.7 }}>{tr('Como funciona', 'How it works')}</h2>
        <ol className="grid sm:grid-cols-3 gap-3">
          {steps.map((s, i) => (
            <li key={i} className="rounded-2xl border p-4" style={{ backgroundColor: 'rgba(232,220,192,0.04)', borderColor: 'rgba(232,220,192,0.12)' }}>
              <div className="flex items-center gap-2 mb-2" style={{ color: TEAL }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'rgba(0,168,143,0.15)' }}>{i + 1}</span>
                {s.icon}
              </div>
              <p className="text-sm font-medium" style={{ color: CREAM }}>{s.t}</p>
              <p className="text-xs mt-1" style={{ color: CREAM, opacity: 0.65 }}>{s.d}</p>
            </li>
          ))}
        </ol>
        <p className="text-xs text-center mt-4" style={{ color: CREAM, opacity: 0.5 }}>
          {tr('Suas fotos ficam guardadas só neste aparelho.', 'Your photos are stored only on this device.')}
        </p>
      </div>
    </section>
  );
}

/** Para quem já usa: atalho para os últimos projetos. */
function Recent({ projects, total }: { projects: Project[]; total: number }) {
  const tr = useTr();
  return (
    <section className="px-4 pb-10">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium" style={{ color: CREAM, opacity: 0.7 }}>{tr('Recentes', 'Recent')}</h2>
          <Link href="/projects" className="text-sm inline-flex items-center gap-1 hover:underline" style={{ color: TEAL }}>
            {tr(`Ver todos (${total})`, `See all (${total})`)} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {projects.map((p) => {
            const thumb = p.afterImages?.[0] || p.beforeImages?.[0];
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="rounded-2xl border overflow-hidden transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: 'rgba(232,220,192,0.04)', borderColor: 'rgba(232,220,192,0.12)' }}
              >
                <div className="aspect-[4/3] w-full" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
                  {thumb && <SafeBase64Image src={thumb} alt={p.name} className="w-full h-full object-cover" />}
                </div>
                <div className="p-3">
                  <p className="text-sm truncate" style={{ color: CREAM }}>{p.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: CREAM, opacity: 0.55 }}>{formatLocalDate(p.date)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const router = useRouter();
  const { t } = useLanguage();

  const checkUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (!session) router.push('/login');
    setLoading(false);
  }, [router]);

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setUser(session?.user ?? null);
      if (!session) router.push('/login');
    });
    return () => subscription.unsubscribe();
  }, [router, checkUser]);

  useEffect(() => {
    if (!user) return;
    getAllProjectsForUser(user.email || null)
      .then((all) => setProjects(all))
      .catch(() => setProjects([]));
  }, [user]);

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: TEAL, borderTopColor: 'transparent' }}></div>
          <p style={{ color: CREAM }}>{t.dashboard.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#1A2B32' }}>
      <NavigationHeader />
      <div className="flex-1 pt-20 sm:pt-24">
        <Hero onNew={handleNew} onStored={handleStored} t={t} />
        {projects !== null && <DashboardTour />}
        {projects !== null && (projects.length === 0 ? <HowItWorks /> : <Recent projects={projects.slice(0, 4)} total={projects.length} />)}
      </div>
      <Footer />
    </div>
  );
}
