import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Debug - Revela',
  description: 'Página de debug do Revela',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DebugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

