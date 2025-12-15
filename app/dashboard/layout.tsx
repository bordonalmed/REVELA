import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - Revela',
  description: 'Painel principal do Revela',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

