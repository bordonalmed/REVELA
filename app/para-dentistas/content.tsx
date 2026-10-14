'use client';

import { useTr } from '@/contexts/language-context';

import Link from 'next/link';
import { Footer } from '@/components/footer';
import { LandingHeader } from '@/components/landing-header';

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

export default function ParaDentistasPageContent() {
  const tr = useTr();
  return (
    <div className="bg-revela-dark min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingHeader />

      <main className="flex-1 pt-20 pb-16 px-4 sm:px-6 md:px-8">
        <section className="max-w-5xl mx-auto space-y-12 text-revela-cream opacity-90 text-sm sm:text-base leading-relaxed">
          <header className="text-center max-w-3xl mx-auto">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] opacity-70 mb-3">
              {tr('Para dentistas', 'For dentists')}
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light mb-3">
              {tr('Documentação fotográfica odontológica com comparação profissional', 'Dental photo documentation with professional comparison')}
            </h1>
            <p className="text-sm sm:text-base opacity-80">
              {tr('Registre a evolução de clareamentos, facetas, ortodontia e implantes de forma organizada. Mostre resultados reais aos pacientes com o slider antes e depois.', 'Track whitening, veneers, orthodontics and implants in an organized way. Show patients real results with the before and after slider.')}
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
              <h2 className="text-lg sm:text-xl font-medium mb-2">{tr('Casos de uso em odontologia', 'Use cases in dentistry')}</h2>
              <p>{tr('O Revela é ideal para documentar:', 'Revela is ideal for documenting:')}</p>
              <ul className="mt-3 list-disc list-inside space-y-1">
                <li>{tr('Clareamento dental — antes, durante e após as sessões', 'Teeth whitening — before, during and after sessions')}</li>
                <li>{tr('Facetas e lentes de contato — planejamento e resultado final', 'Veneers — planning and final result')}</li>
                <li>{tr('Ortodontia — evolução mês a mês do alinhamento', 'Orthodontics — month-by-month alignment progress')}</li>
                <li>{tr('Implantes e próteses — comparação do edêntulo ao resultado protético', 'Implants and prosthetics — from edentulous to the final prosthetic result')}</li>
                <li>{tr('Harmonização orofacial — lábios, bichectomia, preenchimentos', 'Orofacial harmonization — lips, buccal fat removal, fillers')}</li>
              </ul>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-medium mb-2">{tr('Benefícios para o consultório', 'Benefits for your practice')}</h2>
              <ul className="mt-3 list-disc list-inside space-y-1">
                <li>{tr('Mostre ao paciente a evolução com slider interativo no próprio celular', 'Show patients their progress with an interactive slider right on your phone')}</li>
                <li>{tr('Gere relatórios em PDF para enviar ao paciente (plano Premium)', 'Generate PDF reports to send to patients (Premium plan)')}</li>
                <li>{tr('Timeline de evolução para ortodontia e tratamentos longos', 'Evolution timeline for orthodontics and long treatments')}</li>
                <li>{tr('Exporte imagens para redes sociais com sua marca (plano Pro)', 'Export images for social media with your brand (Pro plan)')}</li>
                <li>{tr('Fotos nunca saem do dispositivo — segurança para dados sensíveis', 'Photos never leave your device — security for sensitive data')}</li>
              </ul>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-revela-cream/10 bg-revela-cream/[0.03] p-6">
              <h3 className="text-base font-medium mb-2">{tr('Privacidade Total', 'Total Privacy')}</h3>
              <p className="text-sm opacity-80">
                {tr('Fotos armazenadas apenas no seu dispositivo. Sem upload para nuvem. Ideal para cumprir regulamentações de proteção de dados de pacientes.', 'Photos stored only on your device. No cloud upload. Ideal for complying with patient data protection rules.')}
              </p>
            </div>
            <div className="rounded-xl border border-revela-cream/10 bg-revela-cream/[0.03] p-6">
              <h3 className="text-base font-medium mb-2">{tr('Comparação Profissional', 'Professional Comparison')}</h3>
              <p className="text-sm opacity-80">
                {tr('Slider interativo, zoom com marcações, medições sobre a imagem. Perfeito para mostrar resultados na cadeira do paciente.', 'Interactive slider, zoom with annotations, measurements on the image. Perfect for showing results chairside.')}
              </p>
            </div>
            <div className="rounded-xl border border-revela-cream/10 bg-revela-cream/[0.03] p-6">
              <h3 className="text-base font-medium mb-2">{tr('Laudos em PDF', 'PDF Reports')}</h3>
              <p className="text-sm opacity-80">
                {tr('Gere relatórios visuais com as fotos antes/depois para entregar ao paciente ou anexar ao prontuário digital.', 'Generate visual reports with before/after photos to give the patient or attach to the digital record.')}
              </p>
            </div>
          </section>

          <section className="text-center max-w-3xl mx-auto">
            <h2 className="text-lg sm:text-xl font-medium mb-3">
              {tr('Comece a documentar seus casos hoje', 'Start documenting your cases today')}
            </h2>
            <p className="text-sm sm:text-base opacity-80 mb-6">
              {tr('Crie sua conta em segundos. O plano Free permite até 3 projetos — ideal para testar. Sem compromisso, sem cartão de crédito.', 'Create your account in seconds. The Free plan allows up to 3 projects — ideal for trying it out. No commitment, no credit card.')}
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
