'use client';

import { useTr } from '@/contexts/language-context';

import Link from 'next/link';
import { Footer } from '@/components/footer';
import { LandingHeader } from '@/components/landing-header';
import { CookiePreferencesButton } from '@/components/cookie-consent';

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
            <p className="text-xs text-revela-cream/60">{tr('Última atualização: 21 de outubro de 2026', 'Last updated: October 21, 2026')}</p>
          </header>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('1. Quem somos', '1. Who we are')}</h2>
            <p>
              {tr(
                'O Revela é um aplicativo de comparação de fotos de antes e depois desenvolvido e mantido por ',
                'Revela is a before-and-after photo comparison app developed and maintained by '
              )}
              <strong>Gabriel Bordonal</strong>
              {tr(
                ', pessoa física, que é o controlador dos dados pessoais descritos nesta Política, nos termos da Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018). Contato: ',
                ', an individual, who is the controller of the personal data described in this Policy under Brazil\'s General Data Protection Law (LGPD — Law 13,709/2018). Contact: '
              )}
              <a href="mailto:contato@revela.fun" className="text-revela-teal hover:underline">contato@revela.fun</a>.
            </p>
            <p className="mt-2">
              {tr(
                'O Revela é destinado a profissionais maiores de 18 anos (como médicos, dentistas e esteticistas).',
                'Revela is intended for professionals aged 18 or over (such as physicians, dentists and aestheticians).'
              )}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('2. Seus dados e os dados dos seus pacientes', '2. Your data and your patients\' data')}</h2>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>
                <strong>{tr('Dados da sua conta:', 'Your account data:')}</strong>{' '}
                {tr('o Revela é o controlador (itens 3 a 10 desta Política).', 'Revela is the controller (sections 3 to 10 of this Policy).')}
              </li>
              <li>
                <strong>{tr('Fotos e informações dos seus pacientes:', 'Your patients\' photos and information:')}</strong>{' '}
                {tr(
                  'você, profissional, é o controlador. Cabe a você ter base legal para registrar e usar essas imagens (por exemplo, o consentimento do paciente ou a tutela da saúde) e atender os pedidos dos seus pacientes. O Revela não acessa esse conteúdo. Quando você usa o Cofre Revela, o Revela atua apenas como operador, guardando uma cópia criptografada que não consegue abrir (item 4).',
                  'you, the professional, are the controller. It is up to you to have a legal basis to record and use these images (for example, patient consent or health protection) and to handle your patients\' requests. Revela does not access this content. When you use the Revela Vault, Revela acts only as a processor, storing an encrypted copy it cannot open (section 4).'
                )}
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('3. Dados que tratamos, para quê e com qual base legal', '3. Data we process, why, and on what legal basis')}</h2>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>
                <strong>{tr('Conta:', 'Account:')}</strong>{' '}
                {tr('e-mail e senha (guardada de forma irreversível, em hash), para você entrar no app. Base legal: execução de contrato.', 'e-mail and password (stored irreversibly, as a hash), so you can sign in. Legal basis: performance of a contract.')}
              </li>
              <li>
                <strong>{tr('Assinatura:', 'Subscription:')}</strong>{' '}
                {tr('e-mail, plano contratado, situação e código da transação informados pela Hotmart, para liberar o seu plano. Não recebemos dados de cartão. Base legal: execução de contrato.', 'e-mail, plan, status and transaction code sent by Hotmart, to unlock your plan. We do not receive card details. Legal basis: performance of a contract.')}
              </li>
              <li>
                <strong>{tr('Preferências da conta:', 'Account preferences:')}</strong>{' '}
                {tr('por exemplo, quais dicas de uso você já viu, para não repeti-las em outros aparelhos. Base legal: execução de contrato.', 'for example, which usage tips you have already seen, so they are not repeated on other devices. Legal basis: performance of a contract.')}
              </li>
              <li>
                <strong>{tr('Cookies de análise e de anúncios (somente se você aceitar):', 'Analytics and advertising cookies (only if you accept):')}</strong>{' '}
                {tr('identificadores de cookie, páginas visitadas, tipo de aparelho e navegador e endereço IP, para medir o uso do site e das nossas campanhas. Nomes de projetos ou pacientes, fotos e notas nunca são enviados. Base legal: consentimento.', 'cookie identifiers, pages visited, device and browser type and IP address, to measure usage of the site and our campaigns. Project or patient names, photos and notes are never sent. Legal basis: consent.')}
              </li>
              <li>
                <strong>{tr('Registros técnicos:', 'Technical logs:')}</strong>{' '}
                {tr('endereço IP, data e hora de acesso, guardados pelos nossos provedores de hospedagem e autenticação para segurança e prevenção de fraudes. Base legal: legítimo interesse.', 'IP address, date and time of access, kept by our hosting and authentication providers for security and fraud prevention. Legal basis: legitimate interest.')}
              </li>
              <li>
                <strong>{tr('Atendimento:', 'Support:')}</strong>{' '}
                {tr('as mensagens que você nos envia por e-mail, para responder você.', 'the messages you send us by e-mail, to reply to you.')}
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('4. Fotos, notas e dados da clínica', '4. Photos, notes and clinic details')}</h2>
            <p>
              {tr('As fotos de antes e depois, as notas dos projetos e os dados da clínica usados no PDF (nome, endereço, telefone e logo) ficam ', 'Before and after photos, project notes and the clinic details used in the PDF (name, address, phone and logo) are kept ')}
              <strong>{tr('somente no seu aparelho', 'only on your device')}</strong>
              {tr(' (no armazenamento do navegador). Não fazemos envio automático para servidores.', ' (in the browser storage). We do not upload them automatically to servers.')}
            </p>
            <p className="mt-2">
              <strong>{tr('Cofre Revela (opcional, plano Premium):', 'Revela Vault (optional, Premium plan):')}</strong>{' '}
              {tr(
                'funciona somente se você ligá-lo. Ele guarda uma cópia dos projetos para que apareçam nos seus outros aparelhos. Antes de sair do aparelho, fotos e dados são criptografados com AES-GCM (256 bits). A chave fica protegida pela senha do cofre, criada por você, e por um código de recuperação mostrado só a você; nenhum dos dois é enviado ao servidor. Assim, o servidor guarda apenas conteúdo criptografado, e a equipe do Revela não consegue abrir o conteúdo das fotos e dados. Ficam visíveis apenas informações técnicas, como a sua conta, a quantidade e o tamanho dos arquivos e as datas de envio.',
                'it only works if you turn it on. It keeps a copy of your projects so they appear on your other devices. Before leaving the device, photos and data are encrypted with AES-GCM (256-bit). The key is protected by the vault password, chosen by you, and by a recovery code shown only to you; neither is sent to the server. The server therefore stores only encrypted content, and the Revela team cannot open the content of photos and data. Only technical information is visible, such as your account, the number and size of files and upload dates.'
              )}
            </p>
            <p className="mt-2">
              {tr(
                'Importante: se você perder a senha do cofre e também o código de recuperação, ninguém — nem o Revela — consegue recuperar o conteúdo guardado no Cofre. Os projetos que estão nos seus aparelhos continuam neles.',
                'Important: if you lose both the vault password and the recovery code, nobody — not even Revela — can recover the content stored in the Vault. Projects on your devices remain there.'
              )}
            </p>
            <p className="mt-2">
              {tr(
                'Exclusão: um projeto apagado vai para a lixeira por até 30 dias e sua cópia no Cofre é removida. Ao apagá-lo da lixeira, ele é removido também dos outros aparelhos conectados ao Cofre. Ao apagar o Cofre, todas as cópias guardadas no servidor são excluídas; os projetos que estão em cada aparelho permanecem nele.',
                'Deletion: a deleted project goes to the trash for up to 30 days and its copy in the Vault is removed. When it is deleted from the trash, it is also removed from the other devices connected to the Vault. When the Vault is deleted, all copies stored on the server are erased; projects on each device remain there.'
              )}
            </p>
            <p className="mt-2">
              {tr(
                'Fim da assinatura Premium: o Cofre para de sincronizar e as cópias continuam guardadas, criptografadas, até que você apague o Cofre ou peça a exclusão da sua conta.',
                'End of the Premium subscription: the Vault stops syncing and the copies remain stored, encrypted, until you delete the Vault or request deletion of your account.'
              )}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('5. Cookies e pixels', '5. Cookies and pixels')}</h2>
            <p>{tr('Somente se você aceitar no aviso de cookies, usamos:', 'Only if you accept in the cookie notice, we use:')}</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>{tr('Google Analytics 4 e Google Ads (medição de uso e de campanhas)', 'Google Analytics 4 and Google Ads (usage and campaign measurement)')}</li>
              <li>{tr('Meta Pixel (campanhas Facebook/Instagram)', 'Meta Pixel (Facebook/Instagram campaigns)')}</li>
              <li>{tr('X/Twitter Pixel (campanhas X)', 'X/Twitter Pixel (X campaigns)')}</li>
              <li>{tr('TikTok Pixel (campanhas TikTok)', 'TikTok Pixel (TikTok campaigns)')}</li>
            </ul>
            <p className="mt-2">
              {tr(
                'Os pixels de anúncio funcionam apenas nas páginas públicas do site, nunca dentro do app, onde ficam seus projetos. Se você recusar, nada disso é carregado e o app funciona normalmente. ',
                'Advertising pixels only run on the public pages of the site, never inside the app, where your projects are. If you decline, none of this is loaded and the app works normally. '
              )}
              <CookiePreferencesButton />
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('6. Com quem compartilhamos', '6. Who we share data with')}</h2>
            <p>{tr('Não vendemos nem alugamos dados pessoais. Usamos apenas os prestadores necessários para o serviço funcionar:', 'We do not sell or rent personal data. We only use the providers needed for the service to work:')}</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>{tr('Supabase: autenticação, dados da assinatura e armazenamento criptografado do Cofre;', 'Supabase: authentication, subscription data and encrypted Vault storage;')}</li>
              <li>{tr('Netlify: hospedagem do site e do app;', 'Netlify: hosting of the site and the app;')}</li>
              <li>{tr('Hotmart: venda e cobrança das assinaturas, conforme a política de privacidade da própria Hotmart;', 'Hotmart: sale and billing of subscriptions, under Hotmart\'s own privacy policy;')}</li>
              <li>{tr('Google, Meta, X e TikTok: somente se você aceitar os cookies (item 5).', 'Google, Meta, X and TikTok: only if you accept cookies (section 5).')}</li>
            </ul>
            <p className="mt-2">
              {tr('Também podemos compartilhar dados quando exigido por lei ou por ordem judicial.', 'We may also share data when required by law or court order.')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('7. Transferência internacional', '7. International transfer')}</h2>
            <p>
              {tr(
                'Alguns desses prestadores (como Google, Meta, X, TikTok, Netlify e, conforme a região contratada, a Supabase) podem guardar dados em servidores fora do Brasil. Nesses casos, a transferência ocorre com base nas garantias contratuais oferecidas por esses prestadores, nos termos do art. 33 da LGPD.',
                'Some of these providers (such as Google, Meta, X, TikTok, Netlify and, depending on the contracted region, Supabase) may store data on servers outside Brazil. In such cases, the transfer relies on the contractual safeguards offered by these providers, under art. 33 of the LGPD.'
              )}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('8. Por quanto tempo guardamos', '8. How long we keep data')}</h2>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>{tr('Dados da conta e da assinatura: enquanto a conta estiver ativa.', 'Account and subscription data: while the account is active.')}</li>
              <li>{tr('Após o pedido de exclusão da conta: removemos os dados, incluindo o Cofre, em até 30 dias úteis. Cópias de segurança dos prestadores podem levar alguns dias a mais para serem apagadas.', 'After an account deletion request: we remove the data, including the Vault, within 30 business days. Providers\' backup copies may take a few more days to be erased.')}</li>
              <li>{tr('Dados no seu aparelho: ficam sob seu controle e são apagados quando você os exclui, limpa os dados do navegador ou desinstala o app.', 'Data on your device: under your control, erased when you delete it, clear the browser data or uninstall the app.')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('9. Seus direitos', '9. Your rights')}</h2>
            <p>{tr('Pela LGPD (art. 18), você pode pedir:', 'Under the LGPD (art. 18), you may request:')}</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>{tr('confirmação de que tratamos seus dados e acesso a eles;', 'confirmation that we process your data and access to it;')}</li>
              <li>{tr('correção de dados incompletos, inexatos ou desatualizados;', 'correction of incomplete, inaccurate or outdated data;')}</li>
              <li>{tr('anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a lei;', 'anonymization, blocking or deletion of unnecessary data or data processed in breach of the law;')}</li>
              <li>{tr('portabilidade: você pode exportar seus projetos a qualquer momento pelo "Exportar backup";', 'portability: you can export your projects at any time with "Export backup";')}</li>
              <li>{tr('exclusão da sua conta e dos dados tratados com o seu consentimento;', 'deletion of your account and of data processed based on your consent;')}</li>
              <li>{tr('informação sobre com quem compartilhamos seus dados;', 'information about who we share your data with;')}</li>
              <li>{tr('informação sobre a possibilidade de não consentir e suas consequências, e revogação do consentimento a qualquer momento.', 'information about the option not to consent and its consequences, and withdrawal of consent at any time.')}</li>
            </ul>
            <p className="mt-2">
              {tr(
                'Para exercer seus direitos, escreva para contato@revela.fun a partir do e-mail da sua conta. Respondemos em até 15 dias. Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).',
                'To exercise your rights, write to contato@revela.fun from your account e-mail. We reply within 15 days. You may also file a complaint with Brazil\'s National Data Protection Authority (ANPD).'
              )}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('10. Segurança e incidentes', '10. Security and incidents')}</h2>
            <p>
              {tr(
                'Usamos conexão criptografada (TLS) em todas as comunicações, autenticação segura via Supabase, cabeçalhos de segurança (HSTS, CSP, X-Frame-Options) e criptografia AES-GCM no Cofre Revela. Se ocorrer um incidente de segurança que possa causar risco ou dano relevante, comunicaremos os titulares afetados e a ANPD, conforme o art. 48 da LGPD.',
                'We use encrypted connections (TLS) for all communications, secure authentication via Supabase, security headers (HSTS, CSP, X-Frame-Options) and AES-GCM encryption in the Revela Vault. If a security incident occurs that may cause relevant risk or harm, we will notify affected data subjects and the ANPD, as required by art. 48 of the LGPD.'
              )}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('11. Canal de contato e encarregado', '11. Contact channel and data protection officer')}</h2>
            <p>
              {tr(
                'O Revela é mantido por pessoa física e se enquadra como agente de tratamento de pequeno porte (Resolução CD/ANPD nº 2/2022), por isso não há encarregado (DPO) nomeado. Pedidos e dúvidas sobre dados pessoais devem ser enviados para:',
                'Revela is maintained by an individual and qualifies as a small-scale processing agent (ANPD Resolution CD/ANPD No. 2/2022), so no data protection officer (DPO) is appointed. Requests and questions about personal data should be sent to:'
              )}
            </p>
            <p className="mt-2">
              <strong>E-mail:</strong>{' '}
              <a href="mailto:contato@revela.fun" className="text-revela-teal hover:underline">
                contato@revela.fun
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">{tr('12. Alterações nesta Política', '12. Changes to this Policy')}</h2>
            <p>
              {tr(
                'Podemos atualizar esta Política. A data da última atualização aparece no topo da página. Mudanças relevantes serão avisadas no app ou por e-mail.',
                'We may update this Policy. The last updated date is shown at the top of the page. Relevant changes will be announced in the app or by e-mail.'
              )}
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
