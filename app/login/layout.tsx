import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Revela',
  description: 'Faça login na sua conta Revela',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

