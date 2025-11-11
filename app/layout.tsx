import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Revela - Visualização de Fotos Antes e Depois",
  description: "Plataforma profissional para visualização de fotos de antes e depois",
  applicationName: "Revela",
  manifest: "/manifest.json",
  themeColor: "#1A2B32",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
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
