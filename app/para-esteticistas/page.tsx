import type { Metadata } from 'next';
import Content from './content';

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

export default function ParaEsteticistasPage() {
  return <Content />;
}
