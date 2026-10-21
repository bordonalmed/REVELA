'use client';

import { useTr } from '@/contexts/language-context';

import { LandingHeader } from '@/components/landing-header';
import { Footer } from '@/components/footer';

export default function FAQPage() {
  const tr = useTr();
  return (
    <div className="bg-revela-dark min-h-screen flex flex-col">
      <LandingHeader />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 md:px-8">
        <section className="max-w-3xl mx-auto">
          <header className="mb-10 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-revela-cream mb-3">
              {tr('Perguntas frequentes', 'Frequently asked questions')}
            </h1>
            <p className="text-sm sm:text-base text-revela-cream opacity-80">
              {tr('Respostas rápidas sobre como o Revela funciona na prática.', 'Quick answers about how Revela works in practice.')}
            </p>
          </header>

          <div className="space-y-6 text-revela-cream opacity-90 text-sm sm:text-base leading-relaxed">
            <div>
              <h2 className="font-medium mb-1">{tr('O que é o Revela?', 'What is Revela?')}</h2>
              <p>
                {tr('O Revela é uma ferramenta profissional desenvolvida por médicos para organizar, comparar e apresentar fotos de antes e depois. Foi pensada especialmente para a rotina de consultórios, clínicas e outros profissionais da saúde que documentam evolução de tratamentos.', 'Revela is a professional tool built by doctors to organize, compare and present before and after photos. It was designed especially for the routine of practices, clinics and other health professionals who document treatment progress.')}
              </p>
            </div>

            <div>
              <h2 className="font-medium mb-1">{tr('As fotos ficam na nuvem?', 'Are the photos stored in the cloud?')}</h2>
              <p>
                {tr('Não: as fotos ficam armazenadas apenas no seu dispositivo, sem envio automático para servidores externos. No plano Premium existe a opção, sempre manual e nunca automática, de sincronizar os projetos na nuvem para acessá-los em outro aparelho. Fora dessa ação que você escolhe fazer, nada sai do seu dispositivo.', 'No: photos are stored only on your device, with no automatic upload to external servers. The Premium plan offers an option, always manual and never automatic, to sync projects to the cloud so you can access them on another device. Apart from that action, which you choose to take, nothing leaves your device.')}
              </p>
            </div>

            <div>
              <h2 className="font-medium mb-1">{tr('Quem pode usar o Revela?', 'Who can use Revela?')}</h2>
              <p>
                {tr('Qualquer profissional que trabalhe com antes e depois: médicos, dentistas, fisioterapeutas, esteticistas, nutricionistas e outros profissionais da saúde. Profissionais de áreas visuais (como design, arquitetura, maquiagem, restauração) também podem se beneficiar da ferramenta.', 'Any professional who works with before and after: doctors, dentists, physiotherapists, aestheticians, nutritionists and other health professionals. Professionals in visual fields (such as design, architecture, makeup and restoration) can also benefit from it.')}
              </p>
            </div>

            <div>
              <h2 className="font-medium mb-1">{tr('Preciso de treinamento para usar?', 'Do I need training to use it?')}</h2>
              <p>
                {tr('Não. A interface foi desenhada para ser simples: você cria um projeto, adiciona as fotos, ajusta a ordem e usa os modos de comparação (lado a lado ou slider) para apresentar os resultados. O objetivo é que qualquer membro da equipe consiga usar em poucos minutos.', 'No. The interface is designed to be simple: you create a project, add the photos, adjust the order and use the comparison modes (side by side or slider) to present the results. The goal is for any team member to be up and running in minutes.')}
              </p>
            </div>

            <div>
              <h2 className="font-medium mb-1">{tr('Esqueci minha senha. Como recupero?', 'I forgot my password. How do I recover it?')}</h2>
              <p>
                {tr(
                  'Na tela de login, clique em "Esqueci minha senha", informe o email da sua conta e siga o link que enviaremos por email para definir uma nova senha. Se não receber o email em alguns minutos, verifique a pasta de spam. Usuários já logados podem alterar a senha em Configurações da conta.',
                  'On the sign-in screen, click "Forgot my password", enter your account email and follow the link we send you to set a new password. If the email doesn\'t arrive within a few minutes, check your spam folder. Signed-in users can change their password in Account Settings.'
                )}
              </p>
            </div>

            <div>
              <h2 className="font-medium mb-1">{tr('O Revela é pago?', 'Is Revela paid?')}</h2>
              <p>
                {tr(
                  'Tem um plano gratuito (até 3 projetos, com marca d’água) pra começar sem compromisso. Os planos pagos são o Revela Pro (projetos ilimitados e exportação completa) e o Revela Premium (tudo do Pro, mais o Cofre Revela para ver seus projetos em todos os aparelhos, relatório em PDF, Revela Evolução e marcações clínicas). Veja os valores e detalhes atualizados na página de',
                  'There is a free plan (up to 3 projects, with watermark) so you can start with no commitment. The paid plans are Revela Pro (unlimited projects and full exports) and Revela Premium (everything in Pro, plus the Revela Vault to see your projects on all your devices, PDF report, Revela Evolution and clinical annotations). See current prices and details on the'
                )}{' '}
                <a href="/planos" className="underline" style={{ color: '#00A88F' }}>
                  {tr('planos', 'plans page')}
                </a>
                .
              </p>
            </div>

            <div>
              <h2 className="font-medium mb-1">{tr('Como o Revela ajuda na comunicação com o paciente?', 'How does Revela help communication with patients?')}</h2>
              <p>
                {tr('Ao organizar as fotos de forma consistente e oferecer comparações claras, o Revela facilita a explicação dos resultados ao paciente, melhora a percepção de valor do tratamento e ajuda a equipe a manter um histórico visual mais profissional.', 'By organizing photos consistently and offering clear comparisons, Revela makes it easier to explain results to patients, improves the perceived value of the treatment and helps the team keep a more professional visual record.')}
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

