'use client';

import { LandingHeader } from '@/components/landing-header';
import { Footer } from '@/components/footer';

export default function SobrePage() {
  return (
    <div className="bg-revela-dark min-h-screen flex flex-col">
      <LandingHeader />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 md:px-8">
        <section className="max-w-3xl mx-auto space-y-8 text-revela-cream opacity-90 text-sm sm:text-base leading-relaxed">
          <header className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light mb-3">
              Sobre o Revela
            </h1>
            <p className="text-sm sm:text-base opacity-80">
              Desenvolvido por médicos para médicos e outros profissionais da saúde que trabalham com
              fotos de antes e depois.
            </p>
          </header>

          <section>
            <h2 className="text-lg sm:text-xl font-medium mb-2">Nossa origem</h2>
            <p>
              O Revela nasceu da prática clínica: na rotina de consultórios e clínicas, documentar a
              evolução de um tratamento com fotos é essencial — mas costuma ser trabalhoso, desorganizado
              e pouco padronizado. Pastas soltas no computador ou no celular não ajudam a contar a
              história completa ao paciente.
            </p>
            <p className="mt-3">
              A partir dessa dor, médicos e profissionais de tecnologia decidiram criar uma ferramenta
              simples e focada: um ambiente único para comparar, organizar e apresentar fotos de antes e
              depois com privacidade total.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-medium mb-2">Propósito</h2>
            <p>
              Nosso objetivo é ajudar profissionais da saúde a comunicar resultados de forma clara,
              ética e visualmente profissional. Acreditamos que uma boa documentação fotográfica:
            </p>
            <ul className="mt-3 list-disc list-inside space-y-1">
              <li>melhora a compreensão do paciente sobre o próprio tratamento;</li>
              <li>facilita o acompanhamento de longo prazo;</li>
              <li>apoia decisões clínicas com base em evidências visuais;</li>
              <li>valoriza o trabalho de toda a equipe.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-medium mb-2">Foco em privacidade</h2>
            <p>
              O Revela foi desenhado com a privacidade como prioridade. As fotos são armazenadas
              localmente no dispositivo, sem envio automático para servidores externos. Dessa forma,
              você mantém maior controle sobre os arquivos e reduz a superfície de exposição dos dados.
            </p>
            <p className="mt-3">
              Ao evoluir o produto, seguimos atentos às boas práticas de segurança da informação e às
              diretrizes da LGPD, sempre com transparência em relação ao uso e ao destino dos dados.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-medium mb-2">Para quem é o Revela</h2>
            <p>
              Embora tenha sido pensado inicialmente para médicos, o Revela é útil para qualquer
              profissional que trabalhe com transformação visual:
            </p>
            <ul className="mt-3 list-disc list-inside space-y-1">
              <li>médicos de diversas especialidades;</li>
              <li>dentistas e ortodontistas;</li>
              <li>fisioterapeutas e profissionais de reabilitação;</li>
              <li>esteticistas e profissionais da estética;</li>
              <li>nutricionistas e outros profissionais que acompanham mudanças corporais.</li>
            </ul>
          </section>
        </section>
      </main>

      <Footer />
    </div>
  );
}

