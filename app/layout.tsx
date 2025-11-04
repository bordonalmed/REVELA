import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Revela - Visualização de Fotos Antes e Depois",
  description: "Plataforma profissional para visualização de fotos de antes e depois",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
