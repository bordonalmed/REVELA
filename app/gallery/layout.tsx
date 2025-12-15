import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Galeria - Revela',
  description: 'Visualize sua galeria no Revela',
  robots: {
    index: false,
    follow: false,
  },
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

