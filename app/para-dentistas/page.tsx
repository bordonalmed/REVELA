import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/footer';
import { LandingHeader } from '@/components/landing-header';

export const metadata: Metadata = {
  title: 'App Fotos Antes e Depois para Dentistas | Revela',
  description: 'Documentação fotográfica odontológica profissional. Compare fotos antes e depois de clareamento dental, facetas, ortodontia e implantes com privacidade total.',
  keywords: 'app fotos antes depois dentista, documentação fotográfica odontológica, comparação fotos clareamento dental, fotos antes depois ortodontia, software odontologia estética',
  alternates: { canonical: 'https://www.revela.fun/para-dentistas' },
  openGraph: {
    title: 'App Fotos Antes e Depois para Dentistas | Revela',
    description: 'Documentação fotográfica odontológica profissional. Compare fotos antes e depois com privacidade total.',
    url: 'https://www.revela.fun/para-dentistas',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Revela para Dentistas',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web',
  url: 'https://www.revela.fun/para-dentistas',
  description: 'App profissional para comparação de fotos antes e depois em odontologia — clareamento, facetas, ortodontia e implantes.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
};

export default function ParaDentistasPage() {
  return (
    <div className="bg-revela-dark min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingHeader />

      <main className="flex-1 pt-20 pb-16 px-4 sm:px-6 md:px-8">
        <section className="max-w-5xl mx-auto space-y-12 text-revela-cream opacity-90 text-sm sm:text-base leading-relaxed">
          <header className="text-center max-w-3xl mx-auto">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] opacity-70 mb-3">
              Para dentistas
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light mb-3">
              Documentação fotográfica odontológica com comparação profissional
            </h1>
            <p className="text-sm sm:text-base opacity-80">
              Registre a evolução de clareamentos, facetas, ortodontia e implantes de forma organizada.
              Mostre resultados reais aos pacientes com o slider antes e depois.
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
              <h2 className="text-lg sm:text-xl font-medium mb-2">Casos de uso em odontologia</h2>
              <p>O Revela é ideal para documentar:</p>
              <ul className="mt-3 list-disc list-inside space-y-1">
                <li>Clareamento dental — antes, durante e após as sessões</li>
                <li>Facetas e lentes de contato — planejamento e resultado final</li>
                <li>Ortodontia — evolução mês a mês do alinhamento</li>
                <li>Implantes e próteses — comparação do edêntulo ao resultado protético</li>
                <li>Harmonização orofacial — lábios, bichectomia, preenchimentos</li>
              </ul>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-medium mb-2">Benefícios para o consultório</h2>
              <ul className="mt-3 list-disc list-inside space-y-1">
                <li>Mostre ao paciente a evolução com slider interativo no próprio celular</li>
                <li>Gere relatórios em PDF para enviar ao paciente (plano Premium)</li>
                <li>Timeline de evolução para ortodontia e tratamentos longos</li>
                <li>Exporte imagens para redes sociais com sua marca (plano Pro)</li>
                <li>Fotos nunca saem do dispositivo — segurança para dados sensíveis</li>
              </ul>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-revela-cream/10 bg-revela-cream/[0.03] p-6">
              <h3 className="text-base font-medium mb-2">Privacidade Total</h3>
              <p className="text-sm opacity-80">
                Fotos armazenadas apenas no seu dispositivo. Sem upload para nuvem. Ideal para
                cumprir regulamentações de proteção de dados de pacientes.
              </p>
            </div>
            <div className="rounded-xl border border-revela-cream/10 bg-revela-cream/[0.03] p-6">
              <h3 className="text-base font-medium mb-2">Comparação Profissional</h3>
              <p className="text-sm opacity-80">
                Slider interativo, zoom com marcações, medições sobre a imagem.
                Perfeito para mostrar resultados na cadeira do paciente.
              </p>
            </div>
            <div className="rounded-xl border border-revela-cream/10 bg-revela-cream/[0.03] p-6">
              <h3 className="text-base font-medium mb-2">Laudos em PDF</h3>
              <p className="text-sm opacity-80">
                Gere relatórios visuais com as fotos antes/depois para entregar ao paciente
                ou anexar ao prontuário digital.
              </p>
            </div>
          </section>

          <section className="text-center max-w-3xl mx-auto">
            <h2 className="text-lg sm:text-xl font-medium mb-3">
              Comece a documentar seus casos hoje
            </h2>
            <p className="text-sm sm:text-base opacity-80 mb-6">
              Crie sua conta em segundos. O plano Free permite até 3 projetos — ideal para testar.
              Sem compromisso, sem cartão de crédito.
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
