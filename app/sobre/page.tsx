'use client';

import { useTr } from '@/contexts/language-context';

import { LandingHeader } from '@/components/landing-header';
import { Footer } from '@/components/footer';

export default function SobrePage() {
  const tr = useTr();
  return (
    <div className="bg-revela-dark min-h-screen flex flex-col">
      <LandingHeader />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 md:px-8">
        <section className="max-w-3xl mx-auto space-y-8 text-revela-cream opacity-90 text-sm sm:text-base leading-relaxed">
          <header className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light mb-3">
              {tr('Sobre o Revela', 'About Revela')}
            </h1>
            <p className="text-sm sm:text-base opacity-80">
              {tr('Desenvolvido por médicos para médicos e outros profissionais da saúde que trabalham com fotos de antes e depois.', 'Built by doctors for doctors and other health professionals who work with before and after photos.')}
            </p>
          </header>

          <section>
            <h2 className="text-lg sm:text-xl font-medium mb-2">{tr('Nossa origem', 'Our origin')}</h2>
            <p>
              {tr('O Revela nasceu da prática clínica: na rotina de consultórios e clínicas, documentar a evolução de um tratamento com fotos é essencial — mas costuma ser trabalhoso, desorganizado e pouco padronizado. Pastas soltas no computador ou no celular não ajudam a contar a história completa ao paciente.', 'Revela was born from clinical practice: in the day-to-day of practices and clinics, documenting treatment progress with photos is essential — but it is usually time-consuming, disorganized and inconsistent. Loose folders on a computer or phone don\'t help tell the patient the full story.')}
            </p>
            <p className="mt-3">
              {tr('A partir dessa dor, médicos e profissionais de tecnologia decidiram criar uma ferramenta simples e focada: um ambiente único para comparar, organizar e apresentar fotos de antes e depois com privacidade total.', 'From that pain point, doctors and technology professionals set out to build a simple, focused tool: one place to compare, organize and present before and after photos with total privacy.')}
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-medium mb-2">{tr('Propósito', 'Purpose')}</h2>
            <p>
              {tr('Nosso objetivo é ajudar profissionais da saúde a comunicar resultados de forma clara, ética e visualmente profissional. Acreditamos que uma boa documentação fotográfica:', 'Our goal is to help health professionals communicate results in a clear, ethical and visually professional way. We believe good photo documentation:')}
            </p>
            <ul className="mt-3 list-disc list-inside space-y-1">
              <li>{tr('melhora a compreensão do paciente sobre o próprio tratamento;', 'improves the patient\'s understanding of their own treatment;')}</li>
              <li>{tr('facilita o acompanhamento de longo prazo;', 'makes long-term follow-up easier;')}</li>
              <li>{tr('apoia decisões clínicas com base em evidências visuais;', 'supports clinical decisions with visual evidence;')}</li>
              <li>{tr('valoriza o trabalho de toda a equipe.', 'values the work of the whole team.')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-medium mb-2">{tr('Foco em privacidade', 'Privacy first')}</h2>
            <p>
              {tr('O Revela foi desenhado com a privacidade como prioridade. As fotos são armazenadas localmente no dispositivo, sem envio automático para servidores externos. Dessa forma, você mantém maior controle sobre os arquivos e reduz a superfície de exposição dos dados.', 'Revela was designed with privacy as a priority. Photos are stored locally on the device, with no automatic upload to external servers. That way you keep more control over your files and reduce data exposure.')}
            </p>
            <p className="mt-3">
              {tr('Ao evoluir o produto, seguimos atentos às boas práticas de segurança da informação e às diretrizes da LGPD, sempre com transparência em relação ao uso e ao destino dos dados.', 'As the product evolves, we follow information security best practices and data protection law (Brazil\'s LGPD), always being transparent about how and where data is used.')}
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-medium mb-2">{tr('Para quem é o Revela', 'Who Revela is for')}</h2>
            <p>
              {tr('Embora tenha sido pensado inicialmente para médicos, o Revela é útil para qualquer profissional que trabalhe com transformação visual:', 'Although it was first designed for doctors, Revela is useful for any professional who works with visual transformation:')}
            </p>
            <ul className="mt-3 list-disc list-inside space-y-1">
              <li>{tr('médicos de diversas especialidades;', 'doctors of many specialties;')}</li>
              <li>{tr('dentistas e ortodontistas;', 'dentists and orthodontists;')}</li>
              <li>{tr('fisioterapeutas e profissionais de reabilitação;', 'physiotherapists and rehabilitation professionals;')}</li>
              <li>{tr('esteticistas e profissionais da estética;', 'aestheticians and aesthetics professionals;')}</li>
              <li>{tr('nutricionistas e outros profissionais que acompanham mudanças corporais.', 'nutritionists and other professionals who track body changes.')}</li>
            </ul>
          </section>
        </section>
      </main>

      <Footer />
    </div>
  );
}

