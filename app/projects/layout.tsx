import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meus Projetos - Revela',
  description: 'Visualize seus projetos no Revela',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

