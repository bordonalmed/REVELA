'use client';

import { LandingHeader } from '@/components/landing-header';
import { Footer } from '@/components/footer';

export default function FAQPage() {
  return (
    <div className="bg-revela-dark min-h-screen flex flex-col">
      <LandingHeader />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 md:px-8">
        <section className="max-w-3xl mx-auto">
          <header className="mb-10 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-revela-cream mb-3">
              Perguntas frequentes
            </h1>
            <p className="text-sm sm:text-base text-revela-cream opacity-80">
              Respostas rápidas sobre como o Revela funciona na prática.
            </p>
          </header>

          <div className="space-y-6 text-revela-cream opacity-90 text-sm sm:text-base leading-relaxed">
            <div>
              <h2 className="font-medium mb-1">O que é o Revela?</h2>
              <p>
                O Revela é uma ferramenta profissional desenvolvida por médicos para organizar, comparar e
                apresentar fotos de antes e depois. Foi pensada especialmente para a rotina de consultórios,
                clínicas e outros profissionais da saúde que documentam evolução de tratamentos.
              </p>
            </div>

            <div>
              <h2 className="font-medium mb-1">As fotos ficam na nuvem?</h2>
              <p>
                Não. No modelo atual, as fotos ficam armazenadas apenas no seu dispositivo, usando o próprio
                armazenamento local do navegador. Isso significa que você mantém o controle dos arquivos e
                evita o envio automático para servidores externos.
              </p>
            </div>

            <div>
              <h2 className="font-medium mb-1">Quem pode usar o Revela?</h2>
              <p>
                Qualquer profissional que trabalhe com antes e depois: médicos, dentistas, fisioterapeutas,
                esteticistas, nutricionistas e outros profissionais da saúde. Profissionais de áreas visuais
                (como design, arquitetura, maquiagem, restauração) também podem se beneficiar da ferramenta.
              </p>
            </div>

            <div>
              <h2 className="font-medium mb-1">Preciso de treinamento para usar?</h2>
              <p>
                Não. A interface foi desenhada para ser simples: você cria um projeto, adiciona as fotos,
                ajusta a ordem e usa os modos de comparação (lado a lado ou slider) para apresentar os
                resultados. O objetivo é que qualquer membro da equipe consiga usar em poucos minutos.
              </p>
            </div>

            <div>
              <h2 className="font-medium mb-1">O Revela é pago?</h2>
              <p>
                Nesta fase de desenvolvimento, o Revela está disponível em modo gratuito para testes e
                validação com profissionais. No futuro, poderão existir planos específicos, sempre com foco
                em acessibilidade e custo-benefício para consultórios de diferentes portes.
              </p>
            </div>

            <div>
              <h2 className="font-medium mb-1">Como o Revela ajuda na comunicação com o paciente?</h2>
              <p>
                Ao organizar as fotos de forma consistente e oferecer comparações claras, o Revela facilita
                a explicação dos resultados ao paciente, melhora a percepção de valor do tratamento e ajuda
                a equipe a manter um histórico visual mais profissional.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

