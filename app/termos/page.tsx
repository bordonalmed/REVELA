import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/footer';
import { LandingHeader } from '@/components/landing-header';

export const metadata: Metadata = {
  title: 'Termos de Uso | Revela',
  description: 'Termos de uso do Revela. Condições para utilização da plataforma de comparação de fotos antes e depois.',
  alternates: { canonical: 'https://www.revela.fun/termos' },
};

export default function TermosPage() {
  return (
    <div className="bg-revela-dark min-h-screen flex flex-col">
      <LandingHeader />

      <main className="flex-1 pt-20 pb-16 px-4 sm:px-6 md:px-8">
        <article className="max-w-3xl mx-auto prose-sm text-revela-cream opacity-90 text-sm sm:text-base leading-relaxed space-y-8">
          <header className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-revela-cream mb-2">
              Termos de Uso
            </h1>
            <p className="text-xs text-revela-cream/60">Última atualização: 20 de maio de 2026</p>
          </header>

          <section>
            <h2 className="text-lg font-medium mb-2">1. Aceitação dos Termos</h2>
            <p>
              Ao criar uma conta ou utilizar o Revela, você concorda com estes Termos de Uso. Caso não
              concorde, por favor não utilize a plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">2. Descrição do Serviço</h2>
            <p>
              O Revela é uma plataforma web (PWA) para criação e comparação de fotografias do tipo
              &quot;antes e depois&quot;, voltada a profissionais de saúde e estética. As fotos são
              armazenadas localmente no dispositivo do usuário.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">3. Conta do Usuário</h2>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Você é responsável por manter a segurança de sua senha.</li>
              <li>Cada conta é pessoal e intransferível.</li>
              <li>Ao se cadastrar, você declara ter pelo menos 18 anos.</li>
              <li>Informações falsas podem resultar no encerramento da conta.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">4. Planos e Pagamentos</h2>
            <p>
              O Revela oferece planos Free, Pro e Premium. O processamento de pagamentos é feito
              exclusivamente pela Hotmart. Ao assinar um plano pago, você aceita também os termos
              da Hotmart como plataforma de pagamentos.
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Cancelamentos podem ser feitos a qualquer momento pela Hotmart.</li>
              <li>Após cancelamento, o acesso às funcionalidades pagas permanece até o fim do período contratado.</li>
              <li>Reembolsos seguem a política da Hotmart (7 dias de garantia).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">5. Uso Adequado</h2>
            <p>Ao utilizar o Revela, você se compromete a:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Não utilizar a plataforma para fins ilegais ou antiéticos.</li>
              <li>Garantir consentimento dos pacientes para registro fotográfico quando aplicável.</li>
              <li>Não tentar acessar funcionalidades pagas sem a devida assinatura.</li>
              <li>Não realizar engenharia reversa ou tentativas de invasão.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">6. Propriedade Intelectual</h2>
            <p>
              O código-fonte, design, marca e conteúdo do Revela são propriedade do desenvolvedor.
              As fotos carregadas pertencem exclusivamente ao usuário — o Revela não reivindica
              qualquer direito sobre o conteúdo criado pelo usuário.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">7. Limitação de Responsabilidade</h2>
            <p>
              O Revela é fornecido &quot;como está&quot;. Não nos responsabilizamos por perda de dados
              locais (falha de hardware, limpeza de cache do navegador) nem por indisponibilidade
              temporária da plataforma. Recomendamos que o usuário mantenha backups regulares.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">8. Encerramento</h2>
            <p>
              Podemos suspender ou encerrar contas que violem estes termos. O usuário pode solicitar
              exclusão de conta a qualquer momento através do e-mail{' '}
              <a href="mailto:contato@revela.fun" className="text-revela-teal hover:underline">
                contato@revela.fun
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">9. Legislação Aplicável</h2>
            <p>
              Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o
              foro da comarca do domicílio do usuário para dirimir quaisquer controvérsias.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">10. Contato</h2>
            <p>
              Dúvidas sobre estes termos podem ser enviadas para{' '}
              <a href="mailto:contato@revela.fun" className="text-revela-teal hover:underline">
                contato@revela.fun
              </a>.
            </p>
          </section>

          <div className="pt-6 text-center">
            <Link href="/" className="text-revela-teal hover:underline text-sm">
              ← Voltar para a página inicial
            </Link>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
