'use client';

import { useTr } from '@/contexts/language-context';

import Link from 'next/link';
import { Footer } from '@/components/footer';
import { LandingHeader } from '@/components/landing-header';

export default function TermosPageContent() {
  const tr = useTr();
  return (
    <div className="bg-revela-dark min-h-screen flex flex-col">
      <LandingHeader />

      <main className="flex-1 pt-20 pb-16 px-4 sm:px-6 md:px-8">
        <article className="max-w-3xl mx-auto prose-sm text-revela-cream opacity-90 text-sm sm:text-base leading-relaxed space-y-8">
          <header className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-revela-cream mb-2">
              {tr('Termos de Uso', 'Terms of Use')}
            </h1>
            <p className="text-xs text-revela-cream/60">{tr('Última atualização: 20 de maio de 2026', 'Last updated: May 20, 2026')}</p>
          </header>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('1. Aceitação dos Termos', '1. Acceptance of Terms')}</h2>
            <p>
              {tr('Ao criar uma conta ou utilizar o Revela, você concorda com estes Termos de Uso. Caso não concorde, por favor não utilize a plataforma.', 'By creating an account or using Revela, you agree to these Terms of Use. If you do not agree, please do not use the platform.')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('2. Descrição do Serviço', '2. Description of the Service')}</h2>
            <p>
              {tr('O Revela é uma plataforma web (PWA) para criação e comparação de fotografias do tipo "antes e depois", voltada a profissionais de saúde e estética. As fotos são armazenadas localmente no dispositivo do usuário.', 'Revela is a web platform (PWA) for creating and comparing "before and after" photographs, aimed at health and aesthetics professionals. Photos are stored locally on the user\'s device.')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('3. Conta do Usuário', '3. User Account')}</h2>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>{tr('Você é responsável por manter a segurança de sua senha.', 'You are responsible for keeping your password secure.')}</li>
              <li>{tr('Cada conta é pessoal e intransferível.', 'Each account is personal and non-transferable.')}</li>
              <li>{tr('Ao se cadastrar, você declara ter pelo menos 18 anos.', 'By signing up, you declare that you are at least 18 years old.')}</li>
              <li>{tr('Informações falsas podem resultar no encerramento da conta.', 'False information may result in account termination.')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('4. Planos e Pagamentos', '4. Plans and Payments')}</h2>
            <p>
              {tr('O Revela oferece planos Free, Pro e Premium. O processamento de pagamentos é feito exclusivamente pela Hotmart. Ao assinar um plano pago, você aceita também os termos da Hotmart como plataforma de pagamentos.', 'Revela offers Free, Pro and Premium plans. Payments are processed exclusively by Hotmart. By subscribing to a paid plan, you also accept Hotmart\'s terms as the payment platform.')}
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>{tr('Cancelamentos podem ser feitos a qualquer momento pela Hotmart.', 'You can cancel at any time through Hotmart.')}</li>
              <li>{tr('Após cancelamento, o acesso às funcionalidades pagas permanece até o fim do período contratado.', 'After cancellation, access to paid features remains until the end of the paid period.')}</li>
              <li>{tr('Reembolsos seguem a política da Hotmart (7 dias de garantia).', 'Refunds follow Hotmart\'s policy (7-day guarantee).')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('5. Uso Adequado', '5. Acceptable Use')}</h2>
            <p>{tr('Ao utilizar o Revela, você se compromete a:', 'By using Revela, you agree to:')}</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>{tr('Não utilizar a plataforma para fins ilegais ou antiéticos.', 'Not use the platform for illegal or unethical purposes.')}</li>
              <li>{tr('Garantir consentimento dos pacientes para registro fotográfico quando aplicável.', 'Obtain patient consent for photographic records where applicable.')}</li>
              <li>{tr('Não tentar acessar funcionalidades pagas sem a devida assinatura.', 'Not attempt to access paid features without a valid subscription.')}</li>
              <li>{tr('Não realizar engenharia reversa ou tentativas de invasão.', 'Not reverse engineer or attempt to breach the platform.')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('6. Propriedade Intelectual', '6. Intellectual Property')}</h2>
            <p>
              {tr('O código-fonte, design, marca e conteúdo do Revela são propriedade do desenvolvedor. As fotos carregadas pertencem exclusivamente ao usuário — o Revela não reivindica qualquer direito sobre o conteúdo criado pelo usuário.', 'Revela\'s source code, design, brand and content are the property of the developer. Uploaded photos belong exclusively to the user — Revela claims no rights over user-created content.')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('7. Limitação de Responsabilidade', '7. Limitation of Liability')}</h2>
            <p>
              {tr('O Revela é fornecido "como está". Não nos responsabilizamos por perda de dados locais (falha de hardware, limpeza de cache do navegador) nem por indisponibilidade temporária da plataforma. Recomendamos que o usuário mantenha backups regulares.', 'Revela is provided "as is". We are not liable for loss of local data (hardware failure, browser cache clearing) or for temporary unavailability of the platform. We recommend that users keep regular backups.')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('8. Encerramento', '8. Termination')}</h2>
            <p>
              {tr('Podemos suspender ou encerrar contas que violem estes termos. O usuário pode solicitar exclusão de conta a qualquer momento através do e-mail', 'We may suspend or terminate accounts that violate these terms. Users may request account deletion at any time by emailing')}{' '}
              <a href="mailto:contato@revela.fun" className="text-revela-teal hover:underline">
                contato@revela.fun
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('9. Legislação Aplicável', '9. Governing Law')}</h2>
            <p>
              {tr('Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca do domicílio do usuário para dirimir quaisquer controvérsias.', 'These terms are governed by the laws of the Federative Republic of Brazil. Any disputes shall be settled in the courts of the user\'s place of residence.')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('10. Contato', '10. Contact')}</h2>
            <p>
              {tr('Dúvidas sobre estes termos podem ser enviadas para', 'Questions about these terms can be sent to')}{' '}
              <a href="mailto:contato@revela.fun" className="text-revela-teal hover:underline">
                contato@revela.fun
              </a>.
            </p>
          </section>

          <div className="pt-6 text-center">
            <Link href="/" className="text-revela-teal hover:underline text-sm">
              {tr('← Voltar para a página inicial', '← Back to home page')}
            </Link>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
