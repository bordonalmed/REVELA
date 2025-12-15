import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Criar Conta - Revela',
  description: 'Crie sua conta no Revela',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

