'use client';

import { useTr } from '@/contexts/language-context';

import Link from 'next/link';
import { Footer } from '@/components/footer';
import { LandingHeader } from '@/components/landing-header';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Revela para Esteticistas',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web',
  url: 'https://www.revela.fun/para-esteticistas',
  description: 'App profissional para documentação de tratamentos estéticos com comparação antes e depois, timeline de sessões e exportação para redes sociais.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
};

export default function ParaEsteticistasPageContent() {
  const tr = useTr();
  return (
    <div className="bg-revela-dark min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingHeader />

      <main className="flex-1 pt-20 pb-16 px-4 sm:px-6 md:px-8">
        <section className="max-w-5xl mx-auto space-y-12 text-revela-cream opacity-90 text-sm sm:text-base leading-relaxed">
          <header className="text-center max-w-3xl mx-auto">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] opacity-70 mb-3">
              {tr('Para esteticistas', 'For aestheticians')}
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light mb-3">
              {tr('Registre a transformação dos seus clientes com fotos profissionais', 'Record your clients\' transformation with professional photos')}
            </h1>
            <p className="text-sm sm:text-base opacity-80">
              {tr('Documente cada sessão de tratamento estético. Mostre resultados reais com comparação antes e depois e construa um portfólio que vende por você.', 'Document every aesthetic treatment session. Show real results with before and after comparisons and build a portfolio that sells for you.')}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup"
                className="px-6 py-2.5 rounded-lg bg-revela-teal text-white text-sm font-medium hover:opacity-90 text-center"
              >
                {tr('Criar conta grátis', 'Create free account')}
              </Link>
              <Link
                href="/planos"
                className="px-6 py-2.5 rounded-lg border-2 border-revela-cream text-revela-cream text-sm font-medium hover:bg-revela-cream/10 text-center"
              >
                {tr('Ver planos', 'View plans')}
              </Link>
            </div>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg sm:text-xl font-medium mb-2">{tr('Procedimentos que você pode documentar', 'Procedures you can document')}</h2>
              <ul className="mt-3 list-disc list-inside space-y-1">
                <li>{tr('Limpeza de pele e peeling — evolução sessão a sessão', 'Facials and peels — session-by-session progress')}</li>
                <li>{tr('Tratamentos corporais — redução de medidas, celulite, gordura localizada', 'Body treatments — inch loss, cellulite, localized fat')}</li>
                <li>{tr('Tratamentos faciais — manchas, acne, rejuvenescimento', 'Facial treatments — spots, acne, rejuvenation')}</li>
                <li>{tr('Micropigmentação e design de sobrancelha', 'Micropigmentation and brow design')}</li>
                <li>{tr('Tratamentos capilares — queda, crescimento, coloração', 'Hair treatments — hair loss, growth, coloring')}</li>
                <li>{tr('Pós-procedimento cirúrgico — drenagem, recuperação', 'Post-surgery care — drainage, recovery')}</li>
              </ul>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-medium mb-2">{tr('Como o Revela ajuda seu negócio', 'How Revela helps your business')}</h2>
              <ul className="mt-3 list-disc list-inside space-y-1">
                <li>{tr('Portfólio profissional com resultados reais documentados', 'Professional portfolio with real documented results')}</li>
                <li>{tr('Mostre ao cliente a evolução com slider no tablet ou celular', 'Show clients their progress with a slider on tablet or phone')}</li>
                <li>{tr('Timeline de sessões para tratamentos longos (Premium)', 'Session timeline for long treatments (Premium)')}</li>
                <li>{tr('Exporte para Instagram/WhatsApp com sua marca (Pro)', 'Export to Instagram/WhatsApp with your brand (Pro)')}</li>
                <li>{tr('Apresentações profissionais para captar novos clientes', 'Professional presentations to win new clients')}</li>
                <li>{tr('Dados seguros — fotos ficam só no seu aparelho', 'Secure data — photos stay on your device')}</li>
              </ul>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-revela-cream/10 bg-revela-cream/[0.03] p-6">
              <h3 className="text-base font-medium mb-2">{tr('Timeline de Sessões', 'Session Timeline')}</h3>
              <p className="text-sm opacity-80">
                {tr('Registre cada sessão com data e foto. Veja toda a evolução do tratamento em uma timeline visual — perfeito para protocolos de várias sessões.', 'Record each session with date and photo. See the whole treatment progress on a visual timeline — perfect for multi-session protocols.')}
              </p>
            </div>
            <div className="rounded-xl border border-revela-cream/10 bg-revela-cream/[0.03] p-6">
              <h3 className="text-base font-medium mb-2">{tr('Export para Redes Sociais', 'Social Media Export')}</h3>
              <p className="text-sm opacity-80">
                {tr(
                  'Gere imagens comparativas no formato ideal para Instagram, WhatsApp e Facebook. Adicione sua logo como marca d’água.',
                  'Create comparison images in the ideal format for Instagram, WhatsApp and Facebook. Add your logo as a watermark.'
                )}
              </p>
            </div>
            <div className="rounded-xl border border-revela-cream/10 bg-revela-cream/[0.03] p-6">
              <h3 className="text-base font-medium mb-2">{tr('Privacidade dos Clientes', 'Client Privacy')}</h3>
              <p className="text-sm opacity-80">
                {tr('Fotos armazenadas apenas no seu dispositivo. Seus clientes podem confiar que as imagens não estão em nenhum servidor na nuvem.', 'Photos stored only on your device. Your clients can trust that their images aren\'t on any cloud server.')}
              </p>
            </div>
          </section>

          <section className="text-center max-w-3xl mx-auto">
            <h2 className="text-lg sm:text-xl font-medium mb-3">
              {tr('Transforme seus resultados em portfólio profissional', 'Turn your results into a professional portfolio')}
            </h2>
            <p className="text-sm sm:text-base opacity-80 mb-6">
              {tr('Comece gratuitamente com até 3 projetos. Ideal para testar com seus primeiros clientes. Sem compromisso, sem cartão de crédito.', 'Start free with up to 3 projects. Ideal for trying with your first clients. No commitment, no credit card.')}
            </p>
            <Link
              href="/signup"
              className="inline-block px-8 py-3 rounded-lg bg-revela-teal text-white text-sm font-medium hover:opacity-90"
            >
              {tr('Começar a usar o Revela', 'Start using Revela')}
            </Link>
          </section>
        </section>
      </main>

      <Footer />
    </div>
  );
}
