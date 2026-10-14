import type { Metadata } from 'next';
import Content from './content';

export const metadata: Metadata = {
  title: 'Política de Privacidade | Revela',
  description: 'Política de privacidade do Revela. Saiba como tratamos seus dados pessoais de acordo com a LGPD.',
  alternates: { canonical: 'https://www.revela.fun/privacidade' },
};

export default function PrivacidadePage() {
  return <Content />;
}
