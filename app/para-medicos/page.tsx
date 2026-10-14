'use client';

import { useTr } from '@/contexts/language-context';

import Link from 'next/link';
import { LandingHeader } from '@/components/landing-header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';

export default function ParaMedicosPage() {
  const tr = useTr();
  return (
    <div className="bg-revela-dark min-h-screen flex flex-col">
      <LandingHeader />

      <main className="flex-1 pt-20 pb-16 px-4 sm:px-6 md:px-8">
        <section className="max-w-5xl mx-auto space-y-12 text-revela-cream opacity-90 text-sm sm:text-base leading-relaxed">
          {/* Hero simples */}
          <header className="text-center max-w-3xl mx-auto">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] opacity-70 mb-3">
              {tr('Para médicos', 'For doctors')}
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light mb-3">
              {tr('Antes e depois organizado para a rotina médica', 'Before and after, organized for medical practice')}
            </h1>
            <p className="text-sm sm:text-base opacity-80">
              {tr('Desenvolvido por médicos para médicos e outros profissionais da saúde que documentam tratamentos com fotos de antes e depois.', 'Built by doctors for doctors and other health professionals who document treatments with before and after photos.')}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="px-6">
                <Link href="/signup">{tr('Criar conta grátis', 'Create free account')}</Link>
              </Button>
              <Button asChild variant="outline" className="px-6 border-revela-cream text-revela-cream">
                <Link href="/login">{tr('Já uso o Revela', 'I already use Revela')}</Link>
              </Button>
            </div>
          </header>

          {/* Casos de uso clínicos */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg sm:text-xl font-medium mb-2">{tr('Casos de uso no consultório', 'Use cases in the practice')}</h2>
              <p>
                {tr('O Revela ajuda a trazer ordem para o registro fotográfico de:', 'Revela helps bring order to photo records of:')}
              </p>
              <ul className="mt-3 list-disc list-inside space-y-1">
                <li>{tr('pré e pós-operatório em cirurgia plástica e vascular;', 'pre- and post-op in plastic and vascular surgery;')}</li>
                <li>{tr('evolução de tratamentos dermatológicos e estéticos;', 'progress of dermatology and aesthetic treatments;')}</li>
                <li>{tr('ortopedia e fisiatria (amplitude de movimento, postura);', 'orthopedics and physiatry (range of motion, posture);')}</li>
                <li>{tr('odontologia estética e ortodontia;', 'cosmetic dentistry and orthodontics;')}</li>
                <li>{tr('qualquer cenário em que a imagem ajuda a contar a história clínica.', 'any situation where images help tell the clinical story.')}</li>
              </ul>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-medium mb-2">{tr('Antes e depois confiável', 'Reliable before and after')}</h2>
              <p>
                {tr('A proposta não é criar imagens “de marketing”, mas sim registrar evolução de forma consistente, para apoiar:', 'The goal isn\'t to create “marketing” images, but to record progress consistently to support:')}
              </p>
              <ul className="mt-3 list-disc list-inside space-y-1">
                <li>{tr('discussões de caso com o paciente e com a equipe;', 'case discussions with the patient and the team;')}</li>
                <li>{tr('apresentações acadêmicas e reuniões clínicas;', 'academic presentations and clinical meetings;')}</li>
                <li>{tr('documentação interna e auditorias de qualidade.', 'internal documentation and quality audits.')}</li>
              </ul>
            </div>
          </section>

          {/* Rotina do médico */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg sm:text-xl font-medium mb-2">{tr('Pensado para o tempo de consultório', 'Designed for a busy practice')}</h2>
              <p>
                {tr('A interface foi desenhada para caber na rotina agitada: poucos cliques para criar um projeto, adicionar fotos, escolher o modo de comparação e estar pronto para mostrar o resultado na frente do paciente.', 'The interface fits a hectic routine: a few clicks to create a project, add photos, choose the comparison mode and be ready to show the result in front of the patient.')}
              </p>
              <p className="mt-3">
                {tr('Você não precisa treinar a equipe por semanas. O objetivo é que qualquer membro da equipe — médico, enfermeiro, técnico ou recepção — consiga usar em poucos minutos.', 'You don\'t need weeks of team training. The goal is for anyone on the team — doctor, nurse, technician or front desk — to use it within minutes.')}
              </p>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-medium mb-2">{tr('Privacidade como padrão', 'Privacy by default')}</h2>
              <p>
                {tr('No modelo atual, as fotos ficam armazenadas localmente no dispositivo, sem envio automático para a nuvem. Isso ajuda a reduzir riscos e dá mais controle sobre quais imagens serão compartilhadas e em que contexto.', 'Photos are stored locally on the device, with no automatic upload to the cloud. This helps reduce risk and gives you more control over which images are shared and in what context.')}
              </p>
              <p className="mt-3">
                {tr('À medida que o produto evoluir, novas opções de sincronização poderão ser oferecidas, sempre com transparência e respeito às boas práticas de proteção de dados.', 'As the product evolves, new sync options may be offered, always transparently and following data protection best practices.')}
              </p>
            </div>
          </section>

          {/* Chamada final */}
          <section className="text-center max-w-3xl mx-auto">
            <h2 className="text-lg sm:text-xl font-medium mb-3">
              {tr('Mostre evolução de forma clara e profissional', 'Show progress clearly and professionally')}
            </h2>
            <p className="text-sm sm:text-base opacity-80 mb-6">
              {tr('Em poucos minutos você cria um projeto, adiciona as fotos e passa a ter comparações consistentes para cada paciente.', 'In a few minutes you create a project, add the photos and get consistent comparisons for every patient.')}
            </p>
            <Button asChild className="px-8">
              <Link href="/signup">{tr('Começar a testar o Revela', 'Start trying Revela')}</Link>
            </Button>
          </section>
        </section>
      </main>

      <Footer />
    </div>
  );
}

