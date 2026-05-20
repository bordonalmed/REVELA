import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/footer';
import { LandingHeader } from '@/components/landing-header';

export const metadata: Metadata = {
  title: 'App Antes e Depois para Esteticistas | Revela',
  description: 'Fotos antes e depois de tratamentos estéticos. Documente procedimentos faciais, corporais e capilares com timeline de evolução e privacidade total.',
  keywords: 'app antes depois esteticista, fotos tratamento estético, documentação procedimentos estéticos, portfólio esteticista, comparação fotos clínica estética',
  alternates: { canonical: 'https://www.revela.fun/para-esteticistas' },
  openGraph: {
    title: 'App Antes e Depois para Esteticistas | Revela',
    description: 'Fotos antes e depois de tratamentos estéticos. Timeline de evolução e privacidade total.',
    url: 'https://www.revela.fun/para-esteticistas',
  },
};

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

export default function ParaEsteticistasPage() {
  return (
    <div className="bg-revela-dark min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingHeader />

      <main className="flex-1 pt-20 pb-16 px-4 sm:px-6 md:px-8">
        <section className="max-w-5xl mx-auto space-y-12 text-revela-cream opacity-90 text-sm sm:text-base leading-relaxed">
          <header className="text-center max-w-3xl mx-auto">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] opacity-70 mb-3">
              Para esteticistas
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light mb-3">
              Registre a transformação dos seus clientes com fotos profissionais
            </h1>
            <p className="text-sm sm:text-base opacity-80">
              Documente cada sessão de tratamento estético. Mostre resultados reais com comparação
              antes e depois e construa um portfólio que vende por você.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup"
                className="px-6 py-2.5 rounded-lg bg-revela-teal text-white text-sm font-medium hover:opacity-90 text-center"
              >
                Criar conta grátis
              </Link>
              <Link
                href="/planos"
                className="px-6 py-2.5 rounded-lg border-2 border-revela-cream text-revela-cream text-sm font-medium hover:bg-revela-cream/10 text-center"
              >
                Ver planos
              </Link>
            </div>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg sm:text-xl font-medium mb-2">Procedimentos que você pode documentar</h2>
              <ul className="mt-3 list-disc list-inside space-y-1">
                <li>Limpeza de pele e peeling — evolução sessão a sessão</li>
                <li>Tratamentos corporais — redução de medidas, celulite, gordura localizada</li>
                <li>Tratamentos faciais — manchas, acne, rejuvenescimento</li>
                <li>Micropigmentação e design de sobrancelha</li>
                <li>Tratamentos capilares — queda, crescimento, coloração</li>
                <li>Pós-procedimento cirúrgico — drenagem, recuperação</li>
              </ul>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-medium mb-2">Como o Revela ajuda seu negócio</h2>
              <ul className="mt-3 list-disc list-inside space-y-1">
                <li>Portfólio profissional com resultados reais documentados</li>
                <li>Mostre ao cliente a evolução com slider no tablet ou celular</li>
                <li>Timeline de sessões para tratamentos longos (Premium)</li>
                <li>Exporte para Instagram/WhatsApp com sua marca (Pro)</li>
                <li>Apresentações profissionais para captar novos clientes</li>
                <li>Dados seguros — fotos ficam só no seu aparelho</li>
              </ul>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-revela-cream/10 bg-revela-cream/[0.03] p-6">
              <h3 className="text-base font-medium mb-2">Timeline de Sessões</h3>
              <p className="text-sm opacity-80">
                Registre cada sessão com data e foto. Veja toda a evolução do tratamento
                em uma timeline visual — perfeito para protocolos de várias sessões.
              </p>
            </div>
            <div className="rounded-xl border border-revela-cream/10 bg-revela-cream/[0.03] p-6">
              <h3 className="text-base font-medium mb-2">Export para Redes Sociais</h3>
              <p className="text-sm opacity-80">
                Gere imagens comparativas no formato ideal para Instagram, WhatsApp e
                Facebook. Adicione sua logo como marca d&apos;água.
              </p>
            </div>
            <div className="rounded-xl border border-revela-cream/10 bg-revela-cream/[0.03] p-6">
              <h3 className="text-base font-medium mb-2">Privacidade dos Clientes</h3>
              <p className="text-sm opacity-80">
                Fotos armazenadas apenas no seu dispositivo. Seus clientes podem confiar
                que as imagens não estão em nenhum servidor na nuvem.
              </p>
            </div>
          </section>

          <section className="text-center max-w-3xl mx-auto">
            <h2 className="text-lg sm:text-xl font-medium mb-3">
              Transforme seus resultados em portfólio profissional
            </h2>
            <p className="text-sm sm:text-base opacity-80 mb-6">
              Comece gratuitamente com até 3 projetos. Ideal para testar com seus primeiros
              clientes. Sem compromisso, sem cartão de crédito.
            </p>
            <Link
              href="/signup"
              className="inline-block px-8 py-3 rounded-lg bg-revela-teal text-white text-sm font-medium hover:opacity-90"
            >
              Começar a usar o Revela
            </Link>
          </section>
        </section>
      </main>

      <Footer />
    </div>
  );
}
