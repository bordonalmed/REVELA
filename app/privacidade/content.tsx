'use client';

import { useTr } from '@/contexts/language-context';

import Link from 'next/link';
import { Footer } from '@/components/footer';
import { LandingHeader } from '@/components/landing-header';

export default function PrivacidadePageContent() {
  const tr = useTr();
  return (
    <div className="bg-revela-dark min-h-screen flex flex-col">
      <LandingHeader />

      <main className="flex-1 pt-20 pb-16 px-4 sm:px-6 md:px-8">
        <article className="max-w-3xl mx-auto prose-sm text-revela-cream opacity-90 text-sm sm:text-base leading-relaxed space-y-8">
          <header className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-revela-cream mb-2">
              {tr('Política de Privacidade', 'Privacy Policy')}
            </h1>
            <p className="text-xs text-revela-cream/60">{tr('Última atualização: 20 de maio de 2026', 'Last updated: May 20, 2026')}</p>
          </header>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('1. Introdução', '1. Introduction')}</h2>
            <p>
              {tr('O ', '')}<strong>Revela</strong>{tr(' ("nós", "nosso") respeita a privacidade dos seus usuários. Esta Política descreve quais dados pessoais coletamos, como os utilizamos e quais são os seus direitos de acordo com a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).', ' ("we", "our") respects the privacy of its users. This Policy describes what personal data we collect, how we use it and what your rights are under Brazil\'s General Data Protection Law (LGPD — Law 13,709/2018).')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('2. Dados que Coletamos', '2. Data We Collect')}</h2>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong>{tr('Dados de cadastro:', 'Account data:')}</strong> {tr('endereço de e-mail e senha (hash) para autenticação via Supabase.', 'email address and password (hashed) for authentication via Supabase.')}</li>
              <li><strong>{tr('Dados de uso:', 'Usage data:')}</strong> {tr('eventos de navegação anonimizados enviados ao Google Analytics 4.', 'anonymized browsing events sent to Google Analytics 4.')}</li>
              <li><strong>{tr('Dados de pagamento:', 'Payment data:')}</strong> {tr('gerenciados exclusivamente pela Hotmart — não armazenamos dados de cartão.', 'handled exclusively by Hotmart — we do not store card details.')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('3. Armazenamento de Fotos', '3. Photo Storage')}</h2>
            <p>
              {tr('As fotografias do tipo "antes e depois" são armazenadas ', '"Before and after" photographs are stored ')}<strong>{tr('exclusivamente no dispositivo do usuário', 'exclusively on the user\'s device')}</strong>{tr(' (via IndexedDB no navegador). Não realizamos upload automático para servidores.', ' (via IndexedDB in the browser). We do not upload them automatically to servers.')}
            </p>
            <p className="mt-2">
              <strong>{tr('Backup opcional em nuvem (plano Premium):', 'Optional cloud backup (Premium plan):')}</strong> {tr('quando ativado pelo usuário, os dados são criptografados no dispositivo com AES-GCM antes de serem transmitidos. A chave de criptografia é derivada localmente e não é enviada ao servidor.', 'when enabled by the user, data is encrypted on the device with AES-GCM before being transmitted. The encryption key is derived locally and is never sent to the server.')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('4. Cookies e Pixels de Rastreamento', '4. Cookies and Tracking Pixels')}</h2>
            <p>{tr('Utilizamos as seguintes tecnologias para análise e campanhas de marketing:', 'We use the following technologies for analytics and marketing campaigns:')}</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>{tr('Google Analytics 4 (análise de uso)', 'Google Analytics 4 (usage analytics)')}</li>
              <li>{tr('Meta Pixel (campanhas Facebook/Instagram)', 'Meta Pixel (Facebook/Instagram campaigns)')}</li>
              <li>{tr('Twitter Pixel (campanhas X/Twitter)', 'Twitter Pixel (X/Twitter campaigns)')}</li>
              <li>{tr('TikTok Pixel (campanhas TikTok)', 'TikTok Pixel (TikTok campaigns)')}</li>
            </ul>
            <p className="mt-2">
              {tr('Esses serviços podem armazenar cookies no seu navegador. Você pode desativá-los nas configurações do navegador.', 'These services may store cookies in your browser. You can disable them in your browser settings.')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('5. Compartilhamento de Dados', '5. Data Sharing')}</h2>
            <p>
              {tr('Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros, exceto:', 'We do not sell, rent or share your personal data with third parties, except:')}
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>{tr('Supabase (autenticação e gerenciamento de assinaturas)', 'Supabase (authentication and subscription management)')}</li>
              <li>{tr('Hotmart (processamento de pagamentos)', 'Hotmart (payment processing)')}</li>
              <li>{tr('Google, Meta, TikTok (analytics, conforme item 4)', 'Google, Meta, TikTok (analytics, as described in section 4)')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('6. Seus Direitos (LGPD)', '6. Your Rights (LGPD)')}</h2>
            <p>{tr('Como titular dos dados, você tem direito a:', 'As the data subject, you have the right to:')}</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong>{tr('Acesso:', 'Access:')}</strong> {tr('solicitar cópia dos dados que temos sobre você.', 'request a copy of the data we hold about you.')}</li>
              <li><strong>{tr('Correção:', 'Correction:')}</strong> {tr('retificar dados incompletos ou incorretos.', 'correct incomplete or inaccurate data.')}</li>
              <li><strong>{tr('Exclusão:', 'Deletion:')}</strong> {tr('solicitar a remoção dos seus dados e conta.', 'request removal of your data and account.')}</li>
              <li><strong>{tr('Portabilidade:', 'Portability:')}</strong> {tr('exportar seus projetos via backup JSON a qualquer momento.', 'export your projects via JSON backup at any time.')}</li>
              <li><strong>{tr('Revogação do consentimento:', 'Withdrawal of consent:')}</strong> {tr('retirar o consentimento para analytics.', 'withdraw consent for analytics.')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('7. Retenção de Dados', '7. Data Retention')}</h2>
            <p>
              {tr('Mantemos seus dados de conta enquanto a conta estiver ativa. Após solicitação de exclusão, removemos os dados em até 30 dias úteis. Dados locais (fotos) são removidos imediatamente ao limpar o navegador ou desinstalar o PWA.', 'We keep your account data while your account is active. After a deletion request, we remove the data within 30 business days. Local data (photos) is removed immediately when you clear the browser or uninstall the PWA.')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('8. Segurança', '8. Security')}</h2>
            <p>
              {tr('Utilizamos criptografia TLS em todas as comunicações, autenticação segura via Supabase, headers de segurança (HSTS, CSP, X-Frame-Options) e criptografia AES-GCM para backups opcionais.', 'We use TLS encryption for all communications, secure authentication via Supabase, security headers (HSTS, CSP, X-Frame-Options) and AES-GCM encryption for optional backups.')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('9. Contato do Encarregado (DPO)', '9. Data Protection Officer (DPO) Contact')}</h2>
            <p>
              {tr('Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato:', 'To exercise your rights or ask questions about this policy, contact us:')}
            </p>
            <p className="mt-2">
              <strong>E-mail:</strong>{' '}
              <a href="mailto:contato@revela.fun" className="text-revela-teal hover:underline">
                contato@revela.fun
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('10. Alterações nesta Política', '10. Changes to This Policy')}</h2>
            <p>
              {tr('Podemos atualizar esta política periodicamente. A data da última atualização é informada no topo desta página. Recomendamos revisá-la regularmente.', 'We may update this policy from time to time. The last updated date is shown at the top of this page. We recommend reviewing it regularly.')}
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
