import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Novo Projeto - Revela',
  description: 'Crie um novo projeto no Revela',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NewProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

