import type { Metadata } from 'next';
import Content from './content';

export const metadata: Metadata = {
  title: 'Termos de Uso | Revela',
  description: 'Termos de uso do Revela. Condições para utilização da plataforma de comparação de fotos antes e depois.',
  alternates: { canonical: 'https://www.revela.fun/termos' },
};

export default function TermosPage() {
  return <Content />;
}
