'use client';

import Link from 'next/link';
import { LandingHeader } from '@/components/landing-header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';

export default function ParaMedicosPage() {
  return (
    <div className="bg-revela-dark min-h-screen flex flex-col">
      <LandingHeader />

      <main className="flex-1 pt-20 pb-16 px-4 sm:px-6 md:px-8">
        <section className="max-w-5xl mx-auto space-y-12 text-revela-cream opacity-90 text-sm sm:text-base leading-relaxed">
          {/* Hero simples */}
          <header className="text-center max-w-3xl mx-auto">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] opacity-70 mb-3">
              Para médicos
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light mb-3">
              Antes e depois organizado para a rotina médica
            </h1>
            <p className="text-sm sm:text-base opacity-80">
              Desenvolvido por médicos para médicos e outros profissionais da saúde que documentam
              tratamentos com fotos de antes e depois.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="px-6">
                <Link href="/signup">Criar conta grátis</Link>
              </Button>
              <Button asChild variant="outline" className="px-6 border-revela-cream text-revela-cream">
                <Link href="/login">Já uso o Revela</Link>
              </Button>
            </div>
          </header>

          {/* Casos de uso clínicos */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg sm:text-xl font-medium mb-2">Casos de uso no consultório</h2>
              <p>
                O Revela ajuda a trazer ordem para o registro fotográfico de:
              </p>
              <ul className="mt-3 list-disc list-inside space-y-1">
                <li>pré e pós-operatório em cirurgia plástica e vascular;</li>
                <li>evolução de tratamentos dermatológicos e estéticos;</li>
                <li>ortopedia e fisiatria (amplitude de movimento, postura);</li>
                <li>odontologia estética e ortodontia;</li>
                <li>qualquer cenário em que a imagem ajuda a contar a história clínica.</li>
              </ul>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-medium mb-2">Antes e depois confiável</h2>
              <p>
                A proposta não é criar imagens “de marketing”, mas sim registrar evolução de forma
                consistente, para apoiar:
              </p>
              <ul className="mt-3 list-disc list-inside space-y-1">
                <li>discussões de caso com o paciente e com a equipe;</li>
                <li>apresentações acadêmicas e reuniões clínicas;</li>
                <li>documentação interna e auditorias de qualidade.</li>
              </ul>
            </div>
          </section>

          {/* Rotina do médico */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg sm:text-xl font-medium mb-2">Pensado para o tempo de consultório</h2>
              <p>
                A interface foi desenhada para caber na rotina agitada: poucos cliques para criar um
                projeto, adicionar fotos, escolher o modo de comparação e estar pronto para mostrar
                o resultado na frente do paciente.
              </p>
              <p className="mt-3">
                Você não precisa treinar a equipe por semanas. O objetivo é que qualquer membro da
                equipe — médico, enfermeiro, técnico ou recepção — consiga usar em poucos minutos.
              </p>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-medium mb-2">Privacidade como padrão</h2>
              <p>
                No modelo atual, as fotos ficam armazenadas localmente no dispositivo, sem envio
                automático para a nuvem. Isso ajuda a reduzir riscos e dá mais controle sobre quais
                imagens serão compartilhadas e em que contexto.
              </p>
              <p className="mt-3">
                À medida que o produto evoluir, novas opções de sincronização poderão ser oferecidas,
                sempre com transparência e respeito às boas práticas de proteção de dados.
              </p>
            </div>
          </section>

          {/* Chamada final */}
          <section className="text-center max-w-3xl mx-auto">
            <h2 className="text-lg sm:text-xl font-medium mb-3">
              Mostre evolução de forma clara e profissional
            </h2>
            <p className="text-sm sm:text-base opacity-80 mb-6">
              Em poucos minutos você cria um projeto, adiciona as fotos e passa a ter comparações
              consistentes para cada paciente.
            </p>
            <Button asChild className="px-8">
              <Link href="/signup">Começar a testar o Revela</Link>
            </Button>
          </section>
        </section>
      </main>

      <Footer />
    </div>
  );
}

