import type { Metadata } from 'next';
import Content from './content';

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

export default function ParaDentistasPage() {
  return <Content />;
}
