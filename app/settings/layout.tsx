import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Configurações - Revela',
  description: 'Configure sua conta no Revela',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

