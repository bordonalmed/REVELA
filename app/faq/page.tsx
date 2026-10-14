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
                Por padrão, não: as fotos ficam armazenadas apenas no seu dispositivo, sem envio automático
                para servidores externos. Duas ações são sempre manuais, nunca automáticas: gerar um link
                compartilhável de um caso específico para enviar ao paciente (disponível em todos os planos)
                e, no plano Premium, sincronizar os projetos na nuvem para acessá-los em outro aparelho. Fora
                dessas ações que você escolhe fazer, nada sai do seu dispositivo.
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
              <h2 className="font-medium mb-1">Esqueci minha senha. Como recupero?</h2>
              <p>
                Na tela de login, clique em &quot;Esqueci minha senha&quot;, informe o email da sua conta e
                siga o link que enviaremos por email para definir uma nova senha. Se não receber o email em
                alguns minutos, verifique a pasta de spam. Usuários já logados podem alterar a senha em
                Configurações da conta.
              </p>
            </div>

            <div>
              <h2 className="font-medium mb-1">O Revela é pago?</h2>
              <p>
                Tem um plano gratuito (até 3 projetos, com marca d&apos;água) pra começar sem compromisso.
                Os planos pagos são o Revela Pro (projetos ilimitados e exportação completa) e o Revela
                Premium (tudo do Pro, mais timeline de evolução, relatório em PDF, marcações clínicas e
                backup na nuvem). Veja os valores e detalhes atualizados na página de{' '}
                <a href="/planos" className="underline" style={{ color: '#00A88F' }}>
                  planos
                </a>
                .
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

