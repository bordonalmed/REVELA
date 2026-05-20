import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/footer';
import { LandingHeader } from '@/components/landing-header';

export const metadata: Metadata = {
  title: 'Política de Privacidade | Revela',
  description: 'Política de privacidade do Revela. Saiba como tratamos seus dados pessoais de acordo com a LGPD.',
  alternates: { canonical: 'https://www.revela.fun/privacidade' },
};

export default function PrivacidadePage() {
  return (
    <div className="bg-revela-dark min-h-screen flex flex-col">
      <LandingHeader />

      <main className="flex-1 pt-20 pb-16 px-4 sm:px-6 md:px-8">
        <article className="max-w-3xl mx-auto prose-sm text-revela-cream opacity-90 text-sm sm:text-base leading-relaxed space-y-8">
          <header className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-revela-cream mb-2">
              Política de Privacidade
            </h1>
            <p className="text-xs text-revela-cream/60">Última atualização: 20 de maio de 2026</p>
          </header>

          <section>
            <h2 className="text-lg font-medium mb-2">1. Introdução</h2>
            <p>
              O <strong>Revela</strong> (&quot;nós&quot;, &quot;nosso&quot;) respeita a privacidade dos seus usuários.
              Esta Política descreve quais dados pessoais coletamos, como os utilizamos e quais são os seus
              direitos de acordo com a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">2. Dados que Coletamos</h2>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong>Dados de cadastro:</strong> endereço de e-mail e senha (hash) para autenticação via Supabase.</li>
              <li><strong>Dados de uso:</strong> eventos de navegação anonimizados enviados ao Google Analytics 4.</li>
              <li><strong>Dados de pagamento:</strong> gerenciados exclusivamente pela Hotmart — não armazenamos dados de cartão.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">3. Armazenamento de Fotos</h2>
            <p>
              As fotografias do tipo &quot;antes e depois&quot; são armazenadas <strong>exclusivamente no
              dispositivo do usuário</strong> (via IndexedDB no navegador). Não realizamos upload automático
              para servidores.
            </p>
            <p className="mt-2">
              <strong>Backup opcional em nuvem (plano Premium):</strong> quando ativado pelo usuário, os dados
              são criptografados no dispositivo com AES-GCM antes de serem transmitidos. A chave de
              criptografia é derivada localmente e não é enviada ao servidor.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">4. Cookies e Pixels de Rastreamento</h2>
            <p>Utilizamos as seguintes tecnologias para análise e campanhas de marketing:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Google Analytics 4 (análise de uso)</li>
              <li>Meta Pixel (campanhas Facebook/Instagram)</li>
              <li>Twitter Pixel (campanhas X/Twitter)</li>
              <li>TikTok Pixel (campanhas TikTok)</li>
            </ul>
            <p className="mt-2">
              Esses serviços podem armazenar cookies no seu navegador. Você pode desativá-los nas
              configurações do navegador.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">5. Compartilhamento de Dados</h2>
            <p>
              Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros, exceto:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Supabase (autenticação e gerenciamento de assinaturas)</li>
              <li>Hotmart (processamento de pagamentos)</li>
              <li>Google, Meta, TikTok (analytics, conforme item 4)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">6. Seus Direitos (LGPD)</h2>
            <p>Como titular dos dados, você tem direito a:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong>Acesso:</strong> solicitar cópia dos dados que temos sobre você.</li>
              <li><strong>Correção:</strong> retificar dados incompletos ou incorretos.</li>
              <li><strong>Exclusão:</strong> solicitar a remoção dos seus dados e conta.</li>
              <li><strong>Portabilidade:</strong> exportar seus projetos via backup JSON a qualquer momento.</li>
              <li><strong>Revogação do consentimento:</strong> retirar o consentimento para analytics.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">7. Retenção de Dados</h2>
            <p>
              Mantemos seus dados de conta enquanto a conta estiver ativa. Após solicitação de exclusão,
              removemos os dados em até 30 dias úteis. Dados locais (fotos) são removidos imediatamente
              ao limpar o navegador ou desinstalar o PWA.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">8. Segurança</h2>
            <p>
              Utilizamos criptografia TLS em todas as comunicações, autenticação segura via Supabase,
              headers de segurança (HSTS, CSP, X-Frame-Options) e criptografia AES-GCM para backups opcionais.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">9. Contato do Encarregado (DPO)</h2>
            <p>
              Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato:
            </p>
            <p className="mt-2">
              <strong>E-mail:</strong>{' '}
              <a href="mailto:contato@revela.fun" className="text-revela-teal hover:underline">
                contato@revela.fun
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">10. Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta política periodicamente. A data da última atualização é informada
              no topo desta página. Recomendamos revisá-la regularmente.
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
